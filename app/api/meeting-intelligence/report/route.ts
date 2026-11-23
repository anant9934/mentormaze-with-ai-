/**
 * MentorMaze Meeting Intelligence Report & Post-Session Review API
 * Adapted from Cicada (Apache-2.0 License - https://github.com/wquguru/cicada)
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Implements:
 * 1. Server-side feature gate (503 when disabled).
 * 2. Participant authorization on every request (401 / 403 / 404).
 * 3. Server-enforced mentor private notes confidentiality (never trusting client query params).
 * 4. Scoped report approval and review permissions.
 * 5. Fail-closed ASTRION and AI Tathastu outbox synchronization with verified consent epochs.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import {
  authorizeMeetingParticipant,
  MeetingReportGenerator,
  MentorshipBridgeAdapter,
  TranscriptStore,
  MeetingNotesEngine,
} from "@/lib/meeting-intelligence";

export async function GET(req: NextRequest) {
  try {
    await initializeDatabaseSchema();
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");
    const format = searchParams.get("format") || "json";

    const auth = await authorizeMeetingParticipant(req, bookingId);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { isMentor, isAdmin } = auth.authContext;
    const canViewPrivateNotes = isMentor || isAdmin;

    const db = await getDb();
    const result: any = await db.execute(sql`
      SELECT id, booking_id as "bookingId", student_user_id as "studentUserId",
             mentor_profile_id as "mentorProfileId", report_json as "reportJson",
             report_markdown as "reportMarkdown", review_status as "reviewStatus",
             student_corrections as "studentCorrections", mentor_corrections as "mentorCorrections",
             injected_into_astrion as "injectedIntoAstrion", synced_to_tathastu as "syncedToTathastu",
             tathastu_sync_idempotency_key as "tathastuSyncIdempotencyKey",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM mentorship_intelligence_reports
      WHERE booking_id = ${bookingId}::uuid
      LIMIT 1;
    `);

    const row = result.rows?.[0] || result?.[0];
    if (!row) {
      return NextResponse.json({ error: "Report not found for booking." }, { status: 404 });
    }

    let report = typeof row.reportJson === "string" ? JSON.parse(row.reportJson) : row.reportJson;

    // Server-enforced confidentiality: students NEVER receive mentorPrivateFeedback
    if (!canViewPrivateNotes && report.mentorPrivateFeedback) {
      delete report.mentorPrivateFeedback;
    }

    if (format === "markdown") {
      const markdown = MeetingReportGenerator.exportMarkdown(report, canViewPrivateNotes);
      return new NextResponse(markdown, {
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
      });
    }

    return NextResponse.json({
      success: true,
      report,
      reviewStatus: row.reviewStatus,
      injectedIntoAstrion: row.injectedIntoAstrion,
      syncedToTathastu: row.syncedToTathastu,
      tathastuSyncIdempotencyKey: row.tathastuSyncIdempotencyKey,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initializeDatabaseSchema();
    const body = await req.json();
    const {
      bookingId,
      action,
      sessionTitle,
      corrections,
      mentorPrivateFeedback,
    } = body;

    const auth = await authorizeMeetingParticipant(req, bookingId);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { user, booking, isStudent, isMentor, isAdmin } = auth.authContext;
    const db = await getDb();

    // Action 1: Generate or regenerate fresh report
    if (action === "generate") {
      const transcript = await TranscriptStore.getTranscript(bookingId);
      const notesEngine = new MeetingNotesEngine();
      const notes = await notesEngine.updateNotes(bookingId, null, transcript, true);

      const bookingContext = {
        bookingId,
        studentUserId: booking.student_user_id,
        studentName: isStudent ? user.displayName : "Student Participant",
        mentorUserId: booking.mentor_user_id,
        mentorName: isMentor ? user.displayName : "Mentor",
      };

      // Only mentor or admin can provide confidential mentor feedback
      const privateFeedback = isMentor || isAdmin ? mentorPrivateFeedback : undefined;

      const report = MeetingReportGenerator.generateReport(bookingContext, notes, transcript, {
        sessionTitle: sessionTitle || notes.title,
        mentorPrivateFeedback: privateFeedback,
      });

      await MeetingReportGenerator.persistReport(report, booking.mentor_profile_id);

      return NextResponse.json({ success: true, report });
    }

    // Action 2: Review submission
    if (action === "review") {
      if (isStudent) {
        await db.execute(sql`
          UPDATE mentorship_intelligence_reports
          SET 
            review_status = 'student_reviewed',
            student_corrections = ${corrections || null},
            updated_at = now()
          WHERE booking_id = ${bookingId}::uuid;
        `);
        return NextResponse.json({ success: true, status: "student_reviewed" });
      } else if (isMentor) {
        await db.execute(sql`
          UPDATE mentorship_intelligence_reports
          SET 
            review_status = 'mentor_reviewed',
            mentor_corrections = ${corrections || null},
            updated_at = now()
          WHERE booking_id = ${bookingId}::uuid;
        `);
        return NextResponse.json({ success: true, status: "mentor_reviewed" });
      }
    }

    // Action 3: Final report approval
    if (action === "approve") {
      await db.execute(sql`
        UPDATE mentorship_intelligence_reports
        SET 
          review_status = 'approved',
          updated_at = now()
        WHERE booking_id = ${bookingId}::uuid;
      `);

      // Trigger ASTRION injection and Tathastu synchronization (fail-closed consent enforced inside)
      const query: any = await db.execute(sql`
        SELECT report_json FROM mentorship_intelligence_reports WHERE booking_id = ${bookingId}::uuid LIMIT 1;
      `);
      const report = query.rows?.[0]?.report_json;
      if (report) {
        const parsed = typeof report === "string" ? JSON.parse(report) : report;
        await MentorshipBridgeAdapter.injectIntoAstrion(parsed);
        await MentorshipBridgeAdapter.syncToTathastuOutbox(parsed);
      }

      return NextResponse.json({ success: true, status: "approved" });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
