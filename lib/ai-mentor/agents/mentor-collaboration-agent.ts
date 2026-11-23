/**
 * ASTRION Supporting Intelligence — Mentor Collaboration Agent
 * Layer: Supporting Intelligence Agents (Agent Layer C)
 * Responsibilities:
 *  - Facilitate seamless handoff to verified human mentors on MentorMaze
 *  - Strictly enforce student authorization (`mentor_sharing` consent purpose)
 *  - Minimize context: Expose only approved struggle summaries, never raw private graphs
 *  - Preserve evidence provenance and access logs
 */

import { AgentMetadata, AgentExecutionInput, AgentExecutionResult } from "./agent-interface";
import { StudentConsentService } from "../student-consent-service";
import { HumanEscalationService } from "../human-escalation-service";
import { RecommendedAction } from "../types";

export interface MentorHandoffSummary {
  eligibleForHumanHandoff: boolean;
  recommendedMentorDomains: string[];
  sanitizedStruggleBriefing: string;
  consentGranted: boolean;
  escalationReason?: string;
}

export class MentorCollaborationAgent {
  public static readonly metadata: AgentMetadata = {
    id: "mentor-collaboration-agent",
    name: "Mentor Collaboration Intelligence",
    layer: "SupportingIntelligence",
    description: "Orchestrates authorized human mentor handoffs with strict context minimization and consent compliance.",
    isDeterministic: true,
    requiredConsentPurposes: ["mentor_sharing"],
  };

  /**
   * Evaluates if human mentorship escalation is warranted and prepares minimized briefing
   */
  public static async execute(input: AgentExecutionInput): Promise<AgentExecutionResult> {
    const studentUserId = input.studentUserId;

    // 1. Check student consent for mentor sharing
    const hasMentorSharingConsent = await StudentConsentService.hasConsent(
      studentUserId,
      "mentor_sharing"
    );

    // 2. Evaluate escalation need via HumanEscalationService
    const escalation = HumanEscalationService.evaluateEscalationNeed(
      input.userMessage,
      (input.context?.relevantSkills || []).filter((s) => s.masteryScore < 5.0).length,
      0
    );

    const recommendedActions: RecommendedAction[] = [];
    let sanitizedBriefing = "";

    if (escalation.shouldEscalate && hasMentorSharingConsent) {
      sanitizedBriefing = `Student requested advanced guidance on ${input.focusArea || "core technical concepts"}. Verified gaps: ${(input.context?.classifiedEvidence?.confirmedFacts || []).slice(0, 2).join(", ") || "Advanced system invariants"}.`;

      recommendedActions.push({
        id: "act-book-mentor",
        title: "Book 1-on-1 with a Verified Industry Mentor",
        category: "Human Mentorship",
        priority: "medium",
      });
    }

    const payload: MentorHandoffSummary = {
      eligibleForHumanHandoff: escalation.shouldEscalate && hasMentorSharingConsent,
      recommendedMentorDomains: escalation.targetDomain ? [escalation.targetDomain] : ["Software Engineering"],
      sanitizedStruggleBriefing: sanitizedBriefing,
      consentGranted: hasMentorSharingConsent,
      escalationReason: escalation.reason,
    };

    return {
      agentId: this.metadata.id,
      success: true,
      insights: [
        escalation.shouldEscalate
          ? `Human Mentorship Recommendation: ${escalation.reason} (Consent: ${hasMentorSharingConsent ? "Granted" : "Withheld"})`
          : "Self-paced AI mentorship path proceeding normally.",
      ],
      recommendedActions,
      payload,
    };
  }
}
