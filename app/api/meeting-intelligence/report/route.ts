/**
 * MentorMaze Meeting Intelligence Report & Post-Session Review API
 * Adapted from Cicada (Apache-2.0 License - https://github.com/wquguru/cicada)
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import { MeetingReportGenerator } from "@/lib/meeting-intelligence/meeting-report-generator";
import { MentorshipBridgeAdapter } from "@/lib/meeting-intelligence/mentorship-bridge-adapter";
import { TranscriptStore } from "@/lib/meeting-intelligence/transcript-store";
import { MeetingNotesEngine } from "@/lib/meeting-intelligence/meeting-notes-engine";

export async function GET(req: NextRequest) {
  try {
    await initializeDatabaseSchema();
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");
    const role = searchParams.get("role") || "student";
    const format = searchParams.get("format") || "json";

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

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

    // Confidentiality enforcement: never expose mentorPrivateFeedback to student
    if (role === "student" && report.mentorPrivateFeedback) {
      delete report.mentorPrivateFeedback;
    }

    if (format === "markdown") {
      const isMentorOrAdmin = role === "mentor" || role === "admin";
      const markdown = MeetingReportGenerator.exportMarkdown(report, isMentorOrAdmin);
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
      studentUserId,
      studentName,
      mentorUserId,
      mentorName,
      mentorProfileId,
      sessionTitle,
      corrections,
      mentorPrivateFeedback,
    } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    const db = await getDb();

    // Action 1: Generate or regenerate fresh report
    if (action === "generate") {
      const transcript = await TranscriptStore.getTranscript(bookingId);
      const notesEngine = new MeetingNotesEngine();
      const notes = await notesEngine.updateNotes(bookingId, null, transcript, true);

      const bookingContext = {
        bookingId,
        studentUserId: studentUserId || "student-default",
        studentName: studentName || "Student",
        mentorUserId: mentorUserId || "mentor-default",
        mentorName: mentorName || "Mentor",
      };

      const report = MeetingReportGenerator.generateReport(bookingContext, notes, transcript, {
        sessionTitle: sessionTitle || notes.title,
        mentorPrivateFeedback,
      });

      await MeetingReportGenerator.persistReport(report, mentorProfileId || bookingContext.mentorUserId);

      return NextResponse.json({ success: true, report });
    }

    // Action 2: Student or mentor review/approval
    if (action === "review" || action === "approve") {
      const status = action === "approve" ? "approved" : "student_reviewed";
      await db.execute(sql`
        UPDATE mentorship_intelligence_reports
        SET 
          review_status = ${status},
          student_corrections = COALESCE(${corrections || null}, student_corrections),
          updated_at = now()
        WHERE booking_id = ${bookingId}::uuid;
      `);

      // If approved, trigger ASTRION injection and Tathastu synchronization
      if (status === "approved") {
        const query: any = await db.execute(sql`
          SELECT report_json FROM mentorship_intelligence_reports WHERE booking_id = ${bookingId}::uuid LIMIT 1;
        `);
        const report = query.rows?.[0]?.report_json;
        if (report) {
          const parsed = typeof report === "string" ? JSON.parse(report) : report;
          await MentorshipBridgeAdapter.injectIntoAstrion(parsed);
          await MentorshipBridgeAdapter.syncToTathastuOutbox(parsed);
        }
      }

      return NextResponse.json({ success: true, status });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
