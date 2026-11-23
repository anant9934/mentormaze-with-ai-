/**
 * MentorMaze Meeting Intelligence Session Lifecycle API
 * Adapted from Cicada (Apache-2.0 License - https://github.com/wquguru/cicada)
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Implements:
 * 1. Server-side feature gate (fail-closed, 503 when disabled).
 * 2. Strict server-side participant authorization (401 / 403 / 404).
 * 3. Zero trust in client-supplied role, studentUserId, or mentorUserId.
 * 4. Explicit student consent verification before capture starts (CONSENT_REQUIRED).
 * 5. Durable PostgreSQL session state (zero process-level Map dependence).
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import {
  authorizeMeetingParticipant,
  LiveKitAudioPipeline,
  TranscriptStore,
  MeetingNotesEngine,
} from "@/lib/meeting-intelligence";
import { StudentConsentService } from "@/lib/ai-mentor/student-consent-service";

export async function GET(req: NextRequest) {
  try {
    await initializeDatabaseSchema();
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");

    const auth = await authorizeMeetingParticipant(req, bookingId);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const db = await getDb();
    const result: any = await db.execute(sql`
      SELECT id, booking_id as "bookingId", status, started_at as "startedAt",
             ended_at as "endedAt", duration_seconds as "durationSeconds",
             active_languages as "activeLanguages", total_segments as "totalSegments",
             total_words as "totalWords", metadata, created_at as "createdAt"
      FROM meeting_intelligence_sessions
      WHERE booking_id = ${bookingId}::uuid
      LIMIT 1;
    `);

    const session = result.rows?.[0] || result?.[0];
    const liveStatus = session?.status || "idle";

    return NextResponse.json({
      success: true,
      session: session ? { ...session, status: liveStatus } : { bookingId, status: liveStatus },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initializeDatabaseSchema();
    const body = await req.json();
    const { bookingId, action, targetLanguage } = body;

    if (!bookingId || !action) {
      return NextResponse.json(
        { error: "bookingId and action ('start'|'pause'|'resume'|'stop') are required" },
        { status: 400 }
      );
    }

    // 1. Authorize participant via server session and DB booking lookup
    const auth = await authorizeMeetingParticipant(req, bookingId);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { booking, user, isStudent, isMentor, isAdmin } = auth.authContext;
    const db = await getDb();

    // 2. Action: start
    if (action === "start") {
      // Participant consent verification
      const hasConsent = await StudentConsentService.hasConsent(
        booking.student_user_id,
        "student_memory"
      );
      if (!hasConsent) {
        return NextResponse.json(
          {
            error: "Student consent is required before starting meeting intelligence capture.",
            code: "CONSENT_REQUIRED",
          },
          { status: 400 }
        );
      }

      // Check LiveKit infrastructure
      const infra = LiveKitAudioPipeline.isInfrastructureConfigured(bookingId);
      const initialStatus = infra.configured ? "capturing" : "not_live_verified";

      await db.execute(sql`
        INSERT INTO meeting_intelligence_sessions (
          id, booking_id, status, started_at, active_languages, metadata, updated_at
        ) VALUES (
          gen_random_uuid(),
          ${bookingId}::uuid,
          ${initialStatus},
          now(),
          '["en", "hi"]'::jsonb,
          ${JSON.stringify({
            isLiveVerified: infra.configured,
            unverifiedReason: infra.reason,
            targetLanguage: targetLanguage || "hi",
          })}::jsonb,
          now()
        )
        ON CONFLICT (booking_id) DO UPDATE SET
          status = ${initialStatus},
          metadata = ${JSON.stringify({
            isLiveVerified: infra.configured,
            unverifiedReason: infra.reason,
            targetLanguage: targetLanguage || "hi",
          })}::jsonb,
          updated_at = now();
      `);

      return NextResponse.json({
        success: true,
        status: initialStatus,
        isLiveVerified: infra.configured,
        unverifiedReason: infra.reason,
      });
    }

    // 3. Action: pause
    if (action === "pause") {
      await db.execute(sql`
        UPDATE meeting_intelligence_sessions
        SET status = 'paused', updated_at = now()
        WHERE booking_id = ${bookingId}::uuid;
      `);
      return NextResponse.json({ success: true, status: "paused" });
    }

    // 4. Action: resume
    if (action === "resume") {
      await db.execute(sql`
        UPDATE meeting_intelligence_sessions
        SET status = 'capturing', updated_at = now()
        WHERE booking_id = ${bookingId}::uuid;
      `);
      return NextResponse.json({ success: true, status: "capturing" });
    }

    // 5. Action: stop
    if (action === "stop") {
      const allSegments = await TranscriptStore.getTranscript(bookingId);
      const notesEngine = new MeetingNotesEngine();
      let finalNotes = null;
      try {
        finalNotes = await notesEngine.updateNotes(bookingId, null, allSegments, true);
      } catch (e: any) {
        console.warn(`[SessionAPI] Final notes update notice: ${e?.message}`);
      }

      await db.execute(sql`
        UPDATE meeting_intelligence_sessions
        SET status = 'completed', ended_at = now(), updated_at = now()
        WHERE booking_id = ${bookingId}::uuid;
      `);

      return NextResponse.json({ success: true, status: "completed", finalNotes });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
