import { NextRequest, NextResponse } from "next/server";
import { paymentGateway } from "@/lib/payments/adapter";
import { store } from "@/lib/data/store";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature") || "";
    const timestamp = req.headers.get("x-webhook-timestamp") || "";

    // Signature Verification
    const isSignatureValid = paymentGateway.verifyWebhookSignature(rawBody, timestamp, signature);

    if (!isSignatureValid && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
    }

    const orderId = payload?.data?.order?.order_id || payload?.orderId;
    const paymentStatus = payload?.data?.payment?.payment_status || payload?.status || "SUCCESS";
    const paymentId = payload?.data?.payment?.cf_payment_id || payload?.paymentId || `pay_${Date.now()}`;

    // Extract booking ID
    const bookingId = orderId?.replace("order_cf_", "") || orderId?.replace("order_", "");

    if (bookingId) {
      const db = getDb();

      // Check PostgreSQL booking state for idempotency
      const bookingQuery: any = await db.execute(sql`
        SELECT id, payment_status, status FROM bookings WHERE id = ${bookingId} LIMIT 1;
      `);

      const dbBooking = bookingQuery.rows?.[0] || bookingQuery?.[0];

      // IDEMPOTENCY CHECK: If already paid, return early with 200 OK
      if (dbBooking && dbBooking.payment_status === "paid" && paymentStatus === "SUCCESS") {
        return NextResponse.json({ received: true, message: "Already processed idempotently" });
      }

      if (paymentStatus === "SUCCESS") {
        // Update database booking and ledger records
        await db.execute(sql`
          UPDATE bookings 
          SET payment_status = 'paid', status = 'confirmed', updated_at = now()
          WHERE id = ${bookingId};
        `);

        await db.execute(sql`
          UPDATE ledger_transactions 
          SET status = 'settled', provider_payment_id = ${paymentId}, settled_at = now()
          WHERE booking_id = ${bookingId};
        `);

        // Enqueue outbox notification
        await db.execute(sql`
          INSERT INTO outbox_events (event_type, payload, status)
          VALUES (
            'payment.succeeded',
            ${JSON.stringify({ orderId, bookingId, paymentId })},
            'pending'
          );
        `);

        // Also sync in-memory store for dev UI
        const memBooking = store.getBookingById(bookingId);
        if (memBooking) {
          memBooking.paymentStatus = "paid";
          memBooking.status = "confirmed";
        }
      }
    }

    return NextResponse.json({
      received: true,
      status: "processed",
      orderId,
    });
  } catch (err: any) {
    console.error("[Cashfree Webhook Error]:", err);
    return NextResponse.json({ error: "Internal processing error", message: err.message }, { status: 500 });
  }
}
