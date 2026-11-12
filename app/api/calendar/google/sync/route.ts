import { NextRequest, NextResponse } from "next/server";
import { getDb, schema, initializeDatabaseSchema } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { GoogleCalendarProvider } from "@/lib/calendar/providers/google-calendar-provider";
import { resolveMentorProfileId } from "@/lib/calendar/types";
import { getServerSession } from "@/lib/auth/server-auth";

export async function POST(req: NextRequest) {
  try {
    await initializeDatabaseSchema();
    const session = await getServerSession();
    const body = await req.json().catch(() => ({}));

    const mentorProfileId = resolveMentorProfileId(
      body.mentorProfileId || "mentor-priya"
    );

    const db = getDb();

    // 1. Fetch Google Calendar connection
    const [conn] = await db
      .select()
      .from(schema.calendarConnections)
      .where(
        and(
          eq(schema.calendarConnections.mentorProfileId, mentorProfileId),
          eq(schema.calendarConnections.provider, "google_calendar"),
          eq(schema.calendarConnections.status, "connected")
        )
      )
      .limit(1);

    if (!conn) {
      return NextResponse.json({
        success: true,
        synced: false,
        message: "No active Google Calendar connection found for this mentor.",
      });
    }

    const provider = new GoogleCalendarProvider(conn.id, {
      accessTokenEncrypted: conn.accessTokenEncrypted,
      refreshTokenEncrypted: conn.refreshTokenEncrypted,
      tokenExpiresAt: conn.tokenExpiresAt,
    });

    const now = new Date();
    const syncEnd = new Date(now.getTime() + 30 * 24 * 3600 * 1000); // 30 days ahead

    // Fetch busy intervals from Google Calendar
    const busyIntervals = await provider.listBusyPeriods(now, syncEnd);

    // Save/update external calendar events inside a transaction
    await db.transaction(async (tx: any) => {
      // Clear previously synced busy events in this range
      await tx.execute(sql`
        DELETE FROM external_calendar_events
        WHERE connection_id = ${conn.id}
          AND start_time_utc >= ${now}
          AND start_time_utc <= ${syncEnd};
      `);

      for (const busy of busyIntervals) {
        await tx.execute(sql`
          INSERT INTO external_calendar_events (
            connection_id,
            mentor_profile_id,
            external_event_id,
            start_time_utc,
            end_time_utc,
            is_busy,
            summary_preview
          ) VALUES (
            ${conn.id},
            ${mentorProfileId},
            ${`google-busy-${Date.parse(busy.startTimeUtc.toISOString())}`},
            ${busy.startTimeUtc},
            ${busy.endTimeUtc},
            true,
            'Busy (External Calendar)'
          );
        `);
      }

      await tx
        .update(schema.calendarConnections)
        .set({
          lastSyncedAt: new Date(),
          lastError: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.calendarConnections.id, conn.id));
    });

    return NextResponse.json({
      success: true,
      synced: true,
      syncedIntervalsCount: busyIntervals.length,
      lastSyncedAt: new Date().toISOString(),
      message: `Successfully synchronized ${busyIntervals.length} external busy intervals.`,
    });
  } catch (error: any) {
    console.error("[API calendar/google/sync] Error during sync:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to synchronize Google Calendar events",
      },
      { status: 500 }
    );
  }
}

