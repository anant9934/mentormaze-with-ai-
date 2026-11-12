/**
 * MentorMaze Slot Generation & Scheduling Algorithm
 * Timezone-aware, concurrency-safe bookable slot calculator
 * https://mentormaze.aitathastu.com
 */

import { getDb, schema, initializeDatabaseSchema } from "@/lib/db";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { CalendarSlot, DayAvailabilityRule, TimeWindow, resolveMentorProfileId } from "./types";

export interface SlotGeneratorInput {
  mentorProfileId: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  durationMinutes: number; // e.g. 15, 30, 45, 60
  viewerTimezone: string;  // e.g. "Asia/Kolkata", "America/New_York", "UTC"
}

/**
 * Format a Date object in a specific IANA timezone
 */
function formatInTimezone(date: Date, timezone: string, format: "time" | "datetime"): string {
  try {
    if (format === "time") {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    }
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

/**
 * Construct a UTC Date from a Date string ("YYYY-MM-DD"), Time string ("HH:MM"), and IANA timezone
 */
function parseZonedDateTimeToUtc(dateStr: string, timeStr: string, timezone: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);

  // Approximate UTC date initially
  const utcApprox = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));

  // Determine timezone offset using Intl
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(utcApprox);
  const p: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      p[part.type] = parseInt(part.value, 10);
    }
  }

  const localFromUtc = new Date(Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second));
  const diffMs = utcApprox.getTime() - localFromUtc.getTime();

  return new Date(utcApprox.getTime() + diffMs);
}

export class SlotGenerator {
  /**
   * Generates all bookable slots for a mentor within a date range
   */
  public static async generateSlots(input: SlotGeneratorInput): Promise<CalendarSlot[]> {
    await initializeDatabaseSchema();
    const db = getDb();
    const now = new Date();

    const durationMs = input.durationMinutes * 60 * 1000;

    const mentorProfileId = resolveMentorProfileId(input.mentorProfileId);

    // 1. Fetch Mentor Profile & Scheduling Settings
    const [profile] = await db
      .select({
        id: schema.mentorProfiles.id,
        isAcceptingBookings: schema.mentorProfiles.isAcceptingBookings,
        verificationStatus: schema.mentorProfiles.verificationStatus,
      })
      .from(schema.mentorProfiles)
      .where(eq(schema.mentorProfiles.id, mentorProfileId))
      .limit(1);

    if (!profile || profile.verificationStatus !== "approved" || !profile.isAcceptingBookings) {
      return [];
    }

    const settingsRows = await db
      .select()
      .from(schema.mentorAvailabilitySettings)
      .where(eq(schema.mentorAvailabilitySettings.mentorProfileId, mentorProfileId))
      .limit(1);

    const settings = settingsRows[0] || {
      bufferTimeMinutes: 15,
      minNoticeHours: 2,
      maxAdvanceDays: 30,
      dailySessionLimit: 4,
      timezone: "Asia/Kolkata",
    };

    const bufferMs = (settings.bufferTimeMinutes || 15) * 60 * 1000;
    const minNoticeMs = (settings.minNoticeHours || 2) * 60 * 60 * 1000;
    const maxAdvanceMs = (settings.maxAdvanceDays || 30) * 24 * 60 * 60 * 1000;

    const earliestBookableUtc = new Date(now.getTime() + minNoticeMs);
    const latestBookableUtc = new Date(now.getTime() + maxAdvanceMs);

    // 2. Fetch Weekly Availability Rules
    const rules = await db
      .select()
      .from(schema.availabilityRules)
      .where(
        and(
          eq(schema.availabilityRules.mentorProfileId, mentorProfileId),
          eq(schema.availabilityRules.isActive, true)
        )
      );

    // Group rules by day of week (0..6)
    const rulesByDay = new Map<number, TimeWindow[]>();
    for (const r of rules) {
      if (!rulesByDay.has(r.dayOfWeek)) {
        rulesByDay.set(r.dayOfWeek, []);
      }
      rulesByDay.get(r.dayOfWeek)!.push({
        startTime: r.startTime.slice(0, 5),
        endTime: r.endTime.slice(0, 5),
      });
    }

    // Default availability if no rules yet configured: Mon-Fri 10:00 - 18:00
    if (rulesByDay.size === 0) {
      for (let day = 1; day <= 5; day++) {
        rulesByDay.set(day, [
          { startTime: "10:00", endTime: "13:00" },
          { startTime: "14:00", endTime: "18:00" },
        ]);
      }
    }

    // 3. Fetch Availability Exceptions in Date Range
    const exceptions = await db
      .select()
      .from(schema.availabilityExceptions)
      .where(
        and(
          eq(schema.availabilityExceptions.mentorProfileId, mentorProfileId),
          sql`${schema.availabilityExceptions.exceptionDate} >= ${input.startDate}`,
          sql`${schema.availabilityExceptions.exceptionDate} <= ${input.endDate}`
        )
      );

    const exceptionsByDate = new Map<string, typeof exceptions>();
    for (const ex of exceptions) {
      const d = String(ex.exceptionDate);
      if (!exceptionsByDate.has(d)) exceptionsByDate.set(d, []);
      exceptionsByDate.get(d)!.push(ex);
    }

    // 4. Fetch Existing Confirmed Bookings in Range
    const rangeStartUtc = new Date(`${input.startDate}T00:00:00Z`);
    const rangeEndUtc = new Date(`${input.endDate}T23:59:59Z`);

    const existingBookings = await db
      .select({
        id: schema.bookings.id,
        startTimeUtc: schema.bookings.startTimeUtc,
        endTimeUtc: schema.bookings.endTimeUtc,
      })
      .from(schema.bookings)
      .where(
        and(
          eq(schema.bookings.mentorProfileId, mentorProfileId),
          sql`${schema.bookings.status} != 'cancelled'`,
          sql`${schema.bookings.startTimeUtc} < ${rangeEndUtc}`,
          sql`${schema.bookings.endTimeUtc} > ${rangeStartUtc}`
        )
      );

    // 5. Fetch Active Booking Holds in Range (unexpired holds)
    const activeHolds = await db
      .select({
        id: schema.bookingHolds.id,
        startTimeUtc: schema.bookingHolds.startTimeUtc,
        endTimeUtc: schema.bookingHolds.endTimeUtc,
      })
      .from(schema.bookingHolds)
      .where(
        and(
          eq(schema.bookingHolds.mentorProfileId, mentorProfileId),
          eq(schema.bookingHolds.status, "active"),
          sql`${schema.bookingHolds.expiresAt} > ${now}`,
          sql`${schema.bookingHolds.startTimeUtc} < ${rangeEndUtc}`,
          sql`${schema.bookingHolds.endTimeUtc} > ${rangeStartUtc}`
        )
      );

    // 6. Fetch External Calendar Busy Periods
    const externalBusy = await db
      .select({
        startTimeUtc: schema.externalCalendarEvents.startTimeUtc,
        endTimeUtc: schema.externalCalendarEvents.endTimeUtc,
      })
      .from(schema.externalCalendarEvents)
      .where(
        and(
          eq(schema.externalCalendarEvents.mentorProfileId, mentorProfileId),
          eq(schema.externalCalendarEvents.isBusy, true),
          sql`${schema.externalCalendarEvents.startTimeUtc} < ${rangeEndUtc}`,
          sql`${schema.externalCalendarEvents.endTimeUtc} > ${rangeStartUtc}`
        )
      );

    // 7. Iterate through each day in range
    const slots: CalendarSlot[] = [];
    const startD = new Date(input.startDate);
    const endD = new Date(input.endDate);

    for (let cur = new Date(startD); cur <= endD; cur.setDate(cur.getDate() + 1)) {
      const yearStr = cur.getFullYear();
      const monthStr = String(cur.getMonth() + 1).padStart(2, "0");
      const dayStr = String(cur.getDate()).padStart(2, "0");
      const dateKey = `${yearStr}-${monthStr}-${dayStr}`;

      const dayOfWeek = cur.getDay(); // 0 = Sun, 1 = Mon ...
      const dayExceptions = exceptionsByDate.get(dateKey) || [];

      // Check full day block
      const isFullDayBlocked = dayExceptions.some(
        (ex) => ex.isBlocked && (!ex.startTime || !ex.endTime)
      );
      if (isFullDayBlocked) continue;

      // Determine active time windows for this day
      let windows: TimeWindow[] = [];
      const overrideException = dayExceptions.find(
        (ex) => !ex.isBlocked && ex.startTime && ex.endTime
      );

      if (overrideException && overrideException.startTime && overrideException.endTime) {
        // Mentor added custom extra hours for this specific day
        windows = [{
          startTime: overrideException.startTime.slice(0, 5),
          endTime: overrideException.endTime.slice(0, 5),
        }];
      } else {
        // Use regular weekly recurring schedule
        windows = rulesByDay.get(dayOfWeek) || [];
      }

      // Check daily session limit
      const dayStartApprox = new Date(`${dateKey}T00:00:00Z`);
      const dayEndApprox = new Date(`${dateKey}T23:59:59Z`);
      const sessionsOnThisDay = existingBookings.filter(
        (b) => b.startTimeUtc >= dayStartApprox && b.startTimeUtc <= dayEndApprox
      ).length;

      const dailyLimitExceeded = sessionsOnThisDay >= (settings.dailySessionLimit || 4);

      // Process each window
      for (const win of windows) {
        const winStartUtc = parseZonedDateTimeToUtc(dateKey, win.startTime, settings.timezone);
        const winEndUtc = parseZonedDateTimeToUtc(dateKey, win.endTime, settings.timezone);

        let curSlotStart = new Date(winStartUtc);

        while (curSlotStart.getTime() + durationMs <= winEndUtc.getTime()) {
          const curSlotEnd = new Date(curSlotStart.getTime() + durationMs);

          // Evaluation flags
          let available = true;
          let reason: string | undefined;

          // Check min notice
          if (curSlotStart.getTime() < earliestBookableUtc.getTime()) {
            available = false;
            reason = "notice_too_short";
          }
          // Check max advance window
          else if (curSlotStart.getTime() > latestBookableUtc.getTime()) {
            available = false;
            reason = "advance_window_exceeded";
          }
          // Check daily limit
          else if (dailyLimitExceeded) {
            available = false;
            reason = "daily_limit_reached";
          }

          // Check partial-day blocked exception
          if (available) {
            for (const ex of dayExceptions) {
              if (ex.isBlocked && ex.startTime && ex.endTime) {
                const exStart = parseZonedDateTimeToUtc(dateKey, ex.startTime.slice(0, 5), settings.timezone);
                const exEnd = parseZonedDateTimeToUtc(dateKey, ex.endTime.slice(0, 5), settings.timezone);
                if (curSlotStart.getTime() < exEnd.getTime() && curSlotEnd.getTime() > exStart.getTime()) {
                  available = false;
                  reason = "blocked_by_mentor";
                  break;
                }
              }
            }
          }

          // Check overlap with confirmed bookings (including buffer time)
          if (available) {
            for (const b of existingBookings) {
              const bStartWithBuffer = new Date(b.startTimeUtc.getTime() - bufferMs);
              const bEndWithBuffer = new Date(b.endTimeUtc.getTime() + bufferMs);
              if (curSlotStart.getTime() < bEndWithBuffer.getTime() && curSlotEnd.getTime() > bStartWithBuffer.getTime()) {
                available = false;
                reason = "booked";
                break;
              }
            }
          }

          // Check overlap with active booking holds
          if (available) {
            for (const h of activeHolds) {
              if (curSlotStart.getTime() < h.endTimeUtc.getTime() && curSlotEnd.getTime() > h.startTimeUtc.getTime()) {
                available = false;
                reason = "held";
                break;
              }
            }
          }

          // Check overlap with external calendar busy events
          if (available) {
            for (const ext of externalBusy) {
              if (curSlotStart.getTime() < ext.endTimeUtc.getTime() && curSlotEnd.getTime() > ext.startTimeUtc.getTime()) {
                available = false;
                reason = "external_busy";
                break;
              }
            }
          }

          // Format in viewer's local timezone
          slots.push({
            startTimeUtc: curSlotStart.toISOString(),
            endTimeUtc: curSlotEnd.toISOString(),
            startTimeLocal: formatInTimezone(curSlotStart, input.viewerTimezone, "time"),
            endTimeLocal: formatInTimezone(curSlotEnd, input.viewerTimezone, "time"),
            durationMinutes: input.durationMinutes,
            available,
            reason,
          });

          // Step by duration + buffer time
          curSlotStart = new Date(curSlotStart.getTime() + durationMs + bufferMs);
        }
      }
    }

    return slots;
  }
}
