/**
 * ASTRION Phase 1 Recovery Test Suite
 * Validates SQL persistence, tenant isolation, cross-user privacy, idempotent migrations,
 * and strongly typed domain contracts.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { initializeDatabaseSchema } from "../lib/db";
import { ConversationStore } from "../lib/ai-mentor/conversation-store";
import { StudentMemoryService } from "../lib/ai-mentor/student-memory-service";
import { migrateLegacyConversations } from "../scripts/migrate-legacy-conversations";
import { migrateLegacyMemories } from "../scripts/migrate-legacy-memories";
import {
  ASTRION_CORE_IDENTITY,
  CANONICAL_SPECIALISTS,
  AstrionError,
  SpecialistCodeName,
} from "../lib/ai-mentor/contracts";
import { SpecialistRegistry } from "../lib/ai-mentor/specialists/specialist-registry";

describe("ASTRION Phase 1: Database Persistence & Contracts Suite", () => {
  const studentA = "usr-test-student-A-phase1";
  const studentB = "usr-test-student-B-phase1";

  beforeAll(async () => {
    // Ensure all 68 platform tables and 17 AI tables are initialized in test DB
    await initializeDatabaseSchema();
  });

  // 1. CONVERSATION PERSISTENCE & RETRIEVAL
  describe("1. Conversation Persistence & Message Ordering", () => {
    let createdConvId: string;

    it("should create and retrieve a conversation with exact metadata", async () => {
      const conv = ConversationStore.createConversation(
        studentA,
        "System Architecture: Distributed Consensus",
        "system_design",
        "distributed_systems",
        "en"
      );

      expect(conv.id).toBeDefined();
      expect(conv.studentUserId).toBe(studentA);
      expect(conv.title).toBe("System Architecture: Distributed Consensus");
      expect(conv.mode).toBe("system_design");
      createdConvId = conv.id;

      const retrieved = ConversationStore.getConversation(studentA, createdConvId);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(createdConvId);
      expect(retrieved?.studentUserId).toBe(studentA);
    });

    it("should preserve message ordering and metadata deterministically", async () => {
      const msg1 = ConversationStore.addMessage(
        createdConvId,
        studentA,
        "user",
        "How does Raft leader election handle network partitions?"
      );
      const msg2 = ConversationStore.addMessage(
        createdConvId,
        studentA,
        "assistant",
        "In Raft, a leader requires a strict quorum of (N/2 + 1) votes before committing log entries.",
        {
          teachingStrategy: "conceptual_explanation",
          hintLevel: 1,
          difficulty: "advanced",
          latencyMs: 142.5,
        }
      );
      const msg3 = ConversationStore.addMessage(
        createdConvId,
        studentA,
        "user",
        "What happens when the minority partition rejoins?"
      );

      const messages = ConversationStore.getMessages(studentA, createdConvId);
      expect(messages.length).toBe(3);
      expect(messages[0].id).toBe(msg1.id);
      expect(messages[0].role).toBe("user");
      expect(messages[1].id).toBe(msg2.id);
      expect(messages[1].role).toBe("assistant");
      expect(messages[1].teachingStrategy).toBe("conceptual_explanation");
      expect(messages[2].id).toBe(msg3.id);
      expect(messages[2].role).toBe("user");

      // Verify pagination
      const page1 = ConversationStore.getMessages(studentA, createdConvId, 2, 0);
      expect(page1.length).toBe(2);
      expect(page1[0].id).toBe(msg1.id);
      expect(page1[1].id).toBe(msg2.id);

      const page2 = ConversationStore.getMessages(studentA, createdConvId, 2, 2);
      expect(page2.length).toBe(1);
      expect(page2[0].id).toBe(msg3.id);
    });

    it("should support renaming and deleting conversations cleanly", async () => {
      const updated = ConversationStore.renameConversation(
        studentA,
        createdConvId,
        "Raft & Paxos Consensus Deep Dive"
      );
      expect(updated.title).toBe("Raft & Paxos Consensus Deep Dive");

      const deleted = ConversationStore.deleteConversation(studentA, createdConvId);
      expect(deleted).toBe(true);

      const check = ConversationStore.getConversation(studentA, createdConvId);
      expect(check).toBeNull();
      expect(ConversationStore.getMessages(studentA, createdConvId).length).toBe(0);
    });
  });

  // 2. CONVERSATION TENANT ISOLATION & PRIVACY
  describe("2. Conversation Tenant Isolation", () => {
    let studentAConvId: string;

    beforeAll(() => {
      const conv = ConversationStore.createConversation(studentA, "Student A Private Session", "learn");
      studentAConvId = conv.id;
      ConversationStore.addMessage(studentAConvId, studentA, "user", "Confidential research plan");
    });

    it("should strictly reject Student B attempting to access Student A's conversation", () => {
      expect(() => {
        ConversationStore.getConversation(studentB, studentAConvId);
      }).toThrow(/403_FORBIDDEN/);
    });

    it("should strictly reject Student B attempting to view Student A's messages", () => {
      expect(() => {
        ConversationStore.getMessages(studentB, studentAConvId);
      }).toThrow(/403_FORBIDDEN/);
    });

    it("should strictly reject Student B attempting to append to Student A's conversation", () => {
      expect(() => {
        ConversationStore.addMessage(studentAConvId, studentB, "user", "Malicious injection attempt");
      }).toThrow(/403_FORBIDDEN/);
    });
  });

  // 3. STUDENT MEMORY PERSISTENCE & PRIVACY
  describe("3. Student Memory CRUD & Ownership Isolation", () => {
    it("should create, retrieve, and update memory across canonical categories", () => {
      const mem = StudentMemoryService.saveMemory(
        studentA,
        "career_objectives",
        "Target Level",
        "Staff Systems Architect at Infrastructure Startup",
        "student_reported",
        0.98,
        false
      );

      expect(mem.id).toBeDefined();
      expect(mem.studentUserId).toBe(studentA);
      expect(mem.category).toBe("career_objectives");
      expect(mem.value).toBe("Staff Systems Architect at Infrastructure Startup");
      expect(mem.confidence).toBe(0.98);

      const list = StudentMemoryService.getMemories(studentA);
      const found = list.find((m) => m.key === "Target Level");
      expect(found).toBeDefined();
      expect(found?.value).toBe("Staff Systems Architect at Infrastructure Startup");
    });

    it("should enforce cross-user privacy isolation when accessing memories", () => {
      // Student B attempting to read Student A's profile
      expect(() => {
        StudentMemoryService.getMemories(studentA, studentB);
      }).toThrow(/403_FORBIDDEN/);

      // Student B attempting to write to Student A's profile
      expect(() => {
        StudentMemoryService.saveMemory(
          studentA,
          "learning_preferences",
          "Hacked Preference",
          "Malicious Value",
          "student_reported",
          1.0,
          false,
          undefined,
          true,
          studentB
        );
      }).toThrow(/403_FORBIDDEN/);

      // Student B attempting to delete Student A's memory
      expect(() => {
        StudentMemoryService.deleteMemory(studentA, "mem-some-id", studentB);
      }).toThrow(/403_FORBIDDEN/);
    });
  });

  // 4. MIGRATION REPEATABILITY & IDEMPOTENCY
  describe("4. Migration Idempotency & Legacy Data Integrity", () => {
    it("should idempotently migrate conversations without duplicate insertion", async () => {
      const run1 = await migrateLegacyConversations();
      expect(run1.totalConversationsInJson).toBeGreaterThanOrEqual(33);
      expect(run1.totalMessagesInJson).toBeGreaterThanOrEqual(58);
      expect(run1.conversationsFailed).toBe(0);
      expect(run1.messagesFailed).toBe(0);

      // Second execution: must be 100% idempotent
      const run2 = await migrateLegacyConversations();
      expect(run2.conversationsImported).toBe(0);
      expect(run2.messagesImported).toBe(0);
      expect(run2.conversationsSkipped).toBe(run1.totalConversationsInJson);
      expect(run2.messagesSkipped).toBe(run1.totalMessagesInJson);
      expect(run2.conversationsFailed).toBe(0);
      expect(run2.messagesFailed).toBe(0);
    });

    it("should idempotently migrate memories across all 8 categories without data loss", async () => {
      const run1 = await migrateLegacyMemories();
      expect(run1.totalUsersInJson).toBeGreaterThanOrEqual(14);
      expect(run1.totalMemoriesInJson).toBeGreaterThanOrEqual(55);
      expect(run1.memoriesFailed).toBe(0);

      // Second execution: must be 100% idempotent
      const run2 = await migrateLegacyMemories();
      expect(run2.memoriesImported).toBe(0);
      expect(run2.memoriesSkipped).toBe(run1.totalMemoriesInJson);
      expect(run2.duplicateMemories).toBe(run1.totalMemoriesInJson);
      expect(run2.memoriesFailed).toBe(0);
    });
  });

  // 5. ASTRION DOMAIN CONTRACTS
  describe("5. ASTRION Domain Contracts & Registry", () => {
    it("should verify ASTRION CORE central brand identity contract", () => {
      expect(ASTRION_CORE_IDENTITY.id).toBe("astrion-core");
      expect(ASTRION_CORE_IDENTITY.brandName).toBe("ASTRION");
      expect(ASTRION_CORE_IDENTITY.parentProduct).toBe("MentorMaze");
      expect(ASTRION_CORE_IDENTITY.parentEcosystem).toBe("AI Tathastu");
      expect(ASTRION_CORE_IDENTITY.version).toBe("1.0.0");
    });

    it("should verify all 8 canonical specialist capability contracts", () => {
      const expectedCodes: SpecialistCodeName[] = [
        "SAGE",
        "CIPHER",
        "ATLAS",
        "FORGE",
        "VECTRA",
        "PRISM",
        "ORACLE",
        "CHRONOS",
      ];

      for (const code of expectedCodes) {
        const contract = CANONICAL_SPECIALISTS[code];
        expect(contract).toBeDefined();
        expect(contract.codeName).toBe(code);
        expect(contract.isAvailable).toBe(true);
        expect(contract.domainTags.length).toBeGreaterThan(0);
        expect(contract.intentKeywords.length).toBeGreaterThan(0);

        // Verify SpecialistRegistry resolves canonical contract
        const registryContract = SpecialistRegistry.getCanonicalContract(code);
        expect(registryContract.codeName).toBe(code);

        const specialistImpl = SpecialistRegistry.getSpecialistByCodeName(code);
        expect(specialistImpl).toBeDefined();
        expect(specialistImpl.id).toBe(contract.focusAreaId);
      }
    });

    it("should format and handle typed AstrionErrors with HTTP status codes", () => {
      const err = AstrionError.forbidden("Cross-tenant access blocked.");
      expect(err.code).toBe("OWNERSHIP_VIOLATION");
      expect(err.statusCode).toBe(403);
      expect(err.message).toBe("Cross-tenant access blocked.");

      const json = err.toJSON();
      expect(json.success).toBe(false);
      expect(json.statusCode).toBe(403);
      expect(json.code).toBe("OWNERSHIP_VIOLATION");
    });
  });
});
