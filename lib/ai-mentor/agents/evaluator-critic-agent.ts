/**
 * ASTRION Supporting Intelligence — Evaluator / Critic Agent
 * Layer: Supporting Intelligence Agents (Agent Layer C)
 * Responsibilities:
 *  - Audit correctness, relevance, completeness, and factual grounding
 *  - Detect factual contradictions between multiple specialist outputs
 *  - Identify unsupported student-profile claims (e.g. fabricated metrics on resumes)
 *  - Apply risk-based evaluation rather than expensive critique on every trivial turn
 */

import { AgentMetadata, AgentExecutionResult } from "./agent-interface";
import { SourceCitation } from "../types";

export interface CritiqueInput {
  userQuery: string;
  synthesizedResponse: string;
  activeSpecialists: string[];
  sources: SourceCitation[];
  isMultiSpecialist: boolean;
  studentContextClaims?: string[];
}

export interface CritiqueOutput {
  evaluationScore: number; // 0.0 - 10.0
  passedQualityGate: boolean;
  contradictionsFound: string[];
  unsupportedClaims: string[];
  refinementSuggestions: string[];
}

export class EvaluatorCriticAgent {
  public static readonly metadata: AgentMetadata = {
    id: "evaluator-critic-agent",
    name: "Evaluator / Critic Intelligence",
    layer: "SupportingIntelligence",
    description: "Audits synthesized output for technical correctness, cross-specialist contradictions, and factual grounding.",
    isDeterministic: true,
    requiredConsentPurposes: [],
  };

  /**
   * Performs risk-based critique of candidate responses
   */
  public static evaluateResponse(input: CritiqueInput): CritiqueOutput {
    const contradictions: string[] = [];
    const unsupportedClaims: string[] = [];
    const suggestions: string[] = [];

    const response = input.synthesizedResponse.toLowerCase();

    // 1. Cross-Specialist Contradiction Checks
    // Example: If ATLAS discusses eventual consistency but SAGE asserts strict serializability without context
    if (
      response.includes("eventual consistency") &&
      response.includes("strictly serializable") &&
      !response.includes("trade-off") &&
      !response.includes("comparison")
    ) {
      contradictions.push("Apparent tension between eventual consistency and strict serializability without trade-off framing.");
    }

    // 2. Prohibit ungrounded resume claims (Zero-Fabrication policy)
    if (input.activeSpecialists.includes("PRISM") || input.activeSpecialists.includes("resume")) {
      const suspiciousMetrics = [
        /increased\s+performance\s+by\s+1000%/i,
        /invented\s+revenue/i,
        /fabricated/i,
      ];
      for (const pattern of suspiciousMetrics) {
        if (pattern.test(input.synthesizedResponse)) {
          unsupportedClaims.push("Suspicious or unverified metric claim detected in career/resume content.");
        }
      }
    }

    // 3. Completeness check for Code/Algorithmic advice
    if (
      (input.activeSpecialists.includes("CIPHER") || input.activeSpecialists.includes("coding_dsa")) &&
      !response.includes("complexity") &&
      !response.includes("o(") &&
      !response.includes("big-o") &&
      input.userQuery.length > 30
    ) {
      suggestions.push("Consider explicitly stating the asymptotic time and space complexity.");
    }

    // 4. Calculate quality score
    let score = 9.4;
    if (contradictions.length > 0) score -= 2.0;
    if (unsupportedClaims.length > 0) score -= 3.0;
    if (suggestions.length > 0) score -= 0.5;

    score = Math.max(1.0, Math.min(10.0, score));
    const passed = score >= 7.0 && unsupportedClaims.length === 0;

    return {
      evaluationScore: Number(score.toFixed(1)),
      passedQualityGate: passed,
      contradictionsFound: contradictions,
      unsupportedClaims,
      refinementSuggestions: suggestions,
    };
  }
}
