import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import http from "http";
import { initializeDatabaseSchema, getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { StudentConsentService } from "@/lib/ai-mentor/student-consent-service";
import { processOutboxBatch } from "@/lib/workers/outbox-worker";

interface StagingReceivedEvent {
  endpoint: string;
  authHeader: string | null;
  body: any;
  receivedAt: string;
}

describe("AI Tathastu Staging Contract Verification with Controlled Destination", () => {
  let stagingServer: http.Server;
  let serverPort: number;
  let stagingBaseUrl: string;
  const stagingApiKey = "tathastu-stg-sec-token-2026-production-like";
  const testStudentId = "00000000-0000-4000-b000-000000000088";

  const receivedEvents: StagingReceivedEvent[] = [];
  let simulate503Outage = false;

  beforeAll(async () => {
    await initializeDatabaseSchema();
    const db = getDb();
    if (db) {
      await db
        .insert(users)
        .values({
          id: testStudentId,
          email: "staging.contract@aitathastu.com",
          displayName: "Staging Contract Student",
          role: "student",
          accountStatus: "active",
          passwordHash: "dummy",
        })
        .onConflictDoNothing();
    }

    // Start controlled HTTP Staging Destination Server
    stagingServer = http.createServer((req, res) => {
      let bodyStr = "";
      req.on("data", (chunk) => {
        bodyStr += chunk;
      });

      req.on("end", () => {
        const auth = req.headers.authorization || null;

        // Verify Bearer token authorization
        if (auth !== `Bearer ${stagingApiKey}`) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Unauthorized: Invalid or missing staging API key" }));
          return;
        }

        // Simulate temporary downstream outage
        if (simulate503Outage) {
          res.writeHead(503, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Downstream Service Unavailable (Simulated Staging Outage)" }));
          return;
        }

        let parsedBody: any = {};
        try {
          parsedBody = JSON.parse(bodyStr || "{}");
        } catch {
          // ignore
        }

        receivedEvents.push({
          endpoint: req.url || "",
          authHeader: auth,
          body: parsedBody,
          receivedAt: new Date().toISOString(),
        });

        if (req.url === "/v1/mentorship/outcomes") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              receiptId: `tathastu-stg-ack-${Date.now()}`,
              status: "acknowledged",
              syncedStudentId: parsedBody.studentUserId,
              epoch: parsedBody.consentEpoch,
              timestamp: new Date().toISOString(),
            })
          );
          return;
        }

        if (req.url === "/v1/students/revocation") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              receiptId: `tathastu-stg-purge-${Date.now()}`,
              status: "purged",
              purgedStudentId: parsedBody.studentUserId,
              revokedEpoch: parsedBody.revokedConsentEpoch,
              action: parsedBody.action,
              timestamp: new Date().toISOString(),
            })
          );
          return;
        }

        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not found" }));
      });
    });

    await new Promise<void>((resolve) => {
      stagingServer.listen(0, "127.0.0.1", () => {
        const addr = stagingServer.address() as any;
        serverPort = addr.port;
        stagingBaseUrl = `http://127.0.0.1:${serverPort}`;
        resolve();
      });
    });

    process.env.AI_TATHASTU_API_URL = stagingBaseUrl;
    process.env.AI_TATHASTU_API_KEY = stagingApiKey;
  });

  afterAll(async () => {
    delete process.env.AI_TATHASTU_API_URL;
    delete process.env.AI_TATHASTU_API_KEY;
    await new Promise<void>((resolve) => stagingServer.close(() => resolve()));
  });

  beforeEach(async () => {
    simulate503Outage = false;
    receivedEvents.length = 0;
    StudentConsentService.resetCache();
    const db = getDb();
    if (db) {
      await db.execute(sql`
        DELETE FROM outbox_events 
        WHERE payload->>'studentUserId' = ${testStudentId} OR payload->>'studentId' = ${testStudentId};
      `);
    }
  });

  it("1. delivers authenticated mentorship outcomes to staging destination with receipt", async () => {
    const db = getDb();
    const grant = await StudentConsentService.grantConsent(testStudentId, "ai_tathastu_sync", "Staging test", testStudentId);
    const activeEpoch = grant.consentEpoch;

    const eventKey = `aitathastu:stg_outcomes:${Date.now()}`;
    await db.execute(sql`
      INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
      VALUES (
        'mentorship.outcomes.synced',
        ${JSON.stringify({ studentUserId: testStudentId, consentEpoch: activeEpoch, notes: "Verified Milestone" })},
        'aitathastu',
        'pending',
        ${eventKey}
      );
    `);

    const result = await processOutboxBatch(10, "stg-worker-1");
    expect(result.processed).toBeGreaterThan(0);

    // Verify outbox completed
    const row: any = await db.execute(sql`
      SELECT status, error_message FROM outbox_events WHERE idempotency_key = ${eventKey};
    `);
    expect(row.rows[0].status).toBe("completed");
    expect(row.rows[0].error_message).toBeNull();

    // Verify staging destination received the event with authorized Bearer token
    expect(receivedEvents.length).toBe(1);
    expect(receivedEvents[0].endpoint).toBe("/v1/mentorship/outcomes");
    expect(receivedEvents[0].authHeader).toBe(`Bearer ${stagingApiKey}`);
    expect(receivedEvents[0].body.studentUserId).toBe(testStudentId);
    expect(receivedEvents[0].body.consentEpoch).toBe(activeEpoch);
  });

  it("2. delivers versioned revocation and deletion tombstone to staging destination", async () => {
    const db = getDb();
    await StudentConsentService.grantConsent(testStudentId, "ai_tathastu_sync", "Initial", testStudentId);
    await StudentConsentService.revokeConsent(testStudentId, "ai_tathastu_sync", "Student opted out", testStudentId);

    const result = await processOutboxBatch(10, "stg-worker-2");
    expect(result.processed).toBeGreaterThan(0);

    const tombstoneRow: any = await db.execute(sql`
      SELECT status, payload FROM outbox_events 
      WHERE event_type = 'student.consent.revoked'
        AND payload->>'studentUserId' = ${testStudentId};
    `);
    expect(tombstoneRow.rows[0].status).toBe("completed");

    // Verify staging destination received purge instruction
    const purgeEvent = receivedEvents.find((e) => e.endpoint === "/v1/students/revocation");
    expect(purgeEvent).toBeDefined();
    expect(purgeEvent?.body.action).toBe("purge_and_revoke");
    expect(purgeEvent?.body.studentUserId).toBe(testStudentId);
    expect(purgeEvent?.body.revokedConsentEpoch).toBeDefined();
  });

  it("3. handles staging destination outage (503) and recovers safely on next retry", async () => {
    const db = getDb();
    await StudentConsentService.grantConsent(testStudentId, "ai_tathastu_sync", "Retry initial", testStudentId);
    await StudentConsentService.revokeConsent(testStudentId, "ai_tathastu_sync", "Purge request", testStudentId);

    // Enable simulated outage on staging destination
    simulate503Outage = true;

    // Worker run 1: encounters 503 outage -> marks failed with backoff
    await processOutboxBatch(10, "stg-worker-outage");

    const failedRow: any = await db.execute(sql`
      SELECT id, status, retry_count, error_message FROM outbox_events
      WHERE event_type = 'student.consent.revoked'
        AND payload->>'studentUserId' = ${testStudentId};
    `);
    expect(failedRow.rows[0].status).toBe("failed");
    expect(failedRow.rows[0].retry_count).toBe(1);
    expect(failedRow.rows[0].error_message).toContain("503");

    // Destination recovers!
    simulate503Outage = false;

    // Reset next_retry_at to past to simulate elapsed backoff timer
    await db.execute(sql`
      UPDATE outbox_events SET next_retry_at = now() - interval '1 second' WHERE id = ${failedRow.rows[0].id};
    `);

    // Worker run 2: retries and succeeds!
    await processOutboxBatch(10, "stg-worker-recovery");

    const recoveredRow: any = await db.execute(sql`
      SELECT status, retry_count, error_message FROM outbox_events WHERE id = ${failedRow.rows[0].id};
    `);
    expect(recoveredRow.rows[0].status).toBe("completed");
    expect(recoveredRow.rows[0].retry_count).toBe(1);
    expect(recoveredRow.rows[0].error_message).toBeNull();
  });

  it("4. gates fresh snapshot until prior deletion tombstone is acknowledged by staging destination", async () => {
    const db = getDb();
    // Step 1: Revoke (Epoch 1 tombstone created)
    await StudentConsentService.revokeConsent(testStudentId, "ai_tathastu_sync", "Revoke before regrant", testStudentId);

    // Step 2: Re-grant (advances to Epoch 2)
    const regrant = await StudentConsentService.grantConsent(testStudentId, "ai_tathastu_sync", "New epoch", testStudentId);
    const newEpoch = regrant.consentEpoch;

    // Step 3: Enqueue fresh snapshot under Epoch 2
    const freshSnapshotKey = `aitathastu:fresh_snapshot_epoch_${newEpoch}_${Date.now()}`;
    await db.execute(sql`
      INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
      VALUES (
        'mentorship.outcomes.synced',
        ${JSON.stringify({ studentUserId: testStudentId, consentEpoch: newEpoch, notes: "Fresh Epoch 2 Snapshot" })},
        'aitathastu',
        'pending',
        ${freshSnapshotKey}
      );
    `);

    // Simulate temporary outage specifically for tombstone to test gating
    simulate503Outage = true;
    await processOutboxBatch(10, "stg-worker-gating-1");

    // The snapshot MUST be held pending because the prior tombstone failed delivery
    const checkSnapshot1: any = await db.execute(sql`
      SELECT status, error_message FROM outbox_events WHERE idempotency_key = ${freshSnapshotKey};
    `);
    expect(checkSnapshot1.rows[0].status).toBe("pending");
    expect(checkSnapshot1.rows[0].error_message).toContain("Awaiting prior consent epoch deletion tombstone");

    // Destination recovers
    simulate503Outage = false;
    await db.execute(sql`
      UPDATE outbox_events SET next_retry_at = now() - interval '1 second' 
      WHERE event_type = 'student.consent.revoked' AND payload->>'studentUserId' = ${testStudentId};
    `);

    // Tombstone delivers and completes
    await processOutboxBatch(10, "stg-worker-gating-2");
    const tombstoneCheck: any = await db.execute(sql`
      SELECT status FROM outbox_events WHERE event_type = 'student.consent.revoked' AND payload->>'studentUserId' = ${testStudentId};
    `);
    expect(tombstoneCheck.rows[0].status).toBe("completed");

    // Now fresh snapshot is unblocked and successfully delivered to staging destination!
    await processOutboxBatch(10, "stg-worker-gating-3");
    const checkSnapshot2: any = await db.execute(sql`
      SELECT status, error_message FROM outbox_events WHERE idempotency_key = ${freshSnapshotKey};
    `);
    expect(checkSnapshot2.rows[0].status).toBe("completed");
    expect(checkSnapshot2.rows[0].error_message).toBeNull();
  });
});
