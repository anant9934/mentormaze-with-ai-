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

export async function POST(req: NextRequest) {
  try {
    const mentorProfileId = await getAuthenticatedMentorProfileId(req);
    const body = await req.json();

    if (!body.exceptionDate) {
      return NextResponse.json(
        { success: false, error: "exceptionDate is required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const result = await AvailabilityService.addException(mentorProfileId, {
      exceptionDate: body.exceptionDate,
      isBlocked: body.isBlocked ?? true,
      startTime: body.startTime,
      endTime: body.endTime,
      reason: body.reason,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      exception: result.exception,
      message: "Availability exception saved successfully",
    });
  } catch (error: any) {
    console.error("[API exceptions POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add availability exception" },
      { status: 500 }
    );
  }
}
