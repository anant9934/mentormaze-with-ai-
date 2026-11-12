/**
 * MentorMaze Payment Refund API
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Handles policy-driven and administrative refunds with double-entry ledger reconciliation in paise.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import { paymentGateway } from "@/lib/payments/adapter";
import { notificationService } from "@/lib/notifications/service";

export async function POST(req: NextRequest) {
  try {
    await initializeDatabaseSchema();
    const body = await req.json();
    const { bookingId, reason, refundPercent = 100, actorRole = "admin", actorId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    const db = getDb();

    // Lock booking and ledger transaction
    const bookingQuery: any = await db.execute(sql`
      SELECT b.id, b.student_user_id, b.mentor_profile_id, b.price_inr, b.amount_paise, b.payment_status, b.status,
             lt.provider_order_id, lt.gross_amount_inr, lt.mentor_payable_inr
      FROM bookings b
      LEFT JOIN ledger_transactions lt ON lt.booking_id = b.id
      WHERE b.id = ${bookingId}
      LIMIT 1;
    `);

    const booking = bookingQuery.rows?.[0] || bookingQuery?.[0];
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.payment_status === "refunded") {
      return NextResponse.json({ success: true, message: "Booking already refunded" });
    }

    const grossPaise = booking.amount_paise > 0 ? booking.amount_paise : booking.price_inr * 100;
    const refundPaise = Math.round((grossPaise * refundPercent) / 100);
    const refundInr = Math.round(refundPaise / 100);

    const orderId = booking.provider_order_id || `order_cf_${bookingId}`;

    // Execute refund through gateway adapter
    const refundResult = await paymentGateway.createRefund({
      orderId,
      refundAmount: refundInr,
      refundReason: reason || "Policy-driven or admin session refund",
    });

    const isFullRefund = refundPercent === 100;
    const newPaymentStatus = isFullRefund ? "refunded" : "partially_refunded";

    // Update booking and ledger in transaction
    await db.transaction(async (tx: any) => {
      await tx.execute(sql`
        UPDATE bookings
        SET payment_status = ${newPaymentStatus},
            updated_at = now()
        WHERE id = ${bookingId};
      `);

      // 1. Fetch original ledger transaction
      const origLtQuery: any = await tx.execute(sql`
        SELECT id, gross_amount_paise, platform_fee_paise, mentor_payable_paise, platform_commission_percent
        FROM ledger_transactions
        WHERE booking_id = ${bookingId} AND transaction_type = 'payment'
        ORDER BY created_at DESC
        LIMIT 1;
      `);
      const origLt = origLtQuery.rows?.[0] || origLtQuery?.[0];
      const commissionPercent = Number(origLt?.platform_commission_percent || 15.0);
      const platformFeeRefundPaise = Math.round((refundPaise * commissionPercent) / 100);
      const mentorRefundPaise = refundPaise - platformFeeRefundPaise;

      // 2. Insert reversing refund ledger transaction
      const refundLtResult: any = await tx.execute(sql`
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
          transaction_type,
          parent_transaction_id,
          status,
          refund_amount_inr,
          refund_amount_paise,
          refund_reason,
          payment_provider,
          provider_order_id,
          provider_payment_id,
          settled_at
        ) VALUES (
          ${bookingId},
          ${booking.student_user_id},
          ${booking.mentor_profile_id},
          'INR',
          -${refundInr},
          -${refundPaise},
          ${commissionPercent},
          -${Math.round(platformFeeRefundPaise / 100)},
          -${platformFeeRefundPaise},
          -${Math.round(mentorRefundPaise / 100)},
          -${mentorRefundPaise},
          'refund',
          ${origLt?.id || null},
          'refunded',
          ${refundInr},
          ${refundPaise},
          ${reason || "Refund issued"},
          'cashfree',
          ${orderId},
          ${refundResult.refundId},
          now()
        )
        RETURNING id;
      `);

      const refundTxId = refundLtResult.rows?.[0]?.id || refundLtResult?.[0]?.id;

      // 3. Double-entry reversing journal entries:
      // Debit: Mentor Payable (reduces liability to mentor)
      await tx.execute(sql`
        INSERT INTO journal_entries (
          transaction_id, booking_id, entry_type, account, amount_paise, currency, description
        ) VALUES (
          ${refundTxId}, ${bookingId}, 'debit', 'mentor_payable', ${mentorRefundPaise}, 'INR', 'Mentor payable reversal on refund'
        );
      `);

      // Debit: Platform Revenue (reduces recognized revenue)
      await tx.execute(sql`
        INSERT INTO journal_entries (
          transaction_id, booking_id, entry_type, account, amount_paise, currency, description
        ) VALUES (
          ${refundTxId}, ${bookingId}, 'debit', 'platform_revenue', ${platformFeeRefundPaise}, 'INR', 'Platform commission reversal on refund'
        );
      `);

      // Credit: Cash Gateway Receivables (cash refunded back to customer)
      await tx.execute(sql`
        INSERT INTO journal_entries (
          transaction_id, booking_id, entry_type, account, amount_paise, currency, description
        ) VALUES (
          ${refundTxId}, ${bookingId}, 'credit', 'cash_gateway', ${refundPaise}, 'INR', 'Gateway cash refund to student'
        );
      `);

      await tx.execute(sql`
        INSERT INTO booking_events (
          booking_id, event_type, from_status, to_status, actor_id, actor_role, metadata
        ) VALUES (
          ${bookingId},
          'refund_processed',
          ${booking.status},
          ${booking.status},
          ${actorId || null},
          ${actorRole},
          ${JSON.stringify({
            refundId: refundResult.refundId,
            refundPaise,
            refundInr,
            refundPercent,
            reason
          })}
        );
      `);
    });

    // Notify student of refund
    try {
      await notificationService.dispatch({
        userId: booking.student_user_id,
        title: "Refund Processed 💰",
        message: `A refund of ₹${refundInr} (${refundPercent}%) has been issued for your session.`,
        category: "payments",
        priority: "high",
        actionUrl: "/dashboard/sessions",
        actionLabel: "View Receipt",
      });
    } catch (notifErr) {
      console.warn("Non-fatal notification error on refund:", notifErr);
    }

    return NextResponse.json({
      success: true,
      refundId: refundResult.refundId,
      refundInr,
      refundPaise,
      newPaymentStatus,
    });
  } catch (error: any) {
    console.error("[Refund API Error]:", error);
    return NextResponse.json(
      { error: "Failed to process refund", details: error.message },
      { status: 500 }
    );
  }
}

