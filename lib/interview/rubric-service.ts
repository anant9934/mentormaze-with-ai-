/**
 * MentorMaze Human Mock Interview Rubric Evaluation Engine
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Implements weighted rubrics across interview categories, score computation (0.0 - 10.0),
 * and draft vs published isolation.
 */

import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import { notificationService } from "@/lib/notifications/service";
import {
  InterviewCategory,
  RubricDimensionWeight,
  CATEGORY_RUBRICS,
  calculateOverallScore,
} from "./rubric-constants";

export {
  type InterviewCategory,
  type RubricDimensionWeight,
  CATEGORY_RUBRICS,
  calculateOverallScore,
};

export class RubricService {
  /**
   * Computes weighted overall score (0.00 to 10.00) based on dimension scores.
   */
  public static calculateOverallScore(
    category: InterviewCategory,
    dimensionScores: Record<string, number>
  ): number {
    return calculateOverallScore(category, dimensionScores);
  }

  /**
   * Upserts an evaluation. If isDraft === false, publishes the report and notifies candidate.
   */
  public static async saveEvaluation(params: {
    bookingId: string;
    mentorProfileId: string;
    studentUserId: string;
    category: InterviewCategory;
    targetRole: string;
    difficulty: string;
    dimensionScores: Record<string, number>;
    strengths: string[];
    growthAreas: string[];
    detailedFeedback: string;
    actionableRecommendations: string;
    isDraft: boolean;
  }) {
    await initializeDatabaseSchema();
    const db = getDb();

    const overallScore = this.calculateOverallScore(params.category, params.dimensionScores);
    const publishedAt = params.isDraft ? null : new Date();

    const result: any = await db.execute(sql`
      INSERT INTO interview_evaluations (
        booking_id,
        mentor_profile_id,
        student_user_id,
        category,
        target_role,
        difficulty,
        overall_score,
        dimension_scores,
        strengths,
        growth_areas,
        detailed_feedback,
        actionable_recommendations,
        is_draft,
        published_at,
        updated_at
      ) VALUES (
        ${params.bookingId},
        ${params.mentorProfileId},
        ${params.studentUserId},
        ${params.category},
        ${params.targetRole},
        ${params.difficulty},
        ${overallScore},
        ${JSON.stringify(params.dimensionScores)},
        ${JSON.stringify(params.strengths)},
        ${JSON.stringify(params.growthAreas)},
        ${params.detailedFeedback},
        ${params.actionableRecommendations},
        ${params.isDraft},
        ${publishedAt},
        now()
      )
      ON CONFLICT (booking_id) DO UPDATE SET
        category = EXCLUDED.category,
        target_role = EXCLUDED.target_role,
        difficulty = EXCLUDED.difficulty,
        overall_score = EXCLUDED.overall_score,
        dimension_scores = EXCLUDED.dimension_scores,
        strengths = EXCLUDED.strengths,
        growth_areas = EXCLUDED.growth_areas,
        detailed_feedback = EXCLUDED.detailed_feedback,
        actionable_recommendations = EXCLUDED.actionable_recommendations,
        is_draft = EXCLUDED.is_draft,
        published_at = COALESCE(interview_evaluations.published_at, EXCLUDED.published_at),
        updated_at = now()
      RETURNING *;
    `);

    const evaluation = result.rows?.[0] || result?.[0];

    // If published, notify student
    if (!params.isDraft) {
      try {
        await notificationService.dispatch({
          userId: params.studentUserId,
          title: "Mock Interview Scorecard Ready! 🎯",
          message: `Your mentor has published your evaluation for ${params.targetRole}. Overall Score: ${overallScore}/10.`,
          category: "mock_interviews",
          priority: "high",
          actionUrl: `/mock-interviews/${params.bookingId}/report`,
          actionLabel: "View Scorecard",
        });
      } catch (e) {
        console.warn("Non-fatal notification error on mock interview publish:", e);
      }
    }

    return {
      success: true,
      evaluation,
      overallScore,
    };
  }

  /**
   * Fetches evaluation with draft isolation.
   * If requester is student and isDraft === true, returns null.
   */
  public static async getEvaluation(
    bookingId: string,
    requesterUserId: string,
    requesterRole: string
  ) {
    await initializeDatabaseSchema();
    const db = getDb();

    const evalQuery: any = await db.execute(sql`
      SELECT ie.*,
             mp.user_id as mentor_user_id,
             u.display_name as mentor_name,
             u_student.display_name as student_name
      FROM interview_evaluations ie
      JOIN mentor_profiles mp ON mp.id = ie.mentor_profile_id
      JOIN users u ON u.id = mp.user_id
      JOIN users u_student ON u_student.id = ie.student_user_id
      WHERE ie.booking_id = ${bookingId}
      LIMIT 1;
    `);

    const evalRecord = evalQuery.rows?.[0] || evalQuery?.[0];
    if (!evalRecord) {
      return null;
    }

    const isStudent = requesterUserId === evalRecord.student_user_id || requesterRole === "student";

    // Strict Draft Isolation: Students cannot view uncompleted drafts
    if (isStudent && evalRecord.is_draft) {
      return {
        isDraft: true,
        message: "Your interview evaluation is currently being drafted by your mentor.",
      };
    }

    return evalRecord;
  }
}
