/**
 * Student Memory Lifecycle Service
 * Manages persistent preferences, goals, diagnosed gaps, and explicit student-confirmed facts with SQL Backing.
 * Brand: MentorMaze by AI Tathastu
 */

import fs from "fs";
import path from "path";
import { getDb } from "../db";
import { studentMemory } from "../db/ai-mentor-schema";
import { eq, and, or, isNull, gt } from "drizzle-orm";
import { ProvenanceType } from "./types";
import { StudentConsentService } from "./student-consent-service";

export type MemoryCategory =
  | "learning_preferences"
  | "current_goals"
  | "confirmed_strengths"
  | "confirmed_weaknesses"
  | "active_projects"
  | "career_objectives"
  | "interview_prep_progress"
  | "saved_facts";

export interface StudentMemoryItem {
  id: string;
  studentUserId: string;
  category: MemoryCategory;
  key: string;
  value: string;
  source?: "student_explicit" | "mentor_verified" | "assessment_result" | "system_inferred" | "user_explicit";
  confidence: number;
  provenance: ProvenanceType;
  studentConfirmed: boolean;
  isTemporary: boolean;
  expiresAt?: string;
  createdAt: string;
  lastUpdated: string;
  updatedAt?: string; // For backward compatibility
}

export class StudentMemoryService {
  private static memoryStore: Map<string, StudentMemoryItem[]> = new Map();
  private static get storageFilePath(): string {
    if (process.env.NODE_ENV === "test" || process.env.VITEST) {
      const fixtureDir = path.resolve(process.cwd(), "tests", "fixtures");
      if (!fs.existsSync(fixtureDir)) {
        fs.mkdirSync(fixtureDir, { recursive: true });
      }
      const testFile = path.resolve(fixtureDir, ".test-memories.json");
      if (!fs.existsSync(testFile)) {
        const rootFile = path.resolve(process.cwd(), ".mentormaze-memories.json");
        if (fs.existsSync(rootFile)) {
          fs.copyFileSync(rootFile, testFile);
        }
      }
      return testFile;
    }
    return path.resolve(process.cwd(), ".mentormaze-memories.json");
  }
  private static isInitialized = false;

  public static reset(): void {
    this.memoryStore.clear();
    this.isInitialized = false;
  }

  private static ensureLoaded(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      // 1. Primary Source: Authoritative SQL database
      this.syncFromSqlSync();
      if (this.memoryStore.size > 0) {
        return;
      }
    } catch (sqlErr) {
      console.warn("[StudentMemoryService] SQL pre-load deferred or failed:", sqlErr);
    }

    // 2. Recovery Backup Source: Disk snapshot
    try {
      if (fs.existsSync(this.storageFilePath)) {
        const raw = fs.readFileSync(this.storageFilePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          for (const [userId, items] of Object.entries(parsed)) {
            this.memoryStore.set(userId, items as StudentMemoryItem[]);
          }
        }
      }
    } catch (err) {
      console.warn("[StudentMemoryService] Failed to load memories from disk backup:", err);
    }
  }

  private static syncFromSqlSync(): void {
    try {
      const db = getDb();
      db.select()
        .from(studentMemory)
        .then((rows: any[]) => {
          for (const row of rows) {
            const list = this.memoryStore.get(row.studentUserId) || [];
            if (!list.some((m) => m.id === row.id)) {
              list.push({
                id: row.id,
                studentUserId: row.studentUserId,
                category: row.category as MemoryCategory,
                key: row.key,
                value: row.value,
                confidence: row.confidence ?? 1.0,
                provenance: (row.provenance as ProvenanceType) || "student_reported",
                studentConfirmed: true,
                isTemporary: !!row.isTemporary,
                expiresAt: row.expiresAt ? new Date(row.expiresAt).toISOString() : undefined,
                createdAt: new Date(row.createdAt).toISOString(),
                lastUpdated: new Date(row.updatedAt).toISOString(),
                updatedAt: new Date(row.updatedAt).toISOString(),
              });
              this.memoryStore.set(row.studentUserId, list);
            }
          }
        })
        .catch(() => {});
    } catch {
      // ignore
    }
  }

  private static persistBackupToDisk(): void {
    try {
      const obj: Record<string, StudentMemoryItem[]> = {};
      for (const [userId, items] of this.memoryStore.entries()) {
        obj[userId] = items;
      }
      fs.writeFileSync(this.storageFilePath, JSON.stringify(obj, null, 2), "utf-8");
    } catch (err) {
      console.warn("[StudentMemoryService] Failed to write memories backup to disk:", err);
    }
  }

  /**
   * Retrieves all active, non-expired memories for a student with ownership authorization (Synchronous)
   */
  public static getMemories(studentUserId: string, requestingUserId?: string): StudentMemoryItem[] {
    this.ensureLoaded();
    // Cross-user privacy isolation
    if (requestingUserId && requestingUserId !== studentUserId && !requestingUserId.startsWith("mentor-") && requestingUserId !== "admin") {
      throw new Error("403_FORBIDDEN: You do not have permission to access another student's memory profile.");
    }

    if (!this.memoryStore.has(studentUserId)) {
      // Seed initial verified memories based on user persona
      const now = new Date().toISOString();
      const isStudent2 = studentUserId === "usr-student-2" || studentUserId === "user-student-2";

      const initial: StudentMemoryItem[] = isStudent2
        ? [
            {
              id: `mem-${studentUserId}-1`,
              studentUserId,
              category: "career_objectives",
              key: "Target Role",
              value: "Associate AI & Machine Learning Engineer at top AI research lab or product startup",
              source: "student_explicit",
              confidence: 1.0,
              provenance: "student_reported",
              studentConfirmed: true,
              isTemporary: false,
              createdAt: now,
              lastUpdated: now,
              updatedAt: now,
            },
            {
              id: `mem-${studentUserId}-2`,
              studentUserId,
              category: "learning_preferences",
              key: "Learning Style",
              value: "Prefers conversational Hinglish explanations and hands-on PyTorch code notebooks",
              source: "student_explicit",
              confidence: 0.95,
              provenance: "student_reported",
              studentConfirmed: true,
              isTemporary: false,
              createdAt: now,
              lastUpdated: now,
              updatedAt: now,
            },
            {
              id: `mem-${studentUserId}-3`,
              studentUserId,
              category: "confirmed_weaknesses",
              key: "Known Weakness",
              value: "PyTorch tensor operations, autograd memory retention, and high-dimensional vector search",
              source: "mentor_verified",
              confidence: 0.9,
              provenance: "mentor_assessed",
              studentConfirmed: true,
              isTemporary: false,
              createdAt: now,
              lastUpdated: now,
              updatedAt: now,
            },
          ]
        : [
            {
              id: `mem-${studentUserId}-1`,
              studentUserId,
              category: "career_objectives",
              key: "Target Role",
              value: "Software Development Engineer (SDE-1) at Google or Microsoft Core Systems",
              source: "student_explicit",
              confidence: 1.0,
              provenance: "student_reported",
              studentConfirmed: true,
              isTemporary: false,
              createdAt: now,
              lastUpdated: now,
              updatedAt: now,
            },
            {
              id: `mem-${studentUserId}-2`,
              studentUserId,
              category: "learning_preferences",
              key: "Learning Modality",
              value: "Prefers Socratic questioning and progressive hints before seeing full implementation code",
              source: "student_explicit",
              confidence: 0.95,
              provenance: "student_reported",
              studentConfirmed: true,
              isTemporary: false,
              createdAt: now,
              lastUpdated: now,
              updatedAt: now,
            },
            {
              id: `mem-${studentUserId}-3`,
              studentUserId,
              category: "confirmed_weaknesses",
              key: "Identified Knowledge Gap",
              value: "Dynamic Programming (0/1 Knapsack space optimization) and distributed consensus (Raft)",
              source: "mentor_verified",
              confidence: 0.88,
              provenance: "mentor_assessed",
              studentConfirmed: true,
              isTemporary: false,
              createdAt: now,
              lastUpdated: now,
              updatedAt: now,
            },
            {
              id: `mem-${studentUserId}-4`,
              studentUserId,
              category: "confirmed_strengths",
              key: "Demonstrated Strength",
              value: "Solid grasp of asynchronous TypeScript, PostgreSQL schema modeling, and REST APIs",
              source: "assessment_result",
              confidence: 0.92,
              provenance: "mentor_assessed",
              studentConfirmed: true,
              isTemporary: false,
              createdAt: now,
              lastUpdated: now,
              updatedAt: now,
            },
          ];
      this.memoryStore.set(studentUserId, initial);
      this.persistBackupToDisk();
    }

    // Enforce purpose-specific consent at actual service boundary
    if (!StudentConsentService.hasConsentSync(studentUserId, "student_memory")) {
      return [];
    }

    const all = this.memoryStore.get(studentUserId) || [];
    const nowMs = Date.now();
    return all.filter((m) => !m.expiresAt || new Date(m.expiresAt).getTime() > nowMs);
  }

  /**
   * Asynchronously retrieves memories directly from SQL with ownership isolation
   */
  public static async getMemoriesAsync(
    studentUserId: string,
    requestingUserId?: string
  ): Promise<StudentMemoryItem[]> {
    if (requestingUserId && requestingUserId !== studentUserId && !requestingUserId.startsWith("mentor-") && requestingUserId !== "admin") {
      throw new Error("403_FORBIDDEN: You do not have permission to access another student's memory profile.");
    }

    // Enforce purpose-specific consent at actual service boundary
    const hasConsent = await StudentConsentService.hasConsent(studentUserId, "student_memory", requestingUserId);
    if (!hasConsent) {
      return [];
    }

    try {
      const db = getDb();
      const now = new Date();
      const rows = await db
        .select()
        .from(studentMemory)
        .where(
          and(
            eq(studentMemory.studentUserId, studentUserId),
            or(isNull(studentMemory.expiresAt), gt(studentMemory.expiresAt, now))
          )
        );

      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          studentUserId: r.studentUserId,
          category: r.category as MemoryCategory,
          key: r.key,
          value: r.value,
          confidence: r.confidence ?? 1.0,
          provenance: (r.provenance as ProvenanceType) || "student_reported",
          studentConfirmed: true,
          isTemporary: !!r.isTemporary,
          expiresAt: r.expiresAt ? new Date(r.expiresAt).toISOString() : undefined,
          createdAt: new Date(r.createdAt).toISOString(),
          lastUpdated: new Date(r.updatedAt).toISOString(),
          updatedAt: new Date(r.updatedAt).toISOString(),
        }));
      }
    } catch (err) {
      console.warn("[StudentMemoryService] SQL getMemoriesAsync failed, falling back to cache:", err);
    }

    return this.getMemories(studentUserId, requestingUserId);
  }

  /**
   * Store or update a memory item with authorization check (Synchronous)
   */
  public static saveMemory(
    studentUserId: string,
    category: MemoryCategory,
    key: string,
    value: string,
    provenance: ProvenanceType = "student_reported",
    confidence: number = 0.9,
    isTemporary: boolean = false,
    ttlHours?: number,
    studentConfirmed: boolean = true,
    requestingUserId?: string
  ): StudentMemoryItem {
    this.ensureLoaded();
    if (requestingUserId && requestingUserId !== studentUserId) {
      throw new Error("403_FORBIDDEN: You do not have permission to modify another student's memory profile.");
    }

    if (!StudentConsentService.hasConsentSync(studentUserId, "student_memory")) {
      throw new Error("403_FORBIDDEN: Consent for 'student_memory' is revoked or denied.");
    }

    const memories = this.getMemories(studentUserId);
    const existingIndex = memories.findIndex(
      (m) => m.category === category && m.key.toLowerCase() === key.toLowerCase()
    );

    const now = new Date().toISOString();
    const expiresAt = ttlHours ? new Date(Date.now() + ttlHours * 3600000).toISOString() : undefined;

    let res: StudentMemoryItem;
    if (existingIndex >= 0) {
      memories[existingIndex].value = value;
      memories[existingIndex].confidence = confidence;
      memories[existingIndex].studentConfirmed = studentConfirmed;
      memories[existingIndex].lastUpdated = now;
      memories[existingIndex].updatedAt = now;
      if (expiresAt) memories[existingIndex].expiresAt = expiresAt;
      res = memories[existingIndex];

      // Update in SQL
      try {
        const db = getDb();
        db.update(studentMemory)
          .set({
            value,
            confidence,
            provenance,
            isTemporary,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            updatedAt: new Date(now),
          })
          .where(eq(studentMemory.id, res.id))
          .catch((err: any) => console.warn("[StudentMemoryService] Async memory update in SQL failed:", err));
      } catch (err) {
        console.warn("[StudentMemoryService] SQL unavailable for memory update:", err);
      }
    } else {
      const newItem: StudentMemoryItem = {
        id: `mem-${studentUserId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        studentUserId,
        category,
        key,
        value,
        source: provenance === "student_reported" ? "student_explicit" : "system_inferred",
        confidence,
        provenance,
        studentConfirmed,
        isTemporary,
        expiresAt,
        createdAt: now,
        lastUpdated: now,
        updatedAt: now,
      };
      memories.push(newItem);
      this.memoryStore.set(studentUserId, memories);
      res = newItem;

      // Insert in SQL
      try {
        const db = getDb();
        db.insert(studentMemory)
          .values({
            id: newItem.id,
            studentUserId,
            category,
            key,
            value,
            confidence,
            provenance,
            isTemporary,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            createdAt: new Date(now),
            updatedAt: new Date(now),
          })
          .catch((err: any) => console.warn("[StudentMemoryService] Async memory insert in SQL failed:", err));
      } catch (err) {
        console.warn("[StudentMemoryService] SQL unavailable for memory insert:", err);
      }
    }

    this.persistBackupToDisk();
    return res;
  }

  /**
   * Asynchronously store or update a memory item in SQL
   */
  public static async saveMemoryAsync(
    studentUserId: string,
    category: MemoryCategory,
    key: string,
    value: string,
    provenance: ProvenanceType = "student_reported",
    confidence: number = 0.9,
    isTemporary: boolean = false,
    ttlHours?: number,
    studentConfirmed: boolean = true,
    requestingUserId?: string
  ): Promise<StudentMemoryItem> {
    const item = this.saveMemory(
      studentUserId,
      category,
      key,
      value,
      provenance,
      confidence,
      isTemporary,
      ttlHours,
      studentConfirmed,
      requestingUserId
    );

    try {
      const db = getDb();
      await db
        .insert(studentMemory)
        .values({
          id: item.id,
          studentUserId,
          category,
          key,
          value,
          confidence,
          provenance,
          isTemporary,
          expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.lastUpdated),
        })
        .onConflictDoNothing();
    } catch (err) {
      console.warn("[StudentMemoryService] SQL async save error:", err);
    }

    return item;
  }

  /**
   * Delete a memory item with user consent and authorization (Synchronous)
   */
  public static deleteMemory(studentUserId: string, memoryId: string, requestingUserId?: string): boolean {
    this.ensureLoaded();
    if (requestingUserId && requestingUserId !== studentUserId) {
      throw new Error("403_FORBIDDEN: You do not have permission to delete another student's memory profile.");
    }

    const memories = this.getMemories(studentUserId);
    const filtered = memories.filter((m) => m.id !== memoryId);

    if (filtered.length !== memories.length) {
      this.memoryStore.set(studentUserId, filtered);

      try {
        const db = getDb();
        db.delete(studentMemory)
          .where(and(eq(studentMemory.id, memoryId), eq(studentMemory.studentUserId, studentUserId)))
          .catch((err: any) => console.warn("[StudentMemoryService] Async delete in SQL failed:", err));
      } catch (err) {
        console.warn("[StudentMemoryService] SQL unavailable for memory delete:", err);
      }

      this.persistBackupToDisk();
      return true;
    }
    return false;
  }

  /**
   * Asynchronously delete a memory item directly from SQL
   */
  public static async deleteMemoryAsync(
    studentUserId: string,
    memoryId: string,
    requestingUserId?: string
  ): Promise<boolean> {
    if (requestingUserId && requestingUserId !== studentUserId) {
      throw new Error("403_FORBIDDEN: You do not have permission to delete another student's memory profile.");
    }

    try {
      const db = getDb();
      await db
        .delete(studentMemory)
        .where(and(eq(studentMemory.id, memoryId), eq(studentMemory.studentUserId, studentUserId)));
    } catch (err) {
      console.warn("[StudentMemoryService] SQL deleteMemoryAsync failed:", err);
    }

    return this.deleteMemory(studentUserId, memoryId, requestingUserId);
  }

  /**
   * Confirm an inferred fact
   */
  public static confirmMemory(studentUserId: string, memoryId: string, requestingUserId?: string): boolean {
    this.ensureLoaded();
    if (requestingUserId && requestingUserId !== studentUserId) {
      throw new Error("403_FORBIDDEN: You do not have permission to confirm another student's memory profile.");
    }

    const memories = this.getMemories(studentUserId);
    const target = memories.find((m) => m.id === memoryId);
    if (target) {
      target.studentConfirmed = true;
      target.confidence = 1.0;
      target.lastUpdated = new Date().toISOString();
      target.updatedAt = target.lastUpdated;

      try {
        const db = getDb();
        db.update(studentMemory)
          .set({ confidence: 1.0, updatedAt: new Date(target.updatedAt) })
          .where(and(eq(studentMemory.id, memoryId), eq(studentMemory.studentUserId, studentUserId)))
          .catch((err: any) => console.warn("[StudentMemoryService] Async confirm in SQL failed:", err));
      } catch (err) {
        console.warn("[StudentMemoryService] SQL unavailable for memory confirm:", err);
      }

      this.persistBackupToDisk();
      return true;
    }
    return false;
  }
}
