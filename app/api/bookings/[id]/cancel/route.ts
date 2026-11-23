export const dynamic = "force-dynamic";
/**
 * MentorMaze Booking Cancellation API
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Evaluates cancellation policy, triggers automatic refund if eligible,
 * cancels scheduled reminders, and notifies student and mentor.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import { BookingStateMachine } from "@/lib/db/booking-state-machine";
import { PolicyEngine } from "@/lib/policies/policy-engine";
import { paymentGateway } from "@/lib/payments/adapter";
import { notificationService } from "@/lib/notifications/service";
import { requireAuth, verifyBookingOwnership } from "@/lib/auth/server-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 0. Enforce server-side authentication
    const auth = await requireAuth(req);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }
    const user = auth.user;

    await initializeDatabaseSchema();
    const bookingId = params.id;
    const body = await req.json().catch(() => ({}));
    const { reason = "User requested cancellation" } = body;

    const db = getDb();

    // 1. Lock and inspect booking record
    const bookingQuery: any = await db.execute(sql`
      SELECT b.id, b.student_user_id, b.mentor_profile_id, b.status, b.payment_status,
             b.price_inr, b.amount_paise, b.start_time_utc, b.end_time_utc, b.policy_version_id,
             mp.user_id as mentor_user_id
      FROM bookings b
      JOIN mentor_profiles mp ON mp.id = b.mentor_profile_id
      WHERE b.id = ${bookingId}
      LIMIT 1;
    `);

    const booking = bookingQuery.rows?.[0] || bookingQuery?.[0];
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    // 1.1 Enforce strict resource ownership (Student owner, assigned Mentor, or Admin)
    const ownership = verifyBookingOwnership(
      {
        student_user_id: booking.student_user_id,
        mentor_user_id: booking.mentor_user_id,
        mentor_profile_id: booking.mentor_profile_id,
      },
      user
    );

    if (!ownership.authorized) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to cancel this booking." },
        { status: 403 }
      );
    }

    if (booking.status === "cancelled") {
      return NextResponse.json({ success: true, message: "Booking already cancelled." });
    }

    // 2. Evaluate Cancellation Policy
    const policyEval = await PolicyEngine.evaluateCancellation(
      booking.start_time_utc,
      booking.policy_version_id
    );

    // 3. Perform cancellation transition in state machine using verified server identity
    const cancelTransition = await BookingStateMachine.transition(bookingId, "cancelled", {
      actorId: user.id,
      actorRole: (user.role === "super_admin" ? "admin" : user.role) as "student" | "mentor" | "admin",
      reason: `${reason} (${policyEval.reasonNote})`,
      metadata: policyEval,
    });

    if (!cancelTransition.success) {
      return NextResponse.json({ error: cancelTransition.error }, { status: 400 });
    }

    let refundInfo: any = null;

    // 4. Trigger refund if eligible and booking was paid
    if (booking.payment_status === "paid" && policyEval.isEligibleForRefund && policyEval.refundPercent > 0) {
      const grossPaise = booking.amount_paise > 0 ? booking.amount_paise : booking.price_inr * 100;
      const refundPaise = Math.round((grossPaise * policyEval.refundPercent) / 100);
      const refundInr = Math.round(refundPaise / 100);

      const refundResult = await paymentGateway.createRefund({
        orderId: `order_cf_${bookingId}`,
        refundAmount: refundInr,
        refundReason: policyEval.reasonNote,
      });

      await db.execute(sql`
        UPDATE bookings
        SET payment_status = ${policyEval.refundPercent === 100 ? "refunded" : "partially_refunded"},
            updated_at = now()
        WHERE id = ${bookingId};
      `);

      await db.execute(sql`
        UPDATE ledger_transactions
        SET status = ${policyEval.refundPercent === 100 ? "refunded" : "partially_refunded"},
            refund_amount_inr = ${refundInr},
            refund_reason = ${policyEval.reasonNote},
            settled_at = now()
        WHERE booking_id = ${bookingId};
      `);

      refundInfo = {
        refundId: refundResult.refundId,
        refundInr,
        refundPercent: policyEval.refundPercent,
      };
    }

    // 5. Cancel scheduled reminders and notify parties
    try {
      await notificationService.cancelBookingReminders(bookingId);

      await notificationService.dispatch({
        userId: booking.student_user_id,
        title: "Session Cancelled",
        message: `Your booking was cancelled. ${refundInfo ? `₹${refundInfo.refundInr} refund has been initiated.` : "No refund was eligible based on cancellation cutoff."}`,
        category: "bookings",
        priority: "high",
        actionUrl: "/dashboard/sessions",
        actionLabel: "View Details",
      });

      if (booking.mentor_user_id) {
        await notificationService.dispatch({
          userId: booking.mentor_user_id,
          title: "Session Cancelled",
          message: `The booking for ${new Date(booking.start_time_utc).toLocaleString("en-IN")} was cancelled by the student.`,
          category: "bookings",
          priority: "high",
          actionUrl: "/mentor/dashboard",
          actionLabel: "View Schedule",
        });
      }
    } catch (e) {
      console.warn("Non-fatal notification error on cancellation:", e);
    }

    return NextResponse.json({
      success: true,
      bookingId,
      status: "cancelled",
      policyEvaluation: policyEval,
      refund: refundInfo,
    });
  } catch (error: any) {
    console.error("[Booking Cancel API Error]:", error);
    return NextResponse.json(
      { error: "Failed to cancel booking.", details: error.message },
      { status: 500 }
    );
  }
}

