import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server-auth";
import { getDb, schema } from "@/lib/db";
import { sql, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Valid authentication session required." },
        { status: 401 }
      );
    }

    const db = getDb();

    // 1. Fetch student profile
    const profileResult: any = await db.execute(sql`
      SELECT 
        sp.id,
        sp.user_id as "userId",
        sp.institution,
        sp.degree,
        sp.field_of_study as "fieldOfStudy",
        sp.graduation_year as "graduationYear",
        sp.target_role as "targetRole",
        sp.current_level as "currentLevel",
        sp.bio,
        sp.preferred_languages as "preferredLanguages"
      FROM student_profiles sp
      WHERE sp.user_id = ${session.id}
      LIMIT 1;
    `);

    let profile = profileResult.rows?.[0] || profileResult?.[0] || null;

    // If no student profile exists yet, provide a default profile shell bound to session
    if (!profile) {
      profile = {
        id: null,
        userId: session.id,
        institution: null,
        degree: null,
        fieldOfStudy: null,
        graduationYear: null,
        targetRole: "Software Engineer",
        currentLevel: "student",
        bio: "",
        preferredLanguages: ["English"],
      };
    }

    // 2. Fetch student goals
    let goals: any[] = [];
    if (profile.id) {
      const goalsResult: any = await db.execute(sql`
        SELECT 
          id,
          title,
          description,
          category,
          status,
          progress_percentage as "progressPercentage",
          target_date as "targetDate"
        FROM student_goals
        WHERE student_profile_id = ${profile.id}
        ORDER BY created_at DESC;
      `);
      goals = goalsResult.rows || goalsResult || [];
    }

    // 3. Fetch upcoming confirmed or pending session
    const bookingsResult: any = await db.execute(sql`
      SELECT 
        b.id,
        b.service_type as "serviceType",
        b.session_duration_minutes as "sessionDurationMinutes",
        b.start_time_utc as "startTimeUtc",
        b.end_time_utc as "endTimeUtc",
        b.user_timezone as "userTimezone",
        b.status,
        b.meeting_room_id as "meetingRoomId",
        u.display_name as "mentorName",
        u.avatar_url as "mentorAvatarUrl",
        mp.headline as "mentorHeadline"
      FROM bookings b
      JOIN mentor_profiles mp ON mp.id = b.mentor_profile_id
      JOIN users u ON u.id = mp.user_id
      WHERE b.student_user_id = ${session.id}
        AND b.status IN ('confirmed', 'pending', 'held')
        AND b.end_time_utc > now()
      ORDER BY b.start_time_utc ASC
      LIMIT 1;
    `);

    const upcomingBooking = bookingsResult.rows?.[0] || bookingsResult?.[0] || null;

    // 4. Fetch top recommended mentors
    const rawMentors: any = await db.execute(sql`
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
        COALESCE(me.primary_domain, 'Software Engineering') as "primaryDomain",
        COALESCE(me.skills, '[]'::jsonb) as "skills",
        COALESCE(me.focus_areas, '[]'::jsonb) as "focusAreas"
      FROM mentor_profiles mp
      JOIN users u ON u.id = mp.user_id
      LEFT JOIN mentor_expertise me ON me.mentor_profile_id = mp.id
      WHERE mp.verification_status = 'approved'
      ORDER BY mp.rating DESC, mp.total_sessions DESC
      LIMIT 3;
    `);

    const mentorRows = rawMentors.rows || rawMentors || [];
    const topMatches = mentorRows.map((r: any, idx: number) => {
      const skills = Array.isArray(r.skills)
        ? r.skills
        : typeof r.skills === "string"
        ? JSON.parse(r.skills)
        : [];
      const focusAreas = Array.isArray(r.focusAreas)
        ? r.focusAreas
        : typeof r.focusAreas === "string"
        ? JSON.parse(r.focusAreas)
        : [];

      return {
        mentor: {
          id: r.id,
          userId: r.userId,
          name: r.name,
          displayName: r.name,
          avatarUrl: r.avatarUrl,
          headline: r.headline,
          bio: r.bio,
          organization: r.organization,
          currentRole: r.currentRole,
          yearsOfExperience: Number(r.yearsOfExperience) || 1,
          location: r.location || "India",
          rating: Number(r.rating) || 5.0,
          totalSessions: Number(r.totalSessions) || 0,
          totalMentees: Number(r.totalMentees) || 0,
          primaryDomain: r.primaryDomain,
          skills,
          focusAreas,
          nextAvailableText: "Available this week",
        },
        matchScore: 96 - idx * 4,
        isBestMatch: idx === 0,
        reasons: [
          `Aligned with ${profile.targetRole || "target tech roles"}`,
          "Verified production background",
          "Open calendar availability",
        ],
      };
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: session.id,
          email: session.email,
          displayName: session.displayName,
          role: session.role,
          avatarUrl: session.avatarUrl,
          timezone: session.timezone,
        },
        profile,
        goals,
        upcomingBooking,
        topMatches,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    console.error("[API /api/student/dashboard GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load student dashboard" },
      { status: 500 }
    );
  }
}
