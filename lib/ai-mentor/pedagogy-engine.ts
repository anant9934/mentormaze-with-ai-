/**
 * Adaptive Pedagogical Decision Engine
 * Orchestrates 8 Teaching Modes and Strategies A through H with Deep Socratic Intelligence
 * Brand: MentorMaze by AI Tathastu
 */

import { TeachingMode, TeachingStrategy, LanguageCode, StudentProfileContext } from "./types";

export interface PedagogyDecision {
  strategy: TeachingStrategy;
  mode: TeachingMode;
  targetDepth: "beginner" | "intermediate" | "advanced";
  hintLevel: number;
  detectedMisconception?: string;
  pedagogicalPromptDirective: string;
  languageInstruction: string;
}

export class PedagogyEngine {
  /**
   * Determine the most effective pedagogical strategy for the student's current turn
   */
  public static decide(
    studentMessage: string,
    mode: TeachingMode,
    context: StudentProfileContext,
    currentHintLevel: number = 0,
    requestedLanguage: LanguageCode = "en"
  ): PedagogyDecision {
    const lower = studentMessage.toLowerCase().trim();

    // 1. Check for explicit student preferences / commands
    if (lower.includes("explain directly") || lower.includes("tell me directly") || lower.includes("just answer")) {
      return {
        strategy: "conceptual_explanation",
        mode,
        targetDepth: "intermediate",
        hintLevel: 0,
        pedagogicalPromptDirective: "The student explicitly requested a direct explanation. Provide a clean, comprehensive, step-by-step technical explanation without withholding answers.",
        languageInstruction: this.getLanguageDirective(requestedLanguage),
      };
    }

    if (lower.includes("give me the full solution") || lower.includes("show me the solution") || lower.includes("show full code")) {
      return {
        strategy: "worked_example",
        mode,
        targetDepth: "intermediate",
        hintLevel: 3,
        pedagogicalPromptDirective: "Provide a complete, production-grade worked example with syntax-highlighted code, asymptotic complexity analysis, and edge-case validation.",
        languageInstruction: this.getLanguageDirective(requestedLanguage),
      };
    }

    if (lower.includes("only give hints") || lower.includes("hint please") || lower.includes("give me a hint")) {
      const nextHint = Math.min(3, currentHintLevel + 1);
      return {
        strategy: "progressive_hints",
        mode,
        targetDepth: "intermediate",
        hintLevel: nextHint,
        pedagogicalPromptDirective: `Provide Progressive Hint #${nextHint} of 3. Do NOT reveal the full solution yet. Guide their thinking toward the next atomic realization.`,
        languageInstruction: this.getLanguageDirective(requestedLanguage),
      };
    }

    if (lower.includes("quiz me") || lower.includes("test my knowledge") || lower.includes("ask me a question")) {
      return {
        strategy: "retrieval_practice",
        mode,
        targetDepth: "intermediate",
        hintLevel: 0,
        pedagogicalPromptDirective: "Present a targeted retrieval practice question assessing core understanding. Wait for the student's answer before offering evaluation.",
        languageInstruction: this.getLanguageDirective(requestedLanguage),
      };
    }

    // 2. Mode-driven defaults
    switch (mode) {
      case "code_mentor":
        // Detect bug fix or review
        if (lower.includes("bug") || lower.includes("error") || lower.includes("fix") || lower.includes("fails")) {
          return {
            strategy: "misconception_correction",
            mode,
            targetDepth: "intermediate",
            hintLevel: 0,
            pedagogicalPromptDirective: "Execute the 8-step debugging process: Understand problem -> Inspect code -> Spot defect root cause -> Explain underlying mechanics -> Suggest minimal fix -> Explain why it works -> Recommend test cases.",
            languageInstruction: this.getLanguageDirective(requestedLanguage),
          };
        }
        return {
          strategy: "guided_problem_solving",
          mode,
          targetDepth: "intermediate",
          hintLevel: 0,
          pedagogicalPromptDirective: "Act as an elite Staff Engineer reviewing code. Highlight algorithmic time/space complexities, maintainability, and hidden O(N) operations inside loops.",
          languageInstruction: this.getLanguageDirective(requestedLanguage),
        };

      case "practice":
        return {
          strategy: "socratic_guidance",
          mode,
          targetDepth: "intermediate",
          hintLevel: 1,
          pedagogicalPromptDirective: "Practice Mode: Guide the student through discovery. Ask clarifying questions on constraints, invariants, and edge cases before letting them write code.",
          languageInstruction: this.getLanguageDirective(requestedLanguage),
        };

      case "interview_coach":
        return {
          strategy: "socratic_guidance",
          mode,
          targetDepth: "advanced",
          hintLevel: 0,
          pedagogicalPromptDirective: "Conduct a realistic technical or behavioral mock interview. Ask ONE question at a time. If technical, probe complexity and edge cases. If behavioral, enforce the STAR framework.",
          languageInstruction: this.getLanguageDirective(requestedLanguage),
        };

      case "resume_mentor":
        return {
          strategy: "worked_example",
          mode,
          targetDepth: "intermediate",
          hintLevel: 0,
          pedagogicalPromptDirective: "Transform passive resume bullet points using the Google XYZ formula: 'Accomplished [X], as measured by [Y], by doing [Z]'. Highlight quantifiable metrics and production tech stacks.",
          languageInstruction: this.getLanguageDirective(requestedLanguage),
        };

      case "career_mentor":
        return {
          strategy: "conceptual_explanation",
          mode,
          targetDepth: "intermediate",
          hintLevel: 0,
          pedagogicalPromptDirective: "Provide strategic career architecture guidance. Map target roles to high-leverage skill milestones, portfolio project architectures, and referral strategies.",
          languageInstruction: this.getLanguageDirective(requestedLanguage),
        };

      case "project_mentor":
        return {
          strategy: "guided_problem_solving",
          mode,
          targetDepth: "intermediate",
          hintLevel: 0,
          pedagogicalPromptDirective: "Guide the student through real-world software architecture: schema modeling, caching topologies, API contracts, and deployment boundaries.",
          languageInstruction: this.getLanguageDirective(requestedLanguage),
        };

      case "study_planner":
        return {
          strategy: "conceptual_explanation",
          mode,
          targetDepth: "intermediate",
          hintLevel: 0,
          pedagogicalPromptDirective: "Build a realistic, weekly milestone study plan tailored to the student's graduation year and target role. Emphasize consistent daily compounding.",
          languageInstruction: this.getLanguageDirective(requestedLanguage),
        };

      case "learn":
      default:
        // Follow the 8-stage pedagogical quality sequence
        return {
          strategy: "conceptual_explanation",
          mode: "learn",
          targetDepth: "intermediate",
          hintLevel: 0,
          pedagogicalPromptDirective: `Apply the 8-Stage Pedagogical Sequence:
1. Intuition (Why does this matter?)
2. Real-life Analogy
3. Formal Concept definition
4. Step-by-Step Reasoning
5. Concrete Code / Architectural Example
6. Non-obvious Edge Cases
7. Active Practice Challenge
8. Quick Understanding Check.`,
          languageInstruction: this.getLanguageDirective(requestedLanguage),
        };
    }
  }

  private static getLanguageDirective(lang: LanguageCode): string {
    switch (lang) {
      case "hi":
        return "Language instruction: Respond primarily in clean Hindi (Devanagari script), preserving standard technical terms in English (e.g. 'Binary Search Tree', 'Cache Invalidation').";
      case "hinglish":
        return "Language instruction: Respond in natural, conversational Hinglish (Roman script Hindi mixed with English), popular among Indian engineering students (e.g. 'Sabse pehle hum edge case check karenge...').";
      case "en":
      default:
        return "Language instruction: Respond in clear, professional English.";
    }
  }
}
