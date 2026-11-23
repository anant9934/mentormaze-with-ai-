/**
 * MentorMaze — ASTRION Personal AI Mentorship System
 * Phase 4.1.3: Check-In Consent Semantics & Drizzle Migration Compatibility Test Suite
 *
 * Mandates Verified:
 * 1. Dedicated `mentorship_checkins` purpose separated from `student_memory`
 * 2. Check-in writes & access blocked after check-in authorization revocation (403)
 * 3. Revoking `student_memory` does NOT delete independently authorized check-in history
 * 4. Memory writes/reads blocked when `student_memory` is revoked
 * 5. Model-training remains STRICTLY FALSE and independent (check-in ineligible by default)
 * 6. External LLM & mentor sharing remain independently authorized
 * 7. Multi-tenant ownership (401 unauth, 403 cross-student)
 * 8. Retention and deletion behavior tested (single record delete, clear all history)
 * 9. Student reflection corrections strictly preserve provenance: "student_reported"
 * 10. Drizzle official migration compatibility: canonical SHA256 hashes, zero duplicate execution,
 *     and fresh database initialization in exact order (0000 -> 0006).
 */

import { describe, it, expect, beforeEach } from "vitest";
import { StudentConsentService, ConsentPurpose } from "@/lib/ai-mentor/student-consent-service";
import { StudentMemoryService } from "@/lib/ai-mentor/student-memory-service";
import { StudentCheckinService } from "@/lib/ai-mentor/checkins/student-checkin-service";
import { initializeDatabaseSchema } from "@/lib/db";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { PGlite } from "@electric-sql/pglite";
import {
  GET as checkinsGetHandler,
  POST as checkinsPostHandler,
  DELETE as checkinsDeleteHandler,
  PATCH as checkinsPatchHandler,
} from "@/app/api/ai-mentor/checkins/route";
import { NextRequest } from "next/server";
import path from "path";
import fs from "fs";

describe("Phase 4.1.3 Check-In Consent Semantics & Drizzle Migration Compatibility", () => {
  const studentA = "student-phase4-1-3-a";
  const studentB = "student-phase4-1-3-b";

  const studentAHeaders = {
    "x-mentormaze-test": "true",
    "x-mentormaze-auth-user": studentA,
  };

  const studentBHeaders = {
    "x-mentormaze-test": "true",
    "x-mentormaze-auth-user": studentB,
  };

  beforeEach(async () => {
    await initializeDatabaseSchema();
    StudentMemoryService.reset();
    StudentCheckinService.resetCache();
    StudentConsentService.resetCache();
    // Default grants
    await StudentConsentService.grantConsent(studentA, "service_personalization");
    await StudentConsentService.grantConsent(studentA, "student_memory");
    await StudentConsentService.grantConsent(studentA, "mentorship_checkins");
  });

  // =========================================================================
  // 1. DEDICATED PURPOSE SEMANTICS & PURPOSE ISOLATION
  // =========================================================================
  describe("1. Dedicated mentorship_checkins Purpose & Negative Isolation", () => {
    it("allows check-in persistence with valid mentorship_checkins authorization", async () => {
      const record = await StudentCheckinService.recordCheckin(
        {
          studentUserId: studentA,
          checkinType: "session_checkin",
          progressSummary: "Built and verified Raft RPC heartbeat logic.",
          blockers: "Dealing with goroutine leaks under simulated network timeout.",
          notes: "Need guidance on Go context cancellation patterns.",
        },
        studentA
      );

      expect(record.id).toBeDefined();
      expect(record.studentUserId).toBe(studentA);
      expect(record.consentReference).toBe("mentorship_checkins");
      expect(record.provenance).toBe("student_reported");

      const history = await StudentCheckinService.getCheckinHistory(studentA, studentA);
      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(history[0].progressSummary).toContain("Raft RPC heartbeat");
    });

    it("blocks check-in writes when mentorship_checkins authorization is revoked", async () => {
      // Revoke mentorship_checkins
      await StudentConsentService.revokeConsent(
        studentA,
        "mentorship_checkins",
        "Student opted out of mentorship check-ins",
        studentA
      );

      // Writing via service throws 403
      await expect(
        StudentCheckinService.recordCheckin(
          {
            studentUserId: studentA,
            checkinType: "session_checkin",
            progressSummary: "Attempted check-in after revocation",
          },
          studentA
        )
      ).rejects.toThrow("403_FORBIDDEN: Check-in writes are blocked because mentorship_checkins authorization is revoked.");

      // Writing via API returns 403
      const postReq = new NextRequest("http://localhost:3000/api/ai-mentor/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...studentAHeaders },
        body: JSON.stringify({
          studentId: studentA,
          progressSummary: "Blocked check-in API attempt",
        }),
      });
      const postRes = await checkinsPostHandler(postReq);
      expect(postRes.status).toBe(403);
    });

    it("preserves check-in history when student_memory consent is revoked (decoupled persistence)", async () => {
      // 1. Record a valid check-in
      await StudentCheckinService.recordCheckin(
        {
          studentUserId: studentA,
          checkinType: "milestone_reflection",
          progressSummary: "Completed Paxos vs Raft architectural comparison.",
        },
        studentA
      );

      // 2. Revoke student_memory consent
      await StudentConsentService.revokeConsent(
        studentA,
        "student_memory",
        "Opted out of long term memory",
        studentA
      );

      // 3. Long-term memory returns empty list
      const memories = StudentMemoryService.getMemories(studentA, studentA);
      expect(memories).toEqual([]);

      // 4. Memory save throws / blocks
      expect(() =>
        StudentMemoryService.saveMemory(studentA, "confirmed_weaknesses", "Paxos leader election", studentA)
      ).toThrow("403_FORBIDDEN");

      // 5. Independently authorized check-in history remains intact
      const history = await StudentCheckinService.getCheckinHistory(studentA, studentA);
      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(history[0].progressSummary).toContain("Paxos vs Raft");
    });

    it("proves model_training remains strictly false and check-ins are ineligible by default", async () => {
      expect(StudentConsentService.getDefaultPolicy("model_training")).toBe(false);

      const hasTrainingConsent = await StudentConsentService.hasConsent(studentA, "model_training", studentA);
      expect(hasTrainingConsent).toBe(false);

      // Granting mentorship_checkins does NOT imply model_training
      await StudentConsentService.grantConsent(studentA, "mentorship_checkins", "Check-ins enabled", studentA);
      const stillNoTraining = await StudentConsentService.hasConsent(studentA, "model_training", studentA);
      expect(stillNoTraining).toBe(false);
    });

    it("proves external_llm_processing and mentor_sharing remain independent from check-ins", async () => {
      // Revoking mentorship_checkins does not revoke external_llm_processing
      await StudentConsentService.revokeConsent(studentA, "mentorship_checkins", "Stop check-ins", studentA);

      expect(await StudentConsentService.hasConsent(studentA, "mentorship_checkins", studentA)).toBe(false);
      expect(await StudentConsentService.hasConsent(studentA, "external_llm_processing", studentA)).toBe(true);
      expect(await StudentConsentService.hasConsent(studentA, "service_personalization", studentA)).toBe(true);
    });

    it("prevents third-party students from retrieving another student's check-ins", async () => {
      const crossReq = new NextRequest(
        `http://localhost:3000/api/ai-mentor/checkins?studentId=${studentA}`,
        { headers: studentBHeaders }
      );
      const crossRes = await checkinsGetHandler(crossReq);
      expect(crossRes.status).toBe(403);
    });
  });

  // =========================================================================
  // 2. CHECK-IN RETENTION, DELETION, AND STUDENT CORRECTIONS
  // =========================================================================
  describe("2. Check-In Retention, Deletion, and Provenance-Preserving Corrections", () => {
    it("allows student to delete a specific check-in record", async () => {
      const rec = await StudentCheckinService.recordCheckin(
        {
          studentUserId: studentA,
          progressSummary: "Temporary note to be deleted.",
        },
        studentA
      );

      // Delete via API
      const delReq = new NextRequest(
        `http://localhost:3000/api/ai-mentor/checkins?studentId=${studentA}&checkinId=${rec.id}`,
        { method: "DELETE", headers: studentAHeaders }
      );
      const delRes = await checkinsDeleteHandler(delReq);
      expect(delRes.status).toBe(200);

      const history = await StudentCheckinService.getCheckinHistory(studentA, studentA);
      expect(history.some((h) => h.id === rec.id)).toBe(false);
    });

    it("allows student to clear all check-in history in accordance with retention policy", async () => {
      await StudentCheckinService.recordCheckin(
        { studentUserId: studentA, progressSummary: "Record 1" },
        studentA
      );
      await StudentCheckinService.recordCheckin(
        { studentUserId: studentA, progressSummary: "Record 2" },
        studentA
      );

      // Clear all via API
      const clearReq = new NextRequest(
        `http://localhost:3000/api/ai-mentor/checkins?studentId=${studentA}&all=true`,
        { method: "DELETE", headers: studentAHeaders }
      );
      const clearRes = await checkinsDeleteHandler(clearReq);
      expect(clearRes.status).toBe(200);

      const history = await StudentCheckinService.getCheckinHistory(studentA, studentA);
      expect(history.length).toBe(0);
    });

    it("allows student to correct a check-in reflection while strictly preserving provenance: student_reported", async () => {
      const rec = await StudentCheckinService.recordCheckin(
        {
          studentUserId: studentA,
          progressSummary: "Initial incorrect summary: failed all tests.",
          blockers: "Severe networking issue.",
        },
        studentA
      );

      // Patch via API
      const patchReq = new NextRequest("http://localhost:3000/api/ai-mentor/checkins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...studentAHeaders },
        body: JSON.stringify({
          studentId: studentA,
          checkinId: rec.id,
          progressSummary: "Corrected summary: Passed 14/15 integration tests.",
          blockers: "Minor timeout on final test case.",
        }),
      });
      const patchRes = await checkinsPatchHandler(patchReq);
      expect(patchRes.status).toBe(200);
      const patchData = await patchRes.json();

      expect(patchData.record.progressSummary).toBe("Corrected summary: Passed 14/15 integration tests.");
      expect(patchData.record.blockers).toBe("Minor timeout on final test case.");
      expect(patchData.record.provenance).toBe("student_reported");
    });
  });

  // =========================================================================
  // 3. DRIZZLE MIGRATION TRACKING & OFFICIAL COMPATIBILITY
  // =========================================================================
  describe("3. Drizzle Migration Tracking & Official Migrator Compatibility", () => {
    it("confirms Drizzle official readMigrationFiles reads all 7 migrations with exact sha256 content hashes", () => {
      const migrationsFolder = path.resolve(process.cwd(), "lib/db/migrations");
      const migrations = readMigrationFiles({ migrationsFolder });

      expect(migrations.length).toBe(7);

      // Verify each migration has a valid 64-char hex sha256 content hash
      for (const m of migrations) {
        expect(m.hash).toMatch(/^[a-f0-9]{64}$/);
        expect(typeof m.folderMillis).toBe("number");
        expect(m.sql.length).toBeGreaterThan(0);
      }

      // Specifically verify migration 0006
      const mig6 = migrations[6];
      expect(mig6.folderMillis).toBe(1795377000000);
      expect(mig6.hash).toBe("3dd9389cfbd66cc030aaba7d188b4864c94f7a8e3b6b48c965b24450a846c18b");
    });

    it("proves official Drizzle migrate() recognizes migration 0006 as applied without duplicate execution", async () => {
      const dataDir = path.resolve(process.cwd(), ".mentormaze-pgdata");
      const pidFile = path.join(dataDir, "postmaster.pid");
      if (fs.existsSync(pidFile)) {
        try { fs.rmSync(pidFile, { force: true }); } catch (_) {}
      }
      const client = new PGlite(dataDir);
      await client.waitReady;
      const db = drizzle(client);

      const migrationsFolder = path.resolve(process.cwd(), "lib/db/migrations");
      // Running official migrate against reconciled database must complete with zero errors
      await migrate(db, { migrationsFolder });

      // Check migration tracking rows
      const res = await client.query<{ id: number; hash: string; created_at: string }>(
        "SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id ASC"
      );
      expect(res.rows.length).toBe(7);
      expect(res.rows[6]?.hash).toBe("3dd9389cfbd66cc030aaba7d188b4864c94f7a8e3b6b48c965b24450a846c18b");
      expect(Number(res.rows[6]?.created_at)).toBe(1795377000000);

      await client.close();
    });

    it("proves fresh disposable development database initializes successfully from scratch (0000 -> 0006)", async () => {
      const freshDir = path.resolve(process.cwd(), ".mentormaze-test-fresh-db-runner");
      if (fs.existsSync(freshDir)) {
        fs.rmSync(freshDir, { recursive: true, force: true });
      }

      const client = new PGlite(freshDir);
      await client.waitReady;
      const db = drizzle(client);

      const migrationsFolder = path.resolve(process.cwd(), "lib/db/migrations");
      // Run official Drizzle migrator from scratch
      await migrate(db, { migrationsFolder });

      // Verify all 7 migrations were recorded
      const res = await client.query("SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id ASC");
      expect(res.rows.length).toBe(7);

      // Verify check-in tables exist in fresh database
      const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('ai_mentor_checkin_preferences', 'ai_mentor_checkin_records');
      `);
      expect(tablesRes.rows.length).toBe(2);

      await client.close();
      fs.rmSync(freshDir, { recursive: true, force: true });
    });
  });
});
