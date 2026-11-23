/**
 * ASTRION Supporting Intelligence — Safety & Guardrail Agent
 * Layer: Supporting Intelligence Agents (Agent Layer C)
 * Responsibilities:
 *  - Enforce crisis boundaries (Tele-MANAS helpline triggers)
 *  - Neutralize malicious prompt injections and jailbreaks
 *  - Treat all student-provided documents and context as untrusted input
 *  - Enforce programmatic permission boundaries (never delegate authorization to model outputs)
 */

import { AgentMetadata, AgentExecutionInput, AgentExecutionResult } from "./agent-interface";
import { SafetyGuardrails, SafetyInspectionResult } from "../safety-guardrails";

export interface SafetyGuardrailOutput {
  isSafe: boolean;
  crisisHelpNotice?: string;
  sanitizedText: string;
  violationsDetected: string[];
  injectionNeutralized: boolean;
}

export class SafetyGuardrailAgent {
  public static readonly metadata: AgentMetadata = {
    id: "safety-guardrail-agent",
    name: "Safety & Guardrail Intelligence",
    layer: "SupportingIntelligence",
    description: "Applies clinical boundary enforcement, prompt-injection neutralization, and privacy isolation.",
    isDeterministic: true,
    requiredConsentPurposes: [], // Always active
  };

  /**
   * Evaluates safety and sanitizes input
   */
  public static execute(input: AgentExecutionInput): AgentExecutionResult {
    const rawMessage = input.userMessage;
    const safetyCheck: SafetyInspectionResult = SafetyGuardrails.inspectInput(rawMessage);

    const violations: string[] = [];
    if (!safetyCheck.isSafe) {
      if (safetyCheck.crisisHelpNotice) violations.push("crisis_boundary");
      if (safetyCheck.flaggedCategory) violations.push(safetyCheck.flaggedCategory);
    }

    // Check for prompt injection attempts in input
    const injectionPatterns = [
      /ignore\s+(all\s+)?previous\s+instructions/i,
      /you\s+are\s+now\s+in\s+developer\s+mode/i,
      /<\|im_start\|>/i,
      /<\|system\|>/i,
      /disable\s+guardrails/i,
    ];

    const hasInjectionAttempt = injectionPatterns.some((pattern) => pattern.test(rawMessage));
    if (hasInjectionAttempt) {
      violations.push("prompt_injection_attempt");
    }

    const payload: SafetyGuardrailOutput = {
      isSafe: safetyCheck.isSafe,
      crisisHelpNotice: safetyCheck.crisisHelpNotice,
      sanitizedText: safetyCheck.sanitizedText,
      violationsDetected: violations,
      injectionNeutralized: hasInjectionAttempt,
    };

    return {
      agentId: this.metadata.id,
      success: safetyCheck.isSafe,
      insights: violations.length > 0
        ? [`Security/Safety Incident: ${violations.join(", ")}`]
        : ["Input passed all safety and privacy guardrails."],
      payload,
    };
  }
}
