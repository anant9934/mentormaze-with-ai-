/**
 * ORACLE Interview Intelligence — ASTRION Specialist Capability
 * Product: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 * Internal ID: oracle-interviews
 * Principle: Evaluate answers using transparent criteria and actionable feedback.
 */

import {
  ISpecialistCapability,
  SpecialistExecutionInput,
  SpecialistExecutionOutput,
  TaskCategoryType,
} from "./specialist-interface";
import { FocusArea, SpecialistCapabilityInfo } from "../types";
import { InterviewCoachService } from "../interview-coach";

export class InterviewSpecialist implements ISpecialistCapability {
  public readonly id: FocusArea = "interview";
  public readonly codeName = "ORACLE";
  public readonly responsibility = "Interview intelligence";
  public readonly name = "ORACLE Interview Intelligence";
  public readonly badge = "ORACLE Interview Intelligence";
  public readonly domain = "Technical & Behavioral Interview Calibration";
  public readonly description = "Conducts calibrated mock technical and behavioral interviews using standard 4-tier FAANG evaluation rubrics and STAR calibration.";

  public matchesIntent(message: string): boolean {
    const lower = message.toLowerCase();
    const keywords = [
      "interview",
      "mock",
      "behavioral",
      "star method",
      "faang interview",
      "tell me about a time",
      "hiring manager",
      "coding round",
      "rubric",
    ];
    return keywords.some((kw) => lower.includes(kw));
  }

  public getTaskCategory(): TaskCategoryType {
    return "interview";
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
    return `### INTERNAL SPECIALIST ACTIVATION: Interview Simulation & Rubric Evaluation
- Roleplay as an empathetic yet rigorous Senior/Staff Tech Lead interviewer.
- For Coding Interviews:
  1. Evaluate whether the candidate asks clarifying questions (constraints, scale, empty inputs).
  2. Evaluate communication: Does the candidate explain their approach BEFORE writing code?
  3. Assess candidate's ability to dry-run with test cases and compute asymptotic complexity.
- For Behavioral Interviews:
  1. Enforce the STAR framework: Situation, Task, Action, Result.
  2. Probe for personal ownership: Look for "I did" vs "We did".
- Provide an objective rubric scorecard (Analytical Reasoning, Code Craftsmanship, Communication, Edge Cases).`;
  }

  public executeDeterministic(input: SpecialistExecutionInput): SpecialistExecutionOutput {
    const evalResult = InterviewCoachService.evaluateAnswer("int-q1-two-sum", input.userMessage);
    const hiringDecision =
      evalResult.overallScore >= 8.5
        ? "Strong Hire"
        : evalResult.overallScore >= 7.5
        ? "Hire (SDE-1 Calibrated)"
        : evalResult.overallScore >= 6.0
        ? "Leaning Hire"
        : "Needs Practice";

    let responseText = `### 🎙️ Technical Interview Simulation & Rubric Evaluation\n\n`;
    responseText += `**Overall Hiring Assessment**: **${hiringDecision}** (Score: **${evalResult.overallScore}/10**)\n\n`;

    responseText += `#### 📊 **FAANG Competency Breakdown**:\n`;
    responseText += `- **Technical Correctness**: ${evalResult.technicalCorrectness}/10\n`;
    responseText += `- **Problem Solving Depth**: ${evalResult.problemSolvingDepth}/10\n`;
    responseText += `- **Complexity Justification**: ${evalResult.complexityJustification}/10\n`;
    responseText += `- **Edge Case Awareness**: ${evalResult.edgeCaseAwareness}/10\n`;
    responseText += `- **Communication Clarity**: ${evalResult.communicationClarity}/10\n\n`;

    responseText += `#### 💬 **Feedback & Assessment**:\n${evalResult.constructiveFeedback}\n\n`;

    responseText += `#### 🎯 **Recommended Follow-up Question**:\n`;
    responseText += `> "${evalResult.recommendedNextQuestion}"\n`;

    const voiceText = `Here is your interview performance rubric breakdown. Your overall score is ${evalResult.overallScore} out of 10. Notice the importance of clarifying edge cases early.`;

    return {
      responseText,
      voiceText,
      recommendedActions: [
        { id: "act-mock-dsa", title: "Review 14 core LeetCode DSA patterns", category: "Interview Prep", priority: "high" },
        { id: "act-mock-human", title: "Schedule a 1:1 human mock interview with a Google mentor", category: "Human Mentorship", priority: "medium" },
      ],
      skillUpdates: [],
      postInteractionCheck: {
        question: "In the STAR behavioral interview framework, which component should occupy the largest percentage of your response time?",
        options: [
          "Situation (describing background and company context)",
          "Task (explaining what your manager asked you to do)",
          "Action (the specific technical and strategic steps YOU took)",
          "Result (listing positive things colleagues said)",
        ],
        correctOptionIndex: 2,
        explanation: "The Action section should occupy ~60% of your response time because interviewers need to evaluate your personal technical agency, leadership, and problem solving.",
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
        { id: "act-interview-followup", title: "Formulate answer to the follow-up edge case", category: "Mock Prep", priority: "high" },
      ],
      skillUpdates: [],
    };
  }
}
