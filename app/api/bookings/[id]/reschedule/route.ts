/**
 * MentorMaze Booking Rescheduling API
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Evaluates rescheduling policy, validates slot availability,
 * increments reschedule count, updates timestamps, and synchronizes reminders.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import { PolicyEngine } from "@/lib/policies/policy-engine";
import { notificationService } from "@/lib/notifications/service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initializeDatabaseSchema();
    const bookingId = params.id;
    const body = await req.json();
    const { newStartTimeUtc, newEndTimeUtc, actorId, actorRole = "student" } = body;

    if (!newStartTimeUtc || !newEndTimeUtc) {
      return NextResponse.json(
        { error: "newStartTimeUtc and newEndTimeUtc are required." },
        { status: 400 }
      );
    }

    const db = getDb();

    // 1. Fetch booking record
    const bookingQuery: any = await db.execute(sql`
      SELECT b.id, b.student_user_id, b.mentor_profile_id, b.status, b.service_type,
             b.start_time_utc, b.end_time_utc, b.reschedule_count, b.policy_version_id,
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

    if (booking.status !== "confirmed") {
      return NextResponse.json(
        { error: `Only confirmed bookings can be rescheduled. Current status: ${booking.status}.` },
        { status: 400 }
      );
    }

    // 2. Evaluate Reschedule Policy
    const policyEval = await PolicyEngine.evaluateReschedule(
      booking.start_time_utc,
      booking.reschedule_count || 0,
      booking.policy_version_id
    );

    if (!policyEval.canReschedule) {
      return NextResponse.json({ error: policyEval.error, policyEval }, { status: 422 });
    }

    // 3. Check Slot Collision for Mentor at new requested time
    const collisionCheck: any = await db.execute(sql`
      SELECT id FROM bookings
      WHERE mentor_profile_id = ${booking.mentor_profile_id}
        AND id != ${bookingId}
        AND status IN ('confirmed', 'in_progress', 'completed')
        AND start_time_utc < ${newEndTimeUtc}
        AND end_time_utc > ${newStartTimeUtc}
      LIMIT 1;
    `);

    const hasCollision = (collisionCheck.rows?.length || collisionCheck?.length || 0) > 0;
    if (hasCollision) {
      return NextResponse.json(
        { error: "The newly requested time slot conflicts with another existing booking." },
        { status: 409 }
      );
    }

    // 4. Update Booking and record event in transaction
    const newRescheduleCount = (booking.reschedule_count || 0) + 1;

    await db.transaction(async (tx: any) => {
      await tx.execute(sql`
        UPDATE bookings
        SET start_time_utc = ${newStartTimeUtc},
            end_time_utc = ${newEndTimeUtc},
            reschedule_count = ${newRescheduleCount},
            updated_at = now()
        WHERE id = ${bookingId};
      `);

      await tx.execute(sql`
        INSERT INTO booking_events (
          booking_id, event_type, from_status, to_status, actor_id, actor_role, metadata
        ) VALUES (
          ${bookingId},
          'booking_rescheduled',
          'confirmed',
          'confirmed',
          ${actorId || null},
          ${actorRole},
          ${JSON.stringify({
            previousStartTimeUtc: booking.start_time_utc,
            previousEndTimeUtc: booking.end_time_utc,
            newStartTimeUtc,
            newEndTimeUtc,
            rescheduleCount: newRescheduleCount,
          })}
        );
      `);
    });

    // 5. Invalidate old reminders & schedule new reminders
    try {
      await notificationService.cancelBookingReminders(bookingId);

      await notificationService.scheduleBookingReminders({
        id: bookingId,
        studentUserId: booking.student_user_id,
        mentorUserId: booking.mentor_user_id,
        startTime: new Date(newStartTimeUtc),
        title: booking.service_type || "Mentorship Session",
      });

      await notificationService.dispatch({
        userId: booking.student_user_id,
        title: "Session Rescheduled 🔄",
        message: `Your session has been successfully moved to ${new Date(newStartTimeUtc).toLocaleString("en-IN")}.`,
        category: "bookings",
        priority: "high",
        actionUrl: "/dashboard/sessions",
        actionLabel: "View Session",
      });

      if (booking.mentor_user_id) {
        await notificationService.dispatch({
          userId: booking.mentor_user_id,
          title: "Session Rescheduled 🔄",
          message: `Your session was rescheduled to ${new Date(newStartTimeUtc).toLocaleString("en-IN")}.`,
          category: "bookings",
          priority: "high",
          actionUrl: "/mentor/dashboard",
          actionLabel: "View Schedule",
        });
      }
    } catch (e) {
      console.warn("Non-fatal notification error on reschedule:", e);
    }

    return NextResponse.json({
      success: true,
      bookingId,
      newStartTimeUtc,
      newEndTimeUtc,
      rescheduleCount: newRescheduleCount,
      remainingReschedules: policyEval.maxReschedules - newRescheduleCount,
    });
  } catch (error: any) {
    console.error("[Booking Reschedule API Error]:", error);
    return NextResponse.json(
      { error: "Failed to reschedule booking.", details: error.message },
      { status: 500 }
    );
  }
}
