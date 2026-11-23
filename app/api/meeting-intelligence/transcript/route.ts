/**
 * MentorMaze Meeting Intelligence Transcript API
 * Adapted from Cicada (Apache-2.0 License - https://github.com/wquguru/cicada)
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Implements:
 * 1. Server-side feature gate (503 when disabled).
 * 2. Participant authorization on every request (401 / 403 / 404).
 * 3. Scoped redaction authorization (only booked student or admin may redact).
 * 4. Atomic database sequencing for segment insertion.
 */

import { NextRequest, NextResponse } from "next/server";
import { initializeDatabaseSchema } from "@/lib/db";
import { TranscriptStore, authorizeMeetingParticipant } from "@/lib/meeting-intelligence";

export async function GET(req: NextRequest) {
  try {
    await initializeDatabaseSchema();
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");
    const sinceLine = searchParams.get("sinceLine");

    const auth = await authorizeMeetingParticipant(req, bookingId);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    let segments = await TranscriptStore.getTranscript(bookingId!);
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

    const auth = await authorizeMeetingParticipant(req, bookingId);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    if (!segment || !segment.src) {
      return NextResponse.json({ error: "Valid segment with src text is required." }, { status: 400 });
    }

    const { user, booking, isStudent, isMentor } = auth.authContext;

    // Attribute participant identity from server session, never trusting client body
    const verifiedRole = isStudent ? "student" : isMentor ? "mentor" : "system";
    const verifiedParticipantId = user.id;
    const verifiedSpeakerName = user.displayName || (isStudent ? "Student" : "Mentor");

    const savedSegment = await TranscriptStore.appendSegment(bookingId, {
      ...segment,
      participantId: verifiedParticipantId,
      speakerRole: verifiedRole,
      speakerName: verifiedSpeakerName,
      provenance: "transcript_extracted",
    });

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

    const auth = await authorizeMeetingParticipant(req, bookingId);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { isStudent, isAdmin } = auth.authContext;

    // Confidentiality & privacy control: only booked student or admin can execute redactions
    if (!isStudent && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Only the booked student or an administrator can redact transcript lines." },
        { status: 403 }
      );
    }

    if (!lineIndices || !Array.isArray(lineIndices) || lineIndices.length === 0) {
      return NextResponse.json(
        { error: "bookingId and a non-empty lineIndices array are required." },
        { status: 400 }
      );
    }

    await TranscriptStore.redactLines(bookingId, lineIndices, reason || "student_redaction");
    return NextResponse.json({ success: true, message: `Redacted ${lineIndices.length} line(s).` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
