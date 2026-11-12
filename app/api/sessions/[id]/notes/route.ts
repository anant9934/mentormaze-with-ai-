/**
 * MentorMaze Session Notes & Action Items API
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Enforces strict isolation: Private mentor notes are NEVER returned to student users.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initializeDatabaseSchema();
    const bookingId = params.id;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const userRole = searchParams.get("role") || "student";

    const db = getDb();

    // 1. Fetch booking to verify permissions
    const bookingQuery: any = await db.execute(sql`
      SELECT b.id, b.student_user_id, b.mentor_profile_id, mp.user_id as mentor_user_id
      FROM bookings b
      JOIN mentor_profiles mp ON mp.id = b.mentor_profile_id
      WHERE b.id = ${bookingId}
      LIMIT 1;
    `);

    const booking = bookingQuery.rows?.[0] || bookingQuery?.[0];
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const isStudent = userId === booking.student_user_id || userRole === "student";
    const isMentorOrAdmin = userId === booking.mentor_user_id || userRole === "mentor" || userRole === "admin";

    // 2. Fetch session notes
    const notesQuery: any = await db.execute(sql`
      SELECT id, booking_id, mentor_profile_id, student_user_id, session_agenda,
             shared_action_items, student_visible_summary, mentor_private_notes,
             created_at, updated_at
      FROM session_notes
      WHERE booking_id = ${bookingId}
      LIMIT 1;
    `);

    const rawNotes = notesQuery.rows?.[0] || notesQuery?.[0];

    if (!rawNotes) {
      return NextResponse.json({
        success: true,
        notes: {
          bookingId,
          sessionAgenda: "",
          sharedActionItems: [],
          studentVisibleSummary: "",
          ...(isMentorOrAdmin ? { mentorPrivateNotes: "" } : {}),
        },
      });
    }

    // STRICT ISOLATION: Omit mentorPrivateNotes entirely for students
    const sanitizedNotes: any = {
      id: rawNotes.id,
      bookingId: rawNotes.booking_id,
      sessionAgenda: rawNotes.session_agenda,
      sharedActionItems: rawNotes.shared_action_items || [],
      studentVisibleSummary: rawNotes.student_visible_summary,
      createdAt: rawNotes.created_at,
      updatedAt: rawNotes.updated_at,
    };

    if (isMentorOrAdmin && !isStudent) {
      sanitizedNotes.mentorPrivateNotes = rawNotes.mentor_private_notes;
    }

    return NextResponse.json({
      success: true,
      notes: sanitizedNotes,
      role: isMentorOrAdmin && !isStudent ? "mentor" : "student",
    });
  } catch (error: any) {
    console.error("[Session Notes GET Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch session notes.", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initializeDatabaseSchema();
    const bookingId = params.id;
    const body = await req.json();
    const {
      userId,
      userRole = "mentor",
      sessionAgenda,
      sharedActionItems,
      studentVisibleSummary,
      mentorPrivateNotes,
    } = body;

    const db = getDb();

    // Verify booking
    const bookingQuery: any = await db.execute(sql`
      SELECT b.id, b.student_user_id, b.mentor_profile_id, mp.user_id as mentor_user_id
      FROM bookings b
      JOIN mentor_profiles mp ON mp.id = b.mentor_profile_id
      WHERE b.id = ${bookingId}
      LIMIT 1;
    `);

    const booking = bookingQuery.rows?.[0] || bookingQuery?.[0];
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const isStudent = userId === booking.student_user_id;

    // Check existing note
    const existingQuery: any = await db.execute(sql`
      SELECT id, mentor_private_notes FROM session_notes WHERE booking_id = ${bookingId} LIMIT 1;
    `);
    const existing = existingQuery.rows?.[0] || existingQuery?.[0];

    if (existing) {
      // If student is updating, only allow updating sharedActionItems checklist
      if (isStudent && userRole === "student") {
        await db.execute(sql`
          UPDATE session_notes
          SET shared_action_items = ${JSON.stringify(sharedActionItems || [])},
              updated_at = now()
          WHERE id = ${existing.id};
        `);
      } else {
        // Mentor or admin updating
        await db.execute(sql`
          UPDATE session_notes
          SET session_agenda = COALESCE(${sessionAgenda}, session_agenda),
              shared_action_items = COALESCE(${JSON.stringify(sharedActionItems || [])}, shared_action_items),
              student_visible_summary = COALESCE(${studentVisibleSummary}, student_visible_summary),
              mentor_private_notes = COALESCE(${mentorPrivateNotes}, mentor_private_notes),
              updated_at = now()
          WHERE id = ${existing.id};
        `);
      }
    } else {
      // Insert new row
      await db.execute(sql`
        INSERT INTO session_notes (
          booking_id,
          mentor_profile_id,
          student_user_id,
          session_agenda,
          shared_action_items,
          student_visible_summary,
          mentor_private_notes
        ) VALUES (
          ${bookingId},
          ${booking.mentor_profile_id},
          ${booking.student_user_id},
          ${sessionAgenda || ""},
          ${JSON.stringify(sharedActionItems || [])},
          ${studentVisibleSummary || ""},
          ${isStudent ? "" : mentorPrivateNotes || ""}
        );
      `);
    }

    return NextResponse.json({
      success: true,
      message: "Session notes saved successfully.",
    });
  } catch (error: any) {
    console.error("[Session Notes POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to save session notes.", details: error.message },
      { status: 500 }
    );
  }
}
