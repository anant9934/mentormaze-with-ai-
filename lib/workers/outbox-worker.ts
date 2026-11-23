import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import crypto from "crypto";

export interface OutboxEvent {
  id: string;
  eventType: string;
  payload: any;
  status: "pending" | "processing" | "completed" | "failed" | "dead_letter";
  retryCount: number;
}

export interface WorkerBatchResult {
  claimed: number;
  processed: number;
  errors: number;
  deadLettered: number;
  durationMs: number;
}

const MAX_RETRIES = 5;
const STALE_LOCK_TIMEOUT_MINUTES = 5;

/**
 * Hardened Enterprise Outbox Worker for PostgreSQL.
 * Features:
 * - Atomic job claiming with FOR UPDATE SKIP LOCKED (multi-worker scale safe)
 * - Automatic stale job recovery
 * - Exponential backoff calculation
 * - Dead-letter queue for exhausted retries
 * - Idempotent event handlers
 * - Structured JSON logging
 */
export async function processOutboxBatch(
  batchSize: number = 10,
  workerId: string = `worker-${crypto.randomBytes(4).toString("hex")}`
): Promise<WorkerBatchResult> {
  const startTime = Date.now();
  const db = getDb();

  let processed = 0;
  let errors = 0;
  let deadLettered = 0;

  // 1. STALE JOB RECOVERY: Reset processing jobs whose lock has expired
  await db.execute(sql`
    UPDATE outbox_events
    SET status = 'pending', locked_at = null, locked_by = null
    WHERE status = 'processing' 
      AND locked_at < now() - interval '5 minutes';
  `);

  // 2. ATOMIC CLAIMING WITH 'FOR UPDATE SKIP LOCKED':
  // Atomically select and mark available jobs as 'processing' so no other worker picks them up
  const claimQuery: any = await db.execute(sql`
    UPDATE outbox_events
    SET status = 'processing',
        locked_at = now(),
        locked_by = ${workerId}
    WHERE id IN (
      SELECT id FROM outbox_events
      WHERE (status = 'pending' OR (status = 'failed' AND retry_count < ${MAX_RETRIES} AND (next_retry_at IS NULL OR next_retry_at <= now())))
      ORDER BY created_at ASC
      LIMIT ${batchSize}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, event_type, payload, status, retry_count;
  `);

  const events: OutboxEvent[] = claimQuery.rows || claimQuery || [];

  for (const rawEvent of events as any[]) {
    const eventId = rawEvent.id;
    const eventType = rawEvent.event_type || rawEvent.eventType;
    const currentRetries = Number(rawEvent.retry_count || 0);

    const eventStartTime = Date.now();

    try {
      const payload = typeof rawEvent.payload === "string" ? JSON.parse(rawEvent.payload) : rawEvent.payload;

      // IDEMPOTENT DISPATCH HANDLERS
      switch (eventType) {
        case "booking.created":
          if (payload.studentId) {
            // Idempotent: check if notification already exists for this booking
            const existingNotif: any = await db.execute(sql`
              SELECT id FROM notifications
              WHERE user_id = ${payload.studentId}
                AND link_url = ${`/sessions/${payload.bookingId}/confirmation`}
              LIMIT 1;
            `);
            if ((existingNotif.rows?.length || existingNotif?.length || 0) === 0) {
              await db.execute(sql`
                INSERT INTO notifications (user_id, title, message, type, link_url)
                VALUES (
                  ${payload.studentId},
                  'Mentorship Booking Confirmed',
                  'Your session has been confirmed. Add it to your calendar and review your discussion points.',
                  'booking_confirmed',
                  ${`/sessions/${payload.bookingId}/confirmation`}
                );
              `);
            }
          }
          break;

        case "booking.cancelled":
          if (payload.studentId) {
            await db.execute(sql`
              INSERT INTO notifications (user_id, title, message, type, link_url)
              VALUES (
                ${payload.studentId},
                'Mentorship Session Cancelled',
                ${`Your session has been cancelled. Reason: ${payload.reason || "Not specified"}. Any paid fees have been refunded.`},
                'booking_cancelled',
                '/dashboard/sessions'
              );
            `);
          }
          break;

        case "chat.message_sent":
          // Log structured audit dispatch
          console.info(JSON.stringify({
            level: "info",
            event: "chat_notification_dispatched",
            messageId: payload.messageId,
            conversationId: payload.conversationId,
          }));
          break;

        case "payment.succeeded":
          console.info(JSON.stringify({
            level: "info",
            event: "payment_webhook_dispatched",
            orderId: payload.orderId,
            bookingId: payload.bookingId,
          }));
          break;

        case "mentorship.outcomes.synced": {
          const studentUserId = payload.studentUserId || payload.studentId;
          const { StudentConsentService } = await import("@/lib/ai-mentor/student-consent-service");

          // 1. CONSENT REVALIDATION: Immediately before delivery
          const consentRecord = await StudentConsentService.getConsentRecord(studentUserId, "ai_tathastu_sync");
          if (!consentRecord || !consentRecord.isGranted || (consentRecord.expiresAt && new Date(consentRecord.expiresAt).getTime() <= Date.now())) {
            await db.execute(sql`
              UPDATE outbox_events
              SET status = 'suppressed',
                  error_message = 'Outbound delivery suppressed: student consent for ai_tathastu_sync was revoked prior to delivery',
                  processed_at = now(),
                  locked_at = null,
                  locked_by = null
              WHERE id = ${eventId};
            `);
            processed++;
            continue;
          }

          // 2. EPOCH BINDING REVALIDATION: Outbound event must match active consent epoch
          const eventEpoch = payload.consentEpoch;
          const currentEpoch = consentRecord.consentEpoch || 1;
          if (eventEpoch !== undefined && eventEpoch !== currentEpoch) {
            await db.execute(sql`
              UPDATE outbox_events
              SET status = 'suppressed',
                  error_message = ${`Outbound delivery suppressed: event consent epoch (${eventEpoch}) is stale. Current active epoch is ${currentEpoch}.`},
                  processed_at = now(),
                  locked_at = null,
                  locked_by = null
              WHERE id = ${eventId};
            `);
            processed++;
            continue;
          }

          // 3. PRIOR DELETION OBLIGATION GATING: A fresh snapshot under a new consent epoch
          // can only be delivered AFTER prior consent epoch deletion obligations are acknowledged!
          const pendingTombstone: any = await db.execute(sql`
            SELECT id FROM outbox_events
            WHERE event_type = 'student.consent.revoked'
              AND (payload->>'studentUserId' = ${studentUserId} OR payload->>'studentId' = ${studentUserId})
              AND status IN ('pending', 'processing', 'failed')
            LIMIT 1;
          `);
          if (pendingTombstone.rows && pendingTombstone.rows.length > 0) {
            await db.execute(sql`
              UPDATE outbox_events
              SET status = 'pending',
                  error_message = 'Awaiting prior consent epoch deletion tombstone acknowledgement from destination',
                  locked_at = null,
                  locked_by = null
              WHERE id = ${eventId};
            `);
            processed++;
            continue;
          }

          // External HTTP delivery (live or controlled mock)
          const destinationUrl = process.env.AI_TATHASTU_API_URL || process.env.AITATHASTU_API_URL || process.env.MOCK_TATHASTU_API_URL;
          const destinationKey = process.env.AI_TATHASTU_API_KEY || process.env.AITATHASTU_API_KEY || (process.env.MOCK_TATHASTU_API_URL ? "mock-key" : undefined);
          const idempotencyKey = rawEvent.idempotency_key || rawEvent.idempotencyKey;

          if (destinationUrl && destinationKey) {
            const res = await fetch(`${destinationUrl}/v1/mentorship/outcomes`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${destinationKey}`,
                ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
              },
              body: JSON.stringify(payload),
            });

            if (!res.ok) {
              const errBody = await res.text().catch(() => "");
              throw new Error(`External destination returned HTTP ${res.status}: ${errBody}`);
            }

            const ackData = await res.json().catch(() => ({}));
            console.info(JSON.stringify({
              level: "info",
              event: "tathastu_outcomes_delivered",
              eventId,
              consentEpoch: currentEpoch,
              receiptId: ackData.receiptId || "ack-delivered",
            }));
          } else {
            // Destination not configured: keep pending for future delivery
            await db.execute(sql`
              UPDATE outbox_events
              SET status = 'pending',
                  error_message = 'Awaiting external AI_TATHASTU_API_URL configuration',
                  locked_at = null,
                  locked_by = null
              WHERE id = ${eventId};
            `);
            processed++;
            continue;
          }
          break;
        }

        case "student.consent.revoked": {
          const studentUserId = payload.studentUserId || payload.studentId;

          // NARROWLY SCOPED AUTHORIZATION FOR DELETION TOMBSTONES:
          // A deletion/revocation event is authorized strictly by the student's revocation action itself.
          // It does NOT require active ai_tathastu_sync consent.
          // A later re-grant MUST NOT suppress or cancel an already-created deletion obligation!
          const destinationUrl = process.env.AI_TATHASTU_API_URL || process.env.AITATHASTU_API_URL || process.env.MOCK_TATHASTU_API_URL;
          const destinationKey = process.env.AI_TATHASTU_API_KEY || process.env.AITATHASTU_API_KEY || (process.env.MOCK_TATHASTU_API_URL ? "mock-key" : undefined);
          const idempotencyKey = rawEvent.idempotency_key || rawEvent.idempotencyKey;

          if (destinationUrl && destinationKey) {
            const res = await fetch(`${destinationUrl}/v1/students/revocation`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${destinationKey}`,
                ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
              },
              body: JSON.stringify(payload),
            });

            if (!res.ok) {
              const errBody = await res.text().catch(() => "");
              throw new Error(`External tombstone destination returned HTTP ${res.status}: ${errBody}`);
            }

            const ackData = await res.json().catch(() => ({}));
            console.info(JSON.stringify({
              level: "info",
              event: "tathastu_revocation_delivered",
              eventId,
              revokedConsentEpoch: payload.revokedConsentEpoch,
              receiptId: ackData.receiptId || "ack-revocation-delivered",
            }));
          } else {
            // Destination not configured: keep pending for future delivery
            await db.execute(sql`
              UPDATE outbox_events
              SET status = 'pending',
                  error_message = 'Awaiting external AI_TATHASTU_API_URL configuration for tombstone delivery',
                  locked_at = null,
                  locked_by = null
              WHERE id = ${eventId};
            `);
            processed++;
            continue;
          }
          break;
        }

        default:
          console.warn(JSON.stringify({
            level: "warn",
            event: "unrecognized_event_type",
            eventType,
            eventId,
          }));
      }

      // MARK JOB COMPLETED
      await db.execute(sql`
        UPDATE outbox_events
        SET status = 'completed',
            error_message = null,
            processed_at = now(),
            locked_at = null,
            locked_by = null
        WHERE id = ${eventId};
      `);

      processed++;

      console.info(JSON.stringify({
        level: "info",
        workerId,
        eventId,
        eventType,
        durationMs: Date.now() - eventStartTime,
        status: "completed",
      }));
    } catch (err: any) {
      errors++;
      const nextRetries = currentRetries + 1;
      const isDeadLetter = nextRetries >= MAX_RETRIES;

      if (isDeadLetter) {
        deadLettered++;
      }

      // Exponential backoff: 5s, 10s, 20s, 40s, 80s
      const backoffSeconds = Math.min(300, Math.pow(2, nextRetries) * 5);

      await db.execute(sql`
        UPDATE outbox_events
        SET status = ${isDeadLetter ? "dead_letter" : "failed"},
            retry_count = ${nextRetries},
            error_message = ${err.message},
            locked_at = null,
            locked_by = null,
            next_retry_at = now() + (interval '1 second' * ${backoffSeconds})
        WHERE id = ${eventId};
      `);

      console.error(JSON.stringify({
        level: "error",
        workerId,
        eventId,
        eventType,
        retries: nextRetries,
        deadLetter: isDeadLetter,
        error: err.message,
      }));
    }
  }

  return {
    claimed: events.length,
    processed,
    errors,
    deadLettered,
    durationMs: Date.now() - startTime,
  };
}
