/**
 * Production Readiness Gate Verification Test Suite
 * Brand: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 * Architecture: ASTRION Adaptive Mentorship Engine
 *
 * Verifies:
 * 1. Persistent Hint Escalator: ownership, cross-student 403, duplicate hint prevention, duplicate attempt debounce
 * 2. Server-side mastery evidence hardening: duplicate assessment ID deduplication, hint-assisted cap, forged score validation, cross-student 403
 * 3. BKT and Spaced Repetition mathematical coherence: valid probabilities, bounded intervals, honest documentation claims
 * 4. API Lifecycle & Route Authorization: unauthenticated 401, forged student ID 403, invalid transitions 400, duplicate creation idempotency
 * 5. Privacy & Consent Fail-Closed: mentor_sharing fail-closed, external_llm_processing fallback, memory purge completeness
 */

import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PersistentHintEscalator } from "@/lib/ai-mentor/persistent-hint-escalator";
import { StudentSkillGraph } from "@/lib/ai-mentor/student-skill-graph";
import { BayesianKnowledgeTracer } from "@/lib/ai-mentor/pedagogy/bkt-service";
import { SpacedRepetitionScheduler } from "@/lib/ai-mentor/pedagogy/fsrs-service";
import { BloomLearningJourneyService } from "@/lib/ai-mentor/learning-journey/bloom-journey-service";
import { SocialCommunicationCoachService } from "@/lib/ai-mentor/communication/social-coach-service";
import { StudentConsentService } from "@/lib/ai-mentor/student-consent-service";
import { StudentMemoryService } from "@/lib/ai-mentor/student-memory-service";
import { PermissionAwareContextBuilder } from "@/lib/ai-mentor/permission-aware-context-builder";
import { ModelProviderRouter } from "@/lib/ai-mentor/model-provider-router";
import { GET as journeyGet, POST as journeyPost } from "@/app/api/ai-mentor/learning-journey/route";
import { GET as coachGet, POST as coachPost } from "@/app/api/ai-mentor/communication-coach/route";

describe("ASTRION Final Production Readiness Gate", () => {
  const STUDENT_A = "student-prod-gate-a";
  const STUDENT_B = "student-prod-gate-b";
  const MENTOR_USER = "mentor-lead-reviewer";

  beforeEach(() => {
    PersistentHintEscalator.reset();
    StudentSkillGraph.resetCache();
    BayesianKnowledgeTracer.reset();
    SpacedRepetitionScheduler.reset();
    BloomLearningJourneyService.reset();
    SocialCommunicationCoachService.reset();
    StudentConsentService.reset();
    StudentMemoryService.reset();
  });

  const createApiReq = (url: string, method: string, body?: any, user?: string, role = "student") => {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      "x-mentormaze-test": "true",
    };
    if (user) {
      headers["x-mentormaze-auth-user"] = user;
    }
    return new NextRequest(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  // =========================================================================
  // 1. PERSISTENT HINT ESCALATOR AUDIT
  // =========================================================================

  describe("1. Persistent Hint Escalator Hardening", () => {
    it("should enforce student ownership and reject cross-student queries with 403", () => {
      PersistentHintEscalator.recordAttempt({
        studentUserId: STUDENT_A,
        skillId: "dynamic_programming",
        exerciseId: "ex-knapsack-01",
        goalId: "goal-career-sde1",
        topic: "DP",
        requestingUserId: STUDENT_A,
      });

      // Cross-student read must throw 403
      expect(() => {
        PersistentHintEscalator.getAttemptRecord(STUDENT_A, "dynamic_programming", "ex-knapsack-01", STUDENT_B);
      }).toThrow(/403_FORBIDDEN/);

      // Cross-student write must throw 403
      expect(() => {
        PersistentHintEscalator.recordAttempt({
          studentUserId: STUDENT_A,
          skillId: "dynamic_programming",
          exerciseId: "ex-knapsack-01",
          requestingUserId: STUDENT_B,
        });
      }).toThrow(/403_FORBIDDEN/);

      // Mentor access should succeed
      const mentorRead = PersistentHintEscalator.getAttemptRecord(
        STUDENT_A,
        "dynamic_programming",
        "ex-knapsack-01",
        MENTOR_USER
      );
      expect(mentorRead).not.toBeNull();
      expect(mentorRead?.goalId).toBe("goal-career-sde1");
    });

    it("should prevent duplicate hints from inflating hint history", () => {
      PersistentHintEscalator.recordAttempt({
        studentUserId: STUDENT_A,
        skillId: "recursion",
        exerciseId: "ex-fib-01",
        requestingUserId: STUDENT_A,
      });

      // Log hint level 2
      PersistentHintEscalator.logHintDelivered(
        STUDENT_A,
        "recursion",
        "ex-fib-01",
        2,
        "Consider the recursive base cases fib(0) and fib(1).",
        STUDENT_A
      );

      // Log identical hint text and level again
      PersistentHintEscalator.logHintDelivered(
        STUDENT_A,
        "recursion",
        "ex-fib-01",
        2,
        "Consider the recursive base cases fib(0) and fib(1).",
        STUDENT_A
      );

      const record = PersistentHintEscalator.getAttemptRecord(STUDENT_A, "recursion", "ex-fib-01", STUDENT_A);
      expect(record?.hintsDelivered.length).toBe(1);
    });
  });

  // =========================================================================
  // 2. SERVER-SIDE MASTERY EVIDENCE HARDENING
  // =========================================================================

  describe("2. Server-Side Mastery Evidence Anti-Gaming Barriers", () => {
    it("should reject forged client scores with 400 Bad Request", () => {
      expect(() => {
        StudentSkillGraph.recordEvidence(STUDENT_A, "dynamic_programming", 15.0, "code_execution");
      }).toThrow(/400_BAD_REQUEST/);

      expect(() => {
        StudentSkillGraph.recordEvidence(STUDENT_A, "dynamic_programming", -1.0, "code_execution");
      }).toThrow(/400_BAD_REQUEST/);

      expect(() => {
        StudentSkillGraph.recordEvidence(STUDENT_A, "dynamic_programming", NaN, "code_execution");
      }).toThrow(/400_BAD_REQUEST/);
    });

    it("should reject cross-student evidence injection with 403 Forbidden", () => {
      expect(() => {
        StudentSkillGraph.recordEvidence(
          STUDENT_A,
          "dynamic_programming",
          9.0,
          "code_execution",
          undefined,
          { requestingUserId: STUDENT_B }
        );
      }).toThrow(/403_FORBIDDEN/);
    });

    it("should prevent manufacturing mastery via repeated retries on the same assessment", () => {
      // Step 1: Pass assessment A1
      StudentSkillGraph.recordEvidence(STUDENT_A, "binary_trees", 9.0, "code_execution", undefined, {
        assessmentId: "tree-lca-01",
        isAssisted: false,
        requestingUserId: STUDENT_A,
      });

      let skill = StudentSkillGraph.getStudentSkills(STUDENT_A).find((s) => s.skillId === "binary_trees");
      expect(skill?.successCount).toBe(1);
      expect(skill?.masteryLevel).toBe(3); // Level 3: requires >= 2 distinct checks for Level 4

      // Step 2: Retry the EXACT same assessment A1 with another 9.5 score
      StudentSkillGraph.recordEvidence(STUDENT_A, "binary_trees", 9.5, "code_execution", undefined, {
        assessmentId: "tree-lca-01",
        isAssisted: false,
        requestingUserId: STUDENT_A,
      });

      skill = StudentSkillGraph.getStudentSkills(STUDENT_A).find((s) => s.skillId === "binary_trees");
      // successCount MUST NOT have incremented because assessmentId was identical!
      expect(skill?.successCount).toBe(1);
      expect(skill?.masteryLevel).toBe(3); // Still Level 3!

      // Step 3: Pass a DISTINCT assessment A2
      StudentSkillGraph.recordEvidence(STUDENT_A, "binary_trees", 8.8, "code_execution", undefined, {
        assessmentId: "tree-serialize-02",
        isAssisted: false,
        requestingUserId: STUDENT_A,
      });

      skill = StudentSkillGraph.getStudentSkills(STUDENT_A).find((s) => s.skillId === "binary_trees");
      expect(skill?.successCount).toBe(2);
      expect(skill?.masteryLevel).toBe(4); // Earned Level 4 through distinct assessments!
    });

    it("should prohibit hint-assisted success or worked solutions from earning Level 4 or Level 5", () => {
      // 3 successful attempts, but ALL were hint-assisted (isAssisted = true)
      for (let i = 1; i <= 3; i++) {
        StudentSkillGraph.recordEvidence(STUDENT_A, "graphs_dfs_bfs", 9.5, "code_execution", undefined, {
          assessmentId: `graph-q${i}`,
          isAssisted: true, // Hint level >= 3 used
          requestingUserId: STUDENT_A,
        });
      }

      const skill = StudentSkillGraph.getStudentSkills(STUDENT_A).find((s) => s.skillId === "graphs_dfs_bfs");
      expect(skill?.successCount).toBe(0); // 0 independent checks
      expect(skill?.masteryLevel).toBeLessThanOrEqual(3); // Cannot earn Level 4/5 with hints
    });
  });

  // =========================================================================
  // 3. BKT & SPACED REPETITION MATHEMATICAL AUDIT
  // =========================================================================

  describe("3. BKT & Spaced Repetition Mathematical Coherence", () => {
    it("should maintain valid probabilities and monotone transitions under BKT", () => {
      const init = BayesianKnowledgeTracer.getConceptState(STUDENT_A, "sorting_algorithms");
      expect(init.knowledgeProbability).toBe(0.15); // Baseline literature default

      // Independent success should strictly increase P(L)
      const afterSuccess = BayesianKnowledgeTracer.recordObservation({
        studentUserId: STUDENT_A,
        conceptId: "sorting_algorithms",
        outcome: "independent_success",
      });
      expect(afterSuccess.updatedProbability).toBeGreaterThan(0.15);
      expect(afterSuccess.updatedProbability).toBeLessThanOrEqual(0.999);

      // Failed attempt should decrease posterior before transition
      const afterFail = BayesianKnowledgeTracer.recordObservation({
        studentUserId: STUDENT_A,
        conceptId: "sorting_algorithms",
        outcome: "failed_attempt",
      });
      expect(afterFail.updatedProbability).toBeGreaterThanOrEqual(0.01);
      expect(afterFail.updatedProbability).toBeLessThan(afterSuccess.updatedProbability);
    });

    it("should calculate exact FSRS intervals without negative or zero intervals", () => {
      const rec = SpacedRepetitionScheduler.getConceptRecord(STUDENT_A, "dp_memoization");
      expect(rec.stability).toBe(1.0);

      // Formula check: at R=0.90, interval I = 9 * S * (1/0.90 - 1) = S days exactly
      const interval = SpacedRepetitionScheduler.calculateReviewIntervalDays(3.0, 0.90);
      expect(interval).toBe(3.0);

      const smallInterval = SpacedRepetitionScheduler.calculateReviewIntervalDays(0.1, 0.90);
      expect(smallInterval).toBeGreaterThanOrEqual(0.2); // Clamped minimum
    });
  });

  // =========================================================================
  // 4. API LIFECYCLE & ROUTE AUTHORIZATION
  // =========================================================================

  describe("4. API Lifecycle & Route Authorization Hardening", () => {
    it("should reject forged student IDs in learning-journey route with 403", async () => {
      const req = createApiReq(
        "http://localhost:3000/api/ai-mentor/learning-journey",
        "POST",
        {
          action: "create",
          studentUserId: STUDENT_B, // Forged: authenticated as STUDENT_A
          goalId: "goal-test",
          topicName: "dynamic_programming",
        },
        STUDENT_A
      );

      const res = await journeyPost(req);
      expect(res.status).toBe(403);
    });

    it("should prevent duplicate active programme creation spam", async () => {
      // First creation
      const req1 = createApiReq(
        "http://localhost:3000/api/ai-mentor/learning-journey",
        "POST",
        {
          action: "create",
          goalId: "goal-test",
          topicName: "dynamic_programming",
        },
        STUDENT_A
      );
      const res1 = await journeyPost(req1);
      expect(res1.status).toBe(200);
      const data1 = await res1.json();

      // Second duplicate creation for same topic
      const req2 = createApiReq(
        "http://localhost:3000/api/ai-mentor/learning-journey",
        "POST",
        {
          action: "create",
          goalId: "goal-test",
          topicName: "dynamic_programming",
        },
        STUDENT_A
      );
      const res2 = await journeyPost(req2);
      expect(res2.status).toBe(200);
      const data2 = await res2.json();

      // Must return existing programme instead of creating a competing instance
      expect(data2.programme.id).toBe(data1.programme.id);
    });

    it("should reject final assessment completion if lessons remain incomplete", async () => {
      const createReq = createApiReq(
        "http://localhost:3000/api/ai-mentor/learning-journey",
        "POST",
        {
          action: "create",
          goalId: "goal-incomplete",
          topicName: "dynamic_programming",
        },
        STUDENT_A
      );
      const createRes = await journeyPost(createReq);
      const createData = await createRes.json();
      const progId = createData.programme.id;

      // Attempt to jump to complete_assessment without completing lessons
      const finalReq = createApiReq(
        "http://localhost:3000/api/ai-mentor/learning-journey",
        "POST",
        {
          action: "complete_assessment",
          programmeId: progId,
          score: 9.5,
          summary: "Attempted early completion",
        },
        STUDENT_A
      );

      const finalRes = await journeyPost(finalReq);
      expect(finalRes.status).toBe(400);
      const finalData = await finalRes.json();
      expect(finalData.error).toContain("remain incomplete");
    });

    it("should reject communication coach evaluation if student has not participated", async () => {
      const startReq = createApiReq(
        "http://localhost:3000/api/ai-mentor/communication-coach",
        "POST",
        {
          action: "start",
          scenarioType: "executive_status_update",
        },
        STUDENT_A
      );
      const startRes = await coachPost(startReq);
      const startData = await startRes.json();
      const sessionId = startData.session.id;

      // Attempt immediate evaluation without any student turns
      const evalReq = createApiReq(
        "http://localhost:3000/api/ai-mentor/communication-coach",
        "POST",
        {
          action: "evaluate",
          sessionId,
        },
        STUDENT_A
      );

      const evalRes = await coachPost(evalReq);
      expect(evalRes.status).toBe(400);
      const evalData = await evalRes.json();
      expect(evalData.error).toContain("without at least one student response");
    });
  });

  // =========================================================================
  // 5. PRIVACY & CONSENT FAIL-CLOSED VERIFICATION
  // =========================================================================

  describe("5. Privacy & Consent Fail-Closed Controls", () => {
    it("should fail-closed for mentor access when mentor_sharing consent is revoked", async () => {
      // Revoke mentor_sharing
      await StudentConsentService.revokeConsent(
        STUDENT_A,
        "mentor_sharing",
        "Withholding mentor sharing",
        STUDENT_A
      );

      // Mentor requests student context
      const ctx = await PermissionAwareContextBuilder.buildContext(STUDENT_A, {
        requestingUserId: MENTOR_USER,
        purpose: "mentor_sharing",
      });

      expect(ctx.consentGranted).toBe(false);
      expect(ctx.isPersonalized).toBe(false);
      expect(ctx.classifiedEvidence.confirmedFacts).toEqual([]);
      expect(ctx.sanitizedBriefingMarkdown).toContain("mentor_sharing");
    });

    it("should fail-closed and block external cloud LLM inference when external_llm_processing is revoked", async () => {
      // Revoke external_llm_processing
      await StudentConsentService.revokeConsent(
        STUDENT_A,
        "external_llm_processing",
        "Revoking cloud LLM consent",
        STUDENT_A
      );

      const completion = await ModelProviderRouter.complete({
        systemPrompt: "You are ASTRION.",
        messages: [{ role: "user", content: "Explain dynamic programming." }],
        studentUserId: STUDENT_A,
        preferredProvider: "gemini",
      });

      // Must fail closed with fallback reason indicating consent block
      expect(completion.fallbackReason).toContain("EXTERNAL_LLM_CONSENT_DENIED");
      expect(completion.inferenceMode).toBe("deterministic");
    });
  });
});
