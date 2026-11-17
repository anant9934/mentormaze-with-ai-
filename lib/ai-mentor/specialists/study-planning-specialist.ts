/**
 * Study Planning Specialist Capability — Dr. Aarav Mehta Internal Module
 * Focus: 24-week milestone schedules, spaced retrieval, adaptive pacing, placement readiness
 */

import {
  ISpecialistCapability,
  SpecialistExecutionInput,
  SpecialistExecutionOutput,
  TaskCategoryType,
} from "./specialist-interface";
import { FocusArea, SpecialistCapabilityInfo } from "../types";
import { CareerIntelligenceService } from "../career-intelligence";

export class StudyPlanningSpecialist implements ISpecialistCapability {
  public readonly id: FocusArea = "study_planning";
  public readonly name = "Study Planning & Roadmap Specialist";
  public readonly badge = "Using Study Architecture Expertise";
  public readonly domain = "Spaced Repetition & Placement Milestone Planning";
  public readonly description = "Structures structured, week-by-week study calendars with spaced retrieval schedules, weak-skill remediation, and deliverables.";

  public matchesIntent(message: string): boolean {
    const lower = message.toLowerCase();
    const keywords = [
      "roadmap",
      "study plan",
      "schedule",
      "routine",
      "plan",
      "timeline",
      "calendar",
      "weeks",
      "preparation plan",
      "how to prepare",
    ];
    return keywords.some((kw) => lower.includes(kw));
  }

  public getTaskCategory(): TaskCategoryType {
    return "reasoning";
  }

  public getMetadata(): SpecialistCapabilityInfo {
    return {
      id: this.id,
      name: this.name,
      badge: this.badge,
      domain: this.domain,
      description: this.description,
    };
  }

  public getSystemPromptEnrichment(input: SpecialistExecutionInput): string {
    return `### INTERNAL SPECIALIST ACTIVATION: Personalized Study Architecture
- Build structured, realistic weekly milestones combining:
  1. 60% Active Problem Solving & Algorithmic Patterns (LeetCode 75 / Blind 75).
  2. 25% Core CS & Distributed Systems (OS, DBMS, Networks, System Design).
  3. 15% Project Engineering & Code Reviews.
- Incorporate Spaced Repetition (Days 1, 3, 7, 21) for previously missed topics.
- Prioritize known weak skills: ${input.studentContext.weakSkills.join(", ") || "Dynamic Programming, Raft Consensus"}.`;
  }

  public executeDeterministic(input: SpecialistExecutionInput): SpecialistExecutionOutput {
    const targetRole = input.studentContext.targetRole || "Software Development Engineer (SDE-1)";
    const roadmap = CareerIntelligenceService.generateDynamicRoadmap(targetRole);

    let responseText = `### 📅 Personalized 24-Week Study Architecture & Milestone Plan\n\n`;
    responseText += `**Student**: ${input.studentContext.displayName} | **Goal**: **${targetRole}**\n\n`;
    responseText += `**Active Skill Remediation**: Focusing on **${input.studentContext.weakSkills.slice(0, 2).join(" & ") || "Dynamic Programming & Distributed Systems"}**\n\n`;

    roadmap.milestones.forEach((m) => {
      responseText += `#### **${m.week}: ${m.title}**\n`;
      responseText += `${m.description}\n`;
      responseText += `- **Core Focus**: ${m.coreSkills.join(", ")}\n`;
      responseText += `- **Verified Milestone Deliverable**: *${m.deliverable}*\n\n`;
    });

    responseText += `#### 💡 **Spaced Repetition Protocol**:\n`;
    responseText += `- Review Day 1 mistakes on Day 3.\n`;
    responseText += `- Retest core algorithmic invariants on Day 7.\n`;
    responseText += `- Re-solve hardest tagged problem on Day 21.\n`;

    const voiceText = "Here is your 24-week engineering study plan. We balance DSA with system design and concrete deliverables.";

    return {
      responseText,
      voiceText,
      recommendedActions: [
        { id: "act-week1-dsa", title: `Complete Week 1: ${roadmap.milestones[0]?.title}`, category: "Roadmap", priority: "high" },
        { id: "act-proj-portfolio", title: `Build portfolio milestone: ${input.studentContext.activeProjects[0]?.title || "Distributed System"}`, category: "Project", priority: "medium" },
      ],
      skillUpdates: [],
      postInteractionCheck: {
        question: "Why is spaced retrieval practice (retesting on Days 1, 3, 7, and 21) significantly more effective than massed cramming for coding interviews?",
        options: [
          "It takes less total time than studying once",
          "Interrupted recall forces the brain to strengthen neural retrieval pathways and identify fragile mental models",
          "Recruiters check your daily GitHub commits for spaced intervals",
          "It prevents computer eye-strain",
        ],
        correctOptionIndex: 1,
        explanation: "Cognitive science shows that spaced retrieval induces desirable difficulty, strengthening long-term memory consolidation and preventing memory decay.",
      },
      systemPromptEnrichment: this.getSystemPromptEnrichment(input),
      taskCategory: this.getTaskCategory(),
    };
  }

  public postProcessGenerative(
    content: string,
    input: SpecialistExecutionInput
  ): Partial<SpecialistExecutionOutput> {
    return {
      recommendedActions: [
        { id: "act-plan-start", title: "Commit to Week 1 milestone schedule", category: "Planning", priority: "high" },
      ],
      skillUpdates: [],
    };
  }
}
