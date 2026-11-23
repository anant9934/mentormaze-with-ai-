/**
 * Comprehensive Test Suite for BloomTutor Learning Journey & Social Communication Coach
 * Brand: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 * Architecture: ASTRION Adaptive Mentorship Engine
 *
 * Verifies:
 * 1. BloomTutor Structured Learning Journey (Goal -> Diagnostic -> Path -> Lesson -> Feedback -> Assessment -> Remediation -> Summary)
 * 2. Note taking and inline code/concept annotations
 * 3. BKT and FSRS updates triggered by lesson evaluations
 * 4. Exportable Markdown Learning Summary with active goal and retention schedules
 * 5. Social & Communication Coach 5 scenario simulations (Salary, BLUF, Tech Disagreement, STAR, Non-tech explanation)
 * 6. Multi-turn dialogue, real-time coaching whispers, and 6-dimension rubric evaluation
 * 7. Session retry with adjusted counterpart attitudes
 * 8. Strict authorization boundaries (403 Forbidden for cross-student access)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { BloomLearningJourneyService } from "../lib/ai-mentor/learning-journey/bloom-journey-service";
import { SocialCommunicationCoachService } from "../lib/ai-mentor/communication/social-coach-service";
import { AiMentorOrchestrator } from "../lib/ai-mentor/orchestrator";
import { StudentSkillGraph } from "../lib/ai-mentor/student-skill-graph";
import { BayesianKnowledgeTracer } from "../lib/ai-mentor/pedagogy/bkt-service";
import { FSRSScheduler } from "../lib/ai-mentor/pedagogy/fsrs-service";
import { StudentGoalService } from "../lib/ai-mentor/goals/student-goal-service";
import { StudentMemoryService } from "../lib/ai-mentor/student-memory-service";
import { StudentConsentService } from "../lib/ai-mentor/student-consent-service";
import { PermissionAwareContextBuilder } from "../lib/ai-mentor/permission-aware-context-builder";

describe("ASTRION Learning Journey & Social Communication Coach Engine", () => {
  const TEST_STUDENT = "student-bloom-social-test";
  const OTHER_STUDENT = "student-other-boundary-test";

  beforeEach(() => {
    BloomLearningJourneyService.reset();
    SocialCommunicationCoachService.reset();
    StudentSkillGraph.reset();
    BayesianKnowledgeTracer.reset();
    FSRSScheduler.reset();
    StudentGoalService.reset();
    StudentMemoryService.reset();
    StudentConsentService.reset();
  });

  // =========================================================================
  // 1. BLOOMTUTOR LEARNING JOURNEY TESTS
  // =========================================================================

  describe("BloomTutor Learning Journey Service", () => {
    it("should initialize a structured learning programme from topic decomposition", () => {
      const prog = BloomLearningJourneyService.createProgramme({
        studentUserId: TEST_STUDENT,
        goalId: "goal-sde1-core",
        topicName: "dynamic_programming",
        requestingUserId: TEST_STUDENT,
      });

      expect(prog.id).toBeDefined();
      expect(prog.studentUserId).toBe(TEST_STUDENT);
      expect(prog.topic).toBe("dynamic_programming");
      expect(prog.lessons.length).toBeGreaterThanOrEqual(4);
      expect(prog.currentLessonIndex).toBe(0);
      expect(prog.lessons[0].status).toBe("in_progress");
      expect(prog.lessons[1].status).toBe("pending");
      expect(prog.status).toBe("active");
      expect(prog.lessons[0].exercise.prompt).toBeDefined();
      expect(prog.lessons[0].exercise.starterCode).toBeDefined();
    });

    it("should enforce student ownership authorization on programme creation and retrieval", () => {
      const prog = BloomLearningJourneyService.createProgramme({
        studentUserId: TEST_STUDENT,
        goalId: "goal-auth-check",
        topicName: "dynamic_programming",
        requestingUserId: TEST_STUDENT,
      });

      // Cross-student creation should throw 403
      expect(() => {
        BloomLearningJourneyService.createProgramme({
          studentUserId: TEST_STUDENT,
          goalId: "goal-auth-check",
          topicName: "dynamic_programming",
          requestingUserId: OTHER_STUDENT,
        });
      }).toThrow(/403_FORBIDDEN/);

      // Cross-student retrieval should throw 403
      expect(() => {
        BloomLearningJourneyService.getProgramme(TEST_STUDENT, prog.id, OTHER_STUDENT);
      }).toThrow(/403_FORBIDDEN/);

      // Mentor access should succeed
      const mentorProg = BloomLearningJourneyService.getProgramme(TEST_STUDENT, prog.id, "mentor-lead-coach");
      expect(mentorProg.id).toBe(prog.id);
    });

    it("should record student feedback on lessons", () => {
      const prog = BloomLearningJourneyService.createProgramme({
        studentUserId: TEST_STUDENT,
        goalId: "goal-feedback",
        topicName: "dynamic_programming",
        requestingUserId: TEST_STUDENT,
      });

      const lesson0 = prog.lessons[0];
      const updatedProg = BloomLearningJourneyService.submitLessonFeedback({
        studentUserId: TEST_STUDENT,
        programmeId: prog.id,
        lessonId: lesson0.id,
        feedback: {
          rating: 4,
          clarity: "clear",
          comment: "The optimal substructure explanation was very crisp.",
          timestamp: new Date().toISOString(),
        },
        requestingUserId: TEST_STUDENT,
      });

      expect(updatedProg.lessons[0].studentFeedback?.rating).toBe(4);
      expect(updatedProg.lessons[0].studentFeedback?.clarity).toBe("clear");
    });

    it("should evaluate lesson exercise, update BKT/FSRS, and advance to next lesson on pass", () => {
      const prog = BloomLearningJourneyService.createProgramme({
        studentUserId: TEST_STUDENT,
        goalId: "goal-progression",
        topicName: "dynamic_programming",
        requestingUserId: TEST_STUDENT,
      });

      const lesson0 = prog.lessons[0];
      const result = BloomLearningJourneyService.evaluateLessonExercise({
        studentUserId: TEST_STUDENT,
        programmeId: prog.id,
        lessonId: lesson0.id,
        score: 9.2,
        feedback: "Flawless recurrence relation formulation and state space proof.",
        requestingUserId: TEST_STUDENT,
      });

      expect(result.evaluation.isPassed).toBe(true);
      expect(result.evaluation.demonstratedMastery).toBe(4);
      expect(result.remediationNeeded).toBe(false);

      // Verified progression: lesson0 completed, lesson1 in_progress
      expect(result.programme.lessons[0].status).toBe("completed");
      expect(result.programme.currentLessonIndex).toBe(1);
      expect(result.programme.lessons[1].status).toBe("in_progress");

      // Verify BKT update
      const bkt = BayesianKnowledgeTracer.getConceptState(TEST_STUDENT, lesson0.subskillId);
      expect(bkt.knowledgeProbability).toBeGreaterThan(0.40);

      // Verify FSRS update
      const fsrs = FSRSScheduler.getConceptRecord(TEST_STUDENT, lesson0.subskillId);
      expect(fsrs.reps).toBe(1);
      expect(fsrs.stability).toBeGreaterThan(1.0);
    });

    it("should route to remediation queue when student fails lesson exercise", () => {
      const prog = BloomLearningJourneyService.createProgramme({
        studentUserId: TEST_STUDENT,
        goalId: "goal-remediation",
        topicName: "dynamic_programming",
        requestingUserId: TEST_STUDENT,
      });

      const lesson0 = prog.lessons[0];
      const result = BloomLearningJourneyService.evaluateLessonExercise({
        studentUserId: TEST_STUDENT,
        programmeId: prog.id,
        lessonId: lesson0.id,
        score: 4.5,
        feedback: "Confused optimal substructure with overlapping subproblems.",
        requestingUserId: TEST_STUDENT,
      });

      expect(result.evaluation.isPassed).toBe(false);
      expect(result.remediationNeeded).toBe(true);
      expect(result.programme.lessons[0].status).toBe("needs_remediation");
      expect(result.programme.remediationQueue).toContain(lesson0.subskillId);
      expect(result.programme.status).toBe("remediating");
      // Current lesson index should not have advanced
      expect(result.programme.currentLessonIndex).toBe(0);

      // Verify BKT registered failed attempt
      const bkt = BayesianKnowledgeTracer.getConceptState(TEST_STUDENT, lesson0.subskillId);
      expect(bkt.lastOutcome).toBe("failed_attempt");
    });

    it("should support student lesson notes and inline highlighted annotations", () => {
      const prog = BloomLearningJourneyService.createProgramme({
        studentUserId: TEST_STUDENT,
        goalId: "goal-notes",
        topicName: "dynamic_programming",
        requestingUserId: TEST_STUDENT,
      });

      const lesson0 = prog.lessons[0];

      // Add markdown note
      const note = BloomLearningJourneyService.addNote({
        studentUserId: TEST_STUDENT,
        programmeId: prog.id,
        lessonId: lesson0.id,
        content: "Important tip: Always formulate DAG dependency direction before writing the iterative loop.",
        requestingUserId: TEST_STUDENT,
      });
      expect(note.id).toBeDefined();

      // Add inline annotation
      const annotation = BloomLearningJourneyService.addAnnotation({
        studentUserId: TEST_STUDENT,
        programmeId: prog.id,
        lessonId: lesson0.id,
        highlightedText: "dp[i] = dp[i-1] + dp[i-2]",
        note: "Base cases dp[0] and dp[1] must be guarded against out-of-bounds inputs.",
        requestingUserId: TEST_STUDENT,
      });
      expect(annotation.id).toBeDefined();

      const retrieved = BloomLearningJourneyService.getProgramme(TEST_STUDENT, prog.id, TEST_STUDENT);
      expect(retrieved.notes.length).toBe(1);
      expect(retrieved.annotations.length).toBe(1);
      expect(retrieved.annotations[0].highlightedText).toContain("dp[i]");
    });

    it("should complete final assessment and generate exportable markdown summary", async () => {
      // Set active career goal first
      await StudentGoalService.createGoal(
        TEST_STUDENT,
        {
          title: "Staff Software Engineer - Distributed Systems",
          description: "Master algorithms and high-scale systems architecture.",
          category: "career",
          importance: "primary",
          targetDate: "2027-06-01",
          successCriteria: ["Score Level 4+ in Dynamic Programming", "Pass Distributed Systems Rubric"],
        },
        TEST_STUDENT
      );

      const prog = BloomLearningJourneyService.createProgramme({
        studentUserId: TEST_STUDENT,
        goalId: "goal-final-eval",
        topicName: "dynamic_programming",
        requestingUserId: TEST_STUDENT,
      });

      // Complete all lessons with passing scores
      for (const lesson of prog.lessons) {
        BloomLearningJourneyService.evaluateLessonExercise({
          studentUserId: TEST_STUDENT,
          programmeId: prog.id,
          lessonId: lesson.id,
          score: 8.8,
          feedback: "Great implementation and time complexity analysis.",
          requestingUserId: TEST_STUDENT,
        });
      }

      // Complete final assessment
      const finalAssessment = BloomLearningJourneyService.completeFinalAssessment({
        studentUserId: TEST_STUDENT,
        programmeId: prog.id,
        score: 9.5,
        summary: "Demonstrated master-level fluency across all DP invariants, recurrence equations, and edge cases.",
        requestingUserId: TEST_STUDENT,
      });

      expect(finalAssessment.passed).toBe(true);
      expect(finalAssessment.overallMastery).toBe(5);

      // Export learning summary
      const summaryMarkdown = BloomLearningJourneyService.exportLearningSummary(TEST_STUDENT, prog.id, TEST_STUDENT);

      expect(summaryMarkdown).toContain("# 🎓 ASTRION Learning Programme Summary");
      expect(summaryMarkdown).toContain("Staff Software Engineer - Distributed Systems");
      expect(summaryMarkdown).toContain("Completed Lessons & Mastery Breakdown");
      expect(summaryMarkdown).toContain("Final Assessment Outcome");
      expect(summaryMarkdown).toContain("Spaced Repetition Maintenance (FSRS Schedule)");
      expect(summaryMarkdown).toContain("MentorMaze by AI Tathastu");
    });
  });

  // =========================================================================
  // 2. SOCIAL & COMMUNICATION COACH TESTS
  // =========================================================================

  describe("Social & Communication Coach Service", () => {
    it("should initialize sessions across all 5 mandatory communication scenarios", () => {
      const scenarios = [
        "salary_negotiation",
        "executive_status_update",
        "technical_disagreement",
        "behavioral_interview",
        "non_technical_explanation",
      ] as const;

      for (const scenario of scenarios) {
        const session = SocialCommunicationCoachService.startSession({
          studentUserId: TEST_STUDENT,
          scenarioType: scenario,
          requestingUserId: TEST_STUDENT,
        });

        expect(session.id).toBeDefined();
        expect(session.scenarioType).toBe(scenario);
        expect(session.counterpartPersona.name).toBeDefined();
        expect(session.turns.length).toBe(1);
        expect(session.turns[0].speaker).toBe("counterpart");
        expect(session.turns[0].coachingWhisper).toBeDefined();
        expect(session.status).toBe("in_progress");
      }
    });

    it("should enforce authorization boundaries for simulation sessions", () => {
      const session = SocialCommunicationCoachService.startSession({
        studentUserId: TEST_STUDENT,
        scenarioType: "salary_negotiation",
        requestingUserId: TEST_STUDENT,
      });

      expect(() => {
        SocialCommunicationCoachService.getSession(TEST_STUDENT, session.id, OTHER_STUDENT);
      }).toThrow(/403_FORBIDDEN/);

      expect(() => {
        SocialCommunicationCoachService.processTurn({
          studentUserId: TEST_STUDENT,
          sessionId: session.id,
          studentMessage: "I accept.",
          requestingUserId: OTHER_STUDENT,
        });
      }).toThrow(/403_FORBIDDEN/);
    });

    it("should generate situational coaching whispers and counterpart replies during multi-turn salary negotiation", () => {
      const session = SocialCommunicationCoachService.startSession({
        studentUserId: TEST_STUDENT,
        scenarioType: "salary_negotiation",
        requestingUserId: TEST_STUDENT,
      });

      // Turn 1: Student uses market data and range anchoring
      const turn1 = SocialCommunicationCoachService.processTurn({
        studentUserId: TEST_STUDENT,
        sessionId: session.id,
        studentMessage:
          "Thank you for the offer. Based on my verified backend performance benchmarks and current market data for SDE-1 roles in Bangalore (22 to 24 LPA), I was expecting an offer closer to 22 LPA base. How flexible is the budget?",
        requestingUserId: TEST_STUDENT,
      });

      expect(turn1.session.turns.length).toBe(3); // Initial counterpart, student, counterpart reply
      expect(turn1.coachingWhisper).toContain("Excellent anchoring on market data");
      expect(turn1.counterpartReply).toContain("19.5 LPA");

      // Turn 2: Student accepts revised counter-offer
      const turn2 = SocialCommunicationCoachService.processTurn({
        studentUserId: TEST_STUDENT,
        sessionId: session.id,
        studentMessage: "I accept the revised offer of 19.5 LPA base plus the retention bonus.",
        requestingUserId: TEST_STUDENT,
      });

      expect(turn2.session.turns.length).toBe(5);
      expect(turn2.counterpartReply).toContain("standard contract");
    });

    it("should evaluate completed simulation across 6 rubric dimensions and provide exemplary rewrites", () => {
      const session = SocialCommunicationCoachService.startSession({
        studentUserId: TEST_STUDENT,
        scenarioType: "executive_status_update",
        requestingUserId: TEST_STUDENT,
      });

      SocialCommunicationCoachService.processTurn({
        studentUserId: TEST_STUDENT,
        sessionId: session.id,
        studentMessage:
          "Bottom line up front, Vikram: our core database migration is rescheduled by 7 days to next Tuesday due to connection-pool locking under peak load. We have isolated the lock contention and are applying batch chunking today. There is zero risk to data integrity, and our customer SLA commitments remain unaffected.",
        requestingUserId: TEST_STUDENT,
      });

      const evalResult = SocialCommunicationCoachService.completeAndEvaluate({
        studentUserId: TEST_STUDENT,
        sessionId: session.id,
        requestingUserId: TEST_STUDENT,
      });

      expect(evalResult.clarity.score).toBeGreaterThanOrEqual(7.0);
      expect(evalResult.structure.score).toBeGreaterThanOrEqual(8.0);
      expect(evalResult.toneAndEmotionalAwareness.score).toBeGreaterThanOrEqual(8.0);
      expect(evalResult.professionalPresence.score).toBeGreaterThanOrEqual(8.0);
      expect(evalResult.technicalAccuracy.score).toBeGreaterThanOrEqual(8.0);
      expect(evalResult.persuasiveness.score).toBeGreaterThanOrEqual(8.0);
      expect(evalResult.overallScore).toBeGreaterThanOrEqual(8.0);
      expect(evalResult.exemplaryRewrite).toContain("Bottom line up front");
      expect(evalResult.concreteRevisionSuggestions.length).toBeGreaterThanOrEqual(2);

      const finalSession = SocialCommunicationCoachService.getSession(TEST_STUDENT, session.id, TEST_STUDENT);
      expect(finalSession.status).toBe("completed");
      expect(finalSession.evaluation).toBeDefined();
    });

    it("should penalize defensive phrasing in tone rubric evaluation", () => {
      const session = SocialCommunicationCoachService.startSession({
        studentUserId: TEST_STUDENT,
        scenarioType: "technical_disagreement",
        requestingUserId: TEST_STUDENT,
      });

      SocialCommunicationCoachService.processTurn({
        studentUserId: TEST_STUDENT,
        sessionId: session.id,
        studentMessage: "You don't understand the problem at all. Your suggestion is completely wrong.",
        requestingUserId: TEST_STUDENT,
      });

      const evalResult = SocialCommunicationCoachService.completeAndEvaluate({
        studentUserId: TEST_STUDENT,
        sessionId: session.id,
        requestingUserId: TEST_STUDENT,
      });

      // Defensive phrasing should trigger low tone score
      expect(evalResult.toneAndEmotionalAwareness.score).toBeLessThanOrEqual(6.0);
      expect(evalResult.toneAndEmotionalAwareness.feedback).toContain("defensive");
    });

    it("should allow retrying a scenario simulation with adjusted counterpart attitude", () => {
      const session1 = SocialCommunicationCoachService.startSession({
        studentUserId: TEST_STUDENT,
        scenarioType: "salary_negotiation",
        requestingUserId: TEST_STUDENT,
      });

      expect(session1.counterpartPersona.attitude).toBe("skeptical");

      const session2 = SocialCommunicationCoachService.retrySession({
        studentUserId: TEST_STUDENT,
        sessionId: session1.id,
        adjustedAttitude: "demanding",
        requestingUserId: TEST_STUDENT,
      });

      expect(session2.id).not.toBe(session1.id);
      expect(session2.scenarioType).toBe("salary_negotiation");
      expect(session2.counterpartPersona.attitude).toBe("demanding");
      expect(session2.status).toBe("in_progress");
    });
  });

  // =========================================================================
  // 3. UNIFIED ORCHESTRATOR FACADE INTEGRATION
  // =========================================================================

  describe("AiMentorOrchestrator Facade Integration", () => {
    it("should expose Bloom Learning Journey and Social Coach methods through unified orchestrator facade", () => {
      // Bloom facade test
      const prog = AiMentorOrchestrator.createLearningProgramme({
        studentUserId: TEST_STUDENT,
        goalId: "goal-facade",
        topicName: "dynamic_programming",
        requestingUserId: TEST_STUDENT,
      });
      expect(prog.id).toBeDefined();

      const retrievedProg = AiMentorOrchestrator.getLearningProgramme(TEST_STUDENT, prog.id, TEST_STUDENT);
      expect(retrievedProg.id).toBe(prog.id);

      // Social Coach facade test
      const sim = AiMentorOrchestrator.startCommunicationSimulation({
        studentUserId: TEST_STUDENT,
        scenarioType: "behavioral_interview",
        requestingUserId: TEST_STUDENT,
      });
      expect(sim.id).toBeDefined();

      const simRetrieved = AiMentorOrchestrator.getCommunicationSimulation(TEST_STUDENT, sim.id, TEST_STUDENT);
      expect(simRetrieved.id).toBe(sim.id);

      const turn = AiMentorOrchestrator.processCommunicationTurn({
        studentUserId: TEST_STUDENT,
        sessionId: sim.id,
        studentMessage: "In my previous role, I caused a database lock outage. I immediately rolled back, audited the migration script, and introduced staging dry-runs.",
        requestingUserId: TEST_STUDENT,
      });
      expect(turn.coachingWhisper).toBeDefined();

      const evalResult = AiMentorOrchestrator.evaluateCommunicationSimulation({
        studentUserId: TEST_STUDENT,
        sessionId: sim.id,
        requestingUserId: TEST_STUDENT,
      });
      expect(evalResult.overallScore).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 4. MEMORY GOVERNANCE & CONSENT BOUNDARIES (Phase 9)
  // =========================================================================

  describe("Memory Governance & Consent Enforcement", () => {
    it("should support complete memory purge for student data deletion compliance", () => {
      StudentMemoryService.saveMemory(
        TEST_STUDENT,
        "learning_preferences",
        "Preferred Format",
        "Interactive diagrams and visual debugging",
        "student_reported",
        1.0,
        false,
        undefined,
        true,
        TEST_STUDENT
      );

      const before = StudentMemoryService.getMemories(TEST_STUDENT, TEST_STUDENT);
      expect(before.length).toBeGreaterThan(0);

      // Cross-student purge must fail with 403
      expect(() => {
        StudentMemoryService.purgeAllMemories(TEST_STUDENT, OTHER_STUDENT);
      }).toThrow(/403_FORBIDDEN/);

      // Student purge must succeed
      StudentMemoryService.purgeAllMemories(TEST_STUDENT, TEST_STUDENT);
      const after = StudentMemoryService.getMemories(TEST_STUDENT, TEST_STUDENT);
      expect(after.length).toBe(0);
    });

    it("should halt memory access and mutations when student_memory consent is revoked", async () => {
      await StudentConsentService.revokeConsent(TEST_STUDENT, "student_memory", "Revoked for privacy", TEST_STUDENT);

      // Reading memories should return empty array
      const memories = StudentMemoryService.getMemories(TEST_STUDENT, TEST_STUDENT);
      expect(memories).toEqual([]);

      // Writing memories should throw 403 Forbidden
      expect(() => {
        StudentMemoryService.saveMemory(
          TEST_STUDENT,
          "learning_preferences",
          "Test Key",
          "Test Value",
          "student_reported",
          1.0,
          false,
          undefined,
          true,
          TEST_STUDENT
        );
      }).toThrow(/403_FORBIDDEN/);
    });

    it("should deliver unpersonalized fallback context when service_personalization consent is withheld", async () => {
      await StudentConsentService.revokeConsent(TEST_STUDENT, "service_personalization", "Withholding personalization", TEST_STUDENT);

      const ctx = await PermissionAwareContextBuilder.buildContext(TEST_STUDENT, {
        requestingUserId: TEST_STUDENT,
        purpose: "service_personalization",
      });

      expect(ctx.consentGranted).toBe(false);
      expect(ctx.isPersonalized).toBe(false);
      expect(ctx.classifiedEvidence.confirmedFacts).toEqual([]);
    });
  });
});
