import { describe, it, expect, beforeAll } from "vitest";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  getServerSession,
  requireAuth,
  requireAdmin,
  requireRole,
  verifyBookingOwnership,
  AuthenticatedUser,
} from "@/lib/auth/server-auth";
import { POST as cancelBookingHandler } from "@/app/api/bookings/[id]/cancel/route";
import { POST as rescheduleBookingHandler } from "@/app/api/bookings/[id]/reschedule/route";
import { GET as adminBookingsHandler } from "@/app/api/admin/bookings/route";
import { GET as adminPaymentsHandler } from "@/app/api/admin/payments/route";
import { GET as adminSettlementsHandler } from "@/app/api/admin/settlements/route";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { NextRequest } from "next/server";

describe("Phase 1 Security & Authorization Remediation Test Suite", () => {
  let studentAId: string;
  let studentBId: string;
  let mentorUserId: string;
  let otherMentorUserId: string;
  let mentorProfileId: string;
  let otherMentorProfileId: string;
  let adminUserId: string;
  let suspendedUserId: string;

  let sessionTokenStudentA: string;
  let sessionTokenStudentB: string;
  let sessionTokenMentor: string;
  let sessionTokenOtherMentor: string;
  let sessionTokenAdmin: string;
  let sessionTokenSuspended: string;

  let bookingStudentAId: string;
  let bookingStudentBId: string;

  beforeAll(async () => {
    await initializeDatabaseSchema();
    const db = getDb();

    // 1. Clean test records if present
    await db.execute(sql`DELETE FROM user_sessions WHERE user_agent = 'security-test-suite';`);

    const pwdHash = await bcrypt.hash("securePwd123", 10);

    // 2. Insert test users
    const userInsertResult: any = await db.execute(sql`
      INSERT INTO users (email, password_hash, display_name, role, account_status)
      VALUES 
        ('student_a_sec@example.com', ${pwdHash}, 'Student A', 'student', 'active'),
        ('student_b_sec@example.com', ${pwdHash}, 'Student B', 'student', 'active'),
        ('mentor_user_sec@example.com', ${pwdHash}, 'Mentor Primary', 'mentor', 'active'),
        ('other_mentor_sec@example.com', ${pwdHash}, 'Mentor Other', 'mentor', 'active'),
        ('admin_sec@example.com', ${pwdHash}, 'Security Admin', 'admin', 'active'),
        ('suspended_sec@example.com', ${pwdHash}, 'Suspended User', 'student', 'suspended')
      RETURNING id, email, role;
    `);

    const usersList = userInsertResult.rows || userInsertResult;
    for (const u of usersList) {
      if (u.email === "student_a_sec@example.com") studentAId = u.id;
      if (u.email === "student_b_sec@example.com") studentBId = u.id;
      if (u.email === "mentor_user_sec@example.com") mentorUserId = u.id;
      if (u.email === "other_mentor_sec@example.com") otherMentorUserId = u.id;
      if (u.email === "admin_sec@example.com") adminUserId = u.id;
      if (u.email === "suspended_sec@example.com") suspendedUserId = u.id;
    }

    // 3. Insert mentor profiles ("current_role" is quoted as it is a reserved SQL keyword)
    const mpResult: any = await db.execute(sql`
      INSERT INTO mentor_profiles (user_id, headline, bio, organization, "current_role", verification_status)
      VALUES 
        (${mentorUserId}, 'Senior Eng', 'Expert Mentor', 'TechCorp', 'Staff Engineer', 'approved'),
        (${otherMentorUserId}, 'Lead Eng', 'Expert Mentor 2', 'StartupX', 'Principal Engineer', 'approved')
      RETURNING id, user_id;
    `);

    const mpList = mpResult.rows || mpResult;
    for (const mp of mpList) {
      if (mp.user_id === mentorUserId) mentorProfileId = mp.id;
      if (mp.user_id === otherMentorUserId) otherMentorProfileId = mp.id;
    }

    // 4. Create active sessions in PostgreSQL user_sessions
    const createSession = async (userId: string): Promise<string> => {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
      await db.execute(sql`
        INSERT INTO user_sessions (user_id, token, expires_at, user_agent, ip_address)
        VALUES (${userId}, ${hashedToken}, ${expires.toISOString()}, 'security-test-suite', '127.0.0.1');
      `);
      return rawToken;
    };

    sessionTokenStudentA = await createSession(studentAId);
    sessionTokenStudentB = await createSession(studentBId);
    sessionTokenMentor = await createSession(mentorUserId);
    sessionTokenOtherMentor = await createSession(otherMentorUserId);
    sessionTokenAdmin = await createSession(adminUserId);
    sessionTokenSuspended = await createSession(suspendedUserId);

    // 5. Create test bookings
    const futureStart = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h in future
    const futureEnd = new Date(Date.now() + 49 * 60 * 60 * 1000);

    const bResult: any = await db.execute(sql`
      INSERT INTO bookings (student_user_id, mentor_profile_id, service_type, start_time_utc, end_time_utc, status, price_inr, amount_paise, payment_status)
      VALUES 
        (${studentAId}, ${mentorProfileId}, '1on1_mentorship', ${futureStart.toISOString()}, ${futureEnd.toISOString()}, 'confirmed', 249, 24900, 'paid'),
        (${studentBId}, ${otherMentorProfileId}, '1on1_mentorship', ${futureStart.toISOString()}, ${futureEnd.toISOString()}, 'confirmed', 249, 24900, 'paid')
      RETURNING id, student_user_id;
    `);

    const bList = bResult.rows || bResult;
    for (const b of bList) {
      if (b.student_user_id === studentAId) bookingStudentAId = b.id;
      if (b.student_user_id === studentBId) bookingStudentBId = b.id;
    }
  });

  // ==========================================
  // SECTION 1: AUTHENTICATION MATRIX & HELPERS
  // ==========================================
  describe("1. Centralized Server Authorization Helpers", () => {
    it("returns null for getServerSession when no token or cookie provided", async () => {
      const session = await getServerSession();
      expect(session).toBeNull();
    });

    it("returns 401 errorResponse for requireAuth when unauthenticated", async () => {
      const req = new NextRequest("http://localhost:3000/api/test");
      const auth = await requireAuth(req);
      expect(auth.errorResponse).toBeDefined();
      expect(auth.errorResponse?.status).toBe(401);
    });

    it("successfully authenticates via Bearer header token", async () => {
      const req = new NextRequest("http://localhost:3000/api/test", {
        headers: { authorization: `Bearer ${sessionTokenStudentA}` },
      });
      const auth = await requireAuth(req);
      expect(auth.user).toBeDefined();
      expect(auth.user?.id).toBe(studentAId);
      expect(auth.user?.role).toBe("student");
    });

    it("attaches mentorProfileId when authenticated user is an approved mentor", async () => {
      const req = new NextRequest("http://localhost:3000/api/test", {
        headers: { authorization: `Bearer ${sessionTokenMentor}` },
      });
      const auth = await requireAuth(req);
      expect(auth.user).toBeDefined();
      expect(auth.user?.id).toBe(mentorUserId);
      expect(auth.user?.role).toBe("mentor");
      expect(auth.user?.mentorProfileId).toBe(mentorProfileId);
    });

    it("rejects suspended accounts with 401/null session", async () => {
      const req = new NextRequest("http://localhost:3000/api/test", {
        headers: { authorization: `Bearer ${sessionTokenSuspended}` },
      });
      const auth = await requireAuth(req);
      expect(auth.errorResponse).toBeDefined();
      expect(auth.errorResponse?.status).toBe(401);
    });

    it("rejects non-admin users with 403 in requireAdmin", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/test", {
        headers: { authorization: `Bearer ${sessionTokenStudentA}` },
      });
      const admin = await requireAdmin(req);
      expect(admin.errorResponse).toBeDefined();
      expect(admin.errorResponse?.status).toBe(403);
    });

    it("authorizes verified administrators in requireAdmin", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/test", {
        headers: { authorization: `Bearer ${sessionTokenAdmin}` },
      });
      const admin = await requireAdmin(req);
      expect(admin.user).toBeDefined();
      expect(admin.user?.id).toBe(adminUserId);
      expect(admin.user?.role).toBe("admin");
    });
  });

  // ==========================================
  // SECTION 2: ADMINISTRATIVE APIS HARDENING
  // ==========================================
  describe("2. Protected Administrative Endpoints", () => {
    it("rejects unauthenticated requests to /api/admin/bookings with 401", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/bookings");
      const res = await adminBookingsHandler(req);
      expect(res.status).toBe(401);
    });

    it("rejects student access to /api/admin/bookings with 403", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/bookings", {
        headers: { authorization: `Bearer ${sessionTokenStudentA}` },
      });
      const res = await adminBookingsHandler(req);
      expect(res.status).toBe(403);
    });

    it("rejects mentor access to /api/admin/payments with 403", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/payments", {
        headers: { authorization: `Bearer ${sessionTokenMentor}` },
      });
      const res = await adminPaymentsHandler(req);
      expect(res.status).toBe(403);
    });

    it("rejects student access to /api/admin/settlements with 403", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/settlements", {
        headers: { authorization: `Bearer ${sessionTokenStudentA}` },
      });
      const res = await adminSettlementsHandler(req);
      expect(res.status).toBe(403);
    });

    it("allows authorized admin access to /api/admin/bookings with 200", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/bookings", {
        headers: { authorization: `Bearer ${sessionTokenAdmin}` },
      });
      const res = await adminBookingsHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.bookings)).toBe(true);
    });

    it("allows authorized admin access to /api/admin/settlements with 200", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/settlements", {
        headers: { authorization: `Bearer ${sessionTokenAdmin}` },
      });
      const res = await adminSettlementsHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  // ==========================================
  // SECTION 3: BOOKING IDOR REMEDIATION
  // ==========================================
  describe("3. Booking Ownership & IDOR Vulnerability Remediation", () => {
    it("rejects unauthenticated cancellation with 401", async () => {
      const req = new NextRequest(`http://localhost:3000/api/bookings/${bookingStudentAId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: "Unauthenticated attempt" }),
      });
      const res = await cancelBookingHandler(req, { params: { id: bookingStudentAId } });
      expect(res.status).toBe(401);
    });

    it("prevents Student B from cancelling Student A's booking (IDOR Attack) with 403", async () => {
      const req = new NextRequest(`http://localhost:3000/api/bookings/${bookingStudentAId}/cancel`, {
        method: "POST",
        headers: { authorization: `Bearer ${sessionTokenStudentB}` },
        body: JSON.stringify({ reason: "Malicious cancellation attempt by another student" }),
      });
      const res = await cancelBookingHandler(req, { params: { id: bookingStudentAId } });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("Forbidden");
    });

    it("prevents Other Mentor from cancelling Student A's booking with 403", async () => {
      const req = new NextRequest(`http://localhost:3000/api/bookings/${bookingStudentAId}/cancel`, {
        method: "POST",
        headers: { authorization: `Bearer ${sessionTokenOtherMentor}` },
        body: JSON.stringify({ reason: "Unassigned mentor cancellation" }),
      });
      const res = await cancelBookingHandler(req, { params: { id: bookingStudentAId } });
      expect(res.status).toBe(403);
    });

    it("allows Student A to cancel their own booking (Legitimate Owner)", async () => {
      const req = new NextRequest(`http://localhost:3000/api/bookings/${bookingStudentAId}/cancel`, {
        method: "POST",
        headers: { authorization: `Bearer ${sessionTokenStudentA}` },
        body: JSON.stringify({ reason: "Legitimate student cancellation" }),
      });
      const res = await cancelBookingHandler(req, { params: { id: bookingStudentAId } });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it("rejects unauthenticated rescheduling with 401", async () => {
      const newStart = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
      const newEnd = new Date(Date.now() + 73 * 60 * 60 * 1000).toISOString();
      const req = new NextRequest(`http://localhost:3000/api/bookings/${bookingStudentBId}/reschedule`, {
        method: "POST",
        body: JSON.stringify({ newStartTimeUtc: newStart, newEndTimeUtc: newEnd }),
      });
      const res = await rescheduleBookingHandler(req, { params: { id: bookingStudentBId } });
      expect(res.status).toBe(401);
    });

    it("prevents Student A from rescheduling Student B's booking (IDOR Attack) with 403", async () => {
      const newStart = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
      const newEnd = new Date(Date.now() + 73 * 60 * 60 * 1000).toISOString();
      const req = new NextRequest(`http://localhost:3000/api/bookings/${bookingStudentBId}/reschedule`, {
        method: "POST",
        headers: { authorization: `Bearer ${sessionTokenStudentA}` },
        body: JSON.stringify({ newStartTimeUtc: newStart, newEndTimeUtc: newEnd }),
      });
      const res = await rescheduleBookingHandler(req, { params: { id: bookingStudentBId } });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("Forbidden");
    });

    it("allows the assigned mentor or student to reschedule their own booking", async () => {
      const newStart = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
      const newEnd = new Date(Date.now() + 73 * 60 * 60 * 1000).toISOString();
      const req = new NextRequest(`http://localhost:3000/api/bookings/${bookingStudentBId}/reschedule`, {
        method: "POST",
        headers: { authorization: `Bearer ${sessionTokenStudentB}` },
        body: JSON.stringify({ newStartTimeUtc: newStart, newEndTimeUtc: newEnd }),
      });
      const res = await rescheduleBookingHandler(req, { params: { id: bookingStudentBId } });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.rescheduleCount).toBe(1);
    });

    it("returns 404 for non-existent booking ID", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000";
      const req = new NextRequest(`http://localhost:3000/api/bookings/${nonExistentId}/cancel`, {
        method: "POST",
        headers: { authorization: `Bearer ${sessionTokenAdmin}` },
        body: JSON.stringify({ reason: "Cancel missing booking" }),
      });
      const res = await cancelBookingHandler(req, { params: { id: nonExistentId } });
      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // SECTION 4: LOGIN SECURITY & PRIVILEGE ESCALATION
  // ==========================================
  describe("4. Login Endpoint & Privilege Escalation Defense", () => {
    it("blocks password bypass when password is omitted", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "student_a_sec@example.com" }), // no password
      });
      const res = await loginHandler(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Password is required");
    });

    it("blocks incorrect password with 401", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "student_a_sec@example.com", password: "wrong_password" }),
      });
      const res = await loginHandler(req);
      expect(res.status).toBe(401);
    });

    it("blocks arbitrary client-supplied admin role provisioning on signup", async () => {
      const newEmail = `hacker_${Date.now()}@example.com`;
      const req = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: newEmail,
          password: "hackerpassword123",
          role: "admin", // Malicious attempt to self-provision admin
        }),
      });
      const res = await loginHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      // Role MUST be downgraded to student, never admin
      expect(json.user.role).toBe("student");
    });

    it("authenticates valid credentials and issues secure HTTP-only cookie", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "student_a_sec@example.com",
          password: "securePwd123",
        }),
      });
      const res = await loginHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.user.email).toBe("student_a_sec@example.com");

      const cookieHeader = res.headers.get("set-cookie");
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader).toContain("mm_session_token");
      expect(cookieHeader).toContain("HttpOnly");
      expect(cookieHeader).toContain("Path=/");
    });
  });
});
