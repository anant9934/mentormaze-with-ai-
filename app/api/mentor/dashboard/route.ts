import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server-auth";
import { getDb, schema } from "@/lib/db";
import { sql, eq } from "drizzle-orm";
import { BookingStateMachine, BookingStatus } from "@/lib/db/booking-state-machine";
import { MentorLockManager } from "@/lib/db/concurrency";
import { notificationService } from "@/lib/notifications/service";
import { paymentGateway } from "@/lib/payments/adapter";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Valid authentication session required." },
        { status: 401 }
      );
    }

    const db = getDb();

    // Verify caller has a mentor profile
    const profileResult: any = await db.execute(sql`
      SELECT 
        mp.id,
        mp.user_id as "userId",
        u.display_name as "name",
        u.avatar_url as "avatarUrl",
        mp.headline,
        mp.organization,
        mp.current_role as "currentRole",
        mp.rating,
        mp.total_sessions as "totalSessions",
        mp.total_mentees as "totalMentees",
        mp.verification_status as "verificationStatus",
        mp.is_accepting_bookings as "isAcceptingBookings"
      FROM mentor_profiles mp
      JOIN users u ON u.id = mp.user_id
      WHERE mp.user_id = ${session.id}
      LIMIT 1;
    `);

    const mentor = profileResult.rows?.[0] || profileResult?.[0];
    if (!mentor) {
      return NextResponse.json(
        { success: false, error: "Forbidden: No mentor profile found for this account." },
        { status: 403 }
      );
    }

    // 1. Fetch upcoming confirmed/pending sessions in the next 7 days
    const upcomingCountResult: any = await db.execute(sql`
      SELECT count(*)::int as count
      FROM bookings
      WHERE mentor_profile_id = ${mentor.id}
        AND status IN ('confirmed', 'pending')
        AND start_time_utc >= now()
        AND start_time_utc <= now() + interval '7 days';
    `);
    const upcomingSessionsCount = upcomingCountResult.rows?.[0]?.count || 0;

    // 2. Fetch today's session spotlight
    const todaySessionResult: any = await db.execute(sql`
      SELECT 
        b.id,
        b.service_type as "serviceType",
        b.session_duration_minutes as "sessionDurationMinutes",
        b.start_time_utc as "startTimeUtc",
        b.end_time_utc as "endTimeUtc",
        b.status,
        b.student_discussion_points as "discussionPoints",
        u.display_name as "studentName",
        u.avatar_url as "studentAvatarUrl"
      FROM bookings b
      JOIN users u ON u.id = b.student_user_id
      WHERE b.mentor_profile_id = ${mentor.id}
        AND b.status = 'confirmed'
        AND b.start_time_utc >= now() - interval '2 hours'
        AND b.start_time_utc <= now() + interval '24 hours'
      ORDER BY b.start_time_utc ASC
      LIMIT 1;
    `);
    const todaySession = todaySessionResult.rows?.[0] || todaySessionResult?.[0] || null;

    // 3. Fetch pending booking requests
    const requestsResult: any = await db.execute(sql`
      SELECT 
        b.id,
        b.service_type as "serviceType",
        b.session_duration_minutes as "durationMinutes",
        b.start_time_utc as "startTimeUtc",
        b.status,
        b.student_discussion_points as "topic",
        u.display_name as "studentName",
        u.avatar_url as "studentAvatarUrl"
      FROM bookings b
      JOIN users u ON u.id = b.student_user_id
      WHERE b.mentor_profile_id = ${mentor.id}
        AND b.status = 'pending'
      ORDER BY b.created_at DESC
      LIMIT 10;
    `);

    const bookingRequests = (requestsResult.rows || requestsResult || []).map((r: any) => ({
      id: r.id,
      studentName: r.studentName || "Student Mentee",
      topic: r.topic || "Career Guidance & 1:1 Discussion",
      duration: `${r.durationMinutes || 30} min`,
      time: new Date(r.startTimeUtc).toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }),
      status: r.status,
      avatar: r.studentAvatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    }));

    return NextResponse.json({
      success: true,
      mentor: {
        id: mentor.id,
        userId: mentor.userId,
        name: mentor.name,
        headline: mentor.headline,
        organization: mentor.organization,
        currentRole: mentor.currentRole,
        rating: Number(mentor.rating) || 5.0,
        totalSessions: Number(mentor.totalSessions) || 0,
        totalMentees: Number(mentor.totalMentees) || 0,
        verificationStatus: mentor.verificationStatus,
      },
      stats: {
        upcomingSessions: upcomingSessionsCount,
        totalConducted: Number(mentor.totalSessions) || 0,
        studentRating: Number(mentor.rating) || 5.0,
      },
      todaySession,
      bookingRequests,
    });
  } catch (error: any) {
    console.error("[API /api/mentor/dashboard GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load mentor dashboard" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Valid authentication session required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action, bookingId, reason } = body;

    if (!bookingId || !action || !["accept", "decline"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "bookingId and valid action ('accept' or 'decline') required." },
        { status: 400 }
      );
    }

    const db = getDb();

    // 1. Verify caller owns this mentor profile and fetch booking details
    const verifyResult: any = await db.execute(sql`
      SELECT 
        b.id,
        b.student_user_id as "studentUserId",
        b.mentor_profile_id as "mentorProfileId",
        b.status,
        b.service_type as "serviceType",
        b.start_time_utc as "startTimeUtc",
        b.end_time_utc as "endTimeUtc",
        b.meeting_room_id as "meetingRoomId",
        mp.user_id as "mentorUserId"
      FROM bookings b
      JOIN mentor_profiles mp ON mp.id = b.mentor_profile_id
      WHERE b.id = ${bookingId}
      LIMIT 1;
    `);

    const booking = verifyResult.rows?.[0] || verifyResult?.[0];
    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found." },
        { status: 404 }
      );
    }

    // Enforce strict mentor ownership
    if (booking.mentorUserId !== session.id && session.role !== "admin" && session.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: You are not authorized to manage bookings for another mentor." },
        { status: 403 }
      );
    }

    const mentorProfileId = booking.mentorProfileId;

    // 2. Concurrency Lock: Database-level row locking inside an ACID transaction
    // Uses MentorLockManager for in-process queueing plus PostgreSQL row-level locks (FOR UPDATE)
    // to guarantee mutual exclusion across horizontally scaled backend instances.
    const result = await MentorLockManager.acquire(mentorProfileId, async () => {
      return await db.transaction(async (tx: any) => {
        // 2.1 Cross-instance mutual exclusion: Lock mentor profile row in PostgreSQL
        await tx.execute(sql`
          SELECT id FROM mentor_profiles WHERE id = ${mentorProfileId} FOR UPDATE;
        `);

        // 2.2 Lock booking row inside transaction
        const lockResult: any = await tx.execute(sql`
          SELECT id, status, payment_status, price_inr, amount_paise, start_time_utc, end_time_utc, meeting_room_id
          FROM bookings
          WHERE id = ${bookingId}
          FOR UPDATE;
        `);
        const lockedBooking = lockResult.rows?.[0] || lockResult?.[0];

        const currentStatus = lockedBooking.status as BookingStatus;

        if (action === "accept") {
          // Idempotent check
          if (currentStatus === "confirmed") {
            return { success: true, bookingId, status: "confirmed", message: "Booking is already confirmed." };
          }

          // State transition legality check
          if (!BookingStateMachine.canTransition(currentStatus, "confirmed")) {
            return {
              success: false,
              statusCode: 409,
              error: `Illegal transition: Cannot accept a booking currently in '${currentStatus}' status.`,
            };
          }

          // Availability Conflict Check: Double-booking prevention
          const conflictResult: any = await tx.execute(sql`
            SELECT id FROM bookings
            WHERE mentor_profile_id = ${mentorProfileId}
              AND status = 'confirmed'
              AND id != ${bookingId}
              AND start_time_utc < ${lockedBooking.end_time_utc}
              AND end_time_utc > ${lockedBooking.start_time_utc}
            LIMIT 1;
          `);

          const hasConflict = (conflictResult.rows?.length || conflictResult?.length || 0) > 0;
          if (hasConflict) {
            return {
              success: false,
              statusCode: 409,
              error: "Schedule conflict: Another session is already confirmed during this time interval.",
            };
          }

          const roomId = lockedBooking.meeting_room_id || `room-${mentorProfileId.slice(0, 8)}-${Date.now()}`;

          // Transition status via state machine
          await tx.execute(sql`
            UPDATE bookings
            SET status = 'confirmed',
                meeting_room_id = COALESCE(meeting_room_id, ${roomId}),
                updated_at = now()
            WHERE id = ${bookingId};
          `);

          // Audit in booking_events
          await tx.execute(sql`
            INSERT INTO booking_events (
              booking_id, event_type, from_status, to_status, actor_id, actor_role, metadata
            ) VALUES (
              ${bookingId},
              'transition_to_confirmed',
              ${currentStatus},
              'confirmed',
              ${session.id},
              'mentor',
              ${JSON.stringify({ reason: reason || "Accepted by mentor via dashboard" })}
            );
          `);

          // Enqueue outbox event for calendar sync & email notification
          await tx.execute(sql`
            INSERT INTO outbox_events (event_type, payload, status)
            VALUES (
              'booking.confirmed',
              ${JSON.stringify({
                bookingId,
                studentUserId: booking.studentUserId,
                mentorUserId: session.id,
                startTimeUtc: lockedBooking.start_time_utc,
                endTimeUtc: lockedBooking.end_time_utc,
                roomId,
              })},
              'pending'
            );
          `);

          return {
            success: true,
            bookingId,
            status: "confirmed",
            roomId,
            studentUserId: booking.studentUserId,
            startTimeUtc: lockedBooking.start_time_utc,
            serviceType: booking.serviceType,
            message: "Session request accepted.",
          };
        } else {
          // Action: decline
          if (currentStatus === "cancelled") {
            return { success: true, bookingId, status: "cancelled", message: "Booking is already cancelled." };
          }

          if (currentStatus === "confirmed") {
            return {
              success: false,
              statusCode: 409,
              error: "Cannot decline a booking that is already confirmed. Use cancellation flow for confirmed sessions.",
            };
          }

          if (!BookingStateMachine.canTransition(currentStatus, "cancelled")) {
            return {
              success: false,
              statusCode: 409,
              error: `Illegal transition: Cannot decline a booking currently in '${currentStatus}' status.`,
            };
          }

          const declineReason = reason || "Declined by mentor";

          await tx.execute(sql`
            UPDATE bookings
            SET status = 'cancelled',
                cancellation_reason = ${declineReason},
                updated_at = now()
            WHERE id = ${bookingId};
          `);

          // Separate payment and refund lifecycle handling:
          // Never mark a transaction refunded solely because an internal record exists.
          const isPaid = lockedBooking.payment_status === "paid" && (Number(lockedBooking.price_inr) > 0 || Number(lockedBooking.amount_paise) > 0);

          if (isPaid) {
            const refundAmountInr = Number(lockedBooking.price_inr) || Math.round(Number(lockedBooking.amount_paise) / 100);
            const refundResult = await paymentGateway.createRefund({
              orderId: `order_cf_${bookingId}`,
              refundAmount: refundAmountInr,
              refundReason: `Mentor declined booking: ${declineReason}`,
            });

            const refundStatus = refundResult.status === "SUCCESS" ? "refunded" : "refund_pending";

            await tx.execute(sql`
              UPDATE bookings
              SET payment_status = ${refundStatus}
              WHERE id = ${bookingId};
            `);

            await tx.execute(sql`
              UPDATE ledger_transactions
              SET status = ${refundStatus},
                  refund_amount_inr = ${refundAmountInr},
                  refund_reason = ${declineReason},
                  provider_payment_id = COALESCE(${refundResult.refundId}, provider_payment_id),
                  settled_at = now()
              WHERE booking_id = ${bookingId};
            `);

            await tx.execute(sql`
              INSERT INTO booking_events (
                booking_id, event_type, from_status, to_status, actor_id, actor_role, metadata
              ) VALUES (
                ${bookingId},
                'refund_initiated',
                ${lockedBooking.payment_status || 'paid'},
                ${refundStatus},
                ${session.id},
                'system',
                ${JSON.stringify({ refundId: refundResult.refundId, amountInr: refundAmountInr, status: refundStatus })}
              );
            `);
          } else {
            // Unpaid, pending, or free session: void pending ledger entries, do NOT mark refunded
            await tx.execute(sql`
              UPDATE bookings
              SET payment_status = 'cancelled'
              WHERE id = ${bookingId} AND payment_status != 'paid';
            `);

            await tx.execute(sql`
              UPDATE ledger_transactions
              SET status = 'cancelled', refund_reason = ${declineReason}
              WHERE booking_id = ${bookingId} AND status = 'pending';
            `);
          }

          // Audit in booking_events
          await tx.execute(sql`
            INSERT INTO booking_events (
              booking_id, event_type, from_status, to_status, actor_id, actor_role, metadata
            ) VALUES (
              ${bookingId},
              'transition_to_cancelled',
              ${currentStatus},
              'cancelled',
              ${session.id},
              'mentor',
              ${JSON.stringify({ reason: declineReason })}
            );
          `);

          // Outbox event
          await tx.execute(sql`
            INSERT INTO outbox_events (event_type, payload, status)
            VALUES (
              'booking.cancelled',
              ${JSON.stringify({ bookingId, reason: declineReason, studentUserId: booking.studentUserId })},
              'pending'
            );
          `);

          return {
            success: true,
            bookingId,
            status: "cancelled",
            studentUserId: booking.studentUserId,
            message: "Session request declined.",
          };
        }
      });
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 400 }
      );
    }

    // Asynchronously dispatch real-time notifications outside transaction
    try {
      if (action === "accept") {
        await notificationService.dispatch({
          userId: result.studentUserId,
          title: "Session Confirmed! 📅",
          message: "Your mentor has accepted the booking request.",
          category: "bookings",
          priority: "high",
          actionUrl: "/dashboard/sessions",
          actionLabel: "View Session",
          channels: ["in_app", "sse"],
        });

        if (result.startTimeUtc) {
          await notificationService.scheduleBookingReminders({
            id: bookingId,
            studentUserId: result.studentUserId,
            mentorUserId: session.id,
            startTime: new Date(result.startTimeUtc),
            title: result.serviceType || "Mentorship Session",
          });
        }
      } else {
        await notificationService.cancelBookingReminders(bookingId);
        await notificationService.dispatch({
          userId: result.studentUserId,
          title: "Session Request Declined",
          message: "Your mentor was unable to accept this booking request.",
          category: "bookings",
          priority: "normal",
          actionUrl: "/mentors",
          actionLabel: "Find Another Mentor",
          channels: ["in_app", "sse"],
        });
      }
    } catch (notifErr) {
      console.warn("[Mentor Dashboard POST] Non-fatal notification error:", notifErr);
    }

    return NextResponse.json({
      success: true,
      bookingId: result.bookingId,
      status: result.status,
      message: result.message,
    });
  } catch (error: any) {
    console.error("[API /api/mentor/dashboard POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process booking request" },
      { status: 500 }
    );
  }
}
