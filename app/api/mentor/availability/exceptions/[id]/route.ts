import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server-auth";
import { AvailabilityService } from "@/lib/calendar/availability-service";
import { resolveMentorProfileId } from "@/lib/calendar/types";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

async function getAuthenticatedMentorProfileId(req: NextRequest): Promise<string> {
  const url = new URL(req.url);
  const queryMentorId = url.searchParams.get("mentorProfileId");
  if (queryMentorId) {
    return resolveMentorProfileId(queryMentorId);
  }

  const session = await getServerSession();
  if (session) {
    const db = getDb();
    const [profile] = await db
      .select({ id: schema.mentorProfiles.id })
      .from(schema.mentorProfiles)
      .where(eq(schema.mentorProfiles.userId, session.id))
      .limit(1);

    if (profile) return profile.id;
  }

  return resolveMentorProfileId("mentor-priya");
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: exceptionId } = await params;
    const mentorProfileId = await getAuthenticatedMentorProfileId(req);

    const result = await AvailabilityService.removeException(mentorProfileId, exceptionId);

    return NextResponse.json({
      success: true,
      message: "Availability exception removed successfully",
    });
  } catch (error: any) {
    console.error("[API exceptions DELETE] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove availability exception" },
      { status: 500 }
    );
  }
}
