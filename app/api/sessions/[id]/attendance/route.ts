/**
 * MentorMaze Session Attendance Tracking API
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Records participant join/leave/ping events and triggers automatic
 * transition from 'confirmed' to 'in_progress'.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import { BookingStateMachine } from "@/lib/db/booking-state-machine";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initializeDatabaseSchema();
    const bookingId = params.id;
    const body = await req.json();
    const { userId, role = "student", eventType = "joined", metadata = {} } = body;

    if (!userId || !bookingId) {
      return NextResponse.json({ error: "userId and bookingId are required." }, { status: 400 });
    }

    const db = getDb();

    // 1. Insert attendance event record
    await db.execute(sql`
      INSERT INTO session_attendance_events (
        booking_id,
        user_id,
        role,
        event_type,
        metadata
      ) VALUES (
        ${bookingId},
        ${userId},
        ${role},
        ${eventType},
        ${JSON.stringify(metadata)}
      );
    `);

    // 2. If participant is joining, check if session should transition to 'in_progress'
    if (eventType === "joined") {
      const bookingCheck: any = await db.execute(sql`
        SELECT status FROM bookings WHERE id = ${bookingId} LIMIT 1;
      `);
      const current = bookingCheck.rows?.[0] || bookingCheck?.[0];

      if (current && current.status === "confirmed") {
        await BookingStateMachine.transition(bookingId, "in_progress", {
          actorId: userId,
          actorRole: role as any,
          reason: `Participant ${role} joined the live WebRTC session room`,
          metadata: { userId, role },
        });
      }
    }

    return NextResponse.json({
      success: true,
      bookingId,
      eventType,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Session Attendance API Error]:", error);
    return NextResponse.json(
      { error: "Failed to record attendance event.", details: error.message },
      { status: 500 }
    );
  }
}
