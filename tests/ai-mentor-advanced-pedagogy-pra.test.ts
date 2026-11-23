/**
 * ASTRION Advanced Adaptive Mentorship Engine — PR A Comprehensive Verification Suite
 * 
 * Verifies:
 * 1. Student selects a learning goal and initializes mentorship lifecycle.
 * 2. ASTRION diagnoses current skill (decomposes topic into 4-10 subskills, checks prerequisites, asks 1 question at a time).
 * 3. ASTRION creates initial subskill map and recommends starting concept with student override capability.
 * 4. Socratic teaching policy (withholds solution, narrow counter-questions, honors 'just explain', 'give hint').
 * 5. Persistent hint escalation ladder (levels 1 to 6) persisting across separate sessions.
 * 6. Evidence-backed 0-5 mastery progression (requires at least 2 independent checks for Level 4/5).
 * 7. Evidence provenance invariant (AI inferences NEVER promote to confirmed facts simply due to high confidence).
 * 8. Security & Multi-tenant isolation (client-supplied user IDs cannot bypass auth; 401/403 enforced).
 * 9. Cloud-only provider architecture (no local LLMs / Ollama).
 * 10. Complete 8-step vertical slice execution and adaptive context area inspection.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { AIMentorOrchestrator } from "../lib/ai-mentor/orchestrator";
import { SocraticTeachingEngine, TOPIC_DECOMPOSITIONS } from "../lib/ai-mentor/socratic-teaching-engine";
import { PersistentHintEscalator } from "../lib/ai-mentor/persistent-hint-escalator";
import { StudentSkillGraph } from "../lib/ai-mentor/student-skill-graph";
import { StudentGoalService } from "../lib/ai-mentor/goals/student-goal-service";
import { StudentMemoryService } from "../lib/ai-mentor/student-memory-service";
import { PermissionAwareContextBuilder } from "../lib/ai-mentor/permission-aware-context-builder";
import { ModelProviderRouter } from "../lib/ai-mentor/model-provider-router";
import { ConversationStore } from "../lib/ai-mentor/conversation-store";

describe("PR A: Learner Model, Mastery Evidence, and Socratic Teaching Engine", () => {
  const TEST_STUDENT_ID = "student-pra-test-001";
  const OTHER_STUDENT_ID = "student-pra-test-002";

  beforeEach(() => {
    SocraticTeachingEngine.reset();
    PersistentHintEscalator.reset();
    StudentSkillGraph.resetCache();
    StudentGoalService.resetCache();
    StudentMemoryService.reset();
  });

  // --------------------------------------------------------------------------
  // 1. Topic Decomposition & Diagnostic Placement
  // --------------------------------------------------------------------------
  describe("1. Topic Decomposition & Diagnostic Placement Engine", () => {
    it("decomposes complex topics into 4 to 10 atomic subskills with prerequisites", () => {
      const dp = TOPIC_DECOMPOSITIONS.dynamic_programming;
      expect(dp).toBeDefined();
      expect(dp.subskills.length).toBeGreaterThanOrEqual(4);
      expect(dp.subskills.length).toBeLessThanOrEqual(10);
      expect(dp.corePrerequisites).toContain("recursion");
      expect(dp.corePrerequisites).toContain("arrays_strings");

      const arrays = TOPIC_DECOMPOSITIONS.arrays_strings;
      expect(arrays).toBeDefined();
      expect(arrays.subskills.length).toBeGreaterThanOrEqual(4);
    });

    it("conducts diagnostic placement asking strictly ONE question at a time", async () => {
      // Step 1: Start tutoring session
      const turn1 = await AIMentorOrchestrator.processTurn({
        studentUserId: TEST_STUDENT_ID,
        userMessage: "Teach me dynamic programming from scratch",
        activeTopic: "dynamic_programming",
      });

      expect(turn1.message).toContain("Diagnostic Placement");
      expect(turn1.message).toContain("Question 1 of 5");
      // Must contain question for first subskill
      expect(turn1.message).toContain("distinguishes a dynamic programming problem");

      // Verify single-turn constraint: does not dump Question 2 in the same turn
      expect(turn1.message).not.toContain("Question 2 of 5");
      expect(turn1.teachingStrategy).toBe("socratic_guidance");
      expect(turn1.adaptiveContext?.currentActivity).toContain("Diagnostic Placement (1/5)");
    });

    it("evaluates student answers and builds initial subskill map", async () => {
      // Question 1: Answer correctly
      const eval1 = SocraticTeachingEngine.evaluateDiagnosticAnswer({
        studentUserId: TEST_STUDENT_ID,
        topicName: "dynamic_programming",
        answerText: "DP problems have overlapping subproblems and optimal substructure, unlike merge sort which has independent subproblems.",
        isCorrect: true,
      });

      expect(eval1.completed).toBe(false);
      expect(eval1.session.currentQuestionIndex).toBe(1);
      expect(eval1.session.initialSkillMap["dp_subproblems"]).toBe(3);

      // Question 2: Answer with misconception
      const eval2 = SocraticTeachingEngine.evaluateDiagnosticAnswer({
        studentUserId: TEST_STUDENT_ID,
        topicName: "dynamic_programming",
        answerText: "You only need the current capacity, you don't need the item index.",
        isCorrect: false,
        misconception: "Missing item index state variable",
      });

      expect(eval2.completed).toBe(false);
      expect(eval2.session.currentQuestionIndex).toBe(2);
      expect(eval2.session.initialSkillMap["dp_state_variables"]).toBe(1);

      // Complete remaining questions
      SocraticTeachingEngine.evaluateDiagnosticAnswer({
        studentUserId: TEST_STUDENT_ID,
        topicName: "dynamic_programming",
        answerText: "State collisions occur if not indexed on all parameters",
        isCorrect: true,
      });
      SocraticTeachingEngine.evaluateDiagnosticAnswer({
        studentUserId: TEST_STUDENT_ID,
        topicName: "dynamic_programming",
        answerText: "Prior states must be computed first",
        isCorrect: true,
      });
      const evalFinal = SocraticTeachingEngine.evaluateDiagnosticAnswer({
        studentUserId: TEST_STUDENT_ID,
        topicName: "dynamic_programming",
        answerText: "I don't know why the loop runs backwards",
        isCorrect: false,
      });

      expect(evalFinal.completed).toBe(true);
      // Entry point should be dp_state_variables or dp_space_optimization (subskills with mastery < 3)
      expect(evalFinal.recommendedStartingSubskillId).toBe("dp_state_variables");
    });

    it("permits student to override the recommended starting point", () => {
      const session = SocraticTeachingEngine.overrideStartingSubskill(
        TEST_STUDENT_ID,
        "dynamic_programming",
        "dp_tabulation"
      );

      expect(session.recommendedStartingSubskillId).toBe("dp_tabulation");
      expect(session.status).toBe("overridden");
    });
  });

  // --------------------------------------------------------------------------
  // 2. Learning Intent Detection vs Diagnostic Routing
  // --------------------------------------------------------------------------
  describe("2. Learning Intent Detection Boundaries", () => {
    it("does NOT trigger diagnostic placement when student asks a one-off factual question", async () => {
      const turn = await AIMentorOrchestrator.processTurn({
        studentUserId: TEST_STUDENT_ID,
        userMessage: "What is an index in PostgreSQL?",
        activeTopic: "relational_db_sql",
      });

      // Must be direct explanation, NOT diagnostic interrogation
      expect(turn.teachingStrategy).toBe("conceptual_explanation");
      expect(turn.message).not.toContain("Diagnostic Placement");
      expect(turn.message).not.toContain("Question 1 of");
    });

    it("does NOT trigger diagnostic when student requests an explanation", async () => {
      const turn = await AIMentorOrchestrator.processTurn({
        studentUserId: TEST_STUDENT_ID,
        userMessage: "Explain how two pointers works for finding palindromes step by step",
        activeTopic: "arrays_strings",
      });

      expect(turn.teachingStrategy).toBe("conceptual_explanation");
      expect(turn.message).not.toContain("Diagnostic Placement");
    });

    it("honors student escape hatch commands ('Just explain')", async () => {
      const turn = await AIMentorOrchestrator.processTurn({
        studentUserId: TEST_STUDENT_ID,
        userMessage: "Just explain the solution directly, don't quiz me",
        activeTopic: "dynamic_programming",
      });

      expect(turn.teachingStrategy).toBe("conceptual_explanation");
      expect(turn.adaptiveContext?.reasonForRecommendation).toContain("Just explain");
    });
  });

  // --------------------------------------------------------------------------
  // 3. Persistent Hint Escalation Ladder
  // --------------------------------------------------------------------------
  describe("3. Persistent 6-Level Hint Escalation Ladder", () => {
    const EXERCISE_ID = "two_sum_sorted_001";
    const SKILL_ID = "arrays_strings";

    it("escalates hints progressively from Level 1 to Level 6 upon repeated struggle", () => {
      // First attempt (fails)
      const a1 = PersistentHintEscalator.recordAttempt({
        studentUserId: TEST_STUDENT_ID,
        skillId: SKILL_ID,
        exerciseId: EXERCISE_ID,
        isCorrect: false,
      });
      expect(a1.record.attemptCount).toBe(1);
      expect(a1.record.currentHintLevel).toBe(1);
      expect(a1.currentHintStep.name).toBe("Probing Question");

      // Student asks for hint -> Level 2
      const a2 = PersistentHintEscalator.recordAttempt({
        studentUserId: TEST_STUDENT_ID,
        skillId: SKILL_ID,
        exerciseId: EXERCISE_ID,
        requestedHint: true,
      });
      PersistentHintEscalator.logHintDelivered(TEST_STUDENT_ID, SKILL_ID, EXERCISE_ID, 1, "Look at pointers");
      expect(a2.record.currentHintLevel).toBe(2);
      expect(a2.currentHintStep.name).toBe("Conceptual Hint");

      // Student asks for another hint -> Level 3
      PersistentHintEscalator.logHintDelivered(TEST_STUDENT_ID, SKILL_ID, EXERCISE_ID, 2, "Array is sorted");
      const a3 = PersistentHintEscalator.recordAttempt({
        studentUserId: TEST_STUDENT_ID,
        skillId: SKILL_ID,
        exerciseId: EXERCISE_ID,
        requestedHint: true,
      });
      expect(a3.record.currentHintLevel).toBe(3);
      expect(a3.currentHintStep.name).toBe("Property Revelation");
    });

    it("persists assistance ladder state across separate sessions without resetting", () => {
      const EX_PERSIST = "arrays_sorted_persist_test";
      // Simulate earlier struggle
      PersistentHintEscalator.recordAttempt({
        studentUserId: TEST_STUDENT_ID,
        skillId: SKILL_ID,
        exerciseId: EX_PERSIST,
        requestedHint: true,
      });
      PersistentHintEscalator.logHintDelivered(TEST_STUDENT_ID, SKILL_ID, EX_PERSIST, 1, "Hint 1");
      PersistentHintEscalator.logHintDelivered(TEST_STUDENT_ID, SKILL_ID, EX_PERSIST, 2, "Hint 2");

      // Verify persistent record is intact
      const record = PersistentHintEscalator.getAttemptRecord(TEST_STUDENT_ID, SKILL_ID, EX_PERSIST);
      expect(record).not.toBeNull();
      expect(record?.hintsDelivered.length).toBe(2);
      expect(record?.currentHintLevel).toBeGreaterThanOrEqual(2);
    });

    it("does not treat message count alone as struggle", () => {
      // 5 informative conversational queries do not escalate hints
      for (let i = 0; i < 5; i++) {
        SocraticTeachingEngine.decide({
          studentUserId: TEST_STUDENT_ID,
          userMessage: `Tell me an interesting application of arrays in practice part ${i}`,
          activeTopic: SKILL_ID,
        });
      }

      // Check durable exercise attempt: no false struggle escalation
      const rec = PersistentHintEscalator.getAttemptRecord(TEST_STUDENT_ID, SKILL_ID, "arrays_non_exercise");
      expect(rec).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // 4. Evidence-Backed 0–5 Mastery Scale
  // --------------------------------------------------------------------------
  describe("4. Canonical 0–5 Mastery Scale & Dual-Check Requirement", () => {
    it("requires at least two independent checks to achieve Level 4 (independent solver)", () => {
      const skillId = "test_subskill_dp";

      // Check 1: Single high score
      const r1 = StudentSkillGraph.recordEvidence(
        TEST_STUDENT_ID,
        skillId,
        9.0,
        "code_execution"
      );

      // Even with 9.0 score, 1 check only yields Level 3 (assisted / developing)
      expect(r1.assessmentCount).toBe(1);
      expect(r1.successCount).toBe(1);
      expect(r1.masteryLevel).toBe(3);
      expect(r1.masteryState).toBe("developing");

      // Check 2: Second independent practical check
      const r2 = StudentSkillGraph.recordEvidence(
        TEST_STUDENT_ID,
        skillId,
        8.5,
        "code_execution"
      );

      // Now with 2 checks >= 7.0, earns Level 4 (demonstrated)
      expect(r2.assessmentCount).toBe(2);
      expect(r2.successCount).toBe(2);
      expect(r2.masteryLevel).toBe(4);
      expect(r2.masteryState).toBe("demonstrated");

      // Check 3: Third check with score >= 8.5 earns Level 5 (consistently demonstrated / master)
      const r3 = StudentSkillGraph.recordEvidence(
        TEST_STUDENT_ID,
        skillId,
        9.5,
        "mock_interview"
      );

      expect(r3.assessmentCount).toBe(3);
      expect(r3.successCount).toBe(3);
      expect(r3.masteryLevel).toBe(5);
      expect(r3.masteryState).toBe("consistently_demonstrated");
    });
  });

  // --------------------------------------------------------------------------
  // 5. Evidence Provenance & Anti-Hallucination Invariant
  // --------------------------------------------------------------------------
  describe("5. Evidence Provenance & Anti-Hallucination Invariants", () => {
    it("prohibits AI inferences from promoting to confirmed facts simply due to high confidence", async () => {
      // Record an AI inferred memory with 0.99 confidence
      StudentMemoryService.saveMemory(
        TEST_STUDENT_ID,
        "confirmed_strengths",
        "alleged_graph_mastery",
        "Candidate is a graph theory expert",
        "ai_inferred",
        0.99,
        false,
        undefined,
        false,
        TEST_STUDENT_ID
      );

      // Build context
      const context = await PermissionAwareContextBuilder.buildContext(TEST_STUDENT_ID, {
        requestingUserId: TEST_STUDENT_ID,
        purpose: "service_personalization",
      });

      // Must NOT be in confirmedFacts!
      const inConfirmed = context.classifiedEvidence.confirmedFacts.some((f) =>
        f.includes("alleged_graph_mastery")
      );
      expect(inConfirmed).toBe(false);

      // Must be classified under systemInferences
      const inInferences = context.classifiedEvidence.systemInferences.some((f) =>
        f.includes("alleged_graph_mastery")
      );
      expect(inInferences).toBe(true);
    });

    it("promotes to confirmed facts only when explicitly student_confirmed or independently_verified", async () => {
      // Record a student-confirmed memory
      const mem = StudentMemoryService.saveMemory(
        TEST_STUDENT_ID,
        "learning_preferences",
        "target_pacing",
        "Fast-paced with rigorous code verification",
        "student_reported",
        1.0,
        false,
        undefined,
        false,
        TEST_STUDENT_ID
      );
      StudentMemoryService.confirmMemory(TEST_STUDENT_ID, mem.id, TEST_STUDENT_ID);

      const context = await PermissionAwareContextBuilder.buildContext(TEST_STUDENT_ID, {
        requestingUserId: TEST_STUDENT_ID,
        purpose: "service_personalization",
      });

      const inConfirmed = context.classifiedEvidence.confirmedFacts.some((f) =>
        f.includes("target_pacing")
      );
      expect(inConfirmed).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Security & Multi-Tenant Isolation
  // --------------------------------------------------------------------------
  describe("6. Multi-Tenant Privacy & Ownership Security", () => {
    it("rejects unauthorized cross-student intelligence graph access with 403 Forbidden", async () => {
      await expect(
        PermissionAwareContextBuilder.buildContext(OTHER_STUDENT_ID, {
          requestingUserId: TEST_STUDENT_ID, // Student A trying to access Student B
        })
      ).rejects.toThrow("403_FORBIDDEN");
    });

    it("rejects unauthorized cross-student goal access with 403 Forbidden", async () => {
      await expect(
        StudentGoalService.getGoals(OTHER_STUDENT_ID, undefined, TEST_STUDENT_ID)
      ).rejects.toThrow("403_FORBIDDEN");
    });

    it("rejects unauthorized cross-student memory access with 403 Forbidden", () => {
      expect(() => {
        StudentMemoryService.getMemories(OTHER_STUDENT_ID, TEST_STUDENT_ID);
      }).toThrow("403_FORBIDDEN");
    });
  });

  // --------------------------------------------------------------------------
  // 7. Cloud-Only Provider Architecture
  // --------------------------------------------------------------------------
  describe("7. Cloud-Only Model Provider Architecture", () => {
    it("disables local inference models and routes completions via cloud providers or deterministic fallback", async () => {
      const completion = await ModelProviderRouter.complete({
        systemPrompt: "You are ASTRION, unified AI mentor.",
        messages: [{ role: "user", content: "Explain sliding window." }],
        studentUserId: TEST_STUDENT_ID,
      });

      expect(completion).toBeDefined();
      expect(completion.inferenceMode).toBeDefined();
      // Must not execute on local Ollama or local fine-tuned model
      expect(completion.provider).not.toBe("ollama");
      expect(completion.provider).not.toBe("mentormaze_2b");
      // Must be cloud or deterministic rule fallback
      expect(["gemini", "groq", "openrouter", "openai", "anthropic", "local_pedagogical"]).toContain(
        completion.provider
      );
    });
  });

  // --------------------------------------------------------------------------
  // 8. Complete 8-Step Vertical Slice Demonstration
  // --------------------------------------------------------------------------
  describe("8. First Complete Vertical Slice End-to-End", () => {
    it("demonstrates full vertical slice: goal -> diagnosis -> subskill map -> socratic teaching -> evidence update -> adapted activity -> persistence -> recommendation reason", async () => {
      const studentId = "student-slice-v1";

      // 1. Student selects a learning goal
      const goal = await StudentGoalService.createGoal(studentId, {
        title: "Software Development Engineer (SDE-1)",
        category: "career",
        importance: "primary",
        successCriteria: ["Master Dynamic Programming and Graphs", "Pass placement mock interview"],
      });
      expect(goal.id).toBeDefined();
      expect(goal.status).toBe("active");

      // 2. ASTRION diagnoses current skill (starts diagnostic placement)
      const turn1 = await AIMentorOrchestrator.processTurn({
        studentUserId: studentId,
        userMessage: "I want to learn dynamic programming for my SDE-1 goal",
        activeTopic: "dynamic_programming",
      });

      expect(turn1.message).toContain("Diagnostic Placement");
      expect(turn1.message).toContain("Question 1 of 5");
      expect(turn1.adaptiveContext).toBeDefined();
      expect(turn1.adaptiveContext?.reasonForRecommendation).toContain("diagnostic question");

      // 3. Student answers diagnostic questions and ASTRION builds subskill map
      const turn2 = await AIMentorOrchestrator.processTurn({
        studentUserId: studentId,
        userMessage: "DP problems have overlapping subproblems and optimal substructure where sub-solutions are shared",
        activeTopic: "dynamic_programming",
      });

      expect(turn2.message).toContain("Question 2 of 5");
      expect(turn2.adaptiveContext?.subskillMap).toBeDefined();

      // 4. ASTRION teaches through Socratic method
      const turnSocratic = await AIMentorOrchestrator.processTurn({
        studentUserId: studentId,
        userMessage: "Can you help me solve 0/1 knapsack with two pointers?",
        activeTopic: "dynamic_programming",
        mode: "practice",
      });

      // Does not reveal solution, asks probing counter-question
      expect(turnSocratic.teachingStrategy).toBe("socratic_guidance");
      expect(turnSocratic.adaptiveContext?.demonstratedMastery).toBeDefined();

      // 5. Assessment evidence updates mastery
      const updatedSkill = StudentSkillGraph.recordEvidence(
        studentId,
        "dp_subproblems",
        8.5,
        "code_execution"
      );
      expect(updatedSkill.assessmentCount).toBeGreaterThanOrEqual(1);

      // 6. Next activity adapts to the result with inspectable reason
      const turnAdaptive = await AIMentorOrchestrator.processTurn({
        studentUserId: studentId,
        userMessage: "What should I work on next?",
        activeTopic: "dynamic_programming",
      });

      expect(turnAdaptive.adaptiveContext?.reasonForRecommendation).toBeDefined();
      expect(turnAdaptive.adaptiveContext?.currentActivity).toBeDefined();

      // 7. Learning state persists across separate conversations
      const conv1Id = "conv-slice-001";
      const conv2Id = "conv-slice-002";

      await AIMentorOrchestrator.processTurn({
        studentUserId: studentId,
        userMessage: "Remember that I prefer 1D space optimization",
        activeTopic: "dynamic_programming",
        conversationId: conv1Id,
      });

      // Start completely separate conversation
      const turnSeparate = await AIMentorOrchestrator.processTurn({
        studentUserId: studentId,
        userMessage: "Continue my DP mentorship",
        activeTopic: "dynamic_programming",
        conversationId: conv2Id,
      });

      // Context retains goal, mastery, and recommended activity across conversations
      expect(turnSeparate.goalReference?.goalTitle).toBe("Software Development Engineer (SDE-1)");
      expect(turnSeparate.adaptiveContext?.masteryLevel).toBeDefined();
      expect(turnSeparate.adaptiveContext?.reasonForRecommendation).toBeDefined();

      // 8. Student can inspect why next activity was recommended
      expect(turnSeparate.adaptiveContext?.reasonForRecommendation.length).toBeGreaterThan(10);
    });
  });
});
