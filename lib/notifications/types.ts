/**
 * MentorMaze Real-Time Notification & Alert Management System
 * Type definitions and interfaces
 * https://mentormaze.aitathastu.com
 */

export type NotificationCategory =
  | "all"
  | "unread"
  | "bookings"
  | "messages"
  | "payments"
  | "mentorship"
  | "mock_interviews"
  | "account_security"
  | "announcements"
  | "general";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export type NotificationChannel = "in_app" | "sse" | "push" | "email";

export type NotificationAudience = "all" | "students" | "mentors" | "admins";

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  category: string;
  priority: NotificationPriority;
  linkUrl?: string | null;
  actionUrl?: string | null;
  actionLabel?: string | null;
  isRead: boolean;
  readAt?: Date | null;
  metadata?: Record<string, any> | null;
  createdAt: Date;
}

export interface NotificationDispatchInput {
  userId: string;
  title: string;
  message: string;
  type?: string;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  linkUrl?: string;
  actionUrl?: string;
  actionLabel?: string;
  channels?: NotificationChannel[];
  metadata?: Record<string, any>;
  skipPreferencesCheck?: boolean; // For mandatory account security alerts
}

export interface NotificationPreferencesInput {
  inAppEnabled?: boolean;
  pushEnabled?: boolean;
  emailEnabled?: boolean;
  bookingReminders?: boolean;
  chatMessages?: boolean;
  mentorshipUpdates?: boolean;
  mockInterviewAlerts?: boolean;
  paymentReceipts?: boolean;
  marketingAnnouncements?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
}

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: PushSubscriptionKeys;
  userAgent?: string;
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  audience: NotificationAudience;
  priority?: NotificationPriority;
  actionUrl?: string;
  actionLabel?: string;
  channels?: ("in_app" | "push" | "email")[];
  publishedByUserId?: string;
}

export interface ScheduledReminderInput {
  bookingId: string;
  userId: string;
  sessionStartTime: Date;
  sessionTitle: string;
  mentorName?: string;
  studentName?: string;
  role: "student" | "mentor";
}

