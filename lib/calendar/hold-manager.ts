/**
 * MentorMaze Booking Hold Manager
 * Atomic temporary slot reservations with concurrency protection
 * https://mentormaze.aitathastu.com
 */

import { getDb, schema, initializeDatabaseSchema } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { MentorLockManager } from "@/lib/db/concurrency";
import { BookingHoldRecord, resolveMentorProfileId } from "./types";

export interface CreateHoldInput {
  mentorProfileId: string;
  studentUserId: string;
  serviceType: string;
  sessionDurationMinutes: number;
  startTimeUtc: string; // ISO 8601 UTC
  endTimeUtc: string;   // ISO 8601 UTC
  idempotencyKey: string;
  holdDurationMinutes?: number; // Default 10 minutes
}

export class BookingHoldManager {
  /**
   * Atomically acquires a temporary slot hold for a student
   * Guaranteed against race conditions using mentor-level mutex and DB row locking
   */
  public static async createHold(
    input: CreateHoldInput
  ): Promise<{ success: boolean; hold?: any; error?: string; collision?: boolean }> {
    await initializeDatabaseSchema();
    const mentorProfileId = resolveMentorProfileId(input.mentorProfileId);

    return await MentorLockManager.acquire(mentorProfileId, async () => {
      const db = getDb();
      const holdDuration = input.holdDurationMinutes || 10;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + holdDuration * 60 * 1000);

      const startUtc = new Date(input.startTimeUtc);
      const endUtc = new Date(input.endTimeUtc);

      // Execute within ACID transaction
      return await db.transaction(async (tx: any) => {
        // 1. Lock mentor profile row
        const mentorCheck: any = await tx.execute(sql`
          SELECT id, verification_status, is_accepting_bookings
          FROM mentor_profiles
          WHERE id = ${mentorProfileId}
          FOR UPDATE;
        `);

        const mentor = mentorCheck.rows?.[0] || mentorCheck?.[0];
        if (!mentor) {
          return { success: false, error: "Mentor profile does not exist." };
        }
        if (mentor.verification_status !== "approved" || !mentor.is_accepting_bookings) {
          return { success: false, error: "Mentor is not currently accepting bookings." };
        }

        // 2. Check for existing hold with same idempotencyKey (idempotent replay)
        const idempCheck: any = await tx.execute(sql`
          SELECT id, mentor_profile_id, student_user_id, start_time_utc, end_time_utc, expires_at, status
          FROM booking_holds
          WHERE idempotency_key = ${input.idempotencyKey}
          LIMIT 1;
        `);
        const existingHold = idempCheck.rows?.[0] || idempCheck?.[0];
        if (existingHold && existingHold.status === "active" && new Date(existingHold.expires_at) > now) {
          return { success: true, hold: existingHold };
        }

        // 3. Check Confirmed Bookings Overlap: start < B.end AND end > B.start
        const bookingOverlap: any = await tx.execute(sql`
          SELECT id FROM bookings
          WHERE mentor_profile_id = ${mentorProfileId}
            AND status != 'cancelled'
            AND start_time_utc < ${endUtc}
            AND end_time_utc > ${startUtc}
          LIMIT 1;
        `);

        if ((bookingOverlap.rows?.length || bookingOverlap?.length || 0) > 0) {
          return {
            success: false,
            collision: true,
            error: "Selected slot has already been booked by another student.",
          };
        }

        // 4. Check Active Holds Overlap
        const holdOverlap: any = await tx.execute(sql`
          SELECT id FROM booking_holds
          WHERE mentor_profile_id = ${mentorProfileId}
            AND status = 'active'
            AND expires_at > ${now}
            AND start_time_utc < ${endUtc}
            AND end_time_utc > ${startUtc}
          LIMIT 1;
        `);

        if ((holdOverlap.rows?.length || holdOverlap?.length || 0) > 0) {
          return {
            success: false,
            collision: true,
            error: "Selected slot is currently held by another user completing checkout.",
          };
        }

        // 5. Insert new active hold
        const insertResult: any = await tx.execute(sql`
          INSERT INTO booking_holds (
            mentor_profile_id,
            student_user_id,
            service_type,
            session_duration_minutes,
            start_time_utc,
            end_time_utc,
            expires_at,
            status,
            idempotency_key
          ) VALUES (
            ${mentorProfileId},
            ${input.studentUserId},
            ${input.serviceType},
            ${input.sessionDurationMinutes},
            ${startUtc},
            ${endUtc},
            ${expiresAt},
            'active',
            ${input.idempotencyKey}
          )
          RETURNING id, mentor_profile_id, student_user_id, service_type, session_duration_minutes, start_time_utc, end_time_utc, expires_at, status;
        `);

        const hold = insertResult.rows?.[0] || insertResult?.[0];
        return { success: true, hold };
      });
    });
  }

  /**
   * Release an active hold when student cancels or leaves checkout
   */
  public static async releaseHold(holdId: string, studentUserId?: string): Promise<{ success: boolean }> {
    const db = getDb();
    if (studentUserId) {
      await db.execute(sql`
        UPDATE booking_holds
        SET status = 'released'
        WHERE id = ${holdId}
          AND student_user_id = ${studentUserId}
          AND status = 'active';
      `);
    } else {
      await db.execute(sql`
        UPDATE booking_holds
        SET status = 'released'
        WHERE id = ${holdId}
          AND status = 'active';
      `);
    }

    return { success: true };
  }

  /**
   * Clean up expired holds (returns number of expired rows)
   */
  public static async cleanupExpiredHolds(): Promise<number> {
    const db = getDb();
    const now = new Date();
    const result: any = await db.execute(sql`
      UPDATE booking_holds
      SET status = 'expired'
      WHERE status = 'active'
        AND expires_at <= ${now}
      RETURNING id;
    `);

    const rows = result.rows || result;
    return rows?.length || 0;
  }
}
