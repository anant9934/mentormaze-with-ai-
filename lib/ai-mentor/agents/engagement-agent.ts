/**
 * ASTRION Student Intelligence — Engagement & Activity Intelligence Agent
 * Layer: Student Intelligence Agents (Agent Layer B)
 * Responsibilities:
 *  - Analyze authorized learning activity patterns (turns, sessions, verified answers)
 *  - Distinguish genuine conceptual mastery from superficial activity volume (vanity clicks)
 *  - Strictly avoid surveillance, invasive telemetry, or inferring sensitive emotional traits
 */

import { AgentMetadata, AgentExecutionInput, AgentExecutionResult } from "./agent-interface";

export interface EngagementMetricsOutput {
  conceptVerificationRatio: number; // Ratio of verified concept checks answered
  learningDepthScore: number;       // 0.0 - 10.0 based on depth of interactions
  consistencyPattern: "consistent" | "intermittent" | "starting";
  activityVolumeVsMasteryDistinction: string;
}

export class EngagementIntelligenceAgent {
  public static readonly metadata: AgentMetadata = {
    id: "engagement-agent",
    name: "Engagement & Activity Intelligence",
    layer: "StudentIntelligence",
    description: "Evaluates genuine learning depth over activity volume with zero invasive surveillance.",
    isDeterministic: true,
    requiredConsentPurposes: ["analytics_evaluation", "service_personalization"],
  };

  /**
   * Evaluates authorized engagement signals
   */
  public static async execute(input: AgentExecutionInput): Promise<AgentExecutionResult> {
    const history = input.conversationHistory || [];
    const relevantSkills = input.context.relevantSkills || [];

    const verifiedSkillsCount = relevantSkills.filter(
      (s) => s.evidenceType === "assessed" || s.evidenceType === "independently_verified"
    ).length;

    // Distinguish interaction count from genuine depth
    const totalTurns = history.length;
    const depthScore = Math.min(10.0, 4.0 + verifiedSkillsCount * 1.5);
    const verificationRatio = totalTurns > 0 ? Math.min(1.0, verifiedSkillsCount / (totalTurns * 0.5 + 1)) : 0.8;

    const payload: EngagementMetricsOutput = {
      conceptVerificationRatio: Number(verificationRatio.toFixed(2)),
      learningDepthScore: Number(depthScore.toFixed(1)),
      consistencyPattern: totalTurns >= 6 ? "consistent" : totalTurns >= 2 ? "intermittent" : "starting",
      activityVolumeVsMasteryDistinction: `Evaluated ${totalTurns} turns with ${verifiedSkillsCount} verified concept demonstrations. Raw session frequency is never equated with verified understanding.`,
    };

    return {
      agentId: this.metadata.id,
      success: true,
      insights: [
        `Learning Depth: ${depthScore.toFixed(1)}/10.0`,
        payload.activityVolumeVsMasteryDistinction,
      ],
      payload,
    };
  }
}

export { EngagementIntelligenceAgent as EngagementAgent };
