import { getDb } from "./index";
import { sql } from "drizzle-orm";
import { notificationService } from "@/lib/notifications/service";
import { MentorLockManager } from "./concurrency";

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
  policyVersionId?: string;
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
    const txResult: any = await db.transaction(async (tx: any) => {
      // 1. Acquire row lock on mentor profile: verifies approval and prevents concurrent DB operations
      const mentorCheck: any = await tx.execute(sql`
        SELECT id, user_id, verification_status, is_accepting_bookings
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
          policy_version_id,
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
          ${input.priceInr === 0 ? 'free' : 'paid'},
          ${input.studentDiscussionPoints || null},
          ${input.resumeAttachmentUrl || null},
          ${input.policyVersionId || 'policy-v1'},
          ${roomId}
        )
        RETURNING id, student_user_id, mentor_profile_id, start_time_utc, end_time_utc, status, price_inr, payment_status, meeting_room_id;
      `);

      const booking = insertResult.rows?.[0] || insertResult?.[0];

      // 4. Insert ledger transaction for paid sessions
      if (input.priceInr > 0) {
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
      }

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

      return { success: true, booking, mentorUserId: mentor.user_id };
    });

    if (txResult.success && txResult.booking) {
      // 6. Real-time Multi-channel Notifications (Executed safely AFTER database transaction commits)
      try {
        await notificationService.dispatch({
          userId: input.studentUserId,
          title: "Session Confirmed! 📅",
          message: `Your mentorship session has been scheduled successfully. Meeting room ID: ${txResult.booking.meeting_room_id}.`,
          category: "bookings",
          priority: "high",
          actionUrl: "/dashboard/sessions",
          actionLabel: "View Session",
          channels: ["in_app", "sse"],
        });

        if (txResult.mentorUserId) {
          await notificationService.dispatch({
            userId: txResult.mentorUserId,
            title: "New Mentorship Booking 🚀",
            message: `A student has booked a ${input.serviceType.replace(/_/g, " ")} session with you.`,
            category: "bookings",
            priority: "high",
            actionUrl: "/mentor/dashboard",
            actionLabel: "Open Dashboard",
            channels: ["in_app", "sse"],
          });

          await notificationService.scheduleBookingReminders({
            id: txResult.booking.id,
            studentUserId: input.studentUserId,
            mentorUserId: txResult.mentorUserId,
            startTime: new Date(input.startTimeUtc),
            title: input.serviceType,
          });
        }
      } catch (notifErr) {
        console.error("Non-blocking notification dispatch error:", notifErr);
      }
    }

    return txResult;
  });
}

/**
 * Cancels a booking and updates ledger refund status atomically.
 */
export async function cancelBookingInDb(bookingId: string, reason: string) {
  const db = getDb();
  await db.transaction(async (tx: any) => {
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
  });

  try {
    await notificationService.cancelBookingReminders(bookingId);
  } catch (err) {
    console.error("Error cancelling booking reminders:", err);
  }

  return { success: true };
}

/**
 * Reschedules an existing booking, invalidates obsolete reminders, and schedules new ones.
 */
export async function rescheduleBookingInDb(
  bookingId: string,
  newStartTimeUtc: string,
  newEndTimeUtc: string
) {
  const db = getDb();
  let booking: any = null;

  await db.transaction(async (tx: any) => {
    // 1. Fetch existing booking
    const bookingQuery: any = await tx.execute(sql`
      SELECT b.id, b.student_user_id, b.mentor_profile_id, b.service_type, m.user_id as mentor_user_id
      FROM bookings b
      JOIN mentor_profiles m ON m.id = b.mentor_profile_id
      WHERE b.id = ${bookingId}
      FOR UPDATE;
    `);

    booking = bookingQuery.rows?.[0] || bookingQuery?.[0];
    if (!booking) {
      return;
    }

    // 2. Update booking record
    await tx.execute(sql`
      UPDATE bookings
      SET start_time_utc = ${newStartTimeUtc},
          end_time_utc = ${newEndTimeUtc},
          status = 'confirmed',
          updated_at = now()
      WHERE id = ${bookingId};
    `);

    // 3. Record outbox event
    await tx.execute(sql`
      INSERT INTO outbox_events (event_type, payload, status)
      VALUES (
        'booking.rescheduled',
        ${JSON.stringify({ bookingId, newStartTimeUtc, newEndTimeUtc })},
        'pending'
      );
    `);
  });

  if (!booking) {
    return { success: false, error: "Booking not found" };
  }

  // 4. Cancel obsolete pending reminders and schedule new reminders (safely outside transaction)
  try {
    await notificationService.cancelBookingReminders(bookingId);

    await notificationService.scheduleBookingReminders({
      id: bookingId,
      studentUserId: booking.student_user_id,
      mentorUserId: booking.mentor_user_id,
      startTime: new Date(newStartTimeUtc),
      title: booking.service_type || "Mentorship Session",
    });

    // 5. Notify both parties
    await notificationService.dispatch({
      userId: booking.student_user_id,
      title: "Session Rescheduled 🔄",
      message: `Your session has been moved to ${new Date(newStartTimeUtc).toLocaleString("en-IN")}.`,
      category: "bookings",
      priority: "high",
      actionUrl: "/dashboard/sessions",
      actionLabel: "View New Time",
      idempotencyKey: `reschedule-${bookingId}-${newStartTimeUtc}-student`,
      channels: ["in_app", "sse"],
    });

    if (booking.mentor_user_id) {
      await notificationService.dispatch({
        userId: booking.mentor_user_id,
        title: "Session Rescheduled 🔄",
        message: `The session with your student was rescheduled to ${new Date(newStartTimeUtc).toLocaleString("en-IN")}.`,
        category: "bookings",
        priority: "high",
        actionUrl: "/mentor/dashboard",
        actionLabel: "View Schedule",
        idempotencyKey: `reschedule-${bookingId}-${newStartTimeUtc}-mentor`,
        channels: ["in_app", "sse"],
      });
    }
  } catch (notifErr) {
    console.error("Non-blocking notification error on reschedule:", notifErr);
  }

  return { success: true };
}
