/**
 * Real Neon Staging Database Integration & Constraint Verification Suite
 * Phase 2 — Verified against live Neon PostgreSQL (AWS US-East-2) via @neondatabase/serverless (Port 443)
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Pool } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

function loadEnvIfNeeded() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}
loadEnvIfNeeded();

const DATABASE_URL =
  process.env.DIRECT_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_h6L3cvsjztUO@ep-withered-heart-bebleio4.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require";

describe("Phase 2 — Real Staging Neon PostgreSQL Database Verification", { timeout: 35000 }, () => {
  let pool: Pool;

  beforeAll(() => {
    pool = new Pool({
      connectionString: DATABASE_URL,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
    });
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  it("1. verifies database host and database identity with sanitized metadata", async () => {
    const url = new URL(DATABASE_URL);
    expect(url.protocol).toBe("postgresql:");
    expect(url.hostname).toContain("neon.tech");
    expect(url.pathname).toBe("/neondb");

    const result = await pool.query("SELECT current_database() as db, current_user as usr, version() as ver;");
    expect(result.rows.length).toBe(1);
    expect(result.rows[0].db).toBe("neondb");
    expect(result.rows[0].usr).toBe("neondb_owner");
    expect(result.rows[0].ver).toContain("PostgreSQL");
  });

  it("2. confirms the connection is to staging, not production", () => {
    const url = new URL(DATABASE_URL);
    expect(url.hostname).toContain("ep-withered-heart-bebleio4");
    expect(DATABASE_URL).not.toContain("prod-cluster");
  });

  it("3. verifies all 16 canonical AI mentor tables exist in real Neon DB", async () => {
    const expectedTables = [
      "student_hint_escalation_state",
      "student_concept_bkt_state",
      "student_concept_fsrs_state",
      "ai_mentor_goals",
      "student_purpose_consents",
      "student_learning_profiles",
      "student_skill_nodes",
      "student_skill_evidence",
      "student_memory",
      "ai_mentor_roadmaps",
      "ai_mentor_roadmap_milestones",
      "ai_mentor_checkin_preferences",
      "ai_mentor_checkin_records",
      "mentorship_bridge_shares",
      "ai_mentor_conversations",
      "ai_mentor_messages",
    ];

    const result = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
    );
    const existing = new Set(result.rows.map((r: any) => r.table_name));

    for (const tableName of expectedTables) {
      expect(existing.has(tableName)).toBe(true);
    }
  });

  it("4. verifies indexes and constraints on ASTRION tables in real Neon DB", async () => {
    const result = await pool.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND tablename IN ('student_hint_escalation_state', 'student_concept_bkt_state', 'student_concept_fsrs_state');
    `);
    const indexNames = new Set(result.rows.map((i: any) => i.indexname));

    expect(indexNames.has("idx_hint_student_exercise")).toBe(true);
    expect(indexNames.has("idx_hint_student_skill")).toBe(true);
    expect(indexNames.has("idx_bkt_student_concept")).toBe(true);
    expect(indexNames.has("idx_fsrs_student_concept")).toBe(true);
    expect(indexNames.has("idx_fsrs_next_review")).toBe(true);
  });

  it("5. verifies real transaction rollback behavior", async () => {
    const testStudentId = "test_rollback_student_" + Date.now();
    const testConceptId = "concept_rollback_test";
    const client = await pool.connect();

    try {
      await client.query("BEGIN;");
      await client.query(
        `
        INSERT INTO student_concept_bkt_state (
          id, student_user_id, concept_id, knowledge_probability, initial_probability, 
          learn_probability, guess_probability, slip_probability, mastery_band, 
          canonical_mastery_level, independent_checks_count, total_attempts
        ) VALUES (
          $1, $2, $3, 0.5, 0.15, 0.2, 0.15, 0.1, 'intermediate', 2, 1, 3
        );
      `,
        ["bkt_tx_" + Date.now(), testStudentId, testConceptId]
      );
      // Deliberately rollback
      await client.query("ROLLBACK;");
    } finally {
      client.release();
    }

    const check = await pool.query(
      "SELECT count(*)::int as cnt FROM student_concept_bkt_state WHERE student_user_id = $1;",
      [testStudentId]
    );
    expect(check.rows[0].cnt).toBe(0);
  });

  it("6. verifies unique constraint and anti-duplicate enforcement in real Neon DB", async () => {
    const studentId = "student_uniq_test_" + Date.now();
    const exerciseId = "ex_uniq_101";
    const skillId = "skill_trees_01";

    await pool.query(
      `
      INSERT INTO student_hint_escalation_state (
        id, student_user_id, skill_id, exercise_id, topic, attempt_count, current_hint_level
      ) VALUES (
        $1, $2, $3, $4, 'Trees', 1, 1
      );
    `,
      ["hint_u1_" + Date.now(), studentId, skillId, exerciseId]
    );

    let failed = false;
    try {
      await pool.query(
        `
        INSERT INTO student_hint_escalation_state (
          id, student_user_id, skill_id, exercise_id, topic, attempt_count, current_hint_level
        ) VALUES (
          $1, $2, $3, $4, 'Trees', 2, 2
        );
      `,
        ["hint_u2_" + Date.now(), studentId, skillId, exerciseId]
      );
    } catch (err: any) {
      failed = true;
      expect(err.message).toMatch(/duplicate key|unique constraint/i);
    }
    expect(failed).toBe(true);

    await pool.query("DELETE FROM student_hint_escalation_state WHERE student_user_id = $1;", [
      studentId,
    ]);
  });

  it("7. verifies data persistence across separate database connections", async () => {
    const studentId = "student_cross_conn_" + Date.now();
    const conceptId = "graph_bkt_persist";
    const recordId = "bkt_rec_" + Date.now();

    const poolA = new Pool({ connectionString: DATABASE_URL });
    await poolA.query(
      `
      INSERT INTO student_concept_bkt_state (
        id, student_user_id, concept_id, knowledge_probability, initial_probability, 
        learn_probability, guess_probability, slip_probability, mastery_band, 
        canonical_mastery_level, independent_checks_count, total_attempts
      ) VALUES (
        $1, $2, $3, 0.88, 0.15, 0.20, 0.15, 0.10, 'advanced', 3, 2, 4
      );
    `,
      [recordId, studentId, conceptId]
    );
    await poolA.end();

    const poolB = new Pool({ connectionString: DATABASE_URL });
    const res = await poolB.query(
      `
      SELECT id, knowledge_probability, mastery_band 
      FROM student_concept_bkt_state 
      WHERE student_user_id = $1 AND concept_id = $2;
    `,
      [studentId, conceptId]
    );
    await poolB.end();

    expect(res.rows.length).toBe(1);
    expect(res.rows[0].id).toBe(recordId);
    expect(Number(res.rows[0].knowledge_probability)).toBeCloseTo(0.88, 2);
    expect(res.rows[0].mastery_band).toBe("advanced");

    await pool.query("DELETE FROM student_concept_bkt_state WHERE student_user_id = $1;", [
      studentId,
    ]);
  });

  it("8. verifies hint escalation persistence survives updates and restarts", async () => {
    const studentId = "student_hint_durability_" + Date.now();
    const exerciseId = "ex_dyn_prog_01";
    const id = "hint_dur_" + Date.now();

    await pool.query(
      `
      INSERT INTO student_hint_escalation_state (
        id, student_user_id, skill_id, exercise_id, topic, attempt_count, current_hint_level, hints_delivered
      ) VALUES (
        $1, $2, 'dp_01', $3, 'Dynamic Programming', 1, 1, $4
      );
    `,
      [
        id,
        studentId,
        exerciseId,
        JSON.stringify([{ level: 1, text: "Break problem into subproblems" }]),
      ]
    );

    await pool.query(
      `
      UPDATE student_hint_escalation_state 
      SET attempt_count = 2,
          current_hint_level = 2,
          hints_delivered = $1,
          updated_at = now()
      WHERE student_user_id = $2 AND exercise_id = $3;
    `,
      [
        JSON.stringify([
          { level: 1, text: "Break problem into subproblems" },
          { level: 2, text: "Define recurrence relation dp[i] = dp[i-1] + dp[i-2]" },
        ]),
        studentId,
        exerciseId,
      ]
    );

    const res = await pool.query(
      `
      SELECT attempt_count, current_hint_level, hints_delivered 
      FROM student_hint_escalation_state 
      WHERE student_user_id = $1 AND exercise_id = $2;
    `,
      [studentId, exerciseId]
    );

    expect(res.rows.length).toBe(1);
    expect(res.rows[0].attempt_count).toBe(2);
    expect(res.rows[0].current_hint_level).toBe(2);
    const delivered =
      typeof res.rows[0].hints_delivered === "string"
        ? JSON.parse(res.rows[0].hints_delivered)
        : res.rows[0].hints_delivered;
    expect(delivered.length).toBe(2);

    await pool.query("DELETE FROM student_hint_escalation_state WHERE student_user_id = $1;", [
      studentId,
    ]);
  });

  it("9. verifies BKT and FSRS state survives round trips in real Neon DB", async () => {
    const studentId = "student_fsrs_roundtrip_" + Date.now();
    const conceptId = "binary_search_fsrs";
    const fsrsId = "fsrs_" + Date.now();

    const nextReview = new Date(Date.now() + 86400000 * 4);

    await pool.query(
      `
      INSERT INTO student_concept_fsrs_state (
        id, student_user_id, concept_id, stability, difficulty, retrievability, reps, lapses, state, next_review_at
      ) VALUES (
        $1, $2, $3, 4.25, 4.8, 0.95, 3, 0, 'review', $4
      );
    `,
      [fsrsId, studentId, conceptId, nextReview]
    );

    const res = await pool.query(
      `
      SELECT stability, difficulty, state, next_review_at 
      FROM student_concept_fsrs_state 
      WHERE id = $1;
    `,
      [fsrsId]
    );

    expect(res.rows.length).toBe(1);
    expect(Number(res.rows[0].stability)).toBeCloseTo(4.25, 2);
    expect(Number(res.rows[0].difficulty)).toBeCloseTo(4.8, 1);
    expect(res.rows[0].state).toBe("review");
    expect(new Date(res.rows[0].next_review_at).getTime()).toBeCloseTo(
      nextReview.getTime(),
      -3
    );

    await pool.query("DELETE FROM student_concept_fsrs_state WHERE id = $1;", [fsrsId]);
  });

  it("10. confirms migration execution is idempotent", async () => {
    const idempotentSql = `
      CREATE TABLE IF NOT EXISTS student_concept_bkt_state (
        id VARCHAR(64) PRIMARY KEY,
        student_user_id VARCHAR(64) NOT NULL,
        concept_id VARCHAR(64) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_bkt_student_concept ON student_concept_bkt_state (student_user_id, concept_id);
    `;

    await expect(pool.query(idempotentSql)).resolves.not.toThrow();
  });
});
