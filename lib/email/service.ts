import crypto from "crypto";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import {
  EmailTemplate,
  EmailAutomation,
  EmailDeliveryRecord,
  UserEmailPreferences,
  SupportTicket,
  SupportMessage,
  EmailAuditLog,
  SmtpDiagnosticState,
  EmailCategory,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "./types";
import { TEMPLATE_DEFINITIONS, TEMPLATE_MAP, getTemplateById } from "./templates/registry";
import { verifySmtpConnection, getCachedSmtpStatus, sendEmailDirect } from "./transport";
import { sanitizeHtml } from "./compiler";
import { EMAIL_TOKENS } from "./design-tokens";

// Default Initial Automations
export const DEFAULT_AUTOMATIONS: EmailAutomation[] = [
  { id: "user.registered", name: "Welcome Email", eventType: "user.registered", templateId: "auth.welcome_student", isEnabled: true, recipientType: "student", delaySeconds: 0, maxRetries: 5, quietHoursEnabled: false, executionCount: 0 },
  { id: "user.email_verification_requested", name: "Email Verification", eventType: "user.email_verification_requested", templateId: "auth.email_verification", isEnabled: true, recipientType: "user", delaySeconds: 0, maxRetries: 5, quietHoursEnabled: false, executionCount: 0 },
  { id: "user.password_reset_requested", name: "Password Reset", eventType: "user.password_reset_requested", templateId: "auth.password_reset", isEnabled: true, recipientType: "user", delaySeconds: 0, maxRetries: 5, quietHoursEnabled: false, executionCount: 0 },
  { id: "user.password_changed", name: "Password Changed Alert", eventType: "user.password_changed", templateId: "auth.password_changed", isEnabled: true, recipientType: "user", delaySeconds: 0, maxRetries: 5, quietHoursEnabled: false, executionCount: 0 },
  { id: "user.new_login_detected", name: "New Sign-in Alert", eventType: "user.new_login_detected", templateId: "auth.new_login_alert", isEnabled: true, recipientType: "user", delaySeconds: 0, maxRetries: 5, quietHoursEnabled: false, executionCount: 0 },
  { id: "student.profile_incomplete", name: "Profile Reminder", eventType: "student.profile_incomplete", templateId: "student.profile_reminder", isEnabled: true, recipientType: "student", delaySeconds: 86400, maxRetries: 3, quietHoursEnabled: true, executionCount: 0 },
  { id: "mentor.matches_generated", name: "Mentor Recommendations", eventType: "mentor.matches_generated", templateId: "student.mentor_recommendations", isEnabled: true, recipientType: "student", delaySeconds: 3600, maxRetries: 3, quietHoursEnabled: true, executionCount: 0 },
  { id: "booking.requested", name: "Booking Request Received", eventType: "booking.requested", templateId: "booking.requested_student", isEnabled: true, recipientType: "student", delaySeconds: 0, maxRetries: 5, quietHoursEnabled: false, executionCount: 0 },
  { id: "booking.requested_mentor", name: "New Booking Request for Mentor", eventType: "booking.requested", templateId: "booking.requested_mentor", isEnabled: true, recipientType: "mentor", delaySeconds: 0, maxRetries: 5, quietHoursEnabled: false, executionCount: 0 },
  { id: "booking.confirmed", name: "Booking Confirmed", eventType: "booking.confirmed", templateId: "booking.confirmed_student", isEnabled: true, recipientType: "student", delaySeconds: 0, maxRetries: 5, quietHoursEnabled: false, executionCount: 0 },
  { id: "booking.reminder_24h", name: "24-Hour Session Reminder", eventType: "booking.reminder_due", templateId: "booking.reminder_student", isEnabled: true, recipientType: "student", delaySeconds: 0, maxRetries: 3, quietHoursEnabled: false, executionCount: 0 },
  { id: "booking.reminder_mentor", name: "Mentor Upcoming Session Reminder", eventType: "booking.reminder_due", templateId: "booking.reminder_mentor", isEnabled: true, recipientType: "mentor", delaySeconds: 0, maxRetries: 3, quietHoursEnabled: false, executionCount: 0 },
  { id: "booking.rescheduled", name: "Session Rescheduled", eventType: "booking.rescheduled", templateId: "booking.rescheduled_student", isEnabled: true, recipientType: "student", delaySeconds: 0, maxRetries: 5, quietHoursEnabled: false, executionCount: 0 },
  { id: "booking.cancelled", name: "Session Cancelled", eventType: "booking.cancelled", templateId: "booking.cancelled_student", isEnabled: true, recipientType: "student", delaySeconds: 0, maxRetries: 5, quietHoursEnabled: false, executionCount: 0 },
  { id: "booking.completed", name: "Session Completed Feedback", eventType: "booking.completed", templateId: "booking.completed_student", isEnabled: true, recipientType: "student", delaySeconds: 900, maxRetries: 3, quietHoursEnabled: true, executionCount: 0 },
  { id: "mock_interview.completed", name: "Mock Interview Completed", eventType: "mock_interview.completed", templateId: "mock_interview.completed", isEnabled: true, recipientType: "student", delaySeconds: 0, maxRetries: 5, quietHoursEnabled: false, executionCount: 0 },
  { id: "mentor.application_submitted", name: "Mentor Application Received", eventType: "mentor.application_submitted", templateId: "mentor.application_received", isEnabled: true, recipientType: "mentor", delaySeconds: 0, maxRetries: 5, quietHoursEnabled: false, executionCount: 0 },
  { id: "mentor.application_approved", name: "Mentor Application Approved", eventType: "mentor.application_approved", templateId: "mentor.application_approved", isEnabled: true, recipientType: "mentor", delaySeconds: 0, maxRetries: 5, quietHoursEnabled: false, executionCount: 0 },
  { id: "payment.succeeded", name: "Payment Successful Receipt", eventType: "payment.succeeded", templateId: "payment.successful", isEnabled: true, recipientType: "student", delaySeconds: 0, maxRetries: 5, quietHoursEnabled: false, executionCount: 0 },
  { id: "payment.failed", name: "Payment Failed Alert", eventType: "payment.failed", templateId: "payment.failed", isEnabled: true, recipientType: "student", delaySeconds: 0, maxRetries: 5, quietHoursEnabled: false, executionCount: 0 },
  { id: "payment.refund_completed", name: "Refund Completed", eventType: "payment.refund_completed", templateId: "payment.refund_completed", isEnabled: true, recipientType: "student", delaySeconds: 0, maxRetries: 5, quietHoursEnabled: false, executionCount: 0 },
  { id: "support.ticket_created", name: "Support Ticket Confirmation", eventType: "support.ticket_created", templateId: "support.ticket_created", isEnabled: true, recipientType: "user", delaySeconds: 0, maxRetries: 5, quietHoursEnabled: false, executionCount: 0 },
  { id: "support.ticket_replied", name: "Support Agent Reply", eventType: "support.ticket_replied", templateId: "support.ticket_reply", isEnabled: true, recipientType: "user", delaySeconds: 0, maxRetries: 5, quietHoursEnabled: false, executionCount: 0 },
  { id: "support.ticket_resolved", name: "Support Ticket Resolved", eventType: "support.ticket_resolved", templateId: "support.ticket_resolved", isEnabled: true, recipientType: "user", delaySeconds: 0, maxRetries: 5, quietHoursEnabled: false, executionCount: 0 },
];

/**
 * In-Memory Durable Layer for High-Performance Admin Dashboards and Local Testing
 */
class EmailManagementService {
  private templates: Map<string, EmailTemplate> = new Map();
  private automations: Map<string, EmailAutomation> = new Map();
  private deliveryLogs: EmailDeliveryRecord[] = [];
  private preferences: Map<string, UserEmailPreferences> = new Map();
  private suppressions: Set<string> = new Set();
  private supportTickets: Map<string, SupportTicket> = new Map();
  private supportMessages: SupportMessage[] = [];
  private auditLogs: EmailAuditLog[] = [];

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    // Seed templates
    TEMPLATE_DEFINITIONS.forEach((t) => {
      this.templates.set(t.id, {
        id: t.id,
        name: t.name,
        category: t.category,
        subject: t.subject,
        previewText: t.previewText,
        variables: t.variables,
        isSystemCritical: t.isSystemCritical,
        isActive: t.isActive,
        htmlBody: t.htmlBody,
        textBody: t.textBody,
      });
    });

    // Seed automations
    DEFAULT_AUTOMATIONS.forEach((a) => {
      this.automations.set(a.id, { ...a });
    });

    // Seed sample support ticket
    const sampleTicket: SupportTicket = {
      id: "ticket-1042",
      ticketNumber: "MM-2026-1042",
      userEmail: "anant@example.com",
      userName: "Anant Kumar",
      category: "technical_problem",
      priority: "high",
      status: "in_progress",
      subject: "Assistance joining LiveKit video room",
      description: "My camera feed was not detected on Chrome during the test room check.",
      assignedToUserId: "admin-1",
      assignedToName: "MentorMaze Support",
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    };
    this.supportTickets.set(sampleTicket.id, sampleTicket);

    this.supportMessages.push(
      {
        id: "msg-1042-1",
        ticketId: sampleTicket.id,
        senderName: "Anant Kumar",
        senderRole: "user",
        message: "My camera feed was not detected on Chrome during the test room check.",
        isInternalNote: false,
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: "msg-1042-2",
        ticketId: sampleTicket.id,
        senderName: "Admin Specialist",
        senderRole: "admin",
        message: "Reviewed browser logs. User had denied camera permissions on localhost.",
        isInternalNote: true, // internal note
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: "msg-1042-3",
        ticketId: sampleTicket.id,
        senderName: "MentorMaze Support",
        senderRole: "support_agent",
        message: "Hello Anant, please click the lock icon in your address bar and reset Camera permissions to 'Allow', then refresh.",
        isInternalNote: false,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      }
    );
  }

  // ==========================================
  // TEMPLATES
  // ==========================================

  public async getTemplates(category?: EmailCategory): Promise<EmailTemplate[]> {
    const all = Array.from(this.templates.values());
    if (category) {
      return all.filter((t) => t.category === category);
    }
    return all;
  }

  public async getTemplate(id: string): Promise<EmailTemplate | undefined> {
    return this.templates.get(id);
  }

  public async updateTemplate(
    id: string,
    updates: Partial<Pick<EmailTemplate, "subject" | "previewText" | "htmlBody" | "isActive">>,
    actor?: { id: string; email: string }
  ): Promise<EmailTemplate> {
    const existing = this.templates.get(id);
    if (!existing) {
      throw new Error(`Email template ${id} not found.`);
    }

    if (existing.isSystemCritical && updates.isActive === false) {
      throw new Error(`System-critical security template '${id}' cannot be disabled.`);
    }

    const sanitizedHtml = updates.htmlBody !== undefined ? sanitizeHtml(updates.htmlBody) : existing.htmlBody;

    const updated: EmailTemplate = {
      ...existing,
      subject: updates.subject !== undefined ? updates.subject : existing.subject,
      previewText: updates.previewText !== undefined ? updates.previewText : existing.previewText,
      htmlBody: sanitizedHtml,
      isActive: updates.isActive !== undefined ? updates.isActive : existing.isActive,
    };

    this.templates.set(id, updated);

    // Audit log
    this.recordAudit({
      actorUserId: actor?.id,
      actorEmail: actor?.email,
      action: "template.update",
      targetId: id,
      details: updates,
    });

    return updated;
  }

  public async resetTemplate(id: string, actor?: { id: string; email: string }): Promise<EmailTemplate> {
    const original = TEMPLATE_MAP.get(id);
    if (!original) {
      throw new Error(`Template ${id} does not exist in master registry.`);
    }

    const reset: EmailTemplate = {
      id: original.id,
      name: original.name,
      category: original.category,
      subject: original.subject,
      previewText: original.previewText,
      variables: original.variables,
      isSystemCritical: original.isSystemCritical,
      isActive: original.isActive,
      htmlBody: "",
      textBody: "",
    };

    this.templates.set(id, reset);

    this.recordAudit({
      actorUserId: actor?.id,
      actorEmail: actor?.email,
      action: "template.reset",
      targetId: id,
    });

    return reset;
  }

  // ==========================================
  // AUTOMATIONS
  // ==========================================

  public async getAutomations(): Promise<EmailAutomation[]> {
    return Array.from(this.automations.values());
  }

  public async toggleAutomation(
    id: string,
    isEnabled: boolean,
    actor?: { id: string; email: string }
  ): Promise<EmailAutomation> {
    const auto = this.automations.get(id);
    if (!auto) {
      throw new Error(`Automation '${id}' not found.`);
    }

    const template = this.templates.get(auto.templateId);
    if (template?.isSystemCritical && !isEnabled) {
      throw new Error(`Automations backing system-critical security notifications cannot be disabled.`);
    }

    auto.isEnabled = isEnabled;
    this.automations.set(id, auto);

    this.recordAudit({
      actorUserId: actor?.id,
      actorEmail: actor?.email,
      action: isEnabled ? "automation.enable" : "automation.disable",
      targetId: id,
    });

    return auto;
  }

  public async updateAutomation(
    id: string,
    updates: Partial<Pick<EmailAutomation, "delaySeconds" | "quietHoursEnabled" | "maxRetries">>,
    actor?: { id: string; email: string }
  ): Promise<EmailAutomation> {
    const auto = this.automations.get(id);
    if (!auto) {
      throw new Error(`Automation '${id}' not found.`);
    }

    Object.assign(auto, updates);
    this.automations.set(id, auto);

    this.recordAudit({
      actorUserId: actor?.id,
      actorEmail: actor?.email,
      action: "automation.update",
      targetId: id,
      details: updates,
    });

    return auto;
  }

  // ==========================================
  // DELIVERY LOGS & QUEUE
  // ==========================================

  public async recordDelivery(record: Omit<EmailDeliveryRecord, "id" | "queuedAt">): Promise<EmailDeliveryRecord> {
    const id = `dl-${crypto.randomBytes(6).toString("hex")}`;
    const fullRecord: EmailDeliveryRecord = {
      id,
      queuedAt: new Date().toISOString(),
      ...record,
    };

    // Prepend to in-memory delivery logs
    this.deliveryLogs.unshift(fullRecord);

    // Keep memory capped at 500 recent items
    if (this.deliveryLogs.length > 500) {
      this.deliveryLogs.pop();
    }

    return fullRecord;
  }

  public async updateDeliveryRecord(id: string, updates: Partial<EmailDeliveryRecord>): Promise<void> {
    const record = this.deliveryLogs.find((l) => l.id === id);
    if (record) {
      Object.assign(record, updates);
    }
  }

  public async getDeliveryStats(): Promise<{
    totalQueued: number;
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    last24Hours: number;
    last7Days: number;
  }> {
    const now = Date.now();
    const oneDayAgo = now - 24 * 3600 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 3600 * 1000;

    let totalQueued = 0;
    let totalSent = 0;
    let totalDelivered = 0;
    let totalFailed = 0;
    let last24Hours = 0;
    let last7Days = 0;

    this.deliveryLogs.forEach((log) => {
      if (log.status === "queued") totalQueued++;
      if (log.status === "sent") totalSent++;
      if (log.status === "delivered") totalDelivered++;
      if (log.status === "failed" || log.status === "bounced") totalFailed++;

      const logTime = new Date(log.queuedAt).getTime();
      if (logTime >= oneDayAgo) last24Hours++;
      if (logTime >= sevenDaysAgo) last7Days++;
    });

    return {
      totalQueued,
      totalSent,
      totalDelivered,
      totalFailed,
      last24Hours,
      last7Days,
    };
  }

  public async getDeliveryLogs(filters?: {
    status?: string;
    category?: string;
    templateId?: string;
    recipient?: string;
    limit?: number;
  }): Promise<EmailDeliveryRecord[]> {
    let result = [...this.deliveryLogs];

    if (filters?.status && filters.status !== "all") {
      result = result.filter((l) => l.status === filters.status);
    }
    if (filters?.category && filters.category !== "all") {
      result = result.filter((l) => l.category === filters.category);
    }
    if (filters?.templateId) {
      result = result.filter((l) => l.templateId === filters.templateId);
    }
    if (filters?.recipient) {
      const q = filters.recipient.toLowerCase();
      result = result.filter((l) => l.recipientEmail.toLowerCase().includes(q));
    }

    const limit = filters?.limit || 100;
    return result.slice(0, limit);
  }

  public async getFailedEmails(): Promise<EmailDeliveryRecord[]> {
    return this.deliveryLogs.filter((l) => l.status === "failed" || l.status === "bounced");
  }

  public async retryFailedEmail(id: string, actor?: { id: string; email: string }): Promise<boolean> {
    const record = this.deliveryLogs.find((l) => l.id === id);
    if (!record) return false;

    record.status = "queued";
    record.attemptCount = 0;
    record.lastAttemptedAt = new Date().toISOString();

    this.recordAudit({
      actorUserId: actor?.id,
      actorEmail: actor?.email,
      action: "email.retry",
      targetId: id,
    });

    return true;
  }

  public async cancelQueuedEmail(id: string, actor?: { id: string; email: string }): Promise<boolean> {
    const record = this.deliveryLogs.find((l) => l.id === id);
    if (!record) return false;

    record.status = "cancelled";

    this.recordAudit({
      actorUserId: actor?.id,
      actorEmail: actor?.email,
      action: "email.cancel",
      targetId: id,
    });

    return true;
  }

  // ==========================================
  // PREFERENCES & SUPPRESSIONS
  // ==========================================

  public async getUserPreferences(email: string, userId?: string): Promise<UserEmailPreferences> {
    const normalized = email.toLowerCase().trim();
    const existing = this.preferences.get(normalized);
    if (existing) {
      return existing;
    }

    const token = crypto.createHash("sha256").update(`${normalized}-${Date.now()}`).digest("hex").slice(0, 32);

    const initial: UserEmailPreferences = {
      userId,
      email: normalized,
      marketingConsent: false, // Explicit opt-in
      recommendationsConsent: true,
      newsletterConsent: false,
      bookingRemindersConsent: true,
      unsubscribeToken: token,
      updatedAt: new Date().toISOString(),
    };

    this.preferences.set(normalized, initial);
    return initial;
  }

  public async updateUserPreferences(email: string, prefs: Partial<UserEmailPreferences>): Promise<UserEmailPreferences> {
    const current = await this.getUserPreferences(email);
    const updated = {
      ...current,
      ...prefs,
      updatedAt: new Date().toISOString(),
    };
    this.preferences.set(email.toLowerCase().trim(), updated);
    return updated;
  }

  public async unsubscribeByToken(token: string): Promise<boolean> {
    for (const [email, pref] of this.preferences.entries()) {
      if (pref.unsubscribeToken === token) {
        pref.marketingConsent = false;
        pref.newsletterConsent = false;
        pref.recommendationsConsent = false;
        pref.updatedAt = new Date().toISOString();
        this.preferences.set(email, pref);
        return true;
      }
    }
    return false;
  }

  public isSuppressed(email: string): boolean {
    return this.suppressions.has(email.toLowerCase().trim());
  }

  public addSuppression(email: string, reason: string): void {
    this.suppressions.add(email.toLowerCase().trim());
  }

  // ==========================================
  // SUPPORT TICKETS
  // ==========================================

  public async getSupportTickets(filters?: { status?: TicketStatus; priority?: TicketPriority }): Promise<SupportTicket[]> {
    let tickets = Array.from(this.supportTickets.values());
    if (filters?.status) {
      tickets = tickets.filter((t) => t.status === filters.status);
    }
    if (filters?.priority) {
      tickets = tickets.filter((t) => t.priority === filters.priority);
    }
    return tickets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public async getSupportTicket(id: string): Promise<{ ticket: SupportTicket; messages: SupportMessage[] } | null> {
    const ticket = this.supportTickets.get(id);
    if (!ticket) return null;

    const messages = this.supportMessages
      .filter((m) => m.ticketId === id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return { ticket, messages };
  }

  public async createSupportTicket(data: {
    userId?: string;
    userEmail: string;
    userName: string;
    category: TicketCategory;
    priority?: TicketPriority;
    subject: string;
    description: string;
    bookingId?: string;
    paymentReference?: string;
  }): Promise<SupportTicket> {
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `MM-${new Date().getFullYear()}-${randomSeq}`;
    const id = `tkt-${crypto.randomBytes(6).toString("hex")}`;

    const newTicket: SupportTicket = {
      id,
      ticketNumber,
      userId: data.userId,
      userEmail: data.userEmail,
      userName: data.userName,
      category: data.category,
      priority: data.priority || "medium",
      status: "open",
      subject: data.subject,
      description: data.description,
      bookingId: data.bookingId,
      paymentReference: data.paymentReference,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.supportTickets.set(id, newTicket);

    // Initial message
    this.supportMessages.push({
      id: `msg-${crypto.randomBytes(6).toString("hex")}`,
      ticketId: id,
      senderUserId: data.userId,
      senderName: data.userName,
      senderRole: "user",
      message: data.description,
      isInternalNote: false,
      createdAt: new Date().toISOString(),
    });

    return newTicket;
  }

  public async replySupportTicket(
    ticketId: string,
    message: string,
    sender: { userId?: string; name: string; role: "user" | "support_agent" | "admin" },
    isInternalNote: boolean = false
  ): Promise<SupportMessage> {
    const ticket = this.supportTickets.get(ticketId);
    if (!ticket) {
      throw new Error(`Ticket '${ticketId}' not found.`);
    }

    const newMessage: SupportMessage = {
      id: `msg-${crypto.randomBytes(6).toString("hex")}`,
      ticketId,
      senderUserId: sender.userId,
      senderName: sender.name,
      senderRole: sender.role,
      message,
      isInternalNote,
      createdAt: new Date().toISOString(),
    };

    this.supportMessages.push(newMessage);

    // Update ticket status
    if (!isInternalNote) {
      if (sender.role === "user") {
        ticket.status = "open";
      } else {
        ticket.status = "waiting_on_user";
      }
    }
    ticket.updatedAt = new Date().toISOString();
    this.supportTickets.set(ticketId, ticket);

    return newMessage;
  }

  public async updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
    priority?: TicketPriority,
    assignedTo?: { id: string; name: string }
  ): Promise<SupportTicket> {
    const ticket = this.supportTickets.get(ticketId);
    if (!ticket) {
      throw new Error(`Ticket '${ticketId}' not found.`);
    }

    ticket.status = status;
    if (priority) ticket.priority = priority;
    if (assignedTo) {
      ticket.assignedToUserId = assignedTo.id;
      ticket.assignedToName = assignedTo.name;
    }
    if (status === "resolved" || status === "closed") {
      ticket.resolvedAt = new Date().toISOString();
    }
    ticket.updatedAt = new Date().toISOString();
    this.supportTickets.set(ticketId, ticket);

    return ticket;
  }

  // ==========================================
  // AUDIT LOGGING
  // ==========================================

  private recordAudit(log: Omit<EmailAuditLog, "id" | "createdAt">) {
    this.auditLogs.unshift({
      id: `audit-${crypto.randomBytes(6).toString("hex")}`,
      createdAt: new Date().toISOString(),
      ...log,
    });
    if (this.auditLogs.length > 200) {
      this.auditLogs.pop();
    }
  }

  public async getAuditLogs(): Promise<EmailAuditLog[]> {
    return this.auditLogs;
  }
}

export const emailService = new EmailManagementService();
