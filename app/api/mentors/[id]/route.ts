import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { resolveMentorProfileId } from "@/lib/calendar/types";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Mentor ID required" }, { status: 400 });
    }

    const resolvedId = resolveMentorProfileId(id);
    const db = getDb();

    // Query approved mentor profile matching id, resolvedId, or user_id
    const mentorResult: any = await db.execute(sql`
      SELECT 
        mp.id,
        mp.user_id as "userId",
        u.display_name as "name",
        u.avatar_url as "avatarUrl",
        mp.headline,
        mp.bio,
        mp.organization,
        mp.current_role as "currentRole",
        mp.years_of_experience as "yearsOfExperience",
        mp.location,
        mp.rating,
        mp.total_sessions as "totalSessions",
        mp.total_mentees as "totalMentees",
        mp.verification_status as "verificationStatus",
        mp.languages,
        mp.session_modes as "sessionModes",
        mp.response_time as "responseTime",
        mp.is_accepting_bookings as "isAcceptingBookings",
        mp.price_15min_inr as "price15MinInr",
        mp.price_30min_inr as "price30MinInr",
        mp.price_60min_inr as "price60MinInr",
        COALESCE(me.primary_domain, 'Software Engineering') as "primaryDomain",
        COALESCE(me.skills, '[]'::jsonb) as "skills",
        COALESCE(me.focus_areas, '[]'::jsonb) as "focusAreas"
      FROM mentor_profiles mp
      JOIN users u ON u.id = mp.user_id
      LEFT JOIN mentor_expertise me ON me.mentor_profile_id = mp.id
      WHERE (mp.id = ${resolvedId} OR mp.id = ${id} OR mp.user_id = ${id} OR mp.user_id = ${resolvedId})
        AND mp.verification_status = 'approved'
      LIMIT 1;
    `);

    const row = mentorResult.rows?.[0] || mentorResult?.[0];
    if (!row) {
      return NextResponse.json(
        { success: false, error: "Mentor not found or not approved" },
        { status: 404 }
      );
    }

    // Query availability rules
    const rulesResult: any = await db.execute(sql`
      SELECT day_of_week as "dayOfWeek", start_time as "startTime", end_time as "endTime", is_active as "isActive"
      FROM availability_rules
      WHERE mentor_profile_id = ${row.id} AND is_active = true
      ORDER BY day_of_week ASC;
    `);

    const rules = rulesResult.rows || rulesResult || [];

    const skills = Array.isArray(row.skills)
      ? row.skills
      : typeof row.skills === "string"
      ? JSON.parse(row.skills)
      : [];
    const focusAreas = Array.isArray(row.focusAreas)
      ? row.focusAreas
      : typeof row.focusAreas === "string"
      ? JSON.parse(row.focusAreas)
      : ["Career Guidance", "Interview Prep"];
    const languages = Array.isArray(row.languages)
      ? row.languages
      : typeof row.languages === "string"
      ? JSON.parse(row.languages)
      : ["English"];

    const mentor = {
      id: row.id,
      userId: row.userId,
      name: row.name,
      displayName: row.name,
      avatarUrl: row.avatarUrl,
      headline: row.headline,
      bio: row.bio,
      organization: row.organization,
      currentRole: row.currentRole,
      yearsOfExperience: Number(row.yearsOfExperience) || 1,
      location: row.location || "India",
      rating: Number(row.rating) || 5.0,
      totalSessions: Number(row.totalSessions) || 0,
      totalMentees: Number(row.totalMentees) || 0,
      verificationStatus: row.verificationStatus,
      languages,
      sessionModes: Array.isArray(row.sessionModes) ? row.sessionModes : ["1:1"],
      responseTime: row.responseTime || "Within 6 hours",
      isAcceptingBookings: Boolean(row.isAcceptingBookings),
      price15MinInr: Number(row.price15MinInr) || 149,
      price30MinInr: Number(row.price30MinInr) || 249,
      price60MinInr: Number(row.price60MinInr) || 449,
      primaryDomain: row.primaryDomain,
      skills,
      focusAreas,
      nextAvailableText: "Available this week",
      availabilityWeekly: rules,
    };

    return NextResponse.json({
      success: true,
      mentor,
    });
  } catch (error: any) {
    console.error("[API /api/mentors/[id] GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load mentor profile" },
      { status: 500 }
    );
  }
}
