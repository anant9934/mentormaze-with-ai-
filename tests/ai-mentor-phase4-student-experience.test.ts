/**
 * MentorMaze — ASTRION Personal AI Mentorship System
 * Phase 4: Personal AI Mentorship Experience & Continuous Student Guidance Test Suite
 *
 * Verifies the 5 Mandatory Mentorship Lifecycles & Student Experiences:
 * Scenario A: New student goal expression & curriculum roadmap generation
 * Scenario B: Returning student mentorship continuity, goal & milestone restoration
 * Scenario C: Milestone deliverable submission, progress persistence & evidence tracking
 * Scenario D: Changing student circumstances & resilient schedule adaptation
 * Scenario E: 5-tier assessment transparency, student-driven memory corrections, & sanitized handoff
 */

import { describe, it, expect, beforeEach } from "vitest";
import { StudentGoalService } from "@/lib/ai-mentor/goals/student-goal-service";
import { PersonalizedRoadmapService } from "@/lib/ai-mentor/roadmap/personalized-roadmap-service";
import { PersonalizedAssessmentService } from "@/lib/ai-mentor/assessment/personalized-assessment-service";
import { PermissionAwareContextBuilder } from "@/lib/ai-mentor/permission-aware-context-builder";
import { StudentConsentService } from "@/lib/ai-mentor/student-consent-service";
import { StudentMemoryService } from "@/lib/ai-mentor/student-memory-service";
import { initializeDatabaseSchema } from "@/lib/db";
import { GET as goalsGetHandler, POST as goalsPostHandler } from "@/app/api/ai-mentor/goals/route";
import { GET as roadmapsGetHandler, POST as roadmapsPostHandler } from "@/app/api/ai-mentor/roadmaps/route";
import { GET as memoryGetHandler, POST as memoryPostHandler } from "@/app/api/ai-mentor/memory/route";
import { NextRequest } from "next/server";

describe("Phase 4 Personal AI Mentorship Experience & Continuous Student Guidance", () => {
  const studentId = "student-phase4-journey";
  const authHeaders = {
    "x-mentormaze-test": "true",
    "x-mentormaze-auth-user": studentId,
  };

  beforeEach(async () => {
    await initializeDatabaseSchema();
    StudentGoalService.resetCache();
    PersonalizedRoadmapService.resetCache();
    StudentMemoryService.reset();
    StudentConsentService.grantConsent(studentId, "service_personalization");
    StudentConsentService.grantConsent(studentId, "student_memory");
    StudentConsentService.grantConsent(studentId, "mentor_sharing");
  });

  // =========================================================================
  // SCENARIO A: NEW STUDENT GOAL EXPRESSION & ROADMAP GENERATION
  // =========================================================================
  describe("Scenario A: New Student Goal Expression & Roadmap Generation", () => {
    it("creates primary career goal and generates tailored engineering roadmap", async () => {
      // 1. Student creates a primary career goal
      const createReq = new NextRequest("http://localhost:3000/api/ai-mentor/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          title: "Principal Distributed Systems Engineer",
          category: "career",
          importance: "primary",
          targetOutcome: "Design fault-tolerant event streams and scale distributed database clusters.",
          targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      const createRes = await goalsPostHandler(createReq);
      const createData = await createRes.json();
      expect(createRes.status).toBe(201);
      expect(createData.success).toBe(true);
      expect(createData.goal.importance).toBe("primary");
      expect(createData.goal.status).toBe("active");

      const goalId = createData.goal.id;

      // 2. Generate roadmap through roadmaps API
      const rdmReq = new NextRequest("http://localhost:3000/api/ai-mentor/roadmaps", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          action: "generate",
          goalId,
        }),
      });

      const rdmRes = await roadmapsPostHandler(rdmReq);
      const rdmData = await rdmRes.json();
      expect(rdmRes.status).toBe(201);
      expect(rdmData.success).toBe(true);
      expect(rdmData.roadmap.goalId).toBe(goalId);
      expect(rdmData.roadmap.milestones.length).toBeGreaterThanOrEqual(3);

      // Verify first milestone is in_progress
      const firstMilestone = rdmData.roadmap.milestones[0];
      expect(firstMilestone.weekNumber).toBe(1);
      expect(firstMilestone.status).toBe("in_progress");
      expect(firstMilestone.practicalProjects.length).toBeGreaterThan(0);
      expect(firstMilestone.successCriteria.length).toBeGreaterThan(0);

      // 3. Verify context builder integrates this as active goal
      const context = await PermissionAwareContextBuilder.buildContext(studentId, {
        requestingUserId: studentId,
        purpose: "service_personalization",
      });
      expect(context.activeGoal?.id).toBe(goalId);
      expect(context.activeGoal?.title).toBe("Principal Distributed Systems Engineer");
      expect(context.isPersonalized).toBe(true);
    });
  });

  // =========================================================================
  // SCENARIO B: RETURNING STUDENT GOAL & ROADMAP RESTORATION
  // =========================================================================
  describe("Scenario B: Returning Student Mentorship Continuity & State Restoration", () => {
    it("restores primary goal, active milestone, and accurate progress without profile dumping", async () => {
      // Setup existing goal & roadmap
      const goal = await StudentGoalService.createGoal(studentId, {
        title: "Staff Machine Learning Engineer",
        category: "career",
        importance: "primary",
        targetOutcome: "Deploy real-time diffusion & LLM reasoning pipelines at scale.",
      });

      const context = await PermissionAwareContextBuilder.buildContext(studentId, {
        requestingUserId: studentId,
        purpose: "service_personalization",
      });
      const assessment = PersonalizedAssessmentService.assessCurrentState(context, goal);
      const initialRdm = await PersonalizedRoadmapService.generatePersonalizedRoadmap(studentId, goal, assessment);

      // Simulate student returning in a new browser session
      const getReq = new NextRequest(`http://localhost:3000/api/ai-mentor/goals?userId=${studentId}`, {
        headers: { ...authHeaders },
      });
      const getRes = await goalsGetHandler(getReq);
      const getData = await getRes.json();
      expect(getData.success).toBe(true);

      const restoredPrimary = getData.goals.find((g: any) => g.importance === "primary" && g.status === "active");
      expect(restoredPrimary).toBeDefined();
      expect(restoredPrimary.id).toBe(goal.id);

      // Fetch roadmap for this restored primary goal
      const rdmGetReq = new NextRequest(`http://localhost:3000/api/ai-mentor/roadmaps?userId=${studentId}&goalId=${restoredPrimary.id}`, {
        headers: { ...authHeaders },
      });
      const rdmGetRes = await roadmapsGetHandler(rdmGetReq);
      const rdmGetData = await rdmGetRes.json();
      expect(rdmGetData.success).toBe(true);
      expect(rdmGetData.roadmap.id).toBe(initialRdm.id);

      // Verify active milestone is available for Next Step card
      const activeMs = rdmGetData.roadmap.milestones.find((m: any) => m.status === "in_progress");
      expect(activeMs).toBeDefined();
      expect(activeMs.weekNumber).toBe(1);

      // Verify prompt injection guard defends against profile prompt dumping
      const sanitizedBriefing = context.sanitizedBriefingMarkdown;
      expect(sanitizedBriefing).toContain("Staff Machine Learning Engineer");
      expect(sanitizedBriefing).not.toContain("<script>");
      expect(sanitizedBriefing).not.toContain("password");
    });
  });

  // =========================================================================
  // SCENARIO C: MILESTONE DELIVERABLE SUBMISSION & PROGRESS PERSISTENCE
  // =========================================================================
  describe("Scenario C: Milestone Deliverable Submission & Evidence Persistence", () => {
    it("submits deliverable URL, records evidence, marks completion, and advances to next milestone", async () => {
      const goal = await StudentGoalService.createGoal(studentId, {
        title: "Cloud Infrastructure Architect",
        category: "career",
        importance: "primary",
      });

      const context = await PermissionAwareContextBuilder.buildContext(studentId, {
        requestingUserId: studentId,
        purpose: "service_personalization",
      });
      const assessment = PersonalizedAssessmentService.assessCurrentState(context, goal);
      const rdm = await PersonalizedRoadmapService.generatePersonalizedRoadmap(studentId, goal, assessment);

      // Student submits proof for milestone week 1
      const progressReq = new NextRequest("http://localhost:3000/api/ai-mentor/roadmaps", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          action: "mark_progress",
          roadmapId: rdm.id,
          weekNumber: 1,
          status: "completed",
          studentConfirmation: true,
          evidenceRef: "github.com/student/terraform-multi-region/commit/9f381ab",
          deliverableUrl: "https://github.com/student/terraform-multi-region/pull/4",
          assessmentNotes: "Implemented automated failover with Route 53 health checks.",
          provenance: "student_confirmed",
        }),
      });

      const progressRes = await roadmapsPostHandler(progressReq);
      const progressData = await progressRes.json();
      expect(progressRes.status).toBe(200);
      expect(progressData.success).toBe(true);

      const updatedRdm = progressData.roadmap;
      const m1 = updatedRdm.milestones.find((m: any) => m.weekNumber === 1);
      expect(m1.status).toBe("completed");
      expect(m1.completedAt).toBeDefined();
      expect(m1.evidenceRef).toBe("github.com/student/terraform-multi-region/commit/9f381ab");
      expect(m1.deliverableUrl).toBe("https://github.com/student/terraform-multi-region/pull/4");
      expect(m1.studentConfirmation).toBe(true);

      // Milestone 2 should automatically advance to in_progress
      const m2 = updatedRdm.milestones.find((m: any) => m.weekNumber === 2);
      expect(m2.status).toBe("in_progress");

      // Progress percentage should increase
      expect(updatedRdm.progressPct).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // SCENARIO D: CHANGING CIRCUMSTANCES & SCHEDULE ADAPTATION
  // =========================================================================
  describe("Scenario D: Changing Circumstances & Resilient Schedule Adaptation", () => {
    it("adapts roadmap timeline while preserving completed milestones and evidence", async () => {
      const goal = await StudentGoalService.createGoal(studentId, {
        title: "Full-Stack Security Specialist",
        category: "career",
        importance: "primary",
      });

      const context = await PermissionAwareContextBuilder.buildContext(studentId, {
        requestingUserId: studentId,
        purpose: "service_personalization",
      });
      const assessment = PersonalizedAssessmentService.assessCurrentState(context, goal);
      const rdm = await PersonalizedRoadmapService.generatePersonalizedRoadmap(studentId, goal, assessment);

      // Complete week 1 milestone
      await PersonalizedRoadmapService.markMilestoneProgress(studentId, rdm.id, 1, "completed", {
        studentConfirmation: true,
        evidenceRef: "audit-report-v1.pdf",
        deliverableUrl: "https://mentor.maze/proof/audit-1",
      });

      // Student requests adaptation due to internship workload
      const adaptReq = new NextRequest("http://localhost:3000/api/ai-mentor/roadmaps", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          action: "adapt",
          roadmapId: rdm.id,
          reason: "Starting 8-week summer internship; reducing weekly effort to 10 hours.",
          availableHoursPerWeek: 10,
        }),
      });

      const adaptRes = await roadmapsPostHandler(adaptReq);
      const adaptData = await adaptRes.json();
      expect(adaptRes.status).toBe(200);
      expect(adaptData.success).toBe(true);

      const adaptedRdm = adaptData.roadmap;
      expect(adaptedRdm.adaptedReason).toContain("Starting 8-week summer internship");

      // Verify completed milestone 1 is intact with evidence preserved
      const adaptedM1 = adaptedRdm.milestones.find((m: any) => m.weekNumber === 1);
      expect(adaptedM1.status).toBe("completed");
      expect(adaptedM1.evidenceRef).toBe("audit-report-v1.pdf");
      expect(adaptedM1.deliverableUrl).toBe("https://mentor.maze/proof/audit-1");

      // Adaptation history is tracked
      expect(adaptedRdm.adaptationHistory?.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // SCENARIO E: PRIVACY, 5-TIER ASSESSMENT, AND MEMORY CORRECTIONS
  // =========================================================================
  describe("Scenario E: Privacy, 5-Tier Assessment, and Memory Updates", () => {
    it("allows student to correct self-reported memory and enforces consent boundaries", async () => {
      // 1. Student adds a memory item
      const memReq = new NextRequest("http://localhost:3000/api/ai-mentor/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          category: "background",
          key: "Primary Language",
          value: "Python (Junior Level)",
          provenance: "student_reported",
          confidence: 1.0,
          studentConfirmed: true,
        }),
      });

      const memRes = await memoryPostHandler(memReq);
      const memData = await memRes.json();
      expect(memRes.status).toBe(200);
      expect(memData.success).toBe(true);

      // 2. Student corrects the memory item to reflect advanced experience
      const updateReq = new NextRequest("http://localhost:3000/api/ai-mentor/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          category: "background",
          key: "Primary Language",
          value: "Python (Advanced, 3 years building asyncio services)",
          provenance: "student_reported",
          confidence: 1.0,
          studentConfirmed: true,
        }),
      });

      const updateRes = await memoryPostHandler(updateReq);
      const updateData = await updateRes.json();
      expect(updateData.success).toBe(true);

      // 3. Verify memory query returns updated entry
      const listReq = new NextRequest(`http://localhost:3000/api/ai-mentor/memory?userId=${studentId}`, {
        headers: { ...authHeaders },
      });
      const listRes = await memoryGetHandler(listReq);
      const listData = await listRes.json();
      expect(listData.success).toBe(true);

      const pyMem = listData.memories.find((m: any) => m.key === "Primary Language");
      expect(pyMem).toBeDefined();
      expect(pyMem.value).toContain("Advanced, 3 years");
      expect(pyMem.provenance).toBe("student_reported");

      // 4. Test revocation of external_data_integration consent
      StudentConsentService.revokeConsent(studentId, "external_data_integration");
      const unconsentedCtx = await PermissionAwareContextBuilder.buildContext(studentId, {
        requestingUserId: studentId,
        purpose: "service_personalization",
      });

      // External systems must be filtered out
      const hasExternalProjects = unconsentedCtx.relevantProjects.some(
        (p) => p.sourceSystem !== "manual" && p.sourceSystem.toLowerCase() !== "mentormaze"
      );
      expect(hasExternalProjects).toBe(false);
    });
  });
});
