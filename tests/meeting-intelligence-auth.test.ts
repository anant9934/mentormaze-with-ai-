/**
 * MentorMaze Meeting Intelligence Security & Authorization Test Suite
 * Validates fail-closed feature gating, server-side authentication, DB booking ownership,
 * confidential notes scoping, consent gating, and atomic transcript operations.
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextRequest } from "next/server";
import { GET as sessionGet, POST as sessionPost } from "@/app/api/meeting-intelligence/session/route";
import { GET as transcriptGet, POST as transcriptPost, DELETE as transcriptDelete } from "@/app/api/meeting-intelligence/transcript/route";
import { GET as reportGet, POST as reportPost } from "@/app/api/meeting-intelligence/report/route";
import { GET as notesGet, POST as notesPost } from "@/app/api/meeting-intelligence/notes/route";
import { POST as translatePost } from "@/app/api/meeting-intelligence/translate/route";
import { StudentConsentService } from "@/lib/ai-mentor/student-consent-service";

describe("Meeting Intelligence Security & Server Authorization", () => {
  let studentAId: string;
  let studentBId: string;
  let mentorUserId: string;
  let otherMentorUserId: string;
  let mentorProfileId: string;
  let otherMentorProfileId: string;
  let adminUserId: string;

  let tokenStudentA: string;
  let tokenStudentB: string;
  let tokenMentor: string;
  let tokenOtherMentor: string;
  let tokenAdmin: string;

  let bookingIdA: string;
  let bookingIdB: string;

  beforeAll(async () => {
    await initializeDatabaseSchema();
    const db = getDb();

    // 1. Clean test sessions
    await db.execute(sql`DELETE FROM user_sessions WHERE user_agent = 'mi-auth-test-suite';`);

    const pwdHash = await bcrypt.hash("testPassword123", 10);

    // 2. Insert test users with UUIDs
    const userRes: any = await db.execute(sql`
      INSERT INTO users (email, password_hash, display_name, role, account_status)
      VALUES 
        ('student_a_mi@example.com', ${pwdHash}, 'Student A', 'student', 'active'),
        ('student_b_mi@example.com', ${pwdHash}, 'Student B', 'student', 'active'),
        ('mentor_mi@example.com', ${pwdHash}, 'Mentor Primary', 'mentor', 'active'),
        ('other_mentor_mi@example.com', ${pwdHash}, 'Mentor Other', 'mentor', 'active'),
        ('admin_mi@example.com', ${pwdHash}, 'Security Admin', 'admin', 'active')
      RETURNING id, email;
    `);

    const users = userRes.rows || userRes;
    for (const u of users) {
      if (u.email === "student_a_mi@example.com") studentAId = u.id;
      if (u.email === "student_b_mi@example.com") studentBId = u.id;
      if (u.email === "mentor_mi@example.com") mentorUserId = u.id;
      if (u.email === "other_mentor_mi@example.com") otherMentorUserId = u.id;
      if (u.email === "admin_mi@example.com") adminUserId = u.id;
    }

    // 3. Insert mentor profiles
    const mpRes: any = await db.execute(sql`
      INSERT INTO mentor_profiles (user_id, headline, bio, organization, "current_role", verification_status)
      VALUES 
        (${mentorUserId}, 'Staff Eng @ Google', 'Expert Mentor', 'Google', 'Staff Engineer', 'approved'),
        (${otherMentorUserId}, 'Principal Eng @ Meta', 'Expert Mentor 2', 'Meta', 'Principal Engineer', 'approved')
      RETURNING id, user_id;
    `);

    const mps = mpRes.rows || mpRes;
    for (const mp of mps) {
      if (mp.user_id === mentorUserId) mentorProfileId = mp.id;
      if (mp.user_id === otherMentorUserId) otherMentorProfileId = mp.id;
    }

    // 4. Create active sessions
    const createSession = async (userId: string): Promise<string> => {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await db.execute(sql`
        INSERT INTO user_sessions (user_id, token, expires_at, user_agent, ip_address)
        VALUES (${userId}, ${hashedToken}, ${expires.toISOString()}, 'mi-auth-test-suite', '127.0.0.1');
      `);
      return rawToken;
    };

    tokenStudentA = await createSession(studentAId);
    tokenStudentB = await createSession(studentBId);
    tokenMentor = await createSession(mentorUserId);
    tokenOtherMentor = await createSession(otherMentorUserId);
    tokenAdmin = await createSession(adminUserId);

    // 5. Create test bookings
    const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const futureEnd = new Date(Date.now() + 25 * 60 * 60 * 1000);

    const bRes: any = await db.execute(sql`
      INSERT INTO bookings (student_user_id, mentor_profile_id, service_type, start_time_utc, end_time_utc, status, price_inr, amount_paise, payment_status)
      VALUES 
        (${studentAId}, ${mentorProfileId}, '1on1_mentorship', ${futureStart.toISOString()}, ${futureEnd.toISOString()}, 'confirmed', 299, 29900, 'paid'),
        (${studentBId}, ${otherMentorProfileId}, '1on1_mentorship', ${futureStart.toISOString()}, ${futureEnd.toISOString()}, 'confirmed', 299, 29900, 'paid')
      RETURNING id, student_user_id;
    `);

    const bookings = bRes.rows || bRes;
    for (const b of bookings) {
      if (b.student_user_id === studentAId) bookingIdA = b.id;
      if (b.student_user_id === studentBId) bookingIdB = b.id;
    }
  });

  afterAll(async () => {
    delete process.env.ENABLE_MEETING_INTELLIGENCE;
  });

  // ==============================================================
  // P0 — 1. SERVER-SIDE FEATURE GATE
  // ==============================================================
  describe("Server-Side Feature Gate (Fail-Closed Default)", () => {
    beforeEach(() => {
      // Feature gate is disabled by default
      delete process.env.ENABLE_MEETING_INTELLIGENCE;
    });

    it("rejects session API requests with 503 when feature gate is disabled", async () => {
      const req = new NextRequest(`http://localhost:3000/api/meeting-intelligence/session?bookingId=${bookingIdA}`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      const res = await sessionGet(req);
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.code).toBe("MEETING_INTELLIGENCE_DISABLED");
    });

    it("rejects transcript API requests with 503 when feature gate is disabled", async () => {
      const req = new NextRequest(`http://localhost:3000/api/meeting-intelligence/transcript?bookingId=${bookingIdA}`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      const res = await transcriptGet(req);
      expect(res.status).toBe(503);
    });

    it("rejects report API requests with 503 when feature gate is disabled", async () => {
      const req = new NextRequest(`http://localhost:3000/api/meeting-intelligence/report?bookingId=${bookingIdA}`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      const res = await reportGet(req);
      expect(res.status).toBe(503);
    });

    it("rejects notes API requests with 503 when feature gate is disabled", async () => {
      const req = new NextRequest(`http://localhost:3000/api/meeting-intelligence/notes?bookingId=${bookingIdA}`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      const res = await notesGet(req);
      expect(res.status).toBe(503);
    });

    it("rejects translation API requests with 503 when feature gate is disabled", async () => {
      const req = new NextRequest("http://localhost:3000/api/meeting-intelligence/translate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenStudentA}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: "Hello" }),
      });
      const res = await translatePost(req);
      expect(res.status).toBe(503);
    });
  });

  // ==============================================================
  // P0 — 2. SERVER-SIDE AUTHENTICATION & AUTHORIZATION
  // ==============================================================
  describe("Server-Side Endpoint Authorization (Enabled Gate)", () => {
    beforeAll(() => {
      process.env.ENABLE_MEETING_INTELLIGENCE = "true";
    });

    // 1. Anonymous Requests (401)
    it("returns 401 Unauthorized for anonymous requests without session", async () => {
      const req = new NextRequest(`http://localhost:3000/api/meeting-intelligence/session?bookingId=${bookingIdA}`);
      const res = await sessionGet(req);
      expect(res.status).toBe(401);
    });

    // 2. Cross-Booking / Unauthorized Student (403)
    it("returns 403 Forbidden when Student B tries to access Student A booking session", async () => {
      const req = new NextRequest(`http://localhost:3000/api/meeting-intelligence/session?bookingId=${bookingIdA}`, {
        headers: { Authorization: `Bearer ${tokenStudentB}` },
      });
      const res = await sessionGet(req);
      expect(res.status).toBe(403);
    });

    // 3. Unassigned Mentor (403)
    it("returns 403 Forbidden when unassigned Mentor Other tries to access Booking A", async () => {
      const req = new NextRequest(`http://localhost:3000/api/meeting-intelligence/transcript?bookingId=${bookingIdA}`, {
        headers: { Authorization: `Bearer ${tokenOtherMentor}` },
      });
      const res = await transcriptGet(req);
      expect(res.status).toBe(403);
    });

    // 4. Forged Client Role Parameters Rejected
    it("rejects forged client role query parameter (?role=admin) from unauthorized student", async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/meeting-intelligence/session?bookingId=${bookingIdA}&role=admin`,
        { headers: { Authorization: `Bearer ${tokenStudentB}` } }
      );
      const res = await sessionGet(req);
      expect(res.status).toBe(403);
    });

    // 5. Non-Existent Booking (404)
    it("returns 404 Not Found for non-existent booking ID", async () => {
      const fakeBookingId = "00000000-0000-0000-0000-000000000099";
      const req = new NextRequest(`http://localhost:3000/api/meeting-intelligence/session?bookingId=${fakeBookingId}`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      const res = await sessionGet(req);
      expect(res.status).toBe(404);
    });

    // 6. Authorized Participant Access
    it("permits authorized student and assigned mentor to view their own booking session", async () => {
      const reqStudent = new NextRequest(`http://localhost:3000/api/meeting-intelligence/session?bookingId=${bookingIdA}`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      const resStudent = await sessionGet(reqStudent);
      expect(resStudent.status).toBe(200);

      const reqMentor = new NextRequest(`http://localhost:3000/api/meeting-intelligence/session?bookingId=${bookingIdA}`, {
        headers: { Authorization: `Bearer ${tokenMentor}` },
      });
      const resMentor = await sessionGet(reqMentor);
      expect(resMentor.status).toBe(200);
    });
  });

  // ==============================================================
  // P0 — 2 & P1 — 8. CONSENT GATING & ATOMIC CAPTURE
  // ==============================================================
  describe("Participant Consent Gating for Capture Start", () => {
    beforeAll(() => {
      process.env.ENABLE_MEETING_INTELLIGENCE = "true";
    });

    it("rejects starting audio capture if student consent is missing (CONSENT_REQUIRED)", async () => {
      // Ensure student A does not have consent
      await StudentConsentService.revokeConsent(studentAId, "student_memory");

      const req = new NextRequest("http://localhost:3000/api/meeting-intelligence/session", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenStudentA}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: bookingIdA,
          action: "start",
        }),
      });

      const res = await sessionPost(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("CONSENT_REQUIRED");
    });

    it("allows starting audio capture when student consent is granted", async () => {
      await StudentConsentService.grantConsent(studentAId, "student_memory", "Auth test grant", studentAId);

      const req = new NextRequest("http://localhost:3000/api/meeting-intelligence/session", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenStudentA}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: bookingIdA,
          action: "start",
        }),
      });

      const res = await sessionPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(["capturing", "not_live_verified"]).toContain(json.status);
    });
  });

  // ==============================================================
  // P0 — 2. CONFIDENTIALITY & REPORT REDACTION
  // ==============================================================
  describe("Confidentiality Enforcement & Scoped Redaction", () => {
    beforeAll(async () => {
      process.env.ENABLE_MEETING_INTELLIGENCE = "true";
      const db = getDb();

      // Seed a test report for Booking A with private mentor notes
      const mockReportData = {
        id: `rep-${bookingIdA}`,
        bookingId: bookingIdA,
        sessionTitle: "DSA & System Design Mentorship",
        sessionType: "1-on-1 Mentorship Session",
        studentUserId: studentAId,
        studentName: "Student A",
        mentorUserId: mentorUserId,
        mentorName: "Mentor Primary",
        startTimeUtc: new Date().toISOString(),
        endTimeUtc: new Date().toISOString(),
        durationMinutes: 45,
        studentReportedChallenges: [],
        topicsDiscussed: [],
        mentorGuidanceAndExplanations: [],
        decisionsMade: [],
        actionItems: [],
        agreedMilestones: [],
        unresolvedQuestions: [],
        nextSessionAgenda: [],
        verifiedResourcesRecommended: [],
        executiveSummary: "Summary of discussion.",
        mentorPrivateFeedback: "CONFIDENTIAL NOTE: Student needs to improve dynamic programming recurrence speed.",
        reviewStatus: "pending_review",
        injectedIntoAstrion: false,
        syncedToTathastu: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.execute(sql`
        INSERT INTO mentorship_intelligence_reports (
          id, booking_id, student_user_id, mentor_profile_id,
          report_json, report_markdown, review_status, updated_at
        ) VALUES (
          gen_random_uuid(),
          ${bookingIdA}::uuid,
          ${studentAId}::uuid,
          ${mentorProfileId}::uuid,
          ${JSON.stringify(mockReportData)}::jsonb,
          '# Report Markdown',
          'pending_review',
          now()
        )
        ON CONFLICT (booking_id) DO UPDATE SET
          report_json = EXCLUDED.report_json,
          updated_at = now();
      `);
    });

    it("strictly strips mentorPrivateFeedback when the booked student requests report", async () => {
      const req = new NextRequest(`http://localhost:3000/api/meeting-intelligence/report?bookingId=${bookingIdA}`, {
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      });
      const res = await reportGet(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.report.mentorPrivateFeedback).toBeUndefined();
    });

    it("includes mentorPrivateFeedback when assigned mentor requests report", async () => {
      const req = new NextRequest(`http://localhost:3000/api/meeting-intelligence/report?bookingId=${bookingIdA}`, {
        headers: { Authorization: `Bearer ${tokenMentor}` },
      });
      const res = await reportGet(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.report.mentorPrivateFeedback).toContain("CONFIDENTIAL NOTE");
    });

    it("includes mentorPrivateFeedback when administrator requests report", async () => {
      const req = new NextRequest(`http://localhost:3000/api/meeting-intelligence/report?bookingId=${bookingIdA}`, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      const res = await reportGet(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.report.mentorPrivateFeedback).toContain("CONFIDENTIAL NOTE");
    });

    it("rejects unauthorized student from redacting transcript lines on another booking", async () => {
      const req = new NextRequest("http://localhost:3000/api/meeting-intelligence/transcript", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${tokenStudentB}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: bookingIdA,
          lineIndices: [1],
        }),
      });

      const res = await transcriptDelete(req);
      expect(res.status).toBe(403);
    });

    it("allows the booked student to redact transcript lines on their booking", async () => {
      const req = new NextRequest("http://localhost:3000/api/meeting-intelligence/transcript", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${tokenStudentA}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: bookingIdA,
          lineIndices: [1],
          reason: "student_redaction_test",
        }),
      });

      const res = await transcriptDelete(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  // ==============================================================
  // TRANSLATION ENDPOINT AUTHENTICATION
  // ==============================================================
  describe("Translation Endpoint Authentication", () => {
    beforeAll(() => {
      process.env.ENABLE_MEETING_INTELLIGENCE = "true";
    });

    it("rejects anonymous calls to /api/meeting-intelligence/translate with 401", async () => {
      const req = new NextRequest("http://localhost:3000/api/meeting-intelligence/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Hello world" }),
      });
      const res = await translatePost(req);
      expect(res.status).toBe(401);
    });

    it("permits authenticated users to call translate", async () => {
      const req = new NextRequest("http://localhost:3000/api/meeting-intelligence/translate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenStudentA}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: "Dynamic programming memoization" }),
      });
      const res = await translatePost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });
});
