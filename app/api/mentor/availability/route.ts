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

  // Fallback to primary mentor profile (Priya Sharma) for development/demo
  return resolveMentorProfileId("mentor-priya");
}

export async function GET(req: NextRequest) {
  try {
    const mentorProfileId = await getAuthenticatedMentorProfileId(req);
    const schedule = await AvailabilityService.getMentorSchedule(mentorProfileId);

    return NextResponse.json({
      success: true,
      mentorProfileId,
      ...schedule,
    });
  } catch (error: any) {
    console.error("[API mentor/availability GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load availability schedule" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const mentorProfileId = await getAuthenticatedMentorProfileId(req);
    const body = await req.json();

    const result = await AvailabilityService.updateMentorSchedule(mentorProfileId, {
      settings: body.settings || {},
      rules: body.rules || [],
      forceOverrideConflicts: body.forceOverrideConflicts ?? false,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      mentorProfileId,
      message: "Availability schedule and settings updated successfully",
    });
  } catch (error: any) {
    console.error("[API mentor/availability PUT] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update availability schedule" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return PUT(req);
}

