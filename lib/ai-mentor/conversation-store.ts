/**
 * Authoritative Server-Side Conversation Store for MentorMaze AI Mentor
 * Durable Multi-User Persistence with Strict Tenant Isolation, Ownership Verification, and Audit Timestamps.
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 */

import fs from "fs";
import path from "path";
import { TeachingMode, LanguageCode, SourceCitation, RecommendedAction, SkillUpdate, EscalationRecommendation } from "./types";

export interface DBConversationRecord {
  id: string;
  studentUserId: string;
  title: string;
  mode: TeachingMode;
  activeTopic: string;
  languagePreference: LanguageCode;
  createdAt: string;
  updatedAt: string;
}

export interface DBMessageRecord {
  id: string;
  conversationId: string;
  studentUserId: string;
  role: "user" | "assistant" | "system";
  content: string;
  teachingStrategy?: string;
  hintLevel?: number;
  difficulty?: string;
  studentUnderstandingSignal?: string;
  sources?: SourceCitation[];
  recommendedActions?: RecommendedAction[];
  skillUpdates?: SkillUpdate[];
  escalation?: EscalationRecommendation;
  latencyMs?: number;
  modelProvider?: string;
  inferenceMode?: "generative" | "deterministic";
  createdAt: string;
}

export class ConversationStore {
  // Durable server-side repository with disk persistence backing
  private static conversations: Map<string, DBConversationRecord> = new Map();
  private static messages: Map<string, DBMessageRecord[]> = new Map(); // conversationId -> messages
  private static storageFilePath = path.resolve(process.cwd(), ".mentormaze-conversations.json");
  private static isInitialized = false;

  /**
   * Initializes and restores persisted conversations and messages from disk
   */
  private static ensureLoaded(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      if (fs.existsSync(this.storageFilePath)) {
        const raw = fs.readFileSync(this.storageFilePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.conversations && typeof parsed.conversations === "object") {
          for (const [id, rec] of Object.entries(parsed.conversations)) {
            this.conversations.set(id, rec as DBConversationRecord);
          }
        }
        if (parsed.messages && typeof parsed.messages === "object") {
          for (const [id, msgs] of Object.entries(parsed.messages)) {
            this.messages.set(id, msgs as DBMessageRecord[]);
          }
        }
      }
    } catch (err) {
      console.warn("[ConversationStore] Failed to load persisted conversations from disk:", err);
    }
  }

  /**
   * Persists current conversation state synchronously to disk
   */
  private static persistToDisk(): void {
    try {
      const convObj: Record<string, DBConversationRecord> = {};
      for (const [id, rec] of this.conversations.entries()) {
        convObj[id] = rec;
      }

      const msgObj: Record<string, DBMessageRecord[]> = {};
      for (const [id, msgs] of this.messages.entries()) {
        msgObj[id] = msgs;
      }

      const payload = JSON.stringify({ conversations: convObj, messages: msgObj }, null, 2);
      fs.writeFileSync(this.storageFilePath, payload, "utf-8");
    } catch (err) {
      console.warn("[ConversationStore] Failed to write conversations to disk:", err);
    }
  }

  /**
   * Create a new persistent conversation for a student
   */
  public static createConversation(
    studentUserId: string,
    title: string = "New Mentorship Session",
    mode: TeachingMode = "learn",
    activeTopic: string = "general",
    languagePreference: LanguageCode = "en"
  ): DBConversationRecord {
    this.ensureLoaded();
    const id = `conv-${studentUserId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    const record: DBConversationRecord = {
      id,
      studentUserId,
      title,
      mode,
      activeTopic,
      languagePreference,
      createdAt: now,
      updatedAt: now,
    };

    this.conversations.set(id, record);
    this.messages.set(id, []);
    this.persistToDisk();
    return record;
  }

  /**
   * List conversations owned by a specific student (enforces ownership isolation)
   */
  public static listConversations(studentUserId: string, limit: number = 50, offset: number = 0): DBConversationRecord[] {
    this.ensureLoaded();
    const userConvs: DBConversationRecord[] = [];
    for (const conv of this.conversations.values()) {
      if (conv.studentUserId === studentUserId) {
        userConvs.push(conv);
      }
    }

    userConvs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return userConvs.slice(offset, offset + limit);
  }

  /**
   * Get single conversation with ownership security check
   */
  public static getConversation(studentUserId: string, conversationId: string): DBConversationRecord | null {
    this.ensureLoaded();
    const conv = this.conversations.get(conversationId);
    if (!conv) return null;

    // Security check: Student A cannot access Student B's conversation
    if (conv.studentUserId !== studentUserId) {
      throw new Error("403_FORBIDDEN: You do not have permission to access this conversation.");
    }

    return conv;
  }

  /**
   * Rename a conversation title
   */
  public static renameConversation(studentUserId: string, conversationId: string, newTitle: string): DBConversationRecord {
    this.ensureLoaded();
    const conv = this.getConversation(studentUserId, conversationId);
    if (!conv) {
      throw new Error("404_NOT_FOUND: Conversation not found.");
    }

    conv.title = newTitle.trim().slice(0, 100);
    conv.updatedAt = new Date().toISOString();
    this.conversations.set(conversationId, conv);
    this.persistToDisk();
    return conv;
  }

  /**
   * Delete a conversation and all its messages permanently
   */
  public static deleteConversation(studentUserId: string, conversationId: string): boolean {
    this.ensureLoaded();
    const conv = this.getConversation(studentUserId, conversationId);
    if (!conv) {
      return false;
    }

    this.conversations.delete(conversationId);
    this.messages.delete(conversationId);
    this.persistToDisk();
    return true;
  }

  /**
   * Append a message to an existing conversation
   */
  public static addMessage(
    conversationId: string,
    studentUserId: string,
    role: "user" | "assistant" | "system",
    content: string,
    metadata: {
      teachingStrategy?: string;
      hintLevel?: number;
      difficulty?: string;
      studentUnderstandingSignal?: string;
      sources?: SourceCitation[];
      recommendedActions?: RecommendedAction[];
      skillUpdates?: SkillUpdate[];
      escalation?: EscalationRecommendation;
      latencyMs?: number;
      modelProvider?: string;
      inferenceMode?: "generative" | "deterministic";
    } = {}
  ): DBMessageRecord {
    this.ensureLoaded();
    let conv = this.conversations.get(conversationId);
    if (!conv) {
      // Auto-create conversation if it doesn't exist yet
      conv = this.createConversation(studentUserId, content.slice(0, 40) + "...", "learn");
      conversationId = conv.id;
    } else if (conv.studentUserId !== studentUserId) {
      throw new Error("403_FORBIDDEN: You do not have permission to append messages to this conversation.");
    }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const record: DBMessageRecord = {
      id: messageId,
      conversationId,
      studentUserId,
      role,
      content,
      teachingStrategy: metadata.teachingStrategy,
      hintLevel: metadata.hintLevel,
      difficulty: metadata.difficulty,
      studentUnderstandingSignal: metadata.studentUnderstandingSignal,
      sources: metadata.sources,
      recommendedActions: metadata.recommendedActions,
      skillUpdates: metadata.skillUpdates,
      escalation: metadata.escalation,
      latencyMs: metadata.latencyMs,
      modelProvider: metadata.modelProvider,
      inferenceMode: metadata.inferenceMode,
      createdAt: now,
    };

    const list = this.messages.get(conversationId) || [];
    list.push(record);
    this.messages.set(conversationId, list);

    // Update conversation timestamp
    conv.updatedAt = now;
    this.conversations.set(conversationId, conv);

    this.persistToDisk();
    return record;
  }

  /**
   * Retrieve messages for a conversation with pagination
   */
  public static getMessages(
    studentUserId: string,
    conversationId: string,
    limit: number = 100,
    offset: number = 0
  ): DBMessageRecord[] {
    this.ensureLoaded();
    // Ownership authorization check
    this.getConversation(studentUserId, conversationId);

    const list = this.messages.get(conversationId) || [];
    return list.slice(offset, offset + limit);
  }

  /**
   * For testing: force clear cache and reload from disk
   */
  public static reloadFromDisk(): void {
    this.conversations.clear();
    this.messages.clear();
    this.isInitialized = false;
    this.ensureLoaded();
  }
}
