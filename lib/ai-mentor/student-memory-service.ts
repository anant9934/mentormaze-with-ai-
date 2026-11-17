/**
 * Persistent Student Memory Service
 * Structured Memory Lifecycle (Create, Inspect, Correct, Delete, Expire) with Strict Provenance & Cross-User Security Isolation.
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 */

import { ProvenanceType } from "./types";

export type MemoryCategory =
  | "learning_preferences"
  | "current_goals"
  | "confirmed_strengths"
  | "confirmed_weaknesses"
  | "active_projects"
  | "career_objectives"
  | "interview_prep_progress"
  | "saved_facts"
  | "goal"
  | "preference"
  | "gap"
  | "repeated_mistake";

export interface StudentMemoryItem {
  id: string;
  studentUserId: string;
  category: MemoryCategory;
  key: string;
  value: string;
  source: string;
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

  /**
   * Retrieves all active, non-expired memories for a student with ownership authorization
   */
  public static getMemories(studentUserId: string, requestingUserId?: string): StudentMemoryItem[] {
    // Cross-user privacy isolation
    if (requestingUserId && requestingUserId !== studentUserId) {
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
              value: "SDE-1 at Tier-1 Tech Firm (Google, Microsoft, or top-tier product startup)",
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
              value: "Prefers code examples and intuitive analogies before mathematical proofs",
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
              value: "Formulating recurrence relations for 2D Dynamic Programming knapsack problems",
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
    }

    const all = this.memoryStore.get(studentUserId) || [];
    const nowMs = Date.now();
    return all.filter((m) => !m.expiresAt || new Date(m.expiresAt).getTime() > nowMs);
  }

  /**
   * Store or update a memory item with authorization check
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
    if (requestingUserId && requestingUserId !== studentUserId) {
      throw new Error("403_FORBIDDEN: You do not have permission to modify another student's memory profile.");
    }

    const memories = this.getMemories(studentUserId);
    const existingIndex = memories.findIndex(
      (m) => m.category === category && m.key.toLowerCase() === key.toLowerCase()
    );

    const now = new Date().toISOString();
    const expiresAt = ttlHours ? new Date(Date.now() + ttlHours * 3600000).toISOString() : undefined;

    if (existingIndex >= 0) {
      memories[existingIndex].value = value;
      memories[existingIndex].confidence = confidence;
      memories[existingIndex].studentConfirmed = studentConfirmed;
      memories[existingIndex].lastUpdated = now;
      memories[existingIndex].updatedAt = now;
      if (expiresAt) memories[existingIndex].expiresAt = expiresAt;
      return memories[existingIndex];
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
      return newItem;
    }
  }

  /**
   * Delete a memory item with user consent and authorization
   */
  public static deleteMemory(studentUserId: string, memoryId: string, requestingUserId?: string): boolean {
    if (requestingUserId && requestingUserId !== studentUserId) {
      throw new Error("403_FORBIDDEN: You do not have permission to delete another student's memory profile.");
    }

    const memories = this.getMemories(studentUserId);
    const filtered = memories.filter((m) => m.id !== memoryId);
    this.memoryStore.set(studentUserId, filtered);
    return filtered.length !== memories.length;
  }

  /**
   * Confirm an inferred memory item as student-verified
   */
  public static confirmMemory(studentUserId: string, memoryId: string, requestingUserId?: string): boolean {
    if (requestingUserId && requestingUserId !== studentUserId) {
      throw new Error("403_FORBIDDEN: You do not have permission to confirm another student's memory.");
    }

    const memories = this.getMemories(studentUserId);
    const target = memories.find((m) => m.id === memoryId);
    if (!target) return false;

    target.studentConfirmed = true;
    target.lastUpdated = new Date().toISOString();
    target.updatedAt = target.lastUpdated;
    return true;
  }
}
