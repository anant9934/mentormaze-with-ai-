/**
 * MentorMaze Mock Interview Evaluation API
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Implements draft vs published score isolation and weighted rubric calculations.
 */

import { NextRequest, NextResponse } from "next/server";
import { RubricService, CATEGORY_RUBRICS, InterviewCategory } from "@/lib/interview/rubric-service";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initializeDatabaseSchema();
    const bookingId = params.id;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "";
    const role = searchParams.get("role") || "student";

    const evaluation = await RubricService.getEvaluation(bookingId, userId, role);

    if (!evaluation) {
      // Check booking details so UI can render default template
      const db = getDb();
      const bookingQuery: any = await db.execute(sql`
        SELECT b.id, b.student_user_id, b.mentor_profile_id, b.service_type,
               u_student.display_name as student_name,
               u_mentor.display_name as mentor_name
        FROM bookings b
        JOIN users u_student ON u_student.id = b.student_user_id
        JOIN mentor_profiles mp ON mp.id = b.mentor_profile_id
        JOIN users u_mentor ON u_mentor.id = mp.user_id
        WHERE b.id = ${bookingId}
        LIMIT 1;
      `);
      const booking = bookingQuery.rows?.[0] || bookingQuery?.[0];

      return NextResponse.json({
        exists: false,
        booking,
        rubrics: CATEGORY_RUBRICS,
      });
    }

    return NextResponse.json({
      exists: true,
      evaluation,
      rubrics: CATEGORY_RUBRICS,
    });
  } catch (error: any) {
    console.error("[Evaluation GET Error]:", error);
    return NextResponse.json(
      { error: "Failed to retrieve evaluation.", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initializeDatabaseSchema();
    const bookingId = params.id;
    const body = await req.json();

    const {
      mentorProfileId,
      studentUserId,
      category = "sde_backend",
      targetRole = "Software Engineer",
      difficulty = "Medium",
      dimensionScores = {},
      strengths = [],
      growthAreas = [],
      detailedFeedback = "",
      actionableRecommendations = "",
      isDraft = false,
    } = body;

    const result = await RubricService.saveEvaluation({
      bookingId,
      mentorProfileId,
      studentUserId,
      category: category as InterviewCategory,
      targetRole,
      difficulty,
      dimensionScores,
      strengths,
      growthAreas,
      detailedFeedback,
      actionableRecommendations,
      isDraft,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Evaluation POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to save evaluation.", details: error.message },
      { status: 500 }
    );
  }
}
