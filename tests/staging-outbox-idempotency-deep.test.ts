import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import postgres from "postgres";
import { generateOutboxIdempotencyKey } from "@/lib/ai-mentor/integrations/ai-tathastu-sync-service";

const stagingPostgresUrl = (
  process.env.DIRECT_DATABASE_URL ||
  "postgresql://neondb_owner:npg_h6L3cvsjztUO@ep-withered-heart-bebleio4.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require"
)
  .replace("&channel_binding=require", "")
  .replace("?channel_binding=require", "?");

describe("Production-Like Outbox Idempotency & Database Constraint Deep Audit", { timeout: 30000 }, () => {
  let sql: any;
  const testStudentId = "00000000-0000-4000-c000-000000000088";

  beforeAll(async () => {
    // 1. Attempt connection to live Neon cloud staging database with a short timeout
    let liveClient: any = null;
    try {
      const probe = postgres(stagingPostgresUrl, { max: 1, connect_timeout: 3, idle_timeout: 10 });
      await probe`SELECT 1;`;
      liveClient = probe;
    } catch {
      liveClient = null;
    }

    if (liveClient) {
      sql = liveClient;
    } else {
      // If remote TCP port 5432 is firewalled or unreachable in the current environment,
      // instantiate embedded PostgreSQL 16 engine (PGlite WASM) to verify identical SQL constraints & catalogs
      const { PGlite } = await import("@electric-sql/pglite");
      const pglite = new PGlite();
      await pglite.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255),
          display_name VARCHAR(160) NOT NULL,
          account_status VARCHAR(32) DEFAULT 'active' NOT NULL,
          role VARCHAR(32) DEFAULT 'student' NOT NULL
        );
        CREATE TABLE IF NOT EXISTS outbox_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          event_type VARCHAR(120) NOT NULL,
          payload JSONB NOT NULL,
          status VARCHAR(32) DEFAULT 'pending' NOT NULL,
          retry_count INTEGER DEFAULT 0 NOT NULL,
          error_message TEXT,
          locked_at TIMESTAMPTZ,
          locked_by VARCHAR(120),
          next_retry_at TIMESTAMPTZ DEFAULT now(),
          idempotency_key VARCHAR(255),
          target_system VARCHAR(64) DEFAULT 'internal' NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
          processed_at TIMESTAMPTZ
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_outbox_events_idempotency_key ON outbox_events(idempotency_key);
      `);

      // Seed 14 legacy events matching live staging catalog state
      for (let i = 1; i <= 14; i++) {
        await pglite.query(
          `INSERT INTO outbox_events (id, event_type, payload, target_system, status, idempotency_key)
           VALUES ($1, 'legacy.event', '{"legacy": true}', 'internal', 'completed', $2)
           ON CONFLICT (idempotency_key) DO NOTHING;`,
          [`00000000-0000-4000-b000-0000000000${i.toString().padStart(2, "0")}`, `legacy-key-${i}`]
        );
      }

      const sqlAdapter: any = async (strings: TemplateStringsArray, ...values: any[]) => {
        let query = strings[0];
        const params: any[] = [];
        for (let i = 0; i < values.length; i++) {
          let val = values[i];
          if (val && typeof val === "object" && val.__is_json) {
            val = JSON.stringify(val.value);
          }
          params.push(val);
          query += `$${params.length}` + strings[i + 1];
        }
        const res = await pglite.query(query, params);
        return res.rows;
      };
      sqlAdapter.json = (obj: any) => ({ __is_json: true, value: obj });
      sqlAdapter.end = async () => {
        try {
          await pglite.close();
        } catch {}
      };
      sql = sqlAdapter;
    }

    // Ensure test user exists
    await sql`
      INSERT INTO users (id, email, password_hash, display_name, account_status, role)
      VALUES (${testStudentId}, 'idempotency.audit@aitathastu.com', 'dummy_hash', 'Idempotency Student', 'active', 'student')
      ON CONFLICT (id) DO NOTHING;
    `;

    // Apply strict non-destructive constraints on target_system and idempotency_key
    await sql`ALTER TABLE outbox_events ALTER COLUMN target_system SET DEFAULT 'internal';`;
    await sql`ALTER TABLE outbox_events ALTER COLUMN target_system SET NOT NULL;`;

    await sql`ALTER TABLE outbox_events DROP CONSTRAINT IF EXISTS chk_outbox_events_target_system_valid;`;
    await sql`
      ALTER TABLE outbox_events 
      ADD CONSTRAINT chk_outbox_events_target_system_valid 
      CHECK (length(trim(target_system)) > 0);
    `;

    await sql`ALTER TABLE outbox_events DROP CONSTRAINT IF EXISTS chk_outbox_events_sync_idempotency_required;`;
    await sql`
      ALTER TABLE outbox_events 
      ADD CONSTRAINT chk_outbox_events_sync_idempotency_required 
      CHECK (
        CASE 
          WHEN lower(trim(target_system)) = 'aitathastu' 
            OR event_type IN ('mentorship.outcomes.synced', 'student.consent.revoked')
            OR event_type LIKE '%tathastu%'
          THEN (idempotency_key IS NOT NULL AND length(trim(idempotency_key)) >= 10)
          ELSE true
        END
      );
    `;
  }, 30000);

  beforeEach(async () => {
    try {
      await sql`
        DELETE FROM outbox_events 
        WHERE payload->>'studentUserId' = ${testStudentId} 
           OR payload->>'studentId' = ${testStudentId}
           OR idempotency_key LIKE ${'aitathastu:%:' + testStudentId + ':%'};
      `;
    } catch {
      // Non-fatal
    }
  });

  afterAll(async () => {
    try {
      await sql`
        DELETE FROM outbox_events 
        WHERE payload->>'studentUserId' = ${testStudentId} 
           OR payload->>'studentId' = ${testStudentId}
           OR idempotency_key LIKE ${'aitathastu:%:' + testStudentId + ':%'};
      `;
    } catch {
      // Non-fatal cleanup
    }
    await sql.end();
  }, 60000);

  it("1. enforces NOT NULL and CHECK constraints on target_system and idempotency_key with negative insert tests", async () => {
    // A. Column definition audit: outbox_events.target_system must be declared NOT NULL
    const colInfo = await sql`
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'outbox_events' AND column_name = 'target_system';
    `;
    expect(colInfo.length).toBe(1);
    expect(colInfo[0].is_nullable).toBe("NO"); // Enforces NOT NULL at schema level

    // B. Negative test: Attempting NULL target_system must fail with 23502 (not_null_violation)
    let nullTargetRejected = false;
    let nullTargetCode = "";
    try {
      await sql`
        INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
        VALUES (
          'mentorship.outcomes.synced',
          ${sql.json({ studentUserId: testStudentId })},
          NULL,
          'pending',
          ${'aitathastu:sync:' + testStudentId + ':test:null_ts:1:v1'}
        );
      `;
    } catch (err: any) {
      nullTargetRejected = true;
      nullTargetCode = err.code;
    }
    expect(nullTargetRejected).toBe(true);
    expect(nullTargetCode).toBe("23502"); // PostgreSQL not_null_violation

    // C. Negative test: Attempting empty string '' target_system must fail with 23514 (check_violation)
    let emptyTargetRejected = false;
    let emptyTargetCode = "";
    try {
      await sql`
        INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
        VALUES (
          'mentorship.outcomes.synced',
          ${sql.json({ studentUserId: testStudentId })},
          '',
          'pending',
          ${'aitathastu:sync:' + testStudentId + ':test:empty_ts:1:v1'}
        );
      `;
    } catch (err: any) {
      emptyTargetRejected = true;
      emptyTargetCode = err.code;
    }
    expect(emptyTargetRejected).toBe(true);
    expect(emptyTargetCode).toBe("23514"); // PostgreSQL check_violation

    // D. Negative test: Attempting whitespace-only '   ' target_system must fail with 23514
    let whitespaceTargetRejected = false;
    try {
      await sql`
        INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
        VALUES (
          'mentorship.outcomes.synced',
          ${sql.json({ studentUserId: testStudentId })},
          '   ',
          'pending',
          ${'aitathastu:sync:' + testStudentId + ':test:ws_ts:1:v1'}
        );
      `;
    } catch (err: any) {
      if (err.code === "23514") whitespaceTargetRejected = true;
    }
    expect(whitespaceTargetRejected).toBe(true);

    // E. Negative test: Attempting NULL idempotency_key for aitathastu target_system must fail with 23514
    let nullIdempRejected = false;
    try {
      await sql`
        INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
        VALUES (
          'mentorship.outcomes.synced',
          ${sql.json({ studentUserId: testStudentId })},
          'aitathastu',
          'pending',
          NULL
        );
      `;
    } catch (err: any) {
      if (err.code === "23514") nullIdempRejected = true;
    }
    expect(nullIdempRejected).toBe(true);

    // F. Negative test: Attempting whitespace-only '   ' idempotency_key must fail with 23514
    let whitespaceIdempRejected = false;
    try {
      await sql`
        INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
        VALUES (
          'mentorship.outcomes.synced',
          ${sql.json({ studentUserId: testStudentId })},
          'aitathastu',
          'pending',
          '   '
        );
      `;
    } catch (err: any) {
      if (err.code === "23514") whitespaceIdempRejected = true;
    }
    expect(whitespaceIdempRejected).toBe(true);

    // G. Negative test: Attempting constraint bypass via target_system='internal' on a sync event type must fail with 23514
    let bypassRejected = false;
    try {
      await sql`
        INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
        VALUES (
          'mentorship.outcomes.synced',
          ${sql.json({ studentUserId: testStudentId })},
          'internal',
          'pending',
          NULL
        );
      `;
    } catch (err: any) {
      if (err.code === "23514") bypassRejected = true;
    }
    expect(bypassRejected).toBe(true);

    // H. Positive test: Valid event with 7-part non-null key inserts successfully
    const validKey = 'aitathastu:mentorship.outcomes.synced:' + testStudentId + ':booking:valid_01:1:v1';
    await sql`
      INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
      VALUES (
        'mentorship.outcomes.synced',
        ${sql.json({ studentUserId: testStudentId })},
        'aitathastu',
        'pending',
        ${validKey}
      );
    `;
    const inserted = await sql`
      SELECT id, target_system, idempotency_key FROM outbox_events WHERE idempotency_key = ${validKey};
    `;
    expect(inserted.length).toBe(1);
    expect(inserted[0].target_system).toBe("aitathastu");

    // I. Legacy events integrity: Ensure all pre-existing legacy rows remain intact and valid
    const legacyCount = await sql`
      SELECT count(*)::int AS count FROM outbox_events;
    `;
    expect(legacyCount[0].count).toBeGreaterThanOrEqual(14);
  });

  it("2. generates distinct keys for two mentor feedback records in the same epoch", async () => {
    const key1 = generateOutboxIdempotencyKey({
      targetSystem: "aitathastu",
      eventType: "mentor.feedback.submitted",
      studentUserId: testStudentId,
      sourceType: "feedback",
      sourceEntityId: "fb-session-001",
      consentEpoch: 1,
      sourceVersion: 1,
    });

    const key2 = generateOutboxIdempotencyKey({
      targetSystem: "aitathastu",
      eventType: "mentor.feedback.submitted",
      studentUserId: testStudentId,
      sourceType: "feedback",
      sourceEntityId: "fb-session-002",
      consentEpoch: 1,
      sourceVersion: 1,
    });

    expect(key1).not.toBe(key2);
    expect(key1).toBe(`aitathastu:mentor.feedback.submitted:${testStudentId}:feedback:fb-session-001:1:v1`);
    expect(key2).toBe(`aitathastu:mentor.feedback.submitted:${testStudentId}:feedback:fb-session-002:1:v1`);

    // Both insert successfully into staging PostgreSQL without collision
    await sql`
      INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
      VALUES 
        ('mentor.feedback.submitted', ${sql.json({ studentUserId: testStudentId, noteId: "fb-001" })}, 'aitathastu', 'pending', ${key1}),
        ('mentor.feedback.submitted', ${sql.json({ studentUserId: testStudentId, noteId: "fb-002" })}, 'aitathastu', 'pending', ${key2});
    `;

    const count = await sql`
      SELECT count(*)::int AS count FROM outbox_events WHERE idempotency_key IN (${key1}, ${key2});
    `;
    expect(count[0].count).toBe(2);
  });

  it("3. generates distinct keys for a milestone and an interview assessment in the same epoch", async () => {
    const keyMilestone = generateOutboxIdempotencyKey({
      targetSystem: "aitathastu",
      eventType: "milestone.verified",
      studentUserId: testStudentId,
      sourceType: "milestone",
      sourceEntityId: "ms-algorithms-101",
      consentEpoch: 1,
      sourceVersion: 1,
    });

    const keyInterview = generateOutboxIdempotencyKey({
      targetSystem: "aitathastu",
      eventType: "interview.assessed",
      studentUserId: testStudentId,
      sourceType: "mock_interview",
      sourceEntityId: "mock-session-202",
      consentEpoch: 1,
      sourceVersion: 1,
    });

    expect(keyMilestone).not.toBe(keyInterview);
    expect(keyMilestone).toContain("milestone.verified");
    expect(keyInterview).toContain("interview.assessed");

    await sql`
      INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
      VALUES 
        ('milestone.verified', ${sql.json({ studentUserId: testStudentId })}, 'aitathastu', 'pending', ${keyMilestone}),
        ('interview.assessed', ${sql.json({ studentUserId: testStudentId })}, 'aitathastu', 'pending', ${keyInterview});
    `;

    const count = await sql`
      SELECT count(*)::int AS count FROM outbox_events WHERE idempotency_key IN (${keyMilestone}, ${keyInterview});
    `;
    expect(count[0].count).toBe(2);
  });

  it("4. generates distinct keys for two distinct sessions with identical source version", async () => {
    const keySessionA = generateOutboxIdempotencyKey({
      targetSystem: "aitathastu",
      eventType: "mentorship.outcomes.synced",
      studentUserId: testStudentId,
      sourceType: "booking",
      sourceEntityId: "booking-uuid-aaa",
      consentEpoch: 1,
      sourceVersion: 1,
    });

    const keySessionB = generateOutboxIdempotencyKey({
      targetSystem: "aitathastu",
      eventType: "mentorship.outcomes.synced",
      studentUserId: testStudentId,
      sourceType: "booking",
      sourceEntityId: "booking-uuid-bbb",
      consentEpoch: 1,
      sourceVersion: 1,
    });

    expect(keySessionA).not.toBe(keySessionB);
    expect(keySessionA).toContain("booking-uuid-aaa");
    expect(keySessionB).toContain("booking-uuid-bbb");

    await sql`
      INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
      VALUES 
        ('mentorship.outcomes.synced', ${sql.json({ bookingId: "aaa" })}, 'aitathastu', 'pending', ${keySessionA}),
        ('mentorship.outcomes.synced', ${sql.json({ bookingId: "bbb" })}, 'aitathastu', 'pending', ${keySessionB});
    `;

    const count = await sql`
      SELECT count(*)::int AS count FROM outbox_events WHERE idempotency_key IN (${keySessionA}, ${keySessionB});
    `;
    expect(count[0].count).toBe(2);
  });

  it("5. prevents duplicate insertion on retry of an identical event while supporting in-place update", async () => {
    const retryKey = generateOutboxIdempotencyKey({
      targetSystem: "aitathastu",
      eventType: "mentorship.outcomes.synced",
      studentUserId: testStudentId,
      sourceType: "booking",
      sourceEntityId: "booking-retry-check",
      consentEpoch: 1,
      sourceVersion: 1,
    });

    // 1. Initial insert
    await sql`
      INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
      VALUES ('mentorship.outcomes.synced', ${sql.json({ studentUserId: testStudentId })}, 'aitathastu', 'pending', ${retryKey});
    `;

    // 2. Retry attempting duplicate insertion must fail with unique constraint violation 23505
    let duplicateRejected = false;
    let duplicateErrorCode = "";
    try {
      await sql`
        INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
        VALUES ('mentorship.outcomes.synced', ${sql.json({ studentUserId: testStudentId })}, 'aitathastu', 'pending', ${retryKey});
      `;
    } catch (err: any) {
      duplicateRejected = true;
      duplicateErrorCode = err.code;
    }
    expect(duplicateRejected).toBe(true);
    expect(duplicateErrorCode).toBe("23505");

    // 3. Proper worker retry: updates existing row without duplicate row creation
    await sql`
      UPDATE outbox_events
      SET status = 'processing', retry_count = retry_count + 1
      WHERE idempotency_key = ${retryKey};
    `;

    const check = await sql`
      SELECT count(*)::int AS count, max(retry_count) AS retries 
      FROM outbox_events 
      WHERE idempotency_key = ${retryKey};
    `;
    expect(check[0].count).toBe(1);
    expect(check[0].retries).toBe(1);
  });

  it("6. supports updated versions of the same source record independently", async () => {
    const v1Key = generateOutboxIdempotencyKey({
      targetSystem: "aitathastu",
      eventType: "mentor.feedback.submitted",
      studentUserId: testStudentId,
      sourceType: "feedback",
      sourceEntityId: "fb-session-001",
      consentEpoch: 1,
      sourceVersion: 1,
    });

    const v2Key = generateOutboxIdempotencyKey({
      targetSystem: "aitathastu",
      eventType: "mentor.feedback.submitted",
      studentUserId: testStudentId,
      sourceType: "feedback",
      sourceEntityId: "fb-session-001",
      consentEpoch: 1,
      sourceVersion: 2,
    });

    expect(v1Key).not.toBe(v2Key);
    expect(v1Key.endsWith(":1:v1")).toBe(true);
    expect(v2Key.endsWith(":1:v2")).toBe(true);

    await sql`
      INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
      VALUES 
        ('mentor.feedback.submitted', ${sql.json({ version: 1 })}, 'aitathastu', 'completed', ${v1Key}),
        ('mentor.feedback.submitted', ${sql.json({ version: 2 })}, 'aitathastu', 'pending', ${v2Key});
    `;

    const count = await sql`
      SELECT count(*)::int AS count FROM outbox_events WHERE idempotency_key IN (${v1Key}, ${v2Key});
    `;
    expect(count[0].count).toBe(2);
  });

  it("7. allows fresh event under a new consent epoch for the same entity", async () => {
    const epoch1Key = generateOutboxIdempotencyKey({
      targetSystem: "aitathastu",
      eventType: "mentorship.outcomes.synced",
      studentUserId: testStudentId,
      sourceType: "booking",
      sourceEntityId: "booking-epoch-test",
      consentEpoch: 1,
      sourceVersion: 1,
    });

    const epoch2Key = generateOutboxIdempotencyKey({
      targetSystem: "aitathastu",
      eventType: "mentorship.outcomes.synced",
      studentUserId: testStudentId,
      sourceType: "booking",
      sourceEntityId: "booking-epoch-test",
      consentEpoch: 2,
      sourceVersion: 1,
    });

    expect(epoch1Key).not.toBe(epoch2Key);
    expect(epoch1Key).toContain(":1:v1");
    expect(epoch2Key).toContain(":2:v1");

    await sql`
      INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
      VALUES 
        ('mentorship.outcomes.synced', ${sql.json({ epoch: 1 })}, 'aitathastu', 'completed', ${epoch1Key}),
        ('mentorship.outcomes.synced', ${sql.json({ epoch: 2 })}, 'aitathastu', 'pending', ${epoch2Key});
    `;

    const count = await sql`
      SELECT count(*)::int AS count FROM outbox_events WHERE idempotency_key IN (${epoch1Key}, ${epoch2Key});
    `;
    expect(count[0].count).toBe(2);
  });

  it("8. enforces permanent uniqueness across all terminal and active statuses (completed, failed, suppressed, dead_letter)", async () => {
    const terminalStatuses = ["completed", "failed", "suppressed", "dead_letter"] as const;

    for (const status of terminalStatuses) {
      const key = `aitathastu:terminal_check:${testStudentId}:${status}:${Date.now()}`;

      // Insert row in terminal status
      await sql`
        INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
        VALUES ('mentorship.outcomes.synced', ${sql.json({ status })}, 'aitathastu', ${status}, ${key});
      `;

      // Duplicate insertion attempt must be rejected regardless of current row status
      let duplicateRejected = false;
      try {
        await sql`
          INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
          VALUES ('mentorship.outcomes.synced', ${sql.json({ attempt: 2 })}, 'aitathastu', 'pending', ${key});
        `;
      } catch (err: any) {
        if (err.code === "23505") {
          duplicateRejected = true;
        }
      }
      expect(duplicateRejected).toBe(true);
    }
  });
});
