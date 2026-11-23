import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { initializeDatabaseSchema, getDb } from "@/lib/db";
import { users, outboxEvents, inboundEventLedger } from "@/lib/db/schema";
import { studentSkillNodes } from "@/lib/db/ai-mentor-schema";
import { eq, sql } from "drizzle-orm";
import { NextRequest } from "next/server";
import crypto from "crypto";
import {
  StudentConsentService,
  PURPOSE_METADATA,
  validatePermittedCategories,
} from "@/lib/ai-mentor/student-consent-service";
import {
  AITathastuSyncService,
  generateOutboxIdempotencyKey,
} from "@/lib/ai-mentor/integrations/ai-tathastu-sync-service";
import {
  AITathastuInboundAuthService,
  InboundTathastuPayload,
} from "@/lib/ai-mentor/integrations/inbound-auth";
import { processOutboxBatch } from "@/lib/workers/outbox-worker";

describe("Consent Purpose Independence, Outbox Idempotency & Inbound Service Auth", () => {
  const testStudentId = "00000000-0000-4000-d000-000000000001";
  const foreignStudentId = "00000000-0000-4000-d000-000000000002";
  let syncService: AITathastuSyncService;

  beforeAll(async () => {
    await initializeDatabaseSchema();
    const db = getDb();
    if (db) {
      // Seed test student
      await db
        .insert(users)
        .values({
          id: testStudentId,
          email: "consent.test@aitathastu.com",
          displayName: "Consent Test Student",
          role: "student",
          accountStatus: "active",
          passwordHash: "dummy_hash",
        })
        .onConflictDoNothing();
    }
    syncService = new AITathastuSyncService();
  });

  beforeEach(() => {
    StudentConsentService.resetCache();
    AITathastuInboundAuthService.resetReplayCache();
    delete process.env.MOCK_TATHASTU_API_URL;
    delete process.env.AITATHASTU_API_URL;
    delete process.env.AITATHASTU_API_KEY;
  });

  // =========================================================================
  // 1. SEPARATE CONSENT PURPOSES & INDEPENDENCE
  // =========================================================================
  describe("1. Separate Consent Purposes & Strict Independence", () => {
    it("granting mentor_sharing does NOT implicitly authorize ai_tathastu_sync", async () => {
      // Ensure clean state: revoke ai_tathastu_sync
      await StudentConsentService.revokeConsent(testStudentId, "ai_tathastu_sync", "test", testStudentId);
      await StudentConsentService.grantConsent(testStudentId, "mentor_sharing", "Mentor only", testStudentId);

      const hasMentorSharing = await StudentConsentService.hasConsent(testStudentId, "mentor_sharing");
      const hasTathastuSync = await StudentConsentService.hasConsent(testStudentId, "ai_tathastu_sync");

      expect(hasMentorSharing).toBe(true);
      expect(hasTathastuSync).toBe(false);
    });

    it("revoking mentor_sharing leaves ai_tathastu_sync completely intact", async () => {
      await StudentConsentService.grantConsent(testStudentId, "ai_tathastu_sync", "Sync authorized", testStudentId);
      await StudentConsentService.revokeConsent(testStudentId, "mentor_sharing", "Revoking mentor only", testStudentId);

      const hasMentorSharing = await StudentConsentService.hasConsent(testStudentId, "mentor_sharing");
      const hasTathastuSync = await StudentConsentService.hasConsent(testStudentId, "ai_tathastu_sync");

      expect(hasMentorSharing).toBe(false);
      expect(hasTathastuSync).toBe(true);
    });

    it("revoking ai_tathastu_sync leaves mentor_sharing completely intact", async () => {
      await StudentConsentService.grantConsent(testStudentId, "mentor_sharing", "Mentor authorized", testStudentId);
      await StudentConsentService.revokeConsent(testStudentId, "ai_tathastu_sync", "Revoking sync only", testStudentId);

      const hasMentorSharing = await StudentConsentService.hasConsent(testStudentId, "mentor_sharing");
      const hasTathastuSync = await StudentConsentService.hasConsent(testStudentId, "ai_tathastu_sync");

      expect(hasMentorSharing).toBe(true);
      expect(hasTathastuSync).toBe(false);
    });

    it("revoking ai_tathastu_sync immediately suppresses pending outbox events awaiting delivery", async () => {
      const db = getDb();
      // Ensure consent is granted first
      await StudentConsentService.grantConsent(testStudentId, "ai_tathastu_sync", "Sync initial", testStudentId);

      // Create a pending outbox event for this student
      const testKey = `aitathastu:test_suppress:${Date.now()}`;
      await db.execute(sql`
        INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
        VALUES (
          'mentorship.outcomes.synced',
          ${JSON.stringify({ studentUserId: testStudentId, notesCount: 1 })},
          'aitathastu',
          'pending',
          ${testKey}
        );
      `);

      // Verify event is pending
      const beforeRevoke: any = await db.execute(sql`
        SELECT status FROM outbox_events WHERE idempotency_key = ${testKey};
      `);
      expect(beforeRevoke.rows[0].status).toBe("pending");

      // Now student revokes ai_tathastu_sync
      await StudentConsentService.revokeConsent(testStudentId, "ai_tathastu_sync", "Student opted out", testStudentId);

      // Verify the queued event was automatically marked as suppressed
      const afterRevoke: any = await db.execute(sql`
        SELECT status, error_message FROM outbox_events WHERE idempotency_key = ${testKey};
      `);
      expect(afterRevoke.rows[0].status).toBe("suppressed");
      expect(afterRevoke.rows[0].error_message).toContain("ai_tathastu_sync");
    });

    it("revoking ai_tathastu_sync enqueues a downstream student.consent.revoked tombstone event", async () => {
      const db = getDb();
      await StudentConsentService.revokeConsent(testStudentId, "ai_tathastu_sync", "Purge request", testStudentId);

      const revocationEvents: any = await db.execute(sql`
        SELECT event_type, payload, status FROM outbox_events
        WHERE event_type = 'student.consent.revoked'
          AND payload->>'studentUserId' = ${testStudentId}
        ORDER BY created_at DESC
        LIMIT 1;
      `);

      expect(revocationEvents.rows.length).toBeGreaterThan(0);
      const ev = revocationEvents.rows[0];
      const payload = typeof ev.payload === "string" ? JSON.parse(ev.payload) : ev.payload;
      expect(payload.action).toBe("purge_and_revoke");
      expect(payload.revokedPurpose).toBe("ai_tathastu_sync");
      expect(Array.isArray(payload.permittedCategoriesToPurge)).toBe(true);
    });

    it("validates permitted data categories and rejects unauthorized categories", () => {
      const valid = validatePermittedCategories("ai_tathastu_sync", [
        "verified_skills",
        "mentorship_milestones",
      ]);
      expect(valid.valid).toBe(true);
      expect(valid.unauthorizedCategories.length).toBe(0);

      const invalid = validatePermittedCategories("ai_tathastu_sync", [
        "verified_skills",
        "raw_chat_transcripts",
        "payment_card_details",
      ]);
      expect(invalid.valid).toBe(false);
      expect(invalid.unauthorizedCategories).toContain("raw_chat_transcripts");
      expect(invalid.unauthorizedCategories).toContain("payment_card_details");
    });

    it("provides full transparency in student consent ledger with category disclosures", async () => {
      const ledger = await StudentConsentService.getStudentConsentLedger(testStudentId, testStudentId);
      expect(Array.isArray(ledger)).toBe(true);
      expect(ledger.length).toBe(9);

      const syncEntry = ledger.find((l) => l.purpose === "ai_tathastu_sync");
      expect(syncEntry).toBeDefined();
      expect(syncEntry?.targetDestination).toContain("AI Tathastu Central");
      expect(syncEntry?.permittedCategories).toContain("verified_skills");
      expect(syncEntry?.permittedCategories).toContain("mentorship_milestones");

      const mentorEntry = ledger.find((l) => l.purpose === "mentor_sharing");
      expect(mentorEntry).toBeDefined();
      expect(mentorEntry?.targetDestination).toContain("Assigned Human Mentor");
      expect(mentorEntry?.permittedCategories).toContain("questions_for_mentor");
    });
  });

  // =========================================================================
  // 2. DETERMINISTIC EVENT-LEVEL OUTBOX IDEMPOTENCY
  // =========================================================================
  describe("2. Deterministic Event-Level Outbox Idempotency", () => {
    it("generates distinct idempotency keys for different event types on the same date", () => {
      const key1 = generateOutboxIdempotencyKey({
        targetSystem: "aitathastu",
        eventType: "mentorship.outcomes.synced",
        studentUserId: testStudentId,
        sourceEntityId: "booking-101",
        sourceVersion: 1,
      });

      const key2 = generateOutboxIdempotencyKey({
        targetSystem: "aitathastu",
        eventType: "student.milestone.completed",
        studentUserId: testStudentId,
        sourceEntityId: "goal-505",
        sourceVersion: 1,
      });

      expect(key1).not.toBe(key2);
      expect(key1).toContain("mentorship.outcomes.synced");
      expect(key2).toContain("student.milestone.completed");
    });

    it("generates distinct idempotency keys for different source records on the same date", () => {
      const keyBooking1 = generateOutboxIdempotencyKey({
        targetSystem: "aitathastu",
        eventType: "mentorship.outcomes.synced",
        studentUserId: testStudentId,
        sourceEntityId: "booking-aaa",
        sourceVersion: 1,
      });

      const keyBooking2 = generateOutboxIdempotencyKey({
        targetSystem: "aitathastu",
        eventType: "mentorship.outcomes.synced",
        studentUserId: testStudentId,
        sourceEntityId: "booking-bbb",
        sourceVersion: 1,
      });

      expect(keyBooking1).not.toBe(keyBooking2);
      expect(keyBooking1).toContain("booking-aaa");
      expect(keyBooking2).toContain("booking-bbb");
    });

    it("duplicate retries of the same event produce identical idempotency key without duplicate rows", async () => {
      await StudentConsentService.grantConsent(testStudentId, "ai_tathastu_sync", "test", testStudentId);

      const res1 = await syncService.syncOutboundMentorshipOutcomes(testStudentId, {
        bookingId: "booking-dedup-1",
        version: 1,
      });

      const res2 = await syncService.syncOutboundMentorshipOutcomes(testStudentId, {
        bookingId: "booking-dedup-1",
        version: 1,
      });

      expect(res1.idempotencyKey).toBe(res2.idempotencyKey);
      expect(res1.outboxEventId).toBe(res2.outboxEventId);

      // Verify in database: exactly 1 row exists with this idempotency key
      const db = getDb();
      const countResult: any = await db.execute(sql`
        SELECT COUNT(*)::int as count FROM outbox_events WHERE idempotency_key = ${res1.idempotencyKey};
      `);
      expect(countResult.rows[0].count).toBe(1);
    });

    it("an updated version of an existing source record generates a new versioned key", async () => {
      await StudentConsentService.grantConsent(testStudentId, "ai_tathastu_sync", "test", testStudentId);

      const resV1 = await syncService.syncOutboundMentorshipOutcomes(testStudentId, {
        bookingId: "booking-version-test",
        version: 1,
      });

      const resV2 = await syncService.syncOutboundMentorshipOutcomes(testStudentId, {
        bookingId: "booking-version-test",
        version: 2,
      });

      expect(resV1.idempotencyKey).toContain(":v1");
      expect(resV2.idempotencyKey).toContain(":v2");
      expect(resV1.idempotencyKey).not.toBe(resV2.idempotencyKey);
      expect(resV1.outboxEventId).not.toBe(resV2.outboxEventId);
    });

    it("enforces uniqueness on idempotency_key at database level", async () => {
      const db = getDb();
      const uniqueTestKey = `aitathastu:db_unique_test:${Date.now()}`;

      // Insert first row
      await db.execute(sql`
        INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
        VALUES ('test.event', '{"v": 1}'::jsonb, 'aitathastu', 'pending', ${uniqueTestKey});
      `);

      // Attempt second insert with same key using ON CONFLICT DO NOTHING
      const insert2: any = await db.execute(sql`
        INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
        VALUES ('test.event', '{"v": 2}'::jsonb, 'aitathastu', 'pending', ${uniqueTestKey})
        ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING id;
      `);

      expect((insert2.rows || insert2 || []).length).toBe(0);

      // Verify only 1 row was stored
      const check: any = await db.execute(sql`
        SELECT COUNT(*)::int as count FROM outbox_events WHERE idempotency_key = ${uniqueTestKey};
      `);
      expect(check.rows[0].count).toBe(1);
    });
  });

  // =========================================================================
  // 3. INBOUND SERVICE AUTHENTICATION BOUNDARY
  // =========================================================================
  describe("3. Inbound Machine-to-Machine (M2M) Service Authentication Boundary", () => {
    it("accepts authenticated M2M service token with valid issuer and audience", async () => {
      // Grant external ingestion consent
      await StudentConsentService.grantConsent(testStudentId, "external_data_integration", "test", testStudentId);

      const validToken = await AITathastuInboundAuthService.createSignedServiceToken({
        issuer: "ai-tathastu",
        audience: "mentormaze",
        serviceId: "svc-tathastu-curriculum",
      });

      const payload: InboundTathastuPayload = {
        eventId: `ev-valid-${Date.now()}`,
        eventType: "student.skills.verified",
        sourceSystem: "ai-tathastu",
        targetTenant: "mentormaze",
        studentUserId: testStudentId,
        timestamp: new Date().toISOString(),
        data: {
          verifiedSkills: [
            {
              skillName: "Distributed Systems & Raft Consensus",
              category: "Core CS",
              masteryScore: 8.5,
              masteryState: "competent",
              evidenceSource: "Tathastu Distributed Systems Lab",
              verificationConfidence: 0.98,
            },
          ],
        },
      };

      const result = await AITathastuInboundAuthService.processInboundEvent(`Bearer ${validToken}`, payload);
      expect(result.success).toBe(true);
      expect(result.skillsIngested).toBe(1);
      expect(result.receiptId).toContain("receipt-inbound");
    });

    it("rejects request with missing or malformed Authorization header", async () => {
      const payload: InboundTathastuPayload = {
        eventId: "ev-no-auth",
        eventType: "student.skills.verified",
        sourceSystem: "ai-tathastu",
        targetTenant: "mentormaze",
        studentUserId: testStudentId,
        timestamp: new Date().toISOString(),
        data: {},
      };

      await expect(
        AITathastuInboundAuthService.processInboundEvent(null, payload)
      ).rejects.toThrow("401_UNAUTHORIZED");

      await expect(
        AITathastuInboundAuthService.processInboundEvent("Basic 12345", payload)
      ).rejects.toThrow("401_UNAUTHORIZED");
    });

    it("rejects token with invalid signature or wrong service secret", async () => {
      const forgedToken = await AITathastuInboundAuthService.createSignedServiceToken({
        issuer: "ai-tathastu",
        audience: "mentormaze",
        secret: "wrong-adversarial-secret-key-123",
      });

      const payload: InboundTathastuPayload = {
        eventId: "ev-forged",
        eventType: "student.skills.verified",
        sourceSystem: "ai-tathastu",
        targetTenant: "mentormaze",
        studentUserId: testStudentId,
        timestamp: new Date().toISOString(),
        data: {},
      };

      await expect(
        AITathastuInboundAuthService.processInboundEvent(`Bearer ${forgedToken}`, payload)
      ).rejects.toThrow("401_UNAUTHORIZED");
    });

    it("rejects token with wrong audience", async () => {
      const wrongAudToken = await AITathastuInboundAuthService.createSignedServiceToken({
        issuer: "ai-tathastu",
        audience: "unauthorized-external-portal",
      });

      const payload: InboundTathastuPayload = {
        eventId: "ev-wrong-aud",
        eventType: "student.skills.verified",
        sourceSystem: "ai-tathastu",
        targetTenant: "mentormaze",
        studentUserId: testStudentId,
        timestamp: new Date().toISOString(),
        data: {},
      };

      await expect(
        AITathastuInboundAuthService.processInboundEvent(`Bearer ${wrongAudToken}`, payload)
      ).rejects.toThrow("401_UNAUTHORIZED");
    });

    it("rejects expired service token", async () => {
      const expiredToken = await AITathastuInboundAuthService.createSignedServiceToken({
        issuer: "ai-tathastu",
        audience: "mentormaze",
        expiresInSeconds: -30, // Expired 30 seconds ago
      });

      const payload: InboundTathastuPayload = {
        eventId: "ev-expired",
        eventType: "student.skills.verified",
        sourceSystem: "ai-tathastu",
        targetTenant: "mentormaze",
        studentUserId: testStudentId,
        timestamp: new Date().toISOString(),
        data: {},
      };

      await expect(
        AITathastuInboundAuthService.processInboundEvent(`Bearer ${expiredToken}`, payload)
      ).rejects.toThrow("401_UNAUTHORIZED: Service token has expired.");
    });

    it("defends against replay attacks by rejecting reused eventId or JTI", async () => {
      await StudentConsentService.grantConsent(testStudentId, "external_data_integration", "test", testStudentId);

      const replayEventId = `ev-replay-${Date.now()}`;
      const token = await AITathastuInboundAuthService.createSignedServiceToken({
        issuer: "ai-tathastu",
        audience: "mentormaze",
      });

      const payload: InboundTathastuPayload = {
        eventId: replayEventId,
        eventType: "student.skills.verified",
        sourceSystem: "ai-tathastu",
        targetTenant: "mentormaze",
        studentUserId: testStudentId,
        timestamp: new Date().toISOString(),
        data: {
          verifiedSkills: [],
        },
      };

      // First submission succeeds
      const first = await AITathastuInboundAuthService.processInboundEvent(`Bearer ${token}`, payload);
      expect(first.success).toBe(true);

      // Replay of same eventId is rejected
      await expect(
        AITathastuInboundAuthService.processInboundEvent(`Bearer ${token}`, payload)
      ).rejects.toThrow("409_CONFLICT: Replay attack detected");
    });

    it("rejects tenant mismatch when targetTenant is not mentormaze", async () => {
      const token = await AITathastuInboundAuthService.createSignedServiceToken();
      const payload: InboundTathastuPayload = {
        eventId: `ev-tenant-${Date.now()}`,
        eventType: "student.skills.verified",
        sourceSystem: "ai-tathastu",
        targetTenant: "foreign-partner" as any,
        studentUserId: testStudentId,
        timestamp: new Date().toISOString(),
        data: {},
      };

      await expect(
        AITathastuInboundAuthService.processInboundEvent(`Bearer ${token}`, payload)
      ).rejects.toThrow("403_FORBIDDEN: Tenant mismatch");
    });

    it("rejects student identity mismatch when student does not exist in local directory", async () => {
      const token = await AITathastuInboundAuthService.createSignedServiceToken();
      const payload: InboundTathastuPayload = {
        eventId: `ev-nonexistent-${Date.now()}`,
        eventType: "student.skills.verified",
        sourceSystem: "ai-tathastu",
        targetTenant: "mentormaze",
        studentUserId: "00000000-0000-4000-ffff-999999999999",
        timestamp: new Date().toISOString(),
        data: {},
      };

      await expect(
        AITathastuInboundAuthService.processInboundEvent(`Bearer ${token}`, payload)
      ).rejects.toThrow("404_NOT_FOUND");
    });

    it("rejects inbound ingestion when student has revoked external_data_integration consent", async () => {
      await StudentConsentService.revokeConsent(testStudentId, "external_data_integration", "Opted out", testStudentId);

      const token = await AITathastuInboundAuthService.createSignedServiceToken();
      const payload: InboundTathastuPayload = {
        eventId: `ev-consent-block-${Date.now()}`,
        eventType: "student.skills.verified",
        sourceSystem: "ai-tathastu",
        targetTenant: "mentormaze",
        studentUserId: testStudentId,
        timestamp: new Date().toISOString(),
        data: {},
      };

      await expect(
        AITathastuInboundAuthService.processInboundEvent(`Bearer ${token}`, payload)
      ).rejects.toThrow("403_FORBIDDEN: Inbound ingestion blocked");
    });

    it("rejects payload containing unauthorized data categories", async () => {
      await StudentConsentService.grantConsent(testStudentId, "external_data_integration", "test", testStudentId);

      const token = await AITathastuInboundAuthService.createSignedServiceToken();
      const payload: InboundTathastuPayload = {
        eventId: `ev-unauthorized-cat-${Date.now()}`,
        eventType: "student.skills.verified",
        sourceSystem: "ai-tathastu",
        targetTenant: "mentormaze",
        studentUserId: testStudentId,
        timestamp: new Date().toISOString(),
        data: {
          verifiedSkills: [],
          raw_passwords: ["secret123"], // Unauthorized category!
          payment_cards: [{ card: "4111..." }], // Unauthorized category!
        },
      };

      await expect(
        AITathastuInboundAuthService.processInboundEvent(`Bearer ${token}`, payload)
      ).rejects.toThrow("400_BAD_REQUEST: Payload contains unauthorized data categories");
    });
  });

  // =========================================================================
  // 4. OUTBOX DELIVERY LIFECYCLE & HONEST STATUS REPORTING
  // =========================================================================
  describe("4. Complete Outbox Delivery Lifecycle & Status Reporting", () => {
    it("reports UNVERIFIED / NOT CONFIGURED when external destination credentials are unavailable", async () => {
      const status = await syncService.getStatus();
      expect(status.destinationStatus).toBe("UNVERIFIED_NOT_CONFIGURED");
      expect(status.isConfigured).toBe(false);
      expect(status.description).toContain("UNVERIFIED / NOT CONFIGURED");
    });

    it("reports MOCK_VERIFIED_DELIVERED when running against controlled mock destination", async () => {
      process.env.MOCK_TATHASTU_API_URL = "http://localhost:9999/mock-tathastu";
      const status = await syncService.getStatus();
      expect(status.destinationStatus).toBe("MOCK_VERIFIED_DELIVERED");
      expect(status.isConfigured).toBe(true);
      expect(status.description).toContain("Mock Connector active");
    });

    it("executes complete delivery lifecycle to mock destination with acknowledgement", async () => {
      await StudentConsentService.grantConsent(testStudentId, "ai_tathastu_sync", "test", testStudentId);

      // Intercept fetch for mock destination
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any, init: any) => {
        if (url.toString().includes("mock-tathastu")) {
          return new Response(
            JSON.stringify({
              receiptId: `mock-receipt-${Date.now()}`,
              status: "acknowledged",
              timestamp: new Date().toISOString(),
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        return originalFetch(url, init);
      };

      try {
        process.env.MOCK_TATHASTU_API_URL = "http://localhost:9999/mock-tathastu";

        const result = await syncService.syncTwoWay(testStudentId, {
          bookingId: "booking-mock-test-1",
          version: 1,
        });

        expect(result.success).toBe(true);
        expect(result.syncState).toBe("MOCK_VERIFIED_DELIVERED");
        expect(result.deliveryAcknowledged).toBe(true);
        expect(result.remoteReceiptId).toContain("mock-receipt");
        expect(result.outbound.deliveryStatus).toBe("delivered");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("worker revalidates consent before delivery and suppresses event if consent was revoked", async () => {
      const db = getDb();
      // Initially grant consent
      await StudentConsentService.grantConsent(testStudentId, "ai_tathastu_sync", "initial", testStudentId);

      const eventKey = `aitathastu:worker_consent_reval:${Date.now()}`;
      await db.execute(sql`
        INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
        VALUES (
          'mentorship.outcomes.synced',
          ${JSON.stringify({ studentUserId: testStudentId, notes: "Outcomes" })},
          'aitathastu',
          'pending',
          ${eventKey}
        );
      `);

      // Student revokes consent while event is in outbox queue
      await StudentConsentService.revokeConsent(testStudentId, "ai_tathastu_sync", "revoked before worker", testStudentId);

      // Run outbox worker batch
      const batchResult = await processOutboxBatch(10, "test-worker-1");
      expect(batchResult.processed).toBeGreaterThan(0);

      // Event must be marked as suppressed in outbox
      const row: any = await db.execute(sql`
        SELECT status, error_message FROM outbox_events WHERE idempotency_key = ${eventKey};
      `);
      expect(row.rows[0].status).toBe("suppressed");
      expect(row.rows[0].error_message).toContain("revoked");
    });
  });

  // =========================================================================
  // 5. CONSENT EPOCHS, REVOCATION/RE-GRANT LIFECYCLE & RACE-CONDITION HARDENING
  // =========================================================================
  describe("5. Consent Epochs, Revocation/Re-Grant Lifecycle & Race-Condition Hardening", () => {
    // 1. Grant -> synchronize -> revoke -> deletion acknowledged
    it("1. Grant -> synchronize -> revoke -> deletion acknowledged", async () => {
      const db = getDb();
      await db.execute(sql`DELETE FROM outbox_events WHERE payload->>'studentUserId' = ${testStudentId} OR payload->>'studentId' = ${testStudentId};`);
      StudentConsentService.resetCache();

      // Step 1: Grant consent (Epoch 1)
      const grantRec = await StudentConsentService.grantConsent(testStudentId, "ai_tathastu_sync", "Initial grant", testStudentId);
      expect(grantRec.isGranted).toBe(true);
      expect(grantRec.consentEpoch).toBeGreaterThanOrEqual(1);
      const activeEpoch = grantRec.consentEpoch;

      // Step 2: Synchronize mentorship outcomes
      const syncKey = `aitathastu:sync_test_1:${Date.now()}`;
      await db.execute(sql`
        INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
        VALUES (
          'mentorship.outcomes.synced',
          ${JSON.stringify({ studentUserId: testStudentId, consentEpoch: activeEpoch, notes: "Verified Outcomes" })},
          'aitathastu',
          'pending',
          ${syncKey}
        );
      `);

      // Mock destination endpoints
      const originalFetch = globalThis.fetch;
      let outcomesDelivered = false;
      let tombstoneDelivered = false;

      globalThis.fetch = async (url: any, init: any) => {
        const urlStr = url.toString();
        if (urlStr.includes("/v1/mentorship/outcomes")) {
          outcomesDelivered = true;
          return new Response(JSON.stringify({ receiptId: "ack-outcomes-1", status: "acknowledged" }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        if (urlStr.includes("/v1/students/revocation")) {
          tombstoneDelivered = true;
          return new Response(JSON.stringify({ receiptId: "ack-tombstone-1", status: "purged" }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        return originalFetch(url, init);
      };

      try {
        process.env.MOCK_TATHASTU_API_URL = "http://localhost:9999/mock-tathastu";

        // Deliver outcomes
        await processOutboxBatch(10, "worker-test-1a");
        const syncRow: any = await db.execute(sql`SELECT status FROM outbox_events WHERE idempotency_key = ${syncKey};`);
        expect(syncRow.rows[0].status).toBe("completed");
        expect(outcomesDelivered).toBe(true);

        // Step 3: Revoke consent
        await StudentConsentService.revokeConsent(testStudentId, "ai_tathastu_sync", "Student opt-out", testStudentId);
        expect(await StudentConsentService.hasConsent(testStudentId, "ai_tathastu_sync")).toBe(false);

        // Step 4: Deletion tombstone delivery & acknowledgement
        await processOutboxBatch(10, "worker-test-1b");
        const tombstoneRow: any = await db.execute(sql`
          SELECT status, payload FROM outbox_events
          WHERE event_type = 'student.consent.revoked'
            AND payload->>'studentUserId' = ${testStudentId}
          ORDER BY created_at DESC LIMIT 1;
        `);
        expect(tombstoneRow.rows[0].status).toBe("completed");
        expect(tombstoneDelivered).toBe(true);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    // 2. Grant -> synchronize -> revoke -> re-grant before deletion dispatch
    it("2. Grant -> synchronize -> revoke -> re-grant before deletion dispatch", async () => {
      const db = getDb();
      await db.execute(sql`DELETE FROM outbox_events WHERE payload->>'studentUserId' = ${testStudentId} OR payload->>'studentId' = ${testStudentId};`);
      StudentConsentService.resetCache();

      // Grant -> Revoke
      await StudentConsentService.grantConsent(testStudentId, "ai_tathastu_sync", "Initial grant", testStudentId);
      await StudentConsentService.revokeConsent(testStudentId, "ai_tathastu_sync", "Revoke before worker", testStudentId);

      // Verify pending tombstone exists in outbox
      const pendingTombstoneBefore: any = await db.execute(sql`
        SELECT id, status, payload FROM outbox_events
        WHERE event_type = 'student.consent.revoked'
          AND payload->>'studentUserId' = ${testStudentId}
          AND status = 'pending';
      `);
      expect(pendingTombstoneBefore.rows.length).toBe(1);

      // Re-grant consent BEFORE deletion dispatch: Advances consent epoch!
      const regrantRec = await StudentConsentService.grantConsent(testStudentId, "ai_tathastu_sync", "Re-grant before dispatch", testStudentId);
      expect(regrantRec.isGranted).toBe(true);
      expect(regrantRec.consentEpoch).toBeGreaterThan(1);

      // Intercept tombstone delivery
      const originalFetch = globalThis.fetch;
      let tombstoneDelivered = false;
      globalThis.fetch = async (url: any, init: any) => {
        if (url.toString().includes("/v1/students/revocation")) {
          tombstoneDelivered = true;
          return new Response(JSON.stringify({ receiptId: "ack-tombstone-2", status: "purged" }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        return originalFetch(url, init);
      };

      try {
        process.env.MOCK_TATHASTU_API_URL = "http://localhost:9999/mock-tathastu";

        // Run worker: A later re-grant MUST NOT suppress or cancel an already-created deletion obligation!
        await processOutboxBatch(10, "worker-test-2");

        const tombstoneAfter: any = await db.execute(sql`
          SELECT status, error_message FROM outbox_events
          WHERE id = ${pendingTombstoneBefore.rows[0].id};
        `);

        // MUST be completed, NOT suppressed!
        expect(tombstoneAfter.rows[0].status).toBe("completed");
        expect(tombstoneAfter.rows[0].error_message).toBeNull();
        expect(tombstoneDelivered).toBe(true);

        // Student consent remains active under the new epoch
        expect(await StudentConsentService.hasConsent(testStudentId, "ai_tathastu_sync")).toBe(true);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    // 3. Grant -> synchronize -> revoke -> deletion failure -> re-grant -> deletion retry
    it("3. Grant -> synchronize -> revoke -> deletion failure -> re-grant -> deletion retry", async () => {
      const db = getDb();
      await db.execute(sql`DELETE FROM outbox_events WHERE payload->>'studentUserId' = ${testStudentId} OR payload->>'studentId' = ${testStudentId};`);
      StudentConsentService.resetCache();

      await StudentConsentService.grantConsent(testStudentId, "ai_tathastu_sync", "Grant 3", testStudentId);
      await StudentConsentService.revokeConsent(testStudentId, "ai_tathastu_sync", "Revoke 3", testStudentId);

      // First delivery attempt: Destination downstream fails (503)
      const originalFetch = globalThis.fetch;
      let attemptCount = 0;
      globalThis.fetch = async (url: any, init: any) => {
        if (url.toString().includes("/v1/students/revocation")) {
          attemptCount++;
          if (attemptCount === 1) {
            return new Response(JSON.stringify({ error: "Downstream 503 Service Unavailable" }), { status: 503 });
          }
          return new Response(JSON.stringify({ receiptId: "ack-retry-3", status: "purged" }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        return originalFetch(url, init);
      };

      try {
        process.env.MOCK_TATHASTU_API_URL = "http://localhost:9999/mock-tathastu";

        // First worker run -> fails
        await processOutboxBatch(10, "worker-test-3a");

        const failedTombstone: any = await db.execute(sql`
          SELECT id, status, retry_count FROM outbox_events
          WHERE event_type = 'student.consent.revoked'
            AND payload->>'studentUserId' = ${testStudentId};
        `);
        expect(failedTombstone.rows[0].status).toBe("failed");
        expect(failedTombstone.rows[0].retry_count).toBe(1);

        // Student re-grants consent
        await StudentConsentService.grantConsent(testStudentId, "ai_tathastu_sync", "Re-grant 3", testStudentId);

        // Clear next_retry_at cooldown to simulate elapsed backoff timer
        await db.execute(sql`
          UPDATE outbox_events
          SET next_retry_at = now() - interval '1 second'
          WHERE id = ${failedTombstone.rows[0].id};
        `);

        // Second worker run -> retries and succeeds!
        await processOutboxBatch(10, "worker-test-3b");

        const retriedTombstone: any = await db.execute(sql`
          SELECT status, retry_count, error_message FROM outbox_events
          WHERE id = ${failedTombstone.rows[0].id};
        `);
        expect(retriedTombstone.rows[0].status).toBe("completed");
        expect(retriedTombstone.rows[0].retry_count).toBe(1);
        expect(retriedTombstone.rows[0].error_message).toBeNull();
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    // 4. Concurrent revoke and re-grant requests
    it("4. Concurrent revoke and re-grant requests", async () => {
      const db = getDb();
      await db.execute(sql`DELETE FROM outbox_events WHERE payload->>'studentUserId' = ${testStudentId} OR payload->>'studentId' = ${testStudentId};`);
      StudentConsentService.resetCache();

      await StudentConsentService.grantConsent(testStudentId, "ai_tathastu_sync", "Base", testStudentId);

      // Execute concurrent revoke and grant requests
      const [revokeResult, grantResult] = await Promise.allSettled([
        StudentConsentService.revokeConsent(testStudentId, "ai_tathastu_sync", "Concurrent revoke", testStudentId),
        StudentConsentService.grantConsent(testStudentId, "ai_tathastu_sync", "Concurrent grant", testStudentId),
      ]);

      expect(revokeResult.status).toBe("fulfilled");
      expect(grantResult.status).toBe("fulfilled");

      // Verify database consistency: epoch is valid and >= 2
      const consentRow: any = await db.execute(sql`
        SELECT is_granted, consent_epoch FROM student_purpose_consents
        WHERE student_user_id = ${testStudentId} AND purpose = 'ai_tathastu_sync';
      `);
      expect(consentRow.rows.length).toBe(1);
      expect(typeof consentRow.rows[0].consent_epoch).toBe("number");
      expect(consentRow.rows[0].consent_epoch).toBeGreaterThanOrEqual(2);

      // Verify at least one revocation tombstone was durably created
      const tombstones: any = await db.execute(sql`
        SELECT id, event_type FROM outbox_events
        WHERE event_type = 'student.consent.revoked'
          AND payload->>'studentUserId' = ${testStudentId};
      `);
      expect(tombstones.rows.length).toBeGreaterThanOrEqual(1);
    });

    // 5. Duplicate revocation requests
    it("5. Duplicate revocation requests", async () => {
      const db = getDb();
      await db.execute(sql`DELETE FROM outbox_events WHERE payload->>'studentUserId' = ${testStudentId} OR payload->>'studentId' = ${testStudentId};`);
      StudentConsentService.resetCache();

      await StudentConsentService.grantConsent(testStudentId, "ai_tathastu_sync", "Grant 5", testStudentId);

      // Call revoke twice consecutively in same state
      await StudentConsentService.revokeConsent(testStudentId, "ai_tathastu_sync", "Revocation 1", testStudentId);
      await StudentConsentService.revokeConsent(testStudentId, "ai_tathastu_sync", "Revocation 2 duplicate", testStudentId);

      // Enforce that duplicate calls within the same epoch do NOT produce duplicate pending tombstones
      const tombstoneCount: any = await db.execute(sql`
        SELECT COUNT(*)::int as count FROM outbox_events
        WHERE event_type = 'student.consent.revoked'
          AND payload->>'studentUserId' = ${testStudentId}
          AND status = 'pending';
      `);
      expect(tombstoneCount.rows[0].count).toBe(1);
    });

    // 6. Worker retry after process restart
    it("6. Worker retry after process restart", async () => {
      const db = getDb();
      await db.execute(sql`DELETE FROM outbox_events WHERE payload->>'studentUserId' = ${testStudentId} OR payload->>'studentId' = ${testStudentId};`);
      StudentConsentService.resetCache();

      const crashedKey = `aitathastu:crashed_job_${Date.now()}`;
      // Simulate a job that was locked by a worker that crashed 10 minutes ago
      await db.execute(sql`
        INSERT INTO outbox_events (
          event_type, payload, target_system, status, idempotency_key, locked_at, locked_by
        ) VALUES (
          'student.consent.revoked',
          ${JSON.stringify({ studentUserId: testStudentId, action: "purge" })},
          'aitathastu',
          'processing',
          ${crashedKey},
          now() - interval '10 minutes',
          'crashed-worker-pid-9999'
        );
      `);

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any, init: any) => {
        if (url.toString().includes("/v1/students/revocation")) {
          return new Response(JSON.stringify({ receiptId: "ack-reclaimed", status: "purged" }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        return originalFetch(url, init);
      };

      try {
        process.env.MOCK_TATHASTU_API_URL = "http://localhost:9999/mock-tathastu";

        // New worker starts and processes batch: Reclaims stale lock (> 5 min)
        const batchResult = await processOutboxBatch(10, "new-restarted-worker");
        expect(batchResult.processed).toBeGreaterThan(0);

        const recoveredRow: any = await db.execute(sql`
          SELECT status, locked_by, locked_at FROM outbox_events WHERE idempotency_key = ${crashedKey};
        `);
        expect(recoveredRow.rows[0].status).toBe("completed");
        expect(recoveredRow.rows[0].locked_at).toBeNull();
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    // 7. Re-grant followed by fresh snapshot only after deletion acknowledgement
    it("7. Re-grant followed by fresh snapshot only after deletion acknowledgement", async () => {
      const db = getDb();
      await db.execute(sql`DELETE FROM outbox_events WHERE payload->>'studentUserId' = ${testStudentId} OR payload->>'studentId' = ${testStudentId};`);
      StudentConsentService.resetCache();

      // Revoke -> creates pending tombstone
      await StudentConsentService.revokeConsent(testStudentId, "ai_tathastu_sync", "Revoke before regrant", testStudentId);

      // Re-grant -> advances to new epoch
      const regrant = await StudentConsentService.grantConsent(testStudentId, "ai_tathastu_sync", "New epoch grant", testStudentId);
      const newEpoch = regrant.consentEpoch;

      // Create a fresh snapshot event under the new epoch
      const snapshotKey = `aitathastu:snapshot_epoch_${newEpoch}_${Date.now()}`;
      await db.execute(sql`
        INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
        VALUES (
          'mentorship.outcomes.synced',
          ${JSON.stringify({ studentUserId: testStudentId, consentEpoch: newEpoch, notes: "Fresh Epoch Snapshot" })},
          'aitathastu',
          'pending',
          ${snapshotKey}
        );
      `);

      // Mock destination: Block tombstone initially to test gating
      const originalFetch = globalThis.fetch;
      let allowTombstone = false;
      let snapshotDelivered = false;

      globalThis.fetch = async (url: any, init: any) => {
        const urlStr = url.toString();
        if (urlStr.includes("/v1/students/revocation")) {
          if (!allowTombstone) {
            return new Response(JSON.stringify({ error: "Destination temporarily busy" }), { status: 503 });
          }
          return new Response(JSON.stringify({ receiptId: "ack-tombstone-7", status: "purged" }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        if (urlStr.includes("/v1/mentorship/outcomes")) {
          snapshotDelivered = true;
          return new Response(JSON.stringify({ receiptId: "ack-snapshot-7", status: "acknowledged" }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        return originalFetch(url, init);
      };

      try {
        process.env.MOCK_TATHASTU_API_URL = "http://localhost:9999/mock-tathastu";

        // First worker run: Tombstone delivery fails (503), so prior tombstone is NOT acknowledged
        await processOutboxBatch(10, "worker-gating-1");

        // The snapshot event MUST be held in pending status awaiting tombstone acknowledgement
        const snapshotCheck1: any = await db.execute(sql`
          SELECT status, error_message FROM outbox_events WHERE idempotency_key = ${snapshotKey};
        `);
        expect(snapshotCheck1.rows[0].status).toBe("pending");
        expect(snapshotCheck1.rows[0].error_message).toContain("Awaiting prior consent epoch deletion tombstone acknowledgement");
        expect(snapshotDelivered).toBe(false);

        // Now allow tombstone delivery to succeed and reset retry cooldown
        allowTombstone = true;
        await db.execute(sql`
          UPDATE outbox_events
          SET next_retry_at = now() - interval '1 second'
          WHERE event_type = 'student.consent.revoked' AND payload->>'studentUserId' = ${testStudentId};
        `);

        // Run worker: Tombstone delivers and completes
        await processOutboxBatch(10, "worker-gating-2");
        const tombstoneCheck: any = await db.execute(sql`
          SELECT status FROM outbox_events
          WHERE event_type = 'student.consent.revoked' AND payload->>'studentUserId' = ${testStudentId};
        `);
        expect(tombstoneCheck.rows[0].status).toBe("completed");

        // Run worker again: With tombstone acknowledged, fresh snapshot is unblocked and delivers!
        await processOutboxBatch(10, "worker-gating-3");
        const snapshotCheck2: any = await db.execute(sql`
          SELECT status FROM outbox_events WHERE idempotency_key = ${snapshotKey};
        `);
        expect(snapshotCheck2.rows[0].status).toBe("completed");
        expect(snapshotDelivered).toBe(true);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    // 8. Old-version ordinary events are never delivered after revocation
    it("8. Old-version ordinary events are never delivered after revocation", async () => {
      const db = getDb();
      await db.execute(sql`DELETE FROM outbox_events WHERE payload->>'studentUserId' = ${testStudentId} OR payload->>'studentId' = ${testStudentId};`);
      StudentConsentService.resetCache();

      // Grant at Epoch 1, then revoke, then re-grant to Epoch 2
      await StudentConsentService.grantConsent(testStudentId, "ai_tathastu_sync", "Epoch 1", testStudentId);
      await StudentConsentService.revokeConsent(testStudentId, "ai_tathastu_sync", "Revoke Epoch 1", testStudentId);
      const regrant = await StudentConsentService.grantConsent(testStudentId, "ai_tathastu_sync", "Epoch 2", testStudentId);
      expect(regrant.consentEpoch).toBeGreaterThanOrEqual(2);

      // Enqueue an ordinary event with stale consent epoch 1
      const staleKey = `aitathastu:stale_epoch_event_${Date.now()}`;
      await db.execute(sql`
        INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
        VALUES (
          'mentorship.outcomes.synced',
          ${JSON.stringify({ studentUserId: testStudentId, consentEpoch: 1, notes: "Stale Epoch 1 Data" })},
          'aitathastu',
          'pending',
          ${staleKey}
        );
      `);

      process.env.MOCK_TATHASTU_API_URL = "http://localhost:9999/mock-tathastu";
      await processOutboxBatch(10, "worker-stale-test");

      // Verify the stale event was suppressed by outbox worker and NOT delivered
      const staleRow: any = await db.execute(sql`
        SELECT status, error_message FROM outbox_events WHERE idempotency_key = ${staleKey};
      `);
      expect(staleRow.rows[0].status).toBe("suppressed");
      expect(staleRow.rows[0].error_message).toContain("stale");
      expect(staleRow.rows[0].error_message).toContain("epoch (1)");
    });

    // 9. Tombstone delivery does not reactivate consent
    it("9. Tombstone delivery does not reactivate consent", async () => {
      const db = getDb();
      await db.execute(sql`DELETE FROM outbox_events WHERE payload->>'studentUserId' = ${testStudentId} OR payload->>'studentId' = ${testStudentId};`);
      StudentConsentService.resetCache();

      // Student revokes consent
      await StudentConsentService.revokeConsent(testStudentId, "ai_tathastu_sync", "Opt-out 9", testStudentId);
      expect(await StudentConsentService.hasConsent(testStudentId, "ai_tathastu_sync")).toBe(false);

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any, init: any) => {
        if (url.toString().includes("/v1/students/revocation")) {
          return new Response(JSON.stringify({ receiptId: "ack-9", status: "purged" }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        return originalFetch(url, init);
      };

      try {
        process.env.MOCK_TATHASTU_API_URL = "http://localhost:9999/mock-tathastu";
        await processOutboxBatch(10, "worker-reactivation-check");

        // Verify consent is STILL false after tombstone delivery
        const hasConsentAfter = await StudentConsentService.hasConsent(testStudentId, "ai_tathastu_sync");
        expect(hasConsentAfter).toBe(false);

        const dbConsent: any = await db.execute(sql`
          SELECT is_granted FROM student_purpose_consents
          WHERE student_user_id = ${testStudentId} AND purpose = 'ai_tathastu_sync';
        `);
        expect(dbConsent.rows[0].is_granted).toBe(false);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    // 10. A dead-lettered deletion remains visible and requires operational resolution
    it("10. A dead-lettered deletion remains visible and requires operational resolution", async () => {
      const db = getDb();
      await db.execute(sql`DELETE FROM outbox_events WHERE payload->>'studentUserId' = ${testStudentId} OR payload->>'studentId' = ${testStudentId};`);
      StudentConsentService.resetCache();

      await StudentConsentService.revokeConsent(testStudentId, "ai_tathastu_sync", "DLQ test", testStudentId);

      const dlqKey = `aitathastu:dlq_test_${Date.now()}`;
      await db.execute(sql`
        INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key, retry_count)
        VALUES (
          'student.consent.revoked',
          ${JSON.stringify({ studentUserId: testStudentId, action: "purge" })},
          'aitathastu',
          'pending',
          ${dlqKey},
          4
        );
      `);

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any, init: any) => {
        if (url.toString().includes("/v1/students/revocation")) {
          return new Response(JSON.stringify({ error: "Destination permanently corrupted" }), { status: 500 });
        }
        return originalFetch(url, init);
      };

      try {
        process.env.MOCK_TATHASTU_API_URL = "http://localhost:9999/mock-tathastu";
        await processOutboxBatch(10, "worker-dlq-test");

        // Verify status is dead_letter with retry_count = 5
        const dlqRow: any = await db.execute(sql`
          SELECT status, retry_count, error_message FROM outbox_events WHERE idempotency_key = ${dlqKey};
        `);
        expect(dlqRow.rows[0].status).toBe("dead_letter");
        expect(dlqRow.rows[0].retry_count).toBe(5);
        expect(dlqRow.rows[0].error_message).toContain("500");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  // =========================================================================
  // 6. INBOUND AUTHORIZATION SEPARATION, FRESHNESS & CONFIDENCE ANTI-OVERWRITE
  // =========================================================================
  describe("6. Inbound Authorization Separation, Freshness & Confidence Anti-Overwrite", () => {
    it("rejects inbound ingestion when student consent has expired", async () => {
      // Grant with expired date (-1 day)
      await StudentConsentService.grantConsent(
        testStudentId,
        "external_data_integration",
        "Expired grant",
        testStudentId,
        -1 // -1 day => expiresAt is yesterday
      );

      const token = await AITathastuInboundAuthService.createSignedServiceToken();
      const payload: InboundTathastuPayload = {
        eventId: `ev-expired-consent-${Date.now()}`,
        eventType: "student.skills.verified",
        sourceSystem: "ai-tathastu",
        targetTenant: "mentormaze",
        studentUserId: testStudentId,
        timestamp: new Date().toISOString(),
        data: { verifiedSkills: [] },
      };

      await expect(
        AITathastuInboundAuthService.processInboundEvent(`Bearer ${token}`, payload)
      ).rejects.toThrow("403_FORBIDDEN: Inbound ingestion blocked");
    });

    it("does NOT overwrite newer local skill node with older external timestamp (anti-overwrite)", async () => {
      const db = getDb();
      // Ensure student has valid consent
      await StudentConsentService.grantConsent(testStudentId, "external_data_integration", "Valid grant", testStudentId);

      const skillName = "Advanced Graph Algorithms";
      const skillId = "advanced-graph-algorithms";
      const skillHash = crypto.createHash("md5").update(`${testStudentId}:${skillId}`).digest("hex");
      const nodeId = `skn-${skillHash}`;

      // Local newer skill updated at May 20, 2026
      const localDate = new Date("2026-05-20T12:00:00Z");
      await db
        .insert(studentSkillNodes)
        .values({
          id: nodeId,
          studentUserId: testStudentId,
          skillId,
          skillName,
          category: "DSA",
          masteryState: "expert",
          masteryScore: 9.5,
          confidence: 0.95,
          evidenceType: "mentor_verified",
          evidenceSource: "Local Human Mentor Review",
          evidenceId: "local-eval-1",
          knownWeaknesses: [],
          commonMisconceptions: [],
          lastAssessedAt: localDate,
          updatedAt: localDate,
        })
        .onConflictDoUpdate({
          target: studentSkillNodes.id,
          set: {
            masteryScore: 9.5,
            masteryState: "expert",
            confidence: 0.95,
            updatedAt: localDate,
          },
        });

      // External payload with older timestamp (May 1, 2026) and lower score
      const olderDate = "2026-05-01T12:00:00Z";
      const token = await AITathastuInboundAuthService.createSignedServiceToken();
      const payload: InboundTathastuPayload = {
        eventId: `ev-stale-${Date.now()}`,
        eventType: "student.skills.verified",
        sourceSystem: "ai-tathastu",
        targetTenant: "mentormaze",
        studentUserId: testStudentId,
        timestamp: olderDate,
        data: {
          verifiedSkills: [
            {
              skillName,
              category: "DSA",
              masteryScore: 5.0, // Stale lower score
              masteryState: "practicing",
              verificationConfidence: 0.95,
            },
          ],
        },
      };

      const result = await AITathastuInboundAuthService.processInboundEvent(`Bearer ${token}`, payload);
      expect(result.success).toBe(true);

      // Verify the local skill node was preserved and NOT overwritten
      const checkNode: any = await db
        .select()
        .from(studentSkillNodes)
        .where(eq(studentSkillNodes.id, nodeId))
        .limit(1);

      expect(checkNode[0].masteryScore).toBe(9.5);
      expect(checkNode[0].masteryState).toBe("expert");
    });

    it("does NOT downgrade higher-confidence local skill with lower-confidence external assessment", async () => {
      const db = getDb();
      await StudentConsentService.grantConsent(testStudentId, "external_data_integration", "Valid grant", testStudentId);

      const skillName = "PostgreSQL Concurrency & Locking";
      const skillId = "postgresql-concurrency---locking";
      const skillHash = crypto.createHash("md5").update(`${testStudentId}:${skillId}`).digest("hex");
      const nodeId = `skn-${skillHash}`;

      const baseDate = new Date("2026-05-01T12:00:00Z");
      await db
        .insert(studentSkillNodes)
        .values({
          id: nodeId,
          studentUserId: testStudentId,
          skillId,
          skillName,
          category: "Core CS",
          masteryState: "advanced",
          masteryScore: 8.8,
          confidence: 0.98, // High local confidence
          evidenceType: "independently_verified",
          evidenceSource: "Verified Live Lab",
          evidenceId: "lab-101",
          knownWeaknesses: [],
          commonMisconceptions: [],
          lastAssessedAt: baseDate,
          updatedAt: baseDate,
        })
        .onConflictDoUpdate({
          target: studentSkillNodes.id,
          set: {
            masteryScore: 8.8,
            confidence: 0.98,
            updatedAt: baseDate,
          },
        });

      // External payload with newer date but low confidence (e.g. 0.65 heuristic inference)
      const newerDate = "2026-05-25T12:00:00Z";
      const token = await AITathastuInboundAuthService.createSignedServiceToken();
      const payload: InboundTathastuPayload = {
        eventId: `ev-low-conf-${Date.now()}`,
        eventType: "student.skills.verified",
        sourceSystem: "ai-tathastu",
        targetTenant: "mentormaze",
        studentUserId: testStudentId,
        timestamp: newerDate,
        data: {
          verifiedSkills: [
            {
              skillName,
              category: "Core CS",
              masteryScore: 4.0,
              masteryState: "novice",
              verificationConfidence: 0.65, // Lower confidence
            },
          ],
        },
      };

      const result = await AITathastuInboundAuthService.processInboundEvent(`Bearer ${token}`, payload);
      expect(result.success).toBe(true);

      const checkNode: any = await db
        .select()
        .from(studentSkillNodes)
        .where(eq(studentSkillNodes.id, nodeId))
        .limit(1);

      expect(checkNode[0].confidence).toBe(0.98);
      expect(checkNode[0].masteryScore).toBe(8.8);
      expect(checkNode[0].masteryState).toBe("advanced");
    });
  });

  // =========================================================================
  // 7. M2M JWT SECURITY & INBOUND ROUTE GATEWAY VERIFICATION
  // =========================================================================
  describe("7. M2M JWT Security & Inbound Route Gateway Verification", () => {
    it("rejects token with unrecognized key identifier (kid)", async () => {
      const token = await AITathastuInboundAuthService.createSignedServiceToken({
        kid: "unrecognized-rogue-kid-999",
      });

      const payload: InboundTathastuPayload = {
        eventId: `ev-kid-${Date.now()}`,
        eventType: "student.skills.verified",
        sourceSystem: "ai-tathastu",
        targetTenant: "mentormaze",
        studentUserId: testStudentId,
        timestamp: new Date().toISOString(),
        data: {},
      };

      await expect(
        AITathastuInboundAuthService.processInboundEvent(`Bearer ${token}`, payload)
      ).rejects.toThrow("401_UNAUTHORIZED: Unrecognized key identifier");
    });

    it("rejects token with unsupported or insecure algorithm", async () => {
      // Create token with HS384 instead of HS256
      const token = await AITathastuInboundAuthService.createSignedServiceToken({
        alg: "HS384",
      });

      const payload: InboundTathastuPayload = {
        eventId: `ev-alg-${Date.now()}`,
        eventType: "student.skills.verified",
        sourceSystem: "ai-tathastu",
        targetTenant: "mentormaze",
        studentUserId: testStudentId,
        timestamp: new Date().toISOString(),
        data: {},
      };

      await expect(
        AITathastuInboundAuthService.processInboundEvent(`Bearer ${token}`, payload)
      ).rejects.toThrow("401_UNAUTHORIZED: Unsupported or insecure signing algorithm");
    });

    it("rejects token with insufficient or missing scope", async () => {
      const token = await AITathastuInboundAuthService.createSignedServiceToken({
        scope: "read:public_profiles", // Missing ecosystem sync scope
      });

      const payload: InboundTathastuPayload = {
        eventId: `ev-scope-${Date.now()}`,
        eventType: "student.skills.verified",
        sourceSystem: "ai-tathastu",
        targetTenant: "mentormaze",
        studentUserId: testStudentId,
        timestamp: new Date().toISOString(),
        data: {},
      };

      await expect(
        AITathastuInboundAuthService.processInboundEvent(`Bearer ${token}`, payload)
      ).rejects.toThrow("403_FORBIDDEN: Insufficient token scope");
    });

    it("atomic database replay defense rejects duplicate eventId via inbound_event_ledger", async () => {
      await StudentConsentService.grantConsent(testStudentId, "external_data_integration", "DB Replay test", testStudentId);

      const dbReplayEventId = `ev-db-atomic-${Date.now()}`;
      const token = await AITathastuInboundAuthService.createSignedServiceToken();

      const payload: InboundTathastuPayload = {
        eventId: dbReplayEventId,
        eventType: "student.skills.verified",
        sourceSystem: "ai-tathastu",
        targetTenant: "mentormaze",
        studentUserId: testStudentId,
        timestamp: new Date().toISOString(),
        data: { verifiedSkills: [] },
      };

      // First call succeeds and records in inbound_event_ledger
      const first = await AITathastuInboundAuthService.processInboundEvent(`Bearer ${token}`, payload);
      expect(first.success).toBe(true);

      // Reset memory cache to simulate a multi-worker restart or race condition
      AITathastuInboundAuthService.resetReplayCache();

      // Second call must be caught by PostgreSQL primary key constraint in inbound_event_ledger
      await expect(
        AITathastuInboundAuthService.processInboundEvent(`Bearer ${token}`, payload)
      ).rejects.toThrow("409_CONFLICT: Replay attack detected");
    });

    it("inbound HTTP route enforces 256KB payload size limit with 413 Payload Too Large", async () => {
      const { POST } = await import("@/app/api/integrations/ai-tathastu/inbound/route");

      // Construct a payload larger than 256KB (e.g. 270KB)
      const oversizedData = "x".repeat(270 * 1024);
      const oversizedPayload = JSON.stringify({
        eventId: "ev-oversized-1",
        data: { blob: oversizedData },
      });

      const req = new NextRequest("http://localhost:3000/api/integrations/ai-tathastu/inbound", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": String(Buffer.byteLength(oversizedPayload, "utf8")),
        },
        body: oversizedPayload,
      });

      const res = await POST(req);
      expect(res.status).toBe(413);

      const data = await res.json();
      expect(data.error).toContain("Payload Too Large");
    });
  });
});
