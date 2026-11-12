/**
 * MentorMaze Calendar & Scheduling Engine — Type Definitions
 * https://mentormaze.aitathastu.com
 */

export interface TimeWindow {
  startTime: string; // "HH:MM" e.g. "10:00"
  endTime: string;   // "HH:MM" e.g. "13:00"
}

export interface DayAvailabilityRule {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  windows: TimeWindow[];
  isActive: boolean;
}

export interface AvailabilityExceptionRecord {
  id: string;
  mentorProfileId: string;
  exceptionDate: string; // "YYYY-MM-DD"
  isBlocked: boolean;    // true = unavailable (vacation/holiday), false = extra custom hours
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
  createdAt: Date;
}

export interface MentorSchedulingSettings {
  mentorProfileId: string;
  bufferTimeMinutes: number; // Default 15
  minNoticeHours: number;    // Default 2 (hours before booking)
  maxAdvanceDays: number;    // Default 30 (days into future)
  dailySessionLimit: number; // Default 4
  weeklySessionLimit: number;// Default 20
  customSessionDurations: number[]; // [15, 30, 45, 60]
  timezone: string;          // IANA timezone e.g. "Asia/Kolkata"
}

export interface CalendarSlot {
  startTimeUtc: string; // ISO 8601 UTC
  endTimeUtc: string;   // ISO 8601 UTC
  startTimeLocal: string; // Formatted in viewer timezone
  endTimeLocal: string;
  durationMinutes: number;
  available: boolean;
  reason?: string; // If unavailable: "booked", "held", "notice_too_short", "daily_limit_reached", "external_busy"
}

export interface BookingHoldRecord {
  id: string;
  mentorProfileId: string;
  studentUserId: string;
  serviceType: string;
  sessionDurationMinutes: number;
  startTimeUtc: Date;
  endTimeUtc: Date;
  expiresAt: Date;
  status: "active" | "converted" | "expired" | "released";
  idempotencyKey: string;
  createdAt: Date;
}

export interface CalendarConnectionRecord {
  id: string;
  userId: string;
  mentorProfileId: string;
  provider: "google_calendar" | "microsoft_365";
  accountEmail?: string | null;
  status: "connected" | "expired" | "revoked" | "error";
  lastSyncedAt?: Date | null;
  lastError?: string | null;
}

export interface ExternalBusyPeriod {
  startTimeUtc: Date;
  endTimeUtc: Date;
  source: string;
}

export interface IcsCalendarOptions {
  uid: string;
  sequence?: number;
  status?: "CONFIRMED" | "CANCELLED";
  title: string;
  description: string;
  location?: string;
  startTimeUtc: Date;
  endTimeUtc: Date;
  organizer: {
    name: string;
    email: string;
  };
  attendee: {
    name: string;
    email: string;
  };
  meetingUrl?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_TO_UUID: Record<string, string> = {
  "mentor-priya": "30000000-0000-0000-0000-000000000001",
  "priya": "30000000-0000-0000-0000-000000000001",
  "mentor-rohan": "30000000-0000-0000-0000-000000000002",
  "rohan": "30000000-0000-0000-0000-000000000002",
  "mentor-aditya": "30000000-0000-0000-0000-000000000003",
  "mentor-aisha": "30000000-0000-0000-0000-000000000003",
  "mentor-rahul": "30000000-0000-0000-0000-000000000004",
};

export function resolveMentorProfileId(idOrSlug: string): string {
  if (!idOrSlug) return "30000000-0000-0000-0000-000000000001";
  if (UUID_REGEX.test(idOrSlug)) return idOrSlug;
  return SLUG_TO_UUID[idOrSlug] || "30000000-0000-0000-0000-000000000001";
}

