import { NextRequest, NextResponse } from "next/server";
import { SlotGenerator } from "@/lib/calendar/slot-generator";
import { resolveMentorProfileId } from "@/lib/calendar/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mentorId } = await params;
    const url = new URL(req.url);

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const defaultEndStr = new Date(now.getTime() + 14 * 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);

    const startDate = url.searchParams.get("startDate") || todayStr;
    const endDate = url.searchParams.get("endDate") || defaultEndStr;
    const durationMinutes = parseInt(url.searchParams.get("duration") || "30", 10);
    const viewerTimezone = url.searchParams.get("timezone") || "Asia/Kolkata";

    const resolvedId = resolveMentorProfileId(mentorId);

    const slots = await SlotGenerator.generateSlots({
      mentorProfileId: resolvedId,
      startDate,
      endDate,
      durationMinutes,
      viewerTimezone,
    });

    return NextResponse.json({
      success: true,
      mentorProfileId: resolvedId,
      requestedMentorId: mentorId,
      startDate,
      endDate,
      durationMinutes,
      viewerTimezone,
      totalSlots: slots.length,
      availableSlotsCount: slots.filter((s) => s.available).length,
      slots,
    });
  } catch (error: any) {
    console.error("[API mentors/availability] Error generating slots:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to calculate mentor availability slots",
      },
      { status: 500 }
    );
  }
}
