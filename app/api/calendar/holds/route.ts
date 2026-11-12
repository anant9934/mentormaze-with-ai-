import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server-auth";
import { BookingHoldManager } from "@/lib/calendar/hold-manager";
import { resolveMentorProfileId } from "@/lib/calendar/types";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    const body = await req.json();

    const studentUserId = session?.id || body.studentUserId || "00000000-0000-0000-0000-000000000001";
    const mentorProfileId = resolveMentorProfileId(body.mentorProfileId);

    if (!body.startTimeUtc || !body.endTimeUtc) {
      return NextResponse.json(
        { success: false, error: "startTimeUtc and endTimeUtc are required ISO 8601 strings." },
        { status: 400 }
      );
    }

    const idempotencyKey =
      body.idempotencyKey ||
      `hold-${studentUserId.slice(0, 8)}-${Date.parse(body.startTimeUtc)}`;

    const result = await BookingHoldManager.createHold({
      mentorProfileId,
      studentUserId,
      serviceType: body.serviceType || "1on1_mentorship",
      sessionDurationMinutes: body.sessionDurationMinutes || 30,
      startTimeUtc: body.startTimeUtc,
      endTimeUtc: body.endTimeUtc,
      idempotencyKey,
      holdDurationMinutes: body.holdDurationMinutes || 10,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: result.collision ? 409 : 400 });
    }

    return NextResponse.json({
      success: true,
      hold: result.hold,
      expiresAt: result.hold?.expires_at || result.hold?.expiresAt,
      holdDurationMinutes: body.holdDurationMinutes || 10,
      message: "Slot held successfully for 10 minutes.",
    });
  } catch (error: any) {
    console.error("[API calendar/holds POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create slot hold" },
      { status: 500 }
    );
  }
}

