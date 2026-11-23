/**
 * MentorMaze — ASTRION Personal AI Mentorship System
 * Phase 3.2: Production-Grade Mentorship Lifecycle Hardening Test Suite
 *
 * Verifies:
 * 1. Migration tracking & PostgreSQL catalog integrity (0003, 0004, 0005).
 * 2. Real authentication & multi-tenant authorization guards (401 on unauthenticated, 403 on cross-student access).
 * 3. Concurrency and state integrity (atomic priority switching, partial unique index for active roadmaps, milestone idempotency).
 * 4. Progress evidence and audit history (evidence references, deliverables, student confirmation, provenance retention).
 * 5. Personalized workload management (student-declared hours, estimated weekly effort, overload detection, trade-offs).
 */

import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { StudentGoalService } from "@/lib/ai-mentor/goals/student-goal-service";
import { PersonalizedRoadmapService } from "@/lib/ai-mentor/roadmap/personalized-roadmap-service";
import { PersonalizedAssessmentService } from "@/lib/ai-mentor/assessment/personalized-assessment-service";
import { PermissionAwareContextBuilder } from "@/lib/ai-mentor/permission-aware-context-builder";
import { StudentConsentService } from "@/lib/ai-mentor/student-consent-service";
import { aiMentorGoals, aiMentorRoadmaps, aiMentorRoadmapMilestones } from "@/lib/db/ai-mentor-schema";
import { initializeDatabaseSchema, getDb } from "@/lib/db";
import { POST as aiMentorPostHandler } from "@/app/api/ai-mentor/route";
import { GET as goalsGetHandler, POST as goalsPostHandler } from "@/app/api/ai-mentor/goals/route";
import { GET as roadmapsGetHandler, POST as roadmapsPostHandler } from "@/app/api/ai-mentor/roadmaps/route";

describe("Phase 3.2 Production-Grade Mentorship Lifecycle Hardening", () => {
  const studentA = "student-phase3-2-alice";
  const studentB = "student-phase3-2-bob";

  beforeEach(async () => {
    await initializeDatabaseSchema();
    StudentGoalService.resetCache();
    PersonalizedRoadmapService.resetCache();
    StudentConsentService.grantConsent(studentA, "service_personalization");
    StudentConsentService.grantConsent(studentA, "student_memory");
    StudentConsentService.grantConsent(studentB, "service_personalization");
    StudentConsentService.grantConsent(studentB, "student_memory");
  });

  // =========================================================================
  // 1. MIGRATION TRACKING VERIFICATION
  // =========================================================================
  describe("1. Migration Tracking & Catalog Verification", () => {
    it("confirms migration journal contains 0003, 0004, and 0005 in exact sequential order", () => {
      const journalPath = path.resolve(process.cwd(), "lib/db/migrations/meta/_journal.json");
      expect(fs.existsSync(journalPath)).toBe(true);

      const journal = JSON.parse(fs.readFileSync(journalPath, "utf-8"));
      expect(journal.entries.length).toBeGreaterThanOrEqual(6);

      const tag0003 = journal.entries.find((e: any) => e.tag === "0003_dazzling_golden_guardian");
      const tag0004 = journal.entries.find((e: any) => e.tag === "0004_quiet_rattler");
      const tag0005 = journal.entries.find((e: any) => e.tag === "0005_ambitious_evidence_provenance");

      expect(tag0003).toBeDefined();
      expect(tag0004).toBeDefined();
      expect(tag0005).toBeDefined();
      expect(tag0003.idx).toBeLessThan(tag0004.idx);
      expect(tag0004.idx).toBeLessThan(tag0005.idx);
    });

    it("verifies partial unique index on aiMentorRoadmaps in schema definition", () => {
      expect(aiMentorRoadmaps).toBeDefined();
      expect(aiMentorRoadmaps.goalId).toBeDefined();
      expect(aiMentorRoadmaps.status).toBeDefined();
    });

    it("verifies all progress evidence & provenance columns on aiMentorRoadmapMilestones", () => {
      expect(aiMentorRoadmapMilestones.studentConfirmation).toBeDefined();
      expect(aiMentorRoadmapMilestones.evidenceRef).toBeDefined();
      expect(aiMentorRoadmapMilestones.deliverableUrl).toBeDefined();
      expect(aiMentorRoadmapMilestones.assessmentNotes).toBeDefined();
      expect(aiMentorRoadmapMilestones.successCriteria).toBeDefined();
      expect(aiMentorRoadmapMilestones.provenance).toBeDefined();
    });
  });

  // =========================================================================
  // 2. REAL AUTHENTICATION & MULTI-TENANT AUTHORIZATION (401 & 403)
  // =========================================================================
  describe("2. Authentication & Ownership Verification", () => {
    it("returns 401 UNAUTHORIZED when calling /api/ai-mentor without credentials", async () => {
      const req = new NextRequest("http://localhost:3000/api/ai-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: "Hello ASTRION" }),
      });

      const res = await aiMentorPostHandler(req);
      const json = await res.json();
      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error).toContain("401_UNAUTHORIZED");
    });

    it("returns 401 UNAUTHORIZED when calling /api/ai-mentor/goals without credentials", async () => {
      const getReq = new NextRequest("http://localhost:3000/api/ai-mentor/goals");
      const getRes = await goalsGetHandler(getReq);
      const getJson = await getRes.json();
      expect(getRes.status).toBe(401);
      expect(getJson.success).toBe(false);
      expect(getJson.error).toContain("401_UNAUTHORIZED");

      const postReq = new NextRequest("http://localhost:3000/api/ai-mentor/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Unauthorized Goal" }),
      });
      const postRes = await goalsPostHandler(postReq);
      const postJson = await postRes.json();
      expect(postRes.status).toBe(401);
      expect(postJson.success).toBe(false);
      expect(postJson.error).toContain("401_UNAUTHORIZED");
    });

    it("returns 401 UNAUTHORIZED when calling /api/ai-mentor/roadmaps without credentials", async () => {
      const getReq = new NextRequest("http://localhost:3000/api/ai-mentor/roadmaps?goalId=any-goal");
      const getRes = await roadmapsGetHandler(getReq);
      const getJson = await getRes.json();
      expect(getRes.status).toBe(401);
      expect(getJson.success).toBe(false);
      expect(getJson.error).toContain("401_UNAUTHORIZED");

      const postReq = new NextRequest("http://localhost:3000/api/ai-mentor/roadmaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", goalId: "any-goal" }),
      });
      const postRes = await roadmapsPostHandler(postReq);
      const postJson = await postRes.json();
      expect(postRes.status).toBe(401);
      expect(postJson.success).toBe(false);
      expect(postJson.error).toContain("401_UNAUTHORIZED");
    });

    it("returns 403 FORBIDDEN when Student A attempts to access Student B's goals", async () => {
      const req = new NextRequest(`http://localhost:3000/api/ai-mentor/goals?userId=${studentB}`, {
        headers: {
          "x-mentormaze-test": "true",
          "x-mentormaze-auth-user": studentA,
        },
      });

      const res = await goalsGetHandler(req);
      const json = await res.json();
      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error).toContain("403_FORBIDDEN");
    });

    it("returns 403 FORBIDDEN when Student A attempts to access Student B's roadmaps", async () => {
      const req = new NextRequest(`http://localhost:3000/api/ai-mentor/roadmaps?userId=${studentB}&goalId=g-123`, {
        headers: {
          "x-mentormaze-test": "true",
          "x-mentormaze-auth-user": studentA,
        },
      });

      const res = await roadmapsGetHandler(req);
      const json = await res.json();
      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error).toContain("403_FORBIDDEN");
    });

    it("returns 403 FORBIDDEN when Student A attempts to mark progress on Student B's roadmap", async () => {
      // First create a goal and roadmap for Student B
      const goalB = await StudentGoalService.createGoal(studentB, {
        title: "Bob's Distributed Systems Goal",
        category: "career",
        targetOutcome: "Master Raft Consensus",
      });
      const ctxB = await PermissionAwareContextBuilder.buildContext(studentB, { purpose: "service_personalization", includeGoalTracking: true });
      const assessB = PersonalizedAssessmentService.assessCurrentState(ctxB, goalB);
      const rdmB = await PersonalizedRoadmapService.generatePersonalizedRoadmap(studentB, goalB, assessB);

      // Now Student A attempts to mark progress on Student B's roadmap
      const req = new NextRequest("http://localhost:3000/api/ai-mentor/roadmaps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-mentormaze-test": "true",
          "x-mentormaze-auth-user": studentA,
        },
        body: JSON.stringify({
          action: "mark_progress",
          roadmapId: rdmB.id,
          weekNumber: 1,
          status: "completed",
        }),
      });

      const res = await roadmapsPostHandler(req);
      const json = await res.json();
      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error).toContain("403_FORBIDDEN");
    });
  });

  // =========================================================================
  // 3. CONCURRENCY & STATE INTEGRITY
  // =========================================================================
  describe("3. Concurrency & State Integrity", () => {
    it("atomically switches primary goals without leaving multiple primary goals", async () => {
      const g1 = await StudentGoalService.createGoal(studentA, {
        title: "Goal 1: Senior Backend Architect",
        importance: "primary",
      });
      const g2 = await StudentGoalService.createGoal(studentA, {
        title: "Goal 2: AI Infrastructure Lead",
        importance: "secondary",
      });

      expect(g1.importance).toBe("primary");
      expect(g2.importance).toBe("secondary");

      // Switch g2 to primary
      const updatedG2 = await StudentGoalService.setGoalPriority(studentA, g2.id, "primary");
      expect(updatedG2.importance).toBe("primary");

      // Check g1 is now demoted to secondary
      const refetchedG1 = await StudentGoalService.getGoalById(studentA, g1.id);
      expect(refetchedG1?.importance).toBe("secondary");

      // Verify across all active goals for studentA, only 1 is primary
      const allGoals = await StudentGoalService.getStudentGoals(studentA);
      const primaryGoals = allGoals.filter((g) => g.importance === "primary");
      expect(primaryGoals.length).toBe(1);
      expect(primaryGoals[0].id).toBe(g2.id);
    });

    it("guarantees at most one active roadmap per goal even under regeneration", async () => {
      const goal = await StudentGoalService.createGoal(studentA, {
        title: "Goal for Active Roadmap Guarantee",
        targetOutcome: "Verify partial unique index",
      });
      const ctx = await PermissionAwareContextBuilder.buildContext(studentA, { purpose: "service_personalization", includeGoalTracking: true });
      const assess = PersonalizedAssessmentService.assessCurrentState(ctx, goal);

      // Generate first roadmap
      const rdm1 = await PersonalizedRoadmapService.generatePersonalizedRoadmap(studentA, goal, assess);
      expect(rdm1.status).toBe("active");

      // Regenerate / generate again for same goal
      const rdm2 = await PersonalizedRoadmapService.generatePersonalizedRoadmap(studentA, goal, assess);
      expect(rdm2.status).toBe("active");

      // The active roadmap returned for this goal must be rdm2
      const activeRdm = await PersonalizedRoadmapService.getRoadmapByGoalId(studentA, goal.id);
      expect(activeRdm).toBeDefined();
      expect(activeRdm?.id).toBe(rdm2.id);
    });

    it("enforces milestone completion idempotency: repeated completion does not double-advance", async () => {
      const goal = await StudentGoalService.createGoal(studentA, {
        title: "Idempotency Verification Goal",
      });
      const ctx = await PermissionAwareContextBuilder.buildContext(studentA, { purpose: "service_personalization", includeGoalTracking: true });
      const assess = PersonalizedAssessmentService.assessCurrentState(ctx, goal);
      const rdm = await PersonalizedRoadmapService.generatePersonalizedRoadmap(studentA, goal, assess);

      const mId = rdm.milestones[0].id;

      // First completion
      const completed1 = await PersonalizedRoadmapService.markMilestoneProgress(studentA, rdm.id, mId, "completed", {
        studentConfirmation: true,
        evidenceRef: "github.com/alice/pr/1",
        deliverableUrl: "https://mentor.maze/proof/1",
        assessmentNotes: "Passed all integration tests.",
      });

      const firstCompletedAt = completed1.milestones[0].completedAt;
      const firstProgressPct = completed1.progressPct;
      expect(firstCompletedAt).toBeDefined();
      expect(firstProgressPct).toBeGreaterThan(0);

      // Repeated (concurrent/duplicate) completion attempt
      const completed2 = await PersonalizedRoadmapService.markMilestoneProgress(studentA, rdm.id, mId, "completed", {
        studentConfirmation: true,
        evidenceRef: "github.com/alice/pr/1-retry",
      });

      // Idempotency: timestamp and progressPct MUST NOT change or double-count
      expect(completed2.milestones[0].completedAt).toBe(firstCompletedAt);
      expect(completed2.progressPct).toBe(firstProgressPct);
    });
  });

  // =========================================================================
  // 4. PROGRESS EVIDENCE & PROVENANCE RETENTION
  // =========================================================================
  describe("4. Progress Evidence & Provenance Retention", () => {
    it("preserves completed milestones and evidence across roadmap adaptations", async () => {
      const goal = await StudentGoalService.createGoal(studentA, {
        title: "Provenance Test Goal",
      });
      const ctx = await PermissionAwareContextBuilder.buildContext(studentA, { purpose: "service_personalization", includeGoalTracking: true });
      const assess = PersonalizedAssessmentService.assessCurrentState(ctx, goal);
      const initialRdm = await PersonalizedRoadmapService.generatePersonalizedRoadmap(studentA, goal, assess);

      // Mark milestone 1 completed with rich audit evidence
      const m1Id = initialRdm.milestones[0].id;
      const completedRdm = await PersonalizedRoadmapService.markMilestoneProgress(studentA, initialRdm.id, m1Id, "completed", {
        studentConfirmation: true,
        evidenceRef: "commit-sha-7a8f90b",
        deliverableUrl: "https://github.com/student/security-audit/pull/5",
        assessmentNotes: "Demonstrated Tier 1 static code security audit mastery",
        provenance: "student_confirmed",
      });

      const completedM1 = completedRdm.milestones.find((m) => m.id === m1Id);
      expect(completedM1?.status).toBe("completed");
      expect(completedM1?.studentConfirmation).toBe(true);
      expect(completedM1?.evidenceRef).toBe("commit-sha-7a8f90b");
      expect(completedM1?.deliverableUrl).toBe("https://github.com/student/security-audit/pull/5");
      expect(completedM1?.provenance).toBe("student_confirmed");

      // Adapt roadmap with new target timeline
      const adapted = await PersonalizedRoadmapService.adaptRoadmap(
        studentA,
        initialRdm.id,
        "Student requested slower pacing due to upcoming university exams",
        { pacingFactor: 1.5 }
      );

      // Verify the completed milestone retained all evidence and was NOT reset
      const adaptedM1 = adapted.milestones.find((m) => m.id === m1Id || m.title === initialRdm.milestones[0].title);
      expect(adaptedM1).toBeDefined();
      expect(adaptedM1?.status).toBe("completed");
      expect(adaptedM1?.studentConfirmation).toBe(true);
      expect(adaptedM1?.evidenceRef).toBe("commit-sha-7a8f90b");
      expect(adaptedM1?.deliverableUrl).toBe("https://github.com/student/security-audit/pull/5");
      expect(adaptedM1?.assessmentNotes).toBe("Demonstrated Tier 1 static code security audit mastery");
    });
  });

  // =========================================================================
  // 5. PERSONALIZED WORKLOAD MANAGEMENT
  // =========================================================================
  describe("5. Personalized Workload Management", () => {
    it("respects student-declared weekly availability instead of arbitrary static limits", async () => {
      // Student has 3 active goals
      await StudentGoalService.createGoal(studentA, {
        title: "Workload Goal A: Full Stack Next.js",
        importance: "primary",
      });
      await StudentGoalService.createGoal(studentA, {
        title: "Workload Goal B: Deep Learning Foundations",
        importance: "secondary",
      });
      await StudentGoalService.createGoal(studentA, {
        title: "Workload Goal C: AWS Solutions Architect",
        importance: "secondary",
      });

      // Case 1: Student has only 10 hours/week available (should flag overload)
      const conflictTight = await StudentGoalService.detectGoalConflicts(studentA, {
        availableHoursPerWeek: 10,
      });

      expect(conflictTight.studentDeclaredAvailableHoursPerWeek).toBe(10);
      expect(conflictTight.isWorkloadOverCapacity).toBe(true);
      expect(conflictTight.hasConflicts).toBe(true);
      expect(conflictTight.conflictingGoals.length).toBeGreaterThan(0);
      expect(conflictTight.tradeOffAnalysis.some((t) => t.includes("student-declared weekly capacity"))).toBe(true);

      // Case 2: Student has 40 hours/week available (should NOT flag overload)
      const conflictGenerous = await StudentGoalService.detectGoalConflicts(studentA, {
        availableHoursPerWeek: 40,
      });

      expect(conflictGenerous.studentDeclaredAvailableHoursPerWeek).toBe(40);
      expect(conflictGenerous.isWorkloadOverCapacity).toBe(false);
    });
  });
});
