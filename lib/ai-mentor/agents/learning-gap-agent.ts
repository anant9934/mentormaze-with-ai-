/**
 * ASTRION Student Intelligence — Learning-Gap Detector Agent
 * Layer: Student Intelligence Agents (Agent Layer B)
 * Responsibilities:
 *  - Compare student evidence against a target competency framework
 *  - Distinguish confirmed gaps (failed checks/low assessment) from suspected gaps (missing evidence)
 *  - Provide evidence-backed diagnostic explanations
 *  - Formulate actionable remediation steps
 */

import { AgentMetadata, AgentExecutionInput, AgentExecutionResult } from "./agent-interface";
import { CANONICAL_TAXONOMY } from "../skills-constants";
import { RecommendedAction } from "../types";

export interface SkillGapItem {
  skillId: string;
  skillName: string;
  category: string;
  gapType: "confirmed_weakness" | "suspected_gap" | "missing_evidence";
  currentScore: number;
  targetScore: number;
  evidenceRationale: string;
  remediationStep: string;
}

export interface LearningGapOutput {
  targetRole: string;
  confirmedGaps: SkillGapItem[];
  suspectedGaps: SkillGapItem[];
  overallGapSeverity: "low" | "moderate" | "high";
}

export class LearningGapAgent {
  public static readonly metadata: AgentMetadata = {
    id: "learning-gap-agent",
    name: "Learning-Gap Intelligence",
    layer: "StudentIntelligence",
    description: "Detects confirmed vs suspected competency gaps, compares against target roles, and formulates remediation.",
    isDeterministic: true,
    requiredConsentPurposes: ["service_personalization"],
  };

  /**
   * Diagnoses learning gaps based on student skills and target role
   */
  public static async execute(input: AgentExecutionInput): Promise<AgentExecutionResult> {
    const studentSkills = input.context.relevantSkills || [];
    const targetRole = input.context.targetRole || "Software Development Engineer (SDE-1)";

    // Competencies expected for standard Software Engineering
    const coreTargetSkills = [
      { id: "arrays_strings", name: "Arrays & Strings", minScore: 7.0 },
      { id: "dynamic_programming", name: "Dynamic Programming", minScore: 6.5 },
      { id: "relational_db_sql", name: "SQL & Relational Modeling", minScore: 7.0 },
      { id: "distributed_systems", name: "Distributed Systems & Scalability", minScore: 6.0 },
      { id: "rest_api_design", name: "REST & API Architecture", minScore: 7.0 },
    ];

    const confirmedGaps: SkillGapItem[] = [];
    const suspectedGaps: SkillGapItem[] = [];

    for (const target of coreTargetSkills) {
      const studentSkill = studentSkills.find((s) => s.skillId === target.id);

      if (!studentSkill) {
        suspectedGaps.push({
          skillId: target.id,
          skillName: target.name,
          category: CANONICAL_TAXONOMY.find((t) => t.id === target.id)?.category || "General",
          gapType: "missing_evidence",
          currentScore: 0.0,
          targetScore: target.minScore,
          evidenceRationale: `No demonstrated evidence or assessment recorded for ${target.name}.`,
          remediationStep: `Complete foundational practice and concept verification in ${target.name}.`,
        });
      } else if (studentSkill.masteryScore < 5.0 && studentSkill.evidenceType === "assessed") {
        confirmedGaps.push({
          skillId: target.id,
          skillName: target.name,
          category: studentSkill.category || "General",
          gapType: "confirmed_weakness",
          currentScore: studentSkill.masteryScore,
          targetScore: target.minScore,
          evidenceRationale: `Assessed mastery score (${studentSkill.masteryScore.toFixed(1)}/10.0) is below target ${target.minScore.toFixed(1)}. Known weaknesses: ${studentSkill.knownWeaknesses.join(", ") || "execution speed"}.`,
          remediationStep: `Review core invariants and complete 3 targeted exercises in ${target.name}.`,
        });
      } else if (studentSkill.masteryScore < target.minScore) {
        suspectedGaps.push({
          skillId: target.id,
          skillName: target.name,
          category: studentSkill.category || "General",
          gapType: "suspected_gap",
          currentScore: studentSkill.masteryScore,
          targetScore: target.minScore,
          evidenceRationale: `Self-reported or inferred score (${studentSkill.masteryScore.toFixed(1)}) requires verification to meet ${targetRole} benchmark.`,
          remediationStep: `Take a diagnostic assessment to confirm true proficiency in ${target.name}.`,
        });
      }
    }

    const totalGaps = confirmedGaps.length + suspectedGaps.length;
    const severity: "low" | "moderate" | "high" =
      confirmedGaps.length >= 2 || totalGaps >= 4 ? "high" : totalGaps >= 2 ? "moderate" : "low";

    const recommendedActions: RecommendedAction[] = [];
    if (confirmedGaps.length > 0) {
      recommendedActions.push({
        id: `act-gap-${confirmedGaps[0].skillId}`,
        title: `Remediate Gap: ${confirmedGaps[0].skillName}`,
        category: "Skill Remediation",
        priority: "high",
      });
    }

    const payload: LearningGapOutput = {
      targetRole,
      confirmedGaps,
      suspectedGaps,
      overallGapSeverity: severity,
    };

    return {
      agentId: this.metadata.id,
      success: true,
      insights: [
        `Competency Benchmark: ${targetRole} (${severity.toUpperCase()} gap severity)`,
        `Confirmed Gaps: ${confirmedGaps.length} | Suspected/Unverified: ${suspectedGaps.length}`,
      ],
      recommendedActions,
      payload,
    };
  }
}
