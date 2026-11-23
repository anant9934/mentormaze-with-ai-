/**
 * ASTRION Zone of Proximal Development (ZPD) & Adaptive Activity Orchestrator
 * Brand: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 * Specification Code: SPEC-ASTRION-ZPD-001
 *
 * Deterministic decision engine mapping student goals, BKT probabilities,
 * FSRS review queues, and prerequisite graphs to the optimal next learning activity.
 */

import {
  AdaptiveActivityDecision,
  LearningPhase,
  TeachingStrategy,
  BKTMasteryBand,
  CanonicalMasteryLevel,
} from "../types";
import { BayesianKnowledgeTracer } from "./bkt-service";
import { FSRSScheduler } from "./fsrs-service";
import { StudentSkillGraph } from "../student-skill-graph";
import { StudentGoalService } from "../goals/student-goal-service";
import { TOPIC_DECOMPOSITIONS, SubskillDefinition } from "../socratic-teaching-engine";
import { CANONICAL_TAXONOMY } from "../skills-constants";

export interface ActivitySelectionInput {
  studentUserId: string;
  activeTopic?: string;
  activeSkillId?: string;
  targetGoalId?: string;
  targetGoal?: { id: string; title: string };
  userMessage?: string;
  timeAvailableMinutes?: number;
  difficultyPreference?: "introductory" | "developing" | "intermediate" | "advanced" | "rigorous";
  requestingUserId?: string;
}

function getSkillDisplayName(skillId: string): string {
  const tax = CANONICAL_TAXONOMY.find((t) => t.id === skillId);
  if (tax) return tax.name;
  return skillId
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export class AdaptiveActivityOrchestrator {
  /**
   * Deterministically decides the next pedagogical activity in the student's ZPD
   */
  public static selectNextActivity(input: ActivitySelectionInput): AdaptiveActivityDecision {
    const {
      studentUserId,
      activeTopic = "dynamic_programming",
      activeSkillId,
      targetGoal,
      requestingUserId,
      difficultyPreference,
    } = input;

    // 1. Resolve Active Primary Goal
    const activeGoal = targetGoal || StudentGoalService.getActivePrimaryGoalSync(studentUserId);

    // 2. Query FSRS Spaced Review Queue
    const reviewQueueResult = FSRSScheduler.generateReviewQueue(studentUserId, {
      requestingUserId,
    });
    const reviewQueueLength = reviewQueueResult.totalDue;

    // RULE 1: Review Precedence (Forgotten Concepts & Urgent Spaced Reviews)
    // If student has an urgently decayed concept (R < 0.70 or overdue review), prioritize a warm-up retrieval review
    if (reviewQueueResult.forgottenConcepts.length > 0) {
      const urgentReview = reviewQueueResult.forgottenConcepts[0];
      const bktState = BayesianKnowledgeTracer.getConceptState(studentUserId, urgentReview.conceptId, requestingUserId);

      return {
        recommendedSkillId: urgentReview.conceptId,
        recommendedSkillName: urgentReview.conceptName,
        recommendedActivity: `Forgotten Concept Recovery: Spaced Retrieval for ${urgentReview.conceptName}`,
        recommendedDifficulty: "developing",
        learningPhase: "7_spaced_review",
        teachingStrategy: "retrieval_practice",
        expectedLearningObjective: `Re-consolidate core invariants of ${urgentReview.conceptName} before retrievability decays further.`,
        reasonForRecommendation: `FSRS retrievability for '${urgentReview.conceptName}' has dropped to ${Math.round(urgentReview.retrievability * 100)}% (threshold: 70%). Immediate spaced recovery scheduled.`,
        supportingEvidence: [
          `FSRS Retrievability: ${urgentReview.retrievability}`,
          `FSRS Stability: ${urgentReview.stability} days`,
          `BKT Latent Knowledge: ${bktState.knowledgeProbability}`,
        ],
        reviewQueueLength,
        bktKnowledgeEstimate: bktState.knowledgeProbability,
        bktMasteryBand: bktState.masteryBand,
      };
    }

    // 3. Resolve Topic Decomposition & Subskills
    const normTopic = activeTopic.trim().toLowerCase().replace(/[\s-]+/g, "_");
    const decomp = TOPIC_DECOMPOSITIONS[normTopic] || TOPIC_DECOMPOSITIONS.dynamic_programming;
    const subskills = decomp.subskills;

    // 4. Inspect Prerequisites & Current Mastery States across Subskills
    const studentSkills = StudentSkillGraph.getStudentSkills(studentUserId);
    const skillMap = new Map(studentSkills.map((s) => [s.skillId, s]));

    // RULE 2: Prerequisite Gate
    // Check if topic core prerequisites are met
    for (const prereqId of decomp.corePrerequisites) {
      const prereqRecord = skillMap.get(prereqId);
      const prereqMastery = prereqRecord?.masteryLevel ?? 0;
      if (prereqMastery < 3) {
        const prereqName = getSkillDisplayName(prereqId);
        const bktState = BayesianKnowledgeTracer.getConceptState(studentUserId, prereqId, requestingUserId);
        return {
          recommendedSkillId: prereqId,
          recommendedSkillName: prereqName,
          recommendedActivity: `Prerequisite Reinforcement: ${prereqName}`,
          recommendedDifficulty: "developing",
          learningPhase: "3_guided_practice",
          teachingStrategy: "progressive_hints",
          expectedLearningObjective: `Achieve Level 3 (Competent) in foundational prerequisite '${prereqName}' before advancing in ${decomp.topicTitle}.`,
          reasonForRecommendation: `Core prerequisite '${prereqName}' is currently at Level ${prereqMastery} (requires Level 3). Advancing without solid foundation induces cognitive overload.`,
          supportingEvidence: [
            `Prerequisite: ${prereqId}`,
            `Current Mastery: Level ${prereqMastery}`,
            `Required Mastery: Level 3 (Competent)`,
          ],
          reviewQueueLength,
          bktKnowledgeEstimate: bktState.knowledgeProbability,
          bktMasteryBand: bktState.masteryBand,
        };
      }
    }

    // RULE 3: ZPD Entry Selection
    // Find the current frontier subskill within the active topic:
    // The first subskill whose prerequisites are satisfied and whose mastery is not yet 5
    let targetSubskill: SubskillDefinition = subskills[0];
    if (activeSkillId) {
      const found = subskills.find((s) => s.id === activeSkillId);
      if (found) targetSubskill = found;
    } else {
      for (const sub of subskills) {
        const rec = skillMap.get(sub.id);
        const mLevel = rec?.masteryLevel ?? 0;
        if (mLevel < 4) {
          targetSubskill = sub;
          break;
        }
      }
    }

    const currentSkillRecord = skillMap.get(targetSubskill.id);
    const currentMastery = currentSkillRecord?.masteryLevel ?? 0;
    const bktState = BayesianKnowledgeTracer.getConceptState(studentUserId, targetSubskill.id, requestingUserId);
    const pL = bktState.knowledgeProbability;
    const band = bktState.masteryBand;

    // Determine Learning Phase & Activity based on ZPD State
    let learningPhase: LearningPhase = "2_initial_instruction";
    let teachingStrategy: TeachingStrategy = "conceptual_explanation";
    let activityTitle = "";
    let objective = "";
    let reason = "";
    let difficultyTier: "introductory" | "developing" | "intermediate" | "advanced" | "rigorous" =
      difficultyPreference || "intermediate";

    if (currentMastery >= 5 || (currentMastery >= 4 && band === "mastered")) {
      // Level 5: Mastered -> Maintenance Spaced Retrieval
      learningPhase = "7_spaced_review";
      teachingStrategy = "retrieval_practice";
      difficultyTier = "advanced";
      activityTitle = `Long-Term Retention Check: ${targetSubskill.name}`;
      objective = `Verify durable recall and zero latency degradation on mastered concept.`;
      reason = `Mastery Level 5 verified. Maintaining long-term retention on FSRS maintenance schedule.`;
    } else if (currentMastery >= 4 || band === "proficient") {
      // Phase 5 / Phase 6: Proficient ($0.86 - 0.95$) -> Transfer Challenge & Edge-Case Verification
      if (bktState.independentChecksCount >= 2 && pL >= 0.90) {
        learningPhase = "6_mastery_verification";
        teachingStrategy = "challenge_mode";
        difficultyTier = "rigorous";
        activityTitle = `Mastery Verification & Edge-Case Defense: ${targetSubskill.name}`;
        objective = `Demonstrate Level 5 mastery by explaining edge cases and trade-offs.`;
        reason = `Two independent checks passed (BKT: ${Math.round(pL * 100)}%). Completing final verification for Level 5 mastery badge.`;
      } else {
        learningPhase = "5_transfer_challenge";
        teachingStrategy = "challenge_mode";
        difficultyTier = "advanced";
        activityTitle = `Cross-Domain Transfer Challenge: ${targetSubskill.name}`;
        objective = `Transfer ${targetSubskill.name} principles to an unfamiliar problem domain.`;
        reason = `Current mastery is Level 4 (Proficient). Transfer assessment required to prove durable conceptual depth.`;
      }
    } else if (currentMastery >= 3 || band === "competent") {
      // Phase 4: Competent ($0.66 - 0.85$) -> Independent Problem Solving without automatic hints
      learningPhase = "4_independent_practice";
      teachingStrategy = "socratic_guidance";
      difficultyTier = "intermediate";
      activityTitle = `Independent Problem Solving: ${targetSubskill.name}`;
      objective = `Solve non-trivial algorithmic problems on ${targetSubskill.name} unassisted.`;
      reason = `Demonstrated competent foundation (BKT: ${Math.round(pL * 100)}%). Ready for independent evaluation without hints to earn Level 4.`;
    } else if (currentMastery >= 1 || band === "developing") {
      // Phase 3: Developing ($0.36 - 0.65$) -> Scaffolded Guided Practice with 6-level hint ladder
      learningPhase = "3_guided_practice";
      teachingStrategy = "progressive_hints";
      difficultyTier = "developing";
      activityTitle = `Guided Practice with Scaffolding: ${targetSubskill.name}`;
      objective = `Apply ${targetSubskill.name} to solve representative problems with progressive hints.`;
      reason = `Current mastery is Level ${currentMastery} (Developing, BKT: ${Math.round(pL * 100)}%). Scaffolding needed to bridge to independent execution.`;
    } else {
      // Phase 1 / Phase 2: Unintroduced concept -> Socratic Conceptual Intuition
      learningPhase = "2_initial_instruction";
      teachingStrategy = "conceptual_explanation";
      difficultyTier = "introductory";
      activityTitle = `Conceptual Intuition & Socratic Inquiry: ${targetSubskill.name}`;
      objective = `Understand the core invariant and rationale of ${targetSubskill.name}.`;
      reason = `Initial concept exposure in ${decomp.topicTitle}. Establishing structural mental model before code execution.`;
    }

    const supportingEvidence = [
      `Active Subskill: ${targetSubskill.name} (${targetSubskill.id})`,
      `Canonical Mastery Level: Level ${currentMastery}`,
      `BKT Latent Knowledge Estimate: ${pL} (${band})`,
      `Independent Checks Passed: ${bktState.independentChecksCount}`,
      `Review Queue Backlog: ${reviewQueueLength} items`,
    ];

    if (activeGoal) {
      supportingEvidence.push(`Aligned Career Goal: ${activeGoal.title}`);
    }

    return {
      recommendedSkillId: targetSubskill.id,
      recommendedSkillName: targetSubskill.name,
      recommendedActivity: activityTitle,
      recommendedDifficulty: difficultyTier,
      learningPhase,
      teachingStrategy,
      expectedLearningObjective: objective,
      reasonForRecommendation: reason,
      supportingEvidence,
      reviewQueueLength,
      bktKnowledgeEstimate: pL,
      bktMasteryBand: band,
    };
  }
}
