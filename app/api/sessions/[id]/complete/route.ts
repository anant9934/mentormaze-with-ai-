/**
 * MentorMaze Session Completion API
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Concludes a mentorship session or mock interview, transitioning booking to 'completed'
 * and updating actual_end_time_utc.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { BookingStateMachine } from "@/lib/db/booking-state-machine";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initializeDatabaseSchema();
    const bookingId = params.id;
    const body = await req.json().catch(() => ({}));
    const { actorId, actorRole = "mentor", reason = "Session concluded naturally" } = body;

    const result = await BookingStateMachine.transition(bookingId, "completed", {
      actorId,
      actorRole,
      reason,
      metadata: { completedAt: new Date().toISOString() },
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      bookingId,
      status: "completed",
    });
  } catch (error: any) {
    console.error("[Session Complete API Error]:", error);
    return NextResponse.json(
      { error: "Failed to conclude session.", details: error.message },
      { status: 500 }
    );
  }
}

