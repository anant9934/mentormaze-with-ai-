/**
 * MentorMaze Cashfree Payment Order Creation Endpoint
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Coordinates with active slot holds before generating Cashfree checkout orders.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import { paymentGateway } from "@/lib/payments/adapter";

export async function POST(req: NextRequest) {
  try {
    await initializeDatabaseSchema();
    const body = await req.json();
    const { holdId, bookingId, customerPhone } = body;

    if (!holdId && !bookingId) {
      return NextResponse.json(
        { error: "Either holdId or bookingId must be provided." },
        { status: 400 }
      );
    }

    const db = getDb();
    const now = new Date();

    let targetBookingId = bookingId;
    let studentUserId = "";
    let mentorProfileId = "";
    let priceInr = 0;
    let serviceType = "";
    let startTimeUtc = "";
    let endTimeUtc = "";
    let sessionDurationMinutes = 30;

    // 1. If holdId is provided, verify hold is active and unexpired
    if (holdId) {
      const holdQuery: any = await db.execute(sql`
        SELECT h.id, h.mentor_profile_id, h.student_user_id, h.service_type,
               h.session_duration_minutes, h.start_time_utc, h.end_time_utc,
               h.expires_at, h.status,
               m.session_price_inr
        FROM booking_holds h
        JOIN mentor_profiles m ON m.id = h.mentor_profile_id
        WHERE h.id = ${holdId}
        LIMIT 1;
      `);

      const hold = holdQuery.rows?.[0] || holdQuery?.[0];
      if (!hold) {
        return NextResponse.json({ error: "Hold not found.", code: "HOLD_NOT_FOUND" }, { status: 404 });
      }

      if (hold.status !== "active" || new Date(hold.expires_at) <= now) {
        return NextResponse.json(
          { error: "Hold reservation has expired. Please select the time slot again.", code: "HOLD_EXPIRED" },
          { status: 410 }
        );
      }

      studentUserId = hold.student_user_id;
      mentorProfileId = hold.mentor_profile_id;
      serviceType = hold.service_type;
      sessionDurationMinutes = hold.session_duration_minutes;
      startTimeUtc = hold.start_time_utc;
      endTimeUtc = hold.end_time_utc;
      priceInr = hold.session_price_inr || 1500;

      // Check if a pending_payment booking already exists for this hold
      const existingBookingQuery: any = await db.execute(sql`
        SELECT id FROM bookings
        WHERE student_user_id = ${studentUserId}
          AND mentor_profile_id = ${mentorProfileId}
          AND start_time_utc = ${startTimeUtc}
          AND status IN ('held', 'pending_payment')
        LIMIT 1;
      `);

      const existingBooking = existingBookingQuery.rows?.[0] || existingBookingQuery?.[0];

      if (existingBooking) {
        targetBookingId = existingBooking.id;
      } else {
        // Create booking in 'pending_payment' status
        const insertBooking: any = await db.execute(sql`
          INSERT INTO bookings (
            student_user_id,
            mentor_profile_id,
            service_type,
            session_duration_minutes,
            start_time_utc,
            end_time_utc,
            status,
            price_inr,
            amount_paise,
            payment_status
          ) VALUES (
            ${studentUserId},
            ${mentorProfileId},
            ${serviceType},
            ${sessionDurationMinutes},
            ${startTimeUtc},
            ${endTimeUtc},
            'pending_payment',
            ${priceInr},
            ${priceInr * 100},
            'pending'
          )
          RETURNING id;
        `);
        const created = insertBooking.rows?.[0] || insertBooking?.[0];
        targetBookingId = created.id;
      }
    } else {
      // Lookup existing booking directly
      const bookingQuery: any = await db.execute(sql`
        SELECT b.id, b.student_user_id, b.mentor_profile_id, b.price_inr, b.amount_paise, b.status, b.payment_status
        FROM bookings b
        WHERE b.id = ${targetBookingId}
        LIMIT 1;
      `);
      const booking = bookingQuery.rows?.[0] || bookingQuery?.[0];
      if (!booking) {
        return NextResponse.json({ error: "Booking not found.", code: "BOOKING_NOT_FOUND" }, { status: 404 });
      }
      studentUserId = booking.student_user_id;
      mentorProfileId = booking.mentor_profile_id;
      priceInr = booking.price_inr;
    }

    // Fetch student user info for Cashfree customer details
    const userQuery: any = await db.execute(sql`
      SELECT id, email, display_name FROM users WHERE id = ${studentUserId} LIMIT 1;
    `);
    const studentUser = userQuery.rows?.[0] || userQuery?.[0] || {
      email: "student@example.com",
      display_name: "MentorMaze Student",
    };

    const orderId = `order_cf_${targetBookingId}`;
    const amountPaise = priceInr * 100;

    // Generate Cashfree Order
    const orderResult = await paymentGateway.createOrder({
      orderId,
      orderAmount: priceInr, // In INR rupees for standard CF API
      orderCurrency: "INR",
      customerEmail: studentUser.email,
      customerName: studentUser.display_name || "MentorMaze Student",
      customerPhone: customerPhone || "9999999999",
      bookingId: targetBookingId,
    });

    return NextResponse.json({
      success: true,
      bookingId: targetBookingId,
      orderId: orderResult.orderId,
      paymentSessionId: orderResult.paymentSessionId,
      cfOrderId: orderResult.cfOrderId,
      amountPaise,
      amountInr: priceInr,
      currency: "INR",
    });
  } catch (error: any) {
    console.error("[Create Payment Order Error]:", error);
    return NextResponse.json(
      { error: "Failed to create payment order.", details: error.message },
      { status: 500 }
    );
  }
}
