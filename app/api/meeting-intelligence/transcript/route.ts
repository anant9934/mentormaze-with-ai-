/**
 * MentorMaze Meeting Intelligence Transcript API
 * Adapted from Cicada (Apache-2.0 License - https://github.com/wquguru/cicada)
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 */

import { NextRequest, NextResponse } from "next/server";
import { initializeDatabaseSchema } from "@/lib/db";
import { TranscriptStore } from "@/lib/meeting-intelligence/transcript-store";

export async function GET(req: NextRequest) {
  try {
    await initializeDatabaseSchema();
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");
    const sinceLine = searchParams.get("sinceLine");

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    let segments = await TranscriptStore.getTranscript(bookingId);
    if (sinceLine) {
      const lineNum = parseInt(sinceLine, 10);
      if (!isNaN(lineNum)) {
        segments = segments.filter((s) => s.lineIndex > lineNum);
      }
    }

    return NextResponse.json({
      success: true,
      bookingId,
      segments,
      totalCount: segments.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initializeDatabaseSchema();
    const body = await req.json();
    const { bookingId, segment } = body;

    if (!bookingId || !segment || !segment.src) {
      return NextResponse.json({ error: "bookingId and valid segment are required" }, { status: 400 });
    }

    const savedSegment = await TranscriptStore.appendSegment(bookingId, segment);
    return NextResponse.json({ success: true, segment: savedSegment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await initializeDatabaseSchema();
    const body = await req.json();
    const { bookingId, lineIndices, reason } = body;

    if (!bookingId || !lineIndices || !Array.isArray(lineIndices)) {
      return NextResponse.json({ error: "bookingId and lineIndices array are required" }, { status: 400 });
    }

    await TranscriptStore.redactLines(bookingId, lineIndices, reason || "student_redaction");
    return NextResponse.json({ success: true, message: `Redacted ${lineIndices.length} lines.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
