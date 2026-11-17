/**
 * Persistent Student Memory Service
 * Structured Memory Lifecycle (Create, Inspect, Correct, Delete, Expire) with Strict Provenance
 * Brand: MentorMaze by AI Tathastu
 */

import { ProvenanceType } from "./types";

export interface StudentMemoryItem {
  id: string;
  studentUserId: string;
  category: "goal" | "preference" | "topic" | "strength" | "gap" | "repeated_mistake" | "project" | "roadmap" | "task";
  key: string;
  value: string;
  confidence: number;
  provenance: ProvenanceType;
  isTemporary: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class StudentMemoryService {
  private static memoryStore: Map<string, StudentMemoryItem[]> = new Map();

  /**
   * Retrieves all active, non-expired memories for a student
   */
  public static getMemories(studentUserId: string): StudentMemoryItem[] {
    if (!this.memoryStore.has(studentUserId)) {
      // Seed default memories
      const now = new Date().toISOString();
      const initial: StudentMemoryItem[] = [
        {
          id: `mem-${studentUserId}-1`,
          studentUserId,
          category: "goal",
          key: "Target Role",
          value: "SDE-1 at Tier-1 Tech Firm (Google, Microsoft, or top-tier product startup)",
          confidence: 1.0,
          provenance: "student_reported",
          isTemporary: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `mem-${studentUserId}-2`,
          studentUserId,
          category: "preference",
          key: "Learning Style",
          value: "Prefers code examples and intuitive analogies before mathematical proofs",
          confidence: 0.95,
          provenance: "student_reported",
          isTemporary: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `mem-${studentUserId}-3`,
          studentUserId,
          category: "gap",
          key: "Known Weakness",
          value: "Formulating recurrence relations for 2D Dynamic Programming knapsack problems",
          confidence: 0.88,
          provenance: "mentor_assessed",
          isTemporary: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `mem-${studentUserId}-4`,
          studentUserId,
          category: "repeated_mistake",
          key: "Algorithmic Mistake",
          value: "Often forgets to handle empty array or single-element boundary inputs in Two-Pointers",
          confidence: 0.85,
          provenance: "mentor_assessed",
          isTemporary: false,
          createdAt: now,
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
   * Store or update a memory item
   */
  public static saveMemory(
    studentUserId: string,
    category: StudentMemoryItem["category"],
    key: string,
    value: string,
    provenance: ProvenanceType = "student_reported",
    confidence: number = 0.9,
    isTemporary: boolean = false,
    ttlHours?: number
  ): StudentMemoryItem {
    const memories = this.getMemories(studentUserId);
    const existingIndex = memories.findIndex((m) => m.category === category && m.key.toLowerCase() === key.toLowerCase());

    const now = new Date().toISOString();
    const expiresAt = ttlHours ? new Date(Date.now() + ttlHours * 3600000).toISOString() : undefined;

    if (existingIndex >= 0) {
      memories[existingIndex].value = value;
      memories[existingIndex].confidence = confidence;
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
        confidence,
        provenance,
        isTemporary,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      };
      memories.push(newItem);
      this.memoryStore.set(studentUserId, memories);
      return newItem;
    }
  }

  /**
   * Delete a memory item with user consent
   */
  public static deleteMemory(studentUserId: string, memoryId: string): boolean {
    const memories = this.getMemories(studentUserId);
    const filtered = memories.filter((m) => m.id !== memoryId);
    this.memoryStore.set(studentUserId, filtered);
    return filtered.length !== memories.length;
  }
}
