import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  time,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ==========================================
// 1. IDENTITY & AUTHENTICATION
// ==========================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }),
  displayName: varchar("display_name", { length: 160 }).notNull(),
  avatarUrl: text("avatar_url"),
  accountStatus: varchar("account_status", { length: 32 }).default("active").notNull(), // active, suspended, closed
  role: varchar("role", { length: 32 }).default("student").notNull(), // student, mentor, admin, super_admin
  timezone: varchar("timezone", { length: 64 }).default("Asia/Kolkata").notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userIdentities = pgTable("user_identities", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  provider: varchar("provider", { length: 64 }).notNull(), // aitathastu, google, github, email
  providerSubject: varchar("provider_subject", { length: 255 }).notNull(),
  profileData: jsonb("profile_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 2. STUDENT PROFILES & GOALS
// ==========================================

export const studentProfiles = pgTable("student_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).unique().notNull(),
  institution: varchar("institution", { length: 255 }),
  degree: varchar("degree", { length: 255 }),
  fieldOfStudy: varchar("field_of_study", { length: 255 }),
  graduationYear: integer("graduation_year"),
  targetRole: varchar("target_role", { length: 255 }), // e.g. "Software Engineer", "Data Scientist"
  currentLevel: varchar("current_level", { length: 64 }), // e.g. "student", "fresh_grad", "career_switcher"
  bio: text("bio"),
  preferredLanguages: jsonb("preferred_languages").$type<string[]>().default(["English"]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const studentSkills = pgTable("student_skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentProfileId: uuid("student_profile_id").references(() => studentProfiles.id, { onDelete: "cascade" }).notNull(),
  skillName: varchar("skill_name", { length: 120 }).notNull(),
  proficiencyLevel: varchar("proficiency_level", { length: 32 }).default("intermediate"), // beginner, intermediate, advanced
  source: varchar("source", { length: 64 }).default("self_reported"), // self_reported, aitathastu, mentor_assessed
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const studentGoals = pgTable("student_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentProfileId: uuid("student_profile_id").references(() => studentProfiles.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 64 }).default("career").notNull(), // career, skills, interview, project
  status: varchar("status", { length: 32 }).default("in_progress").notNull(), // in_progress, completed, paused
  progressPercentage: integer("progress_percentage").default(0).notNull(),
  targetDate: date("target_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const actionItems = pgTable("action_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentProfileId: uuid("student_profile_id").references(() => studentProfiles.id, { onDelete: "cascade" }).notNull(),
  mentorProfileId: uuid("mentor_profile_id"),
  goalId: uuid("goal_id").references(() => studentGoals.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: date("due_date"),
  status: varchar("status", { length: 32 }).default("pending").notNull(), // pending, completed
  createdByRole: varchar("created_by_role", { length: 32 }).default("student").notNull(), // student, mentor
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// ==========================================
// 3. MENTOR PROFILES & VERIFICATION
// ==========================================

export const mentorProfiles = pgTable("mentor_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).unique().notNull(),
  headline: varchar("headline", { length: 255 }).notNull(), // e.g. "Software Engineer @ Microsoft"
  bio: text("bio").notNull(),
  organization: varchar("organization", { length: 255 }).notNull(),
  currentRole: varchar("current_role", { length: 255 }).notNull(),
  yearsOfExperience: integer("years_of_experience").default(1).notNull(),
  location: varchar("location", { length: 160 }).default("India"),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("5.00").notNull(),
  totalSessions: integer("total_sessions").default(0).notNull(),
  totalMentees: integer("total_mentees").default(0).notNull(),
  verificationStatus: varchar("verification_status", { length: 32 }).default("submitted").notNull(), // draft, submitted, under_review, approved, rejected, suspended
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  languages: jsonb("languages").$type<string[]>().default(["English"]).notNull(),
  sessionModes: jsonb("session_modes").$type<string[]>().default(["1:1"]).notNull(), // 1:1, group
  responseTime: varchar("response_time", { length: 64 }).default("Within 6 hours"),
  isAcceptingBookings: boolean("is_accepting_bookings").default(true).notNull(),
  price15MinInr: integer("price_15min_inr").default(149).notNull(),
  price30MinInr: integer("price_30min_inr").default(249).notNull(),
  price60MinInr: integer("price_60min_inr").default(449).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mentorExpertise = pgTable("mentor_expertise", {
  id: uuid("id").primaryKey().defaultRandom(),
  mentorProfileId: uuid("mentor_profile_id").references(() => mentorProfiles.id, { onDelete: "cascade" }).notNull(),
  primaryDomain: varchar("primary_domain", { length: 120 }).notNull(), // e.g. "Software Engineering", "Data Science", "Product Management"
  skills: jsonb("skills").$type<string[]>().default([]).notNull(),
  focusAreas: jsonb("focus_areas").$type<string[]>().default([]).notNull(), // "Career Guidance", "Interview Prep", "Project Review", "Skill Development"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mentorApplications = pgTable("mentor_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  mentorProfileId: uuid("mentor_profile_id").references(() => mentorProfiles.id, { onDelete: "cascade" }).notNull(),
  status: varchar("status", { length: 32 }).default("submitted").notNull(), // draft, submitted, under_review, info_requested, approved, rejected
  identityProofType: varchar("identity_proof_type", { length: 64 }).default("Aadhaar/PAN/Passport"),
  identityProofUrl: text("identity_proof_url"),
  professionalProofType: varchar("professional_proof_type", { length: 64 }).default("Work Email/Employee ID/LinkedIn"),
  professionalProofUrl: text("professional_proof_url"),
  resumeUrl: text("resume_url"),
  linkedinUrl: text("linkedin_url"),
  rejectionReason: text("rejection_reason"),
  adminNotes: text("admin_notes"),
  reviewedByUserId: uuid("reviewed_by_user_id"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 4. AVAILABILITY & SCHEDULING
// ==========================================

export const availabilityRules = pgTable("availability_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  mentorProfileId: uuid("mentor_profile_id").references(() => mentorProfiles.id, { onDelete: "cascade" }).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  startTime: time("start_time").notNull(), // e.g. "17:00:00"
  endTime: time("end_time").notNull(), // e.g. "21:00:00"
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const availabilityExceptions = pgTable("availability_exceptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  mentorProfileId: uuid("mentor_profile_id").references(() => mentorProfiles.id, { onDelete: "cascade" }).notNull(),
  exceptionDate: date("exception_date").notNull(),
  isBlocked: boolean("is_blocked").default(true).notNull(),
  startTime: time("start_time"),
  endTime: time("end_time"),
  reason: varchar("reason", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mentorAvailabilitySettings = pgTable("mentor_availability_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  mentorProfileId: uuid("mentor_profile_id").references(() => mentorProfiles.id, { onDelete: "cascade" }).unique().notNull(),
  bufferTimeMinutes: integer("buffer_time_minutes").default(15).notNull(),
  minNoticeHours: integer("min_notice_hours").default(2).notNull(),
  maxAdvanceDays: integer("max_advance_days").default(30).notNull(),
  dailySessionLimit: integer("daily_session_limit").default(4).notNull(),
  weeklySessionLimit: integer("weekly_session_limit").default(20).notNull(),
  customSessionDurations: jsonb("custom_session_durations").default([15, 30, 45, 60]).notNull(),
  timezone: varchar("timezone", { length: 64 }).default("Asia/Kolkata").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const bookingHolds = pgTable("booking_holds", {
  id: uuid("id").primaryKey().defaultRandom(),
  mentorProfileId: uuid("mentor_profile_id").references(() => mentorProfiles.id, { onDelete: "cascade" }).notNull(),
  studentUserId: uuid("student_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  serviceType: varchar("service_type", { length: 64 }).notNull(),
  sessionDurationMinutes: integer("session_duration_minutes").notNull(),
  startTimeUtc: timestamp("start_time_utc", { withTimezone: true }).notNull(),
  endTimeUtc: timestamp("end_time_utc", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 32 }).default("active").notNull(), // active, converted, expired, released
  idempotencyKey: varchar("idempotency_key", { length: 255 }).unique().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const calendarConnections = pgTable("calendar_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  mentorProfileId: uuid("mentor_profile_id").references(() => mentorProfiles.id, { onDelete: "cascade" }).notNull(),
  provider: varchar("provider", { length: 64 }).default("google_calendar").notNull(),
  accountEmail: varchar("account_email", { length: 255 }),
  accessTokenEncrypted: text("access_token_encrypted"),
  refreshTokenEncrypted: text("refresh_token_encrypted"),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
  syncToken: text("sync_token"),
  watchChannelId: varchar("watch_channel_id", { length: 255 }),
  watchChannelExpiration: timestamp("watch_channel_expiration", { withTimezone: true }),
  status: varchar("status", { length: 32 }).default("connected").notNull(), // connected, expired, revoked, error
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const externalCalendarEvents = pgTable("external_calendar_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  connectionId: uuid("connection_id").references(() => calendarConnections.id, { onDelete: "cascade" }).notNull(),
  mentorProfileId: uuid("mentor_profile_id").references(() => mentorProfiles.id, { onDelete: "cascade" }).notNull(),
  externalEventId: varchar("external_event_id", { length: 255 }).notNull(),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
  startTimeUtc: timestamp("start_time_utc", { withTimezone: true }).notNull(),
  endTimeUtc: timestamp("end_time_utc", { withTimezone: true }).notNull(),
  isBusy: boolean("is_busy").default(true).notNull(),
  etag: varchar("etag", { length: 255 }),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 5. BOOKINGS & SESSIONS
// ==========================================

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentUserId: uuid("student_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  mentorProfileId: uuid("mentor_profile_id").references(() => mentorProfiles.id, { onDelete: "cascade" }).notNull(),
  serviceType: varchar("service_type", { length: 64 }).notNull(), // 1on1_mentorship, group_mentorship, mock_interview
  sessionDurationMinutes: integer("session_duration_minutes").default(30).notNull(),
  startTimeUtc: timestamp("start_time_utc", { withTimezone: true }).notNull(),
  endTimeUtc: timestamp("end_time_utc", { withTimezone: true }).notNull(),
  userTimezone: varchar("user_timezone", { length: 64 }).default("Asia/Kolkata").notNull(),
  status: varchar("status", { length: 32 }).default("pending").notNull(), // pending, confirmed, completed, cancelled, rescheduled
  priceInr: integer("price_inr").notNull(),
  paymentStatus: varchar("payment_status", { length: 32 }).default("pending").notNull(), // pending, paid, refunded, failed
  studentDiscussionPoints: text("student_discussion_points"),
  resumeAttachmentUrl: text("resume_attachment_url"),
  projectLinks: text("project_links"),
  meetingRoomId: varchar("meeting_room_id", { length: 120 }),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const bookingEvents = pgTable("booking_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "cascade" }).notNull(),
  eventType: varchar("event_type", { length: 64 }).notNull(), // created, confirmed, payment_succeeded, rescheduled, cancelled, joined, completed
  actorId: uuid("actor_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mentorshipSessions = pgTable("mentorship_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "cascade" }).unique().notNull(),
  livekitRoomName: varchar("livekit_room_name", { length: 160 }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  actualDurationSeconds: integer("actual_duration_seconds"),
  sessionPlanChecklist: jsonb("session_plan_checklist").$type<{ item: string; completed: boolean }[]>(),
  mentorPrivateNotes: text("mentor_private_notes"),
  studentVisibleSummary: text("student_visible_summary"),
  resourcesShared: jsonb("resources_shared").$type<{ title: string; url: string; size?: string }[]>(),
  status: varchar("status", { length: 32 }).default("scheduled").notNull(), // scheduled, live, completed, no_show
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 6. MOCK INTERVIEWS & RUBRIC EVALUATIONS
// ==========================================

export const mockInterviews = pgTable("mock_interviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "cascade" }).unique().notNull(),
  category: varchar("category", { length: 64 }).notNull(), // Technical, HR, System Design, Behavioral, Mixed
  targetRole: varchar("target_role", { length: 160 }).notNull(), // e.g. "SDE (Software Engineer)", "Product Manager"
  difficulty: varchar("difficulty", { length: 32 }).default("Medium").notNull(), // Easy, Medium, Hard
  overallScore: numeric("overall_score", { precision: 3, scale: 1 }), // e.g. 8.2
  scoreTechnical: numeric("score_technical", { precision: 3, scale: 1 }), // e.g. 8.5
  scoreProblemSolving: numeric("score_problem_solving", { precision: 3, scale: 1 }), // e.g. 7.8
  scoreCommunication: numeric("score_communication", { precision: 3, scale: 1 }), // e.g. 8.0
  scoreConfidence: numeric("score_confidence", { precision: 3, scale: 1 }), // e.g. 8.6
  strengths: jsonb("strengths").$type<string[]>().default([]),
  areasToImprove: jsonb("areas_to_improve").$type<string[]>().default([]),
  detailedFeedback: text("detailed_feedback"),
  recommendedNextSteps: text("recommended_next_steps"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 7. REALTIME MESSAGING & NOTIFICATIONS
// ==========================================

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentUserId: uuid("student_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  mentorUserId: uuid("mentor_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
  lastMessageText: text("last_message_text"),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
  senderUserId: uuid("sender_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  attachmentUrl: text("attachment_url"),
  attachmentName: varchar("attachment_name", { length: 255 }),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 64 }).notNull(), // booking, session, chat, verification, payment, system
  category: varchar("category", { length: 64 }).default("general").notNull(), // bookings, messages, payments, mentorship, mock_interviews, account_security, announcements, general
  priority: varchar("priority", { length: 32 }).default("normal").notNull(), // low, normal, high, urgent
  linkUrl: text("link_url"),
  actionUrl: text("action_url"),
  actionLabel: varchar("action_label", { length: 120 }),
  idempotencyKey: varchar("idempotency_key", { length: 255 }),
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).unique().notNull(),
  inAppEnabled: boolean("in_app_enabled").default(true).notNull(),
  pushEnabled: boolean("push_enabled").default(true).notNull(),
  emailEnabled: boolean("email_enabled").default(true).notNull(),
  bookingReminders: boolean("booking_reminders").default(true).notNull(),
  chatMessages: boolean("chat_messages").default(true).notNull(),
  mentorshipUpdates: boolean("mentorship_updates").default(true).notNull(),
  mockInterviewAlerts: boolean("mock_interview_alerts").default(true).notNull(),
  paymentReceipts: boolean("payment_receipts").default(true).notNull(),
  marketingAnnouncements: boolean("marketing_announcements").default(false).notNull(),
  quietHoursEnabled: boolean("quiet_hours_enabled").default(false).notNull(),
  quietHoursStart: varchar("quiet_hours_start", { length: 5 }).default("22:00").notNull(),
  quietHoursEnd: varchar("quiet_hours_end", { length: 5 }).default("08:00").notNull(),
  timezone: varchar("timezone", { length: 64 }).default("Asia/Kolkata").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  endpoint: text("endpoint").unique().notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notificationDeliveries = pgTable("notification_deliveries", {
  id: uuid("id").primaryKey().defaultRandom(),
  notificationId: uuid("notification_id").references(() => notifications.id, { onDelete: "cascade" }).notNull(),
  channel: varchar("channel", { length: 32 }).notNull(), // in_app, sse, push, email
  status: varchar("status", { length: 32 }).notNull(), // delivered, queued, failed, suppressed
  errorMessage: text("error_message"),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notificationAnnouncements = pgTable("notification_announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  audience: varchar("audience", { length: 64 }).default("all").notNull(), // all, students, mentors, admins
  priority: varchar("priority", { length: 32 }).default("normal").notNull(),
  actionUrl: text("action_url"),
  actionLabel: varchar("action_label", { length: 120 }),
  channels: jsonb("channels").default(["in_app", "push"]).notNull(),
  publishedByUserId: uuid("published_by_user_id").references(() => users.id, { onDelete: "set null" }),
  recipientCount: integer("recipient_count").default(0).notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow().notNull(),
});

export const scheduledNotifications = pgTable("scheduled_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  reminderType: varchar("reminder_type", { length: 32 }).notNull(), // reminder_24h, reminder_1h, reminder_15m
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 32 }).default("pending").notNull(), // pending, sent, cancelled
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 8. MARKETPLACE PAYMENTS & LEDGER
// ==========================================

export const ledgerTransactions = pgTable("ledger_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "cascade" }).notNull(),
  studentUserId: uuid("student_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  mentorProfileId: uuid("mentor_profile_id").references(() => mentorProfiles.id, { onDelete: "cascade" }).notNull(),
  grossAmountInr: integer("gross_amount_inr").notNull(),
  platformCommissionPercent: numeric("platform_commission_percent", { precision: 4, scale: 2 }).default("15.00").notNull(),
  platformFeeInr: integer("platform_fee_inr").notNull(),
  mentorPayableInr: integer("mentor_payable_inr").notNull(),
  status: varchar("status", { length: 32 }).default("pending").notNull(), // pending, settled, refunded, held
  paymentProvider: varchar("payment_provider", { length: 64 }).default("cashfree").notNull(),
  providerOrderId: varchar("provider_order_id", { length: 160 }),
  providerPaymentId: varchar("provider_payment_id", { length: 160 }),
  refundAmountInr: integer("refund_amount_inr").default(0),
  refundReason: text("refund_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  settledAt: timestamp("settled_at", { withTimezone: true }),
});

// ==========================================
// 9. ECOSYSTEM INTEGRATION, CONSENT & AUDIT
// ==========================================

export const userSessions = pgTable("user_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: varchar("token", { length: 255 }).unique().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const outboxEvents = pgTable("outbox_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: varchar("event_type", { length: 120 }).notNull(), // booking.created, session.reminder, mentor.application_updated
  payload: jsonb("payload").notNull(),
  status: varchar("status", { length: 32 }).default("pending").notNull(), // pending, processing, completed, failed, dead_letter
  retryCount: integer("retry_count").default(0).notNull(),
  errorMessage: text("error_message"),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  lockedBy: varchar("locked_by", { length: 120 }),
  nextRetryAt: timestamp("next_retry_at", { withTimezone: true }).defaultNow(),
  idempotencyKey: varchar("idempotency_key", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

export const consentGrants = pgTable("consent_grants", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  targetSystem: varchar("target_system", { length: 64 }).default("aitathastu").notNull(),
  scopes: jsonb("scopes").$type<string[]>().default([]).notNull(), // academic, skills, projects, goals, learning_activity
  isRevoked: boolean("is_revoked").default(false).notNull(),
  consentVersion: varchar("consent_version", { length: 32 }).default("1.0").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id"),
  action: varchar("action", { length: 120 }).notNull(), // mentor.approve, mentor.reject, booking.cancel, payment.refund, settings.update
  resourceType: varchar("resource_type", { length: 64 }).notNull(), // mentor, booking, user, payment, platform
  resourceId: varchar("resource_id", { length: 120 }),
  details: jsonb("details"),
  ipAddress: varchar("ip_address", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const platformSettings = pgTable("platform_settings", {
  key: varchar("key", { length: 120 }).primaryKey(),
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedByUserId: uuid("updated_by_user_id"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 10. EMAIL COMMUNICATION & SUPPORT SYSTEM
// ==========================================

export const emailTemplates = pgTable("email_templates", {
  id: varchar("id", { length: 120 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(), // auth, student, mentor, payment, support, system
  subject: varchar("subject", { length: 255 }).notNull(),
  previewText: varchar("preview_text", { length: 255 }),
  htmlBody: text("html_body").notNull(),
  textBody: text("text_body").notNull(),
  variables: jsonb("variables").default([]).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isSystemCritical: boolean("is_system_critical").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const emailAutomations = pgTable("email_automations", {
  id: varchar("id", { length: 120 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  eventType: varchar("event_type", { length: 120 }).notNull(),
  templateId: varchar("template_id", { length: 120 }).notNull(),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  recipientType: varchar("recipient_type", { length: 64 }).default("user").notNull(),
  delaySeconds: integer("delay_seconds").default(0).notNull(),
  maxRetries: integer("max_retries").default(5).notNull(),
  quietHoursEnabled: boolean("quiet_hours_enabled").default(false).notNull(),
  lastExecutedAt: timestamp("last_executed_at", { withTimezone: true }),
  executionCount: integer("execution_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const emailDeliveryLogs = pgTable("email_delivery_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  recipientUserId: uuid("recipient_user_id").references(() => users.id, { onDelete: "set null" }),
  recipientName: varchar("recipient_name", { length: 160 }),
  templateId: varchar("template_id", { length: 120 }),
  subject: varchar("subject", { length: 255 }).notNull(),
  category: varchar("category", { length: 64 }).default("system").notNull(),
  eventType: varchar("event_type", { length: 120 }),
  status: varchar("status", { length: 32 }).default("queued").notNull(), // queued, sent, delivered, failed, bounced, cancelled
  attemptCount: integer("attempt_count").default(1).notNull(),
  maxAttempts: integer("max_attempts").default(5).notNull(),
  idempotencyKey: varchar("idempotency_key", { length: 255 }).unique(),
  smtpResponse: text("smtp_response"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  queuedAt: timestamp("queued_at", { withTimezone: true }).defaultNow().notNull(),
  lastAttemptedAt: timestamp("last_attempted_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

export const emailPreferences = pgTable("email_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).unique().notNull(),
  marketingConsent: boolean("marketing_consent").default(false).notNull(),
  recommendationsConsent: boolean("recommendations_consent").default(true).notNull(),
  newsletterConsent: boolean("newsletter_consent").default(false).notNull(),
  bookingRemindersConsent: boolean("booking_reminders_consent").default(true).notNull(),
  unsubscribeToken: varchar("unsubscribe_token", { length: 128 }).unique().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const emailSuppressions = pgTable("email_suppressions", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  reason: varchar("reason", { length: 64 }).notNull(), // hard_bounce, complaint, manual_admin, unsubscribed_all
  source: varchar("source", { length: 120 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const supportTickets = pgTable("support_tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketNumber: varchar("ticket_number", { length: 64 }).unique().notNull(), // MM-2026-XXXX
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  userEmail: varchar("user_email", { length: 255 }).notNull(),
  userName: varchar("user_name", { length: 160 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  priority: varchar("priority", { length: 32 }).default("medium").notNull(),
  status: varchar("status", { length: 32 }).default("open").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description").notNull(),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
  paymentReference: varchar("payment_reference", { length: 120 }),
  assignedToUserId: uuid("assigned_to_user_id"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const supportMessages = pgTable("support_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id").references(() => supportTickets.id, { onDelete: "cascade" }).notNull(),
  senderUserId: uuid("sender_user_id"),
  senderName: varchar("sender_name", { length: 160 }).notNull(),
  senderRole: varchar("sender_role", { length: 32 }).notNull(),
  message: text("message").notNull(),
  isInternalNote: boolean("is_internal_note").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const emailAuditLogs = pgTable("email_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id"),
  actorEmail: varchar("actor_email", { length: 255 }),
  action: varchar("action", { length: 120 }).notNull(),
  targetId: varchar("target_id", { length: 120 }),
  details: jsonb("details"),
  ipAddress: varchar("ip_address", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// RELATIONS
// ==========================================

export const usersRelations = relations(users, ({ one, many }) => ({
  studentProfile: one(studentProfiles, {
    fields: [users.id],
    references: [studentProfiles.userId],
  }),
  mentorProfile: one(mentorProfiles, {
    fields: [users.id],
    references: [mentorProfiles.userId],
  }),
  identities: many(userIdentities),
  notifications: many(notifications),
}));

export const mentorProfilesRelations = relations(mentorProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [mentorProfiles.userId],
    references: [users.id],
  }),
  expertise: one(mentorExpertise, {
    fields: [mentorProfiles.id],
    references: [mentorExpertise.mentorProfileId],
  }),
  applications: many(mentorApplications),
  availabilityRules: many(availabilityRules),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  student: one(users, {
    fields: [bookings.studentUserId],
    references: [users.id],
  }),
  mentor: one(mentorProfiles, {
    fields: [bookings.mentorProfileId],
    references: [mentorProfiles.id],
  }),
  session: one(mentorshipSessions, {
    fields: [bookings.id],
    references: [mentorshipSessions.bookingId],
  }),
  mockInterview: one(mockInterviews, {
    fields: [bookings.id],
    references: [mockInterviews.bookingId],
  }),
}));

