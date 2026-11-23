import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server-auth";
import { MentorshipBridgeService, BridgeTimeframe } from "@/lib/mentorship/mentorship-bridge-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    const body = await req.json();
    const studentUserId = body.studentUserId || session?.id || "user-student-1";
    const timeframe: BridgeTimeframe = body.timeframe || "30_days";
    const conversationIds = body.conversationIds;
    const bookingId = body.bookingId;
    const mentorProfileId = body.mentorProfileId;

    const summary = await MentorshipBridgeService.generateSummary({
      studentUserId,
      timeframe,
      conversationIds,
      bookingId,
      mentorProfileId,
      requestingUserId: session?.id || studentUserId,
    });

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error("[Mentorship Bridge Generate Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate mentorship summary" },
      { status: error.message?.includes("403") ? 403 : 500 }
    );
  }
}
