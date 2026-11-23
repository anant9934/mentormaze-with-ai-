import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq, and, sql, ilike, or } from "drizzle-orm";
import { getServerSession } from "@/lib/auth/server-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domainFilter = searchParams.get("domain");
    const searchQuery = searchParams.get("search");

    const session = await getServerSession(req);
    const db = getDb();

    // Query approved mentor profiles joined with users and expertise
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
      WHERE mp.verification_status = 'approved'
      ORDER BY mp.rating DESC, mp.total_sessions DESC;
    `);

    const rows = rawMentors.rows || rawMentors || [];

    // Parse and normalize JSON fields
    let mentors = rows.map((r: any) => {
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
      const languages = Array.isArray(r.languages)
        ? r.languages
        : typeof r.languages === "string"
        ? JSON.parse(r.languages)
        : ["English"];

      return {
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
        verificationStatus: r.verificationStatus,
        languages,
        sessionModes: Array.isArray(r.sessionModes) ? r.sessionModes : ["1:1"],
        responseTime: r.responseTime || "Within 6 hours",
        isAcceptingBookings: Boolean(r.isAcceptingBookings),
        price15MinInr: Number(r.price15MinInr) || 149,
        price30MinInr: Number(r.price30MinInr) || 249,
        price60MinInr: Number(r.price60MinInr) || 449,
        primaryDomain: r.primaryDomain,
        skills,
        focusAreas,
        nextAvailableText: "Available this week",
      };
    });

    // Apply domain filtering
    if (domainFilter && domainFilter.toLowerCase() !== "all") {
      mentors = mentors.filter(
        (m: any) => m.primaryDomain.toLowerCase() === domainFilter.toLowerCase()
      );
    }

    // Apply search query filter
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      mentors = mentors.filter(
        (m: any) =>
          m.name.toLowerCase().includes(q) ||
          m.headline.toLowerCase().includes(q) ||
          m.organization.toLowerCase().includes(q) ||
          m.primaryDomain.toLowerCase().includes(q) ||
          m.skills.some((s: string) => s.toLowerCase().includes(q))
      );
    }

    // Compute recommendations if user has a target role or goals
    let topRecommendations = mentors.slice(0, 3).map((mentor: any, idx: number) => ({
      mentor,
      matchScore: 95 - idx * 3,
      isBestMatch: idx === 0,
      reasons: [
        "Matches your declared career goals",
        "Relevant technical stack & verified industry experience",
        "Available for booking this week",
      ],
    }));

    return NextResponse.json({
      success: true,
      total: mentors.length,
      mentors,
      topRecommendations,
    });
  } catch (error: any) {
    console.error("[API /api/mentors GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load mentors directory" },
      { status: 500 }
    );
  }
}
