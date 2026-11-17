/**
 * Resume Specialist Capability — Dr. Aarav Mehta Internal Module
 * Focus: Resume analysis, Google XYZ bullet formula, zero-fabrication metrics, JD keyword alignment
 */

import {
  ISpecialistCapability,
  SpecialistExecutionInput,
  SpecialistExecutionOutput,
  TaskCategoryType,
} from "./specialist-interface";
import { FocusArea, SpecialistCapabilityInfo } from "../types";
import { CareerIntelligenceService } from "../career-intelligence";

export class ResumeSpecialist implements ISpecialistCapability {
  public readonly id: FocusArea = "resume";
  public readonly name = "Resume & Google XYZ Specialist";
  public readonly badge = "Using Resume Engineering Expertise";
  public readonly domain = "Resume Transformation & Factual Alignment";
  public readonly description = "Transforms vague bullet points into impact-driven Google XYZ formulas with a strict zero-fabrication policy.";

  public matchesIntent(message: string): boolean {
    const lower = message.toLowerCase();
    const keywords = [
      "resume",
      "cv",
      "bullet",
      "xyz formula",
      "ats",
      "rewrite",
      "profile review",
      "experience section",
      "bullet point",
    ];
    return keywords.some((kw) => lower.includes(kw));
  }

  public getTaskCategory(): TaskCategoryType {
    return "resume";
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
    return `### INTERNAL SPECIALIST ACTIVATION: Resume Engineering & Google XYZ Formula
- Formula: "Accomplished [X] as measured by [Y], by doing [Z]".
- ZERO-FABRICATION RULE: Never invent arbitrary metrics (e.g. "reduced latency by 47.3%"). If a student has not provided specific metrics, use bracketed placeholders like "[quantifiable metric, e.g., p99 latency by 35%]" and prompt them to confirm real production numbers.
- Align bullet points directly to core technical skills expected by tier-1 ATS systems.
- Highlight active verbs (Engineered, Architected, Refactored, Sharded, Deployed) over passive descriptions.`;
  }

  public executeDeterministic(input: SpecialistExecutionInput): SpecialistExecutionOutput {
    const analysis = CareerIntelligenceService.analyzeResumeAgainstJob(input.userMessage, "jd-google-sde1");

    let responseText = `### 📄 Resume & Google XYZ Formula Alignment Studio\n\n`;
    responseText += `**Target Role Match**: **${analysis.matchScorePct}%** match for **${analysis.jobTitle}** at **${analysis.company}**\n\n`;

    responseText += `#### ✅ **Demonstrated Must-Have Skills**:\n- ${analysis.matchingSkills.join(", ") || "General Programming Fundamentals"}\n\n`;

    if (analysis.missingSkills.length > 0) {
      responseText += `#### ⚠️ **Missing Core Competencies**:\n- ${analysis.missingSkills.join(", ")}\n\n`;
    }

    responseText += `#### 🚀 **Google XYZ Formula Rewrites (Zero-Fabrication Policy)**:\n`;
    analysis.googleXyzSuggestions.forEach((sugg, idx) => {
      responseText += `**Bullet ${idx + 1} Upgrade**:\n`;
      if (sugg.originalBullet) {
        responseText += `- *Before*: "${sugg.originalBullet}"\n`;
      }
      responseText += `- *After (Google XYZ)*: **"${sugg.improvedBullet}"**\n`;
      responseText += `- *Rationale*: ${sugg.rationale}\n\n`;
    });

    responseText += `#### ⚠️ **Factual Verification Notice**:\n`;
    responseText += `Please verify all bracketed performance metrics against your real git commits or production dashboards. Never submit fabricated percentages to recruiters.\n`;

    const voiceText = "I have aligned your experience with the Google XYZ formula: accomplished X, measured by Y, by doing Z. Notice how we avoid ungrounded metric claims.";

    return {
      responseText,
      voiceText,
      recommendedActions: [
        { id: "act-resume-verify", title: "Fill in verified metrics for bracketed placeholders", category: "Resume", priority: "high" },
        { id: "act-resume-pdf", title: "Format in single-column ATS-friendly LaTeX or Word template", category: "Formatting", priority: "medium" },
      ],
      skillUpdates: [],
      postInteractionCheck: {
        question: "In the Google XYZ formula ('Accomplished [X] as measured by [Y], by doing [Z]'), what does [Y] represent?",
        options: [
          "The company name where the project was conducted",
          "The quantifiable metric or measurement of success/impact",
          "The year the project was completed",
          "The programming language used",
        ],
        correctOptionIndex: 1,
        explanation: "[Y] represents the quantitative evidence of impact (e.g., latency reduction, throughput, user count, test coverage).",
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
        { id: "act-resume-ats", title: "Validate ATS keyword density for target role", category: "Resume", priority: "high" },
      ],
      skillUpdates: [],
    };
  }
}
