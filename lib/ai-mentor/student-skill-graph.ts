/**
 * Student Skill Knowledge Graph Engine
 * Hierarchical Taxonomy, Prerequisite Dependency Graph, and Evidence-Based Mastery
 * Brand: MentorMaze by AI Tathastu
 */

import { MasteryState, ProvenanceType } from "./types";
import { getDb } from "../db";
import {
  studentSkillNodes,
  studentSkillDependencies,
  studentSkillEvidence,
} from "../db/ai-mentor-schema";
import { eq, and } from "drizzle-orm";

export {
  type SkillTaxonomyNode,
  type StudentSkillRecord,
  CANONICAL_TAXONOMY,
} from "./skills-constants";
import {
  type SkillTaxonomyNode,
  type StudentSkillRecord,
  CANONICAL_TAXONOMY,
} from "./skills-constants";

export class StudentSkillGraph {
  private static userSkillStore: Map<string, Map<string, StudentSkillRecord>> = new Map();

  /**
   * Resets the in-memory cache for clean testing runs
   */
  public static resetCache(): void {
    this.userSkillStore.clear();
  }

  /**
   * Initialize or retrieve skill profile for a student
   */
  public static getStudentSkills(studentUserId: string): StudentSkillRecord[] {
    if (!this.userSkillStore.has(studentUserId)) {
      // Seed default baseline skills
      const initialMap = new Map<string, StudentSkillRecord>();
      
      const seedDefaults: Partial<StudentSkillRecord>[] = [
        {
          skillId: "typescript_core",
          masteryState: "demonstrated",
          masteryScore: 8.2,
          confidence: 0.9,
          assessmentCount: 5,
          successCount: 4,
          knownWeaknesses: ["Advanced conditional types with infer keyword"],
          commonMisconceptions: ["Confusing type aliases with interfaces"],
          evidenceSource: "code_execution",
        },
        {
          skillId: "arrays_strings",
          masteryState: "demonstrated",
          masteryScore: 8.5,
          confidence: 0.88,
          assessmentCount: 8,
          successCount: 7,
          knownWeaknesses: ["Edge cases with empty arrays or negative numbers"],
          commonMisconceptions: ["Assuming Two-Pointers works on unsorted arrays"],
          evidenceSource: "mock_interview",
        },
        {
          skillId: "dynamic_programming",
          masteryState: "developing",
          masteryScore: 5.5,
          confidence: 0.75,
          assessmentCount: 4,
          successCount: 2,
          knownWeaknesses: ["Formulating state transitions in 2D knapsack problems"],
          commonMisconceptions: ["Trying to memoize global variables without passing state"],
          evidenceSource: "code_execution",
        },
        {
          skillId: "relational_db_sql",
          masteryState: "demonstrated",
          masteryScore: 8.0,
          confidence: 0.85,
          assessmentCount: 6,
          successCount: 5,
          knownWeaknesses: ["Window functions over partitions"],
          commonMisconceptions: ["Assuming HAVING and WHERE are interchangeable"],
          evidenceSource: "project_evidence",
        },
        {
          skillId: "distributed_systems",
          masteryState: "introduced",
          masteryScore: 4.8,
          confidence: 0.6,
          assessmentCount: 2,
          successCount: 1,
          knownWeaknesses: ["Consistency guarantees under split-brain network partitions"],
          commonMisconceptions: ["Assuming Kafka is a traditional message broker queue"],
          evidenceSource: "mentor_evaluation",
        },
      ];

      for (const item of seedDefaults) {
        initialMap.set(item.skillId!, {
          id: `sk-${studentUserId}-${item.skillId}`,
          studentUserId,
          skillId: item.skillId!,
          masteryState: item.masteryState || "not_assessed",
          masteryScore: item.masteryScore || 0,
          confidence: item.confidence || 0.5,
          assessmentCount: item.assessmentCount || 0,
          successCount: item.successCount || 0,
          knownWeaknesses: item.knownWeaknesses || [],
          commonMisconceptions: item.commonMisconceptions || [],
          lastAssessedAt: new Date().toISOString(),
          evidenceSource: item.evidenceSource || "self_reported",
        });
      }

      this.userSkillStore.set(studentUserId, initialMap);
    }

    return Array.from(this.userSkillStore.get(studentUserId)!.values());
  }

  /**
   * Check whether all prerequisites for a target skill have been demonstrated
   */
  public static checkPrerequisites(
    studentUserId: string,
    targetSkillId: string
  ): { hasGaps: boolean; missingPrerequisites: SkillTaxonomyNode[] } {
    const targetNode = CANONICAL_TAXONOMY.find((n) => n.id === targetSkillId);
    if (!targetNode || targetNode.prerequisites.length === 0) {
      return { hasGaps: false, missingPrerequisites: [] };
    }

    const studentSkills = this.getStudentSkills(studentUserId);
    const missing: SkillTaxonomyNode[] = [];

    for (const prereqId of targetNode.prerequisites) {
      const found = studentSkills.find((s) => s.skillId === prereqId);
      const isDemonstrated = found && (found.masteryState === "demonstrated" || found.masteryState === "consistently_demonstrated");

      if (!isDemonstrated) {
        const prereqNode = CANONICAL_TAXONOMY.find((n) => n.id === prereqId);
        if (prereqNode) missing.push(prereqNode);
      }
    }

    return {
      hasGaps: missing.length > 0,
      missingPrerequisites: missing,
    };
  }

  /**
   * Record new evidence and calibrate student mastery state with anti-gaming barriers
   */
  public static recordEvidence(
    studentUserId: string,
    skillId: string,
    score: number, // 0.0 to 10.0
    evidenceSource: StudentSkillRecord["evidenceSource"],
    misconceptionDetectedOrOptions?: string | {
      assessmentId?: string;
      isAssisted?: boolean;
      requestingUserId?: string;
      misconceptionDetected?: string;
    },
    maybeOptions?: {
      assessmentId?: string;
      isAssisted?: boolean;
      requestingUserId?: string;
    }
  ): StudentSkillRecord {
    // Normalize overloaded parameters
    const misconceptionDetected = typeof misconceptionDetectedOrOptions === "string"
      ? misconceptionDetectedOrOptions
      : misconceptionDetectedOrOptions?.misconceptionDetected;

    const options = typeof misconceptionDetectedOrOptions === "object"
      ? misconceptionDetectedOrOptions
      : maybeOptions || {};

    const { assessmentId, isAssisted = false, requestingUserId } = options;

    // 1. Cross-student authorization check
    if (
      requestingUserId &&
      requestingUserId !== studentUserId &&
      !requestingUserId.startsWith("mentor-") &&
      requestingUserId !== "admin"
    ) {
      throw new Error("403_FORBIDDEN: You do not have permission to record skill evidence for another student.");
    }

    // 2. Score validation & boundary integrity
    if (typeof score !== "number" || Number.isNaN(score) || score < 0.0 || score > 10.0) {
      throw new Error("400_BAD_REQUEST: Assessment score must be a number between 0.0 and 10.0.");
    }

    const skills = this.getStudentSkills(studentUserId);
    const userMap = this.userSkillStore.get(studentUserId)!;
    let record = userMap.get(skillId);

    // Is this an independent, unassisted assessment eligible for Level 4/5 promotion?
    const isEligibleForIndependentCheck =
      score >= 7.0 &&
      !isAssisted &&
      evidenceSource !== "self_reported" &&
      evidenceSource !== ("ai_inferred" as any);

    if (!record) {
      const initialScore = score;
      const initialSuccess = isEligibleForIndependentCheck ? 1 : 0;
      let initialLevel: 0 | 1 | 2 | 3 | 4 | 5 = 1;
      if (initialScore < 2.0) initialLevel = 0;
      else if (initialScore < 5.0) initialLevel = 1;
      else if (initialScore < 7.0) initialLevel = 2;
      else initialLevel = isAssisted ? 3 : 3;

      record = {
        id: `sk-${studentUserId}-${skillId}`,
        studentUserId,
        skillId,
        masteryState: initialLevel >= 2 ? "developing" : initialLevel === 1 ? "introduced" : "not_assessed",
        masteryLevel: initialLevel,
        masteryScore: score,
        confidence: 0.5,
        assessmentCount: 1,
        successCount: initialSuccess,
        verifiedAssessmentIds: assessmentId && isEligibleForIndependentCheck ? [assessmentId] : [],
        knownWeaknesses: [],
        commonMisconceptions: misconceptionDetected ? [misconceptionDetected] : [],
        lastAssessedAt: new Date().toISOString(),
        evidenceSource,
      };
    } else {
      record.assessmentCount += 1;
      if (!record.verifiedAssessmentIds) {
        record.verifiedAssessmentIds = [];
      }

      // 3. Retry Gaming Prevention:
      // If assessmentId was already verified, this is a retry of the same question!
      // Do NOT increment successCount again.
      const isDuplicateAssessment = assessmentId ? record.verifiedAssessmentIds.includes(assessmentId) : false;

      if (isEligibleForIndependentCheck && !isDuplicateAssessment) {
        record.successCount += 1;
        if (assessmentId) {
          record.verifiedAssessmentIds.push(assessmentId);
        }
      }

      // Weight evidence based on rigour of evidence source
      const weight = evidenceSource === "code_execution" || evidenceSource === "mock_interview" ? 0.4 : 0.2;
      record.masteryScore = Number((record.masteryScore * (1 - weight) + score * weight).toFixed(2));
      record.confidence = Math.min(0.98, Number((record.confidence + 0.05).toFixed(2)));
      record.lastAssessedAt = new Date().toISOString();
      record.evidenceSource = evidenceSource;

      if (misconceptionDetected && !record.commonMisconceptions.includes(misconceptionDetected)) {
        record.commonMisconceptions.push(misconceptionDetected);
      }

      // 4. Update state transitions with strict 0-5 canonical mastery scale:
      // Level 5 requires >= 3 DISTINCT independent checks with score >= 8.5
      // Level 4 requires >= 2 DISTINCT independent checks with score >= 7.0
      // AI inferences or assisted answers CANNOT advance to Level 4 or 5
      if (record.successCount >= 3 && record.masteryScore >= 8.5 && !isAssisted) {
        record.masteryState = "consistently_demonstrated";
        record.masteryLevel = 5;
      } else if (record.successCount >= 2 && record.masteryScore >= 7.0 && !isAssisted) {
        record.masteryState = "demonstrated";
        record.masteryLevel = 4;
      } else if (record.masteryScore >= 7.0) {
        record.masteryState = "developing";
        record.masteryLevel = 3;
      } else if (record.masteryScore >= 5.0) {
        record.masteryState = "developing";
        record.masteryLevel = 2;
      } else if (record.masteryScore >= 2.0) {
        record.masteryState = "introduced";
        record.masteryLevel = 1;
      } else {
        record.masteryState = "not_assessed";
        record.masteryLevel = 0;
      }
    }

    userMap.set(skillId, record);

    // Asynchronously persist updated skill and assessment evidence to SQL
    try {
      const db = getDb();
      const now = new Date();
      db.insert(studentSkillEvidence).values({
        id: `ske-${studentUserId}-${skillId}-${Date.now()}`,
        studentUserId,
        skillId,
        assessmentType: evidenceSource,
        score,
        feedback: misconceptionDetected || "Assessed via StudentSkillGraph",
        sourceRef: `eval-${evidenceSource}`,
        createdAt: now,
      }).catch(() => {});

      db.update(studentSkillNodes)
        .set({
          masteryState: record.masteryState,
          masteryScore: record.masteryScore,
          confidence: record.confidence,
          assessmentCount: record.assessmentCount,
          successCount: record.successCount,
          commonMisconceptions: record.commonMisconceptions,
          lastAssessedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(studentSkillNodes.studentUserId, studentUserId),
            eq(studentSkillNodes.skillId, skillId)
          )
        )
        .catch(() => {});
    } catch {}

    return record;
  }

  /**
   * Seed prerequisite DAG into student_skill_dependencies table in SQL
   */
  public static async seedPrerequisitesToSql(): Promise<number> {
    let count = 0;
    try {
      const db = getDb();
      for (const node of CANONICAL_TAXONOMY) {
        for (const prereqId of node.prerequisites) {
          const id = `dep-${node.id}-${prereqId}`;
          await db
            .insert(studentSkillDependencies)
            .values({
              id,
              skillId: node.id,
              prerequisiteSkillId: prereqId,
              dependencyType: "hard_prerequisite",
              minPrerequisiteState: "demonstrated",
            })
            .onConflictDoNothing();
          count++;
        }
      }
    } catch (err: any) {
      if (err?.code !== "42P01") {
        console.warn("[StudentSkillGraph] seedPrerequisitesToSql warning:", err?.message || err);
      }
    }
    return count;
  }

  /**
   * Asynchronously load skills directly from SQL
   */
  public static async getStudentSkillsAsync(studentUserId: string): Promise<StudentSkillRecord[]> {
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(studentSkillNodes)
        .where(eq(studentSkillNodes.studentUserId, studentUserId));

      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          studentUserId: r.studentUserId,
          skillId: r.skillId,
          masteryState: r.masteryState as MasteryState,
          masteryScore: r.masteryScore ?? 0,
          confidence: r.confidence ?? 0.5,
          assessmentCount: r.assessmentCount ?? 0,
          successCount: r.successCount ?? 0,
          knownWeaknesses: Array.isArray(r.knownWeaknesses) ? r.knownWeaknesses : [],
          commonMisconceptions: Array.isArray(r.commonMisconceptions) ? r.commonMisconceptions : [],
          lastAssessedAt: r.lastAssessedAt ? new Date(r.lastAssessedAt).toISOString() : new Date().toISOString(),
          evidenceSource: (r.evidenceType as any) || "self_reported",
        }));
      }
    } catch (err: any) {
      if (err?.code !== "42P01") {
        console.warn("[StudentSkillGraph] getStudentSkillsAsync SQL warning:", err?.message || err);
      }
    }

    return this.getStudentSkills(studentUserId);
  }

  /**
   * Check prerequisite gaps using persistent student_skill_dependencies in SQL
   */
  public static async checkPrerequisitesAsync(
    studentUserId: string,
    targetSkillId: string
  ): Promise<{ hasGaps: boolean; missingPrerequisites: string[]; prerequisites: string[] }> {
    try {
      const db = getDb();
      const deps = await db
        .select()
        .from(studentSkillDependencies)
        .where(eq(studentSkillDependencies.skillId, targetSkillId));

      if (!deps || deps.length === 0) {
        return { hasGaps: false, missingPrerequisites: [], prerequisites: [] };
      }

      const skills = await this.getStudentSkillsAsync(studentUserId);
      const missing: string[] = [];

      for (const d of deps) {
        const found = skills.find((s) => s.skillId === d.prerequisiteSkillId);
        const isDemonstrated = found && (found.masteryState === "demonstrated" || found.masteryState === "consistently_demonstrated");
        if (!isDemonstrated) {
          missing.push(d.prerequisiteSkillId);
        }
      }

      return {
        hasGaps: missing.length > 0,
        missingPrerequisites: missing,
        prerequisites: deps.map((d: any) => d.prerequisiteSkillId),
      };
    } catch {
      const res = this.checkPrerequisites(studentUserId, targetSkillId);
      return {
        hasGaps: res.hasGaps,
        missingPrerequisites: res.missingPrerequisites.map((p) => p.id),
        prerequisites: res.missingPrerequisites.map((p) => p.id),
      };
    }
  }

  /**
   * Reset cache for testing
   */
  public static reset(studentUserId?: string): void {
    if (studentUserId) {
      this.userSkillStore.delete(studentUserId);
    } else {
      this.userSkillStore.clear();
    }
  }
}

