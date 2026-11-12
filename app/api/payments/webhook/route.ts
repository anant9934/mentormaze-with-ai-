/**
 * MentorMaze Cashfree Webhook Handler
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Implements HMAC-SHA256 signature verification, strict idempotency,
 * hold expiration & late payment auto-refund handling, and state machine transition to confirmed.
 */

import { NextRequest, NextResponse } from "next/server";
import { paymentGateway } from "@/lib/payments/adapter";
import { store } from "@/lib/data/store";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import { BookingStateMachine } from "@/lib/db/booking-state-machine";
import { notificationService } from "@/lib/notifications/service";

export async function POST(req: NextRequest) {
  try {
    await initializeDatabaseSchema();
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature") || "";
    const timestamp = req.headers.get("x-webhook-timestamp") || "";

    // 1. Signature Verification
    const isSignatureValid = paymentGateway.verifyWebhookSignature(rawBody, timestamp, signature);

    if (!isSignatureValid) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
    }

    const orderCurrency = payload?.data?.order?.order_currency || payload?.orderCurrency || "INR";
    if (orderCurrency !== "INR") {
      return NextResponse.json({ error: "CURRENCY_MISMATCH", message: "Only INR transactions are supported" }, { status: 400 });
    }

    const orderId = payload?.data?.order?.order_id || payload?.orderId;
    const paymentStatus = payload?.data?.payment?.payment_status || payload?.status || "SUCCESS";
    const paymentId = payload?.data?.payment?.cf_payment_id || payload?.paymentId || `pay_${Date.now()}`;
    const orderAmount = payload?.data?.order?.order_amount || payload?.orderAmount || 0;
    const amountPaise = orderAmount > 0 ? Math.round(orderAmount * 100) : 0;
    const eventId = payload?.event_id || payload?.data?.payment?.cf_payment_id || `evt_${orderId}_${paymentId}`;

    const db = getDb();

    // 2. Persistent Event Idempotency Check
    const existingWebhook: any = await db.execute(sql`
      SELECT id FROM webhook_events WHERE event_id = ${eventId} LIMIT 1;
    `);
    if ((existingWebhook.rows?.length || existingWebhook?.length || 0) > 0) {
      return NextResponse.json({ received: true, status: "already_processed", eventId });
    }

    // Extract booking ID from orderId format (order_cf_<bookingId> or order_<bookingId>)
    const bookingId = orderId?.replace("order_cf_", "")?.replace("order_", "");

    if (!bookingId) {
      return NextResponse.json({ received: true, message: "Ignored webhook without bookingId" });
    }

    // 2. Lock and inspect booking record
    const bookingQuery: any = await db.execute(sql`
      SELECT b.id, b.student_user_id, b.mentor_profile_id, b.status, b.payment_status,
             b.price_inr, b.amount_paise, b.start_time_utc, b.end_time_utc
      FROM bookings b
      WHERE b.id = ${bookingId}
      LIMIT 1;
    `);

    const booking = bookingQuery.rows?.[0] || bookingQuery?.[0];
    if (!booking) {
      return NextResponse.json({ error: "Booking not found", bookingId }, { status: 404 });
    }

    // 3. IDEMPOTENCY CHECK: If already confirmed & paid, return early with 200 OK
    if (booking.payment_status === "paid" && (booking.status === "confirmed" || booking.status === "in_progress" || booking.status === "completed")) {
      return NextResponse.json({
        received: true,
        message: "Already processed idempotently",
        bookingId,
        status: booking.status,
      });
    }

    // 4. Underpayment / Amount Verification
    const expectedPaise = booking.amount_paise > 0 ? booking.amount_paise : (booking.price_inr * 100);
    if (amountPaise > 0 && expectedPaise > 0 && amountPaise < expectedPaise) {
      return NextResponse.json({
        error: "UNDERPAYMENT_REJECTED",
        message: `Received ${amountPaise} paise, but booking requires ${expectedPaise} paise.`
      }, { status: 400 });
    }

    if (paymentStatus === "SUCCESS") {
      const now = new Date();

      // 4. Check if slot was held and whether the hold expired
      const holdCheck: any = await db.execute(sql`
        SELECT id, expires_at, status
        FROM booking_holds
        WHERE mentor_profile_id = ${booking.mentor_profile_id}
          AND student_user_id = ${booking.student_user_id}
          AND start_time_utc = ${booking.start_time_utc}
        ORDER BY created_at DESC
        LIMIT 1;
      `);

      const hold = holdCheck.rows?.[0] || holdCheck?.[0];
      const isHoldExpired = hold && (hold.status === "expired" || new Date(hold.expires_at) <= now);

      if (isHoldExpired) {
        // Check if another student has confirmed a booking on this time slot
        const collisionCheck: any = await db.execute(sql`
          SELECT id FROM bookings
          WHERE mentor_profile_id = ${booking.mentor_profile_id}
            AND id != ${bookingId}
            AND status IN ('confirmed', 'in_progress', 'completed')
            AND start_time_utc < ${booking.end_time_utc}
            AND end_time_utc > ${booking.start_time_utc}
          LIMIT 1;
        `);

        const isSlotTaken = (collisionCheck.rows?.length || collisionCheck?.length || 0) > 0;

        if (isSlotTaken) {
          // LATE PAYMENT CONFLICT: Slot was taken! Auto-refund the student immediately.
          const refundResult = await paymentGateway.createRefund({
            orderId,
            refundAmount: booking.price_inr,
            refundReason: "Late payment after hold expiration - slot was booked by another student",
          });

          await db.execute(sql`
            UPDATE bookings
            SET status = 'cancelled', payment_status = 'refunded',
                cancellation_reason = 'Late payment: Slot was reallocated after hold expired. Automatic 100% refund initiated.',
                updated_at = now()
            WHERE id = ${bookingId};
          `);

          await db.execute(sql`
            INSERT INTO booking_events (
              booking_id, event_type, from_status, to_status, actor_role, metadata
            ) VALUES (
              ${bookingId},
              'late_payment_auto_refunded',
              ${booking.status},
              'cancelled',
              'system',
              ${JSON.stringify({ orderId, paymentId, refundId: refundResult.refundId, amountPaise })}
            );
          `);

          await notificationService.dispatch({
            userId: booking.student_user_id,
            title: "Payment Received & Refunded ⚠️",
            message: `Your payment was completed after the slot hold expired and the time slot was booked. A 100% refund of ₹${booking.price_inr} has been automatically initiated.`,
            category: "payments",
            priority: "high",
            actionUrl: "/dashboard/sessions",
            actionLabel: "View Details",
          });

          return NextResponse.json({
            received: true,
            status: "auto_refunded",
            reason: "late_payment_slot_taken",
            refundId: refundResult.refundId,
          });
        }
      }

      // Slot is available or hold was still valid: Confirm the booking atomically!
      const confirmResult = await BookingStateMachine.confirmPayment(bookingId, {
        orderId,
        paymentId,
        amountPaise: amountPaise || booking.price_inr * 100,
        paymentProvider: "cashfree",
      });

      if (!confirmResult.success) {
        throw new Error(confirmResult.error || "Failed to confirm payment in state machine");
      }

      // Release/complete any associated hold
      if (hold) {
        await db.execute(sql`
          UPDATE booking_holds SET status = 'completed' WHERE id = ${hold.id};
        `);
      }

      // Also sync in-memory store for dev UI if present
      const memBooking = store.getBookingById(bookingId);
      if (memBooking) {
        memBooking.paymentStatus = "paid";
        memBooking.status = "confirmed";
      }

      // Record processed webhook event for persistent audit and idempotency
      await db.execute(sql`
        INSERT INTO webhook_events (
          provider, event_id, order_id, event_type, raw_payload, status
        ) VALUES (
          'cashfree', ${eventId}, ${orderId}, ${paymentStatus}, ${rawBody}, 'processed'
        ) ON CONFLICT (event_id) DO NOTHING;
      `);

      return NextResponse.json({
        received: true,
        status: "confirmed",
        bookingId,
        orderId,
      });
    } else if (paymentStatus === "FAILED") {
      await db.execute(sql`
        UPDATE bookings
        SET payment_status = 'failed', updated_at = now()
        WHERE id = ${bookingId};
      `);

      await db.execute(sql`
        INSERT INTO booking_events (
          booking_id, event_type, from_status, to_status, actor_role, metadata
        ) VALUES (
          ${bookingId},
          'payment_failed',
          ${booking.status},
          ${booking.status},
          'system',
          ${JSON.stringify({ orderId, paymentId })}
        );
      `);

      return NextResponse.json({
        received: true,
        status: "payment_failed",
        bookingId,
      });
    }

    return NextResponse.json({ received: true, status: "ignored" });
  } catch (err: any) {
    console.error("[Cashfree Webhook Error]:", err);
    return NextResponse.json(
      { error: "Internal processing error", message: err.message },
      { status: 500 }
    );
  }
}
