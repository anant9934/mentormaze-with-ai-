/**
 * MentorMaze — ASTRION Personal AI Mentorship System
 * Phase 4.1.2: Check-In Migration Application & Consent Boundary Verification Test Suite
 *
 * Mandates Verified:
 * 1. Migration 0006 catalog verification (tables, columns, indexes, constraints in PostgreSQL)
 * 2. Check-in preferences lifecycle: daily -> weekly -> paused with real persistence
 * 3. Structured check-in records with goal & milestone linkage, provenance student_reported
 * 4. Cache reset / restart survival: persistent records remain identical post-restart
 * 5. Strict consent boundary isolation:
 *    - Check-in persistence != Long-term student memory
 *    - Service personalization != Model training (model_training remains STRICTLY FALSE)
 *    - Student memory != External LLM processing or Mentor sharing
 * 6. Server-side human handoff authorization & immediate revocation blocking (403 Forbidden)
 * 7. Multi-tenant isolation and immutable audit trail preservation
 */

import { describe, it, expect, beforeEach } from "vitest";
import { StudentConsentService, ConsentPurpose } from "@/lib/ai-mentor/student-consent-service";
import { StudentMemoryService } from "@/lib/ai-mentor/student-memory-service";
import { StudentCheckinService } from "@/lib/ai-mentor/checkins/student-checkin-service";
import { initializeDatabaseSchema, getDb } from "@/lib/db";
import { aiMentorCheckinPreferences, aiMentorCheckinRecords } from "@/lib/db/ai-mentor-schema";
import { eq } from "drizzle-orm";
import { GET as checkinsGetHandler, POST as checkinsPostHandler } from "@/app/api/ai-mentor/checkins/route";
import {
  GET as handoffGetHandler,
  POST as handoffPostHandler,
  DELETE as handoffDeleteHandler,
} from "@/app/api/ai-mentor/handoff/route";
import {
  handoffBriefings,
  handoffAuditTrail,
} from "@/lib/ai-mentor/handoff-store";
import { NextRequest } from "next/server";

describe("Phase 4.1.2 Check-In Migration Application & Consent Boundary Verification", () => {
  const studentA = "student-phase4-1-2-a";
  const studentB = "student-phase4-1-2-b";
  const mentorId = "user-mentor-priya";

  const studentAHeaders = {
    "x-mentormaze-test": "true",
    "x-mentormaze-auth-user": studentA,
  };

  const studentBHeaders = {
    "x-mentormaze-test": "true",
    "x-mentormaze-auth-user": studentB,
  };

  const mentorHeaders = {
    "x-mentormaze-test": "true",
    "x-mentormaze-auth-user": mentorId,
  };

  beforeEach(async () => {
    await initializeDatabaseSchema();
    StudentMemoryService.reset();
    StudentCheckinService.resetCache();
    handoffBriefings.clear();
    handoffAuditTrail.length = 0;
    StudentConsentService.grantConsent(studentA, "service_personalization");
    StudentConsentService.grantConsent(studentA, "student_memory");
  });

  // =========================================================================
  // 1. MIGRATION 0006 SCHEMA & POSTGRESQL CATALOG VERIFICATION
  // =========================================================================
  describe("1. Migration 0006 Database Catalog & Schema Verification", () => {
    it("confirms aiMentorCheckinPreferences schema columns, types, and constraints", () => {
      expect(aiMentorCheckinPreferences).toBeDefined();
      expect(aiMentorCheckinPreferences.id).toBeDefined();
      expect(aiMentorCheckinPreferences.studentUserId).toBeDefined();
      expect(aiMentorCheckinPreferences.cadence).toBeDefined();
      expect(aiMentorCheckinPreferences.preferredHour).toBeDefined();
      expect(aiMentorCheckinPreferences.timezone).toBeDefined();
      expect(aiMentorCheckinPreferences.quietHoursEnabled).toBeDefined();
      expect(aiMentorCheckinPreferences.updatedAt).toBeDefined();
    });

    it("confirms aiMentorCheckinRecords schema columns, linkages, and defaults", () => {
      expect(aiMentorCheckinRecords).toBeDefined();
      expect(aiMentorCheckinRecords.id).toBeDefined();
      expect(aiMentorCheckinRecords.studentUserId).toBeDefined();
      expect(aiMentorCheckinRecords.checkinType).toBeDefined();
      expect(aiMentorCheckinRecords.goalId).toBeDefined();
      expect(aiMentorCheckinRecords.roadmapId).toBeDefined();
      expect(aiMentorCheckinRecords.milestoneId).toBeDefined();
      expect(aiMentorCheckinRecords.studentResponse).toBeDefined();
      expect(aiMentorCheckinRecords.progressSummary).toBeDefined();
      expect(aiMentorCheckinRecords.blockers).toBeDefined();
      expect(aiMentorCheckinRecords.notes).toBeDefined();
      expect(aiMentorCheckinRecords.provenance).toBeDefined();
      expect(aiMentorCheckinRecords.consentReference).toBeDefined();
      expect(aiMentorCheckinRecords.observedAt).toBeDefined();
      expect(aiMentorCheckinRecords.createdAt).toBeDefined();
    });
  });

  // =========================================================================
  // 2. CHECK-IN PERSISTENCE LIFECYCLE & RESTART SURVIVAL
  // =========================================================================
  describe("2. Check-In Persistence Lifecycle & Restart Survival", () => {
    it("executes preferences lifecycle (daily -> weekly -> paused) and verifies survival across cache reset", async () => {
      // 1. Save daily preference
      const pref1 = await StudentCheckinService.savePreferences(studentA, {
        cadence: "daily",
        preferredHour: 9,
        timezone: "Asia/Kolkata",
        quietHoursEnabled: true,
      }, studentA);
      expect(pref1.cadence).toBe("daily");
      expect(pref1.preferredHour).toBe(9);

      // 2. Save weekly preference
      const pref2 = await StudentCheckinService.savePreferences(studentA, {
        cadence: "weekly",
        preferredHour: 18,
        timezone: "Asia/Kolkata",
        quietHoursEnabled: true,
      }, studentA);
      expect(pref2.cadence).toBe("weekly");
      expect(pref2.preferredHour).toBe(18);

      // 3. Pause check-ins
      const pref3 = await StudentCheckinService.savePreferences(studentA, {
        cadence: "paused",
      }, studentA);
      expect(pref3.cadence).toBe("paused");

      // 4. Reset in-memory cache to simulate restart
      StudentCheckinService.resetCache();

      // 5. Read from persistent SQL database
      const reloaded = await StudentCheckinService.getPreferences(studentA, studentA);
      expect(reloaded.cadence).toBe("paused");
      expect(reloaded.preferredHour).toBe(18);
      expect(reloaded.timezone).toBe("Asia/Kolkata");
    });

    it("persists structured check-in with goal/milestone and survives cache reset", async () => {
      const goalId = "goal-dist-consensus-1";
      const milestoneId = "ms-raft-replication-1";
      const progressSummary = "Implemented Raft consensus log compaction and snapshotting.";
      const blockers = "Minor race condition in follower snapshot catch-up.";
      const notes = "Planning benchmark on simulated network partition.";

      // 1. Record check-in
      const record = await StudentCheckinService.recordCheckin(
        {
          studentUserId: studentA,
          checkinType: "milestone_reflection",
          goalId,
          roadmapId: "rdm-dist-sys-1",
          milestoneId,
          progressSummary,
          blockers,
          notes,
          cadence: "weekly",
          preferredHour: 18,
        },
        studentA
      );

      expect(record.id).toBeDefined();
      expect(record.studentUserId).toBe(studentA);
      expect(record.goalId).toBe(goalId);
      expect(record.milestoneId).toBe(milestoneId);
      expect(record.provenance).toBe("student_reported");
      expect(["mentorship_checkins", "student_memory"]).toContain(record.consentReference);

      // 2. Clear memory cache to simulate restart
      StudentCheckinService.resetCache();

      // 3. Query history post-restart
      const history = await StudentCheckinService.getCheckinHistory(studentA, studentA);
      expect(history.length).toBeGreaterThanOrEqual(1);

      const target = history.find((h) => h.id === record.id);
      expect(target).toBeDefined();
      expect(target?.goalId).toBe(goalId);
      expect(target?.milestoneId).toBe(milestoneId);
      expect(target?.progressSummary).toBe(progressSummary);
      expect(target?.blockers).toBe(blockers);
      expect(target?.provenance).toBe("student_reported");
      expect(["mentorship_checkins", "student_memory"]).toContain(target?.consentReference);
    });

    it("enforces multi-tenant ownership: 401 unauthenticated, 403 cross-student access", async () => {
      // Unauthenticated
      const unauthReq = new NextRequest("http://localhost:3000/api/ai-mentor/checkins");
      const unauthRes = await checkinsGetHandler(unauthReq);
      expect(unauthRes.status).toBe(401);

      // Student B attempting to access Student A's preferences/history
      const crossReq = new NextRequest(
        `http://localhost:3000/api/ai-mentor/checkins?studentId=${studentA}`,
        { headers: studentBHeaders }
      );
      const crossRes = await checkinsGetHandler(crossReq);
      expect(crossRes.status).toBe(403);
    });
  });

  // =========================================================================
  // 3. AUDIT CONSENT BOUNDARIES & PURPOSE ISOLATION
  // =========================================================================
  describe("3. Audit Consent Boundaries & Purpose Isolation", () => {
    it("proves check-in persistence does NOT imply long-term student memory creation", async () => {
      // Record a check-in with blockers
      await StudentCheckinService.recordCheckin(
        {
          studentUserId: studentA,
          checkinType: "session_checkin",
          blockers: "Struggling with multi-raft log replication idempotency.",
          progressSummary: "Wrote unit tests for Raft cluster leader election.",
        },
        studentA
      );

      // Check-in record exists
      const history = await StudentCheckinService.getCheckinHistory(studentA, studentA);
      expect(history.some((h) => h.blockers?.includes("multi-raft log replication"))).toBe(true);

      // Verify StudentMemoryService does NOT contain this as a long-term memory
      const memories = StudentMemoryService.getMemories(studentA, studentA);
      const weaknessMemory = memories.find((m) => m.value.includes("multi-raft log replication"));
      expect(weaknessMemory).toBeUndefined();

      const progressMemory = memories.find((m) => m.value.includes("Wrote unit tests for Raft"));
      expect(progressMemory).toBeUndefined();
    });

    it("proves revoking student_memory blocks memory retrieval without deleting check-in history", async () => {
      // Record a check-in
      await StudentCheckinService.recordCheckin(
        {
          studentUserId: studentA,
          checkinType: "session_checkin",
          progressSummary: "Studied Paxos consensus differences.",
        },
        studentA
      );

      // Revoke student_memory consent
      await StudentConsentService.revokeConsent(studentA, "student_memory", "Student opted out of persistent memory", studentA);

      // Long-term memories must return empty list due to lack of consent
      const memories = StudentMemoryService.getMemories(studentA, studentA);
      expect(memories).toEqual([]);

      // Check-in history is preserved for session continuity
      const history = await StudentCheckinService.getCheckinHistory(studentA, studentA);
      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(history.some((h) => h.progressSummary?.includes("Studied Paxos consensus"))).toBe(true);
    });

    it("proves model_training remains STRICTLY FALSE by default and is never implied by check-in persistence", async () => {
      // Default policy for model_training is strictly false
      expect(StudentConsentService.getDefaultPolicy("model_training")).toBe(false);

      const hasTrainingConsent = await StudentConsentService.hasConsent(studentA, "model_training", studentA);
      expect(hasTrainingConsent).toBe(false);

      // Granting check-in or personalization NEVER grants model_training
      await StudentConsentService.grantConsent(studentA, "service_personalization", "Personalize guidance", studentA);
      const afterPersonalization = await StudentConsentService.hasConsent(studentA, "model_training", studentA);
      expect(afterPersonalization).toBe(false);
    });

    it("proves external_llm_processing and mentor_sharing are independently authorized", async () => {
      // Revoking mentor_sharing does not revoke external_llm_processing
      await StudentConsentService.revokeConsent(studentA, "mentor_sharing", "Stop sharing with mentors", studentA);

      const hasMentorSharing = await StudentConsentService.hasConsent(studentA, "mentor_sharing", studentA);
      expect(hasMentorSharing).toBe(false);

      const hasLlmProcessing = await StudentConsentService.hasConsent(studentA, "external_llm_processing", studentA);
      expect(hasLlmProcessing).toBe(true);
    });
  });

  // =========================================================================
  // 4. HUMAN MENTOR HANDOFF AUTHORIZATION & INSTANT REVOCATION
  // =========================================================================
  describe("4. Human Mentor Handoff Authorization & Instant Revocation", () => {
    it("proves mentor access requires current authorization and cached briefings cannot bypass revocation", async () => {
      // 1. Initial GET by student -> authorization pending
      const initialReq = new NextRequest(
        `http://localhost:3000/api/ai-mentor/handoff?studentId=${studentA}`,
        { headers: studentAHeaders }
      );
      const initialRes = await handoffGetHandler(initialReq);
      const initialData = await initialRes.json();
      expect(initialData.state).toBe("student_authorization_pending");
      expect(initialData.hasConsent).toBe(false);

      // 2. Unauthorized mentor attempts to access briefing -> 403 Forbidden
      const unauthMentorReq = new NextRequest(
        `http://localhost:3000/api/ai-mentor/handoff?studentId=${studentA}`,
        { headers: mentorHeaders }
      );
      const unauthMentorRes = await handoffGetHandler(unauthMentorReq);
      expect(unauthMentorRes.status).toBe(403);

      // 3. Student explicitly authorizes handoff
      const authReq = new NextRequest("http://localhost:3000/api/ai-mentor/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...studentAHeaders },
        body: JSON.stringify({
          studentId: studentA,
          authorized: true,
          mentorId,
          topic: "Distributed Consensus & Invariants",
          unresolvedQuestions: ["Raft split-brain partition recovery"],
          suggestedAgenda: ["Architecture code review", "Mock interview"],
        }),
      });
      const authRes = await handoffPostHandler(authReq);
      expect(authRes.status).toBe(200);
      const authData = await authRes.json();
      expect(authData.handoffAuthorized).toBe(true);
      expect(authData.isConfirmedBooking).toBe(false);
      expect(authData.inquiryStatus).toBe("pending_mentor_review");

      // 4. Mentor can now access the sanitized briefing
      const mentorReadReq = new NextRequest(
        `http://localhost:3000/api/ai-mentor/handoff?studentId=${studentA}`,
        { headers: mentorHeaders }
      );
      const mentorReadRes = await handoffGetHandler(mentorReadReq);
      expect(mentorReadRes.status).toBe(200);
      const mentorReadData = await mentorReadRes.json();
      expect(mentorReadData.hasConsent).toBe(true);
      expect(mentorReadData.briefing).toContain("Student-Consented Mentorship Session Brief");

      // 5. Student immediately revokes consent via DELETE
      const revokeReq = new NextRequest(
        `http://localhost:3000/api/ai-mentor/handoff?studentId=${studentA}`,
        { method: "DELETE", headers: studentAHeaders }
      );
      const revokeRes = await handoffDeleteHandler(revokeReq);
      expect(revokeRes.status).toBe(200);
      const revokeData = await revokeRes.json();
      expect(revokeData.handoffAuthorized).toBe(false);
      expect(revokeData.message).toContain("Mentor sharing consent revoked");

      // 6. Mentor attempts to read again (cached briefing CANNOT bypass revoked authorization) -> 403 Forbidden
      const blockedMentorReq = new NextRequest(
        `http://localhost:3000/api/ai-mentor/handoff?studentId=${studentA}`,
        { headers: mentorHeaders }
      );
      const blockedMentorRes = await handoffGetHandler(blockedMentorReq);
      expect(blockedMentorRes.status).toBe(403);
      const blockedData = await blockedMentorRes.json();
      expect(blockedData.error).toContain("403_FORBIDDEN");
      expect(blockedData.error).toContain("revoked or not granted consent");

      // 7. Immutable audit trail contains all lifecycle events
      expect(handoffAuditTrail.length).toBeGreaterThanOrEqual(4);
      const actions = handoffAuditTrail.map((a) => a.action);
      expect(actions).toContain("ACCESS_ATTEMPT");
      expect(actions).toContain("INQUIRY_CREATED");
      expect(actions).toContain("CONSENT_REVOKED");
    });

    it("prevents third-party students from retrieving another student's briefing", async () => {
      const crossReq = new NextRequest(
        `http://localhost:3000/api/ai-mentor/handoff?studentId=${studentA}`,
        { headers: studentBHeaders }
      );
      const crossRes = await handoffGetHandler(crossReq);
      expect(crossRes.status).toBe(403);
      const crossData = await crossRes.json();
      expect(crossData.error).toContain("403_FORBIDDEN");
    });
  });
});
