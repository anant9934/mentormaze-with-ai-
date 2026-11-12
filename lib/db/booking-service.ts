import { getDb } from "./index";
import { sql } from "drizzle-orm";

export interface CreateBookingInput {
  studentUserId: string;
  mentorProfileId: string;
  serviceType: "1on1_mentorship" | "group_mentorship" | "mock_interview";
  sessionDurationMinutes: number;
  startTimeUtc: string;
  endTimeUtc: string;
  userTimezone: string;
  priceInr: number;
  studentDiscussionPoints?: string;
  resumeAttachmentUrl?: string;
}

/**
 * Mentor-level Async Lock Manager.
 * Serializes concurrent booking requests targeting the same mentor within the Node.js process.
 * Eliminates race conditions before touching the database connection pool.
 */
class MentorLockManager {
  private static queues = new Map<string, Promise<void>>();

  static async acquire<T>(mentorId: string, task: () => Promise<T>): Promise<T> {
    const currentQueue = this.queues.get(mentorId) || Promise.resolve();

    let releaseLock!: () => void;
    const nextInQueue = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    // Chain this task onto the mentor's queue
    const queuedTask = currentQueue.then(async () => {
      try {
        return await task();
      } finally {
        releaseLock();
      }
    });

    this.queues.set(mentorId, nextInQueue);

    try {
      return await queuedTask;
    } finally {
      if (this.queues.get(mentorId) === nextInQueue) {
        this.queues.delete(mentorId);
      }
    }
  }
}

/**
 * Creates a booking atomically inside PostgreSQL with two-tier concurrency protection:
 * 1. Process-level mentor queueing (MentorLockManager)
 * 2. Database-level row locking (SELECT ... FOR UPDATE) inside an ACID transaction.
 * 
 * Guarantees that even with 20+ simultaneous requests for overlapping intervals,
 * exactly one booking succeeds and all other conflicting requests are rejected.
 */
export async function createBookingInDb(input: CreateBookingInput) {
  return await MentorLockManager.acquire(input.mentorProfileId, async () => {
    const db = getDb();

    // Execute within an ACID transaction
    return await db.transaction(async (tx: any) => {
      // 1. Acquire row lock on mentor profile: verifies approval and prevents concurrent DB operations
      const mentorCheck: any = await tx.execute(sql`
        SELECT id, verification_status, is_accepting_bookings
        FROM mentor_profiles
        WHERE id = ${input.mentorProfileId}
        FOR UPDATE;
      `);

      const mentor = mentorCheck.rows?.[0] || mentorCheck?.[0];
      if (!mentor) {
        return { success: false, error: "Mentor profile does not exist in database." };
      }

      if (mentor.verification_status !== "approved" || !mentor.is_accepting_bookings) {
        return {
          success: false,
          error: "Mentor is not currently approved by administration or is not accepting bookings.",
        };
      }

      // 2. Strict Overlap Check in SQL:
      // Interval [A, B) overlaps [C, D) iff A < D and B > C
      // Cancelled bookings (status = 'cancelled') are strictly excluded so they never block new bookings
      const overlapCheck: any = await tx.execute(sql`
        SELECT id FROM bookings
        WHERE mentor_profile_id = ${input.mentorProfileId}
          AND status != 'cancelled'
          AND start_time_utc < ${input.endTimeUtc}
          AND end_time_utc > ${input.startTimeUtc}
        LIMIT 1;
      `);

      const hasOverlap = (overlapCheck.rows?.length || overlapCheck?.length || 0) > 0;
      if (hasOverlap) {
        return {
          success: false,
          error: "Slot reservation collision: The requested time slot is already booked for this mentor.",
        };
      }

      const roomId = `room-${input.mentorProfileId.slice(0, 8)}-${Date.now()}`;

      // 3. Insert confirmed booking
      const insertResult: any = await tx.execute(sql`
        INSERT INTO bookings (
          student_user_id,
          mentor_profile_id,
          service_type,
          session_duration_minutes,
          start_time_utc,
          end_time_utc,
          user_timezone,
          status,
          price_inr,
          payment_status,
          student_discussion_points,
          resume_attachment_url,
          meeting_room_id
        ) VALUES (
          ${input.studentUserId},
          ${input.mentorProfileId},
          ${input.serviceType},
          ${input.sessionDurationMinutes},
          ${input.startTimeUtc},
          ${input.endTimeUtc},
          ${input.userTimezone},
          'confirmed',
          ${input.priceInr},
          'paid',
          ${input.studentDiscussionPoints || null},
          ${input.resumeAttachmentUrl || null},
          ${roomId}
        )
        RETURNING id, student_user_id, mentor_profile_id, start_time_utc, end_time_utc, status, price_inr, meeting_room_id;
      `);

      const booking = insertResult.rows?.[0] || insertResult?.[0];

      // 4. Insert ledger transaction (15% marketplace commission)
      const platformFee = Math.round(input.priceInr * 0.15);
      const mentorPayable = input.priceInr - platformFee;

      await tx.execute(sql`
        INSERT INTO ledger_transactions (
          booking_id,
          student_user_id,
          mentor_profile_id,
          gross_amount_inr,
          platform_commission_percent,
          platform_fee_inr,
          mentor_payable_inr,
          status,
          payment_provider
        ) VALUES (
          ${booking.id},
          ${input.studentUserId},
          ${input.mentorProfileId},
          ${input.priceInr},
          15.00,
          ${platformFee},
          ${mentorPayable},
          'pending',
          'cashfree'
        );
      `);

      // 5. Insert audit outbox event for async notifications and calendar sync
      await tx.execute(sql`
        INSERT INTO outbox_events (event_type, payload, status)
        VALUES (
          'booking.created',
          ${JSON.stringify({
            bookingId: booking.id,
            studentId: input.studentUserId,
            mentorProfileId: input.mentorProfileId,
            startTimeUtc: input.startTimeUtc,
            endTimeUtc: input.endTimeUtc,
          })},
          'pending'
        );
      `);

      return { success: true, booking };
    });
  });
}

/**
 * Cancels a booking and updates ledger refund status atomically.
 */
export async function cancelBookingInDb(bookingId: string, reason: string) {
  const db = getDb();
  return await db.transaction(async (tx: any) => {
    await tx.execute(sql`
      UPDATE bookings
      SET status = 'cancelled', cancellation_reason = ${reason}, updated_at = now()
      WHERE id = ${bookingId};
    `);

    await tx.execute(sql`
      UPDATE ledger_transactions
      SET status = 'refunded', refund_reason = ${reason}
      WHERE booking_id = ${bookingId};
    `);

    await tx.execute(sql`
      INSERT INTO outbox_events (event_type, payload, status)
      VALUES ('booking.cancelled', ${JSON.stringify({ bookingId, reason })}, 'pending');
    `);

    return { success: true };
  });
}
