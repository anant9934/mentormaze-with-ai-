/**
 * ASTRION Bayesian Knowledge Tracing (BKT) Service
 * Brand: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 * Reference Standard: Corbett & Anderson (1995) Canonical BKT; Tutor MCP (`ArnaudGuiovanna/tutor-mcp`)
 *
 * Provides mathematically sound Bayesian Knowledge Tracing with standard literature default parameters
 * and continuous assistance-weighted observation updates.
 *
 * NOTE ON PARAMETER CALIBRATION:
 * The initial parameters P(L0)=0.15, P(T)=0.20, P(G)=0.15, P(S)=0.10 are standard baseline default
 * literature values (Corbett & Anderson, 1995). They represent initial heuristic priors and have NOT
 * been empirically fitted on a local MentorMaze student corpus.
 */

import fs from "fs";
import path from "path";
import {
  BKTConceptState,
  BKTInteractionOutcome,
  BKTMasteryBand,
  CanonicalMasteryLevel,
  ProvenanceType,
} from "../types";
import { getDb } from "../../db";
import { studentConceptBktState } from "../../db/ai-mentor-schema";
import { eq, and } from "drizzle-orm";

export interface BKTObservationWeight {
  observationValue: number; // O_t in [0.0, 1.0]
  guessProbability: number;   // calibrated P(G)
  slipProbability: number;    // calibrated P(S)
  isIndependentCheck: boolean;
  description: string;
}

export const BKT_OUTCOME_WEIGHTS: Record<BKTInteractionOutcome, BKTObservationWeight> = {
  independent_success: {
    observationValue: 1.0,
    guessProbability: 0.15,
    slipProbability: 0.10,
    isIndependentCheck: true,
    description: "Solved independently without hints or solution templates",
  },
  hint_probing: {
    observationValue: 0.75,
    guessProbability: 0.25,
    slipProbability: 0.10,
    isIndependentCheck: false,
    description: "Solved after minimal probing question (Level 1-2 hint)",
  },
  hint_property: {
    observationValue: 0.50,
    guessProbability: 0.40,
    slipProbability: 0.10,
    isIndependentCheck: false,
    description: "Solved after core property or invariant revelation (Level 3-4 hint)",
  },
  hint_worked_example: {
    observationValue: 0.25,
    guessProbability: 0.65,
    slipProbability: 0.10,
    isIndependentCheck: false,
    description: "Solved after equivalent worked example (Level 5 hint)",
  },
  solution_explained: {
    observationValue: 0.0,
    guessProbability: 0.10,
    slipProbability: 0.10,
    isIndependentCheck: false,
    description: "Complete canonical solution explained (Level 6 hint; learning event only)",
  },
  failed_attempt: {
    observationValue: 0.0,
    guessProbability: 0.15,
    slipProbability: 0.10,
    isIndependentCheck: false,
    description: "Incorrect attempt or uncorrected misconception",
  },
  unprompted_delayed_retrieval: {
    observationValue: 1.0,
    guessProbability: 0.10,
    slipProbability: 0.10,
    isIndependentCheck: true,
    description: "Correct answer after multi-day spaced retrieval delay",
  },
  transfer_assessment: {
    observationValue: 1.0,
    guessProbability: 0.05,
    slipProbability: 0.10,
    isIndependentCheck: true,
    description: "Successful application in a novel or unfamiliar transfer scenario",
  },
};

export class BayesianKnowledgeTracer {
  // studentUserId -> (conceptId -> BKTConceptState)
  private static store: Map<string, Map<string, BKTConceptState>> = new Map();
  private static isInitialized = false;

  public static readonly DEFAULT_P_L0 = 0.15;
  public static readonly DEFAULT_P_T = 0.20;
  public static readonly DEFAULT_P_G = 0.15;
  public static readonly DEFAULT_P_S = 0.10;

  private static get isTestEnvironment(): boolean {
    return process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);
  }

  private static get storageFilePath(): string | null {
    if (this.isTestEnvironment) {
      const fixtureDir = path.resolve(process.cwd(), "tests", "fixtures");
      if (!fs.existsSync(fixtureDir)) {
        fs.mkdirSync(fixtureDir, { recursive: true });
      }
      return path.resolve(fixtureDir, ".test-bkt-store.json");
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
          .from(studentConceptBktState)
          .then((rows: any[]) => {
            if (rows && rows.length > 0) {
              for (const r of rows) {
                if (!this.store.has(r.studentUserId)) {
                  this.store.set(r.studentUserId, new Map());
                }
                this.store.get(r.studentUserId)!.set(r.conceptId, {
                  conceptId: r.conceptId,
                  studentUserId: r.studentUserId,
                  knowledgeProbability: r.knowledgeProbability,
                  initialProbability: r.initialProbability,
                  learnProbability: r.learnProbability,
                  guessProbability: r.guessProbability,
                  slipProbability: r.slipProbability,
                  masteryBand: r.masteryBand,
                  canonicalMasteryLevel: r.canonicalMasteryLevel,
                  independentChecksCount: r.independentChecksCount,
                  totalAttempts: r.totalAttempts,
                  lastAssistanceLevel: r.lastAssistanceLevel || undefined,
                  lastOutcome: r.lastOutcome || undefined,
                  lastEvidenceSource: r.lastEvidenceSource,
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
              for (const [cId, state] of Object.entries(conceptMap as Record<string, BKTConceptState>)) {
                map.set(cId, state);
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
          const out: Record<string, Record<string, BKTConceptState>> = {};
          for (const [userId, userMap] of this.store.entries()) {
            out[userId] = {};
            for (const [cId, state] of userMap.entries()) {
              out[userId][cId] = state;
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
   * Maps continuous knowledge probability to an interpretable qualitative band
   */
  public static probabilityToMasteryBand(pL: number, independentChecks: number): BKTMasteryBand {
    if (pL < 0.36) return "novice";
    if (pL < 0.66) return "developing";
    if (pL < 0.86) return "competent";
    if (pL < 0.95) return "proficient";
    // Mastered requires >= 2 independent checks to prevent single-test inflation
    return independentChecks >= 2 ? "mastered" : "proficient";
  }

  /**
   * Maps BKT mastery band and check count to canonical 0-5 mastery scale
   */
  public static masteryBandToCanonicalLevel(band: BKTMasteryBand, totalAttempts: number): CanonicalMasteryLevel {
    if (totalAttempts === 0) return 0;
    switch (band) {
      case "novice":
        return 1;
      case "developing":
        return 2;
      case "competent":
        return 3;
      case "proficient":
        return 4;
      case "mastered":
        return 5;
    }
  }

  /**
   * Retrieves or initializes BKT state for a student on a specific concept
   */
  public static getConceptState(
    studentUserId: string,
    conceptId: string,
    requestingUserId?: string
  ): BKTConceptState {
    this.ensureLoaded();
    if (requestingUserId && requestingUserId !== studentUserId && !requestingUserId.startsWith("mentor-") && requestingUserId !== "admin") {
      throw new Error("403_FORBIDDEN: You do not have permission to access another student's knowledge model.");
    }

    const normConcept = conceptId.trim().toLowerCase();
    if (!this.store.has(studentUserId)) {
      this.store.set(studentUserId, new Map());
    }
    const userMap = this.store.get(studentUserId)!;

    let state = userMap.get(normConcept);
    if (!state) {
      const now = new Date().toISOString();
      state = {
        conceptId: normConcept,
        studentUserId,
        knowledgeProbability: this.DEFAULT_P_L0,
        initialProbability: this.DEFAULT_P_L0,
        learnProbability: this.DEFAULT_P_T,
        guessProbability: this.DEFAULT_P_G,
        slipProbability: this.DEFAULT_P_S,
        masteryBand: "novice",
        canonicalMasteryLevel: 0,
        independentChecksCount: 0,
        totalAttempts: 0,
        lastEvidenceSource: "student_reported",
        lastUpdatedAt: now,
      };
      userMap.set(normConcept, state);
    }

    return state;
  }

  /**
   * Updates latent knowledge estimate deterministically given a structured interaction outcome
   */
  public static recordObservation(params: {
    studentUserId: string;
    conceptId: string;
    outcome: BKTInteractionOutcome;
    evidenceSource?: ProvenanceType;
    requestingUserId?: string;
  }): {
    previousProbability: number;
    updatedProbability: number;
    masteryBand: BKTMasteryBand;
    canonicalMasteryLevel: CanonicalMasteryLevel;
    state: BKTConceptState;
  } {
    const { studentUserId, conceptId, outcome, evidenceSource = "assessment_verified", requestingUserId } = params;
    const state = this.getConceptState(studentUserId, conceptId, requestingUserId);
    const weight = BKT_OUTCOME_WEIGHTS[outcome];

    const prevPL = state.knowledgeProbability;
    const pT = state.learnProbability;
    const pG = weight.guessProbability;
    const pS = weight.slipProbability;
    const oVal = weight.observationValue;

    // 1. Calculate Conditional Posterior Probabilities
    // P(L_t | O_t = 1) = [P(L) * (1 - P(S))] / [P(L) * (1 - P(S)) + (1 - P(L)) * P(G)]
    const numCorrect = prevPL * (1.0 - pS);
    const denCorrect = numCorrect + (1.0 - prevPL) * pG;
    const postCorrect = denCorrect > 0 ? numCorrect / denCorrect : prevPL;

    // P(L_t | O_t = 0) = [P(L) * P(S)] / [P(L) * P(S) + (1 - P(L)) * (1 - P(G))]
    const numIncorrect = prevPL * pS;
    const denIncorrect = numIncorrect + (1.0 - prevPL) * (1.0 - pG);
    const postIncorrect = denIncorrect > 0 ? numIncorrect / denIncorrect : prevPL;

    // Interpolate for continuous observation value (assistance weighting)
    const posteriorGivenObs = oVal * postCorrect + (1.0 - oVal) * postIncorrect;

    // 2. Learning Transition Step: P(L_t) = P(L_t | O_t) + (1 - P(L_t | O_t)) * P(T)
    let nextPL = posteriorGivenObs + (1.0 - posteriorGivenObs) * pT;

    // Numerical safety clamp: [0.01, 0.999]
    nextPL = Math.max(0.01, Math.min(0.999, Math.round(nextPL * 10000) / 10000));

    // 3. Update Check Counts and Durability Flags
    state.totalAttempts += 1;
    if (weight.isIndependentCheck) {
      state.independentChecksCount += 1;
    }

    state.knowledgeProbability = nextPL;
    state.guessProbability = pG;
    state.slipProbability = pS;
    state.lastOutcome = outcome;
    state.lastEvidenceSource = evidenceSource;
    state.lastAssistanceLevel = weight.description;
    state.lastUpdatedAt = new Date().toISOString();

    state.masteryBand = this.probabilityToMasteryBand(nextPL, state.independentChecksCount);
    state.canonicalMasteryLevel = this.masteryBandToCanonicalLevel(state.masteryBand, state.totalAttempts);

    this.persistToDisk();

    // Async sync to SQL
    try {
      const db = getDb();
      db.insert(studentConceptBktState)
        .values({
          id: `bkt-${studentUserId}-${state.conceptId}`,
          studentUserId,
          conceptId: state.conceptId,
          knowledgeProbability: nextPL,
          initialProbability: state.initialProbability,
          learnProbability: state.learnProbability,
          guessProbability: state.guessProbability,
          slipProbability: state.slipProbability,
          masteryBand: state.masteryBand,
          canonicalMasteryLevel: state.canonicalMasteryLevel,
          independentChecksCount: state.independentChecksCount,
          totalAttempts: state.totalAttempts,
          lastAssistanceLevel: state.lastAssistanceLevel,
          lastOutcome: state.lastOutcome,
          lastEvidenceSource: state.lastEvidenceSource,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [studentConceptBktState.studentUserId, studentConceptBktState.conceptId],
          set: {
            knowledgeProbability: nextPL,
            masteryBand: state.masteryBand,
            canonicalMasteryLevel: state.canonicalMasteryLevel,
            independentChecksCount: state.independentChecksCount,
            totalAttempts: state.totalAttempts,
            lastAssistanceLevel: state.lastAssistanceLevel,
            lastOutcome: state.lastOutcome,
            lastEvidenceSource: state.lastEvidenceSource,
            updatedAt: new Date(),
          },
        })
        .catch(() => {});
    } catch {
      // Non-fatal if SQL table does not exist yet in unit test sandbox
    }

    return {
      previousProbability: prevPL,
      updatedProbability: nextPL,
      masteryBand: state.masteryBand,
      canonicalMasteryLevel: state.canonicalMasteryLevel,
      state,
    };
  }

  /**
   * Retrieves all concept states for a student
   */
  public static getAllConceptStates(
    studentUserId: string,
    requestingUserId?: string
  ): BKTConceptState[] {
    this.ensureLoaded();
    if (requestingUserId && requestingUserId !== studentUserId && !requestingUserId.startsWith("mentor-") && requestingUserId !== "admin") {
      throw new Error("403_FORBIDDEN: You do not have permission to access another student's knowledge model.");
    }
    const userMap = this.store.get(studentUserId);
    if (!userMap) return [];
    return Array.from(userMap.values());
  }
}
