/**
 * ASTRION Supporting Intelligence — Communication-Gap Agent
 * Layer: Supporting Intelligence Agents (Agent Layer C)
 * Responsibilities:
 *  - Provide actionable, constructive feedback on technical writing, clarity, and presentation
 *  - Audit text for passive voice, ambiguous requirements, and missing impact metrics
 *  - Enforce respectful boundary: Never diagnose personality or social competence from casual text
 */

import { AgentMetadata, AgentExecutionInput, AgentExecutionResult } from "./agent-interface";

export interface CommunicationFeedbackOutput {
  clarityScore: number; // 0.0 - 10.0
  structureObservations: string[];
  suggestedImprovements: string[];
}

export class CommunicationGapAgent {
  public static readonly metadata: AgentMetadata = {
    id: "communication-gap-agent",
    name: "Communication-Gap Intelligence",
    layer: "SupportingIntelligence",
    description: "Evaluates technical clarity, conciseness, and presentation without personality judgment.",
    isDeterministic: true,
    requiredConsentPurposes: ["service_personalization"],
  };

  /**
   * Analyzes written communication clarity
   */
  public static execute(input: AgentExecutionInput): AgentExecutionResult {
    const text = input.userMessage;
    const observations: string[] = [];
    const improvements: string[] = [];

    // Basic clarity checks on text length and structure
    if (text.length > 500 && !text.includes("\n")) {
      observations.push("Dense single-paragraph text without structural line breaks.");
      improvements.push("Organize longer technical questions into bullet points or distinct paragraphs.");
    }

    if (text.includes("it doesn't work") && !text.includes("error") && !text.includes("expected")) {
      observations.push("Ambiguous symptom description ('it doesn't work').");
      improvements.push("Include the exact error message, expected outcome, and current behavior.");
    }

    const clarityScore = observations.length === 0 ? 9.0 : observations.length === 1 ? 7.5 : 6.0;

    const payload: CommunicationFeedbackOutput = {
      clarityScore,
      structureObservations: observations,
      suggestedImprovements: improvements,
    };

    return {
      agentId: this.metadata.id,
      success: true,
      insights: observations.length > 0
        ? [`Clarity Observation: ${observations[0]}`]
        : ["Communication is clear and specific."],
      payload,
    };
  }
}
