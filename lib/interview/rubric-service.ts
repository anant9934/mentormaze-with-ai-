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

export type InterviewCategory =
  | "sde_frontend"
  | "sde_backend"
  | "system_design"
  | "behavioral"
  | "data_science"
  | "product_management";

export interface RubricDimensionWeight {
  key: string;
  label: string;
  weight: number; // percentage, e.g. 25
  description: string;
}

export const CATEGORY_RUBRICS: Record<InterviewCategory, RubricDimensionWeight[]> = {
  sde_backend: [
    { key: "technical", label: "Data Structures & Algorithms", weight: 25, description: "Correctness of algorithmic approach, asymptotic complexity, optimality" },
    { key: "problem_solving", label: "Problem Decomposition", weight: 25, description: "Breaking down complex specifications, asking clarifying questions" },
    { key: "code_quality", label: "Clean Code & Modularity", weight: 20, description: "Idiomatic syntax, naming conventions, separation of concerns" },
    { key: "edge_cases", label: "Edge Cases & Testing", weight: 15, description: "Handling nulls, boundary constraints, overflow, unit test readiness" },
    { key: "communication", label: "Technical Articulation", weight: 15, description: "Explaining thought process clearly while coding" },
  ],
  sde_frontend: [
    { key: "technical", label: "DOM, JavaScript & Frameworks", weight: 25, description: "React / modern JS core knowledge, state management, lifecycle" },
    { key: "ui_ux", label: "UI Layout & Styling Architecture", weight: 25, description: "CSS/Tailwind proficiency, responsive design, visual hierarchy" },
    { key: "performance", label: "Web Performance & Accessibility", weight: 20, description: "Render optimization, memoization, WCAG accessibility compliance" },
    { key: "problem_solving", label: "Interactive Component Design", weight: 15, description: "Managing asynchronous flows, form validation, error states" },
    { key: "communication", label: "Articulation & Collaboration", weight: 15, description: "Clear explanation of architectural tradeoffs" },
  ],
  system_design: [
    { key: "architecture", label: "High-Level Architecture", weight: 30, description: "Microservices vs monolith, load balancers, API gateways, database choices" },
    { key: "scalability", label: "Scalability & Fault Tolerance", weight: 25, description: "Horizontal partitioning, caching (Redis), replication, failover" },
    { key: "data_modeling", label: "Data Modeling & Schema", weight: 20, description: "Relational vs NoSQL, indexing, consistency models (CAP theorem)" },
    { key: "estimations", label: "Back-of-the-Envelope Math", weight: 15, description: "QPS, storage, throughput, bandwidth calculations" },
    { key: "communication", label: "Design Tradeoff Defense", weight: 10, description: "Defending design choices under changing load constraints" },
  ],
  behavioral: [
    { key: "star_method", label: "STAR Structure & Storytelling", weight: 30, description: "Situation, Task, Action, and Result framing" },
    { key: "leadership", label: "Ownership & Initiative", weight: 25, description: "Going above and beyond, leading through ambiguity" },
    { key: "conflict_resolution", label: "Conflict & Disagreement", weight: 20, description: "Handling stakeholder conflicts constructively" },
    { key: "culture_fit", label: "Culture & Value Alignment", weight: 15, description: "Teamwork, empathy, growth mindset, ethical grounding" },
    { key: "communication", label: "Executive Presence & Clarity", weight: 10, description: "Concise, articulate, high-confidence delivery" },
  ],
  data_science: [
    { key: "ml_fundamentals", label: "Machine Learning Theory", weight: 25, description: "Supervised/unsupervised, loss functions, overfitting mitigation" },
    { key: "statistics", label: "Applied Statistics & Probability", weight: 25, description: "Hypothesis testing, A/B experimentation, metrics selection" },
    { key: "feature_engineering", label: "Feature Engineering & Data Pipeline", weight: 20, description: "Transformations, handling missing data, scalability" },
    { key: "model_evaluation", label: "Model Evaluation & Tradeoffs", weight: 15, description: "Precision, Recall, ROC-AUC, bias-variance balance" },
    { key: "communication", label: "Translating Data to Business Impact", weight: 15, description: "Explaining ML concepts clearly to stakeholders" },
  ],
  product_management: [
    { key: "product_sense", label: "Product Sense & Vision", weight: 30, description: "User persona empathy, pain point identification, problem framing" },
    { key: "execution", label: "Execution & Metrics", weight: 25, description: "North Star metric, guardrail metrics, feature prioritization frameworks" },
    { key: "strategy", label: "Strategic Thinking & Moats", weight: 20, description: "Competitive landscape, go-to-market, pricing, ecosystem impact" },
    { key: "leadership", label: "Cross-Functional Influence", weight: 15, description: "Rallying engineering, design, and executive stakeholders" },
    { key: "communication", label: "Crisp Articulation", weight: 10, description: "Structured, concise, defensible presentation" },
  ],
};

export class RubricService {
  /**
   * Computes weighted overall score (0.00 to 10.00) based on dimension scores.
   */
  public static calculateOverallScore(
    category: InterviewCategory,
    dimensionScores: Record<string, number>
  ): number {
    const dimensions = CATEGORY_RUBRICS[category] || CATEGORY_RUBRICS.sde_backend;
    let weightedSum = 0;
    let totalWeight = 0;

    for (const dim of dimensions) {
      const score = Number(dimensionScores[dim.key] ?? 5.0);
      const clampedScore = Math.min(10.0, Math.max(0.0, score));
      weightedSum += clampedScore * dim.weight;
      totalWeight += dim.weight;
    }

    const overall = totalWeight > 0 ? weightedSum / totalWeight : 5.0;
    return Number(overall.toFixed(2));
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
