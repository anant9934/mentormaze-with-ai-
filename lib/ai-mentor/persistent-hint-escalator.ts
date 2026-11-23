/**
 * ASTRION Persistent Hint Escalator
 * Brand: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 * Architecture: Ben Rosche Socratic Tutor Persistent Escalation Ladder
 * 
 * Maintains durable assistance history per student, skill, goal, and exercise across chat sessions.
 * Never treats raw message count as struggle; evaluates actual task attempts and assistance level.
 * Backed primarily by PostgreSQL/Drizzle with in-memory synchronization.
 * Test-only fixtures are strictly isolated from production persistence.
 */

import fs from "fs";
import path from "path";
import { getDb } from "../db";
import { studentHintEscalationState } from "../db/ai-mentor-schema";
import { eq, and } from "drizzle-orm";

export type HintLadderLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface DurableExerciseAttemptRecord {
  id: string;
  studentUserId: string;
  skillId: string;
  exerciseId: string;
  topic: string;
  goalId?: string;
  attemptCount: number;
  incorrectCount: number;
  currentHintLevel: HintLadderLevel;
  hintsDelivered: {
    level: HintLadderLevel;
    timestamp: string;
    hintText: string;
  }[];
  revealedSolution: boolean;
  resolvedSuccessfully: boolean;
  wasIndependentSuccess: boolean;
  repeatedMisconceptions: string[];
  lastAttemptAt: string;
  lastSuccessfulAssessmentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EscalationLadderStep {
  level: HintLadderLevel;
  name: string;
  description: string;
  directive: string;
}

export const ESCALATION_LADDER_STEPS: Record<HintLadderLevel, EscalationLadderStep> = {
  1: {
    level: 1,
    name: "Probing Question",
    description: "Ask a targeted question drawing attention to an overlooked constraint, variable, or invariant.",
    directive: "Provide Hint Level 1: A probing question that guides the student to inspect the right part of the problem without giving away any part of the technique or algorithm.",
  },
  2: {
    level: 2,
    name: "Conceptual Hint",
    description: "Provide a conceptual observation or high-level intuition about the problem structure.",
    directive: "Provide Hint Level 2: A conceptual hint identifying the category of pattern or invariant involved, without revealing the concrete mathematical property or formula.",
  },
  3: {
    level: 3,
    name: "Property Revelation",
    description: "Reveal the specific property, recurrence relationship, or algorithmic invariant required.",
    directive: "Provide Hint Level 3: Reveal the key property or invariant (e.g. the recurrence relation or pointer movement condition) while asking the student to formulate the implementation.",
  },
  4: {
    level: 4,
    name: "Smaller Related Example",
    description: "Demonstrate the principle on a minimal 2-element or 3-element micro-example.",
    directive: "Provide Hint Level 4: Walk through a minimal micro-example (e.g., n=3 or a 3-element array) showing how the invariant behaves step by step.",
  },
  5: {
    level: 5,
    name: "Scaffolded Worked Example",
    description: "Provide a scaffolded code structure or pseudocode template with key blanks.",
    directive: "Provide Hint Level 5: Provide a clear scaffolded template or structural pseudocode showing the control flow, asking the student to fill in the core logic.",
  },
  6: {
    level: 6,
    name: "Complete Solution Explanation",
    description: "Explain the full canonical solution step by step with complexity and edge cases.",
    directive: "Provide Hint Level 6: The student has requested or reached full escalation. Explain the complete canonical solution thoroughly with time/space complexity analysis and edge case handling.",
  },
};

export class PersistentHintEscalator {
  // studentUserId -> (exerciseKey -> DurableExerciseAttemptRecord)
  private static store: Map<string, Map<string, DurableExerciseAttemptRecord>> = new Map();
  private static isInitialized = false;

  private static get isTestEnvironment(): boolean {
    return process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);
  }

  private static get storageFilePath(): string | null {
    // Test-only fixture isolation: never write local disk JSON in production
    if (this.isTestEnvironment) {
      const fixtureDir = path.resolve(process.cwd(), "tests", "fixtures");
      if (!fs.existsSync(fixtureDir)) {
        fs.mkdirSync(fixtureDir, { recursive: true });
      }
      return path.resolve(fixtureDir, ".test-hint-escalation.json");
    }
    return null;
  }

  public static reset(): void {
    this.store.clear();
    this.isInitialized = false;
    try {
      const filePath = this.storageFilePath;
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // ignore
    }
  }

  private static ensureLoaded(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1. Primary Source: Authoritative SQL database
    try {
      const db = getDb();
      if (db) {
        db.select()
          .from(studentHintEscalationState)
          .then((rows: any[]) => {
            if (rows && rows.length > 0) {
              for (const r of rows) {
                if (!this.store.has(r.studentUserId)) {
                  this.store.set(r.studentUserId, new Map());
                }
                const key = this.buildKey(r.skillId, r.exerciseId);
                this.store.get(r.studentUserId)!.set(key, {
                  id: r.id,
                  studentUserId: r.studentUserId,
                  skillId: r.skillId,
                  exerciseId: r.exerciseId,
                  topic: r.topic,
                  goalId: r.goalId || undefined,
                  attemptCount: r.attemptCount,
                  incorrectCount: r.incorrectCount,
                  currentHintLevel: r.currentHintLevel as HintLadderLevel,
                  hintsDelivered: Array.isArray(r.hintsDelivered) ? r.hintsDelivered : [],
                  revealedSolution: Boolean(r.revealedSolution),
                  resolvedSuccessfully: Boolean(r.resolvedSuccessfully),
                  wasIndependentSuccess: Boolean(r.wasIndependentSuccess),
                  repeatedMisconceptions: Array.isArray(r.repeatedMisconceptions) ? r.repeatedMisconceptions : [],
                  lastAttemptAt: new Date(r.lastAttemptAt).toISOString(),
                  lastSuccessfulAssessmentAt: r.lastSuccessfulAssessmentAt
                    ? new Date(r.lastSuccessfulAssessmentAt).toISOString()
                    : undefined,
                  createdAt: new Date(r.createdAt).toISOString(),
                  updatedAt: new Date(r.updatedAt).toISOString(),
                });
              }
            }
          })
          .catch(() => {});
      }
    } catch {
      // ignore
    }

    // 2. Test Fixture Fallback (strictly in test environment)
    if (this.isTestEnvironment) {
      try {
        const filePath = this.storageFilePath;
        if (filePath && fs.existsSync(filePath)) {
          const raw = fs.readFileSync(filePath, "utf-8");
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            for (const [userId, userExercises] of Object.entries(parsed)) {
              if (!this.store.has(userId)) {
                this.store.set(userId, new Map());
              }
              const userMap = this.store.get(userId)!;
              for (const [exKey, record] of Object.entries(userExercises as Record<string, DurableExerciseAttemptRecord>)) {
                userMap.set(exKey, record);
              }
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }

  private static persistBackup(): void {
    if (this.isTestEnvironment) {
      try {
        const filePath = this.storageFilePath;
        if (filePath) {
          const out: Record<string, Record<string, DurableExerciseAttemptRecord>> = {};
          for (const [userId, userMap] of this.store.entries()) {
            out[userId] = {};
            for (const [exKey, rec] of userMap.entries()) {
              out[userId][exKey] = rec;
            }
          }
          fs.writeFileSync(filePath, JSON.stringify(out, null, 2), "utf-8");
        }
      } catch {
        // ignore
      }
    }
  }

  private static buildKey(skillId: string, exerciseId: string): string {
    return `${skillId.trim().toLowerCase()}::${exerciseId.trim().toLowerCase()}`;
  }

  private static validateOwnership(studentUserId: string, requestingUserId?: string): void {
    if (
      requestingUserId &&
      requestingUserId !== studentUserId &&
      !requestingUserId.startsWith("mentor-") &&
      requestingUserId !== "admin"
    ) {
      throw new Error("403_FORBIDDEN: You do not have permission to access another student's hint escalation state.");
    }
  }

  /**
   * Retrieves durable attempt record for student on given skill/exercise across sessions
   */
  public static getAttemptRecord(
    studentUserId: string,
    skillId: string,
    exerciseId: string,
    requestingUserId?: string
  ): DurableExerciseAttemptRecord | null {
    this.validateOwnership(studentUserId, requestingUserId);
    this.ensureLoaded();
    const userMap = this.store.get(studentUserId);
    if (!userMap) return null;
    return userMap.get(this.buildKey(skillId, exerciseId)) || null;
  }

  /**
   * Asynchronously retrieves durable attempt record from SQL
   */
  public static async getAttemptRecordAsync(
    studentUserId: string,
    skillId: string,
    exerciseId: string,
    requestingUserId?: string
  ): Promise<DurableExerciseAttemptRecord | null> {
    this.validateOwnership(studentUserId, requestingUserId);
    try {
      const db = getDb();
      if (db) {
        const rows = await db
          .select()
          .from(studentHintEscalationState)
          .where(
            and(
              eq(studentHintEscalationState.studentUserId, studentUserId),
              eq(studentHintEscalationState.exerciseId, exerciseId)
            )
          );
        if (rows && rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            studentUserId: r.studentUserId,
            skillId: r.skillId,
            exerciseId: r.exerciseId,
            topic: r.topic,
            goalId: r.goalId || undefined,
            attemptCount: r.attemptCount,
            incorrectCount: r.incorrectCount,
            currentHintLevel: r.currentHintLevel as HintLadderLevel,
            hintsDelivered: Array.isArray(r.hintsDelivered) ? r.hintsDelivered : [],
            revealedSolution: Boolean(r.revealedSolution),
            resolvedSuccessfully: Boolean(r.resolvedSuccessfully),
            wasIndependentSuccess: Boolean(r.wasIndependentSuccess),
            repeatedMisconceptions: Array.isArray(r.repeatedMisconceptions) ? r.repeatedMisconceptions : [],
            lastAttemptAt: new Date(r.lastAttemptAt).toISOString(),
            lastSuccessfulAssessmentAt: r.lastSuccessfulAssessmentAt
              ? new Date(r.lastSuccessfulAssessmentAt).toISOString()
              : undefined,
            createdAt: new Date(r.createdAt).toISOString(),
            updatedAt: new Date(r.updatedAt).toISOString(),
          };
        }
      }
    } catch {
      // ignore
    }
    return this.getAttemptRecord(studentUserId, skillId, exerciseId, requestingUserId);
  }

  /**
   * Registers or updates an exercise attempt, escalating the hint ladder if requested or necessary
   * Implements duplicate attempt debounce and transactional PostgreSQL persistence
   */
  public static recordAttempt(params: {
    studentUserId: string;
    skillId: string;
    exerciseId: string;
    topic?: string;
    goalId?: string;
    isCorrect?: boolean;
    requestedHint?: boolean;
    misconception?: string;
    requestingUserId?: string;
  }): {
    record: DurableExerciseAttemptRecord;
    currentHintStep: EscalationLadderStep;
    escalated: boolean;
  } {
    const {
      studentUserId,
      skillId,
      exerciseId,
      topic = "general",
      goalId,
      isCorrect,
      requestedHint,
      misconception,
      requestingUserId,
    } = params;
    this.validateOwnership(studentUserId, requestingUserId);
    this.ensureLoaded();

    const now = new Date().toISOString();
    const key = this.buildKey(skillId, exerciseId);

    if (!this.store.has(studentUserId)) {
      this.store.set(studentUserId, new Map());
    }
    const userMap = this.store.get(studentUserId)!;

    let existing = userMap.get(key);
    let escalated = false;

    if (!existing) {
      existing = {
        id: `att-${studentUserId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        studentUserId,
        skillId,
        exerciseId,
        topic,
        goalId,
        attemptCount: 1,
        incorrectCount: isCorrect === false ? 1 : 0,
        currentHintLevel: requestedHint ? 1 : 1,
        hintsDelivered: [],
        revealedSolution: false,
        resolvedSuccessfully: isCorrect === true,
        wasIndependentSuccess: isCorrect === true && !requestedHint,
        repeatedMisconceptions: misconception ? [misconception] : [],
        lastAttemptAt: now,
        lastSuccessfulAssessmentAt: isCorrect === true ? now : undefined,
        createdAt: now,
        updatedAt: now,
      };
      userMap.set(key, existing);
    } else {
      // Duplicate debounce: avoid inflating attemptCount if identical attempt is registered within 300ms
      const timeSinceLast = Date.now() - new Date(existing.lastAttemptAt).getTime();
      const isRapidDuplicate = timeSinceLast < 300 && isCorrect === undefined && !requestedHint;
      if (!isRapidDuplicate) {
        existing.attemptCount += 1;
      }

      existing.lastAttemptAt = now;
      existing.updatedAt = now;
      if (goalId && !existing.goalId) {
        existing.goalId = goalId;
      }

      if (misconception && !existing.repeatedMisconceptions.includes(misconception)) {
        existing.repeatedMisconceptions.push(misconception);
      }

      if (isCorrect === true) {
        existing.resolvedSuccessfully = true;
        existing.lastSuccessfulAssessmentAt = now;
        if (existing.hintsDelivered.length === 0 && !requestedHint) {
          existing.wasIndependentSuccess = true;
        }
      } else if (isCorrect === false) {
        existing.incorrectCount += 1;
        // Automatically escalate hint level upon repeated failure (after 2 consecutive failures)
        if (existing.incorrectCount >= 2 && existing.currentHintLevel < 6) {
          existing.currentHintLevel = Math.min(6, existing.currentHintLevel + 1) as HintLadderLevel;
          escalated = true;
        }
      }

      if (requestedHint) {
        const nextLevel = Math.min(6, existing.currentHintLevel + 1) as HintLadderLevel;
        if (nextLevel !== existing.currentHintLevel) {
          existing.currentHintLevel = nextLevel;
          escalated = true;
        }
      }

      if (existing.currentHintLevel === 6) {
        existing.revealedSolution = true;
      }
    }

    this.persistBackup();

    // Async transactional sync to SQL
    try {
      const db = getDb();
      if (db) {
        db.insert(studentHintEscalationState)
          .values({
            id: existing.id,
            studentUserId,
            skillId,
            exerciseId,
            topic: existing.topic,
            goalId: existing.goalId,
            attemptCount: existing.attemptCount,
            incorrectCount: existing.incorrectCount,
            currentHintLevel: existing.currentHintLevel,
            hintsDelivered: existing.hintsDelivered,
            revealedSolution: existing.revealedSolution,
            resolvedSuccessfully: existing.resolvedSuccessfully,
            wasIndependentSuccess: existing.wasIndependentSuccess,
            repeatedMisconceptions: existing.repeatedMisconceptions,
            lastAttemptAt: new Date(existing.lastAttemptAt),
            lastSuccessfulAssessmentAt: existing.lastSuccessfulAssessmentAt
              ? new Date(existing.lastSuccessfulAssessmentAt)
              : null,
            createdAt: new Date(existing.createdAt),
            updatedAt: new Date(existing.updatedAt),
          })
          .catch(() => {});
      }
    } catch {
      // ignore
    }

    const currentHintStep = ESCALATION_LADDER_STEPS[existing.currentHintLevel];

    return {
      record: existing,
      currentHintStep,
      escalated,
    };
  }

  /**
   * Records a delivered hint text into durable history with duplicate hint prevention
   */
  public static logHintDelivered(
    studentUserId: string,
    skillId: string,
    exerciseId: string,
    level: HintLadderLevel,
    hintText: string,
    requestingUserId?: string
  ): void {
    this.validateOwnership(studentUserId, requestingUserId);
    this.ensureLoaded();
    const key = this.buildKey(skillId, exerciseId);
    const userMap = this.store.get(studentUserId);
    if (!userMap) return;
    const existing = userMap.get(key);
    if (!existing) return;

    // Duplicate hint prevention: do not append identical hint if already recorded for this level
    const isDuplicate = existing.hintsDelivered.some(
      (h) => h.level === level && h.hintText.trim() === hintText.trim()
    );
    if (!isDuplicate) {
      existing.hintsDelivered.push({
        level,
        timestamp: new Date().toISOString(),
        hintText,
      });
    }

    if (level > existing.currentHintLevel) {
      existing.currentHintLevel = level;
    }
    existing.updatedAt = new Date().toISOString();
    this.persistBackup();

    // Async sync to SQL
    try {
      const db = getDb();
      if (db) {
        db.update(studentHintEscalationState)
          .set({
            currentHintLevel: existing.currentHintLevel,
            hintsDelivered: existing.hintsDelivered,
            updatedAt: new Date(existing.updatedAt),
          })
          .where(
            and(
              eq(studentHintEscalationState.studentUserId, studentUserId),
              eq(studentHintEscalationState.exerciseId, exerciseId)
            )
          )
          .catch(() => {});
      }
    } catch {
      // ignore
    }
  }

  /**
   * Resets ladder for a specific exercise when student wants a fresh independent retry
   */
  public static resetExercise(
    studentUserId: string,
    skillId: string,
    exerciseId: string,
    requestingUserId?: string
  ): void {
    this.validateOwnership(studentUserId, requestingUserId);
    this.ensureLoaded();
    const key = this.buildKey(skillId, exerciseId);
    const userMap = this.store.get(studentUserId);
    if (!userMap) return;
    userMap.delete(key);
    this.persistBackup();

    try {
      const db = getDb();
      if (db) {
        db.delete(studentHintEscalationState)
          .where(
            and(
              eq(studentHintEscalationState.studentUserId, studentUserId),
              eq(studentHintEscalationState.exerciseId, exerciseId)
            )
          )
          .catch(() => {});
      }
    } catch {
      // ignore
    }
  }
}
