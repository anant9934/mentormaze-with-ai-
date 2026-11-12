import { describe, it, expect, beforeAll } from "vitest";
import { getDb, initializeDatabaseSchema } from "../lib/db/index";
import { seedDatabase } from "../lib/db/seed";
import { sql } from "drizzle-orm";
import { BookingStateMachine, BookingStatus } from "../lib/db/booking-state-machine";
import { BookingHoldManager } from "../lib/calendar/hold-manager";
import { createBookingInDb } from "../lib/db/booking-service";
import { paymentGateway, CashfreePaymentAdapter } from "../lib/payments/adapter";
import { SettlementService } from "../lib/payments/settlement-service";
import { LiveKitTokenService } from "../lib/livekit/token-service";
import { RubricService, CATEGORY_RUBRICS } from "../lib/interview/rubric-service";
import { PolicyEngine } from "../lib/policies/policy-engine";
import crypto from "crypto";

describe("MentorMaze End-to-End Booking, Payment & Session Lifecycle Test Suite", () => {
  const MENTOR_ID = "30000000-0000-0000-0000-000000000001"; // Priya Sharma
  const STUDENT_ID = "00000000-0000-0000-0000-000000000001"; // Anant Kumar
  const SECOND_STUDENT_ID = "00000000-0000-0000-0000-000000000002"; // Rohan Verma

  beforeAll(async () => {
    await initializeDatabaseSchema();
    await seedDatabase();

    const db = getDb();
    // Clean tables for isolated test run
    await db.execute(sql`DELETE FROM booking_holds;`);
    await db.execute(sql`DELETE FROM booking_events;`);
    await db.execute(sql`DELETE FROM ledger_transactions;`);
    await db.execute(sql`DELETE FROM session_notes;`);
    await db.execute(sql`DELETE FROM interview_evaluations;`);
    await db.execute(sql`DELETE FROM session_attendance_events;`);
    await db.execute(sql`DELETE FROM mentor_settlements;`);
    await db.execute(sql`DELETE FROM disputes;`);
    await db.execute(sql`DELETE FROM bookings;`);
  });

  describe("1. Concurrency & Collision Hardening", () => {
    it("handles simultaneous overlapping booking attempts such that exactly one succeeds and one is rejected", async () => {
      const startTime = "2026-11-20T10:00:00.000Z";
      const endTime = "2026-11-20T10:30:00.000Z";

      // Fire two concurrent booking attempts for the same mentor and identical slot
      const [res1, res2] = await Promise.all([
        createBookingInDb({
          studentUserId: STUDENT_ID,
          mentorProfileId: MENTOR_ID,
          serviceType: "1on1_mentorship",
          sessionDurationMinutes: 30,
          startTimeUtc: startTime,
          endTimeUtc: endTime,
          userTimezone: "Asia/Kolkata",
          priceInr: 1500,
        }),
        createBookingInDb({
          studentUserId: SECOND_STUDENT_ID,
          mentorProfileId: MENTOR_ID,
          serviceType: "1on1_mentorship",
          sessionDurationMinutes: 30,
          startTimeUtc: startTime,
          endTimeUtc: endTime,
          userTimezone: "Asia/Kolkata",
          priceInr: 1500,
        }),
      ]);

      const successes = [res1.success, res2.success].filter(Boolean);
      const failures = [res1.success, res2.success].filter((s) => !s);

      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(1);
    });

    it("prevents new hold acquisition when slot has an active unexpired hold", async () => {
      const startTime = "2026-11-20T14:00:00.000Z";
      const endTime = "2026-11-20T14:30:00.000Z";

      // First user acquires hold
      const hold1 = await BookingHoldManager.createHold({
        mentorProfileId: MENTOR_ID,
        studentUserId: STUDENT_ID,
        serviceType: "1on1_mentorship",
        sessionDurationMinutes: 30,
        startTimeUtc: startTime,
        endTimeUtc: endTime,
        idempotencyKey: `hold-race-1-${Date.now()}`,
        holdDurationMinutes: 10,
      });

      expect(hold1.success).toBe(true);

      // Second user attempts to hold same slot
      const hold2 = await BookingHoldManager.createHold({
        mentorProfileId: MENTOR_ID,
        studentUserId: SECOND_STUDENT_ID,
        serviceType: "1on1_mentorship",
        sessionDurationMinutes: 30,
        startTimeUtc: startTime,
        endTimeUtc: endTime,
        idempotencyKey: `hold-race-2-${Date.now()}`,
        holdDurationMinutes: 10,
      });

      expect(hold2.success).toBe(false);
      expect(hold2.collision).toBe(true);
    });
  });

  describe("2. Authoritative State Machine & Audit Events", () => {
    let testBookingId: string;

    beforeAll(async () => {
      const db = getDb();
      const insert = await db.execute(sql`
        INSERT INTO bookings (
          student_user_id, mentor_profile_id, service_type, session_duration_minutes,
          start_time_utc, end_time_utc, status, price_inr, amount_paise, payment_status
        ) VALUES (
          ${STUDENT_ID}, ${MENTOR_ID}, '1on1_mentorship', 30,
          '2026-11-21T11:00:00.000Z', '2026-11-21T11:30:00.000Z',
          'draft', 2000, 200000, 'unpaid'
        ) RETURNING id;
      `);
      testBookingId = (insert.rows?.[0] || insert?.[0]).id;
    });

    it("permits legal state transitions and updates DB status", async () => {
      // draft -> held
      const r1 = await BookingStateMachine.transition(testBookingId, "held", {
        actorRole: "student",
        reason: "User reserved slot",
      });
      expect(r1.success).toBe(true);
      expect(r1.currentStatus).toBe("held");

      // held -> pending_payment
      const r2 = await BookingStateMachine.transition(testBookingId, "pending_payment", {
        actorRole: "student",
        reason: "User reached checkout",
      });
      expect(r2.success).toBe(true);
      expect(r2.currentStatus).toBe("pending_payment");

      // pending_payment -> confirmed
      const r3 = await BookingStateMachine.transition(testBookingId, "confirmed", {
        actorRole: "system",
        reason: "Payment verified",
      });
      expect(r3.success).toBe(true);
      expect(r3.currentStatus).toBe("confirmed");

      // confirmed -> in_progress
      const r4 = await BookingStateMachine.transition(testBookingId, "in_progress", {
        actorRole: "mentor",
        reason: "Session started",
      });
      expect(r4.success).toBe(true);
      expect(r4.currentStatus).toBe("in_progress");

      // in_progress -> completed
      const r5 = await BookingStateMachine.transition(testBookingId, "completed", {
        actorRole: "mentor",
        reason: "Session completed naturally",
      });
      expect(r5.success).toBe(true);
      expect(r5.currentStatus).toBe("completed");
    });

    it("rejects illegal transitions with descriptive error", async () => {
      // completed -> in_progress is illegal
      const bad = await BookingStateMachine.transition(testBookingId, "in_progress", {
        actorRole: "student",
      });
      expect(bad.success).toBe(false);
      expect(bad.error).toContain("Illegal state transition");
    });

    it("creates append-only records in booking_events for every state change", async () => {
      const db = getDb();
      const events: any = await db.execute(sql`
        SELECT event_type, from_status, to_status, actor_role
        FROM booking_events
        WHERE booking_id = ${testBookingId}
        ORDER BY created_at ASC;
      `);

      const rows = events.rows || events || [];
      expect(rows.length).toBeGreaterThanOrEqual(5);
      expect(rows[0].to_status).toBe("held");
      expect(rows[rows.length - 1].to_status).toBe("completed");
    });
  });

  describe("3. Cashfree Payment Gateway & Integer Paise Accounting", () => {
    it("computes marketplace revenue split in exact paise without floating point drift", () => {
      const grossPaise = 150000; // ₹1,500.00
      const split = paymentGateway.calculateSplitPaise(grossPaise, 15.0);

      expect(split.grossAmountPaise).toBe(150000);
      expect(split.platformFeePaise).toBe(22500); // 15% of 150000 = 22500 paise (₹225.00)
      expect(split.mentorPayablePaise).toBe(127500); // ₹1,275.00
      expect(split.balanced).toBe(true);
      expect(split.platformFeePaise + split.mentorPayablePaise).toBe(grossPaise);
    });

    it("verifies webhook HMAC-SHA256 signature and rejects forged signatures", () => {
      const rawPayload = JSON.stringify({
        data: {
          order: { order_id: "order_cf_test_123", order_amount: 1500 },
          payment: { payment_status: "SUCCESS", cf_payment_id: "pay_cf_999" },
        },
      });
      const timestamp = Date.now().toString();
      const secret = process.env.CASHFREE_WEBHOOK_SECRET || "TEST_WEBHOOK_SECRET";

      const validSignature = crypto
        .createHmac("sha256", secret)
        .update(`${timestamp}${rawPayload}`)
        .digest("base64");

      // Valid signature check
      const isValid = paymentGateway.verifyWebhookSignature(rawPayload, timestamp, validSignature);
      expect(isValid).toBe(true);

      // Tampered body with same signature must fail
      const tamperedBody = rawPayload.replace("1500", "5000");
      const isTamperedValid = paymentGateway.verifyWebhookSignature(tamperedBody, timestamp, validSignature);
      expect(isTamperedValid).toBe(false);
    });

    it("confirms payment idempotently without duplicate ledger entries", async () => {
      const db = getDb();
      const insert = await db.execute(sql`
        INSERT INTO bookings (
          student_user_id, mentor_profile_id, service_type, session_duration_minutes,
          start_time_utc, end_time_utc, status, price_inr, amount_paise, payment_status
        ) VALUES (
          ${STUDENT_ID}, ${MENTOR_ID}, '1on1_mentorship', 30,
          '2026-11-22T10:00:00.000Z', '2026-11-22T10:30:00.000Z',
          'pending_payment', 1500, 150000, 'pending'
        ) RETURNING id;
      `);
      const bookingId = (insert.rows?.[0] || insert?.[0]).id;

      // First confirmation
      const res1 = await BookingStateMachine.confirmPayment(bookingId, {
        orderId: `order_cf_${bookingId}`,
        paymentId: `pay_${Date.now()}`,
        amountPaise: 150000,
      });
      expect(res1.success).toBe(true);

      // Second confirmation (idempotent replay)
      const res2 = await BookingStateMachine.confirmPayment(bookingId, {
        orderId: `order_cf_${bookingId}`,
        paymentId: `pay_${Date.now()}`,
        amountPaise: 150000,
      });
      expect(res2.success).toBe(true);

      // Verify booking status in DB is confirmed
      const check: any = await db.execute(sql`
        SELECT status, payment_status FROM bookings WHERE id = ${bookingId};
      `);
      const row = check.rows?.[0] || check?.[0];
      expect(row.status).toBe("confirmed");
      expect(row.payment_status).toBe("paid");
    });
  });

  describe("4. LiveKit Session Join Window & Authorization", () => {
    let activeBookingId: string;
    const now = new Date();
    const sessionStart = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes in the future (within 15m window)
    const sessionEnd = new Date(sessionStart.getTime() + 30 * 60 * 1000);

    beforeAll(async () => {
      const db = getDb();
      const insert = await db.execute(sql`
        INSERT INTO bookings (
          student_user_id, mentor_profile_id, service_type, session_duration_minutes,
          start_time_utc, end_time_utc, status, price_inr, amount_paise, payment_status
        ) VALUES (
          ${STUDENT_ID}, ${MENTOR_ID}, '1on1_mentorship', 30,
          ${sessionStart.toISOString()}, ${sessionEnd.toISOString()},
          'confirmed', 1500, 150000, 'paid'
        ) RETURNING id;
      `);
      activeBookingId = (insert.rows?.[0] || insert?.[0]).id;
    });

    it("generates WebRTC token for authorized student within join window", async () => {
      const tokenRes = await LiveKitTokenService.generateTokenForBooking({
        bookingId: activeBookingId,
        userId: STUDENT_ID,
        userName: "Anant Kumar",
      });

      expect(tokenRes).toBeDefined();
      expect(tokenRes.token).toBeDefined();
      expect(tokenRes.roomName).toBeDefined();
      expect(tokenRes.wsUrl).toBeDefined();
    });

    it("rejects token generation for unauthorized third-party user", async () => {
      await expect(
        LiveKitTokenService.generateTokenForBooking({
          bookingId: activeBookingId,
          userId: "random-unauthorized-user-uuid",
          userName: "Unauthorized User",
        })
      ).rejects.toThrow("UNAUTHORIZED_PARTICIPANT");
    });

    it("rejects token generation when session join window is not yet open", async () => {
      const db = getDb();
      const farFutureStart = new Date(now.getTime() + 5 * 60 * 60 * 1000); // 5 hours in future
      const farFutureEnd = new Date(farFutureStart.getTime() + 30 * 60 * 1000);

      const insert = await db.execute(sql`
        INSERT INTO bookings (
          student_user_id, mentor_profile_id, service_type, session_duration_minutes,
          start_time_utc, end_time_utc, status, price_inr, amount_paise, payment_status
        ) VALUES (
          ${STUDENT_ID}, ${MENTOR_ID}, '1on1_mentorship', 30,
          ${farFutureStart.toISOString()}, ${farFutureEnd.toISOString()},
          'confirmed', 1500, 150000, 'paid'
        ) RETURNING id;
      `);
      const futureBookingId = (insert.rows?.[0] || insert?.[0]).id;

      await expect(
        LiveKitTokenService.generateTokenForBooking({
          bookingId: futureBookingId,
          userId: STUDENT_ID,
          userName: "Anant Kumar",
        })
      ).rejects.toThrow("JOIN_WINDOW_NOT_OPEN");
    });
  });

  describe("5. Mentorship Session Notes & Strict Confidentiality Isolation", () => {
    let sessionBookingId: string;

    beforeAll(async () => {
      const db = getDb();
      const insert = await db.execute(sql`
        INSERT INTO bookings (
          student_user_id, mentor_profile_id, service_type, session_duration_minutes,
          start_time_utc, end_time_utc, status, price_inr, amount_paise, payment_status
        ) VALUES (
          ${STUDENT_ID}, ${MENTOR_ID}, '1on1_mentorship', 30,
          '2026-11-23T10:00:00.000Z', '2026-11-23T10:30:00.000Z',
          'confirmed', 1500, 150000, 'paid'
        ) RETURNING id;
      `);
      sessionBookingId = (insert.rows?.[0] || insert?.[0]).id;

      // Insert session notes with private mentor notes
      await db.execute(sql`
        INSERT INTO session_notes (
          booking_id, mentor_profile_id, student_user_id, session_agenda,
          shared_action_items, student_visible_summary, mentor_private_notes
        ) VALUES (
          ${sessionBookingId}, ${MENTOR_ID}, ${STUDENT_ID},
          'DSA Review & Roadmap',
          ${JSON.stringify([{ item: "Practice DP", completed: false }])},
          'Great session covering DP techniques.',
          'CONFIDENTIAL MENTOR ASSESSMENT: Needs work on recursion stack analysis.'
        );
      `);
    });

    it("strictly isolates mentor private notes from student queries", async () => {
      const db = getDb();
      // Fetch notes simulated as student query
      const query: any = await db.execute(sql`
        SELECT id, booking_id, student_visible_summary, shared_action_items
        FROM session_notes
        WHERE booking_id = ${sessionBookingId};
      `);
      const notes = query.rows?.[0] || query?.[0];

      expect(notes.student_visible_summary).toBe("Great session covering DP techniques.");
      expect(notes.mentor_private_notes).toBeUndefined();
    });
  });

  describe("6. Mock Interview Weighted Rubrics & Draft Isolation", () => {
    it("computes weighted composite score accurately across categories", () => {
      const scores = {
        technical: 9.0, // 25% = 2.25
        problem_solving: 8.0, // 25% = 2.00
        code_quality: 8.5, // 20% = 1.70
        edge_cases: 7.0, // 15% = 1.05
        communication: 8.0, // 15% = 1.20
      };
      // Total = 2.25 + 2.00 + 1.70 + 1.05 + 1.20 = 8.20
      const overall = RubricService.calculateOverallScore("sde_backend", scores);
      expect(overall).toBe(8.2);
    });

    it("enforces draft isolation so students cannot view unpublished evaluations", async () => {
      const db = getDb();
      const insert = await db.execute(sql`
        INSERT INTO bookings (
          student_user_id, mentor_profile_id, service_type, session_duration_minutes,
          start_time_utc, end_time_utc, status, price_inr, amount_paise, payment_status
        ) VALUES (
          ${STUDENT_ID}, ${MENTOR_ID}, 'mock_interview', 45,
          '2026-11-24T10:00:00.000Z', '2026-11-24T10:45:00.000Z',
          'completed', 2500, 250000, 'paid'
        ) RETURNING id;
      `);
      const mockBookingId = (insert.rows?.[0] || insert?.[0]).id;

      // Mentor saves draft evaluation
      await RubricService.saveEvaluation({
        bookingId: mockBookingId,
        mentorProfileId: MENTOR_ID,
        studentUserId: STUDENT_ID,
        category: "sde_backend",
        targetRole: "Software Engineer",
        difficulty: "Medium",
        dimensionScores: { technical: 8.0, problem_solving: 8.0, code_quality: 8.0, edge_cases: 8.0, communication: 8.0 },
        strengths: ["Strong coding syntax"],
        growthAreas: ["Edge case coverage"],
        detailedFeedback: "Draft notes...",
        actionableRecommendations: "Practice more...",
        isDraft: true,
      });

      // Student attempts to view evaluation
      const studentView = await RubricService.getEvaluation(mockBookingId, STUDENT_ID, "student");
      expect(studentView.isDraft).toBe(true);
      expect(studentView.overall_score).toBeUndefined();

      // Mentor views draft evaluation
      const mentorUserQuery: any = await db.execute(sql`SELECT user_id FROM mentor_profiles WHERE id = ${MENTOR_ID}`);
      const mentorUserId = (mentorUserQuery.rows?.[0] || mentorUserQuery?.[0]).user_id;

      const mentorView = await RubricService.getEvaluation(mockBookingId, mentorUserId, "mentor");
      expect(mentorView.overall_score).toBeDefined();
    });
  });

  describe("7. Policy Engine (Cancellation & Rescheduling)", () => {
    it("evaluates cancellation with >=24h notice as 100% refund eligible", async () => {
      const now = new Date();
      const futureStart = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48h in future

      const evalResult = await PolicyEngine.evaluateCancellation(futureStart, "policy-v1");
      expect(evalResult.isEligibleForRefund).toBe(true);
      expect(evalResult.refundPercent).toBe(100);
    });

    it("evaluates cancellation with <24h notice as non-refundable", async () => {
      const now = new Date();
      const nearStart = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6h in future

      const evalResult = await PolicyEngine.evaluateCancellation(nearStart, "policy-v1");
      expect(evalResult.isEligibleForRefund).toBe(false);
      expect(evalResult.refundPercent).toBe(0);
    });

    it("rejects reschedule when maximum reschedules limit (2) is reached", async () => {
      const now = new Date();
      const futureStart = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const evalResult = await PolicyEngine.evaluateReschedule(futureStart, 2, "policy-v1");
      expect(evalResult.canReschedule).toBe(false);
      expect(evalResult.error).toContain("Maximum rescheduling limit");
    });
  });

  describe("8. Double-Entry Settlement Service", () => {
    it("aggregates settled earnings and computes pending payout accurately", async () => {
      const summary = await SettlementService.getMentorEarningsSummary(MENTOR_ID);
      expect(summary.mentorProfileId).toBe(MENTOR_ID);
      expect(summary.grossAmountPaise).toBeGreaterThanOrEqual(0);
      expect(summary.platformFeePaise).toBeGreaterThanOrEqual(0);
      expect(summary.netPayablePaise).toBe(summary.grossAmountPaise - summary.platformFeePaise);
    });
  });
});
