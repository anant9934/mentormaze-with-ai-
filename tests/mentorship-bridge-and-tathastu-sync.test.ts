import { describe, it, expect, beforeAll } from "vitest";
import { MentorshipBridgeService } from "@/lib/mentorship/mentorship-bridge-service";
import { tathastuSyncService } from "@/lib/ai-mentor/integrations/ai-tathastu-sync-service";
import { PermissionAwareContextBuilder } from "@/lib/ai-mentor/permission-aware-context-builder";
import { initializeDatabaseSchema, getDb } from "@/lib/db";
import { users, mentorProfiles, bookings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

describe("Mentorship Intelligence Bridge & AI Tathastu Sync Test Suite", () => {
  const testStudentId = "00000000-0000-4000-a000-000000000001";
  const testMentorUserId = "00000000-0000-4000-a000-000000000002";
  const testMentorProfileId = "00000000-0000-4000-b000-000000000001";
  const testBookingId = "00000000-0000-4000-c000-000000000001";

  beforeAll(async () => {
    await initializeDatabaseSchema();
    const db = await getDb();
    if (db) {
      // Seed test student
      await db
        .insert(users)
        .values({
          id: testStudentId,
          email: "student.test@aitathastu.com",
          displayName: "Ananya Sharma",
          role: "student",
          passwordHash: "test_hash",
        })
        .onConflictDoNothing();

      // Seed test mentor user
      await db
        .insert(users)
        .values({
          id: testMentorUserId,
          email: "mentor.test@microsoft.com",
          displayName: "Vikram Malhotra",
          role: "mentor",
          passwordHash: "test_hash",
        })
        .onConflictDoNothing();

      // Seed mentor profile
      await db
        .insert(mentorProfiles)
        .values({
          id: testMentorProfileId,
          userId: testMentorUserId,
          headline: "Principal Engineer @ Microsoft",
          bio: "12+ years building distributed backend systems.",
          organization: "Microsoft",
          currentRole: "Principal Engineer",
          yearsOfExperience: 12,
          price15MinInr: 149,
          price30MinInr: 249,
          price60MinInr: 449,
          verificationStatus: "approved",
        })
        .onConflictDoNothing();

      // Seed booking
      await db
        .insert(bookings)
        .values({
          id: testBookingId,
          studentUserId: testStudentId,
          mentorProfileId: testMentorProfileId,
          serviceType: "1on1_mentorship",
          status: "confirmed",
          priceInr: 249,
          startTimeUtc: new Date(Date.now() + 86400000),
          endTimeUtc: new Date(Date.now() + 86400000 + 1800000),
          sessionDurationMinutes: 30,
        })
        .onConflictDoNothing();
    }
  });

  describe("1. Mentorship Intelligence Bridge Engine", () => {
    it("generates structured summary with provenance badges across timeframes", async () => {
      const summary7d = await MentorshipBridgeService.generateSummary({
        studentUserId: testStudentId,
        timeframe: "7_days",
      });

      expect(summary7d).toBeDefined();
      expect(summary7d.studentUserId).toBe(testStudentId);
      expect(summary7d.timeframe).toBe("7_days");
      expect(summary7d.studentBackground).toBeDefined();
      expect(summary7d.studentBackground.displayName).toBeTruthy();
      expect(Array.isArray(summary7d.mentoringObjectives)).toBe(true);
      expect(summary7d.mentoringObjectives.length).toBeGreaterThan(0);
      expect(Array.isArray(summary7d.questionsForMentor)).toBe(true);
      expect(summary7d.questionsForMentor.length).toBeGreaterThan(0);

      // Verify provenance tags are valid
      const validProvenances = [
        "student_reported",
        "project_demonstrated",
        "assessment_verified",
        "mentor_recorded",
        "ai_inferred",
        "external_ecosystem",
      ];
      for (const ch of summary7d.currentChallenges) {
        expect(validProvenances).toContain(ch.provenance);
      }
    });

    it("persists and updates draft bridge summaries", async () => {
      const summary = await MentorshipBridgeService.generateSummary({
        studentUserId: testStudentId,
        timeframe: "session",
      });
      summary.status = "draft";
      summary.studentNote = "Draft note for mentor review";
      await MentorshipBridgeService.persistSummary(summary);

      expect(summary.id).toBeDefined();
      expect(summary.status).toBe("draft");
      expect(summary.studentNote).toBe("Draft note for mentor review");

      const updated = await MentorshipBridgeService.updateDraft(summary.id, testStudentId, {
        studentNote: "Updated note with specific questions",
        questionsForMentor: ["How do I design for partition tolerance?"],
      });

      expect(updated.studentNote).toBe("Updated note with specific questions");
      expect(updated.questionsForMentor).toEqual(["How do I design for partition tolerance?"]);
    });

    it("shares summary with authorized mentor and enforces cross-tenant access control", async () => {
      const summary = await MentorshipBridgeService.generateSummary({
        studentUserId: testStudentId,
        timeframe: "7_days",
      });

      const shared = await MentorshipBridgeService.shareWithMentor({
        summaryId: summary.id,
        studentUserId: testStudentId,
        mentorProfileId: testMentorProfileId,
        bookingId: testBookingId,
        studentNote: "Looking forward to our call tomorrow!",
      });

      expect(shared.id).toBeDefined();
      expect(shared.status).toBe("shared");
      expect(shared.mentorProfileId).toBe(testMentorProfileId);

      // Authorized mentor can view briefing
      const mentorBriefing = await MentorshipBridgeService.getMentorIntakeBriefing({
        bookingId: testBookingId,
        mentorUserId: testMentorUserId,
      });

      expect(mentorBriefing).not.toBeNull();
      expect(mentorBriefing?.studentUserId).toBe(testStudentId);
      expect(mentorBriefing?.studentNote).toBe("Looking forward to our call tomorrow!");

      // Unauthorized third party is denied (throws 403_FORBIDDEN)
      await expect(
        MentorshipBridgeService.getMentorIntakeBriefing({
          bookingId: testBookingId,
          mentorUserId: "00000000-0000-4000-a000-000000000099",
        })
      ).rejects.toThrow("403_FORBIDDEN");
    });

    it("allows student to instantly revoke bridge share", async () => {
      const summary = await MentorshipBridgeService.generateSummary({
        studentUserId: testStudentId,
        timeframe: "30_days",
      });

      const shared = await MentorshipBridgeService.shareWithMentor({
        summaryId: summary.id,
        studentUserId: testStudentId,
        mentorProfileId: testMentorProfileId,
        bookingId: testBookingId,
      });

      const revoked = await MentorshipBridgeService.revokeShare(shared.id, testStudentId);
      expect(revoked.status).toBe("revoked");

      // Mentor cannot view revoked briefing (throws 403_FORBIDDEN)
      await expect(
        MentorshipBridgeService.getMentorIntakeBriefing({
          summaryId: shared.id,
          mentorUserId: testMentorUserId,
        })
      ).rejects.toThrow("403_FORBIDDEN");
    });

    it("records mentor post-session feedback and completes closed loop", async () => {
      const feedback = await MentorshipBridgeService.recordPostSessionFeedback({
        bookingId: testBookingId,
        mentorUserId: testMentorUserId,
        sessionSummary: "Productive 1:1 reviewing database sharding and distributed consensus.",
        observedStrengths: ["Strong understanding of Raft algorithm leadership elections"],
        developmentGaps: ["Need more practice on split-brain quorum handling"],
        recommendedActions: ["Implement Raft log replication simulator", "Read Chapter 5 of DDIA"],
        agreedMilestones: ["Complete Raft simulator before next Wednesday"],
      });

      expect(feedback.success).toBe(true);
      expect(feedback.noteId).toBeDefined();

      // Check that ASTRION's PermissionAwareContextBuilder loads the mentor's feedback
      const astrionContext = await PermissionAwareContextBuilder.buildContext(testStudentId, {
        requestingUserId: testStudentId,
      });

      expect(astrionContext.classifiedEvidence.confirmedFacts.some(
        (f) => f.includes("Verified Human Mentor Strength") || f.includes("Human Mentor Recommendation")
      )).toBe(true);
    });

    it("enforces cross-student isolation: Student B cannot generate summary for Student A", async () => {
      const otherStudentId = "00000000-0000-4000-a000-000000000099";
      await expect(
        MentorshipBridgeService.generateSummary({
          studentUserId: testStudentId,
          timeframe: "7_days",
          requestingUserId: otherStudentId,
        })
      ).rejects.toThrow("403_FORBIDDEN");
    });

    it("prevents mentors from mutating original student content", async () => {
      const summary = await MentorshipBridgeService.generateSummary({
        studentUserId: testStudentId,
        timeframe: "session",
      });

      // Mentor attempts to tamper with student's questions/notes
      await expect(
        MentorshipBridgeService.updateDraft(summary.id, testMentorUserId, {
          studentNote: "Tampered note by mentor",
        })
      ).rejects.toThrow("403_FORBIDDEN");
    });

    it("enforces expiration security: expired shares reject mentor briefing access", async () => {
      const summary = await MentorshipBridgeService.generateSummary({
        studentUserId: testStudentId,
        timeframe: "session",
      });

      const shared = await MentorshipBridgeService.shareWithMentor({
        summaryId: summary.id,
        studentUserId: testStudentId,
        mentorProfileId: testMentorProfileId,
        bookingId: testBookingId,
      });

      // Force expiration in the past
      shared.expiresAt = new Date(Date.now() - 3600000).toISOString();
      await MentorshipBridgeService.persistSummary(shared);

      await expect(
        MentorshipBridgeService.getMentorIntakeBriefing({
          summaryId: shared.id,
          mentorUserId: testMentorUserId,
        })
      ).rejects.toThrow("403_FORBIDDEN: Mentorship summary access has expired.");
    });
  });

  describe("2. Two-Way AI Tathastu Synchronization & Security", () => {
    it("reports connector status and operational readiness", async () => {
      const status = await tathastuSyncService.getStatus();
      expect(status.status).toBeDefined();
      expect(status.isConfigured).toBeDefined();
      expect(status.description).toContain("AI Tathastu");
    });

    it("executes two-way synchronization and enforces idempotency", async () => {
      const syncResult1 = await tathastuSyncService.syncTwoWay(testStudentId);
      expect(syncResult1.success).toBe(true);
      expect(syncResult1.studentUserId).toBe(testStudentId);
      expect(syncResult1.outbound.idempotencyKey).toBeTruthy();

      // Second sync in same window reuses idempotency key without creating duplicate outbox records
      const syncResult2 = await tathastuSyncService.syncTwoWay(testStudentId);
      expect(syncResult2.success).toBe(true);
      expect(syncResult2.outbound.idempotencyKey).toBe(syncResult1.outbound.idempotencyKey);
    });

    it("strictly blocks outbound sync when ai_tathastu_sync consent is revoked", async () => {
      // Revoke ai_tathastu_sync consent
      const { StudentConsentService } = await import("@/lib/ai-mentor/student-consent-service");
      await StudentConsentService.revokeConsent(testStudentId, "ai_tathastu_sync", testStudentId);

      const outbound = await tathastuSyncService.syncOutboundMentorshipOutcomes(testStudentId);
      expect(outbound.milestonesExported).toBe(0);
      expect(outbound.mentorNotesExported).toBe(0);
      expect(outbound.details).toContain("blocked: student has not granted or has revoked ai_tathastu_sync consent");

      // Re-grant consent for subsequent operations
      await StudentConsentService.grantConsent(
        testStudentId,
        "ai_tathastu_sync",
        "Re-granted for test cleanup",
        testStudentId
      );
    });

    it("enforces tenant boundary on private AI Tathastu context", async () => {
      const unauthorizedRequester = "00000000-0000-4000-a000-000000000099";
      await expect(
        PermissionAwareContextBuilder.buildContext(testStudentId, {
          requestingUserId: unauthorizedRequester,
        })
      ).rejects.toThrow("403_FORBIDDEN");
    });
  });
});
