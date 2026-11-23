import { describe, it, expect, beforeAll } from "vitest";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextRequest } from "next/server";

// Handlers under test
import { POST as mentorDashboardPostHandler } from "@/app/api/mentor/dashboard/route";
import { PUT as mentorAvailabilityPutHandler } from "@/app/api/mentor/availability/route";
import { POST as mentorApplicationsPostHandler } from "@/app/api/mentor/applications/route";
import { GET as messagesGetHandler, POST as messagesPostHandler } from "@/app/api/messages/route";
import { POST as webhookPostHandler } from "@/app/api/payments/webhook/route";
import { POST as refundPostHandler } from "@/app/api/payments/refund/route";
import { createBookingInDb } from "@/lib/db/booking-service";
import { paymentGateway } from "@/lib/payments/adapter";

describe("Phase 2.2: Booking Concurrency, Payment Integrity & Lifecycle Suite", () => {
  let studentAId: string;
  let studentBId: string;
  let mentorUserId: string;
  let otherMentorUserId: string;
  let adminUserId: string;

  let mentorProfileId: string;
  let otherMentorProfileId: string;

  let sessionTokenStudentA: string;
  let sessionTokenStudentB: string;
  let sessionTokenMentor: string;
  let sessionTokenOtherMentor: string;
  let sessionTokenAdmin: string;

  const makeAuthRequest = (
    url: string,
    options: {
      method?: string;
      token?: string;
      body?: any;
      headers?: Record<string, string>;
    } = {}
  ): NextRequest => {
    const headers: Record<string, string> = { ...(options.headers || {}) };
    if (options.token) {
      headers["authorization"] = `Bearer ${options.token}`;
      headers["cookie"] = `mm_session_token=${options.token}`;
    }
    if (options.body) {
      headers["content-type"] = "application/json";
    }

    return new NextRequest(url, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  };

  beforeAll(async () => {
    await initializeDatabaseSchema();
    const db = getDb();

    // 1. Clean test sessions
    await db.execute(sql`DELETE FROM user_sessions WHERE user_agent = 'phase2-2-concurrency-suite';`);

    const pwdHash = await bcrypt.hash("password123", 10);

    // 2. Insert test users
    const userInsertResult: any = await db.execute(sql`
      INSERT INTO users (email, password_hash, display_name, role, account_status)
      VALUES 
        ('p22_student_a@example.com', ${pwdHash}, 'Student A', 'student', 'active'),
        ('p22_student_b@example.com', ${pwdHash}, 'Student B', 'student', 'active'),
        ('p22_mentor_main@example.com', ${pwdHash}, 'Mentor Main', 'mentor', 'active'),
        ('p22_mentor_peer@example.com', ${pwdHash}, 'Mentor Peer', 'mentor', 'active'),
        ('p22_admin@example.com', ${pwdHash}, 'Admin User', 'admin', 'active')
      RETURNING id, email;
    `);

    const usersList = userInsertResult.rows || userInsertResult;
    for (const u of usersList) {
      if (u.email === "p22_student_a@example.com") studentAId = u.id;
      if (u.email === "p22_student_b@example.com") studentBId = u.id;
      if (u.email === "p22_mentor_main@example.com") mentorUserId = u.id;
      if (u.email === "p22_mentor_peer@example.com") otherMentorUserId = u.id;
      if (u.email === "p22_admin@example.com") adminUserId = u.id;
    }

    // 3. Insert approved mentor profiles
    const mpResult: any = await db.execute(sql`
      INSERT INTO mentor_profiles (
        user_id, headline, bio, organization, "current_role", years_of_experience,
        verification_status, rating, total_sessions, total_mentees, is_accepting_bookings
      ) VALUES 
        (${mentorUserId}, 'Staff Engineer', 'High concurrency specialist', 'Google', 'Staff Engineer', 8, 'approved', 5.0, 100, 250, true),
        (${otherMentorUserId}, 'Principal Architect', 'Cloud architectures', 'Microsoft', 'Architect', 10, 'approved', 4.9, 80, 180, true)
      RETURNING id, user_id;
    `);

    const mpList = mpResult.rows || mpResult;
    for (const mp of mpList) {
      if (mp.user_id === mentorUserId) mentorProfileId = mp.id;
      if (mp.user_id === otherMentorUserId) otherMentorProfileId = mp.id;
    }

    // 4. Create active sessions for each user
    const createSession = async (userId: string): Promise<string> => {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await db.execute(sql`
        INSERT INTO user_sessions (user_id, token, expires_at, user_agent, ip_address)
        VALUES (${userId}, ${hashedToken}, ${expires.toISOString()}, 'phase2-2-concurrency-suite', '127.0.0.1');
      `);
      return rawToken;
    };

    sessionTokenStudentA = await createSession(studentAId);
    sessionTokenStudentB = await createSession(studentBId);
    sessionTokenMentor = await createSession(mentorUserId);
    sessionTokenOtherMentor = await createSession(otherMentorUserId);
    sessionTokenAdmin = await createSession(adminUserId);
  });

  // =========================================================================
  // 1. DATABASE-LEVEL BOOKING CONCURRENCY & TRANSACTION ISOLATION
  // =========================================================================
  describe("1. Database-Level Booking Concurrency", () => {
    it("1.1 Two concurrent requests attempting to claim overlapping booking slots: exactly one succeeds", async () => {
      const db = getDb();
      const slotStart = new Date(Date.now() + 72 * 60 * 60 * 1000);
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

      // Student A and Student B concurrently attempt to book the exact same slot
      const [resA, resB] = await Promise.all([
        createBookingInDb({
          studentUserId: studentAId,
          mentorProfileId,
          serviceType: "1on1_mentorship",
          sessionDurationMinutes: 60,
          startTimeUtc: slotStart.toISOString(),
          endTimeUtc: slotEnd.toISOString(),
          userTimezone: "Asia/Kolkata",
          priceInr: 500,
        }),
        createBookingInDb({
          studentUserId: studentBId,
          mentorProfileId,
          serviceType: "1on1_mentorship",
          sessionDurationMinutes: 60,
          startTimeUtc: slotStart.toISOString(),
          endTimeUtc: slotEnd.toISOString(),
          userTimezone: "Asia/Kolkata",
          priceInr: 500,
        }),
      ]);

      // Assert mutual exclusion: exactly one success, exactly one failure
      const successes = [resA, resB].filter((r) => r.success);
      const failures = [resA, resB].filter((r) => !r.success);

      expect(successes.length).toBe(1);
      expect(failures.length).toBe(1);
      expect(failures[0].error).toContain("Slot reservation collision");

      // Verify database state: exactly ONE confirmed booking exists for that interval
      const dbBookings: any = await db.execute(sql`
        SELECT id, student_user_id, status FROM bookings
        WHERE mentor_profile_id = ${mentorProfileId}
          AND start_time_utc = ${slotStart.toISOString()}
          AND status = 'confirmed';
      `);
      const rows = dbBookings.rows || dbBookings || [];
      expect(rows.length).toBe(1);
    });

    it("1.2 Two concurrent accept requests for the same booking: idempotent, exactly one state transition", async () => {
      const db = getDb();
      const start = new Date(Date.now() + 96 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      const bRes: any = await db.execute(sql`
        INSERT INTO bookings (
          student_user_id, mentor_profile_id, service_type, session_duration_minutes,
          start_time_utc, end_time_utc, status, price_inr, student_discussion_points
        ) VALUES (
          ${studentAId}, ${mentorProfileId}, '1on1_mentorship', 60,
          ${start.toISOString()}, ${end.toISOString()}, 'pending', 299,
          'Concurrency test: double accept'
        )
        RETURNING id;
      `);
      const bookingId = (bRes.rows?.[0] || bRes?.[0]).id;

      // Launch 2 concurrent accept requests
      const [res1, res2] = await Promise.all([
        mentorDashboardPostHandler(
          makeAuthRequest("http://localhost:3000/api/mentor/dashboard", {
            method: "POST",
            token: sessionTokenMentor,
            body: { action: "accept", bookingId },
          })
        ),
        mentorDashboardPostHandler(
          makeAuthRequest("http://localhost:3000/api/mentor/dashboard", {
            method: "POST",
            token: sessionTokenMentor,
            body: { action: "accept", bookingId },
          })
        ),
      ]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);

      // Verify final persisted state
      const finalBooking: any = await db.execute(sql`
        SELECT status FROM bookings WHERE id = ${bookingId};
      `);
      expect((finalBooking.rows?.[0] || finalBooking?.[0]).status).toBe("confirmed");

      // Verify booking_events: exactly one transition_to_confirmed event
      const events: any = await db.execute(sql`
        SELECT event_type FROM booking_events WHERE booking_id = ${bookingId} AND event_type = 'transition_to_confirmed';
      `);
      const evRows = events.rows || events || [];
      expect(evRows.length).toBe(1);
    });

    it("1.3 Concurrent accept and decline of the same booking: serializes cleanly to one winner", async () => {
      const db = getDb();
      const start = new Date(Date.now() + 120 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      const bRes: any = await db.execute(sql`
        INSERT INTO bookings (
          student_user_id, mentor_profile_id, service_type, session_duration_minutes,
          start_time_utc, end_time_utc, status, price_inr, student_discussion_points
        ) VALUES (
          ${studentAId}, ${mentorProfileId}, '1on1_mentorship', 60,
          ${start.toISOString()}, ${end.toISOString()}, 'pending', 299,
          'Race: accept vs decline'
        )
        RETURNING id;
      `);
      const bookingId = (bRes.rows?.[0] || bRes?.[0]).id;

      // Fire accept and decline simultaneously
      const [acceptRes, declineRes] = await Promise.all([
        mentorDashboardPostHandler(
          makeAuthRequest("http://localhost:3000/api/mentor/dashboard", {
            method: "POST",
            token: sessionTokenMentor,
            body: { action: "accept", bookingId },
          })
        ),
        mentorDashboardPostHandler(
          makeAuthRequest("http://localhost:3000/api/mentor/dashboard", {
            method: "POST",
            token: sessionTokenMentor,
            body: { action: "decline", bookingId, reason: "Declining due to schedule conflict" },
          })
        ),
      ]);

      // One must succeed (200) and the other must be rejected (409) due to invalid transition from updated state
      const statuses = [acceptRes.status, declineRes.status];
      expect(statuses).toContain(200);
      expect(statuses).toContain(409);

      // Verify the final database state is strictly either 'confirmed' or 'cancelled'
      const finalBooking: any = await db.execute(sql`
        SELECT status FROM bookings WHERE id = ${bookingId};
      `);
      const finalStatus = (finalBooking.rows?.[0] || finalBooking?.[0]).status;
      expect(["confirmed", "cancelled"]).toContain(finalStatus);
    });

    it("1.4 Concurrent availability modification and booking acceptance: row lock on mentor profile prevents race", async () => {
      const db = getDb();
      const start = new Date(Date.now() + 144 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      const bRes: any = await db.execute(sql`
        INSERT INTO bookings (
          student_user_id, mentor_profile_id, service_type, session_duration_minutes,
          start_time_utc, end_time_utc, status, price_inr, student_discussion_points
        ) VALUES (
          ${studentAId}, ${mentorProfileId}, '1on1_mentorship', 60,
          ${start.toISOString()}, ${end.toISOString()}, 'pending', 299,
          'Race: availability update vs accept'
        )
        RETURNING id;
      `);
      const bookingId = (bRes.rows?.[0] || bRes?.[0]).id;

      // Concurrent availability update and accept
      const [availRes, acceptRes] = await Promise.all([
        mentorAvailabilityPutHandler(
          makeAuthRequest("http://localhost:3000/api/mentor/availability", {
            method: "PUT",
            token: sessionTokenMentor,
            body: {
              settings: { bufferTimeMinutes: 20 },
              rules: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
                dayOfWeek: day,
                isActive: true,
                windows: [{ startTime: "09:00", endTime: "22:00" }],
              })),
            },
          })
        ),
        mentorDashboardPostHandler(
          makeAuthRequest("http://localhost:3000/api/mentor/dashboard", {
            method: "POST",
            token: sessionTokenMentor,
            body: { action: "accept", bookingId },
          })
        ),
      ]);

      expect(availRes.status).toBe(200);
      expect(acceptRes.status).toBe(200);

      // Booking is confirmed
      const bCheck: any = await db.execute(sql`SELECT status FROM bookings WHERE id = ${bookingId};`);
      expect((bCheck.rows?.[0] || bCheck?.[0]).status).toBe("confirmed");
    });

    it("1.5 Retry after unsuccessful transaction: client can recover and successfully execute alternative valid action", async () => {
      const db = getDb();
      const start = new Date(Date.now() + 150 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      const bRes: any = await db.execute(sql`
        INSERT INTO bookings (
          student_user_id, mentor_profile_id, service_type, session_duration_minutes,
          start_time_utc, end_time_utc, status, price_inr, student_discussion_points
        ) VALUES (
          ${studentAId}, ${mentorProfileId}, '1on1_mentorship', 60,
          ${start.toISOString()}, ${end.toISOString()}, 'pending', 299,
          'Test retry recovery'
        )
        RETURNING id;
      `);
      const bookingId = (bRes.rows?.[0] || bRes?.[0]).id;

      // 1. Invalid action fails with 400
      const invalidRes = await mentorDashboardPostHandler(
        makeAuthRequest("http://localhost:3000/api/mentor/dashboard", {
          method: "POST",
          token: sessionTokenMentor,
          body: { action: "invalid_action", bookingId },
        })
      );
      expect(invalidRes.status).toBe(400);

      // Verify booking remains in 'pending' status without corrupting transaction state
      const checkPending: any = await db.execute(sql`SELECT status FROM bookings WHERE id = ${bookingId};`);
      expect((checkPending.rows?.[0] || checkPending?.[0]).status).toBe("pending");

      // 2. Client retries with valid 'accept' action
      const retryRes = await mentorDashboardPostHandler(
        makeAuthRequest("http://localhost:3000/api/mentor/dashboard", {
          method: "POST",
          token: sessionTokenMentor,
          body: { action: "accept", bookingId },
        })
      );
      expect(retryRes.status).toBe(200);

      const checkConfirmed: any = await db.execute(sql`SELECT status FROM bookings WHERE id = ${bookingId};`);
      expect((checkConfirmed.rows?.[0] || checkConfirmed?.[0]).status).toBe("confirmed");
    });

    it("1.6 Duplicate request delivery produces exactly one state transition, one booking_event, and one outbox_event", async () => {
      const db = getDb();
      const start = new Date(Date.now() + 160 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      const bRes: any = await db.execute(sql`
        INSERT INTO bookings (
          student_user_id, mentor_profile_id, service_type, session_duration_minutes,
          start_time_utc, end_time_utc, status, price_inr, student_discussion_points
        ) VALUES (
          ${studentAId}, ${mentorProfileId}, '1on1_mentorship', 60,
          ${start.toISOString()}, ${end.toISOString()}, 'pending', 299,
          'Test duplicate delivery event counts'
        )
        RETURNING id;
      `);
      const bookingId = (bRes.rows?.[0] || bRes?.[0]).id;

      // Deliver identical accept request 3 times consecutively
      for (let i = 0; i < 3; i++) {
        const res = await mentorDashboardPostHandler(
          makeAuthRequest("http://localhost:3000/api/mentor/dashboard", {
            method: "POST",
            token: sessionTokenMentor,
            body: { action: "accept", bookingId },
          })
        );
        expect(res.status).toBe(200);
      }

      // Final status is confirmed
      const bCheck: any = await db.execute(sql`SELECT status FROM bookings WHERE id = ${bookingId};`);
      expect((bCheck.rows?.[0] || bCheck?.[0]).status).toBe("confirmed");

      // Exactly ONE transition_to_confirmed event
      const events: any = await db.execute(sql`
        SELECT id FROM booking_events WHERE booking_id = ${bookingId} AND event_type = 'transition_to_confirmed';
      `);
      expect((events.rows || events || []).length).toBe(1);

      // Exactly ONE outbox event for booking.confirmed
      const outbox: any = await db.execute(sql`
        SELECT id FROM outbox_events WHERE event_type = 'booking.confirmed' AND payload->>'bookingId' = ${bookingId};
      `);
      expect((outbox.rows || outbox || []).length).toBe(1);
    });
  });

  // =========================================================================
  // 2. REFUND AND LEDGER INTEGRITY
  // =========================================================================
  describe("2. Refund and Ledger Integrity", () => {
    it("2.1 Declining a PAID booking triggers gateway refund and updates ledger accurately with provider ID", async () => {
      const db = getDb();
      const start = new Date(Date.now() + 168 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      const bRes: any = await db.execute(sql`
        INSERT INTO bookings (
          student_user_id, mentor_profile_id, service_type, session_duration_minutes,
          start_time_utc, end_time_utc, status, payment_status, price_inr, amount_paise
        ) VALUES (
          ${studentAId}, ${mentorProfileId}, '1on1_mentorship', 60,
          ${start.toISOString()}, ${end.toISOString()}, 'pending', 'paid', 499, 49900
        )
        RETURNING id;
      `);
      const bookingId = (bRes.rows?.[0] || bRes?.[0]).id;

      // Insert original ledger transaction
      await db.execute(sql`
        INSERT INTO ledger_transactions (
          booking_id, student_user_id, mentor_profile_id, gross_amount_inr,
          platform_commission_percent, platform_fee_inr, mentor_payable_inr, status, payment_provider
        ) VALUES (
          ${bookingId}, ${studentAId}, ${mentorProfileId}, 499, 15.0, 75, 424, 'paid', 'cashfree'
        );
      `);

      // Mentor declines the paid booking
      const res = await mentorDashboardPostHandler(
        makeAuthRequest("http://localhost:3000/api/mentor/dashboard", {
          method: "POST",
          token: sessionTokenMentor,
          body: { action: "decline", bookingId, reason: "Emergency surgery" },
        })
      );

      expect(res.status).toBe(200);

      // Verify separate states: Booking is cancelled, payment is refunded
      const bCheck: any = await db.execute(sql`
        SELECT status, payment_status, cancellation_reason FROM bookings WHERE id = ${bookingId};
      `);
      const bRow = bCheck.rows?.[0] || bCheck?.[0];
      expect(bRow.status).toBe("cancelled");
      expect(bRow.payment_status).toBe("refunded");
      expect(bRow.cancellation_reason).toBe("Emergency surgery");

      // Verify ledger transaction status was updated with provider refund ID and refund amount
      const ltCheck: any = await db.execute(sql`
        SELECT status, refund_amount_inr, refund_reason, provider_payment_id FROM ledger_transactions WHERE booking_id = ${bookingId};
      `);
      const ltRow = ltCheck.rows?.[0] || ltCheck?.[0];
      expect(ltRow.status).toBe("refunded");
      expect(ltRow.refund_amount_inr).toBe(499);
      expect(ltRow.provider_payment_id).toBeDefined();

      // Verify booking_events logged 'refund_initiated'
      const evCheck: any = await db.execute(sql`
        SELECT event_type FROM booking_events WHERE booking_id = ${bookingId} AND event_type = 'refund_initiated';
      `);
      expect((evCheck.rows || evCheck || []).length).toBeGreaterThanOrEqual(1);
    });

    it("2.2 Declining an UNPAID / free booking cancels booking and voids ledger without claiming refunded", async () => {
      const db = getDb();
      const start = new Date(Date.now() + 192 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      const bRes: any = await db.execute(sql`
        INSERT INTO bookings (
          student_user_id, mentor_profile_id, service_type, session_duration_minutes,
          start_time_utc, end_time_utc, status, payment_status, price_inr, amount_paise
        ) VALUES (
          ${studentBId}, ${mentorProfileId}, '1on1_mentorship', 60,
          ${start.toISOString()}, ${end.toISOString()}, 'pending', 'pending', 0, 0
        )
        RETURNING id;
      `);
      const bookingId = (bRes.rows?.[0] || bRes?.[0]).id;

      await db.execute(sql`
        INSERT INTO ledger_transactions (
          booking_id, student_user_id, mentor_profile_id, gross_amount_inr,
          platform_commission_percent, platform_fee_inr, mentor_payable_inr, status, payment_provider
        ) VALUES (
          ${bookingId}, ${studentBId}, ${mentorProfileId}, 0, 0, 0, 0, 'pending', 'free'
        );
      `);

      const res = await mentorDashboardPostHandler(
        makeAuthRequest("http://localhost:3000/api/mentor/dashboard", {
          method: "POST",
          token: sessionTokenMentor,
          body: { action: "decline", bookingId, reason: "Topic out of scope" },
        })
      );

      expect(res.status).toBe(200);

      // Verify payment status is 'cancelled' (NOT 'refunded' since no funds were collected)
      const bCheck: any = await db.execute(sql`
        SELECT status, payment_status FROM bookings WHERE id = ${bookingId};
      `);
      const bRow = bCheck.rows?.[0] || bCheck?.[0];
      expect(bRow.status).toBe("cancelled");
      expect(bRow.payment_status).not.toBe("refunded");

      const ltCheck: any = await db.execute(sql`
        SELECT status FROM ledger_transactions WHERE booking_id = ${bookingId};
      `);
      const ltRow = ltCheck.rows?.[0] || ltCheck?.[0];
      expect(ltRow.status).toBe("cancelled");
    });

    it("2.3 Duplicate webhook events are handled idempotently without duplicate ledger entries", async () => {
      const db = getDb();
      const start = new Date(Date.now() + 216 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      const bRes: any = await db.execute(sql`
        INSERT INTO bookings (
          student_user_id, mentor_profile_id, service_type, session_duration_minutes,
          start_time_utc, end_time_utc, status, payment_status, price_inr, amount_paise
        ) VALUES (
          ${studentAId}, ${mentorProfileId}, '1on1_mentorship', 60,
          ${start.toISOString()}, ${end.toISOString()}, 'pending', 'pending', 399, 39900
        )
        RETURNING id;
      `);
      const bookingId = (bRes.rows?.[0] || bRes?.[0]).id;

      const orderId = `order_cf_${bookingId}`;
      const timestamp = Date.now().toString();
      const webhookPayload = JSON.stringify({
        event_id: `evt_idempotency_${bookingId}`,
        data: {
          order: { order_id: orderId, order_amount: 399, order_currency: "INR" },
          payment: { cf_payment_id: `pay_${bookingId}`, payment_status: "SUCCESS" },
        },
      });

      // First webhook delivery
      const req1 = new NextRequest("http://localhost:3000/api/payments/webhook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-webhook-signature": "test_valid_signature",
          "x-webhook-timestamp": timestamp,
        },
        body: webhookPayload,
      });

      const res1 = await webhookPostHandler(req1);
      expect(res1.status).toBe(200);

      // Second (duplicate) webhook delivery
      const req2 = new NextRequest("http://localhost:3000/api/payments/webhook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-webhook-signature": "test_valid_signature",
          "x-webhook-timestamp": timestamp,
        },
        body: webhookPayload,
      });

      const res2 = await webhookPostHandler(req2);
      expect(res2.status).toBe(200);
      const data2 = await res2.json();
      expect(data2.status).toBe("already_processed");
    });
  });

  // =========================================================================
  // 3. AVAILABILITY OVERRIDE INTEGRITY & AUDIT TRAILS
  // =========================================================================
  describe("3. Availability Override Integrity & Audit Trails", () => {
    it("3.1 Admin override generates audit event in booking_events and outbox_events without silent orphaning", async () => {
      const db = getDb();
      const start = new Date(Date.now() + 240 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const dayOfWeek = start.getUTCDay();

      // Insert confirmed booking on dayOfWeek
      const bRes: any = await db.execute(sql`
        INSERT INTO bookings (
          student_user_id, mentor_profile_id, service_type, session_duration_minutes,
          start_time_utc, end_time_utc, status, price_inr
        ) VALUES (
          ${studentAId}, ${mentorProfileId}, '1on1_mentorship', 60,
          ${start.toISOString()}, ${end.toISOString()}, 'confirmed', 299
        )
        RETURNING id;
      `);
      const bookingId = (bRes.rows?.[0] || bRes?.[0]).id;

      // Administrator invokes forceOverrideConflicts: true deactivating dayOfWeek
      const adminReq = makeAuthRequest(`http://localhost:3000/api/mentor/availability?mentorProfileId=${mentorProfileId}`, {
        method: "PUT",
        token: sessionTokenAdmin,
        body: {
          forceOverrideConflicts: true,
          settings: { bufferTimeMinutes: 15 },
          rules: [], // Deactivates all days
        },
      });

      const res = await mentorAvailabilityPutHandler(adminReq);
      expect(res.status).toBe(200);

      // Verify booking was NOT silently cancelled or orphaned; remains 'confirmed'
      const bCheck: any = await db.execute(sql`SELECT status FROM bookings WHERE id = ${bookingId};`);
      expect((bCheck.rows?.[0] || bCheck?.[0]).status).toBe("confirmed");

      // Verify immutable audit trail in booking_events
      const auditCheck: any = await db.execute(sql`
        SELECT event_type, actor_role FROM booking_events
        WHERE booking_id = ${bookingId} AND event_type = 'admin_availability_override';
      `);
      const auditRows = auditCheck.rows || auditCheck || [];
      expect(auditRows.length).toBeGreaterThanOrEqual(1);
      expect(auditRows[0].actor_role).toBe("admin");

      // Verify notification in outbox_events
      const outboxCheck: any = await db.execute(sql`
        SELECT id FROM outbox_events WHERE event_type = 'availability.admin_override_conflict';
      `);
      expect((outboxCheck.rows || outboxCheck || []).length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // 4. APPLICATION & MESSAGING POLICY INTEGRITY
  // =========================================================================
  describe("4. Application & Messaging Policy Integrity", () => {
    it("4.1 An approved mentor cannot be silently downgraded by a duplicate application submission", async () => {
      const db = getDb();

      // Verify mentor is approved
      const mpCheck: any = await db.execute(sql`SELECT verification_status FROM mentor_profiles WHERE id = ${mentorProfileId};`);
      expect((mpCheck.rows?.[0] || mpCheck?.[0]).verification_status).toBe("approved");

      // Mentor submits application form again
      const req = makeAuthRequest("http://localhost:3000/api/mentor/applications", {
        method: "POST",
        token: sessionTokenMentor,
        body: {
          fullName: "Mentor Main",
          currentRole: "VP of Engineering",
          organization: "Google",
          domain: "Software Engineering",
          yearsExperience: 10,
          skills: ["System Design", "Leadership"],
          linkedinUrl: "https://linkedin.com/in/mentor-main",
        },
      });

      const res = await mentorApplicationsPostHandler(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.status).toBe("approved");

      // Verify database verification_status remains strictly 'approved' (NOT downgraded to 'submitted')
      const mpAfter: any = await db.execute(sql`SELECT verification_status FROM mentor_profiles WHERE id = ${mentorProfileId};`);
      expect((mpAfter.rows?.[0] || mpAfter?.[0]).verification_status).toBe("approved");
    });

    it("4.2 Peer mentor messaging is rejected under mentorship platform policy (403)", async () => {
      // Mentor Main attempts to start conversation with Mentor Peer
      const req = makeAuthRequest(`http://localhost:3000/api/messages?mentorId=${otherMentorProfileId}`, {
        token: sessionTokenMentor,
      });

      const res = await messagesGetHandler(req);
      expect(res.status).toBe(403);

      const data = await res.json();
      expect(data.error).toContain("Peer mentor messaging is not permitted");
    });
  });
});
