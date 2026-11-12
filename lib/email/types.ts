export type EmailCategory = "auth" | "student" | "mentor" | "payment" | "support" | "system";

export type EmailDeliveryStatus = "queued" | "sent" | "delivered" | "failed" | "bounced" | "cancelled";

export interface TemplateVariableDefinition {
  key: string;
  description: string;
  sampleValue: string;
  required?: boolean;
}

export interface EmailTemplate {
  id: string; // e.g., 'auth.welcome_student'
  name: string;
  category: EmailCategory;
  subject: string;
  previewText: string;
  variables: TemplateVariableDefinition[];
  isSystemCritical: boolean; // if true, cannot be disabled or stripped of safety checks
  isActive: boolean;
  htmlBody: string; // template content or generator definition
  textBody: string;
}

export interface EmailAutomation {
  id: string; // e.g., 'user.registered'
  name: string;
  eventType: string;
  templateId: string;
  isEnabled: boolean;
  recipientType: "user" | "student" | "mentor" | "admin" | "custom";
  delaySeconds: number;
  maxRetries: number;
  quietHoursEnabled: boolean;
  lastExecutedAt?: string;
  executionCount: number;
}

export interface EmailDeliveryRecord {
  id: string;
  recipientEmail: string;
  recipientUserId?: string;
  recipientName?: string;
  templateId: string;
  subject: string;
  category: EmailCategory;
  eventType?: string;
  status: EmailDeliveryStatus;
  attemptCount: number;
  maxAttempts: number;
  idempotencyKey?: string;
  smtpResponse?: string;
  errorMessage?: string;
  queuedAt: string;
  lastAttemptedAt?: string;
  sentAt?: string;
  metadata?: Record<string, any>;
}

export interface UserEmailPreferences {
  userId?: string;
  email: string;
  marketingConsent: boolean;
  recommendationsConsent: boolean;
  newsletterConsent: boolean;
  bookingRemindersConsent: boolean;
  unsubscribeToken: string;
  updatedAt: string;
}

export type TicketCategory =
  | "account_login"
  | "mentor_booking"
  | "mock_interview"
  | "payment_refund"
  | "mentor_application"
  | "technical_problem"
  | "other";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type TicketStatus = "open" | "in_progress" | "waiting_on_user" | "resolved" | "closed";

export interface SupportTicket {
  id: string;
  ticketNumber: string; // e.g., MM-2026-1042
  userId?: string;
  userEmail: string;
  userName: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description: string;
  bookingId?: string;
  paymentReference?: string;
  assignedToUserId?: string;
  assignedToName?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderUserId?: string;
  senderName: string;
  senderRole: "user" | "support_agent" | "admin" | "system";
  message: string;
  isInternalNote: boolean; // Never transmitted to user
  createdAt: string;
}

export interface EmailAuditLog {
  id: string;
  actorUserId?: string;
  actorEmail?: string;
  action: string;
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export interface SmtpDiagnosticState {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  from: string;
  isConfigured: boolean;
  isConnected: boolean;
  lastCheckedAt: string;
  lastError?: string;
}

