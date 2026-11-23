import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server-auth";
import { AvailabilityService } from "@/lib/calendar/availability-service";
import { resolveMentorProfileId } from "@/lib/calendar/types";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

async function resolveAuthorizedMentorProfileId(
  req: NextRequest
): Promise<{ mentorProfileId?: string; session?: any; errorResponse?: NextResponse }> {
  const session = await getServerSession(req);
  if (!session) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: "Unauthorized: Valid authentication session required." },
        { status: 401 }
      ),
    };
  }

  const url = new URL(req.url);
  const queryMentorId = url.searchParams.get("mentorProfileId");
  const db = getDb();

  // Platform administrators may query or configure any mentor schedule
  if (session.role === "admin" || session.role === "super_admin") {
    if (queryMentorId) {
      return { mentorProfileId: resolveMentorProfileId(queryMentorId), session };
    }
  }

  // Authenticated mentors can only access their own profile
  const [profile] = await db
    .select({ id: schema.mentorProfiles.id })
    .from(schema.mentorProfiles)
    .where(eq(schema.mentorProfiles.userId, session.id))
    .limit(1);

  if (!profile) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: "Forbidden: No active mentor profile associated with this account." },
        { status: 403 }
      ),
    };
  }

  // Reject unauthorized IDOR attempts to access or mutate other mentors' calendars
  if (queryMentorId && resolveMentorProfileId(queryMentorId) !== profile.id && session.role !== "admin" && session.role !== "super_admin") {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: "Forbidden: You are not authorized to view or modify another mentor's schedule." },
        { status: 403 }
      ),
    };
  }

  return { mentorProfileId: profile.id, session };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuthorizedMentorProfileId(req);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const mentorProfileId = auth.mentorProfileId!;
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
    const auth = await resolveAuthorizedMentorProfileId(req);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const mentorProfileId = auth.mentorProfileId!;
    const body = await req.json();

    // Client-supplied forceOverrideConflicts: only platform administrators can override conflicts.
    // Standard mentors can NEVER override conflicts to truncate or cancel existing student bookings.
    const isAdmin = auth.session?.role === "admin" || auth.session?.role === "super_admin";
    const forceOverrideConflicts = isAdmin ? Boolean(body.forceOverrideConflicts) : false;

    const result = await AvailabilityService.updateMentorSchedule(mentorProfileId, {
      settings: body.settings || {},
      rules: body.rules || [],
      forceOverrideConflicts,
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
