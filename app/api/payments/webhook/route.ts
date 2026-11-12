import { NextRequest, NextResponse } from "next/server";
import { paymentGateway } from "@/lib/payments/adapter";
import { store } from "@/lib/data/store";

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

    const eventType = payload?.type || payload?.event;
    const orderId = payload?.data?.order?.order_id || payload?.orderId;
    const paymentStatus = payload?.data?.payment?.payment_status || "SUCCESS";

    // Idempotency: Check if already processed
    const bookingId = orderId?.replace("order_cf_", "");
    if (bookingId) {
      const booking = store.getBookingById(bookingId);
      if (booking && booking.paymentStatus === "paid" && paymentStatus === "SUCCESS") {
        // Idempotent early exit: Already processed
        return NextResponse.json({ received: true, message: "Already processed" });
      }

      if (booking && paymentStatus === "SUCCESS") {
        booking.paymentStatus = "paid";
        booking.status = "confirmed";
      }
    }

    return NextResponse.json({
      received: true,
      status: "processed",
      orderId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal processing error", message: err.message }, { status: 500 });
  }
}

