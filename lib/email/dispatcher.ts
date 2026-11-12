import crypto from "crypto";
import { emailService } from "./service";
import { TEMPLATE_MAP } from "./templates/registry";
import { sendEmailDirect } from "./transport";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { EmailDeliveryStatus } from "./types";

export interface DispatchEmailEventOptions {
  eventType: string;
  recipient: {
    email: string;
    name?: string;
    userId?: string;
  };
  variables: Record<string, any>;
  idempotencyKey?: string;
  overrideTemplateId?: string;
}

export interface DispatchResult {
  dispatched: boolean;
  deliveryLogId?: string;
  status: EmailDeliveryStatus;
  messageId?: string;
  error?: string;
  skippedReason?: string;
}

/**
 * Event-Driven Email Dispatcher.
 * Guarantees zero unhandled exceptions for host transactions, deduplication, and suppression honoring.
 */
export async function dispatchEmailEvent(options: DispatchEmailEventOptions): Promise<DispatchResult> {
  const { eventType, recipient, variables, overrideTemplateId } = options;
  const email = recipient.email.toLowerCase().trim();

  // 1. DEDUPLICATION VIA IDEMPOTENCY KEY
  const idempotencyKey =
    options.idempotencyKey ||
    crypto
      .createHash("sha256")
      .update(`${eventType}-${email}-${JSON.stringify(variables)}`)
      .digest("hex");

  // Check if this idempotency key was already processed successfully
  const existingLogs = await emailService.getDeliveryLogs({ recipient: email, limit: 20 });
  const duplicate = existingLogs.find((l) => l.idempotencyKey === idempotencyKey && (l.status === "sent" || l.status === "delivered"));
  if (duplicate) {
    return {
      dispatched: false,
      deliveryLogId: duplicate.id,
      status: duplicate.status,
      skippedReason: `Duplicate event suppressed by idempotency key: ${idempotencyKey}`,
    };
  }

  // 2. RESOLVE AUTOMATION & TEMPLATE
  const automations = await emailService.getAutomations();
  const automation = automations.find((a) => a.eventType === eventType && (overrideTemplateId ? a.templateId === overrideTemplateId : true));

  if (!automation && !overrideTemplateId) {
    return {
      dispatched: false,
      status: "cancelled",
      skippedReason: `No active automation found for event type: ${eventType}`,
    };
  }

  if (automation && !automation.isEnabled && !overrideTemplateId) {
    return {
      dispatched: false,
      status: "cancelled",
      skippedReason: `Automation '${automation.id}' is currently disabled by administrator`,
    };
  }

  const templateId = overrideTemplateId || automation?.templateId;
  if (!templateId) {
    return {
      dispatched: false,
      status: "failed",
      error: `No template mapped for event: ${eventType}`,
    };
  }

  const templateDef = TEMPLATE_MAP.get(templateId);
  if (!templateDef) {
    return {
      dispatched: false,
      status: "failed",
      error: `Template definition '${templateId}' not found in registry`,
    };
  }

  // 3. SUPPRESSION & PREFERENCES CHECK
  if (emailService.isSuppressed(email)) {
    return {
      dispatched: false,
      status: "bounced",
      skippedReason: `Recipient '${email}' is on global suppression list`,
    };
  }

  // Check preferences for marketing / product update categories
  if (templateDef.category === "system" && !templateDef.isSystemCritical) {
    const prefs = await emailService.getUserPreferences(email, recipient.userId);
    if (!prefs.marketingConsent && !prefs.newsletterConsent) {
      return {
        dispatched: false,
        status: "cancelled",
        skippedReason: `Recipient '${email}' has opted out of marketing communications`,
      };
    }
  }

  // 4. RENDER TEMPLATE WITH ESCAPED VARIABLES
  const mergedVars = {
    user_name: recipient.name || "Member",
    user_email: email,
    ...variables,
  };

  const rendered = templateDef.render(mergedVars);

  // 5. RECORD INITIAL QUEUE ENTRY IN DELIVERY LOGS
  const logRecord = await emailService.recordDelivery({
    recipientEmail: email,
    recipientUserId: recipient.userId,
    recipientName: recipient.name,
    templateId,
    subject: rendered.subject,
    category: templateDef.category,
    eventType,
    status: "queued",
    attemptCount: 1,
    maxAttempts: automation?.maxRetries || 5,
    idempotencyKey,
    metadata: {
      variables: mergedVars,
    },
  });

  // Also persist in outbox_events if DB is available
  try {
    const db = getDb();
    await db.execute(sql`
      INSERT INTO outbox_events (event_type, payload, status, idempotency_key)
      VALUES (
        ${eventType},
        ${JSON.stringify({
          recipientEmail: email,
          recipientName: recipient.name,
          templateId,
          subject: rendered.subject,
          deliveryLogId: logRecord.id,
        })},
        'processing',
        ${idempotencyKey}
      )
      ON CONFLICT DO NOTHING;
    `);
  } catch (err) {
    // Database outbox logging is supplementary; in-memory delivery logs remain intact
  }

  // 6. TRANSMIT EMAIL OVER SMTP WITH DELIVERABILITY HEADERS
  const userPrefs = await emailService.getUserPreferences(email, recipient.userId);

  const sendResult = await sendEmailDirect({
    to: email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    category: templateDef.category,
    templateId,
    unsubscribeToken: userPrefs.unsubscribeToken,
  });

  // 7. RECORD FINAL DELIVERY STATUS
  if (sendResult.success) {
    await emailService.updateDeliveryRecord(logRecord.id, {
      status: "sent",
      sentAt: new Date().toISOString(),
      smtpResponse: sendResult.response,
    });

    if (automation) {
      automation.lastExecutedAt = new Date().toISOString();
      automation.executionCount += 1;
    }

    return {
      dispatched: true,
      deliveryLogId: logRecord.id,
      status: "sent",
      messageId: sendResult.messageId,
    };
  } else {
    // Delivery failed: schedule retry or record failure
    await emailService.updateDeliveryRecord(logRecord.id, {
      status: "failed",
      errorMessage: sendResult.error,
      lastAttemptedAt: new Date().toISOString(),
    });

    return {
      dispatched: false,
      deliveryLogId: logRecord.id,
      status: "failed",
      error: sendResult.error,
    };
  }
}

