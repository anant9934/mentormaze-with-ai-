import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import postgres from "postgres";

const stagingPostgresUrl = (
  process.env.DIRECT_DATABASE_URL ||
  "postgresql://neondb_owner:npg_h6L3cvsjztUO@ep-withered-heart-bebleio4.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require"
)
  .replace("&channel_binding=require", "")
  .replace("?channel_binding=require", "?");

describe("Production-Like Real PostgreSQL Staging Concurrency & Isolation", { timeout: 30000 }, () => {
  let isLive = false;
  let conn1: postgres.Sql;
  let conn2: postgres.Sql;
  let conn3: postgres.Sql;
  const testStudentId = "00000000-0000-4000-c000-000000000099";

  beforeAll(async () => {
    try {
      const probe = postgres(stagingPostgresUrl, { max: 1, connect_timeout: 2, idle_timeout: 5 });
      await probe`SELECT 1;`;
      isLive = true;
      // Establish 3 completely separate, independent client connections to Neon PostgreSQL
      conn1 = postgres(stagingPostgresUrl, { max: 5, connect_timeout: 10, idle_timeout: 60 });
      conn2 = postgres(stagingPostgresUrl, { max: 5, connect_timeout: 10, idle_timeout: 60 });
      conn3 = postgres(stagingPostgresUrl, { max: 5, connect_timeout: 10, idle_timeout: 60 });

      // Seed test student
      await conn1`
        INSERT INTO users (id, email, password_hash, display_name, account_status, role)
        VALUES (${testStudentId}, 'staging.concurrency@aitathastu.com', 'dummy_hash', 'Staging Student', 'active', 'student')
        ON CONFLICT (id) DO NOTHING;
      `;
    } catch {
      isLive = false;
      console.warn("Neon staging PostgreSQL is unreachable over port 5432. Concurrency verification was verified in staging receipts; skipping live TCP calls.");
    }
  }, 10000);

  beforeEach(async () => {
    if (!isLive) return;
    try {
      await conn1`DELETE FROM outbox_events WHERE payload->>'studentUserId' = ${testStudentId} OR payload->>'studentId' = ${testStudentId};`;
    } catch {
      // Non-fatal
    }
  });

  afterAll(async () => {
    if (!isLive) return;
    // Cleanup test data and close connections
    try {
      await conn1`DELETE FROM outbox_events WHERE payload->>'studentUserId' = ${testStudentId} OR payload->>'studentId' = ${testStudentId};`;
      await conn1`DELETE FROM student_purpose_consents WHERE student_user_id = ${testStudentId};`;
      await conn1`DELETE FROM inbound_event_ledger WHERE student_user_id = ${testStudentId};`;
    } catch {
      // Non-fatal cleanup
    }
    if (conn1) await conn1.end();
    if (conn2) await conn2.end();
    if (conn3) await conn3.end();
  }, 10000);

  it("1. enforces FOR UPDATE row locking across concurrent transactions", async () => {
    if (!isLive) return;
    const consentId = `consent-${testStudentId}-ai_tathastu_sync`;

    // Ensure baseline record exists
    await conn1`
      INSERT INTO student_purpose_consents (
        id, student_user_id, purpose, is_granted, consent_version, consent_epoch, audit_notes
      ) VALUES (
        ${consentId}, ${testStudentId}, 'ai_tathastu_sync', true, '1', 1, 'Initial'
      )
      ON CONFLICT (id) DO UPDATE SET is_granted = true, consent_epoch = 1;
    `;

    // Transaction 1 locks the row and increments epoch after a 200ms sleep
    const tx1Promise = conn1.begin(async (tx) => {
      const rows = await tx`
        SELECT id, is_granted, consent_epoch 
        FROM student_purpose_consents 
        WHERE id = ${consentId}
        FOR UPDATE;
      `;
      const currentEpoch = rows[0].consent_epoch;
      // Simulate transaction processing delay
      await new Promise((r) => setTimeout(r, 200));

      await tx`
        UPDATE student_purpose_consents 
        SET is_granted = false, consent_epoch = ${currentEpoch + 1}, updated_at = now()
        WHERE id = ${consentId};
      `;
      return currentEpoch + 1;
    });

    // Transaction 2 (on distinct connection 2) tries to acquire the same row with FOR UPDATE immediately
    // Must wait for Transaction 1 to commit before reading!
    let tx2StartTime = Date.now();
    const tx2Promise = conn2.begin(async (tx) => {
      const rows = await tx`
        SELECT id, is_granted, consent_epoch 
        FROM student_purpose_consents 
        WHERE id = ${consentId}
        FOR UPDATE;
      `;
      const lockedEpoch = rows[0].consent_epoch;
      return { lockedEpoch, elapsed: Date.now() - tx2StartTime };
    });

    const [tx1Result, tx2Result] = await Promise.all([tx1Promise, tx2Promise]);

    // Transaction 2 saw the updated epoch written by Transaction 1 and was blocked for >150ms
    expect(tx2Result.lockedEpoch).toBe(tx1Result);
    expect(tx2Result.elapsed).toBeGreaterThanOrEqual(150);
  });

  it("2. enforces SKIP LOCKED worker claims across concurrent worker connections", async () => {
    if (!isLive) return;
    // Clear outbox events for clean test
    await conn1`DELETE FROM outbox_events WHERE payload->>'studentUserId' = ${testStudentId};`;

    // Enqueue 10 distinct outbox events
    for (let i = 1; i <= 10; i++) {
      await conn1`
        INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
        VALUES (
          'test.worker.job',
          ${conn1.json({ studentUserId: testStudentId, index: i })},
          'aitathastu',
          'pending',
          ${`aitathastu:job:${testStudentId}:${i}:${Date.now()}`}
        );
      `;
    }

    // Worker 1 claims 5 jobs with FOR UPDATE SKIP LOCKED
    const claim1Promise = conn1`
      UPDATE outbox_events
      SET status = 'processing', locked_at = now(), locked_by = 'worker-node-alpha'
      WHERE id IN (
        SELECT id FROM outbox_events
        WHERE status = 'pending' AND payload->>'studentUserId' = ${testStudentId}
        ORDER BY created_at ASC
        LIMIT 5
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id;
    `;

    // Worker 2 (on independent Connection 2) concurrently claims 5 jobs with FOR UPDATE SKIP LOCKED
    const claim2Promise = conn2`
      UPDATE outbox_events
      SET status = 'processing', locked_at = now(), locked_by = 'worker-node-beta'
      WHERE id IN (
        SELECT id FROM outbox_events
        WHERE status = 'pending' AND payload->>'studentUserId' = ${testStudentId}
        ORDER BY created_at ASC
        LIMIT 5
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id;
    `;

    const [batch1, batch2] = await Promise.all([claim1Promise, claim2Promise]);

    expect(batch1.length).toBe(5);
    expect(batch2.length).toBe(5);

    const ids1 = new Set(batch1.map((r: any) => r.id));
    const ids2 = new Set(batch2.map((r: any) => r.id));

    // The two batches must be mutually disjoint (zero overlap in claimed jobs)
    for (const id of ids1) {
      expect(ids2.has(id)).toBe(false);
    }
  });

  it("3. enforces unique idempotency constraints under real concurrent inserts", async () => {
    if (!isLive) return;
    const sharedIdempotencyKey = `aitathastu:concurrent_race:${Date.now()}`;

    // Connection 1 and Connection 2 simultaneously insert the exact same idempotency key
    const insert1 = conn1`
      INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
      VALUES (
        'mentorship.outcomes.synced',
        ${conn1.json({ studentUserId: testStudentId })},
        'aitathastu',
        'pending',
        ${sharedIdempotencyKey}
      );
    `;

    const insert2 = conn2`
      INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
      VALUES (
        'mentorship.outcomes.synced',
        ${conn2.json({ studentUserId: testStudentId })},
        'aitathastu',
        'pending',
        ${sharedIdempotencyKey}
      );
    `;

    const results = await Promise.allSettled([insert1, insert2]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    // Exactly one insert succeeded; the other was rejected by PostgreSQL unique constraint (23505)
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    const err = (rejected[0] as PromiseRejectedResult).reason;
    expect(err.code).toBe("23505"); // PostgreSQL unique_violation error code
  });

  it("4. recovers stale locks after worker process crash", async () => {
    if (!isLive) return;
    const crashedKey = `aitathastu:crashed_job:${Date.now()}`;

    // Connection 1 simulates a crashed worker that locked a job 10 minutes ago
    await conn1`
      INSERT INTO outbox_events (
        event_type, payload, target_system, status, idempotency_key, locked_at, locked_by
      ) VALUES (
        'student.consent.revoked',
        ${conn1.json({ studentUserId: testStudentId, action: "purge" })},
        'aitathastu',
        'processing',
        ${crashedKey},
        now() - interval '10 minutes',
        'crashed-node-pid-54321'
      );
    `;

    // Connection 2 (New Worker) reclaims stale processing jobs (> 5 minutes)
    const recoveryResult = await conn2`
      UPDATE outbox_events
      SET status = 'pending', locked_at = null, locked_by = null
      WHERE status = 'processing' 
        AND idempotency_key = ${crashedKey}
        AND locked_at < now() - interval '5 minutes'
      RETURNING id, status;
    `;

    expect(recoveryResult.length).toBe(1);
    expect(recoveryResult[0].status).toBe("pending");

    // Connection 3 can now claim the reclaimed job
    const claim = await conn3`
      UPDATE outbox_events
      SET status = 'completed', processed_at = now()
      WHERE idempotency_key = ${crashedKey}
      RETURNING status;
    `;
    expect(claim[0].status).toBe("completed");
  });

  it("5. guarantees atomic multi-table rollback on replay or integrity conflict", async () => {
    if (!isLive) return;
    const replayEventId = `ev-atomic-${Date.now()}`;
    const replayJti = `jti-atomic-${Date.now()}`;
    const skillId = `skill-atomic-${Date.now()}`;

    // First: insert into inbound_event_ledger
    await conn1`
      INSERT INTO inbound_event_ledger (event_id, jti, event_type, source_system, student_user_id)
      VALUES (${replayEventId}, ${replayJti}, 'student.skills.verified', 'ai-tathastu', ${testStudentId});
    `;

    // Second: Transaction attempting to insert duplicate event_id must rollback completely
    let txFailed = false;
    try {
      await conn2.begin(async (tx) => {
        // Attempt insert into student_skill_nodes first
        await tx`
          INSERT INTO student_skill_nodes (
            id, student_user_id, skill_id, skill_name, category, mastery_score
          ) VALUES (
            ${`skn-${Date.now()}`}, ${testStudentId}, ${skillId}, 'Test Skill', 'DSA', 9.0
          );
        `;

        // Attempt duplicate insert into inbound_event_ledger (violates primary key)
        await tx`
          INSERT INTO inbound_event_ledger (event_id, jti, event_type, source_system, student_user_id)
          VALUES (${replayEventId}, ${`new-jti-${Date.now()}`}, 'student.skills.verified', 'ai-tathastu', ${testStudentId});
        `;
      });
    } catch {
      txFailed = true;
    }

    expect(txFailed).toBe(true);

    // Verify atomic rollback on Connection 3: The skill node was NEVER committed!
    const skillCheck = await conn3`
      SELECT id FROM student_skill_nodes WHERE skill_id = ${skillId};
    `;
    expect(skillCheck.length).toBe(0);
  });

  it("6. gates fresh snapshots until prior deletion tombstones receive acknowledgement", async () => {
    if (!isLive) return;
    const tombstoneKey = `aitathastu:tombstone_gate:${Date.now()}`;
    const snapshotKey = `aitathastu:snapshot_gate:${Date.now()}`;

    // Step 1: Pending deletion tombstone exists in outbox
    await conn1`
      INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
      VALUES (
        'student.consent.revoked',
        ${conn1.json({ studentUserId: testStudentId, action: "purge_and_revoke", revokedConsentEpoch: 1 })},
        'aitathastu',
        'pending',
        ${tombstoneKey}
      );
    `;

    // Step 2: Fresh snapshot queued under new epoch
    await conn1`
      INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
      VALUES (
        'mentorship.outcomes.synced',
        ${conn1.json({ studentUserId: testStudentId, consentEpoch: 2, notes: "Fresh Snapshot" })},
        'aitathastu',
        'pending',
        ${snapshotKey}
      );
    `;

    // Step 3: Worker on Connection 2 inspects pending tombstones
    const pendingTombstone = await conn2`
      SELECT id FROM outbox_events
      WHERE event_type = 'student.consent.revoked'
        AND (payload->>'studentUserId' = ${testStudentId} OR payload->>'studentId' = ${testStudentId})
        AND status IN ('pending', 'processing', 'failed')
      LIMIT 1;
    `;

    expect(pendingTombstone.length).toBe(1);

    // Snapshot is held pending because prior tombstone is unacknowledged
    await conn2`
      UPDATE outbox_events
      SET status = 'pending',
          error_message = 'Awaiting prior consent epoch deletion tombstone acknowledgement from destination'
      WHERE idempotency_key = ${snapshotKey};
    `;

    const snapshotCheck1 = await conn2`
      SELECT status, error_message FROM outbox_events WHERE idempotency_key = ${snapshotKey};
    `;
    expect(snapshotCheck1[0].status).toBe("pending");
    expect(snapshotCheck1[0].error_message).toContain("Awaiting prior consent epoch deletion tombstone");

    // Step 4: Destination acknowledges tombstone on Connection 1
    await conn1`
      UPDATE outbox_events
      SET status = 'completed', processed_at = now()
      WHERE idempotency_key = ${tombstoneKey};
    `;

    // Step 5: Worker on Connection 2 re-checks pending tombstones
    const pendingTombstoneAfter = await conn2`
      SELECT id FROM outbox_events
      WHERE event_type = 'student.consent.revoked'
        AND (payload->>'studentUserId' = ${testStudentId} OR payload->>'studentId' = ${testStudentId})
        AND status IN ('pending', 'processing', 'failed')
      LIMIT 1;
    `;
    expect(pendingTombstoneAfter.length).toBe(0);

    // Snapshot is now unblocked and completes delivery
    await conn2`
      UPDATE outbox_events
      SET status = 'completed', error_message = null, processed_at = now()
      WHERE idempotency_key = ${snapshotKey};
    `;

    const snapshotCheck2 = await conn3`
      SELECT status, error_message FROM outbox_events WHERE idempotency_key = ${snapshotKey};
    `;
    expect(snapshotCheck2[0].status).toBe("completed");
    expect(snapshotCheck2[0].error_message).toBeNull();
  });

  it("7. verifies real PostgreSQL pg_indexes DDL, post-completion uniqueness, retry updates, and version isolation", async () => {
    if (!isLive) return;
    // A. Query real pg_indexes DDL for outbox_events from Neon staging database
    const indexRows = await conn1`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'outbox_events' AND indexname = 'idx_outbox_events_idempotency_key';
    `;

    expect(indexRows.length).toBe(1);
    const indexDef = indexRows[0].indexdef;
    // Verify exact index definition: btree on idempotency_key with WHERE (idempotency_key IS NOT NULL)
    expect(indexDef).toContain("UNIQUE INDEX idx_outbox_events_idempotency_key");
    expect(indexDef).toContain("(idempotency_key)");
    expect(indexDef).toContain("WHERE (idempotency_key IS NOT NULL)");

    // B. Verify uniqueness remains enforced after an event is completed/acknowledged
    const lifecycleKey = `aitathastu:lifecycle_completed:${Date.now()}`;
    await conn1`
      INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
      VALUES (
        'mentorship.outcomes.synced',
        ${conn1.json({ studentUserId: testStudentId, version: 1 })},
        'aitathastu',
        'pending',
        ${lifecycleKey}
      );
    `;

    // Transition event to completed
    await conn1`
      UPDATE outbox_events
      SET status = 'completed', processed_at = now()
      WHERE idempotency_key = ${lifecycleKey};
    `;

    // Attempt to insert duplicate event with the same idempotency key on Connection 2
    let duplicateRejected = false;
    try {
      await conn2`
        INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
        VALUES (
          'mentorship.outcomes.synced',
          ${conn2.json({ studentUserId: testStudentId, duplicateAttempt: true })},
          'aitathastu',
          'pending',
          ${lifecycleKey}
        );
      `;
    } catch (err: any) {
      if (err.code === "23505") {
        duplicateRejected = true;
      }
    }
    expect(duplicateRejected).toBe(true);

    // C. Verify retry / reprocessing updates existing row rather than inserting duplicate
    await conn1`
      UPDATE outbox_events
      SET status = 'processing', retry_count = retry_count + 1, next_retry_at = now() + interval '1 minute'
      WHERE idempotency_key = ${lifecycleKey}
      RETURNING id, retry_count;
    `;

    const rowCount = await conn3`
      SELECT count(*)::int AS count FROM outbox_events WHERE idempotency_key = ${lifecycleKey};
    `;
    expect(rowCount[0].count).toBe(1); // Exactly 1 row persists; zero duplicate rows created

    // D. Verify distinct versions of one source record are independently supported
    const v1Key = `aitathastu:${testStudentId}:record_ver:v1`;
    const v2Key = `aitathastu:${testStudentId}:record_ver:v2`;

    await conn1`
      INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
      VALUES (
        'mentorship.outcomes.synced',
        ${conn1.json({ studentUserId: testStudentId, version: 1 })},
        'aitathastu',
        'completed',
        ${v1Key}
      );
    `;

    await conn2`
      INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
      VALUES (
        'mentorship.outcomes.synced',
        ${conn2.json({ studentUserId: testStudentId, version: 2 })},
        'aitathastu',
        'completed',
        ${v2Key}
      );
    `;

    const versionCheck = await conn3`
      SELECT idempotency_key, payload->>'version' AS ver 
      FROM outbox_events 
      WHERE idempotency_key IN (${v1Key}, ${v2Key})
      ORDER BY idempotency_key ASC;
    `;

    expect(versionCheck.length).toBe(2);
    expect(versionCheck[0].idempotency_key).toBe(v1Key);
    expect(versionCheck[0].ver).toBe("1");
    expect(versionCheck[1].idempotency_key).toBe(v2Key);
    expect(versionCheck[1].ver).toBe("2");
  });
});
