/**
 * MentorMaze — Exhaustive Admin HTTP Method Handlers Coverage Test Suite
 *
 * Verifies every actual HTTP handler across all 17 administrative route files (29 endpoints):
 * 1. Server-side identity is verified (401 unauthenticated)
 * 2. Administrator authorization is enforced (403 for student & mentor roles)
 * 3. Client-controlled role and identity headers/parameters are ignored
 * 4. Authorized administrator access succeeds without authorization blocks
 */

import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import crypto from "crypto";

// Import all 29 HTTP method handlers from the 17 admin route files
import { GET as aiMentorGet } from "@/app/api/admin/ai-mentor/route";
import { GET as bookingsGet, POST as bookingsPost } from "@/app/api/admin/bookings/route";
import { GET as calendarGet } from "@/app/api/admin/calendar/route";
import {
  GET as commsAutomationsGet,
  PATCH as commsAutomationsPatch,
} from "@/app/api/admin/communications/automations/route";
import {
  GET as commsFailedGet,
  POST as commsFailedPost,
} from "@/app/api/admin/communications/failed/route";
import { GET as commsLogsGet } from "@/app/api/admin/communications/logs/route";
import { GET as commsNotifLogsGet } from "@/app/api/admin/communications/notifications/logs/route";
import {
  GET as commsNotifGet,
  POST as commsNotifPost,
} from "@/app/api/admin/communications/notifications/route";
import {
  GET as commsSmtpGet,
  POST as commsSmtpPost,
} from "@/app/api/admin/communications/smtp/route";
import { GET as commsStatsGet } from "@/app/api/admin/communications/stats/route";
import {
  GET as commsTemplatesGet,
  PATCH as commsTemplatesPatch,
  POST as commsTemplatesPost,
} from "@/app/api/admin/communications/templates/route";
import { GET as disputesGet, POST as disputesPost } from "@/app/api/admin/disputes/route";
import { GET as paymentsReconciliationGet } from "@/app/api/admin/payments/reconciliation/route";
import { GET as paymentsGet } from "@/app/api/admin/payments/route";
import {
  GET as policiesGet,
  PATCH as policiesPatch,
  POST as policiesPost,
} from "@/app/api/admin/policies/route";
import { GET as settlementsGet, POST as settlementsPost } from "@/app/api/admin/settlements/route";
import { GET as videoGet, POST as videoPost } from "@/app/api/admin/video/route";

interface AdminHandlerTarget {
  name: string;
  url: string;
  method: "GET" | "POST" | "PATCH";
  handler: (req: NextRequest) => Promise<Response>;
}

const ALL_ADMIN_HANDLERS: AdminHandlerTarget[] = [
  { name: "ai-mentor", url: "http://localhost:3000/api/admin/ai-mentor", method: "GET", handler: aiMentorGet },
  { name: "bookings", url: "http://localhost:3000/api/admin/bookings", method: "GET", handler: bookingsGet },
  { name: "bookings", url: "http://localhost:3000/api/admin/bookings", method: "POST", handler: bookingsPost },
  { name: "calendar", url: "http://localhost:3000/api/admin/calendar", method: "GET", handler: calendarGet },
  { name: "comms-automations", url: "http://localhost:3000/api/admin/communications/automations", method: "GET", handler: commsAutomationsGet },
  { name: "comms-automations", url: "http://localhost:3000/api/admin/communications/automations", method: "PATCH", handler: commsAutomationsPatch },
  { name: "comms-failed", url: "http://localhost:3000/api/admin/communications/failed", method: "GET", handler: commsFailedGet },
  { name: "comms-failed", url: "http://localhost:3000/api/admin/communications/failed", method: "POST", handler: commsFailedPost },
  { name: "comms-logs", url: "http://localhost:3000/api/admin/communications/logs", method: "GET", handler: commsLogsGet },
  { name: "comms-notifications-logs", url: "http://localhost:3000/api/admin/communications/notifications/logs", method: "GET", handler: commsNotifLogsGet },
  { name: "comms-notifications", url: "http://localhost:3000/api/admin/communications/notifications", method: "GET", handler: commsNotifGet },
  { name: "comms-notifications", url: "http://localhost:3000/api/admin/communications/notifications", method: "POST", handler: commsNotifPost },
  { name: "comms-smtp", url: "http://localhost:3000/api/admin/communications/smtp", method: "GET", handler: commsSmtpGet },
  { name: "comms-smtp", url: "http://localhost:3000/api/admin/communications/smtp", method: "POST", handler: commsSmtpPost },
  { name: "comms-stats", url: "http://localhost:3000/api/admin/communications/stats", method: "GET", handler: commsStatsGet },
  { name: "comms-templates", url: "http://localhost:3000/api/admin/communications/templates", method: "GET", handler: commsTemplatesGet },
  { name: "comms-templates", url: "http://localhost:3000/api/admin/communications/templates", method: "PATCH", handler: commsTemplatesPatch },
  { name: "comms-templates", url: "http://localhost:3000/api/admin/communications/templates", method: "POST", handler: commsTemplatesPost },
  { name: "disputes", url: "http://localhost:3000/api/admin/disputes", method: "GET", handler: disputesGet },
  { name: "disputes", url: "http://localhost:3000/api/admin/disputes", method: "POST", handler: disputesPost },
  { name: "payments-reconciliation", url: "http://localhost:3000/api/admin/payments/reconciliation", method: "GET", handler: paymentsReconciliationGet },
  { name: "payments", url: "http://localhost:3000/api/admin/payments", method: "GET", handler: paymentsGet },
  { name: "policies", url: "http://localhost:3000/api/admin/policies", method: "GET", handler: policiesGet },
  { name: "policies", url: "http://localhost:3000/api/admin/policies", method: "PATCH", handler: policiesPatch },
  { name: "policies", url: "http://localhost:3000/api/admin/policies", method: "POST", handler: policiesPost },
  { name: "settlements", url: "http://localhost:3000/api/admin/settlements", method: "GET", handler: settlementsGet },
  { name: "settlements", url: "http://localhost:3000/api/admin/settlements", method: "POST", handler: settlementsPost },
  { name: "video", url: "http://localhost:3000/api/admin/video", method: "GET", handler: videoGet },
  { name: "video", url: "http://localhost:3000/api/admin/video", method: "POST", handler: videoPost },
];

describe("Administrative Endpoints Exhaustive Coverage (All 29 Handlers)", () => {
  let studentToken: string;
  let mentorToken: string;
  let adminToken: string;

  beforeEach(async () => {
    await initializeDatabaseSchema();
    const db = getDb();

    // 1. Seed Student User & Session
    const studentId = "88880000-0000-0000-0000-000000000001";
    await db.execute(sql`
      INSERT INTO users (id, email, display_name, role, account_status)
      VALUES (${studentId}, 'student.admin.test@mentormaze.com', 'Student Tester', 'student', 'active')
      ON CONFLICT (id) DO UPDATE SET role = 'student', account_status = 'active';
    `);
    studentToken = "test_student_admin_token_" + Date.now();
    const studentHash = crypto.createHash("sha256").update(studentToken).digest("hex");
    await db.execute(sql`
      INSERT INTO user_sessions (user_id, token, expires_at)
      VALUES (${studentId}, ${studentHash}, now() + interval '1 day');
    `);

    // 2. Seed Mentor User & Session
    const mentorId = "88880000-0000-0000-0000-000000000002";
    await db.execute(sql`
      INSERT INTO users (id, email, display_name, role, account_status)
      VALUES (${mentorId}, 'mentor.admin.test@mentormaze.com', 'Mentor Tester', 'mentor', 'active')
      ON CONFLICT (id) DO UPDATE SET role = 'mentor', account_status = 'active';
    `);
    mentorToken = "test_mentor_admin_token_" + Date.now();
    const mentorHash = crypto.createHash("sha256").update(mentorToken).digest("hex");
    await db.execute(sql`
      INSERT INTO user_sessions (user_id, token, expires_at)
      VALUES (${mentorId}, ${mentorHash}, now() + interval '1 day');
    `);

    // 3. Seed Admin User & Session
    const adminId = "88880000-0000-0000-0000-000000000003";
    await db.execute(sql`
      INSERT INTO users (id, email, display_name, role, account_status)
      VALUES (${adminId}, 'verified.admin.test@mentormaze.com', 'Verified Admin', 'admin', 'active')
      ON CONFLICT (id) DO UPDATE SET role = 'admin', account_status = 'active';
    `);
    adminToken = "test_verified_admin_token_" + Date.now();
    const adminHash = crypto.createHash("sha256").update(adminToken).digest("hex");
    await db.execute(sql`
      INSERT INTO user_sessions (user_id, token, expires_at)
      VALUES (${adminId}, ${adminHash}, now() + interval '1 day');
    `);
  });

  it("verifies inventory holds exactly 29 administrative HTTP handlers", () => {
    expect(ALL_ADMIN_HANDLERS.length).toBe(29);
  });

  ALL_ADMIN_HANDLERS.forEach(({ name, url, method, handler }) => {
    describe(`${method} ${url}`, () => {
      it("rejects unauthenticated request with 401", async () => {
        const req = new NextRequest(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            // Client-controlled spoof attempts must be ignored
            "x-user-role": "admin",
            "x-mentormaze-role": "admin",
          },
          body: method !== "GET" ? JSON.stringify({ test: true }) : undefined,
        });

        const res = await handler(req);
        expect(res.status).toBe(401);
      });

      it("rejects student session with 403", async () => {
        const req = new NextRequest(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${studentToken}`,
            // Role override attempt in header must be ignored
            "x-user-role": "super_admin",
          },
          body: method !== "GET" ? JSON.stringify({ test: true }) : undefined,
        });

        const res = await handler(req);
        expect(res.status).toBe(403);
      });

      it("rejects mentor session with 403", async () => {
        const req = new NextRequest(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mentorToken}`,
          },
          body: method !== "GET" ? JSON.stringify({ test: true }) : undefined,
        });

        const res = await handler(req);
        expect(res.status).toBe(403);
      });

      it("authorizes verified administrator session (status != 401 and != 403)", async () => {
        const req = new NextRequest(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: method !== "GET" ? JSON.stringify({}) : undefined,
        });

        const res = await handler(req);
        // Admin must not be blocked by auth
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
      });
    });
  });
});
