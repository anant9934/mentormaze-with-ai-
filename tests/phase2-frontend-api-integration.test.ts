import { describe, it, expect, beforeAll } from "vitest";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextRequest } from "next/server";

// Handlers under test
import { GET as mentorsGetHandler } from "@/app/api/mentors/route";
import { GET as mentorDetailGetHandler } from "@/app/api/mentors/[id]/route";
import { GET as studentDashboardGetHandler } from "@/app/api/student/dashboard/route";
import {
  GET as mentorApplicationsGetHandler,
  POST as mentorApplicationsPostHandler,
} from "@/app/api/mentor/applications/route";
import {
  GET as mentorAvailabilityGetHandler,
  PUT as mentorAvailabilityPutHandler,
} from "@/app/api/mentor/availability/route";
import {
  GET as mentorDashboardGetHandler,
  POST as mentorDashboardPostHandler,
} from "@/app/api/mentor/dashboard/route";
import {
  GET as messagesGetHandler,
  POST as messagesPostHandler,
} from "@/app/api/messages/route";

describe("Phase 2: Core Frontend Mock Elimination & Real API Integration Test Suite", () => {
  let studentUserId: string;
  let otherStudentUserId: string;
  let mentorUserId: string;
  let otherMentorUserId: string;
  let adminUserId: string;

  let mentorProfileId: string;
  let otherMentorProfileId: string;
  let submittedMentorProfileId: string;

  let sessionTokenStudent: string;
  let sessionTokenOtherStudent: string;
  let sessionTokenMentor: string;
  let sessionTokenOtherMentor: string;
  let sessionTokenAdmin: string;

  let conversationId: string;
  let testBookingId: string;

  const makeAuthRequest = (
    url: string,
    options: {
      method?: string;
      token?: string;
      body?: any;
    } = {}
  ): NextRequest => {
    const headers: Record<string, string> = {};
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

    // 1. Clean test records
    await db.execute(sql`DELETE FROM user_sessions WHERE user_agent = 'phase2-test-suite';`);

    const pwdHash = await bcrypt.hash("password123", 10);

    // 2. Insert test users
    const userInsertResult: any = await db.execute(sql`
      INSERT INTO users (email, password_hash, display_name, role, account_status)
      VALUES 
        ('p2_student@example.com', ${pwdHash}, 'P2 Student Anant', 'student', 'active'),
        ('p2_other_student@example.com', ${pwdHash}, 'P2 Other Student', 'student', 'active'),
        ('p2_mentor@example.com', ${pwdHash}, 'P2 Mentor Priya', 'mentor', 'active'),
        ('p2_other_mentor@example.com', ${pwdHash}, 'P2 Mentor Rohan', 'mentor', 'active'),
        ('p2_admin@example.com', ${pwdHash}, 'P2 Admin User', 'admin', 'active')
      RETURNING id, email;
    `);

    const usersList = userInsertResult.rows || userInsertResult;
    for (const u of usersList) {
      if (u.email === "p2_student@example.com") studentUserId = u.id;
      if (u.email === "p2_other_student@example.com") otherStudentUserId = u.id;
      if (u.email === "p2_mentor@example.com") mentorUserId = u.id;
      if (u.email === "p2_other_mentor@example.com") otherMentorUserId = u.id;
      if (u.email === "p2_admin@example.com") adminUserId = u.id;
    }

    // 3. Insert student profile and goals for studentUserId
    const spResult: any = await db.execute(sql`
      INSERT INTO student_profiles (user_id, target_role, institution, degree, current_level, bio)
      VALUES (${studentUserId}, 'Software Engineer', 'LPU', 'B.Tech CSE', 'Undergraduate', 'Aspiring distributed systems engineer')
      RETURNING id;
    `);
    const studentProfile = spResult.rows?.[0] || spResult?.[0];

    await db.execute(sql`
      INSERT INTO student_goals (student_profile_id, title, description, category, status, progress_percentage)
      VALUES 
        (${studentProfile.id}, 'Master System Design', 'High scale architectures', 'interview', 'in_progress', 65),
        (${studentProfile.id}, 'Deploy Production Portfolio', 'Full-stack WebSockets app', 'project', 'in_progress', 45);
    `);

    // 4. Insert mentor profiles: 2 approved, 1 submitted
    const mpResult: any = await db.execute(sql`
      INSERT INTO mentor_profiles (user_id, headline, bio, organization, "current_role", years_of_experience, verification_status, rating, total_sessions, total_mentees)
      VALUES 
        (${mentorUserId}, 'Staff Engineer @ Microsoft', '5+ years building Azure cloud', 'Microsoft', 'Staff Engineer', 5, 'approved', 4.95, 150, 400),
        (${otherMentorUserId}, 'Senior Data Scientist @ Google', 'ML algorithms and recommendations', 'Google', 'Data Scientist', 4, 'approved', 4.90, 80, 220)
      RETURNING id, user_id;
    `);

    const mpList = mpResult.rows || mpResult;
    for (const mp of mpList) {
      if (mp.user_id === mentorUserId) mentorProfileId = mp.id;
      if (mp.user_id === otherMentorUserId) otherMentorProfileId = mp.id;
    }

    // Insert mentor expertise
    await db.execute(sql`
      INSERT INTO mentor_expertise (mentor_profile_id, primary_domain, skills, focus_areas)
      VALUES 
        (${mentorProfileId}, 'Software Engineering', '["System Design", "Cloud", "Distributed Systems"]'::jsonb, '["Career Guidance", "Interview Prep"]'::jsonb),
        (${otherMentorProfileId}, 'Data Science', '["Python", "Machine Learning", "PyTorch"]'::jsonb, '["Career Guidance", "Project Review"]'::jsonb);
    `);

    // Insert availability rules for mentorProfileId
    await db.execute(sql`
      INSERT INTO availability_rules (mentor_profile_id, day_of_week, start_time, end_time, is_active)
      VALUES 
        (${mentorProfileId}, 1, '10:00:00', '14:00:00', true),
        (${mentorProfileId}, 3, '14:00:00', '18:00:00', true);
    `);

    // 5. Create active sessions for each user
    const createSession = async (userId: string): Promise<string> => {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await db.execute(sql`
        INSERT INTO user_sessions (user_id, token, expires_at, user_agent, ip_address)
        VALUES (${userId}, ${hashedToken}, ${expires.toISOString()}, 'phase2-test-suite', '127.0.0.1');
      `);
      return rawToken;
    };

    sessionTokenStudent = await createSession(studentUserId);
    sessionTokenOtherStudent = await createSession(otherStudentUserId);
    sessionTokenMentor = await createSession(mentorUserId);
    sessionTokenOtherMentor = await createSession(otherMentorUserId);
    sessionTokenAdmin = await createSession(adminUserId);

    // 6. Insert test booking between studentUserId and mentorProfileId
    const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const futureEnd = new Date(Date.now() + 25 * 60 * 60 * 1000);
    const bookingResult: any = await db.execute(sql`
      INSERT INTO bookings (
        student_user_id, mentor_profile_id, service_type, session_duration_minutes,
        start_time_utc, end_time_utc, status, price_inr, student_discussion_points
      ) VALUES (
        ${studentUserId}, ${mentorProfileId}, '1on1_mentorship', 60,
        ${futureStart.toISOString()}, ${futureEnd.toISOString()}, 'confirmed', 249,
        'Career guidance & system design architecture'
      )
      RETURNING id;
    `);
    testBookingId = (bookingResult.rows?.[0] || bookingResult?.[0]).id;

    // 7. Insert conversation between studentUserId and mentorUserId
    const convResult: any = await db.execute(sql`
      INSERT INTO conversations (student_user_id, mentor_user_id, last_message_text, last_message_at)
      VALUES (${studentUserId}, ${mentorUserId}, 'Hello mentor, looking forward to our session!', now())
      RETURNING id;
    `);
    conversationId = (convResult.rows?.[0] || convResult?.[0]).id;

    await db.execute(sql`
      INSERT INTO messages (conversation_id, sender_user_id, content, is_read)
      VALUES (${conversationId}, ${studentUserId}, 'Hello mentor, looking forward to our session!', false);
    `);
  });

  // =========================================================================
  // AREA 1: APPROVED MENTOR DISCOVERY & PUBLIC PROFILES
  // =========================================================================
  describe("Area 1: Approved Mentor Discovery & Public Profiles", () => {
    it("GET /api/mentors returns 200 and lists only approved mentors", async () => {
      const req = makeAuthRequest("http://localhost:3000/api/mentors");
      const res = await mentorsGetHandler(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.mentors.length).toBeGreaterThanOrEqual(2);

      // Verify no sensitive fields are leaked
      for (const m of data.mentors) {
        expect(m.passwordHash).toBeUndefined();
        expect(m.password_hash).toBeUndefined();
        expect(m.email).toBeUndefined();
        expect(m.verificationStatus).toBe("approved");
      }
    });

    it("GET /api/mentors filters by primary domain", async () => {
      const req = makeAuthRequest("http://localhost:3000/api/mentors?domain=Data%20Science");
      const res = await mentorsGetHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.mentors.every((m: any) => m.primaryDomain.toLowerCase() === "data science")).toBe(true);
    });

    it("GET /api/mentors filters by search query", async () => {
      const req = makeAuthRequest("http://localhost:3000/api/mentors?search=Microsoft");
      const res = await mentorsGetHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.mentors.some((m: any) => m.organization.includes("Microsoft"))).toBe(true);
    });

    it("GET /api/mentors/[id] returns 200 with weekly schedule for approved mentor", async () => {
      const req = makeAuthRequest(`http://localhost:3000/api/mentors/${mentorProfileId}`);
      const res = await mentorDetailGetHandler(req, {
        params: Promise.resolve({ id: mentorProfileId }),
      });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.mentor.id).toBe(mentorProfileId);
      expect(data.mentor.headline).toContain("Microsoft");
      expect(Array.isArray(data.mentor.availabilityWeekly)).toBe(true);
      expect(data.mentor.availabilityWeekly.length).toBeGreaterThan(0);
    });

    it("GET /api/mentors/[id] returns 404 for non-existent mentor", async () => {
      const nonExistentId = "99999999-9999-9999-9999-999999999999";
      const req = makeAuthRequest(`http://localhost:3000/api/mentors/${nonExistentId}`);
      const res = await mentorDetailGetHandler(req, {
        params: Promise.resolve({ id: nonExistentId }),
      });
      expect(res.status).toBe(404);

      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("not found");
    });
  });

  // =========================================================================
  // AREA 2: AUTHENTICATED STUDENT DASHBOARD
  // =========================================================================
  describe("Area 2: Authenticated Student Dashboard", () => {
    it("GET /api/student/dashboard returns 401 when unauthenticated", async () => {
      const req = makeAuthRequest("http://localhost:3000/api/student/dashboard");
      const res = await studentDashboardGetHandler(req);
      expect(res.status).toBe(401);
    });

    it("GET /api/student/dashboard returns 200 and derives student identity from session", async () => {
      const req = makeAuthRequest("http://localhost:3000/api/student/dashboard", {
        token: sessionTokenStudent,
      });
      const res = await studentDashboardGetHandler(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.id).toBe(studentUserId);
      expect(data.user.displayName).toBe("P2 Student Anant");

      // Goals from PostgreSQL
      expect(Array.isArray(data.goals)).toBe(true);
      expect(data.goals.length).toBe(2);
      expect(data.goals[0].title).toBe("Master System Design");

      // Upcoming booking
      expect(data.upcomingBooking).toBeDefined();
      expect(data.upcomingBooking.mentorName).toBe("P2 Mentor Priya");

      // Recommendations
      expect(data.topMatches.length).toBeGreaterThan(0);
    });

    it("GET /api/student/dashboard ignores client-supplied spoofed studentId", async () => {
      // Caller provides token for otherStudentUserId, but passes studentId=studentUserId in query
      const req = makeAuthRequest(`http://localhost:3000/api/student/dashboard?studentId=${studentUserId}`, {
        token: sessionTokenOtherStudent,
      });
      const res = await studentDashboardGetHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.user.id).toBe(otherStudentUserId);
      expect(data.user.id).not.toBe(studentUserId);
    });
  });

  // =========================================================================
  // AREA 3: MENTOR APPLICATION LIFECYCLE
  // =========================================================================
  describe("Area 3: Mentor Application Lifecycle", () => {
    it("GET /api/mentor/applications returns 401 when unauthenticated", async () => {
      const req = makeAuthRequest("http://localhost:3000/api/mentor/applications");
      const res = await mentorApplicationsGetHandler(req);
      expect(res.status).toBe(401);
    });

    it("POST /api/mentor/applications returns 401 when unauthenticated", async () => {
      const req = makeAuthRequest("http://localhost:3000/api/mentor/applications", {
        method: "POST",
        body: { currentRole: "Staff Engineer", organization: "Apple" },
      });
      const res = await mentorApplicationsPostHandler(req);
      expect(res.status).toBe(401);
    });

    it("POST /api/mentor/applications validates required fields", async () => {
      const req = makeAuthRequest("http://localhost:3000/api/mentor/applications", {
        method: "POST",
        token: sessionTokenOtherStudent,
        body: { currentRole: "", organization: "" },
      });
      const res = await mentorApplicationsPostHandler(req);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toContain("required");
    });

    it("POST /api/mentor/applications successfully creates application and profile in database", async () => {
      const req = makeAuthRequest("http://localhost:3000/api/mentor/applications", {
        method: "POST",
        token: sessionTokenOtherStudent,
        body: {
          fullName: "Other Student",
          currentRole: "Lead Cloud Architect",
          organization: "Amazon AWS",
          domain: "Software Engineering",
          yearsExperience: 7,
          skills: ["AWS", "Kubernetes", "Go", "Terraform"],
          linkedinUrl: "https://linkedin.com/in/cloud-architect-p2",
        },
      });

      const res = await mentorApplicationsPostHandler(req);
      expect(res.status).toBe(201);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.status).toBe("submitted");
      expect(data.mentorProfileId).toBeDefined();
      submittedMentorProfileId = data.mentorProfileId;

      // Verify GET /api/mentor/applications reflects the new submission
      const statusReq = makeAuthRequest("http://localhost:3000/api/mentor/applications", {
        token: sessionTokenOtherStudent,
      });
      const statusRes = await mentorApplicationsGetHandler(statusReq);
      const statusData = await statusRes.json();

      expect(statusRes.status).toBe(200);
      expect(statusData.hasApplication).toBe(true);
      expect(statusData.application.currentRole).toBe("Lead Cloud Architect");
      expect(statusData.application.organization).toBe("Amazon AWS");
      expect(statusData.application.status).toBe("submitted");
    });

    it("POST /api/mentor/applications rejects unsafe javascript: URL schemes", async () => {
      const req = makeAuthRequest("http://localhost:3000/api/mentor/applications", {
        method: "POST",
        token: sessionTokenOtherStudent,
        body: {
          fullName: "Other Student",
          currentRole: "Lead Cloud Architect",
          organization: "Amazon AWS",
          linkedinUrl: "javascript:alert(1)",
        },
      });

      const res = await mentorApplicationsPostHandler(req);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toContain("Unsafe URL scheme");
    });

    it("POST /api/mentor/applications updates existing record rather than creating duplicate applications", async () => {
      const db = getDb();
      const countBeforeResult: any = await db.execute(sql`
        SELECT count(*)::int as count FROM mentor_applications WHERE mentor_profile_id = ${submittedMentorProfileId};
      `);
      const countBefore = countBeforeResult.rows?.[0]?.count || countBeforeResult?.[0]?.count || 0;

      const req = makeAuthRequest("http://localhost:3000/api/mentor/applications", {
        method: "POST",
        token: sessionTokenOtherStudent,
        body: {
          fullName: "Other Student Updated",
          currentRole: "Principal Architect",
          organization: "Amazon AWS",
          domain: "Software Engineering",
          yearsExperience: 8,
          skills: ["AWS", "Kubernetes", "Architecture"],
          linkedinUrl: "https://linkedin.com/in/cloud-architect-p2",
        },
      });

      const res = await mentorApplicationsPostHandler(req);
      expect(res.status).toBe(200);

      const countAfterResult: any = await db.execute(sql`
        SELECT count(*)::int as count FROM mentor_applications WHERE mentor_profile_id = ${submittedMentorProfileId};
      `);
      const countAfter = countAfterResult.rows?.[0]?.count || countAfterResult?.[0]?.count || 0;
      expect(countAfter).toBe(countBefore);
    });

    it("GET /api/mentor/applications never exposes admin_notes to applicant", async () => {
      const req = makeAuthRequest("http://localhost:3000/api/mentor/applications", {
        token: sessionTokenOtherStudent,
      });
      const res = await mentorApplicationsGetHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.application).toBeDefined();
      expect(data.application.adminNotes).toBeUndefined();
      expect(data.application.admin_notes).toBeUndefined();
    });
  });

  // =========================================================================
  // AREA 4: MENTOR WORKSPACE & AVAILABILITY HARDENING
  // =========================================================================
  describe("Area 4: Mentor Workspace & Availability Hardening", () => {
    it("GET /api/mentor/availability returns 401 when unauthenticated (no Priya fallback)", async () => {
      const req = makeAuthRequest("http://localhost:3000/api/mentor/availability");
      const res = await mentorAvailabilityGetHandler(req);
      expect(res.status).toBe(401);
    });

    it("PUT /api/mentor/availability returns 401 when unauthenticated", async () => {
      const req = makeAuthRequest("http://localhost:3000/api/mentor/availability", {
        method: "PUT",
        body: { rules: [] },
      });
      const res = await mentorAvailabilityPutHandler(req);
      expect(res.status).toBe(401);
    });

    it("GET /api/mentor/availability returns 403 when user is not a mentor", async () => {
      const req = makeAuthRequest("http://localhost:3000/api/mentor/availability", {
        token: sessionTokenStudent,
      });
      const res = await mentorAvailabilityGetHandler(req);
      expect(res.status).toBe(403);
    });

    it("GET /api/mentor/availability rejects non-admin attempt to query another mentor profile (IDOR prevention)", async () => {
      const req = makeAuthRequest(
        `http://localhost:3000/api/mentor/availability?mentorProfileId=${otherMentorProfileId}`,
        { token: sessionTokenMentor }
      );
      const res = await mentorAvailabilityGetHandler(req);
      expect(res.status).toBe(403);
    });

    it("GET /api/mentor/availability returns 200 for authenticated mentor owner", async () => {
      const req = makeAuthRequest("http://localhost:3000/api/mentor/availability", {
        token: sessionTokenMentor,
      });
      const res = await mentorAvailabilityGetHandler(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.mentorProfileId).toBe(mentorProfileId);
      expect(Array.isArray(data.rules)).toBe(true);
    });

    it("PUT /api/mentor/availability persists schedule update for authenticated mentor owner", async () => {
      const req = makeAuthRequest("http://localhost:3000/api/mentor/availability", {
        method: "PUT",
        token: sessionTokenMentor,
        body: {
          settings: { bufferTimeMinutes: 15, dailySessionLimit: 5 },
          rules: [
            {
              dayOfWeek: 2,
              isActive: true,
              windows: [{ startTime: "18:00", endTime: "21:00" }],
            },
          ],
        },
      });
      const res = await mentorAvailabilityPutHandler(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it("GET /api/mentor/dashboard returns 401 when unauthenticated", async () => {
      const req = makeAuthRequest("http://localhost:3000/api/mentor/dashboard");
      const res = await mentorDashboardGetHandler(req);
      expect(res.status).toBe(401);
    });

    it("GET /api/mentor/dashboard returns 403 when user is student", async () => {
      const req = makeAuthRequest("http://localhost:3000/api/mentor/dashboard", {
        token: sessionTokenStudent,
      });
      const res = await mentorDashboardGetHandler(req);
      expect(res.status).toBe(403);
    });

    it("GET /api/mentor/dashboard returns 200 and loads real mentor workspace metrics", async () => {
      const req = makeAuthRequest("http://localhost:3000/api/mentor/dashboard", {
        token: sessionTokenMentor,
      });
      const res = await mentorDashboardGetHandler(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.mentor.id).toBe(mentorProfileId);
      expect(data.stats.upcomingSessions).toBeGreaterThanOrEqual(1);
      expect(data.stats.totalConducted).toBeGreaterThanOrEqual(150);
    });

    it("POST /api/mentor/dashboard allows accepting/declining booking requests with ownership check", async () => {
      // Other mentor tries to accept Priya's booking -> 403
      const unauthorizedReq = makeAuthRequest("http://localhost:3000/api/mentor/dashboard", {
        method: "POST",
        token: sessionTokenOtherMentor,
        body: { action: "accept", bookingId: testBookingId },
      });
      const unauthorizedRes = await mentorDashboardPostHandler(unauthorizedReq);
      expect(unauthorizedRes.status).toBe(403);

      // Mentor owner accepts -> 200
      const authorizedReq = makeAuthRequest("http://localhost:3000/api/mentor/dashboard", {
        method: "POST",
        token: sessionTokenMentor,
        body: { action: "accept", bookingId: testBookingId },
      });
      const authorizedRes = await mentorDashboardPostHandler(authorizedReq);
      expect(authorizedRes.status).toBe(200);
      const data = await authorizedRes.json();
      expect(data.status).toBe("confirmed");
    });

    it("POST /api/mentor/dashboard prevents double-booking when interval overlaps another confirmed session", async () => {
      const db = getDb();
      const existingBookingRes: any = await db.execute(sql`
        SELECT start_time_utc, end_time_utc FROM bookings WHERE id = ${testBookingId} LIMIT 1;
      `);
      const existing = existingBookingRes.rows?.[0] || existingBookingRes?.[0];

      const conflictingBookingRes: any = await db.execute(sql`
        INSERT INTO bookings (
          student_user_id, mentor_profile_id, service_type, session_duration_minutes,
          start_time_utc, end_time_utc, status, price_inr, student_discussion_points
        ) VALUES (
          ${otherStudentUserId}, ${mentorProfileId}, '1on1_mentorship', 60,
          ${existing.start_time_utc}, ${existing.end_time_utc}, 'pending', 249,
          'Conflicting request'
        )
        RETURNING id;
      `);
      const conflictingBookingId = (conflictingBookingRes.rows?.[0] || conflictingBookingRes?.[0]).id;

      // Attempting to accept conflicting booking should fail with 409 Schedule conflict
      const req = makeAuthRequest("http://localhost:3000/api/mentor/dashboard", {
        method: "POST",
        token: sessionTokenMentor,
        body: { action: "accept", bookingId: conflictingBookingId },
      });
      const res = await mentorDashboardPostHandler(req);
      expect(res.status).toBe(409);

      const data = await res.json();
      expect(data.error).toContain("Schedule conflict");
    });

    it("POST /api/mentor/dashboard declines booking, records cancellation, and enqueues outbox event", async () => {
      const db = getDb();
      const futureStart = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const futureEnd = new Date(Date.now() + 49 * 60 * 60 * 1000);
      const bookingRes: any = await db.execute(sql`
        INSERT INTO bookings (
          student_user_id, mentor_profile_id, service_type, session_duration_minutes,
          start_time_utc, end_time_utc, status, price_inr, student_discussion_points
        ) VALUES (
          ${studentUserId}, ${mentorProfileId}, '1on1_mentorship', 60,
          ${futureStart.toISOString()}, ${futureEnd.toISOString()}, 'pending', 249,
          'Test decline flow'
        )
        RETURNING id;
      `);
      const bookingToDeclineId = (bookingRes.rows?.[0] || bookingRes?.[0]).id;

      const req = makeAuthRequest("http://localhost:3000/api/mentor/dashboard", {
        method: "POST",
        token: sessionTokenMentor,
        body: { action: "decline", bookingId: bookingToDeclineId, reason: "Schedule conflict with company meeting" },
      });
      const res = await mentorDashboardPostHandler(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.status).toBe("cancelled");

      // Verify booking status in database
      const dbCheck: any = await db.execute(sql`
        SELECT status, cancellation_reason FROM bookings WHERE id = ${bookingToDeclineId};
      `);
      const row = dbCheck.rows?.[0] || dbCheck?.[0];
      expect(row.status).toBe("cancelled");
      expect(row.cancellation_reason).toContain("Schedule conflict");

      // Verify booking_events log
      const eventCheck: any = await db.execute(sql`
        SELECT event_type, to_status FROM booking_events WHERE booking_id = ${bookingToDeclineId} ORDER BY created_at DESC LIMIT 1;
      `);
      const ev = eventCheck.rows?.[0] || eventCheck?.[0];
      expect(ev.event_type).toBe("transition_to_cancelled");
      expect(ev.to_status).toBe("cancelled");
    });

    it("PUT /api/mentor/availability ignores forceOverrideConflicts when sent by standard mentor and rejects with 409", async () => {
      // Standard mentor attempts to override schedule conflicts and wipe out confirmed sessions
      const req = makeAuthRequest("http://localhost:3000/api/mentor/availability", {
        method: "PUT",
        token: sessionTokenMentor,
        body: {
          forceOverrideConflicts: true,
          settings: { bufferTimeMinutes: 10 },
          rules: [],
        },
      });
      const res = await mentorAvailabilityPutHandler(req);
      expect(res.status).toBe(409);

      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.hasConflicts).toBe(true);
      expect(data.error).toContain("confirmed session(s) would be orphaned");

      // Verify that an administrator CAN force override conflicts
      const adminReq = makeAuthRequest(`http://localhost:3000/api/mentor/availability?mentorProfileId=${mentorProfileId}`, {
        method: "PUT",
        token: sessionTokenAdmin,
        body: {
          forceOverrideConflicts: true,
          settings: { bufferTimeMinutes: 10 },
          rules: [],
        },
      });
      const adminRes = await mentorAvailabilityPutHandler(adminReq);
      expect(adminRes.status).toBe(200);
      const adminData = await adminRes.json();
      expect(adminData.success).toBe(true);
    });
  });

  // =========================================================================
  // AREA 5: DIRECT MESSAGING SYSTEM
  // =========================================================================
  describe("Area 5: Direct Messaging System", () => {
    it("GET /api/messages returns 401 when unauthenticated", async () => {
      const req = makeAuthRequest("http://localhost:3000/api/messages");
      const res = await messagesGetHandler(req);
      expect(res.status).toBe(401);
    });

    it("GET /api/messages lists active conversations for authenticated user", async () => {
      const req = makeAuthRequest("http://localhost:3000/api/messages", {
        token: sessionTokenStudent,
      });
      const res = await messagesGetHandler(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.conversations)).toBe(true);
      expect(data.conversations.some((c: any) => c.id === conversationId)).toBe(true);
    });

    it("GET /api/messages?conversationId=... enforces participant membership (IDOR prevention)", async () => {
      // Other student tries to read conversation between Student and Priya -> 403
      const req = makeAuthRequest(
        `http://localhost:3000/api/messages?conversationId=${conversationId}`,
        { token: sessionTokenOtherStudent }
      );
      const res = await messagesGetHandler(req);
      expect(res.status).toBe(403);
    });

    it("GET /api/messages?conversationId=... returns message thread for authorized participant", async () => {
      const req = makeAuthRequest(
        `http://localhost:3000/api/messages?conversationId=${conversationId}`,
        { token: sessionTokenStudent }
      );
      const res = await messagesGetHandler(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.messages)).toBe(true);
      expect(data.messages.length).toBeGreaterThanOrEqual(1);
      expect(data.messages[0].content).toContain("looking forward");
    });

    it("POST /api/messages rejects message injection by non-participant", async () => {
      const req = makeAuthRequest("http://localhost:3000/api/messages", {
        method: "POST",
        token: sessionTokenOtherStudent,
        body: {
          conversationId,
          content: "Unauthorized injection attempt",
        },
      });
      const res = await messagesPostHandler(req);
      expect(res.status).toBe(403);
    });

    it("POST /api/messages saves message and updates conversation for participant", async () => {
      const req = makeAuthRequest("http://localhost:3000/api/messages", {
        method: "POST",
        token: sessionTokenMentor,
        body: {
          conversationId,
          content: "Hello! Looking forward to reviewing your system design architecture.",
        },
      });
      const res = await messagesPostHandler(req);
      expect(res.status).toBe(201);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message.content).toContain("Looking forward to reviewing");
      expect(data.message.senderUserId).toBe(mentorUserId);

      // Verify message is persisted in PostgreSQL
      const verifyReq = makeAuthRequest(
        `http://localhost:3000/api/messages?conversationId=${conversationId}`,
        { token: sessionTokenStudent }
      );
      const verifyRes = await messagesGetHandler(verifyReq);
      const verifyData = await verifyRes.json();

      expect(verifyData.messages.length).toBe(2);
      expect(verifyData.messages[1].content).toContain("Looking forward to reviewing");
    });

    it("GET /api/messages rejects starting a conversation with oneself (400)", async () => {
      const req = makeAuthRequest(
        `http://localhost:3000/api/messages?mentorId=${mentorProfileId}`,
        { token: sessionTokenMentor }
      );
      const res = await messagesGetHandler(req);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toContain("Cannot start a conversation with yourself");
    });

    it("POST /api/messages rejects sending a message to oneself (400)", async () => {
      const req = makeAuthRequest("http://localhost:3000/api/messages", {
        method: "POST",
        token: sessionTokenMentor,
        body: {
          recipientUserId: mentorUserId,
          content: "Message to self",
        },
      });
      const res = await messagesPostHandler(req);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toContain("Cannot send messages to yourself");
    });

    it("GET /api/messages rejects messaging unapproved mentor (400)", async () => {
      const req = makeAuthRequest(
        `http://localhost:3000/api/messages?mentorId=${submittedMentorProfileId}`,
        { token: sessionTokenStudent }
      );
      const res = await messagesGetHandler(req);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toContain("not approved");
    });
  });
});
