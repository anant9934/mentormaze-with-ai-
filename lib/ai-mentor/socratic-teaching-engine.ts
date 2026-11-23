/**
 * ASTRION Socratic Teaching & Diagnostic Engine
 * Brand: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 * Architecture: Jane Street Socratic Tutor (`janestreet/agent_skills`) & Ben Rosche (`socratic-tutor`)
 *
 * Enforces strict single-turn questioning, dynamic subskill decomposition,
 * prerequisite validation, 0-5 mastery progression, and persistent assistance ladders.
 */

import { CanonicalMasteryLevel } from "./types";
import { PersistentHintEscalator, HintLadderLevel, ESCALATION_LADDER_STEPS } from "./persistent-hint-escalator";
import { StudentSkillGraph } from "./student-skill-graph";

export type LearningIntent =
  | "one_off_question"
  | "explanation_request"
  | "teach_me"
  | "quiz_me"
  | "help_me_master"
  | "debug_reasoning"
  | "practice_interview"
  | "review_progress";

export type StudentTeachingCommand =
  | "just_explain"
  | "give_hint"
  | "harder"
  | "easier"
  | "show_progress"
  | "resume_learning"
  | "override_start"
  | "none";

export interface SubskillDefinition {
  id: string;
  name: string;
  order: number;
  description: string;
  prerequisites: string[];
  diagnosticQuestion: {
    questionText: string;
    targetInsight: string;
    sampleCorrectEvidence: string;
    commonMisconceptions: string[];
  };
}

export interface TopicDecomposition {
  topic: string;
  topicTitle: string;
  subskills: SubskillDefinition[];
  corePrerequisites: string[];
}

export interface DiagnosticSessionState {
  id: string;
  studentUserId: string;
  topic: string;
  topicTitle: string;
  subskills: SubskillDefinition[];
  corePrerequisites: string[];
  questionsTotal: number;
  currentQuestionIndex: number;
  evaluatedAnswers: {
    subskillId: string;
    questionText: string;
    studentAnswer: string;
    isCorrect: boolean;
    detectedMisconception?: string;
    awardedMastery: CanonicalMasteryLevel;
  }[];
  initialSkillMap: Record<string, CanonicalMasteryLevel>;
  recommendedStartingSubskillId?: string;
  hasPresentedInitialQuestion?: boolean;
  status: "in_progress" | "completed" | "overridden";
  createdAt: string;
  updatedAt: string;
}

export interface SocraticDecisionResult {
  intent: LearningIntent;
  command: StudentTeachingCommand;
  isInDiagnostic: boolean;
  activeTopic?: string;
  activeSubskillId?: string;
  diagnosticState?: DiagnosticSessionState;
  suggestedStrategy:
    | "socratic_question"
    | "conceptual_explanation"
    | "worked_example"
    | "progressive_hint"
    | "guided_practice"
    | "independent_exercise"
    | "retrieval_quiz"
    | "transfer_challenge"
    | "misconception_correction"
    | "review_activity";
  promptDirective: string;
  enforceSingleQuestion: boolean;
  withholdSolution: boolean;
  hintLevel?: HintLadderLevel;
  reasonForRecommendation: string;
}

// Canonical Curriculum Decompositions (4-10 subskills each)
export const TOPIC_DECOMPOSITIONS: Record<string, TopicDecomposition> = {
  dynamic_programming: {
    topic: "dynamic_programming",
    topicTitle: "Dynamic Programming (DP)",
    corePrerequisites: ["recursion", "arrays_strings"],
    subskills: [
      {
        id: "dp_subproblems",
        name: "Optimal Substructure & Overlapping Subproblems",
        order: 1,
        description: "Decomposing problems into recursive subproblems with shared state.",
        prerequisites: ["recursion"],
        diagnosticQuestion: {
          questionText: "What distinguishes a dynamic programming problem from a standard divide-and-conquer problem like merge sort?",
          targetInsight: "Subproblems in DP overlap and share identical sub-states, whereas divide-and-conquer subproblems are non-overlapping and independent.",
          sampleCorrectEvidence: "overlapping subproblems / shared repeated states",
          commonMisconceptions: ["Thinking DP is only about caching", "Confusing greedy choice with optimal substructure"],
        },
      },
      {
        id: "dp_state_variables",
        name: "Formulating State & Recurrence Relations",
        order: 2,
        description: "Defining minimal parameters to uniquely describe subproblem states.",
        prerequisites: ["dp_subproblems"],
        diagnosticQuestion: {
          questionText: "In the 0/1 Knapsack problem with weights and values, what are the minimal state variables required to represent whether an item is chosen or skipped?",
          targetInsight: "Two variables: current item index i and remaining capacity w.",
          sampleCorrectEvidence: "item index and remaining capacity",
          commonMisconceptions: ["Adding unnecessary cumulative value to the state", "Using only capacity"],
        },
      },
      {
        id: "dp_memoization",
        name: "Top-Down Memoization",
        order: 3,
        description: "Transforming exponential recursive trees into polynomial time via caching.",
        prerequisites: ["dp_state_variables"],
        diagnosticQuestion: {
          questionText: "When memoizing a recursive function in Python or JavaScript, what critical bug occurs if you use a mutable global array without indexing on all state parameters?",
          targetInsight: "State collisions occur where different sub-branches overwrite each other's return values.",
          sampleCorrectEvidence: "state collisions / stale cache entries across different path contexts",
          commonMisconceptions: ["Assuming memoization always changes call stack depth"],
        },
      },
      {
        id: "dp_tabulation",
        name: "Bottom-Up Tabulation & State Ordering",
        order: 4,
        description: "Building iterative DP tables based on topological dependency order.",
        prerequisites: ["dp_memoization"],
        diagnosticQuestion: {
          questionText: "Why must the iteration order in bottom-up DP follow a topological sort of subproblem dependencies?",
          targetInsight: "A state dp[i][w] cannot be computed until its dependent states dp[i-1][...] are already finalized.",
          sampleCorrectEvidence: "base cases and prior dependencies must be computed before current state",
          commonMisconceptions: ["Assuming bottom-up always loops from 0 to n"],
        },
      },
      {
        id: "dp_space_optimization",
        name: "Space Optimization & Rolling Arrays",
        order: 5,
        description: "Compressing 2D tables into 1D arrays when only prior rows are required.",
        prerequisites: ["dp_tabulation"],
        diagnosticQuestion: {
          questionText: "When compressing a 2D knapsack DP table into a 1D array dp[w], why must the capacity loop run backwards from W down to weight[i]?",
          targetInsight: "Traversing backwards prevents using the same item multiple times in the same step (which would solve unbounded knapsack).",
          sampleCorrectEvidence: "prevents overwriting values from previous item / avoids unbounded reuse",
          commonMisconceptions: ["Thinking backwards loop is only for cache locality"],
        },
      },
    ],
  },
  arrays_strings: {
    topic: "arrays_strings",
    topicTitle: "Two Pointers, Sliding Window & Prefix Sums",
    corePrerequisites: ["typescript_core"],
    subskills: [
      {
        id: "two_pointers_sorted",
        name: "Two Pointers on Sorted Collections",
        order: 1,
        description: "Opposite-direction two-pointers for pair targets on sorted arrays.",
        prerequisites: [],
        diagnosticQuestion: {
          questionText: "Under what strict mathematical precondition can an opposite-direction Two-Pointer search find a target sum in O(N) time without hashing?",
          targetInsight: "The collection must be monotonically sorted so pointer movements deterministically increase or decrease the sum.",
          sampleCorrectEvidence: "array must be sorted / monotonic order",
          commonMisconceptions: ["Attempting two pointers on unsorted array without sorting"],
        },
      },
      {
        id: "sliding_window_fixed",
        name: "Fixed-Size Sliding Window",
        order: 2,
        description: "Maintaining rolling metrics over contiguous subarrays of fixed length k.",
        prerequisites: ["two_pointers_sorted"],
        diagnosticQuestion: {
          questionText: "How does a sliding window achieve O(N) time when computing maximum sum of all subarrays of length k, compared to the brute force O(N*k)?",
          targetInsight: "By adding the incoming element at right and subtracting the outgoing element at left in O(1) per step.",
          sampleCorrectEvidence: "add incoming subtract outgoing in O(1)",
          commonMisconceptions: ["Recalculating sum across window at each step"],
        },
      },
      {
        id: "sliding_window_variable",
        name: "Variable-Size Sliding Window with Invariants",
        order: 3,
        description: "Dynamically expanding right pointer and contracting left pointer to satisfy constraints.",
        prerequisites: ["sliding_window_fixed"],
        diagnosticQuestion: {
          questionText: "In 'Longest Substring Without Repeating Characters', when does the left pointer contract, and how many times can each element be visited by the pointers?",
          targetInsight: "Left contracts when a duplicate character is encountered. Each element is visited at most twice (once by right, once by left), preserving O(N) time.",
          sampleCorrectEvidence: "contracts on duplicate / each element visited at most twice",
          commonMisconceptions: ["Thinking nested while loop makes it O(N^2)"],
        },
      },
      {
        id: "prefix_sums",
        name: "Prefix Sums & Range Sum Queries",
        order: 4,
        description: "Precomputing cumulative sums to answer range sum queries in O(1).",
        prerequisites: ["two_pointers_sorted"],
        diagnosticQuestion: {
          questionText: "Given a prefix sum array where P[i] is sum of elements 0..i-1, what formula computes the sum of subarray from index L to R inclusive in O(1)?",
          targetInsight: "P[R+1] - P[L]",
          sampleCorrectEvidence: "prefix[R+1] - prefix[L]",
          commonMisconceptions: ["Off-by-one errors with prefix bounds"],
        },
      },
    ],
  },
  relational_db_sql: {
    topic: "relational_db_sql",
    topicTitle: "SQL & Relational Database Indexing",
    corePrerequisites: [],
    subskills: [
      {
        id: "sql_acid",
        name: "ACID Invariants & Transaction Boundaries",
        order: 1,
        description: "Atomicity, Consistency, Isolation, and Durability under concurrent transactions.",
        prerequisites: [],
        diagnosticQuestion: {
          questionText: "What concrete anomaly is prevented by the Repeatable Read isolation level that is permitted under Read Committed?",
          targetInsight: "Non-repeatable reads (reading the same row twice within a transaction yielding different values).",
          sampleCorrectEvidence: "non-repeatable reads / phantom read handling",
          commonMisconceptions: ["Confusing dirty reads with non-repeatable reads"],
        },
      },
      {
        id: "sql_btree_indexing",
        name: "B-Tree Indexes & Leftmost Prefix Rule",
        order: 2,
        description: "Composite indexes and index search mechanics.",
        prerequisites: ["sql_acid"],
        diagnosticQuestion: {
          questionText: "If you create a composite index on (department_id, salary), why will a query with WHERE salary > 50000 generally perform a full table scan rather than an index seek?",
          targetInsight: "Because B-tree composite indexes must satisfy the leftmost prefix rule; department_id is missing.",
          sampleCorrectEvidence: "leftmost prefix rule / leading column missing",
          commonMisconceptions: ["Assuming any indexed column in composite index is searchable independently"],
        },
      },
      {
        id: "sql_joins_execution",
        name: "Join Mechanics (Hash vs Nested Loop vs Merge)",
        order: 3,
        description: "Query planner join selection and memory constraints.",
        prerequisites: ["sql_btree_indexing"],
        diagnosticQuestion: {
          questionText: "When would a query planner prefer a Hash Join over a Nested Loop Join?",
          targetInsight: "For joining two large unsorted datasets without suitable indexes on the join key.",
          sampleCorrectEvidence: "large datasets without indexes / batch equijoins",
          commonMisconceptions: ["Thinking nested loops are always slower"],
        },
      },
    ],
  },
};

export class SocraticTeachingEngine {
  private static diagnosticSessions: Map<string, DiagnosticSessionState> = new Map();

  public static reset(): void {
    this.diagnosticSessions.clear();
  }

  /**
   * Classify user learning intent deterministically
   */
  public static classifyIntent(message: string): LearningIntent {
    const lower = message.toLowerCase().trim();

    // 1. One-off quick questions (never start diagnostic!)
    if (
      lower.startsWith("what is ") ||
      lower.startsWith("define ") ||
      lower.startsWith("what does ") ||
      lower.startsWith("who is ") ||
      lower.startsWith("when was ") ||
      (lower.includes("meaning of") && lower.length < 50)
    ) {
      return "one_off_question";
    }

    // 2. Structured explanation requests
    if (
      lower.includes("explain ") ||
      lower.includes("how does ") ||
      lower.includes("walk me through ") ||
      lower.includes("difference between ") ||
      lower.includes("clarify ")
    ) {
      return "explanation_request";
    }

    // 3. Explicit tutoring request -> diagnostic
    if (
      lower.includes("teach me ") ||
      lower.includes("tutor me ") ||
      lower.includes("start learning ") ||
      lower.includes("guide me through ") ||
      lower.includes("want to learn ") ||
      lower.includes("want to master ") ||
      lower.includes("learn ")
    ) {
      return "teach_me";
    }

    // 4. Mastery request
    if (
      lower.includes("help me master ") ||
      lower.includes("master ") ||
      lower.includes("drill me on ")
    ) {
      return "help_me_master";
    }

    // 5. Quiz request
    if (
      lower.includes("quiz me ") ||
      lower.includes("test me ") ||
      lower.includes("test my knowledge") ||
      lower.includes("ask me questions")
    ) {
      return "quiz_me";
    }

    // 6. Debug / Code inspection
    if (
      lower.includes("debug ") ||
      lower.includes("why is my code ") ||
      lower.includes("what is wrong with ") ||
      lower.includes("runtime error") ||
      lower.includes("time limit exceeded") ||
      lower.includes("tle") ||
      lower.includes("wrong answer")
    ) {
      return "debug_reasoning";
    }

    // 7. Mock Interview
    if (
      lower.includes("mock interview") ||
      lower.includes("interview me") ||
      lower.includes("behavioral round") ||
      lower.includes("system design interview")
    ) {
      return "practice_interview";
    }

    // 8. Progress review
    if (
      lower.includes("show my progress") ||
      lower.includes("how am i doing") ||
      lower.includes("my skill map") ||
      lower.includes("weakest skills") ||
      lower.includes("review queue")
    ) {
      return "review_progress";
    }

    return "explanation_request";
  }

  /**
   * Detect explicit student command overrides
   */
  public static detectCommand(message: string): StudentTeachingCommand {
    const lower = message.toLowerCase().trim();

    if (
      lower.includes("just explain") ||
      lower.includes("give me the answer") ||
      lower.includes("show solution") ||
      lower.includes("just tell me")
    ) {
      return "just_explain";
    }

    if (
      lower.includes("give me a hint") ||
      lower.includes("hint please") ||
      lower.includes("need a hint") ||
      lower.includes("give hint")
    ) {
      return "give_hint";
    }

    if (lower === "harder" || lower.includes("make it harder") || lower.includes("more challenging")) {
      return "harder";
    }

    if (lower === "easier" || lower.includes("make it easier") || lower.includes("too hard")) {
      return "easier";
    }

    if (lower.includes("show progress") || lower.includes("my progress")) {
      return "show_progress";
    }

    if (lower.includes("resume learning") || lower.includes("continue")) {
      return "resume_learning";
    }

    if (lower.includes("skip to ") || lower.includes("start with ") || lower.includes("override starting point")) {
      return "override_start";
    }

    return "none";
  }

  /**
   * Resolve or initialize diagnostic placement session
   */
  public static getOrCreateDiagnosticSession(
    studentUserId: string,
    topicName: string
  ): DiagnosticSessionState {
    const norm = topicName.trim().toLowerCase().replace(/[\s-]+/g, "_");
    const sessionKey = `${studentUserId}::${norm}`;

    if (this.diagnosticSessions.has(sessionKey)) {
      return this.diagnosticSessions.get(sessionKey)!;
    }

    const decomp = TOPIC_DECOMPOSITIONS[norm] || {
      topic: norm,
      topicTitle: topicName,
      corePrerequisites: [],
      subskills: [
        {
          id: `${norm}_foundations`,
          name: `${topicName} Foundations`,
          order: 1,
          description: `Core conceptual foundations of ${topicName}`,
          prerequisites: [],
          diagnosticQuestion: {
            questionText: `What is the core problem that ${topicName} is designed to solve, and what is its primary invariant?`,
            targetInsight: `Foundational conceptual comprehension of ${topicName}`,
            sampleCorrectEvidence: "core definition and invariant",
            commonMisconceptions: [],
          },
        },
        {
          id: `${norm}_application`,
          name: `${topicName} Application`,
          order: 2,
          description: `Practical implementation and algorithms for ${topicName}`,
          prerequisites: [`${norm}_foundations`],
          diagnosticQuestion: {
            questionText: `Walk through how you would apply ${topicName} to handle a typical edge case (e.g. empty or scale boundary).`,
            targetInsight: `Operational ability to apply ${topicName}`,
            sampleCorrectEvidence: "edge case handling and complexity",
            commonMisconceptions: [],
          },
        },
      ],
    };

    const now = new Date().toISOString();
    const session: DiagnosticSessionState = {
      id: `diag-${studentUserId}-${Date.now()}`,
      studentUserId,
      topic: decomp.topic,
      topicTitle: decomp.topicTitle,
      subskills: decomp.subskills,
      corePrerequisites: decomp.corePrerequisites,
      questionsTotal: decomp.subskills.length,
      currentQuestionIndex: 0,
      evaluatedAnswers: [],
      initialSkillMap: {},
      status: "in_progress",
      createdAt: now,
      updatedAt: now,
    };

    this.diagnosticSessions.set(sessionKey, session);
    return session;
  }

  /**
   * Main pedagogical decision maker implementing Jane Street & Ben Rosche Socratic loop
   */
  public static decide(params: {
    studentUserId: string;
    userMessage: string;
    activeTopic?: string;
    exerciseId?: string;
    currentHintLevel?: number;
    mode?: string;
  }): SocraticDecisionResult {
    const { studentUserId, userMessage, activeTopic = "dynamic_programming", exerciseId, mode } = params;
    const intent = this.classifyIntent(userMessage);
    const command = this.detectCommand(userMessage);

    // 1. Check for explicit student command escape hatches
    if (command === "just_explain") {
      return {
        intent,
        command,
        isInDiagnostic: false,
        activeTopic,
        suggestedStrategy: "conceptual_explanation",
        promptDirective:
          "The student explicitly requested a direct explanation ('Just explain'). Step out of Socratic questioning. Provide a comprehensive, crystal-clear, step-by-step technical explanation with production-grade code.",
        enforceSingleQuestion: false,
        withholdSolution: false,
        reasonForRecommendation: "Student explicitly requested direct explanation ('Just explain').",
      };
    }

    if (command === "give_hint") {
      const activeExId = exerciseId || `${activeTopic}_ex1`;
      const attempt = PersistentHintEscalator.recordAttempt({
        studentUserId,
        skillId: activeTopic,
        exerciseId: activeExId,
        requestedHint: true,
      });

      return {
        intent,
        command,
        isInDiagnostic: false,
        activeTopic,
        suggestedStrategy: "progressive_hint",
        hintLevel: attempt.record.currentHintLevel,
        promptDirective: `${attempt.currentHintStep.directive} (Hint Level ${attempt.record.currentHintLevel} of 6). Keep turn concise. Do NOT reveal the full solution yet.`,
        enforceSingleQuestion: true,
        withholdSolution: attempt.record.currentHintLevel < 6,
        reasonForRecommendation: `Delivering Persistent Escalation Hint Level ${attempt.record.currentHintLevel} of 6.`,
      };
    }

    if (command === "show_progress") {
      return {
        intent: "review_progress",
        command,
        isInDiagnostic: false,
        activeTopic,
        suggestedStrategy: "review_activity",
        promptDirective:
          "Display the student's current subskill mastery breakdown, confirmed strengths, diagnosed gaps, and active review queue.",
        enforceSingleQuestion: false,
        withholdSolution: false,
        reasonForRecommendation: "Student requested progress review.",
      };
    }

    // 2. Active Diagnostic Session in Progress
    // If student is currently undergoing diagnostic placement and didn't switch to practice mode or ask a quick factual question:
    const sessionKey = `${studentUserId}::${activeTopic.trim().toLowerCase().replace(/[\s-]+/g, "_")}`;
    const activeSession = this.diagnosticSessions.get(sessionKey);
    if (
      mode !== "practice" &&
      activeSession &&
      activeSession.status === "in_progress" &&
      activeSession.currentQuestionIndex < activeSession.subskills.length
    ) {
      if (intent === "one_off_question") {
        return {
          intent,
          command,
          isInDiagnostic: false,
          activeTopic,
          suggestedStrategy: "conceptual_explanation",
          promptDirective:
            "Provide a concise, direct, authoritative answer to the student's specific question in 1 turn. Do not interrogate.",
          enforceSingleQuestion: false,
          withholdSolution: false,
          reasonForRecommendation: "Student asked a direct one-off factual question.",
        };
      }

      const subskill = activeSession.subskills[activeSession.currentQuestionIndex];
      const qNum = activeSession.currentQuestionIndex + 1;
      const total = activeSession.subskills.length;

      return {
        intent: "teach_me",
        command,
        isInDiagnostic: true,
        activeTopic,
        activeSubskillId: subskill.id,
        diagnosticState: activeSession,
        suggestedStrategy: "socratic_question",
        promptDirective: `You are conducting Diagnostic Placement for '${activeSession.topicTitle}' (Question ${qNum} of ${total}).
Subskill being assessed: ${subskill.name}.
Target Concept: ${subskill.diagnosticQuestion.targetInsight}.

MANDATORY SOCRATIC RULES:
1. Ask STRICTLY ONE question: "${subskill.diagnosticQuestion.questionText}".
2. Do NOT provide answers, code snippets, or lengthy introductions.
3. Conclude message immediately after the question.`,
        enforceSingleQuestion: true,
        withholdSolution: true,
        reasonForRecommendation: `Continuing diagnostic placement (${qNum}/${total}) for subskill '${subskill.name}'.`,
      };
    }

    // 2. One-off factual queries -> Direct concise answer (DO NOT trigger diagnostic!)
    if (intent === "one_off_question") {
      return {
        intent,
        command,
        isInDiagnostic: false,
        activeTopic,
        suggestedStrategy: "conceptual_explanation",
        promptDirective:
          "Provide a concise, direct, authoritative answer to the student's specific question in 1 turn. Do not interrogate or initiate a diagnostic.",
        enforceSingleQuestion: false,
        withholdSolution: false,
        reasonForRecommendation: "Student asked a direct one-off factual question.",
      };
    }

    // 3. Explanation request -> Structured explanation with examples
    if (intent === "explanation_request") {
      return {
        intent,
        command,
        isInDiagnostic: false,
        activeTopic,
        suggestedStrategy: "conceptual_explanation",
        promptDirective:
          "Deliver a structured, pedagogical technical explanation. Break down principles step by step, illustrate with a clean code example, and note complexity.",
        enforceSingleQuestion: false,
        withholdSolution: false,
        reasonForRecommendation: "Student requested an explanation of a technical concept.",
      };
    }

    // 4. Tutoring / Mastery Intent -> Jane Street Diagnostic Placement Loop
    if (intent === "teach_me" || intent === "help_me_master") {
      const session = this.getOrCreateDiagnosticSession(studentUserId, activeTopic);

      // Check if diagnostic is in progress
      if (session.status === "in_progress" && session.currentQuestionIndex < session.subskills.length) {
        const subskill = session.subskills[session.currentQuestionIndex];
        const qNum = session.currentQuestionIndex + 1;
        const total = session.subskills.length;

        return {
          intent,
          command,
          isInDiagnostic: true,
          activeTopic,
          activeSubskillId: subskill.id,
          diagnosticState: session,
          suggestedStrategy: "socratic_question",
          promptDirective: `You are conducting Diagnostic Placement for '${session.topicTitle}' (Question ${qNum} of ${total}).
Subskill being assessed: ${subskill.name}.
Target Concept: ${subskill.diagnosticQuestion.targetInsight}.

MANDATORY SOCRATIC RULES:
1. Ask STRICTLY ONE question: "${subskill.diagnosticQuestion.questionText}".
2. Do NOT provide answers, code snippets, or lengthy introductions.
3. Conclude message immediately after the question.`,
          enforceSingleQuestion: true,
          withholdSolution: true,
          reasonForRecommendation: `Running initial diagnostic question ${qNum}/${total} for subskill '${subskill.name}'.`,
        };
      }
    }

    // 5. Default Socratic Practice Loop
    const activeExId = exerciseId || `${activeTopic}_practice`;
    const attempt = PersistentHintEscalator.recordAttempt({
      studentUserId,
      skillId: activeTopic,
      exerciseId: activeExId,
    });

    return {
      intent,
      command,
      isInDiagnostic: false,
      activeTopic,
      suggestedStrategy: "socratic_question",
      hintLevel: attempt.record.currentHintLevel,
      promptDirective: `You are guiding the student using the Socratic method.
Current assistance level: Level ${attempt.record.currentHintLevel} of 6 (${attempt.currentHintStep.name}).

STRICT RULES:
1. Ask ONE question at a time.
2. If student made an error, DO NOT reveal the solution. Use a narrower counter-question to expose the contradiction.
3. If student attempts >= 3 and continues struggling, offer to walk through a small worked example.`,
      enforceSingleQuestion: true,
      withholdSolution: true,
      reasonForRecommendation: `Socratic guidance active at Hint Level ${attempt.record.currentHintLevel}.`,
    };
  }

  /**
   * Submits a student response to the active diagnostic question and advances the state
   */
  public static evaluateDiagnosticAnswer(params: {
    studentUserId: string;
    topicName: string;
    answerText: string;
    isCorrect: boolean;
    misconception?: string;
  }): {
    session: DiagnosticSessionState;
    completed: boolean;
    recommendedStartingSubskillId?: string;
  } {
    const { studentUserId, topicName, answerText, isCorrect, misconception } = params;
    const session = this.getOrCreateDiagnosticSession(studentUserId, topicName);

    if (session.currentQuestionIndex < session.subskills.length) {
      const currentSubskill = session.subskills[session.currentQuestionIndex];
      const awardedMastery: CanonicalMasteryLevel = isCorrect ? 3 : 1;

      session.evaluatedAnswers.push({
        subskillId: currentSubskill.id,
        questionText: currentSubskill.diagnosticQuestion.questionText,
        studentAnswer: answerText,
        isCorrect,
        detectedMisconception: misconception,
        awardedMastery,
      });

      session.initialSkillMap[currentSubskill.id] = awardedMastery;
      session.currentQuestionIndex += 1;
      session.updatedAt = new Date().toISOString();

      // Check if diagnostic just completed
      if (session.currentQuestionIndex >= session.subskills.length) {
        session.status = "completed";

        // Find first subskill with mastery < 3 (Zone of Proximal Development entry point)
        const recommended = session.subskills.find((s) => (session.initialSkillMap[s.id] || 0) < 3);
        session.recommendedStartingSubskillId = recommended ? recommended.id : session.subskills[0].id;
      }
    }

    const completed = session.status === "completed";
    return {
      session,
      completed,
      recommendedStartingSubskillId: session.recommendedStartingSubskillId,
    };
  }

  /**
   * Allows student to override the recommended starting subskill
   */
  public static overrideStartingSubskill(
    studentUserId: string,
    topicName: string,
    targetSubskillId: string
  ): DiagnosticSessionState {
    const session = this.getOrCreateDiagnosticSession(studentUserId, topicName);
    session.recommendedStartingSubskillId = targetSubskillId;
    session.status = "overridden";
    session.updatedAt = new Date().toISOString();
    return session;
  }
}
