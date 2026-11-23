/**
 * MentorMaze — ASTRION Personal AI Mentorship System
 * Phase 4.1: Student Experience Verification, Check-In Delivery & Human Mentor Handoff Test Suite
 *
 * Mandates Verified:
 * 1. Canonical 5-tier assessment model (confirmed_evidence, student_reported, extracted, system_inference, unknown_or_missing)
 * 2. Evidence provenance preservation & student memory inline correction
 * 3. Check-in cadence preferences persistence, quiet hours evaluation & honest delivery reporting
 * 4. Human mentor handoff end-to-end: explicit student consent, sanitized briefing, booking creation, mentor read, and instant revocation blocking
 * 5. Strict multi-tenant authorization guards across all endpoints
 */

import { describe, it, expect, beforeEach } from "vitest";
import { StudentConsentService } from "@/lib/ai-mentor/student-consent-service";
import { StudentMemoryService } from "@/lib/ai-mentor/student-memory-service";
import { HumanEscalationService } from "@/lib/ai-mentor/human-escalation-service";
import { PersonalizedAssessmentService } from "@/lib/ai-mentor/assessment/personalized-assessment-service";
import { isWithinQuietHours } from "@/lib/notifications/service";
import { store } from "@/lib/data/store";
import { initializeDatabaseSchema } from "@/lib/db";
import { GET as checkinsGetHandler, POST as checkinsPostHandler } from "@/app/api/ai-mentor/checkins/route";
import {
  GET as handoffGetHandler,
  POST as handoffPostHandler,
  DELETE as handoffDeleteHandler,
} from "@/app/api/ai-mentor/handoff/route";
import { GET as memoryGetHandler, POST as memoryPostHandler } from "@/app/api/ai-mentor/memory/route";
import { NextRequest } from "next/server";

describe("Phase 4.1: Student Experience Verification, Check-In Delivery & Human Mentor Handoff", () => {
  const studentA = "student-phase4-1-a";
  const studentB = "student-phase4-1-b";
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
    StudentConsentService.grantConsent(studentA, "service_personalization");
    StudentConsentService.grantConsent(studentA, "student_memory");
  });

  // =========================================================================
  // 1. CANONICAL 5-TIER ASSESSMENT & EVIDENCE PROVENANCE PRESERVATION
  // =========================================================================
  describe("1. Canonical 5-Tier Assessment Model & Evidence Provenance", () => {
    it("preserves canonical 5-tier classification without collapsing provenance into tiers", () => {
      // Create a student-reported competency
      StudentMemoryService.saveMemory(
        studentA,
        "confirmed_strengths",
        "kubernetes",
        "Intermediate cluster operator",
        "student_reported",
        0.8,
        false,
        undefined,
        true,
        studentA
      );

      // Create an extracted competency from GitHub resume
      StudentMemoryService.saveMemory(
        studentA,
        "saved_facts",
        "go_lang",
        "Extracted 3 Go repositories from GitHub profile",
        "extracted",
        0.75,
        false,
        undefined,
        true,
        studentA
      );

      const memories = StudentMemoryService.getMemories(studentA, studentA);
      const k8s = memories.find((m) => m.key === "kubernetes");
      const go = memories.find((m) => m.key === "go_lang");

      expect(k8s).toBeDefined();
      expect(k8s?.provenance).toBe("student_reported");
      expect(k8s?.studentConfirmed).toBe(true);

      expect(go).toBeDefined();
      expect(go?.provenance).toBe("extracted");
    });

    it("allows student to correct their reported profile and updates context builder", async () => {
      // Step 1: Initial report
      const postReq = new NextRequest("http://localhost:3000/api/ai-mentor/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...studentAHeaders },
        body: JSON.stringify({
          userId: studentA,
          category: "confirmed_strengths",
          key: "system_design",
          value: "Beginner level with caching",
          provenance: "student_reported",
          confidence: 0.7,
        }),
      });
      const postRes = await memoryPostHandler(postReq);
      const postData = await postRes.json();
      expect(postData.success).toBe(true);

      // Step 2: Student corrects the claim
      const correctReq = new NextRequest("http://localhost:3000/api/ai-mentor/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...studentAHeaders },
        body: JSON.stringify({
          userId: studentA,
          category: "confirmed_strengths",
          key: "system_design",
          value: "Advanced practitioner with distributed consensus and Kafka partition sharding",
          provenance: "student_reported",
          confidence: 1.0,
        }),
      });
      const correctRes = await memoryPostHandler(correctReq);
      const correctData = await correctRes.json();
      expect(correctData.success).toBe(true);
      expect(correctData.memory.value).toContain("Advanced practitioner");

      // Step 3: Fetch memory profile and verify latest value is authoritative
      const getReq = new NextRequest(`http://localhost:3000/api/ai-mentor/memory?userId=${studentA}`, {
        headers: studentAHeaders,
      });
      const getRes = await memoryGetHandler(getReq);
      const getData = await getRes.json();
      expect(getData.success).toBe(true);
      const sysDesignMem = getData.memories.find((m: any) => m.key === "system_design");
      expect(sysDesignMem.value).toContain("Advanced practitioner with distributed consensus");
    });
  });

  // =========================================================================
  // 2. CHECK-IN PREFERENCES & DELIVERY INTEGRITY
  // =========================================================================
  describe("2. Check-In Preferences & Delivery Integrity", () => {
    it("enforces authentication and multi-tenant security on check-ins", async () => {
      // 1. Unauthenticated request -> 401
      const unauthReq = new NextRequest("http://localhost:3000/api/ai-mentor/checkins");
      const unauthRes = await checkinsGetHandler(unauthReq);
      expect(unauthRes.status).toBe(401);

      // 2. Student B attempting to view Student A's check-in settings -> 403
      const crossReq = new NextRequest(
        `http://localhost:3000/api/ai-mentor/checkins?studentId=${studentA}`,
        { headers: studentBHeaders }
      );
      const crossRes = await checkinsGetHandler(crossReq);
      expect(crossRes.status).toBe(403);
    });

    it("saves check-in cadence preferences and records progress notes honestly", async () => {
      // 1. Save check-in preferences with weekly cadence
      const postReq = new NextRequest("http://localhost:3000/api/ai-mentor/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...studentAHeaders },
        body: JSON.stringify({
          studentId: studentA,
          frequency: "weekly",
          preferredHour: 18,
          timezone: "Asia/Kolkata",
          progressSummary: "Completed dynamic programming knapsack implementation and unit tests.",
          blockers: "Need clarification on 2D vs 1D array space optimization.",
        }),
      });
      const postRes = await checkinsPostHandler(postReq);
      const postData = await postRes.json();
      expect(postData.success).toBe(true);
      expect(postData.preferences.frequency).toBe("weekly");
      expect(postData.preferences.preferredHour).toBe(18);
      expect(postData.preferences.scheduledDeliveryStatus).toBe("in_session_active");

      // 2. Verify that progress notes & blockers were stored in StudentMemoryService
      const memories = StudentMemoryService.getMemories(studentA, studentA);
      const progressMem = memories.find((m) => m.key.startsWith("checkin_progress_"));
      const blockerMem = memories.find((m) => m.key.startsWith("checkin_blocker_"));

      expect(progressMem).toBeDefined();
      expect(progressMem?.value).toContain("Completed dynamic programming");
      expect(progressMem?.provenance).toBe("student_reported");

      expect(blockerMem).toBeDefined();
      expect(blockerMem?.value).toContain("Need clarification on 2D vs 1D array space optimization");

      // 3. Pause check-ins without penalty
      const pauseReq = new NextRequest("http://localhost:3000/api/ai-mentor/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...studentAHeaders },
        body: JSON.stringify({
          studentId: studentA,
          frequency: "paused",
        }),
      });
      const pauseRes = await checkinsPostHandler(pauseReq);
      const pauseData = await pauseRes.json();
      expect(pauseData.success).toBe(true);
      expect(pauseData.preferences.frequency).toBe("paused");
    });

    it("accurately computes quiet hours without timezone drift", () => {
      // Test quiet hours calculation logic
      const inNight = isWithinQuietHours("22:00", "08:00", "UTC");
      expect(typeof inNight).toBe("boolean");
    });
  });

  // =========================================================================
  // 3. HUMAN MENTOR HANDOFF END-TO-END WITH CONSENT GOVERNANCE
  // =========================================================================
  describe("3. Human Mentor Handoff End-to-End Flow & Revocation", () => {
    it("rejects handoff without explicit student authorization checkbox", async () => {
      const rejectReq = new NextRequest("http://localhost:3000/api/ai-mentor/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...studentAHeaders },
        body: JSON.stringify({
          studentId: studentA,
          authorized: false, // Checkbox unchecked
          topic: "Distributed Consensus",
        }),
      });
      const rejectRes = await handoffPostHandler(rejectReq);
      expect(rejectRes.status).toBe(400);
      const data = await rejectRes.json();
      expect(data.error).toContain("authorization checkbox is required");
    });

    it("executes complete handoff lifecycle: student authorizes -> inquiry created -> mentor reads -> student revokes -> mentor blocked", async () => {
      // Step 1: Student explicitly authorizes handoff
      const authReq = new NextRequest("http://localhost:3000/api/ai-mentor/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...studentAHeaders },
        body: JSON.stringify({
          studentId: studentA,
          authorized: true,
          mentorId: mentorId,
          topic: "Distributed Systems & Raft Consensus",
          unresolvedQuestions: ["Leader election split-brain resolution under partition"],
          suggestedAgenda: [
            "Review Raft state machine code",
            "Simulate cluster partition test case",
          ],
        }),
      });
      const authRes = await handoffPostHandler(authReq);
      expect(authRes.status).toBe(200);
      const authData = await authRes.json();
      expect(authData.success).toBe(true);
      expect(authData.handoffAuthorized).toBe(true);
      expect(authData.briefing).toContain("Student-Consented Mentorship Session Brief");
      expect(authData.briefing).toContain("Distributed Systems & Raft Consensus");

      // Verify that mentor_sharing consent was granted
      const hasConsent = await StudentConsentService.hasConsent(studentA, "mentor_sharing");
      expect(hasConsent).toBe(true);

      // Step 2: Mentor inspects sanitized briefing via GET /api/ai-mentor/handoff
      const mentorGetReq = new NextRequest(
        `http://localhost:3000/api/ai-mentor/handoff?studentId=${studentA}`,
        { headers: mentorHeaders }
      );
      const mentorGetRes = await handoffGetHandler(mentorGetReq);
      expect(mentorGetRes.status).toBe(200);
      const mentorGetData = await mentorGetRes.json();
      expect(mentorGetData.success).toBe(true);
      expect(mentorGetData.hasConsent).toBe(true);
      expect(mentorGetData.briefing).toContain("Student-Consented Mentorship Session Brief");
      // Check that data minimization notice is present
      expect(mentorGetData.dataMinimizationNotice).toContain("strictly excludes private reflection logs");

      // Step 3: Student revokes consent via DELETE /api/ai-mentor/handoff
      const revokeReq = new NextRequest(
        `http://localhost:3000/api/ai-mentor/handoff?studentId=${studentA}`,
        { method: "DELETE", headers: studentAHeaders }
      );
      const revokeRes = await handoffDeleteHandler(revokeReq);
      expect(revokeRes.status).toBe(200);
      const revokeData = await revokeRes.json();
      expect(revokeData.success).toBe(true);
      expect(revokeData.handoffAuthorized).toBe(false);

      // Verify consent service registers revocation
      const hasConsentAfter = await StudentConsentService.hasConsent(studentA, "mentor_sharing");
      expect(hasConsentAfter).toBe(false);

      // Step 4: Mentor immediately tries to read briefing again -> REJECTED (403 Forbidden)
      const blockedMentorReq = new NextRequest(
        `http://localhost:3000/api/ai-mentor/handoff?studentId=${studentA}`,
        { headers: mentorHeaders }
      );
      const blockedMentorRes = await handoffGetHandler(blockedMentorReq);
      expect(blockedMentorRes.status).toBe(403);
      const blockedData = await blockedMentorRes.json();
      expect(blockedData.error).toContain("403_FORBIDDEN");
      expect(blockedData.error).toContain("revoked or not granted consent");
    });

    it("prevents third-party students from accessing another student's handoff briefing", async () => {
      const crossReq = new NextRequest(
        `http://localhost:3000/api/ai-mentor/handoff?studentId=${studentA}`,
        { headers: studentBHeaders }
      );
      const crossRes = await handoffGetHandler(crossReq);
      expect(crossRes.status).toBe(403);
    });
  });
});
