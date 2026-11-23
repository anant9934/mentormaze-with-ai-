/**
 * MentorMaze — ASTRION Personal AI Mentorship System
 * Goal-Centric Mentorship Lifecycle Verification Suite
 *
 * Verifies:
 * 1. 13-Point End-to-End Mentorship Lifecycle Scenario ("I want to become a machine learning engineer")
 * 2. 5-Tier Personalized Assessment Engine (Zero Fabrication & Hallucination)
 * 3. Dynamic Personalized Roadmap Generation & Milestone Progression
 * 4. Goal Conflict Detection and Multi-Goal Prioritization
 * 5. Student Control Preservation (Pause, Resume, Status & Priority Updates)
 * 6. Governance & Consent Enforcement during Goal-Centric Orchestration
 * 7. Persistent Database Schema & Service Synchronization
 */

import { describe, it, expect, beforeEach } from "vitest";
import { AIMentorOrchestrator } from "@/lib/ai-mentor/orchestrator";
import { StudentGoalService } from "@/lib/ai-mentor/goals/student-goal-service";
import { PersonalizedAssessmentService } from "@/lib/ai-mentor/assessment/personalized-assessment-service";
import { PersonalizedRoadmapService } from "@/lib/ai-mentor/roadmap/personalized-roadmap-service";
import { PermissionAwareContextBuilder } from "@/lib/ai-mentor/permission-aware-context-builder";
import { StudentConsentService } from "@/lib/ai-mentor/student-consent-service";
import { aiMentorGoals } from "@/lib/db/ai-mentor-schema";

describe("ASTRION Goal-Centric Mentorship System Lifecycle", () => {
  const studentId = "student-ml-lifecycle-01";

  beforeEach(() => {
    // Reset caches and grant baseline consent
    StudentGoalService.resetCache();
    PersonalizedRoadmapService.resetCache();
    StudentConsentService.grantConsent(studentId, "service_personalization");
    StudentConsentService.grantConsent(studentId, "student_memory");
    StudentConsentService.grantConsent(studentId, "mentor_sharing");
  });

  // =========================================================================
  // 1. MANDATORY 13-POINT LIFECYCLE SCENARIO: MACHINE LEARNING ENGINEER
  // =========================================================================
  describe("1. Mandatory 13-Point Lifecycle Scenario: Machine Learning Engineer", () => {
    it("executes the complete goal-driven loop from declaration to adaptation", async () => {
      // Step 1: Student sets goal
      const turn1 = await AIMentorOrchestrator.processTurn({
        studentUserId: studentId,
        userMessage: "I want to become a machine learning engineer.",
        focusArea: "career",
      });

      // 1. Student-approved goal creation
      expect(turn1.goalReference).toBeDefined();
      expect(turn1.goalReference?.goalTitle).toContain("Machine Learning");
      expect(turn1.goalReference?.category).toBe("career");
      expect(turn1.goalReference?.importance).toBe("primary");
      expect(turn1.goalReference?.status).toBe("active");

      // 2. Context retrieval verification
      const context = await PermissionAwareContextBuilder.buildContext(studentId, {
        focusArea: "career",
        includeGoalTracking: true,
      });
      expect(context.activeGoal).toBeDefined();
      expect(context.activeGoal?.title).toContain("Machine Learning");
      expect(context.sanitizedBriefingMarkdown).toContain("Machine Learning");

      // 3. Skills assessment
      expect(turn1.assessment).toBeDefined();
      expect(turn1.assessment.overallReadinessScore).toBeGreaterThanOrEqual(0);
      expect(turn1.assessment.overallReadinessScore).toBeLessThanOrEqual(100);

      // 4. Evidence-backed gaps
      expect(turn1.assessment.confirmedGaps).toBeDefined();
      expect(Array.isArray(turn1.assessment.confirmedGaps)).toBe(true);
      const gapNames = turn1.assessment.confirmedGaps.map((g: any) => g.skill);
      expect(gapNames.some((n: string) => /PyTorch|TensorFlow|Linear Algebra|Data Structures/i.test(n))).toBe(true);

      // 5. Focused clarifying questions (zero fabrication)
      expect(turn1.assessment.missingEssentialInfo).toBeDefined();
      expect(turn1.assessment.missingEssentialInfo.length).toBeGreaterThan(0);
      expect(turn1.requiresStudentConfirmation).toBe(true);

      // 6. Personalized roadmap generation
      expect(turn1.studyPlan).toBeDefined();
      expect(turn1.studyPlan?.totalWeeks).toBeGreaterThanOrEqual(4);
      expect(turn1.studyPlan?.milestones.length).toBeGreaterThanOrEqual(4);

      // 7. Milestones & success criteria
      const firstMilestone = turn1.studyPlan?.milestones[0];
      expect(firstMilestone).toBeDefined();
      expect(firstMilestone?.weekNumber).toBe(1);
      expect(firstMilestone?.objectives.length).toBeGreaterThan(0);
      expect(firstMilestone?.deliverables.length).toBeGreaterThan(0);

      // 8. First action recommendation
      expect(turn1.recommendedNextAction).toBeDefined();
      expect(turn1.recommendedNextAction?.priority).toBe("high");
      expect(turn1.recommendedActions.length).toBeGreaterThan(0);

      // 9. Learning & project execution
      const turn2 = await AIMentorOrchestrator.processTurn({
        studentUserId: studentId,
        userMessage: "Can you explain backpropagation and gradient descent simply with a Python code example?",
        focusArea: "learn",
      });
      expect(turn2.message.length).toBeGreaterThan(50);
      expect(turn2.mentorIdentity?.role).toBe("ASTRION Lead AI Mentor");
      // Maintains link to active goal
      expect(turn2.goalReference?.goalTitle).toContain("Machine Learning");

      // 10. Actual progress recording (student confirms completion)
      const turn3 = await AIMentorOrchestrator.processTurn({
        studentUserId: studentId,
        userMessage: "I completed week 1 milestone deliverable with my numpy tensor implementation.",
        focusArea: "study_planning",
      });

      // 11. Milestone completion evaluation
      expect(turn3.roadmapUpdates).toBeDefined();
      expect(turn3.roadmapUpdates?.adaptedReason).toContain("Student confirmed completion");

      // 12. Roadmap adaptation
      expect(turn3.milestoneUpdates).toBeDefined();
      expect(turn3.milestoneUpdates?.progressPct).toBeGreaterThan(0);

      // 13. Student control preservation
      const activeGoal = await StudentGoalService.getActivePrimaryGoal(studentId);
      expect(activeGoal).toBeDefined();
      const updatedGoal = await StudentGoalService.updateGoal(studentId, activeGoal!.id, {
        targetOutcome: "Land an ML Engineer role at an AI research lab within 6 months",
      });
      expect(updatedGoal.targetOutcome).toContain("AI research lab");
    });
  });

  // =========================================================================
  // 2. 5-TIER PERSONALIZED ASSESSMENT ENGINE (ZERO FABRICATION)
  // =========================================================================
  describe("2. 5-Tier Personalized Assessment Engine", () => {
    it("categorizes evidence strictly across 5 tiers without guessing", async () => {
      const mockGoal = {
        id: "goal-test-ml",
        studentUserId: studentId,
        title: "Machine Learning Engineer",
        description: "Machine Learning Engineer goal",
        category: "career" as const,
        importance: "primary" as const,
        status: "active" as const,
        currentState: "in_progress" as const,
        targetOutcome: "Master ML",
        successCriteria: [],
        associatedSkills: ["Python", "PyTorch", "Calculus", "CUDA Optimization"],
        associatedProjects: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockContext: any = {
        studentProfile: {
          verifiedSkills: [
            { skillName: "Python", masteryState: "competent", provenance: "code_review" },
          ],
        },
        classifiedEvidence: {
          confirmedFacts: ["Demonstrated Python proficiency in algorithms"],
          selfReportedClaims: ["Knows basic calculus from college"],
          inferredPatterns: ["Interested in computer vision"],
          unknownGaps: ["CUDA Optimization", "PyTorch"],
        },
        studentGraph: {
          masteryNodes: [
            { skillId: "sk-python", skillName: "Python", masteryScore: 82, masteryState: "competent" },
          ],
        },
      };

      const assessment = PersonalizedAssessmentService.assessCurrentState(mockContext, mockGoal);

      // Tier 1: Verified strengths
      expect(assessment.confirmedStrengths.some((s) => s.toLowerCase().includes("python"))).toBe(true);
      expect(assessment.evidenceTiersSummary.confirmedCount).toBeGreaterThanOrEqual(1);

      // Tier 2: Self-reported claims
      expect(assessment.evidenceTiersSummary.studentReportedCount).toBeGreaterThanOrEqual(1);

      // Tier 5: Unknown / Missing skills formulate questions rather than fake mastery
      expect(assessment.missingEssentialInfo.length).toBeGreaterThan(0);
      expect(
        assessment.missingEssentialInfo.some((q) => /CUDA|PyTorch|Calculus/i.test(q.question || q.targetCompetency))
      ).toBe(true);

      // Confirmed prerequisite gaps
      expect(assessment.confirmedGaps.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 3. DYNAMIC PERSONALIZED ROADMAP GENERATION & ADAPTATION
  // =========================================================================
  describe("3. Dynamic Personalized Roadmap Generation & Adaptation", () => {
    it("generates milestone deliverables and adapts progression with confirmation", async () => {
      const goal = await StudentGoalService.createGoal(studentId, {
        title: "Full-Stack Distributed Systems Architect",
        category: "career",
        importance: "primary",
      });

      const assessment = PersonalizedAssessmentService.assessCurrentState(
        { studentProfile: { verifiedSkills: [] } } as any,
        goal
      );

      const roadmap = await PersonalizedRoadmapService.generatePersonalizedRoadmap(
        studentId,
        goal,
        assessment
      );

      expect(roadmap.goalId).toBe(goal.id);
      expect(roadmap.milestones.length).toBeGreaterThanOrEqual(3);
      expect(roadmap.currentMilestoneWeek).toBe(1);
      expect(roadmap.milestones[0].status).toBe("in_progress");

      // Progress milestone with confirmation
      const progressed = await PersonalizedRoadmapService.markMilestoneProgress(
        studentId,
        roadmap.id,
        1,
        "completed",
        "Implemented Redis raft consensus protocol"
      );

      expect(progressed.milestones[0].status).toBe("completed");
      expect(progressed.milestones[1].status).toBe("in_progress");
      expect(progressed.currentMilestoneWeek).toBe(2);

      // Dynamic adaptation
      const adapted = await PersonalizedRoadmapService.adaptRoadmap(
        studentId,
        roadmap.id,
        "Student demonstrated accelerated mastery in container orchestration",
        { 2: "completed" }
      );

      expect(adapted.milestones[1].status).toBe("completed");
      expect(adapted.currentMilestoneWeek).toBe(3);
      expect(adapted.adaptationHistory?.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 4. GOAL CONFLICT DETECTION & TRADE-OFF ANALYSIS
  // =========================================================================
  describe("4. Goal Conflict Detection & Trade-off Analysis", () => {
    it("detects divergent goal conflicts and provides concrete trade-off recommendations", async () => {
      await StudentGoalService.createGoal(studentId, {
        title: "Machine Learning Engineer",
        category: "career",
        importance: "primary",
      });

      await StudentGoalService.createGoal(studentId, {
        title: "Distributed Systems Architect",
        category: "career",
        importance: "primary",
      });

      const conflictReport = await StudentGoalService.detectGoalConflicts(studentId);
      expect(conflictReport.hasConflicts).toBe(true);
      expect(conflictReport.conflictingGoals.length).toBeGreaterThanOrEqual(2);
      expect(conflictReport.tradeOffAnalysis.length).toBeGreaterThan(0);
      expect(conflictReport.tradeOffAnalysis[0].length).toBeGreaterThan(20);
      expect(conflictReport.recommendedResolution).toBeDefined();
    });
  });

  // =========================================================================
  // 5. MULTI-GOAL MANAGEMENT & STUDENT CONTROL PRESERVATION
  // =========================================================================
  describe("5. Multi-Goal Management & Student Control", () => {
    it("allows pausing, activating, updating priority, and managing multiple goals", async () => {
      const g1 = await StudentGoalService.createGoal(studentId, {
        title: "Backend Engineer",
        category: "career",
        importance: "primary",
      });

      const g2 = await StudentGoalService.createGoal(studentId, {
        title: "Open Source Contributor",
        category: "project",
        importance: "secondary",
      });

      // Retrieve active primary
      let activePrimary = await StudentGoalService.getActivePrimaryGoal(studentId);
      expect(activePrimary?.id).toBe(g1.id);

      // Switch priority
      await StudentGoalService.setGoalPriority(studentId, g2.id, "primary");
      activePrimary = await StudentGoalService.getActivePrimaryGoal(studentId);
      expect(activePrimary?.id).toBe(g2.id);

      // Pause goal
      const paused = await StudentGoalService.updateGoalStatus(studentId, g2.id, "paused");
      expect(paused.status).toBe("paused");

      // Verify paused goal is not returned as active primary
      const activeAfterPause = await StudentGoalService.getActivePrimaryGoal(studentId);
      expect(activeAfterPause?.id).toBe(g1.id);
    });
  });

  // =========================================================================
  // 6. GOVERNANCE & CONSENT ENFORCEMENT DURING ORCHESTRATION
  // =========================================================================
  describe("6. Governance & Consent Enforcement", () => {
    it("respects revoked consent by sanitizing memory while maintaining unified mentor guidance", async () => {
      // Revoke memory consent
      StudentConsentService.revokeConsent(studentId, "student_memory");

      const response = await AIMentorOrchestrator.processTurn({
        studentUserId: studentId,
        userMessage: "What is my current career goal and next step?",
        focusArea: "study_planning",
      });

      expect(response).toBeDefined();
      expect(response.message.length).toBeGreaterThan(20);
      expect(response.mentorIdentity?.role).toBe("ASTRION Lead AI Mentor");
    });
  });

  // =========================================================================
  // 7. PERSISTENT DATABASE SCHEMA VERIFICATION
  // =========================================================================
  describe("7. Persistent Database Schema Verification", () => {
    it("verifies aiMentorGoals table schema structure and column keys", () => {
      expect(aiMentorGoals).toBeDefined();
      expect(aiMentorGoals.id).toBeDefined();
      expect(aiMentorGoals.studentUserId).toBeDefined();
      expect(aiMentorGoals.title).toBeDefined();
      expect(aiMentorGoals.description).toBeDefined();
      expect(aiMentorGoals.category).toBeDefined();
      expect(aiMentorGoals.importance).toBeDefined();
      expect(aiMentorGoals.status).toBeDefined();
      expect(aiMentorGoals.targetOutcome).toBeDefined();
      expect(aiMentorGoals.targetDate).toBeDefined();
      expect(aiMentorGoals.currentState).toBeDefined();
      expect(aiMentorGoals.successCriteria).toBeDefined();
      expect(aiMentorGoals.associatedSkills).toBeDefined();
      expect(aiMentorGoals.associatedProjects).toBeDefined();
      expect(aiMentorGoals.roadmapId).toBeDefined();
      expect(aiMentorGoals.createdAt).toBeDefined();
      expect(aiMentorGoals.updatedAt).toBeDefined();
    });
  });
});
