import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server-auth";
import { MentorshipBridgeService } from "@/lib/mentorship/mentorship-bridge-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    const { searchParams } = new URL(req.url);
    const studentUserId = searchParams.get("studentUserId") || session?.id || "user-student-1";

    const shares = await MentorshipBridgeService.getStudentShares(studentUserId);

    return NextResponse.json({
      success: true,
      shares,
    });
  } catch (error: any) {
    console.error("[Mentorship Bridge Shares GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch mentorship shares" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    const body = await req.json();
    const { summaryId, studentUserId = session?.id || "user-student-1", mentorProfileId, bookingId, expirationDays = 14, updates } = body;

    if (!summaryId) {
      return NextResponse.json(
        { success: false, error: "summaryId is required" },
        { status: 400 }
      );
    }

    // If updating draft content
    if (updates) {
      await MentorshipBridgeService.updateDraft(summaryId, studentUserId, updates);
    }

    // If sharing with mentor
    if (mentorProfileId) {
      const shared = await MentorshipBridgeService.shareWithMentor({
        summaryId,
        studentUserId,
        mentorProfileId,
        bookingId,
        expirationDays,
      });

      return NextResponse.json({
        success: true,
        message: "Mentorship summary successfully shared with mentor.",
        summary: shared,
      });
    }

    const updated = await MentorshipBridgeService.getSummaryById(summaryId);
    return NextResponse.json({
      success: true,
      summary: updated,
    });
  } catch (error: any) {
    console.error("[Mentorship Bridge Shares POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process mentorship share" },
      { status: error.message?.includes("403") ? 403 : error.message?.includes("404") ? 404 : 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    const { searchParams } = new URL(req.url);
    const summaryId = searchParams.get("summaryId");
    const studentUserId = searchParams.get("studentUserId") || session?.id || "user-student-1";

    if (!summaryId) {
      return NextResponse.json(
        { success: false, error: "summaryId is required to revoke share" },
        { status: 400 }
      );
    }

    const revoked = await MentorshipBridgeService.revokeShare(summaryId, studentUserId);

    return NextResponse.json({
      success: true,
      message: "Mentorship summary access successfully revoked.",
      summary: revoked,
    });
  } catch (error: any) {
    console.error("[Mentorship Bridge Shares DELETE Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to revoke mentorship share" },
      { status: error.message?.includes("403") ? 403 : error.message?.includes("404") ? 404 : 500 }
    );
  }
}
