/**
 * ASTRION Bayesian Knowledge Tracing (BKT), FSRS Spaced Learning & ZPD Orchestrator Test Suite
 * Brand: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 * Reference Standard: Tutor MCP (`ArnaudGuiovanna/tutor-mcp`), FSRS-4.5
 */

import { describe, it, expect, beforeEach } from "vitest";
import { BayesianKnowledgeTracer, BKT_OUTCOME_WEIGHTS } from "../lib/ai-mentor/pedagogy/bkt-service";
import { FSRSScheduler } from "../lib/ai-mentor/pedagogy/fsrs-service";
import { AdaptiveActivityOrchestrator } from "../lib/ai-mentor/pedagogy/adaptive-activity-orchestrator";
import { StudentSkillGraph } from "../lib/ai-mentor/student-skill-graph";
import { StudentGoalService } from "../lib/ai-mentor/goals/student-goal-service";
import { AIMentorOrchestrator } from "../lib/ai-mentor/orchestrator";

describe("PR B: BKT Knowledge Tracing, FSRS Spaced Learning & ZPD Activity Orchestrator", () => {
  const TEST_STUDENT_ID = "student-bkt-fsrs-001";
  const OTHER_STUDENT_ID = "student-bkt-fsrs-002";

  beforeEach(() => {
    BayesianKnowledgeTracer.reset();
    FSRSScheduler.reset();
    StudentSkillGraph.resetCache();
    StudentGoalService.resetCache();
  });

  // --------------------------------------------------------------------------
  // 1. Bayesian Knowledge Tracing (BKT) Engine
  // --------------------------------------------------------------------------
  describe("1. Bayesian Knowledge Tracing (BKT) Mathematical Engine", () => {
    const CONCEPT_ID = "dp_memoization";

    it("initializes calibrated BKT default priors (P_L0=0.15, P_T=0.20, P_G=0.15, P_S=0.10)", () => {
      const state = BayesianKnowledgeTracer.getConceptState(TEST_STUDENT_ID, CONCEPT_ID);
      expect(state.knowledgeProbability).toBe(0.15);
      expect(state.initialProbability).toBe(0.15);
      expect(state.learnProbability).toBe(0.20);
      expect(state.guessProbability).toBe(0.15);
      expect(state.slipProbability).toBe(0.10);
      expect(state.masteryBand).toBe("novice");
      expect(state.canonicalMasteryLevel).toBe(0);
      expect(state.totalAttempts).toBe(0);
      expect(state.independentChecksCount).toBe(0);
    });

    it("updates posterior knowledge probability deterministically on independent success", () => {
      // Prior = 0.15
      // Correct observation:
      // P(L | Correct) = (0.15 * 0.90) / (0.15 * 0.90 + 0.85 * 0.15) = 0.135 / (0.135 + 0.1275) = 0.135 / 0.2625 ≈ 0.5143
      // Transition: P(L) = 0.5143 + (1 - 0.5143) * 0.20 ≈ 0.5143 + 0.0971 ≈ 0.6114
      const update1 = BayesianKnowledgeTracer.recordObservation({
        studentUserId: TEST_STUDENT_ID,
        conceptId: CONCEPT_ID,
        outcome: "independent_success",
      });

      expect(update1.previousProbability).toBe(0.15);
      expect(update1.updatedProbability).toBeGreaterThan(0.55);
      expect(update1.updatedProbability).toBeLessThan(0.65);
      expect(update1.masteryBand).toBe("developing");
      expect(update1.state.totalAttempts).toBe(1);
      expect(update1.state.independentChecksCount).toBe(1);
    });

    it("weights assistance levels: independent success increases knowledge more than hint-assisted success", () => {
      const C1 = "concept_indep";
      const C2 = "concept_hinted";

      // 1. Independent success
      const indep = BayesianKnowledgeTracer.recordObservation({
        studentUserId: TEST_STUDENT_ID,
        conceptId: C1,
        outcome: "independent_success", // O_t = 1.0, P_G = 0.15
      });

      // 2. Hint-assisted success (after worked example, Level 5)
      const hinted = BayesianKnowledgeTracer.recordObservation({
        studentUserId: TEST_STUDENT_ID,
        conceptId: C2,
        outcome: "hint_worked_example", // O_t = 0.25, P_G = 0.65
      });

      // Independent success must produce significantly higher probability than hint-assisted success
      expect(indep.updatedProbability).toBeGreaterThan(hinted.updatedProbability);
      expect(indep.state.independentChecksCount).toBe(1);
      expect(hinted.state.independentChecksCount).toBe(0); // Hint-assisted is NOT an independent check
    });

    it("does not award unearned mastery when student merely reads the full solution", () => {
      const update = BayesianKnowledgeTracer.recordObservation({
        studentUserId: TEST_STUDENT_ID,
        conceptId: "solution_read_concept",
        outcome: "solution_explained", // Level 6: solution explained
      });

      // Probability should only reflect transition from observing, without full success bump
      expect(update.updatedProbability).toBeLessThan(0.35);
      expect(update.masteryBand).toBe("novice");
      expect(update.state.independentChecksCount).toBe(0);
    });

    it("depresses knowledge probability on failed attempt", () => {
      // First advance concept to developing
      BayesianKnowledgeTracer.recordObservation({
        studentUserId: TEST_STUDENT_ID,
        conceptId: CONCEPT_ID,
        outcome: "independent_success",
      });
      const beforeFailure = BayesianKnowledgeTracer.getConceptState(TEST_STUDENT_ID, CONCEPT_ID).knowledgeProbability;

      // Fail next attempt
      const failUpdate = BayesianKnowledgeTracer.recordObservation({
        studentUserId: TEST_STUDENT_ID,
        conceptId: CONCEPT_ID,
        outcome: "failed_attempt",
      });

      expect(failUpdate.updatedProbability).toBeLessThan(beforeFailure);
    });

    it("requires at least two independent checks to earn 'mastered' band even if probability exceeds 0.95", () => {
      const C_DUAL = "concept_dual_check";

      // Give 1 transfer assessment check
      BayesianKnowledgeTracer.recordObservation({
        studentUserId: TEST_STUDENT_ID,
        conceptId: C_DUAL,
        outcome: "transfer_assessment",
      });
      // Artificially test boundary: if probability is high with only 1 check
      const state = BayesianKnowledgeTracer.getConceptState(TEST_STUDENT_ID, C_DUAL);
      expect(state.independentChecksCount).toBe(1);

      // Verify probabilityToMasteryBand invariant
      const bandWith1Check = BayesianKnowledgeTracer.probabilityToMasteryBand(0.97, 1);
      expect(bandWith1Check).toBe("proficient"); // Gated to proficient!

      const bandWith2Checks = BayesianKnowledgeTracer.probabilityToMasteryBand(0.97, 2);
      expect(bandWith2Checks).toBe("mastered"); // Promoted to mastered!
    });
  });

  // --------------------------------------------------------------------------
  // 2. Free Spaced Repetition Scheduler (FSRS) Engine
  // --------------------------------------------------------------------------
  describe("2. FSRS Spaced Retention & Power Decay Scheduler", () => {
    const CONCEPT = "sql_btree_indexing";

    it("satisfies exact mathematical retrievability target R(S, S) = 0.90", () => {
      const stability = 4.0; // 4 days stability
      // At elapsed t = 0 days, R = 1.0 (100%)
      expect(FSRSScheduler.calculateRetrievability(0, stability)).toBe(1.0);

      // At elapsed t = S days (4 days), R = (1 + 4 / (9 * 4))^-1 = (1 + 1/9)^-1 = 10/9^-1 = 0.90
      expect(FSRSScheduler.calculateRetrievability(4, stability)).toBe(0.90);

      // At elapsed t = 2S days (8 days), R ≈ 0.818
      const r8 = FSRSScheduler.calculateRetrievability(8, stability);
      expect(r8).toBeLessThan(0.85);
      expect(r8).toBeGreaterThan(0.80);
    });

    it("schedules review interval exactly at S days for 90% target retention", () => {
      const interval = FSRSScheduler.calculateReviewIntervalDays(5.0, 0.90);
      expect(interval).toBe(5.0);
    });

    it("collapses stability upon review lapse (Rating 1 'again')", () => {
      // First review: Good (3)
      const r1 = FSRSScheduler.recordReview({
        studentUserId: TEST_STUDENT_ID,
        conceptId: CONCEPT,
        rating: 3,
      });
      expect(r1.updatedStability).toBe(3.0);
      expect(r1.record.state).toBe("review");

      // Second review: Blackout / Forgot (Again = 1)
      const r2 = FSRSScheduler.recordReview({
        studentUserId: TEST_STUDENT_ID,
        conceptId: CONCEPT,
        rating: 1,
      });

      // Stability collapses down to ~0.75 or minimum bound
      expect(r2.updatedStability).toBeLessThan(r1.updatedStability);
      expect(r2.record.lapses).toBe(1);
      expect(r2.record.state).toBe("relearning");
    });

    it("expands stability exponentially on Good (3) and Easy (4) ratings", () => {
      const C_EXP = "arrays_two_pointers";

      // Review 1: Good (3) -> S = 3.0
      const rev1 = FSRSScheduler.recordReview({
        studentUserId: TEST_STUDENT_ID,
        conceptId: C_EXP,
        rating: 3,
      });
      expect(rev1.updatedStability).toBe(3.0);

      // Review 2: Easy (4) -> S expands significantly
      const rev2 = FSRSScheduler.recordReview({
        studentUserId: TEST_STUDENT_ID,
        conceptId: C_EXP,
        rating: 4,
      });
      expect(rev2.updatedStability).toBeGreaterThan(rev1.updatedStability * 1.5);
    });

    it("generates 4-tier prioritized review queue categorizing forgotten and weak concepts", () => {
      // Setup Concept 1: Severely forgotten (decayed past 70%)
      const cForgotten = "recursion_backtracking";
      FSRSScheduler.recordReview({
        studentUserId: TEST_STUDENT_ID,
        conceptId: cForgotten,
        rating: 1, // Stability = 0.4 days
        reviewTimestamp: new Date(Date.now() - 5 * 86400000).toISOString(), // 5 days ago
      });

      // Setup Concept 2: High friction / multiple lapses (Weak Concept)
      const cWeak = "dp_space_optimization";
      FSRSScheduler.recordReview({
        studentUserId: TEST_STUDENT_ID,
        conceptId: cWeak,
        rating: 1,
      });
      FSRSScheduler.recordReview({
        studentUserId: TEST_STUDENT_ID,
        conceptId: cWeak,
        rating: 1, // Lapses = 2
      });

      // Setup Concept 3: Fresh concept with durable mastery (R = 1.0)
      const cMastered = "arrays_fundamentals";
      FSRSScheduler.recordReview({
        studentUserId: TEST_STUDENT_ID,
        conceptId: cMastered,
        rating: 4, // Stability = 8.0 days, reviewed just now
      });

      const queue = FSRSScheduler.generateReviewQueue(TEST_STUDENT_ID, {
        prerequisiteConceptIds: [cForgotten],
      });

      // Forgotten concept must be in forgottenConcepts queue
      expect(queue.forgottenConcepts.some((i) => i.conceptId === cForgotten)).toBe(true);

      // Weak concept must be in weakConcepts queue
      expect(queue.weakConcepts.some((i) => i.conceptId === cWeak)).toBe(true);

      // Mastered fresh concept must NOT be due for review (No arbitrary scheduling!)
      expect(queue.dailyReviewQueue.some((i) => i.conceptId === cMastered)).toBe(false);

      // Prioritized queue must place the most decayed retrievability first
      expect(queue.prioritizedQueue.length).toBeGreaterThanOrEqual(2);
      expect(queue.prioritizedQueue[0].conceptId).toBe(cForgotten);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Zone of Proximal Development (ZPD) Activity Orchestrator
  // --------------------------------------------------------------------------
  describe("3. ZPD & Adaptive Activity Orchestrator Decision Engine", () => {
    it("enforces Rule 1 (Review Precedence): prioritizes forgotten concept recovery over new topics", () => {
      // Seed a decaying concept (R < 0.70)
      FSRSScheduler.recordReview({
        studentUserId: TEST_STUDENT_ID,
        conceptId: "trees_graphs",
        rating: 1,
        reviewTimestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
      });

      const decision = AdaptiveActivityOrchestrator.selectNextActivity({
        studentUserId: TEST_STUDENT_ID,
        activeTopic: "dynamic_programming",
      });

      expect(decision.learningPhase).toBe("7_spaced_review");
      expect(decision.recommendedSkillId).toBe("trees_graphs");
      expect(decision.teachingStrategy).toBe("retrieval_practice");
      expect(decision.reasonForRecommendation).toContain("threshold: 70%");
    });

    it("enforces Rule 2 (Prerequisite Gate): blocks DP and routes to Recursion if prerequisite is below Level 3", () => {
      // Student has no recursion mastery recorded (Level 0)
      const decision = AdaptiveActivityOrchestrator.selectNextActivity({
        studentUserId: TEST_STUDENT_ID,
        activeTopic: "dynamic_programming",
      });

      expect(decision.learningPhase).toBe("3_guided_practice");
      expect(decision.recommendedSkillId).toBe("recursion");
      expect(decision.reasonForRecommendation).toContain("requires Level 3");
      expect(decision.supportingEvidence).toContain("Required Mastery: Level 3 (Competent)");
    });

    it("enforces Rule 3 (ZPD Entry): guides through 7-phase pedagogical progression as mastery develops", () => {
      // 1. Satisfy prerequisites
      StudentSkillGraph.recordEvidence(TEST_STUDENT_ID, "recursion", 8.0, "code_execution");
      StudentSkillGraph.recordEvidence(TEST_STUDENT_ID, "recursion", 8.5, "code_execution"); // Level 4
      StudentSkillGraph.recordEvidence(TEST_STUDENT_ID, "arrays_strings", 8.0, "code_execution");
      StudentSkillGraph.recordEvidence(TEST_STUDENT_ID, "arrays_strings", 8.5, "code_execution"); // Level 4

      // Step A: Brand new DP concept -> Phase 2 Initial Instruction (Socratic Conceptual Intuition)
      const decIntro = AdaptiveActivityOrchestrator.selectNextActivity({
        studentUserId: TEST_STUDENT_ID,
        activeTopic: "dynamic_programming",
      });
      expect(decIntro.learningPhase).toBe("2_initial_instruction");
      expect(decIntro.recommendedDifficulty).toBe("introductory");
      expect(decIntro.teachingStrategy).toBe("conceptual_explanation");

      // Step B: Record single assessment (Mastery Level 2 / Developing) -> Phase 3 Guided Practice with hints
      StudentSkillGraph.recordEvidence(TEST_STUDENT_ID, "dp_subproblems", 6.0, "code_execution");
      BayesianKnowledgeTracer.recordObservation({
        studentUserId: TEST_STUDENT_ID,
        conceptId: "dp_subproblems",
        outcome: "hint_probing",
      });

      const decGuided = AdaptiveActivityOrchestrator.selectNextActivity({
        studentUserId: TEST_STUDENT_ID,
        activeTopic: "dynamic_programming",
        activeSkillId: "dp_subproblems",
      });
      expect(decGuided.learningPhase).toBe("3_guided_practice");
      expect(decGuided.teachingStrategy).toBe("progressive_hints");

      // Step C: Record single independent success (Level 3 / Competent) -> Phase 4 Independent Practice
      StudentSkillGraph.recordEvidence(TEST_STUDENT_ID, "dp_subproblems", 8.5, "code_execution");
      BayesianKnowledgeTracer.recordObservation({
        studentUserId: TEST_STUDENT_ID,
        conceptId: "dp_subproblems",
        outcome: "hint_property",
      });

      const decIndep = AdaptiveActivityOrchestrator.selectNextActivity({
        studentUserId: TEST_STUDENT_ID,
        activeTopic: "dynamic_programming",
        activeSkillId: "dp_subproblems",
      });
      expect(decIndep.learningPhase).toBe("4_independent_practice");
      expect(decIndep.teachingStrategy).toBe("socratic_guidance");

      // Step D: Record second independent success (Level 4 / Proficient) -> Phase 5 Transfer Challenge
      StudentSkillGraph.recordEvidence(TEST_STUDENT_ID, "dp_subproblems", 9.0, "code_execution");
      BayesianKnowledgeTracer.recordObservation({
        studentUserId: TEST_STUDENT_ID,
        conceptId: "dp_subproblems",
        outcome: "independent_success",
      });

      const decTransfer = AdaptiveActivityOrchestrator.selectNextActivity({
        studentUserId: TEST_STUDENT_ID,
        activeTopic: "dynamic_programming",
        activeSkillId: "dp_subproblems",
      });
      expect(decTransfer.learningPhase).toBe("5_transfer_challenge");
      expect(decTransfer.teachingStrategy).toBe("challenge_mode");
    });
  });

  // --------------------------------------------------------------------------
  // 4. End-to-End AIMentorOrchestrator Integration
  // --------------------------------------------------------------------------
  describe("4. End-to-End Orchestrator Integration & Inspectability", () => {
    it("attaches BKT knowledge estimates, FSRS retrievability, and learning phase to turn response", async () => {
      const turn = await AIMentorOrchestrator.processTurn({
        studentUserId: TEST_STUDENT_ID,
        userMessage: "What is an index in PostgreSQL?",
        activeTopic: "relational_db_sql",
      });

      expect(turn.adaptiveContext).toBeDefined();
      expect(turn.adaptiveContext?.bktKnowledgeEstimate).toBeDefined();
      expect(turn.adaptiveContext?.bktMasteryBand).toBeDefined();
      expect(turn.adaptiveContext?.fsrsRetrievability).toBeDefined();
      expect(turn.adaptiveContext?.fsrsStabilityDays).toBeDefined();
      expect(turn.adaptiveContext?.learningPhase).toBeDefined();
      expect(turn.adaptiveContext?.reviewQueueLength).toBeDefined();
      expect(turn.adaptiveContext?.reasonForRecommendation.length).toBeGreaterThan(10);
    });
  });
});
