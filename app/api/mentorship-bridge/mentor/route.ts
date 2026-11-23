import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server-auth";
import { MentorshipBridgeService } from "@/lib/mentorship/mentorship-bridge-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId") || undefined;
    const summaryId = searchParams.get("summaryId") || undefined;
    const mentorUserId = searchParams.get("mentorUserId") || session?.id;

    if (!mentorUserId) {
      return NextResponse.json(
        { success: false, error: "401_UNAUTHORIZED: Mentor authentication required." },
        { status: 401 }
      );
    }

    const briefing = await MentorshipBridgeService.getMentorIntakeBriefing({
      bookingId,
      summaryId,
      mentorUserId,
    });

    return NextResponse.json({
      success: true,
      briefing,
    });
  } catch (error: any) {
    console.error("[Mentorship Bridge Mentor Intake Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve student briefing" },
      { status: error.message?.includes("403") ? 403 : error.message?.includes("404") ? 404 : 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    const body = await req.json();
    const {
      bookingId,
      mentorUserId = session?.id,
      sessionSummary,
      observedStrengths = [],
      developmentGaps = [],
      recommendedActions = [],
      agreedMilestones = [],
      followUpDate,
      nextSessionFocus,
      sharedActionItems = [],
    } = body;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: "bookingId is required" },
        { status: 400 }
      );
    }

    if (!mentorUserId) {
      return NextResponse.json(
        { success: false, error: "401_UNAUTHORIZED: Mentor authentication required." },
        { status: 401 }
      );
    }

    const result = await MentorshipBridgeService.recordPostSessionFeedback({
      bookingId,
      mentorUserId,
      sessionSummary: sessionSummary || "Completed 1:1 mentorship consultation.",
      observedStrengths,
      developmentGaps,
      recommendedActions,
      agreedMilestones,
      followUpDate,
      nextSessionFocus,
      sharedActionItems,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Mentorship Bridge Feedback POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record post-session feedback" },
      { status: error.message?.includes("403") ? 403 : 500 }
    );
  }
}
