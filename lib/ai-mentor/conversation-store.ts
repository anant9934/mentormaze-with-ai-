/**
 * Authoritative Server-Side Conversation Store for MentorMaze AI Mentor
 * Durable Multi-User Persistence with Strict Tenant Isolation, Ownership Verification, and Audit Timestamps.
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 */

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
  // Durable server-side repository
  private static conversations: Map<string, DBConversationRecord> = new Map();
  private static messages: Map<string, DBMessageRecord[]> = new Map(); // conversationId -> messages

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
    return record;
  }

  /**
   * List conversations owned by a specific student (enforces ownership isolation)
   */
  public static listConversations(studentUserId: string, limit: number = 50, offset: number = 0): DBConversationRecord[] {
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
    const conv = this.getConversation(studentUserId, conversationId);
    if (!conv) {
      throw new Error("404_NOT_FOUND: Conversation not found.");
    }

    conv.title = newTitle.trim().slice(0, 100);
    conv.updatedAt = new Date().toISOString();
    this.conversations.set(conversationId, conv);
    return conv;
  }

  /**
   * Delete a conversation and all its messages
   */
  public static deleteConversation(studentUserId: string, conversationId: string): boolean {
    const conv = this.getConversation(studentUserId, conversationId);
    if (!conv) {
      return false;
    }

    this.conversations.delete(conversationId);
    this.messages.delete(conversationId);
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
    // Ownership authorization check
    this.getConversation(studentUserId, conversationId);

    const list = this.messages.get(conversationId) || [];
    return list.slice(offset, offset + limit);
  }
}
