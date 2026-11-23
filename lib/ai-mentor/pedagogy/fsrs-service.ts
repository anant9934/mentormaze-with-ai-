/**
 * ASTRION Custom Spaced-Repetition Scheduler (FSRS-Inspired)
 * Brand: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 * Reference Standard: FSRS Retrievability Curve (Jarrett Ye); Tutor MCP (`ArnaudGuiovanna/tutor-mcp`)
 *
 * Implements deterministic spaced retention scheduling based on Stability (S),
 * Difficulty (D), and Retrievability (R) power decay curves: R(t, S) = (1 + t / (9 * S))^(-1).
 *
 * NOTE ON ALGORITHM CALIBRATION & SCOPE:
 * This service implements the FSRS power-law retrievability decay formula and interval calculation
 * (I = 9 * S * (1 / R_target - 1)). For review stability updates, it uses heuristic multipliers
 * conditioned on Difficulty (D) and current Retrievability (R). It does NOT run the full 17-parameter
 * non-linear parameter optimizer of FSRS v4.5/v5, and is honestly documented as a custom
 * FSRS-inspired spaced repetition scheduler.
 */

import fs from "fs";
import path from "path";
import {
  FSRSConceptRecord,
  FSRSRating,
  FSRSState,
  ReviewQueueCategory,
  ReviewQueueItem,
} from "../types";
import { getDb } from "../../db";
import { studentConceptFsrsState } from "../../db/ai-mentor-schema";
import { eq, and } from "drizzle-orm";

export class SpacedRepetitionScheduler {
  // studentUserId -> (conceptId -> FSRSConceptRecord)
  private static store: Map<string, Map<string, FSRSConceptRecord>> = new Map();
  private static isInitialized = false;

  // Target retention probability (default: 0.90)
  public static readonly TARGET_RETENTION = 0.90;

  // Initial stability constants per rating G in {1, 2, 3, 4}
  public static readonly INITIAL_STABILITY: Record<FSRSRating, number> = {
    1: 0.4, // Again: ~9.6 hours
    2: 1.2, // Hard: ~1.2 days
    3: 3.0, // Good: 3.0 days
    4: 8.0, // Easy: 8.0 days
  };

  // Initial difficulty constants per rating G
  public static readonly INITIAL_DIFFICULTY: Record<FSRSRating, number> = {
    1: 7.5,
    2: 6.0,
    3: 5.0,
    4: 3.5,
  };

  private static get isTestEnvironment(): boolean {
    return process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);
  }

  private static get storageFilePath(): string | null {
    if (this.isTestEnvironment) {
      const fixtureDir = path.resolve(process.cwd(), "tests", "fixtures");
      if (!fs.existsSync(fixtureDir)) {
        fs.mkdirSync(fixtureDir, { recursive: true });
      }
      return path.resolve(fixtureDir, ".test-fsrs-store.json");
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

    // Load from SQL first if available
    try {
      const db = getDb();
      if (db) {
        db.select()
          .from(studentConceptFsrsState)
          .then((rows: any[]) => {
            if (rows && rows.length > 0) {
              for (const r of rows) {
                if (!this.store.has(r.studentUserId)) {
                  this.store.set(r.studentUserId, new Map());
                }
                this.store.get(r.studentUserId)!.set(r.conceptId, {
                  conceptId: r.conceptId,
                  studentUserId: r.studentUserId,
                  stability: r.stability,
                  difficulty: r.difficulty,
                  retrievability: r.retrievability,
                  reps: r.reps,
                  lapses: r.lapses,
                  state: r.state as FSRSState,
                  historicalRatings: Array.isArray(r.historicalRatings) ? r.historicalRatings : [],
                  lastReviewedAt: new Date(r.lastReviewedAt).toISOString(),
                  nextReviewAt: new Date(r.nextReviewAt).toISOString(),
                  lastUpdatedAt: new Date(r.updatedAt).toISOString(),
                });
              }
            }
          })
          .catch(() => {});
      }
    } catch {
      // ignore
    }

    if (this.isTestEnvironment) {
      try {
        const filePath = this.storageFilePath;
        if (filePath && fs.existsSync(filePath)) {
          const raw = fs.readFileSync(filePath, "utf-8");
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            for (const [userId, conceptMap] of Object.entries(parsed)) {
              if (!this.store.has(userId)) {
                this.store.set(userId, new Map());
              }
              const map = this.store.get(userId)!;
              for (const [cId, record] of Object.entries(conceptMap as Record<string, FSRSConceptRecord>)) {
                map.set(cId, record);
              }
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }

  private static persistToDisk(): void {
    if (this.isTestEnvironment) {
      try {
        const filePath = this.storageFilePath;
        if (filePath) {
          const out: Record<string, Record<string, FSRSConceptRecord>> = {};
          for (const [userId, userMap] of this.store.entries()) {
            out[userId] = {};
            for (const [cId, rec] of userMap.entries()) {
              out[userId][cId] = rec;
            }
          }
          fs.writeFileSync(filePath, JSON.stringify(out, null, 2), "utf-8");
        }
      } catch {
        // ignore
      }
    }
  }

  /**
   * Calculates Retrievability R(t, S) = (1 + t / (9 * S))^(-1)
   * Where t is elapsed days since last review and S is stability in days.
   */
  public static calculateRetrievability(elapsedDays: number, stability: number): number {
    if (stability <= 0) return 0.0;
    if (elapsedDays <= 0) return 1.0;
    const factor = 1.0 + elapsedDays / (9.0 * stability);
    const r = Math.pow(factor, -1.0);
    return Math.max(0.0, Math.min(1.0, Math.round(r * 10000) / 10000));
  }

  /**
   * Calculates interval in days for a target retrievability R_target
   * I = 9 * S * (1 / R_target - 1). For R_target = 0.90, I = S days exactly.
   */
  public static calculateReviewIntervalDays(stability: number, targetRetention = this.TARGET_RETENTION): number {
    if (stability <= 0) return 0.5;
    const interval = 9.0 * stability * (1.0 / targetRetention - 1.0);
    return Math.max(0.2, Math.round(interval * 100) / 100);
  }

  /**
   * Retrieves or initializes FSRS concept record
   */
  public static getConceptRecord(
    studentUserId: string,
    conceptId: string,
    requestingUserId?: string
  ): FSRSConceptRecord {
    this.ensureLoaded();
    if (requestingUserId && requestingUserId !== studentUserId && !requestingUserId.startsWith("mentor-") && requestingUserId !== "admin") {
      throw new Error("403_FORBIDDEN: You do not have permission to access another student's spaced repetition state.");
    }

    const normConcept = conceptId.trim().toLowerCase();
    if (!this.store.has(studentUserId)) {
      this.store.set(studentUserId, new Map());
    }
    const userMap = this.store.get(studentUserId)!;

    let record = userMap.get(normConcept);
    if (!record) {
      const now = new Date();
      const nowIso = now.toISOString();
      const defaultStability = 1.0;
      const intervalDays = this.calculateReviewIntervalDays(defaultStability);
      const nextReview = new Date(now.getTime() + intervalDays * 86400000).toISOString();

      record = {
        conceptId: normConcept,
        studentUserId,
        stability: defaultStability,
        difficulty: 5.0,
        retrievability: 1.0,
        lastReviewedAt: nowIso,
        nextReviewAt: nextReview,
        reps: 0,
        lapses: 0,
        state: "new",
        historicalRatings: [],
        lastUpdatedAt: nowIso,
      };
      userMap.set(normConcept, record);
    } else {
      // Update dynamic retrievability based on elapsed time
      const elapsedDays = (Date.now() - new Date(record.lastReviewedAt).getTime()) / 86400000;
      record.retrievability = this.calculateRetrievability(elapsedDays, record.stability);
    }

    return record;
  }

  /**
   * Records a review outcome and calculates new stability, difficulty, retrievability, and next review date
   */
  public static recordReview(params: {
    studentUserId: string;
    conceptId: string;
    rating: FSRSRating;
    reviewTimestamp?: string;
    requestingUserId?: string;
  }): {
    previousStability: number;
    updatedStability: number;
    previousDifficulty: number;
    updatedDifficulty: number;
    retrievabilityBefore: number;
    nextReviewAt: string;
    intervalDays: number;
    record: FSRSConceptRecord;
  } {
    const { studentUserId, conceptId, rating, reviewTimestamp, requestingUserId } = params;
    const record = this.getConceptRecord(studentUserId, conceptId, requestingUserId);

    const now = reviewTimestamp ? new Date(reviewTimestamp) : new Date();
    const prevStability = record.stability;
    const prevDifficulty = record.difficulty;
    const elapsedDays = Math.max(0, (now.getTime() - new Date(record.lastReviewedAt).getTime()) / 86400000);
    const rBefore = this.calculateRetrievability(elapsedDays, prevStability);

    let nextDifficulty = prevDifficulty;
    let nextStability = prevStability;
    let nextState: FSRSState = record.state;

    // 1. First review (state == 'new')
    if (record.reps === 0) {
      nextStability = this.INITIAL_STABILITY[rating];
      nextDifficulty = this.INITIAL_DIFFICULTY[rating];
      nextState = rating === 1 ? "learning" : "review";
      if (rating === 1) {
        record.lapses += 1;
      }
    } else {
      // 2. Subsequent review: update difficulty
      // D_new = clamp(D - 0.5 * (rating - 3), 1.0, 10.0)
      nextDifficulty = Math.max(1.0, Math.min(10.0, prevDifficulty - 0.5 * (rating - 3)));

      if (rating === 1) {
        // Lapse / Blackout
        record.lapses += 1;
        nextState = "relearning";
        nextStability = Math.max(0.2, prevStability * 0.25);
      } else {
        // Recall success (Hard=2, Good=3, Easy=4)
        nextState = "review";
        // Growth factor conditioned on current retrievability R and Difficulty D
        // Hard has modest growth; Good has standard growth; Easy has accelerated growth
        const difficultyBonus = Math.max(0.1, (11.0 - nextDifficulty) / 6.0);
        const retrievabilityBonus = Math.exp(0.5 * (1.0 - rBefore)) - 1.0;

        let multiplier = 1.0;
        if (rating === 2) {
          // Hard: minimal growth
          multiplier = 1.15;
        } else if (rating === 3) {
          // Good: standard exponential spacing
          multiplier = 1.0 + difficultyBonus * 1.5 + retrievabilityBonus * 0.8;
        } else if (rating === 4) {
          // Easy: aggressive spacing
          multiplier = 1.0 + difficultyBonus * 2.5 + retrievabilityBonus * 1.2;
        }

        nextStability = Math.round(prevStability * multiplier * 100) / 100;
      }
    }

    record.reps += 1;
    record.stability = nextStability;
    record.difficulty = Math.round(nextDifficulty * 100) / 100;
    record.retrievability = 1.0; // Reset to 100% immediately upon review
    record.state = nextState;
    record.lastReviewedAt = now.toISOString();

    const intervalDays = this.calculateReviewIntervalDays(nextStability);
    const nextReviewDate = new Date(now.getTime() + intervalDays * 86400000);
    record.nextReviewAt = nextReviewDate.toISOString();
    record.lastUpdatedAt = now.toISOString();

    record.historicalRatings.push({
      rating,
      reviewedAt: now.toISOString(),
      retrievabilityBefore: rBefore,
    });

    this.persistToDisk();

    // Async sync to SQL
    try {
      const db = getDb();
      db.insert(studentConceptFsrsState)
        .values({
          id: `fsrs-${studentUserId}-${record.conceptId}`,
          studentUserId,
          conceptId: record.conceptId,
          stability: record.stability,
          difficulty: record.difficulty,
          retrievability: record.retrievability,
          reps: record.reps,
          lapses: record.lapses,
          state: record.state,
          historicalRatings: record.historicalRatings,
          lastReviewedAt: new Date(record.lastReviewedAt),
          nextReviewAt: new Date(record.nextReviewAt),
          updatedAt: new Date(record.lastUpdatedAt),
        })
        .onConflictDoUpdate({
          target: [studentConceptFsrsState.studentUserId, studentConceptFsrsState.conceptId],
          set: {
            stability: record.stability,
            difficulty: record.difficulty,
            retrievability: record.retrievability,
            reps: record.reps,
            lapses: record.lapses,
            state: record.state,
            historicalRatings: record.historicalRatings,
            lastReviewedAt: new Date(record.lastReviewedAt),
            nextReviewAt: new Date(record.nextReviewAt),
            updatedAt: new Date(record.lastUpdatedAt),
          },
        })
        .catch(() => {});
    } catch {
      // Non-fatal if SQL table does not exist in unit test sandbox
    }

    return {
      previousStability: prevStability,
      updatedStability: nextStability,
      previousDifficulty: prevDifficulty,
      updatedDifficulty: record.difficulty,
      retrievabilityBefore: rBefore,
      nextReviewAt: record.nextReviewAt,
      intervalDays,
      record,
    };
  }

  /**
   * Generates prioritized review queue for a student
   * Segregates into Daily Review, Weak Concepts, Forgotten Concepts, and Prerequisite Reinforcement
   */
  public static generateReviewQueue(
    studentUserId: string,
    options?: {
      targetRetention?: number;
      currentTime?: Date;
      prerequisiteConceptIds?: string[];
      requestingUserId?: string;
    }
  ): {
    totalDue: number;
    dailyReviewQueue: ReviewQueueItem[];
    weakConcepts: ReviewQueueItem[];
    forgottenConcepts: ReviewQueueItem[];
    prerequisiteReinforcements: ReviewQueueItem[];
    prioritizedQueue: ReviewQueueItem[];
  } {
    this.ensureLoaded();
    const { targetRetention = this.TARGET_RETENTION, currentTime = new Date(), prerequisiteConceptIds = [], requestingUserId } = options || {};

    if (requestingUserId && requestingUserId !== studentUserId && !requestingUserId.startsWith("mentor-") && requestingUserId !== "admin") {
      throw new Error("403_FORBIDDEN: You do not have permission to access another student's spaced repetition state.");
    }

    const userMap = this.store.get(studentUserId);
    if (!userMap || userMap.size === 0) {
      return {
        totalDue: 0,
        dailyReviewQueue: [],
        weakConcepts: [],
        forgottenConcepts: [],
        prerequisiteReinforcements: [],
        prioritizedQueue: [],
      };
    }

    const dailyReviewQueue: ReviewQueueItem[] = [];
    const weakConcepts: ReviewQueueItem[] = [];
    const forgottenConcepts: ReviewQueueItem[] = [];
    const prerequisiteReinforcements: ReviewQueueItem[] = [];

    const nowMs = currentTime.getTime();

    for (const record of userMap.values()) {
      const elapsedDays = Math.max(0, (nowMs - new Date(record.lastReviewedAt).getTime()) / 86400000);
      const currentR = this.calculateRetrievability(elapsedDays, record.stability);
      const nextDueMs = new Date(record.nextReviewAt).getTime();
      const isDue = currentR < targetRetention || nowMs >= nextDueMs;
      const dueDaysAgo = Math.max(0, Math.round(((nowMs - nextDueMs) / 86400000) * 10) / 10);

      const conceptName = record.conceptId
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      // Category 1: Forgotten Concept Recovery (Severe retrievability collapse R < 0.70)
      if (currentR < 0.70) {
        forgottenConcepts.push({
          conceptId: record.conceptId,
          conceptName,
          category: "forgotten_concept_recovery",
          retrievability: currentR,
          stability: record.stability,
          difficulty: record.difficulty,
          dueDaysAgo,
          priority: "high",
          reason: `Retrievability decayed to ${Math.round(currentR * 100)}% (below 70% retention threshold)`,
        });
      }

      // Category 2: Weak Concept Revision (High intrinsic difficulty D >= 6.5 or multiple lapses)
      if (record.difficulty >= 6.5 || record.lapses >= 2) {
        weakConcepts.push({
          conceptId: record.conceptId,
          conceptName,
          category: "weak_concept_revision",
          retrievability: currentR,
          stability: record.stability,
          difficulty: record.difficulty,
          dueDaysAgo,
          priority: currentR < targetRetention ? "high" : "medium",
          reason: `High conceptual friction (Difficulty ${record.difficulty}/10, ${record.lapses} historical lapses)`,
        });
      }

      // Category 3: Prerequisite Reinforcement (Prerequisite for upcoming goals with R < 0.85)
      if (prerequisiteConceptIds.includes(record.conceptId) && currentR < 0.85) {
        prerequisiteReinforcements.push({
          conceptId: record.conceptId,
          conceptName,
          category: "prerequisite_reinforcement",
          retrievability: currentR,
          stability: record.stability,
          difficulty: record.difficulty,
          dueDaysAgo,
          priority: "high",
          reason: `Critical prerequisite for active milestone with decaying retention (${Math.round(currentR * 100)}%)`,
        });
      }

      // Category 4: Daily Review Queue (Normal scheduled spaced review where R < target retention)
      if (isDue) {
        dailyReviewQueue.push({
          conceptId: record.conceptId,
          conceptName,
          category: "daily_review",
          retrievability: currentR,
          stability: record.stability,
          difficulty: record.difficulty,
          dueDaysAgo,
          priority: dueDaysAgo > 2 ? "high" : dueDaysAgo > 0 ? "medium" : "low",
          reason: `Scheduled review due (${dueDaysAgo > 0 ? `${dueDaysAgo} days overdue` : "today"}, R=${Math.round(currentR * 100)}%)`,
        });
      }
    }

    // Consolidated Prioritized Queue: Deduplicate and sort by lowest retrievability first
    const seen = new Set<string>();
    const prioritizedQueue: ReviewQueueItem[] = [];

    // Order of urgency: Forgotten -> Prerequisite -> Weak -> Normal Daily
    const combined = [...forgottenConcepts, ...prerequisiteReinforcements, ...weakConcepts, ...dailyReviewQueue];
    // Sort primarily by Retrievability ascending (most urgently decayed first)
    combined.sort((a, b) => a.retrievability - b.retrievability);

    for (const item of combined) {
      if (!seen.has(item.conceptId)) {
        seen.add(item.conceptId);
        prioritizedQueue.push(item);
      }
    }

    return {
      totalDue: prioritizedQueue.length,
      dailyReviewQueue,
      weakConcepts,
      forgottenConcepts,
      prerequisiteReinforcements,
      prioritizedQueue,
    };
  }
}

export { SpacedRepetitionScheduler as FSRSScheduler };
