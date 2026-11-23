/**
 * ASTRION Student Intelligence — Accountability & Check-In Agent
 * Layer: Student Intelligence Agents (Agent Layer B)
 * Responsibilities:
 *  - Track student-approved milestones and commitments
 *  - Generate reminders ONLY when student has explicitly enabled the feature
 *  - Solicit constructive progress check-ins
 *  - Enforce respectful tone: Avoid guilt-tripping, manipulative streaks, or shaming
 */

import { AgentMetadata, AgentExecutionInput, AgentExecutionResult } from "./agent-interface";
import { StudentConsentService } from "../student-consent-service";
import { RecommendedAction } from "../types";

export interface AccountabilityCheckInItem {
  id: string;
  milestoneTitle: string;
  checkInPrompt: string;
  scheduledTime: string;
  isEnabled: boolean;
  status: "pending_student_response" | "completed" | "skipped";
}

export interface AccountabilityOutput {
  remindersEnabled: boolean;
  activeCheckIns: AccountabilityCheckInItem[];
  accountabilityTone: "constructive_supportive";
}

export class AccountabilityAgent {
  public static readonly metadata: AgentMetadata = {
    id: "accountability-agent",
    name: "Accountability & Check-In Intelligence",
    layer: "StudentIntelligence",
    description: "Supports consistent habit formation via student-approved, non-manipulative progress check-ins.",
    isDeterministic: true,
    requiredConsentPurposes: ["service_personalization"],
  };

  /**
   * Generates or inspects accountability check-ins
   */
  public static async execute(input: AgentExecutionInput): Promise<AgentExecutionResult> {
    const studentUserId = input.studentUserId;

    // 1. Verify student consent
    const hasConsent = await StudentConsentService.hasConsent(
      studentUserId,
      "service_personalization"
    );

    // If student has not enabled personalization/notifications, do not emit pushy reminders
    if (!hasConsent) {
      return {
        agentId: this.metadata.id,
        success: true,
        insights: ["Reminders disabled in accordance with student privacy settings."],
        payload: {
          remindersEnabled: false,
          activeCheckIns: [],
          accountabilityTone: "constructive_supportive",
        },
      };
    }

    const currentMilestones = input.context.activeMilestones || [];
    const checkIns: AccountabilityCheckInItem[] = [];

    if (currentMilestones.length > 0) {
      const active = currentMilestones[0];
      checkIns.push({
        id: `chk-${Date.now()}-1`,
        milestoneTitle: active.title,
        checkInPrompt: `How did your focus session go on '${active.title}'? Share any concept invariants you'd like to verify together.`,
        scheduledTime: "Flexible / Student-initiated",
        isEnabled: true,
        status: "pending_student_response",
      });
    }

    const recommendedActions: RecommendedAction[] = [];
    if (checkIns.length > 0) {
      recommendedActions.push({
        id: "act-log-progress",
        title: "Log Milestone Progress",
        category: "Accountability",
        priority: "low",
      });
    }

    const payload: AccountabilityOutput = {
      remindersEnabled: true,
      activeCheckIns: checkIns,
      accountabilityTone: "constructive_supportive",
    };

    return {
      agentId: this.metadata.id,
      success: true,
      insights: [
        checkIns.length > 0
          ? `Check-in scheduled: ${checkIns[0].milestoneTitle} (Constructive & non-intrusive).`
          : "No pending check-ins.",
      ],
      recommendedActions,
      payload,
    };
  }
}
