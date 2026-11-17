/**
 * Career Specialist Capability — Dr. Aarav Mehta Internal Module
 * Focus: Job description analysis, engineering level calibration, market compensation, placement strategy
 */

import {
  ISpecialistCapability,
  SpecialistExecutionInput,
  SpecialistExecutionOutput,
  TaskCategoryType,
} from "./specialist-interface";
import { FocusArea, SpecialistCapabilityInfo } from "../types";
import { CareerIntelligenceService } from "../career-intelligence";

export class CareerSpecialist implements ISpecialistCapability {
  public readonly id: FocusArea = "career";
  public readonly name = "Career & Job Market Specialist";
  public readonly badge = "Using Career Intelligence Expertise";
  public readonly domain = "Engineering Career Strategy & Level Calibration";
  public readonly description = "Analyzes real job descriptions, decodes compensation benchmarks, calibrates seniority levels (L3 to L6), and plans strategic placements.";

  public matchesIntent(message: string): boolean {
    const lower = message.toLowerCase();
    const keywords = [
      "career",
      "job",
      "salary",
      "compensation",
      "naukri",
      "market",
      "jd",
      "job description",
      "hiring",
      "sde1",
      "sde2",
      "seniority",
      "faang",
      "placement",
      "package",
      "ctc",
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
    return `### INTERNAL SPECIALIST ACTIVATION: Career Intelligence & Market Calibration
- Provide factual, data-driven career guidance grounded in verified tech hiring datasets (Naukri, levels.fyi, FAANG rubrics).
- Differentiate between Junior (L3/SDE-1: task execution, clean code, unit testing), Mid (L4/SDE-2: end-to-end features, system design, mentorship), and Senior (L5/Staff: architectural cross-cutting impact, ambiguity resolution).
- Map skills to real market demand and highlight salary/tier implications without making unverified promises.`;
  }

  public executeDeterministic(input: SpecialistExecutionInput): SpecialistExecutionOutput {
    const targetRole = input.studentContext.targetRole || "Software Development Engineer (SDE-1)";
    const roadmap = CareerIntelligenceService.generateDynamicRoadmap(targetRole);

    let responseText = `### 🗺️ Career Strategy & Market Calibration Intelligence\n\n`;
    responseText += `**Target Profile**: ${input.studentContext.displayName} $\\rightarrow$ **${roadmap.targetRole}**\n\n`;
    responseText += `#### **1. Market Demand & Hiring Landscape (2026)**\n`;
    responseText += `- **Core Stack**: Strong proficiency in DSA (Trees, Graphs, DP), Distributed Systems basics, SQL/NoSQL schema modeling.\n`;
    responseText += `- **Compensation Range**: Indian tier-1 product companies benchmark SDE-1 CTC at ₹16L–₹32L per annum (Base + Stock/Bonus).\n`;
    responseText += `- **Key Level Competencies**: At SDE-1, interviewers prioritize clean algorithmic invariants, edge-case coverage, and code readability over speculative architectural complexity.\n\n`;

    responseText += `#### **2. 24-Week Career Execution Milestones**\n`;
    roadmap.milestones.slice(0, 4).forEach((m) => {
      responseText += `##### **${m.week}: ${m.title}**\n`;
      responseText += `${m.description}\n`;
      responseText += `- **Core Competencies**: ${m.coreSkills.join(", ")}\n`;
      responseText += `- **Verified Deliverable**: *${m.deliverable}*\n\n`;
    });

    const voiceText = `Here is your career strategy roadmap tailored for ${targetRole}. Focus on algorithmic rigor and end-to-end fullstack deliverables.`;

    return {
      responseText,
      voiceText,
      recommendedActions: [
        { id: "act-career-milestone", title: `Complete milestone: ${roadmap.milestones[0]?.title}`, category: "Career", priority: "high" },
        { id: "act-career-jd", title: "Analyze real job posting against your current skill profile", category: "Market Prep", priority: "medium" },
      ],
      skillUpdates: [],
      postInteractionCheck: {
        question: "What distinguishes an SDE-2 expectation from an SDE-1 expectation in technical evaluations?",
        options: [
          "SDE-2 candidates are only tested on frontend technologies",
          "SDE-2 candidates must demonstrate autonomous system ownership, trade-off evaluation, and unguided feature execution",
          "SDE-1 candidates must solve NP-hard problems in linear time",
          "There is no difference in technical expectations",
        ],
        correctOptionIndex: 1,
        explanation: "SDE-1 focuses on guided implementation and algorithmic fundamentals; SDE-2 requires independent architectural ownership and operational trade-off balancing.",
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
        { id: "act-career-target", title: "Refine target tier-1 company wish-list", category: "Strategy", priority: "medium" },
        { id: "act-career-gap", title: "Address priority skill gaps identified in roadmap", category: "Learning", priority: "high" },
      ],
      skillUpdates: [],
    };
  }
}
