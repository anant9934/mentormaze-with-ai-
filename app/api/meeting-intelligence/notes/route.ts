/**
 * MentorMaze Meeting Intelligence Notes API
 * Adapted from Cicada (Apache-2.0 License - https://github.com/wquguru/cicada)
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Implements:
 * 1. Server-side feature gate (503 when disabled).
 * 2. Participant authorization on every request (401 / 403 / 404).
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import {
  authorizeMeetingParticipant,
  MeetingNotesEngine,
  TranscriptStore,
  toBookingUuid,
} from "@/lib/meeting-intelligence";

export async function GET(req: NextRequest) {
  try {
    await initializeDatabaseSchema();
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");

    const auth = await authorizeMeetingParticipant(req, bookingId);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const safeBookingUuid = toBookingUuid(bookingId);
    let row = null;
    try {
      const db = await getDb();
      const result: any = await db.execute(sql`
        SELECT id, booking_id as "bookingId", title, summary, topics, conclusions,
               todos, terms, unresolved_questions as "unresolvedQuestions",
               covered_line_count as "coveredLineCount", is_final as "isFinal",
               approved_by_student_at as "approvedByStudentAt",
               approved_by_mentor_at as "approvedByMentorAt",
               updated_at as "updatedAt"
        FROM meeting_notes_records
        WHERE booking_id = ${safeBookingUuid}::uuid
        LIMIT 1;
      `);
      row = result.rows?.[0] || result?.[0];
    } catch (sqlErr) {
      console.warn("[Notes GET] Fallback to default notes:", sqlErr);
    }
    if (!row) {
      return NextResponse.json({
        success: true,
        notes: {
          title: "Session In Progress",
          summary: "Live notes will update automatically as topics are discussed.",
          topics: [],
          conclusions: [],
          todos: [],
          terms: [],
          unresolvedQuestions: [],
          coveredLineCount: 0,
          updatedAt: new Date().toISOString(),
          isFinal: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      notes: {
        title: row.title,
        summary: row.summary,
        topics: typeof row.topics === "string" ? JSON.parse(row.topics) : row.topics,
        conclusions: typeof row.conclusions === "string" ? JSON.parse(row.conclusions) : row.conclusions,
        todos: typeof row.todos === "string" ? JSON.parse(row.todos) : row.todos,
        terms: typeof row.terms === "string" ? JSON.parse(row.terms) : row.terms,
        unresolvedQuestions:
          typeof row.unresolvedQuestions === "string"
            ? JSON.parse(row.unresolvedQuestions)
            : row.unresolvedQuestions,
        coveredLineCount: row.coveredLineCount,
        updatedAt: row.updatedAt,
        isFinal: row.isFinal,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initializeDatabaseSchema();
    const body = await req.json();
    const { bookingId, isFinalPass } = body;

    const auth = await authorizeMeetingParticipant(req, bookingId);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const segments = await TranscriptStore.getTranscript(bookingId);
    const engine = new MeetingNotesEngine();
    const updatedNotes = await engine.updateNotes(bookingId, null, segments, Boolean(isFinalPass));

    return NextResponse.json({ success: true, notes: updatedNotes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
