/**
 * Human Mentorship Escalation Engine
 * Bridges AI Learning to MentorMaze Verified Senior Human Mentors
 * Brand: MentorMaze by AI Tathastu
 */

import { EscalationRecommendation } from "./types";
import { store } from "@/lib/data/store";

export class HumanEscalationService {
  /**
   * Evaluates student conversation signals to determine if a human 1:1 session is recommended
   */
  public static evaluateEscalationNeed(
    studentMessage: string,
    weakSkillsCount: number = 0,
    consecutiveStruggles: number = 0
  ): EscalationRecommendation {
    const lower = studentMessage.toLowerCase();

    const explicitlyRequestsHuman =
      lower.includes("human mentor") ||
      lower.includes("real mentor") ||
      lower.includes("book a mentor") ||
      lower.includes("talk to a person") ||
      lower.includes("talk to an engineer");

    const highStakesNeed =
      lower.includes("interview tomorrow") ||
      lower.includes("final round") ||
      lower.includes("portfolio review") ||
      lower.includes("review my real project");

    const shouldEscalate = explicitlyRequestsHuman || highStakesNeed || consecutiveStruggles >= 3;

    if (!shouldEscalate) {
      return {
        shouldEscalate: false,
        recommendedMentors: [],
      };
    }

    // Resolve approved active mentors from MentorMaze database/store
    const allMentors = store.getMentors(true);

    // Select top 3 relevant mentors
    const recommendedMentors = allMentors.slice(0, 3).map((m) => {
      const headline = m.headline || "Senior Staff Engineer";
      const parts = headline.split("@");
      const role = parts[0]?.trim() || "Staff Software Engineer";
      const company = parts[1]?.trim() || "Google";

      return {
        mentorId: m.id,
        name: m.headline ? headline.split("-")[0].trim() : "Priya Sharma",
        role,
        company,
        hourlyRatePaise: m.price60MinInr ? m.price60MinInr * 100 : 49900,
        matchReason: `Verified expertise in ${m.skills?.slice(0, 2).join(" & ") || "SDE-1 Placements & System Design"}`,
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      };
    });

    return {
      shouldEscalate: true,
      reason: highStakesNeed
        ? "You are preparing for an imminent high-stakes technical milestone. A 1:1 session with a FAANG Staff Engineer will provide personalized rubric grading and architectural battle-testing."
        : "You have spent significant effort on this concept. Connecting with a human mentor will unlock targeted breakthroughs through live pair programming.",
      targetDomain: "System Design & Placement Pair Coding",
      recommendedMentors,
      suggestedAgenda: [
        "Review current algorithmic code implementation and time complexity bounds",
        "Perform live 30-minute mock technical interview with verbal feedback",
        "Align 6-month placement roadmap with verified referral strategies",
      ],
    };
  }

  /**
   * Generates a student-consented session brief for the human mentor
   */
  public static generateConsentBrief(
    studentName: string,
    topic: string,
    unresolvedQuestions: string[],
    suggestedAgenda: string[]
  ): string {
    return `### 📋 Student-Consented Mentorship Session Brief
- **Student**: ${studentName}
- **Session Focus**: ${topic}
- **Unresolved Challenge**: ${unresolvedQuestions.join("; ") || "Algorithmic optimization and edge case validation"}
- **Proposed Agenda**:
${suggestedAgenda.map((a, i) => `  ${i + 1}. ${a}`).join("\n")}
- **Privacy Notice**: Consented learning summary only. Raw AI chat logs are strictly private and not shared.`;
  }
}
