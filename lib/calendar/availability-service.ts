/**
 * MentorMaze Availability Management Service
 * Manages weekly recurring rules, custom exceptions, settings, and conflict prevention
 * https://mentormaze.aitathastu.com
 */

import { getDb, schema, initializeDatabaseSchema } from "@/lib/db";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import {
  DayAvailabilityRule,
  TimeWindow,
  MentorSchedulingSettings,
  AvailabilityExceptionRecord,
  resolveMentorProfileId,
} from "./types";

export interface UpdateAvailabilityInput {
  settings: Partial<MentorSchedulingSettings>;
  rules: {
    dayOfWeek: number; // 0..6
    windows: TimeWindow[];
    isActive: boolean;
  }[];
  forceOverrideConflicts?: boolean;
}

export class AvailabilityService {
  /**
   * Retrieves full scheduling configuration and upcoming sessions for a mentor
   */
  public static async getMentorSchedule(rawMentorProfileId: string) {
    await initializeDatabaseSchema();
    const mentorProfileId = resolveMentorProfileId(rawMentorProfileId);
    const db = getDb();
    const now = new Date();

    // 1. Settings
    const [settings] = await db
      .select()
      .from(schema.mentorAvailabilitySettings)
      .where(eq(schema.mentorAvailabilitySettings.mentorProfileId, mentorProfileId))
      .limit(1);

    // 2. Weekly Rules
    const rawRules: any = await db
      .select()
      .from(schema.availabilityRules)
      .where(eq(schema.availabilityRules.mentorProfileId, mentorProfileId));

    const rulesByDay: DayAvailabilityRule[] = [];
    for (let day = 0; day <= 6; day++) {
      const dayRows = rawRules.filter((r: any) => r.dayOfWeek === day);
      rulesByDay.push({
        dayOfWeek: day,
        windows: dayRows.map((r: any) => ({
          startTime: r.startTime.slice(0, 5),
          endTime: r.endTime.slice(0, 5),
        })),
        isActive: dayRows.length > 0 && dayRows.some((r: any) => r.isActive),
      });
    }

    // Default weekday availability if mentor hasn't configured rules yet
    const hasAnyActiveRules = rulesByDay.some((r) => r.isActive && r.windows.length > 0);
    if (!hasAnyActiveRules) {
      for (let day = 1; day <= 5; day++) {
        rulesByDay[day] = {
          dayOfWeek: day,
          windows: [
            { startTime: "10:00", endTime: "13:00" },
            { startTime: "14:00", endTime: "18:00" },
          ],
          isActive: true,
        };
      }
    }

    // 3. Upcoming Exceptions (Next 90 Days)
    const ninetyDaysLater = new Date(now.getTime() + 90 * 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);
    const todayStr = now.toISOString().slice(0, 10);

    const exceptions = await db
      .select()
      .from(schema.availabilityExceptions)
      .where(
        and(
          eq(schema.availabilityExceptions.mentorProfileId, mentorProfileId),
          sql`${schema.availabilityExceptions.exceptionDate} >= ${todayStr}`,
          sql`${schema.availabilityExceptions.exceptionDate} <= ${ninetyDaysLater}`
        )
      );

    // 4. Upcoming Confirmed Bookings
    const upcomingBookings = await db
      .select({
        id: schema.bookings.id,
        serviceType: schema.bookings.serviceType,
        startTimeUtc: schema.bookings.startTimeUtc,
        endTimeUtc: schema.bookings.endTimeUtc,
        status: schema.bookings.status,
        studentName: schema.users.displayName,
        studentEmail: schema.users.email,
        priceInr: schema.bookings.priceInr,
      })
      .from(schema.bookings)
      .innerJoin(schema.users, eq(schema.bookings.studentUserId, schema.users.id))
      .where(
        and(
          eq(schema.bookings.mentorProfileId, mentorProfileId),
          sql`${schema.bookings.status} != 'cancelled'`,
          sql`${schema.bookings.startTimeUtc} >= ${now}`
        )
      )
      .orderBy(schema.bookings.startTimeUtc)
      .limit(20);

    // 5. Google Calendar Connection Status
    const [calendarConnection] = await db
      .select({
        id: schema.calendarConnections.id,
        provider: schema.calendarConnections.provider,
        accountEmail: schema.calendarConnections.accountEmail,
        status: schema.calendarConnections.status,
        lastSyncedAt: schema.calendarConnections.lastSyncedAt,
      })
      .from(schema.calendarConnections)
      .where(eq(schema.calendarConnections.mentorProfileId, mentorProfileId))
      .limit(1);

    return {
      settings: settings || {
        mentorProfileId,
        bufferTimeMinutes: 15,
        minNoticeHours: 2,
        maxAdvanceDays: 30,
        dailySessionLimit: 4,
        weeklySessionLimit: 20,
        customSessionDurations: [15, 30, 45, 60],
        timezone: "Asia/Kolkata",
      },
      rules: rulesByDay,
      exceptions,
      upcomingBookings,
      calendarConnection: calendarConnection || null,
    };
  }

  /**
   * Updates recurring weekly rules and settings with conflict detection
   * Prevents silently invalidating already confirmed student bookings
   */
  public static async updateMentorSchedule(
    rawMentorProfileId: string,
    input: UpdateAvailabilityInput
  ) {
    await initializeDatabaseSchema();
    const mentorProfileId = resolveMentorProfileId(rawMentorProfileId);
    const db = getDb();
    const now = new Date();

    return await db.transaction(async (tx: any) => {
      // 1. Database-level lock on mentor profile row to serialize availability mutations
      await tx.execute(sql`
        SELECT id FROM mentor_profiles WHERE id = ${mentorProfileId} FOR UPDATE;
      `);

      // 2. Conflict Check: Retrieve all future confirmed bookings within transaction
      const futureBookingsQuery: any = await tx.execute(sql`
        SELECT id, start_time_utc, end_time_utc, service_type
        FROM bookings
        WHERE mentor_profile_id = ${mentorProfileId}
          AND status != 'cancelled'
          AND start_time_utc >= ${now.toISOString()};
      `);
      const futureBookings = futureBookingsQuery.rows || futureBookingsQuery || [];

      // Check if any booking falls on a newly deactivated day
      const conflicts: any[] = [];
      if (futureBookings.length > 0) {
        for (const booking of futureBookings) {
          const bookingDate = new Date(booking.start_time_utc);
          const dayOfWeek = bookingDate.getUTCDay();
          const ruleForDay = input.rules.find((r) => r.dayOfWeek === dayOfWeek);

          if (!ruleForDay || !ruleForDay.isActive || ruleForDay.windows.length === 0) {
            conflicts.push({
              bookingId: booking.id,
              startTimeUtc: booking.start_time_utc,
              serviceType: booking.service_type,
              dayOfWeek,
              reason: `Session is booked on day ${dayOfWeek}, which is now marked unavailable.`,
            });
          }
        }
      }

      if (conflicts.length > 0) {
        if (!input.forceOverrideConflicts) {
          return {
            success: false,
            hasConflicts: true,
            conflicts,
            error: `Cannot deactivate availability: ${conflicts.length} confirmed session(s) would be orphaned. Reschedule or cancel these sessions first, or confirm override.`,
          };
        }

        // Administrative Override Path:
        // Confirmed bookings are NOT silently orphaned or automatically cancelled/refunded.
        // Instead, each affected booking generates an immutable audit record and outbox notification.
        for (const conflict of conflicts) {
          await tx.execute(sql`
            INSERT INTO booking_events (
              booking_id, event_type, from_status, to_status, actor_role, metadata
            ) VALUES (
              ${conflict.bookingId},
              'admin_availability_override',
              'confirmed',
              'confirmed',
              'admin',
              ${JSON.stringify({
                warning: "Administrator forced schedule update while booking remains confirmed",
                dayOfWeek: conflict.dayOfWeek,
                startTimeUtc: conflict.startTimeUtc,
                serviceType: conflict.serviceType,
              })}
            );
          `);

          await tx.execute(sql`
            INSERT INTO outbox_events (event_type, payload, status)
            VALUES (
              'availability.admin_override_conflict',
              ${JSON.stringify({
                mentorProfileId,
                bookingId: conflict.bookingId,
                startTimeUtc: conflict.startTimeUtc,
                serviceType: conflict.serviceType,
              })},
              'pending'
            );
          `);
        }
      }

      // 3. Update Settings (Upsert)
      await tx
        .insert(schema.mentorAvailabilitySettings)
        .values({
          mentorProfileId,
          bufferTimeMinutes: input.settings.bufferTimeMinutes ?? 15,
          minNoticeHours: input.settings.minNoticeHours ?? 2,
          maxAdvanceDays: input.settings.maxAdvanceDays ?? 30,
          dailySessionLimit: input.settings.dailySessionLimit ?? 4,
          weeklySessionLimit: input.settings.weeklySessionLimit ?? 20,
          customSessionDurations: input.settings.customSessionDurations ?? [15, 30, 45, 60],
          timezone: input.settings.timezone ?? "Asia/Kolkata",
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.mentorAvailabilitySettings.mentorProfileId,
          set: {
            bufferTimeMinutes: input.settings.bufferTimeMinutes ?? 15,
            minNoticeHours: input.settings.minNoticeHours ?? 2,
            maxAdvanceDays: input.settings.maxAdvanceDays ?? 30,
            dailySessionLimit: input.settings.dailySessionLimit ?? 4,
            weeklySessionLimit: input.settings.weeklySessionLimit ?? 20,
            customSessionDurations: input.settings.customSessionDurations ?? [15, 30, 45, 60],
            timezone: input.settings.timezone ?? "Asia/Kolkata",
            updatedAt: new Date(),
          },
        });

      // 4. Atomically replace weekly rules
      await tx.execute(sql`
        DELETE FROM availability_rules
        WHERE mentor_profile_id = ${mentorProfileId};
      `);

      for (const dayRule of input.rules) {
        if (!dayRule.isActive || !dayRule.windows || dayRule.windows.length === 0) continue;

        for (const win of dayRule.windows) {
          if (!win.startTime || !win.endTime) continue;
          await tx.execute(sql`
            INSERT INTO availability_rules (
              mentor_profile_id,
              day_of_week,
              start_time,
              end_time,
              is_active
            ) VALUES (
              ${mentorProfileId},
              ${dayRule.dayOfWeek},
              ${win.startTime},
              ${win.endTime},
              true
            );
          `);
        }
      }

      return {
        success: true,
        hasConflicts: conflicts.length > 0,
        overriddenConflictsCount: conflicts.length,
      };
    });
  }

  /**
   * Adds an availability exception (holiday, date block, or custom extra hours)
   */
  public static async addException(
    rawMentorProfileId: string,
    exception: {
      exceptionDate: string;
      isBlocked: boolean;
      startTime?: string;
      endTime?: string;
      reason?: string;
    }
  ) {
    await initializeDatabaseSchema();
    const mentorProfileId = resolveMentorProfileId(rawMentorProfileId);
    const db = getDb();

    // Check if blocking a date that has confirmed sessions
    if (exception.isBlocked) {
      const dayStart = new Date(`${exception.exceptionDate}T00:00:00Z`);
      const dayEnd = new Date(`${exception.exceptionDate}T23:59:59Z`);

      const conflictingBookings = await db
        .select({ id: schema.bookings.id, startTimeUtc: schema.bookings.startTimeUtc })
        .from(schema.bookings)
        .where(
          and(
            eq(schema.bookings.mentorProfileId, mentorProfileId),
            sql`${schema.bookings.status} != 'cancelled'`,
            sql`${schema.bookings.startTimeUtc} >= ${dayStart}`,
            sql`${schema.bookings.startTimeUtc} <= ${dayEnd}`
          )
        );

      if (conflictingBookings.length > 0) {
        return {
          success: false,
          conflict: true,
          conflictingBookings,
          error: `This date has ${conflictingBookings.length} confirmed session(s). Please reschedule or cancel them before blocking this date.`,
        };
      }
    }

    const [created] = await db
      .insert(schema.availabilityExceptions)
      .values({
        mentorProfileId,
        exceptionDate: exception.exceptionDate as any,
        isBlocked: exception.isBlocked,
        startTime: exception.startTime || null,
        endTime: exception.endTime || null,
        reason: exception.reason || null,
      })
      .returning();

    return { success: true, exception: created };
  }

  /**
   * Removes an availability exception
   */
  public static async removeException(rawMentorProfileId: string, exceptionId: string) {
    await initializeDatabaseSchema();
    const mentorProfileId = resolveMentorProfileId(rawMentorProfileId);
    const db = getDb();

    await db
      .delete(schema.availabilityExceptions)
      .where(
        and(
          eq(schema.availabilityExceptions.id, exceptionId),
          eq(schema.availabilityExceptions.mentorProfileId, mentorProfileId)
        )
      );

    return { success: true };
  }

  /**
   * Admin platform-wide calendar and booking audit
   */
  public static async getAdminCalendarOverview(filters: {
    startDate?: string;
    endDate?: string;
    mentorId?: string;
    status?: string;
    serviceType?: string;
  }) {
    await initializeDatabaseSchema();
    const db = getDb();
    const conditions: any[] = [];

    if (filters.startDate) {
      conditions.push(sql`${schema.bookings.startTimeUtc} >= ${new Date(filters.startDate)}`);
    }
    if (filters.endDate) {
      conditions.push(sql`${schema.bookings.startTimeUtc} <= ${new Date(filters.endDate)}`);
    }
    if (filters.mentorId) {
      conditions.push(eq(schema.bookings.mentorProfileId, filters.mentorId));
    }
    if (filters.status && filters.status !== "all") {
      conditions.push(eq(schema.bookings.status, filters.status));
    }
    if (filters.serviceType && filters.serviceType !== "all") {
      conditions.push(eq(schema.bookings.serviceType, filters.serviceType));
    }

    const rows = await db
      .select({
        id: schema.bookings.id,
        serviceType: schema.bookings.serviceType,
        sessionDurationMinutes: schema.bookings.sessionDurationMinutes,
        startTimeUtc: schema.bookings.startTimeUtc,
        endTimeUtc: schema.bookings.endTimeUtc,
        status: schema.bookings.status,
        priceInr: schema.bookings.priceInr,
        studentName: schema.users.displayName,
        studentEmail: schema.users.email,
        mentorHeadline: schema.mentorProfiles.headline,
        mentorOrganization: schema.mentorProfiles.organization,
        createdAt: schema.bookings.createdAt,
      })
      .from(schema.bookings)
      .innerJoin(schema.users, eq(schema.bookings.studentUserId, schema.users.id))
      .innerJoin(schema.mentorProfiles, eq(schema.bookings.mentorProfileId, schema.mentorProfiles.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.bookings.startTimeUtc))
      .limit(100);

    return rows;
  }
}
