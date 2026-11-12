import { NextRequest, NextResponse } from "next/server";
import { AvailabilityService } from "@/lib/calendar/availability-service";
import { getServerSession } from "@/lib/auth/server-auth";
import { getDb, schema } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const startDate = url.searchParams.get("startDate") || undefined;
    const endDate = url.searchParams.get("endDate") || undefined;
    const mentorId = url.searchParams.get("mentorId") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const serviceType = url.searchParams.get("serviceType") || undefined;

    const bookings = await AvailabilityService.getAdminCalendarOverview({
      startDate,
      endDate,
      mentorId,
      status,
      serviceType,
    });

    const db = getDb();
    // Also fetch active holds for the admin view
    const now = new Date();
    const activeHolds = await db
      .select({
        id: schema.bookingHolds.id,
        mentorProfileId: schema.bookingHolds.mentorProfileId,
        studentUserId: schema.bookingHolds.studentUserId,
        serviceType: schema.bookingHolds.serviceType,
        startTimeUtc: schema.bookingHolds.startTimeUtc,
        endTimeUtc: schema.bookingHolds.endTimeUtc,
        expiresAt: schema.bookingHolds.expiresAt,
        status: schema.bookingHolds.status,
      })
      .from(schema.bookingHolds)
      .where(sql`${schema.bookingHolds.status} = 'active' AND ${schema.bookingHolds.expiresAt} > ${now}`)
      .limit(50);

    return NextResponse.json({
      success: true,
      totalSessions: bookings.length,
      activeHoldsCount: activeHolds.length,
      sessions: bookings,
      activeHolds,
    });
  } catch (error: any) {
    console.error("[API admin/calendar] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load admin calendar overview" },
      { status: 500 }
    );
  }
}

