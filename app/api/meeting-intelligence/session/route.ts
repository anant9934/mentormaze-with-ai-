/**
 * MentorMaze Meeting Intelligence Session Lifecycle API
 * Adapted from Cicada (Apache-2.0 License - https://github.com/wquguru/cicada)
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import { AudioSessionManager } from "@/lib/meeting-intelligence/audio-session-manager";

// Cache active session managers in memory
const activeSessionManagers = new Map<string, AudioSessionManager>();

export async function GET(req: NextRequest) {
  try {
    await initializeDatabaseSchema();
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    const db = await getDb();
    const result: any = await db.execute(sql`
      SELECT id, booking_id as "bookingId", status, started_at as "startedAt",
             ended_at as "endedAt", duration_seconds as "durationSeconds",
             active_languages as "activeLanguages", total_segments as "totalSegments",
             total_words as "totalWords", created_at as "createdAt"
      FROM meeting_intelligence_sessions
      WHERE booking_id = ${bookingId}::uuid
      LIMIT 1;
    `);

    const session = result.rows?.[0] || result?.[0];
    const liveManager = activeSessionManagers.get(bookingId);
    const liveStatus = liveManager ? liveManager.getStatus() : session?.status || "idle";

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
    const { bookingId, action, studentUserId, studentName, mentorUserId, mentorName, targetLanguage } = body;

    if (!bookingId || !action) {
      return NextResponse.json({ error: "bookingId and action ('start'|'pause'|'resume'|'stop') are required" }, { status: 400 });
    }

    let manager = activeSessionManagers.get(bookingId);

    if (action === "start") {
      if (!manager) {
        manager = new AudioSessionManager(
          {
            bookingId,
            studentUserId: studentUserId || "student-default",
            studentName: studentName || "Student",
            mentorUserId: mentorUserId || "mentor-default",
            mentorName: mentorName || "Mentor",
          },
          targetLanguage || "hi"
        );
        activeSessionManagers.set(bookingId, manager);
      }
      await manager.startCapture();
      return NextResponse.json({ success: true, status: manager.getStatus() });
    }

    if (!manager) {
      // Re-create manager if stopping or paused
      manager = new AudioSessionManager(
        {
          bookingId,
          studentUserId: studentUserId || "student-default",
          studentName: studentName || "Student",
          mentorUserId: mentorUserId || "mentor-default",
          mentorName: mentorName || "Mentor",
        },
        targetLanguage || "hi"
      );
      activeSessionManagers.set(bookingId, manager);
    }

    if (action === "pause") {
      manager.pauseCapture();
      return NextResponse.json({ success: true, status: manager.getStatus() });
    }

    if (action === "resume") {
      manager.resumeCapture();
      return NextResponse.json({ success: true, status: manager.getStatus() });
    }

    if (action === "stop") {
      const finalNotes = await manager.stopCapture();
      activeSessionManagers.delete(bookingId);
      return NextResponse.json({ success: true, status: "completed", finalNotes });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
