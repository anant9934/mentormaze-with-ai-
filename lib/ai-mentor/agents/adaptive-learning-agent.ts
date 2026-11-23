/**
 * ASTRION Student Intelligence — Adaptive Learning Agent
 * Layer: Student Intelligence Agents (Agent Layer B)
 * Responsibilities:
 *  - Track demonstrated mastery vs inferred mastery
 *  - Identify unmet prerequisite concepts from the knowledge graph
 *  - Recommend next optimal learning topic
 *  - Dynamically calibrate difficulty and pacing
 */

import { AgentMetadata, AgentExecutionInput, AgentExecutionResult } from "./agent-interface";
import { StudentIntelligenceGraph, SkillNodeWithEvidence } from "../student-intelligence-graph";
import { CANONICAL_TAXONOMY } from "../skills-constants";
import { RecommendedAction } from "../types";

export interface AdaptiveLearningOutput {
  currentMasteryLevel: "foundational" | "intermediate" | "advanced";
  nextRecommendedTopic: {
    skillId: string;
    skillName: string;
    category: string;
    rationale: string;
  } | null;
  prerequisiteAlerts: {
    targetSkill: string;
    missingPrerequisite: string;
  }[];
  pacingRecommendation: "accelerate" | "standard" | "scaffold_foundations";
}

export class AdaptiveLearningAgent {
  public static readonly metadata: AgentMetadata = {
    id: "adaptive-learning-agent",
    name: "Adaptive Learning Intelligence",
    layer: "StudentIntelligence",
    description: "Tracks demonstrated vs inferred mastery, verifies prerequisites, and adapts learning pacing.",
    isDeterministic: true,
    requiredConsentPurposes: ["service_personalization"],
  };

  /**
   * Evaluates student's skill state and generates adaptive recommendations
   */
  public static async execute(input: AgentExecutionInput): Promise<AgentExecutionResult> {
    const studentSkills = input.context.relevantSkills || [];
    const confirmedStrengths = input.context.classifiedEvidence.confirmedFacts || [];
    const missingPrerequisites: { targetSkill: string; missingPrerequisite: string }[] = [];

    // 1. Distinguish assessed/demonstrated mastery from inferred/self-reported
    let totalScore = 0;
    let assessedCount = 0;
    let demonstratedCount = 0;
    let inferredCount = 0;

    for (const skill of studentSkills) {
      if (skill.evidenceType === "assessed" || skill.evidenceType === "independently_verified") {
        assessedCount++;
        totalScore += skill.masteryScore;
      } else if (skill.evidenceType === "project_demonstrated") {
        demonstratedCount++;
        totalScore += skill.masteryScore * 0.9;
      } else {
        inferredCount++;
        totalScore += skill.masteryScore * 0.6;
      }

      // Check prerequisites against canonical taxonomy
      const taxNode = CANONICAL_TAXONOMY.find((t) => t.id === skill.skillId);
      if (taxNode && taxNode.prerequisites.length > 0) {
        for (const prereqId of taxNode.prerequisites) {
          const prereqSkill = studentSkills.find((s) => s.skillId === prereqId);
          if (!prereqSkill || prereqSkill.masteryScore < 6.0) {
            const prereqNode = CANONICAL_TAXONOMY.find((t) => t.id === prereqId);
            missingPrerequisites.push({
              targetSkill: skill.skillName,
              missingPrerequisite: prereqNode ? prereqNode.name : prereqId,
            });
          }
        }
      }
    }

    const totalEvaluated = assessedCount + demonstratedCount + inferredCount;
    const avgMastery = totalEvaluated > 0 ? totalScore / totalEvaluated : 5.0;

    // 2. Determine mastery level & pacing recommendation
    let currentMasteryLevel: "foundational" | "intermediate" | "advanced" = "foundational";
    let pacingRecommendation: "accelerate" | "standard" | "scaffold_foundations" = "standard";

    if (avgMastery >= 7.8 && assessedCount >= 3) {
      currentMasteryLevel = "advanced";
      pacingRecommendation = "accelerate";
    } else if (avgMastery >= 5.5) {
      currentMasteryLevel = "intermediate";
      pacingRecommendation = "standard";
    } else {
      currentMasteryLevel = "foundational";
      pacingRecommendation = "scaffold_foundations";
    }

    // 3. Find next recommended learning topic from unmastered skills whose prerequisites are satisfied
    let nextRecommended: AdaptiveLearningOutput["nextRecommendedTopic"] = null;
    for (const node of CANONICAL_TAXONOMY) {
      const existing = studentSkills.find((s) => s.skillId === node.id);
      if (!existing || existing.masteryScore < 6.5) {
        // Check if all prerequisites are met
        const prereqsMet = node.prerequisites.every((prereqId) => {
          const prSkill = studentSkills.find((s) => s.skillId === prereqId);
          return prSkill && prSkill.masteryScore >= 6.0;
        });

        if (prereqsMet) {
          nextRecommended = {
            skillId: node.id,
            skillName: node.name,
            category: node.category,
            rationale: `Prerequisites verified (${node.prerequisites.join(", ") || "none"}). Ideal next step for ${node.category}.`,
          };
          break;
        }
      }
    }

    // 4. Formulate Recommended Actions
    const recommendedActions: RecommendedAction[] = [];
    if (nextRecommended) {
      recommendedActions.push({
        id: `act-next-${nextRecommended.skillId}`,
        title: `Study Next: ${nextRecommended.skillName}`,
        category: "Learning",
        priority: "medium",
      });
    }

    if (missingPrerequisites.length > 0) {
      recommendedActions.push({
        id: `act-prereq-${Date.now()}`,
        title: `Bridge Prerequisite: ${missingPrerequisites[0].missingPrerequisite}`,
        category: "Prerequisite",
        priority: "high",
      });
    }

    const outputPayload: AdaptiveLearningOutput = {
      currentMasteryLevel,
      nextRecommendedTopic: nextRecommended,
      prerequisiteAlerts: missingPrerequisites,
      pacingRecommendation,
    };

    return {
      agentId: this.metadata.id,
      success: true,
      insights: [
        `Mastery Level: ${currentMasteryLevel.toUpperCase()} (Assessed: ${assessedCount}, Project-Demonstrated: ${demonstratedCount}, Inferred: ${inferredCount})`,
        `Pacing: ${pacingRecommendation.replace(/_/g, " ")}`,
        nextRecommended ? `Recommended Next Milestone: ${nextRecommended.skillName}` : "Curriculum baseline completed.",
      ],
      recommendedActions,
      payload: outputPayload,
    };
  }
}
