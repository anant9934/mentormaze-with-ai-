/**
 * Authoritative Server-Side Conversation Store for MentorMaze AI Mentor
 * Durable Multi-User Persistence with Strict Tenant Isolation, Ownership Verification, and SQL Backing.
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 */

import fs from "fs";
import path from "path";
import { getDb } from "../db";
import { aiMentorConversations, aiMentorMessages } from "../db/ai-mentor-schema";
import { eq, desc, asc, and } from "drizzle-orm";
import {
  TeachingMode,
  LanguageCode,
  SourceCitation,
  RecommendedAction,
  SkillUpdate,
  EscalationRecommendation,
} from "./types";

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
  inferenceMode?: "generative" | "deterministic" | "fine-tuned-2b";
  createdAt: string;
}

export class ConversationStore {
  // Durable SQL-backed repository with synchronized in-memory caching
  private static conversations: Map<string, DBConversationRecord> = new Map();
  private static messages: Map<string, DBMessageRecord[]> = new Map(); // conversationId -> messages
  private static get storageFilePath(): string {
    if (process.env.NODE_ENV === "test" || process.env.VITEST) {
      const fixtureDir = path.resolve(process.cwd(), "tests", "fixtures");
      if (!fs.existsSync(fixtureDir)) {
        fs.mkdirSync(fixtureDir, { recursive: true });
      }
      const testFile = path.resolve(fixtureDir, ".test-conversations.json");
      if (!fs.existsSync(testFile)) {
        const rootFile = path.resolve(process.cwd(), ".mentormaze-conversations.json");
        if (fs.existsSync(rootFile)) {
          fs.copyFileSync(rootFile, testFile);
        }
      }
      return testFile;
    }
    return path.resolve(process.cwd(), ".mentormaze-conversations.json");
  }
  private static isInitialized = false;

  /**
   * Initializes and restores persisted conversations and messages from SQL (with JSON backup fallback)
   */
  private static ensureLoaded(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      // 1. Primary Source: Authoritative SQL database
      const db = getDb();
      if (db) {
        // Asynchronously or synchronously pre-fill from SQL if possible
        this.syncFromSqlSync();
        if (this.conversations.size > 0) {
          return;
        }
      }
    } catch (sqlErr) {
      console.warn("[ConversationStore] SQL load deferred or failed:", sqlErr);
    }

    // 2. Recovery Backup Source: Disk snapshot
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
      console.warn("[ConversationStore] Failed to load persisted conversations from backup disk:", err);
    }
  }

  /**
   * Syncs conversations and messages from SQL directly into memory
   */
  private static syncFromSqlSync(): void {
    try {
      const db = getDb();
      // PGlite runs in-process, we can query its internal tables or rely on async sync
      db.select()
        .from(aiMentorConversations)
        .then((rows: any[]) => {
          for (const row of rows) {
            this.conversations.set(row.id, {
              id: row.id,
              studentUserId: row.studentUserId,
              title: row.title,
              mode: row.mode as TeachingMode,
              activeTopic: row.activeTopic,
              languagePreference: row.languagePreference as LanguageCode,
              createdAt: new Date(row.createdAt).toISOString(),
              updatedAt: new Date(row.updatedAt).toISOString(),
            });
          }
        })
        .catch(() => {});

      db.select()
        .from(aiMentorMessages)
        .then((rows: any[]) => {
          for (const row of rows) {
            const list = this.messages.get(row.conversationId) || [];
            if (!list.some((m) => m.id === row.id)) {
              list.push({
                id: row.id,
                conversationId: row.conversationId,
                studentUserId: "",
                role: row.role as any,
                content: row.content,
                teachingStrategy: row.teachingStrategy || undefined,
                hintLevel: row.hintLevel ?? 0,
                difficulty: row.difficulty || undefined,
                studentUnderstandingSignal: row.studentUnderstandingSignal || undefined,
                sources: (row.sources as any) || undefined,
                recommendedActions: (row.recommendedActions as any) || undefined,
                latencyMs: row.latencyMs ?? 0,
                createdAt: new Date(row.createdAt).toISOString(),
              });
              this.messages.set(row.conversationId, list);
            }
          }
        })
        .catch(() => {});
    } catch {
      // ignore
    }
  }

  /**
   * Persists current conversation state to disk as recovery backup
   */
  private static persistBackupToDisk(): void {
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
      console.warn("[ConversationStore] Failed to write backup snapshot to disk:", err);
    }
  }

  /**
   * Create a new persistent conversation for a student (Synchronous contract)
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

    // Persist to SQL asynchronously
    try {
      const db = getDb();
      db.insert(aiMentorConversations)
        .values({
          id,
          studentUserId,
          title,
          mode,
          activeTopic,
          languagePreference,
          createdAt: new Date(now),
          updatedAt: new Date(now),
        })
        .catch((err: any) => console.warn("[ConversationStore] Async SQL insert failed:", err));
    } catch (err) {
      console.warn("[ConversationStore] SQL connection unavailable for createConversation:", err);
    }

    this.persistBackupToDisk();
    return record;
  }

  /**
   * Create a new persistent conversation for a student (Asynchronous SQL-first contract)
   */
  public static async createConversationAsync(
    studentUserId: string,
    title: string = "New Mentorship Session",
    mode: TeachingMode = "learn",
    activeTopic: string = "general",
    languagePreference: LanguageCode = "en"
  ): Promise<DBConversationRecord> {
    const record = this.createConversation(studentUserId, title, mode, activeTopic, languagePreference);
    try {
      const db = getDb();
      await db
        .insert(aiMentorConversations)
        .values({
          id: record.id,
          studentUserId: record.studentUserId,
          title: record.title,
          mode: record.mode,
          activeTopic: record.activeTopic,
          languagePreference: record.languagePreference,
          createdAt: new Date(record.createdAt),
          updatedAt: new Date(record.updatedAt),
        })
        .onConflictDoNothing();
    } catch (err) {
      console.warn("[ConversationStore] SQL async insert error:", err);
    }
    return record;
  }

  /**
   * List conversations owned by a specific student (enforces ownership isolation)
   */
  public static listConversations(
    studentUserId: string,
    limit: number = 50,
    offset: number = 0
  ): DBConversationRecord[] {
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
   * Asynchronous SQL query for conversations owned by a student with pagination
   */
  public static async listConversationsAsync(
    studentUserId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<DBConversationRecord[]> {
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(aiMentorConversations)
        .where(eq(aiMentorConversations.studentUserId, studentUserId))
        .orderBy(desc(aiMentorConversations.updatedAt))
        .limit(limit)
        .offset(offset);

      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          studentUserId: r.studentUserId,
          title: r.title,
          mode: r.mode as TeachingMode,
          activeTopic: r.activeTopic,
          languagePreference: r.languagePreference as LanguageCode,
          createdAt: new Date(r.createdAt).toISOString(),
          updatedAt: new Date(r.updatedAt).toISOString(),
        }));
      }
    } catch (err) {
      console.warn("[ConversationStore] SQL list failed, falling back to cache:", err);
    }

    return this.listConversations(studentUserId, limit, offset);
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
   * Asynchronous SQL lookup for a single conversation with ownership check
   */
  public static async getConversationAsync(
    studentUserId: string,
    conversationId: string
  ): Promise<DBConversationRecord | null> {
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(aiMentorConversations)
        .where(eq(aiMentorConversations.id, conversationId))
        .limit(1);

      if (rows.length > 0) {
        const row = rows[0];
        if (row.studentUserId !== studentUserId) {
          throw new Error("403_FORBIDDEN: You do not have permission to access this conversation.");
        }
        return {
          id: row.id,
          studentUserId: row.studentUserId,
          title: row.title,
          mode: row.mode as TeachingMode,
          activeTopic: row.activeTopic,
          languagePreference: row.languagePreference as LanguageCode,
          createdAt: new Date(row.createdAt).toISOString(),
          updatedAt: new Date(row.updatedAt).toISOString(),
        };
      }
    } catch (err: any) {
      if (err.message?.includes("403_FORBIDDEN")) throw err;
      console.warn("[ConversationStore] SQL getConversationAsync error:", err);
    }

    return this.getConversation(studentUserId, conversationId);
  }

  /**
   * Rename a conversation title
   */
  public static renameConversation(
    studentUserId: string,
    conversationId: string,
    newTitle: string
  ): DBConversationRecord {
    this.ensureLoaded();
    const conv = this.getConversation(studentUserId, conversationId);
    if (!conv) {
      throw new Error("404_NOT_FOUND: Conversation not found.");
    }

    conv.title = newTitle.trim().slice(0, 100);
    conv.updatedAt = new Date().toISOString();
    this.conversations.set(conversationId, conv);

    try {
      const db = getDb();
      db.update(aiMentorConversations)
        .set({ title: conv.title, updatedAt: new Date(conv.updatedAt) })
        .where(and(eq(aiMentorConversations.id, conversationId), eq(aiMentorConversations.studentUserId, studentUserId)))
        .catch((err: any) => console.warn("[ConversationStore] Async rename in SQL failed:", err));
    } catch (err) {
      console.warn("[ConversationStore] SQL unavailable for rename:", err);
    }

    this.persistBackupToDisk();
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

    try {
      const db = getDb();
      // Cascade delete in SQL
      db.delete(aiMentorMessages)
        .where(eq(aiMentorMessages.conversationId, conversationId))
        .then(() => {
          return db
            .delete(aiMentorConversations)
            .where(
              and(eq(aiMentorConversations.id, conversationId), eq(aiMentorConversations.studentUserId, studentUserId))
            );
        })
        .catch((err: any) => console.warn("[ConversationStore] Async delete in SQL failed:", err));
    } catch (err) {
      console.warn("[ConversationStore] SQL unavailable for delete:", err);
    }

    this.persistBackupToDisk();
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
      inferenceMode?: "generative" | "deterministic" | "fine-tuned-2b";
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

    // Persist to SQL
    try {
      const db = getDb();
      db.insert(aiMentorMessages)
        .values({
          id: messageId,
          conversationId,
          role,
          content,
          teachingStrategy: metadata.teachingStrategy || null,
          hintLevel: metadata.hintLevel ?? 0,
          difficulty: metadata.difficulty || "intermediate",
          studentUnderstandingSignal: metadata.studentUnderstandingSignal || null,
          sources: metadata.sources || [],
          recommendedActions: metadata.recommendedActions || [],
          latencyMs: metadata.latencyMs ?? 0,
          createdAt: new Date(now),
        })
        .then(() => {
          return db
            .update(aiMentorConversations)
            .set({ updatedAt: new Date(now) })
            .where(eq(aiMentorConversations.id, conversationId));
        })
        .catch((err: any) => console.warn("[ConversationStore] Async message insert in SQL failed:", err));
    } catch (err) {
      console.warn("[ConversationStore] SQL unavailable for addMessage:", err);
    }

    this.persistBackupToDisk();
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
   * Asynchronously retrieve messages directly from SQL with pagination
   */
  public static async getMessagesAsync(
    studentUserId: string,
    conversationId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<DBMessageRecord[]> {
    // Ownership authorization check
    await this.getConversationAsync(studentUserId, conversationId);

    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(aiMentorMessages)
        .where(eq(aiMentorMessages.conversationId, conversationId))
        .orderBy(asc(aiMentorMessages.createdAt))
        .limit(limit)
        .offset(offset);

      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          conversationId: r.conversationId,
          studentUserId,
          role: r.role as any,
          content: r.content,
          teachingStrategy: r.teachingStrategy || undefined,
          hintLevel: r.hintLevel ?? 0,
          difficulty: r.difficulty || undefined,
          studentUnderstandingSignal: r.studentUnderstandingSignal || undefined,
          sources: (r.sources as any) || undefined,
          recommendedActions: (r.recommendedActions as any) || undefined,
          latencyMs: r.latencyMs ?? 0,
          createdAt: new Date(r.createdAt).toISOString(),
        }));
      }
    } catch (err) {
      console.warn("[ConversationStore] SQL getMessagesAsync error:", err);
    }

    return this.getMessages(studentUserId, conversationId, limit, offset);
  }

  /**
   * For testing: force clear cache and reload from disk/SQL
   */
  public static reloadFromDisk(): void {
    this.conversations.clear();
    this.messages.clear();
    this.isInitialized = false;
    this.ensureLoaded();
  }
}
