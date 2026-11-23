export const dynamic = "force-dynamic";
/**
 * MentorMaze Admin Bookings Management API
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-auth";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import { BookingStateMachine, BookingStatus } from "@/lib/db/booking-state-machine";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin.errorResponse) return admin.errorResponse;

  try {
    await initializeDatabaseSchema();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = sql`
      SELECT b.id, b.service_type, b.session_duration_minutes, b.start_time_utc, b.end_time_utc,
             b.status, b.price_inr, b.amount_paise, b.payment_status, b.meeting_room_id,
             b.reschedule_count, b.cancellation_reason, b.created_at,
             u_student.display_name as student_name, u_student.email as student_email,
             u_mentor.display_name as mentor_name, u_mentor.email as mentor_email
      FROM bookings b
      JOIN users u_student ON u_student.id = b.student_user_id
      JOIN mentor_profiles mp ON mp.id = b.mentor_profile_id
      JOIN users u_mentor ON u_mentor.id = mp.user_id
    `;

    if (status && status !== "all") {
      query = sql`
        SELECT b.id, b.service_type, b.session_duration_minutes, b.start_time_utc, b.end_time_utc,
               b.status, b.price_inr, b.amount_paise, b.payment_status, b.meeting_room_id,
               b.reschedule_count, b.cancellation_reason, b.created_at,
               u_student.display_name as student_name, u_student.email as student_email,
               u_mentor.display_name as mentor_name, u_mentor.email as mentor_email
        FROM bookings b
        JOIN users u_student ON u_student.id = b.student_user_id
        JOIN mentor_profiles mp ON mp.id = b.mentor_profile_id
        JOIN users u_mentor ON u_mentor.id = mp.user_id
        WHERE b.status = ${status}
        ORDER BY b.created_at DESC;
      `;
    } else {
      query = sql`
        SELECT b.id, b.service_type, b.session_duration_minutes, b.start_time_utc, b.end_time_utc,
               b.status, b.price_inr, b.amount_paise, b.payment_status, b.meeting_room_id,
               b.reschedule_count, b.cancellation_reason, b.created_at,
               u_student.display_name as student_name, u_student.email as student_email,
               u_mentor.display_name as mentor_name, u_mentor.email as mentor_email
        FROM bookings b
        JOIN users u_student ON u_student.id = b.student_user_id
        JOIN mentor_profiles mp ON mp.id = b.mentor_profile_id
        JOIN users u_mentor ON u_mentor.id = mp.user_id
        ORDER BY b.created_at DESC;
      `;
    }

    const result: any = await db.execute(query);
    const bookings = result.rows || result || [];

    return NextResponse.json({
      success: true,
      bookings,
    });
  } catch (error: any) {
    console.error("[Admin Bookings API Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings.", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin.errorResponse) return admin.errorResponse;

  try {
    await initializeDatabaseSchema();
    const body = await req.json();
    const { action, bookingId, targetStatus, reason, adminUserId = "admin-1" } = body;

    if (action === "override_status") {
      if (!bookingId || !targetStatus) {
        return NextResponse.json({ error: "bookingId and targetStatus required" }, { status: 400 });
      }

      const result = await BookingStateMachine.transition(bookingId, targetStatus as BookingStatus, {
        actorId: adminUserId,
        actorRole: "admin",
        reason: reason || "Administrative override",
      });

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("[Admin Bookings POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to perform booking action.", details: error.message },
      { status: 500 }
    );
  }
}
