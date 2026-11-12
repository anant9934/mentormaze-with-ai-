/**
 * MentorMaze Authoritative Booking State Machine & PostgreSQL Concurrency Engine
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Implements strict, database-level row-locked transitions across all 10 authoritative states:
 * draft -> held -> pending_payment -> confirmed -> in_progress -> completed -> cancelled -> expired -> no_show -> disputed
 * 
 * Includes append-only auditing in `booking_events`.
 */

import { getDb, initializeDatabaseSchema } from "./index";
import { sql } from "drizzle-orm";
import { MentorLockManager } from "./concurrency";
import { notificationService } from "@/lib/notifications/service";
import { PolicyEngine } from "@/lib/policies/policy-engine";

export type BookingStatus =
  | "draft"
  | "held"
  | "pending_payment"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "expired"
  | "no_show"
  | "disputed";

export type ActorRole = "student" | "mentor" | "admin" | "system";

export interface StateTransitionContext {
  actorId?: string;
  actorRole: ActorRole;
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Authoritative Transition Matrix
 * Defines all allowable state transitions in MentorMaze.
 */
export const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  draft: ["held", "cancelled"],
  held: ["pending_payment", "confirmed", "expired", "cancelled"],
  pending_payment: ["confirmed", "expired", "cancelled"],
  confirmed: ["in_progress", "cancelled", "no_show", "rescheduled" as any],
  in_progress: ["completed", "disputed"],
  completed: ["disputed"],
  cancelled: [], // Terminal
  expired: [],   // Terminal
  no_show: ["disputed"],
  disputed: ["completed", "cancelled"], // resolved without refund -> completed, resolved with refund -> cancelled
};

export class BookingStateMachine {
  /**
   * Validate if a transition from `currentStatus` to `targetStatus` is permitted.
   */
  public static canTransition(currentStatus: BookingStatus, targetStatus: BookingStatus): boolean {
    if (currentStatus === targetStatus) return true;
    const allowed = ALLOWED_TRANSITIONS[currentStatus];
    return Array.isArray(allowed) && allowed.includes(targetStatus);
  }

  /**
   * Atomically transitions a booking from its current state to targetStatus.
   * Locked with PostgreSQL `SELECT ... FOR UPDATE` inside an ACID transaction.
   * Appends an event record to `booking_events`.
   */
  public static async transition(
    bookingId: string,
    targetStatus: BookingStatus,
    context: StateTransitionContext
  ): Promise<{ success: boolean; currentStatus?: BookingStatus; error?: string }> {
    await initializeDatabaseSchema();
    const db = getDb();

    return await db.transaction(async (tx: any) => {
      // 1. Lock the booking row
      const bookingQuery: any = await tx.execute(sql`
        SELECT id, student_user_id, mentor_profile_id, status, service_type, start_time_utc, end_time_utc, price_inr, amount_paise
        FROM bookings
        WHERE id = ${bookingId}
        FOR UPDATE;
      `);

      const booking = bookingQuery.rows?.[0] || bookingQuery?.[0];
      if (!booking) {
        return { success: false, error: `Booking ${bookingId} not found.` };
      }

      const currentStatus = booking.status as BookingStatus;

      // 2. Check transition validity
      if (currentStatus !== targetStatus && !this.canTransition(currentStatus, targetStatus)) {
        return {
          success: false,
          currentStatus,
          error: `Illegal state transition from "${currentStatus}" to "${targetStatus}".`,
        };
      }

      if (currentStatus === targetStatus) {
        return { success: true, currentStatus };
      }

      // 3. Update booking status
      const now = new Date();
      if (targetStatus === "in_progress") {
        await tx.execute(sql`
          UPDATE bookings
          SET status = ${targetStatus}, actual_start_time_utc = COALESCE(actual_start_time_utc, ${now}), updated_at = ${now}
          WHERE id = ${bookingId};
        `);
      } else if (targetStatus === "completed") {
        await tx.execute(sql`
          UPDATE bookings
          SET status = ${targetStatus}, actual_end_time_utc = COALESCE(actual_end_time_utc, ${now}), updated_at = ${now}
          WHERE id = ${bookingId};
        `);
      } else if (targetStatus === "cancelled") {
        await tx.execute(sql`
          UPDATE bookings
          SET status = ${targetStatus}, cancellation_reason = ${context.reason || "Cancelled"}, updated_at = ${now}
          WHERE id = ${bookingId};
        `);
      } else {
        await tx.execute(sql`
          UPDATE bookings
          SET status = ${targetStatus}, updated_at = ${now}
          WHERE id = ${bookingId};
        `);
      }

      // 4. Record append-only audit event in booking_events
      await tx.execute(sql`
        INSERT INTO booking_events (
          booking_id,
          event_type,
          from_status,
          to_status,
          actor_id,
          actor_role,
          metadata
        ) VALUES (
          ${bookingId},
          ${`transition_to_${targetStatus}`},
          ${currentStatus},
          ${targetStatus},
          ${context.actorId || null},
          ${context.actorRole},
          ${JSON.stringify({ ...context.metadata, reason: context.reason })}
        );
      `);

      return { success: true, currentStatus: targetStatus };
    });
  }

  /**
   * Confirms payment for a held or pending_payment booking atomically.
   * Updates booking to confirmed, marks payment_status = paid, creates/updates ledger transaction.
   */
  public static async confirmPayment(
    bookingId: string,
    paymentDetails: {
      orderId: string;
      paymentId: string;
      amountPaise: number;
      paymentProvider?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    await initializeDatabaseSchema();
    const db = getDb();

    const txResult: any = await db.transaction(async (tx: any) => {
      // 1. Lock booking
      const bookingQuery: any = await tx.execute(sql`
        SELECT b.id, b.student_user_id, b.mentor_profile_id, b.status, b.payment_status, b.price_inr, b.amount_paise, b.service_type, b.start_time_utc, b.end_time_utc, b.policy_version_id,
               m.user_id as mentor_user_id
        FROM bookings b
        JOIN mentor_profiles m ON m.id = b.mentor_profile_id
        WHERE b.id = ${bookingId}
        FOR UPDATE;
      `);

      const booking = bookingQuery.rows?.[0] || bookingQuery?.[0];
      if (!booking) {
        return { success: false, error: "Booking not found." };
      }

      if (booking.status === "confirmed" && booking.payment_status === "paid") {
        return { success: true }; // Idempotent return
      }

      if (booking.status === "cancelled" || booking.status === "expired") {
        return { success: false, error: `Cannot confirm payment for booking in "${booking.status}" status.` };
      }

      const policy = await PolicyEngine.getPolicy(booking.policy_version_id, tx);
      const grossPaise = paymentDetails.amountPaise || (booking.amount_paise > 0 ? booking.amount_paise : booking.price_inr * 100);
      const split = PolicyEngine.calculateSplitPaise(grossPaise, policy);
      const platformFeePaise = split.platformFeePaise;
      const mentorPayablePaise = split.mentorPayablePaise;

      const roomId = `room-${booking.mentor_profile_id.slice(0, 8)}-${Date.now()}`;

      // 2. Update booking
      await tx.execute(sql`
        UPDATE bookings
        SET status = 'confirmed',
            payment_status = 'paid',
            amount_paise = ${grossPaise},
            meeting_room_id = COALESCE(meeting_room_id, ${roomId}),
            updated_at = now()
        WHERE id = ${bookingId};
      `);

      // 3. Upsert ledger transaction
      const ltResult: any = await tx.execute(sql`
        INSERT INTO ledger_transactions (
          booking_id,
          student_user_id,
          mentor_profile_id,
          currency,
          gross_amount_inr,
          gross_amount_paise,
          platform_commission_percent,
          platform_fee_inr,
          platform_fee_paise,
          mentor_payable_inr,
          mentor_payable_paise,
          gateway_fee_paise,
          tax_paise,
          transaction_type,
          status,
          payment_provider,
          provider_order_id,
          provider_payment_id,
          settled_at
        ) VALUES (
          ${bookingId},
          ${booking.student_user_id},
          ${booking.mentor_profile_id},
          'INR',
          ${Math.round(grossPaise / 100)},
          ${grossPaise},
          ${policy.platformCommissionPercent},
          ${Math.round(platformFeePaise / 100)},
          ${platformFeePaise},
          ${Math.round(mentorPayablePaise / 100)},
          ${mentorPayablePaise},
          ${split.gatewayFeePaise},
          ${split.taxPaise},
          'payment',
          'settled',
          ${paymentDetails.paymentProvider || 'cashfree'},
          ${paymentDetails.orderId},
          ${paymentDetails.paymentId},
          now()
        )
        RETURNING id;
      `);

      const txId = ltResult.rows?.[0]?.id || ltResult?.[0]?.id;

      // 4. Double-Entry General Ledger Journal Entries
      // Debit: Cash/Gateway Receivables (+grossPaise)
      await tx.execute(sql`
        INSERT INTO journal_entries (
          transaction_id, booking_id, entry_type, account, amount_paise, currency, description
        ) VALUES (
          ${txId}, ${bookingId}, 'debit', 'cash_gateway', ${grossPaise}, 'INR', 'Payment collected via Cashfree'
        );
      `);

      // Credit: Mentor Payable (+mentorPayablePaise)
      await tx.execute(sql`
        INSERT INTO journal_entries (
          transaction_id, booking_id, entry_type, account, amount_paise, currency, description
        ) VALUES (
          ${txId}, ${bookingId}, 'credit', 'mentor_payable', ${mentorPayablePaise}, 'INR', 'Mentor earnings payable'
        );
      `);

      // Credit: Platform Revenue (+platformFeePaise)
      await tx.execute(sql`
        INSERT INTO journal_entries (
          transaction_id, booking_id, entry_type, account, amount_paise, currency, description
        ) VALUES (
          ${txId}, ${bookingId}, 'credit', 'platform_revenue', ${platformFeePaise}, 'INR', 'Platform commission earned'
        );
      `);

      // 4. Audit event in booking_events
      await tx.execute(sql`
        INSERT INTO booking_events (
          booking_id,
          event_type,
          from_status,
          to_status,
          actor_role,
          metadata
        ) VALUES (
          ${bookingId},
          'payment_confirmed',
          ${booking.status},
          'confirmed',
          'system',
          ${JSON.stringify({
            orderId: paymentDetails.orderId,
            paymentId: paymentDetails.paymentId,
            grossPaise,
            platformFeePaise,
            mentorPayablePaise
          })}
        );
      `);

      // 5. Enqueue outbox notification
      await tx.execute(sql`
        INSERT INTO outbox_events (event_type, payload, status)
        VALUES (
          'booking.confirmed',
          ${JSON.stringify({
            bookingId,
            studentUserId: booking.student_user_id,
            mentorUserId: booking.mentor_user_id,
            startTimeUtc: booking.start_time_utc,
            endTimeUtc: booking.end_time_utc,
            roomId,
            amountPaise: grossPaise
          })},
          'pending'
        );
      `);

      return {
        success: true,
        bookingId,
        studentUserId: booking.student_user_id,
        mentorUserId: booking.mentor_user_id,
        startTimeUtc: booking.start_time_utc,
        serviceType: booking.service_type,
        roomId,
      };
    });

    if (txResult.success) {
      // 6. Schedule booking reminders & dispatch notifications safely AFTER tx commits
      try {
        await notificationService.scheduleBookingReminders({
          id: bookingId,
          studentUserId: txResult.studentUserId,
          mentorUserId: txResult.mentorUserId,
          startTime: new Date(txResult.startTimeUtc),
          title: txResult.serviceType || "Mentorship Session",
        });

        await notificationService.dispatch({
          userId: txResult.studentUserId,
          title: "Session Confirmed! 📅",
          message: `Your booking has been confirmed. Meeting room: ${txResult.roomId}.`,
          category: "bookings",
          priority: "high",
          actionUrl: "/dashboard/sessions",
          actionLabel: "View Session",
          channels: ["in_app", "sse"],
        });

        if (txResult.mentorUserId) {
          await notificationService.dispatch({
            userId: txResult.mentorUserId,
            title: "New Confirmed Booking 🚀",
            message: `A student has booked and paid for a session with you.`,
            category: "bookings",
            priority: "high",
            actionUrl: "/mentor/dashboard",
            actionLabel: "View Schedule",
            channels: ["in_app", "sse"],
          });
        }
      } catch (e) {
        console.warn("[BookingStateMachine] Non-fatal notification error:", e);
      }
    }

    return { success: true };
  }
}
