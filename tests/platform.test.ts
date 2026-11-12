import { describe, it, expect, beforeEach } from "vitest";
import { store } from "../lib/data/store";
import { paymentGateway } from "../lib/payments/adapter";
import { checkRole, getSessionUser } from "../lib/auth/session";

describe("MentorMaze Core Platform Engine", () => {
  beforeEach(() => {
    // Verify store is ready
  });

  // ==========================================
  // 1. EXPLAINABLE MATCHING ALGORITHM
  // ==========================================
  describe("Explainable Matching Engine", () => {
    it("returns top 3 approved mentors for an engineering student", () => {
      const recommendations = store.getTopRecommendedMentors("user-student-1");
      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeLessThanOrEqual(3);
      expect(recommendations.length).toBeGreaterThan(0);

      // Best match must be flagged
      expect(recommendations[0].isBestMatch).toBe(true);

      // Verify each match contains data-grounded reasons
      recommendations.forEach((item) => {
        expect(item.matchScore).toBeGreaterThanOrEqual(80);
        expect(item.reasons.length).toBeGreaterThan(0);
        expect(item.mentor.verificationStatus).toBe("approved");
      });
    });

    it("excludes unapproved or suspended mentors from recommendations", () => {
      const recommendations = store.getTopRecommendedMentors("user-student-1");
      const unapprovedMentorIds = store
        .getMentors(false)
        .filter((m) => m.verificationStatus !== "approved")
        .map((m) => m.id);

      recommendations.forEach((r) => {
        expect(unapprovedMentorIds).not.toContain(r.mentor.id);
      });
    });
  });

  // ==========================================
  // 2. CONCURRENCY & DOUBLE-BOOKING PREVENTION
  // ==========================================
  describe("Booking & Scheduling Concurrency", () => {
    it("successfully creates a valid booking and updates ledger", () => {
      const initialLedgerCount = store.getLedger().length;
      const startUtc = "2026-11-25T14:00:00Z";
      const endUtc = "2026-11-25T14:30:00Z";

      const res = store.createBooking({
        studentUserId: "user-student-1",
        mentorProfileId: "mentor-priya",
        serviceType: "1on1_mentorship",
        sessionDurationMinutes: 30,
        startTimeUtc: startUtc,
        endTimeUtc: endUtc,
        userTimezone: "Asia/Kolkata",
        priceInr: 249,
      });

      expect(res.success).toBe(true);
      expect(res.booking).toBeDefined();
      expect(res.booking?.status).toBe("confirmed");

      // Verify ledger entry created with platform commission
      const ledger = store.getLedger();
      expect(ledger.length).toBe(initialLedgerCount + 1);
      const latestTx = ledger[ledger.length - 1];
      expect(latestTx.grossAmountInr).toBe(249);
      expect(latestTx.platformCommissionPercent).toBe(15.0);
      expect(latestTx.platformFeeInr).toBe(Math.round((249 * 15) / 100));
    });

    it("prevents double-booking when overlapping slot is requested", () => {
      const startUtc = "2026-11-26T14:00:00Z";
      const endUtc = "2026-11-26T14:30:00Z";

      // First booking succeeds
      const firstRes = store.createBooking({
        studentUserId: "user-student-1",
        mentorProfileId: "mentor-priya",
        serviceType: "1on1_mentorship",
        sessionDurationMinutes: 30,
        startTimeUtc: startUtc,
        endTimeUtc: endUtc,
        userTimezone: "Asia/Kolkata",
        priceInr: 249,
      });
      expect(firstRes.success).toBe(true);

      // Concurrent second booking on overlapping slot must fail
      const secondRes = store.createBooking({
        studentUserId: "user-student-2",
        mentorProfileId: "mentor-priya",
        serviceType: "1on1_mentorship",
        sessionDurationMinutes: 30,
        startTimeUtc: startUtc,
        endTimeUtc: endUtc,
        userTimezone: "Asia/Kolkata",
        priceInr: 249,
      });

      expect(secondRes.success).toBe(false);
      expect(secondRes.error).toContain("already been booked");
    });

    it("rejects booking attempts for unapproved mentor", () => {
      const res = store.createBooking({
        studentUserId: "user-student-1",
        mentorProfileId: "mentor-rahul", // submitted / unapproved
        serviceType: "1on1_mentorship",
        sessionDurationMinutes: 30,
        startTimeUtc: "2026-11-27T14:00:00Z",
        endTimeUtc: "2026-11-27T14:30:00Z",
        userTimezone: "Asia/Kolkata",
        priceInr: 249,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("not currently approved");
    });
  });

  // ==========================================
  // 3. MENTOR APPLICATION & ADMIN VERIFICATION
  // ==========================================
  describe("Mentor Application & Admin Verification", () => {
    it("submits application in 'submitted' state", () => {
      const newApp = store.submitMentorApplication({
        mentorProfileId: "mentor-test-1",
        mentorName: "Sneha Patel",
        currentRole: "Lead Architect",
        organization: "Amazon",
        identityProofType: "Passport",
        identityProofVerified: true,
        professionalProofType: "Corporate Email",
        professionalProofVerified: true,
        resumeUrl: "/docs/resume.pdf",
        linkedinUrl: "https://linkedin.com/in/sneha-mock",
      });

      expect(newApp.status).toBe("submitted");
      const found = store.getApplications().find((a) => a.id === newApp.id);
      expect(found).toBeDefined();
    });

    it("admin approval transitions mentor to approved and allows bookings", () => {
      const app = store.getApplications().find((a) => a.id === "app-rahul");
      expect(app).toBeDefined();

      const approved = store.verifyMentorApplication("app-rahul", "approve", "Verified by compliance officer.");
      expect(approved).toBe(true);

      const mentor = store.getMentorById("mentor-rahul");
      expect(mentor?.verificationStatus).toBe("approved");
      expect(mentor?.isAcceptingBookings).toBe(true);
    });
  });

  // ==========================================
  // 4. PAYMENTS & WEBHOOKS
  // ==========================================
  describe("Payment Gateway & Webhook Signature", () => {
    it("verifies Cashfree webhook signature correctly in test mode", () => {
      const isValid = paymentGateway.verifyWebhookSignature(
        JSON.stringify({ event: "PAYMENT_SUCCESS" }),
        "1700000000",
        "test_valid_signature"
      );
      expect(isValid).toBe(true);
    });

    it("rejects invalid webhook signatures", () => {
      const isValid = paymentGateway.verifyWebhookSignature(
        JSON.stringify({ event: "PAYMENT_SUCCESS" }),
        "1700000000",
        "fraudulent_signature"
      );
      expect(isValid).toBe(false);
    });
  });

  // ==========================================
  // 5. CHAT & DURABLE MESSAGES
  // ==========================================
  describe("Durable Messaging", () => {
    it("persists 1:1 chat message in durable store", () => {
      const initialCount = store.getMessages("conv-priya-anant").length;
      const msg = store.sendMessage(
        "conv-priya-anant",
        "user-student-1",
        "Looking forward to discussing the microservices project!"
      );

      expect(msg.content).toBe("Looking forward to discussing the microservices project!");
      const updatedMessages = store.getMessages("conv-priya-anant");
      expect(updatedMessages.length).toBe(initialCount + 1);
      expect(updatedMessages[updatedMessages.length - 1].content).toBe(msg.content);
    });
  });

  // ==========================================
  // 6. ROLE-BASED ACCESS CONTROL
  // ==========================================
  describe("RBAC & Permissions", () => {
    it("validates role permissions accurately", () => {
      const student = getSessionUser("user-student-1");
      const admin = getSessionUser("user-admin-1");

      expect(checkRole(student, ["student"])).toBe(true);
      expect(checkRole(student, ["admin"])).toBe(false);

      expect(checkRole(admin, ["admin", "super_admin"])).toBe(true);
      expect(checkRole(admin, ["student"])).toBe(false);
    });
  });
});

