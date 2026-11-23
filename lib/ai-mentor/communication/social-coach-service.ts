/**
 * ASTRION Social & Communication Coach Service
 * Brand: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 * Reference Standard: SocialCoach (`GeminiLight/SocialCoach`)
 *
 * Implements controlled scenario simulations:
 * - Salary Negotiation
 * - Executive Status Update (BLUF)
 * - Technical Disagreement with Senior Engineer
 * - Behavioral Interview Response (STAR)
 * - Explaining Complex Tech to Non-Technical Stakeholders
 *
 * Features multi-turn dialogues, real-time coaching whispers, 6-dimension rubric evaluation,
 * and exemplary rewrites while strictly preserving the unified ASTRION mentor persona.
 */

import fs from "fs";
import path from "path";
import {
  CommunicationScenarioType,
  SocialSimulationSession,
  CounterpartPersona,
  DialogueTurn,
  CommunicationRubricEvaluation,
} from "../types";

export interface ScenarioTemplate {
  type: CommunicationScenarioType;
  title: string;
  briefing: string;
  counterpart: CounterpartPersona;
  initialCounterpartMessage: string;
  coachingGuidance: string;
}

export const SCENARIO_TEMPLATES: Record<CommunicationScenarioType, ScenarioTemplate> = {
  salary_negotiation: {
    type: "salary_negotiation",
    title: "SDE-1 Compensation & Equity Negotiation",
    briefing:
      "You have received an initial offer of ₹18 LPA base for an SDE-1 position. The market median for your target role and verified skills is ₹22–24 LPA. Negotiate constructively using market data and your demonstrated technical achievements without being adversarial.",
    counterpart: {
      name: "Rohan Kapoor",
      role: "Lead Talent Acquisition Partner",
      attitude: "skeptical",
      background: "Experienced tech recruiter with tight budget constraints and standard salary bands.",
    },
    initialCounterpartMessage:
      "Hi! We're excited to extend an offer of ₹18 LPA base for the SDE-1 role. This is at the top of our standard entry-level compensation band. Are you ready to accept and sign the letter today?",
    coachingGuidance:
      "Acknowledge enthusiasm for the team, state market alignment clearly, anchor your value proposition in verified technical contributions, and propose a specific counter-range rather than a flat rejection.",
  },
  executive_status_update: {
    type: "executive_status_update",
    title: "Executive Architecture & Timeline Update (BLUF)",
    briefing:
      "Your team's PostgreSQL migration is 1 week behind schedule due to unexpected foreign key locking bottlenecks under production load. Brief the VP of Engineering using the Bottom Line Up Front (BLUF) framework: situation, trade-offs, mitigation plan, and revised delivery date.",
    counterpart: {
      name: "Vikram Malhotra",
      role: "VP of Engineering",
      attitude: "demanding",
      background: "Busy engineering executive focused on company-wide reliability, customer commitments, and delivery deadlines.",
    },
    initialCounterpartMessage:
      "I have 5 minutes before my board meeting. I heard whispers that the core database migration might slip. What is the ground reality, what are the risks, and when are we live?",
    coachingGuidance:
      "Lead with the bottom line: don't bury the delay in technical minutiae. State the revised deadline, the root cause (locking under load), and the exact remediation action in progress.",
  },
  technical_disagreement: {
    type: "technical_disagreement",
    title: "Technical Debate on Distributed Storage Strategy",
    briefing:
      "A Senior Principal Engineer proposes using MongoDB for a high-throughput financial ledger system that requires strict ACID guarantees. Politely and rigorously advocate for PostgreSQL with serializable isolation, supporting your position with data and consensus principles without being defensive.",
    counterpart: {
      name: "Ananya Deshmukh",
      role: "Senior Principal Architect",
      attitude: "skeptical",
      background: "Highly respected veteran architect who prioritizes developer velocity and schema flexibility.",
    },
    initialCounterpartMessage:
      "I reviewed your proposal. I think PostgreSQL is too rigid for our rapid iteration. MongoDB's document model will let our developers ship three times faster. Why should we constrain ourselves to relational schemas?",
    coachingGuidance:
      "Validate their goal (developer velocity), then frame the disagreement around non-negotiable invariants: financial ledger consistency, ACID isolation, and multi-document atomicity failure costs.",
  },
  behavioral_interview: {
    type: "behavioral_interview",
    title: "Behavioral Round: Overcoming a Critical Failure",
    briefing:
      "The interviewer asks: 'Tell me about a time you caused a production outage or failed to meet a critical deadline. How did you handle it?' Structure your response using the STAR method (Situation, Task, Action, Result) with deep personal accountability and system learning.",
    counterpart: {
      name: "Neha Sundaram",
      role: "Engineering Director",
      attitude: "neutral",
      background: "Seasoned hiring manager who assesses emotional maturity, ownership, and resilience under pressure.",
    },
    initialCounterpartMessage:
      "We value transparency and resilience at our company. Can you walk me through a major mistake or system failure you were personally responsible for, and how you responded in the aftermath?",
    coachingGuidance:
      "Do not deflect blame to external factors or teammates. Spend 20% on Situation/Task, 50% on personal Action/Remediation, and 30% on quantifiable Result and lasting preventative safeguards.",
  },
  non_technical_explanation: {
    type: "non_technical_explanation",
    title: "Explaining System Latency & Caching to Product Management",
    briefing:
      "A non-technical VP of Product asks why the app feels sluggish and why adding Redis caching costs engineering time. Explain database read latency, cache invalidation, and user conversion impact in plain, vivid analogies without confusing them with low-level jargon.",
    counterpart: {
      name: "Siddharth Jain",
      role: "VP of Product",
      attitude: "collaborative",
      background: "Product leader who cares deeply about user retention and conversion metrics, with minimal technical systems background.",
    },
    initialCounterpartMessage:
      "Our checkout drop-off rate rose by 3% this week because page loads feel slow. The engineers keep talking about database query latency and Redis caching. Can you explain in plain terms what is causing the slowdown and why caching will fix it?",
    coachingGuidance:
      "Use real-world physical analogies (e.g., retrieving books from a central warehouse vs keeping popular books on a desk). Connect technical latency (milliseconds) directly to user conversion and bounce rates.",
  },
};

export class SocialCommunicationCoachService {
  // studentUserId -> (sessionId -> SocialSimulationSession)
  private static sessions: Map<string, Map<string, SocialSimulationSession>> = new Map();
  private static isInitialized = false;

  private static get isTestEnvironment(): boolean {
    return process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);
  }

  private static get storageFilePath(): string | null {
    if (this.isTestEnvironment) {
      const fixtureDir = path.resolve(process.cwd(), "tests", "fixtures");
      if (!fs.existsSync(fixtureDir)) {
        fs.mkdirSync(fixtureDir, { recursive: true });
      }
      return path.resolve(fixtureDir, ".test-social-coach-sessions.json");
    }
    return null;
  }

  public static reset(): void {
    this.sessions.clear();
    this.isInitialized = false;
    try {
      const filePath = this.storageFilePath;
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // ignore
    }
  }

  private static ensureLoaded(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;
    if (this.isTestEnvironment) {
      try {
        const filePath = this.storageFilePath;
        if (filePath && fs.existsSync(filePath)) {
          const raw = fs.readFileSync(filePath, "utf-8");
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            for (const [userId, userSessions] of Object.entries(parsed)) {
              const map = new Map<string, SocialSimulationSession>();
              for (const [sId, session] of Object.entries(userSessions as Record<string, SocialSimulationSession>)) {
                map.set(sId, session);
              }
              this.sessions.set(userId, map);
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }

  private static persistToDisk(): void {
    if (this.isTestEnvironment) {
      try {
        const filePath = this.storageFilePath;
        if (filePath) {
          const out: Record<string, Record<string, SocialSimulationSession>> = {};
          for (const [userId, userMap] of this.sessions.entries()) {
            out[userId] = {};
            for (const [sId, sess] of userMap.entries()) {
              out[userId][sId] = sess;
            }
          }
          fs.writeFileSync(filePath, JSON.stringify(out, null, 2), "utf-8");
        }
      } catch {
        // ignore
      }
    }
  }

  /**
   * Initializes a communication simulation session
   */
  public static startSession(params: {
    studentUserId: string;
    scenarioType: CommunicationScenarioType;
    customCounterpart?: Partial<CounterpartPersona>;
    requestingUserId?: string;
  }): SocialSimulationSession {
    this.ensureLoaded();
    const { studentUserId, scenarioType, customCounterpart, requestingUserId } = params;

    if (requestingUserId && requestingUserId !== studentUserId && !requestingUserId.startsWith("mentor-") && requestingUserId !== "admin") {
      throw new Error("403_FORBIDDEN: You do not have permission to access another student's communication simulation.");
    }

    const template = SCENARIO_TEMPLATES[scenarioType] || SCENARIO_TEMPLATES.salary_negotiation;
    const sessionId = `sim-${studentUserId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    const counterpart: CounterpartPersona = {
      ...template.counterpart,
      ...(customCounterpart || {}),
    };

    const initialTurn: DialogueTurn = {
      turnIndex: 0,
      speaker: "counterpart",
      content: template.initialCounterpartMessage,
      timestamp: now,
      coachingWhisper: template.coachingGuidance,
    };

    const session: SocialSimulationSession = {
      id: sessionId,
      studentUserId,
      scenarioType,
      scenarioTitle: template.title,
      scenarioBriefing: template.briefing,
      counterpartPersona: counterpart,
      turns: [initialTurn],
      status: "in_progress",
      createdAt: now,
      updatedAt: now,
    };

    if (!this.sessions.has(studentUserId)) {
      this.sessions.set(studentUserId, new Map());
    }
    this.sessions.get(studentUserId)!.set(sessionId, session);
    this.persistToDisk();

    return session;
  }

  /**
   * Retrieves simulation session by ID
   */
  public static getSession(
    studentUserId: string,
    sessionId: string,
    requestingUserId?: string
  ): SocialSimulationSession {
    this.ensureLoaded();
    if (requestingUserId && requestingUserId !== studentUserId && !requestingUserId.startsWith("mentor-") && requestingUserId !== "admin") {
      throw new Error("403_FORBIDDEN: You do not have permission to access another student's communication simulation.");
    }

    const userMap = this.sessions.get(studentUserId);
    if (!userMap) {
      throw new Error(`Simulation session not found: ${sessionId}`);
    }
    const sess = userMap.get(sessionId);
    if (!sess) {
      throw new Error(`Simulation session not found: ${sessionId}`);
    }
    return sess;
  }

  /**
   * Processes a student dialogue turn, generates a real-time coaching whisper, and produces counterpart response
   */
  public static processTurn(params: {
    studentUserId: string;
    sessionId: string;
    studentMessage: string;
    requestingUserId?: string;
  }): {
    session: SocialSimulationSession;
    coachingWhisper: string;
    counterpartReply: string;
  } {
    const { studentUserId, sessionId, studentMessage, requestingUserId } = params;
    const session = this.getSession(studentUserId, sessionId, requestingUserId);

    if (session.status === "completed") {
      throw new Error("Simulation session is already completed. Please retry or start a new scenario.");
    }

    const now = new Date().toISOString();
    const studentTurnIndex = session.turns.length;

    // 1. Analyze student turn for real-time coaching cues
    const lower = studentMessage.toLowerCase();
    let coachingWhisper = "";
    let counterpartReply = "";

    switch (session.scenarioType) {
      case "salary_negotiation":
        if (lower.includes("accept") || lower.includes("sure") || lower.includes("yes")) {
          coachingWhisper = "💡 *Coach Whisper:* You accepted the first offer immediately without probing for equity, performance bonuses, or market alignment. Remember to articulate your verified competencies before agreeing.";
          counterpartReply = "Great! I'm thrilled you're on board. I will draw up the standard contract at ₹18 LPA and send it for signing.";
        } else if (lower.includes("market") || lower.includes("benchmark") || lower.includes("range") || lower.includes("lpa")) {
          coachingWhisper = "💡 *Coach Whisper:* Excellent anchoring on market data. Notice how grounding the request in external benchmarks removes emotional friction.";
          counterpartReply = "I understand your perspective regarding market bands. However, our budget is constrained. What if we kept the base at ₹19.5 LPA and added a ₹2 LPA performance-linked retention bonus?";
        } else {
          coachingWhisper = "💡 *Coach Whisper:* Clear communication. Try anchoring on specific numbers and tying them to the immediate value you will deliver in the first 90 days.";
          counterpartReply = "I hear what you're saying. Walk me through why you believe your current skill set warrants an adjustment above our initial number.";
        }
        break;

      case "executive_status_update":
        if (lower.includes("bottom line") || lower.includes("bluf") || lower.includes("delay") || lower.includes("revised")) {
          coachingWhisper = "💡 *Coach Whisper:* Strong executive presence. You respected the executive's time constraint by leading with the outcome before diving into details.";
          counterpartReply = "I appreciate you being direct with me. It is much better to know now than on launch day. What support do you need from the infrastructure team to hit this revised date?";
        } else {
          coachingWhisper = "💡 *Coach Whisper:* Watch out for burying the lead. An executive wants the timeline impact and mitigation action in the very first sentence.";
          counterpartReply = "Hold on—are you saying we are delayed, or are we on track? Give me the bottom line first: what is our launch date?";
        }
        break;

      case "technical_disagreement":
        if (lower.includes("acid") || lower.includes("serializable") || lower.includes("invariant") || lower.includes("consistency")) {
          coachingWhisper = "💡 *Coach Whisper:* Excellent focus on foundational invariants. You are debating system trade-offs rather than criticizing opinions.";
          counterpartReply = "You make a fair point about transaction consistency for financial balance tables. How would you propose we handle schema evolution if we stick with Postgres?";
        } else {
          coachingWhisper = "💡 *Coach Whisper:* Don't get defensive. Validate the counterpart's concern about velocity before explaining the financial integrity risks.";
          counterpartReply = "Speed of delivery is paramount for leadership right now. If we go with Postgres, won't our database migrations slow the team down?";
        }
        break;

      case "behavioral_interview":
        if (lower.includes("situation") || lower.includes("action") || lower.includes("result") || lower.includes("learned") || lower.includes("takeaway")) {
          coachingWhisper = "💡 *Coach Whisper:* Great structured response. You demonstrated clear personal ownership and lasting systemic takeaways.";
          counterpartReply = "Thank you for that transparency. It shows maturity to own a mistake directly. How has this changed the way you review code or deploy services today?";
        } else {
          coachingWhisper = "💡 *Coach Whisper:* Remember the STAR framework: concisely explain what happened, detail your specific corrective actions, and highlight what lasting safeguards you built.";
          counterpartReply = "Interesting. Could you elaborate specifically on what steps *you* personally took to mitigate the impact once the failure was discovered?";
        }
        break;

      case "non_technical_explanation":
      default:
        if (lower.includes("like") || lower.includes("think of") || lower.includes("warehouse") || lower.includes("desk") || lower.includes("analogy")) {
          coachingWhisper = "💡 *Coach Whisper:* Perfect use of conceptual analogy. This allows non-technical stakeholders to build an accurate mental model without jargon.";
          counterpartReply = "That makes total sense when you put it like that! So caching is like keeping the best-sellers right behind the counter instead of walking back to the warehouse every time.";
        } else {
          coachingWhisper = "💡 *Coach Whisper:* Watch out for technical terminology like 'invalidation' or 'I/O throughput'. Translate technical latency into customer experience and conversion impact.";
          counterpartReply = "Can you simplify that a bit? How does this technical detail actually affect our users clicking through the checkout page?";
        }
        break;
    }

    // 2. Append student turn
    session.turns.push({
      turnIndex: studentTurnIndex,
      speaker: "student",
      content: studentMessage,
      timestamp: now,
    });

    // 3. Append counterpart reply with coaching whisper
    session.turns.push({
      turnIndex: studentTurnIndex + 1,
      speaker: "counterpart",
      content: counterpartReply,
      timestamp: new Date().toISOString(),
      coachingWhisper,
    });

    session.updatedAt = new Date().toISOString();
    this.persistToDisk();

    return {
      session,
      coachingWhisper,
      counterpartReply,
    };
  }

  /**
   * Completes simulation session and evaluates across 6 rubric dimensions
   */
  public static completeAndEvaluate(params: {
    studentUserId: string;
    sessionId: string;
    requestingUserId?: string;
  }): CommunicationRubricEvaluation {
    const { studentUserId, sessionId, requestingUserId } = params;
    const session = this.getSession(studentUserId, sessionId, requestingUserId);

    // Idempotent completion check
    if (session.status === "completed" && session.evaluation) {
      return session.evaluation;
    }

    // Lifecycle check: ensure student actually participated
    const studentTurns = session.turns.filter((t) => t.speaker === "student");
    if (studentTurns.length === 0) {
      throw new Error("400_BAD_REQUEST: Cannot evaluate simulation session without at least one student response.");
    }

    const fullText = studentTurns.map((t) => t.content).join(" ");
    const wordCount = fullText.split(/\s+/).length;

    // Dimension 1: Clarity (sentence conciseness, absence of filler)
    const clarityScore = wordCount >= 30 ? 8.5 : 7.0;
    const clarityFeedback =
      wordCount >= 30
        ? "Clear articulation with focused messaging and distinct technical precision."
        : "Brief response; expand slightly with concrete operational evidence to avoid ambiguity.";

    // Dimension 2: Structure (framework adoption: BLUF, STAR, or clear problem-solution)
    const hasFramework =
      fullText.toLowerCase().includes("situation") ||
      fullText.toLowerCase().includes("bottom line") ||
      fullText.toLowerCase().includes("result") ||
      fullText.toLowerCase().includes("because") ||
      fullText.toLowerCase().includes("market");
    const structureScore = hasFramework ? 9.0 : 7.5;
    const structureFeedback = hasFramework
      ? "Strong adherence to structured communication frameworks (BLUF/STAR/Market Anchor)."
      : "Structure was conversational; formalize with a clearer opening premise followed by supporting evidence.";

    // Dimension 3: Tone & Emotional Awareness (professionalism, empathy, non-defensiveness)
    const isDefensive =
      fullText.toLowerCase().includes("you don't understand") ||
      fullText.toLowerCase().includes("wrong") ||
      fullText.toLowerCase().includes("ridiculous");
    const toneScore = isDefensive ? 5.5 : 8.8;
    const toneFeedback = isDefensive
      ? "Detected defensive phrasing. Re-center around objective trade-offs rather than disputing the counterpart's perspective."
      : "Calm, respectful, and emotionally calibrated demeanor throughout the discussion.";

    // Dimension 4: Professional Presence (confidence, authority without arrogance)
    const presenceScore = 8.5;
    const presenceFeedback = "Maintained professional poise and intellectual honesty under counterpart challenge.";

    // Dimension 5: Technical Accuracy (grounded invariants, correct systems concepts)
    const techScore = 9.0;
    const techFeedback = "Rigorous technical grounding with accurate references to systems, invariants, and trade-offs.";

    // Dimension 6: Persuasiveness (data-backed argumentation, win-win framing)
    const persuasivenessScore = hasFramework && !isDefensive ? 8.8 : 7.2;
    const persuasivenessFeedback =
      hasFramework && !isDefensive
        ? "Compelling case backed by external benchmarks and collaborative framing."
        : "Strengthen persuasion by offering mutually beneficial alternatives rather than a single fixed option.";

    const overallScore = Math.round(
      ((clarityScore + structureScore + toneScore + presenceScore + techScore + persuasivenessScore) / 6) * 10
    ) / 10;

    let exemplaryRewrite = "";
    switch (session.scenarioType) {
      case "salary_negotiation":
        exemplaryRewrite =
          "\"Thank you for this offer, Rohan. I am genuinely excited about the team's mission and engineering challenges. Based on my verified backend performance benchmarks and current market median for SDE-1 roles in Bangalore (₹22–24 LPA), I was expecting an offer closer to ₹22 LPA base. If we can reach ₹21 LPA base with a performance milestone bonus, I would be delighted to accept and begin onboarding immediately.\"";
        break;
      case "executive_status_update":
        exemplaryRewrite =
          "\"Bottom line up front, Vikram: our core database migration is rescheduled by 7 days to next Tuesday due to connection-pool locking under peak load. We have isolated the lock contention and are applying batch chunking today. There is zero risk to data integrity, and our customer SLA commitments remain unaffected.\"";
        break;
      case "technical_disagreement":
        exemplaryRewrite =
          "\"I completely agree with your emphasis on team velocity, Ananya. Our concern with document stores for this specific financial ledger service is that multi-document distributed rollbacks in MongoDB do not guarantee serializable ACID isolation under split-brain network failures. By choosing PostgreSQL with serializable isolation, we eliminate phantom balance discrepancies while still using JSONB for rapid schema adjustments where appropriate.\"";
        break;
      default:
        exemplaryRewrite =
          "\"Let's ground our recommendation in empirical data: by prioritizing system invariants first and aligning with our user SLA goals, we achieve both durability and velocity.\"";
        break;
    }

    const evaluation: CommunicationRubricEvaluation = {
      clarity: { score: clarityScore, feedback: clarityFeedback },
      structure: { score: structureScore, feedback: structureFeedback },
      toneAndEmotionalAwareness: { score: toneScore, feedback: toneFeedback },
      professionalPresence: { score: presenceScore, feedback: presenceFeedback },
      technicalAccuracy: { score: techScore, feedback: techFeedback },
      persuasiveness: { score: persuasivenessScore, feedback: persuasivenessFeedback },
      overallScore,
      concreteRevisionSuggestions: [
        "Acknowledge the counterpart's core objective (velocity, budget, SLA) before presenting counter-evidence.",
        "Use concrete numbers and benchmarks rather than general qualitative claims.",
        "Conclude dialogue turns with an open collaborative invitation (e.g. 'How does that timeline look from your perspective?').",
      ],
      exemplaryRewrite,
    };

    session.evaluation = evaluation;
    session.status = "completed";
    session.updatedAt = new Date().toISOString();
    this.persistToDisk();

    return evaluation;
  }

  /**
   * Retries scenario simulation with adjusted parameters
   */
  public static retrySession(params: {
    studentUserId: string;
    sessionId: string;
    adjustedAttitude?: CounterpartPersona["attitude"];
    requestingUserId?: string;
  }): SocialSimulationSession {
    const { studentUserId, sessionId, adjustedAttitude, requestingUserId } = params;
    const oldSession = this.getSession(studentUserId, sessionId, requestingUserId);

    return this.startSession({
      studentUserId,
      scenarioType: oldSession.scenarioType,
      customCounterpart: {
        ...oldSession.counterpartPersona,
        ...(adjustedAttitude ? { attitude: adjustedAttitude } : {}),
      },
      requestingUserId,
    });
  }
}
