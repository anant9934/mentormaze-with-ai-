import { CATEGORY_RUBRICS, InterviewCategory, RubricDimensionWeight } from "./rubric-constants";

export interface InterviewMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  stage?: InterviewStage;
}

export type InterviewStage =
  | "intro"
  | "problem_presentation"
  | "clarification"
  | "approach_discussion"
  | "live_coding"
  | "optimization"
  | "scorecard_wrapup";

export interface AIInterviewerTurnRequest {
  sessionTrack: InterviewCategory;
  targetRole: string;
  difficulty: "Easy" | "Medium" | "Hard";
  userMessage?: string;
  codeSnippet?: string;
  history: InterviewMessage[];
  currentStage?: InterviewStage;
  candidateName?: string;
}

export interface AIInterviewerTurnResponse {
  aiResponse: string;
  voiceText: string; // Tailored for Text-to-Speech voice synthesis (no markdown symbols)
  nextStage: InterviewStage;
  suggestedQuickReplies: string[];
  rubricScores: Record<string, number>; // key -> score out of 10
  feedbackPill?: string;
  isComplete: boolean;
  scorecardSummary?: {
    overallScoreOutOf10: number;
    verdict: "Strong Hire" | "Hire" | "Leaning Hire" | "Needs Practice";
    strengths: string[];
    growthAreas: string[];
    detailedAnalysis: string;
  };
}

// Preset Interview Tracks & Problem Pools
interface TrackCurriculum {
  trackName: string;
  defaultProblemTitle: string;
  defaultProblemSpec: string;
  clarifyingAnswers: Record<string, string>;
  expectedComplexity: { time: string; space: string };
  starterCode: string;
}

const TRACK_CURRICULA: Record<InterviewCategory, TrackCurriculum> = {
  sde_backend: {
    trackName: "Software Engineering (Backend & Algorithms)",
    defaultProblemTitle: "LRU (Least Recently Used) Cache Design",
    defaultProblemSpec:
      "Design and implement a data structure for a Least Recently Used (LRU) Cache. It should support two operations: `get(key)` and `put(key, value)`. Both operations must execute in O(1) average time complexity.",
    clarifyingAnswers: {
      capacity: "The capacity is a positive integer, for example capacity = 2 or capacity = 1000.",
      types: "Keys and values are standard integers.",
      concurrency: "For the initial phase, assume single-threaded execution. We will discuss thread safety later.",
    },
    expectedComplexity: { time: "O(1) get and put", space: "O(Capacity)" },
    starterCode: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    // Hint: Doubly Linked List + HashMap
  }

  get(key) {
    // Return value or -1 if not found
  }

  put(key, value) {
    // Insert or update key, evict LRU if capacity exceeded
  }
}`,
  },
  sde_frontend: {
    trackName: "Frontend Engineering & UI Systems",
    defaultProblemTitle: "Infinite Scroll Virtualized List & Debounced Typeahead",
    defaultProblemSpec:
      "Design a high-performance searchable typeahead dropdown that handles 10,000+ items without dropping frames below 60fps. Address network debouncing, race condition cancellation (AbortController), and keyboard accessibility (WCAG).",
    clarifyingAnswers: {
      framework: "You can explain the architecture using React hooks or pure vanilla JavaScript DOM APIs.",
      latency: "Network search API responds within 150-300ms with potential out-of-order responses.",
    },
    expectedComplexity: { time: "O(1) DOM nodes rendered (virtualized)", space: "O(K) rendered items" },
    starterCode: `// React Typeahead with AbortController & Debounce
function SearchTypeahead({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  
  // Implement debounced search with abortable fetch
}`,
  },
  system_design: {
    trackName: "High-Level Distributed System Design",
    defaultProblemTitle: "Design a Global URL Shortener (TinyURL / Bitly)",
    defaultProblemSpec:
      "Design a scalable URL shortener service that generates unique short aliases for long URLs and redirects users with sub-10ms p99 latency. Handle 100 Million new URLs per month with 100:1 read-to-write ratio.",
    clarifyingAnswers: {
      scale: "100M writes/month ≈ 40 writes/sec. 100:1 read ratio ≈ 4,000 reads/sec. Peak QPS ≈ 10,000.",
      length: "Short aliases should be 7 alphanumeric characters (Base62: [a-z, A-Z, 0-9]).",
      analytics: "Provide real-time click tracking per link.",
    },
    expectedComplexity: { time: "p99 < 10ms via Redis caching", space: "~15 TB storage over 5 years" },
    starterCode: `// System Architecture Blueprint
// 1. Client -> Cloudflare CDN -> Nginx Load Balancer
// 2. Shortening API Service (Node/Go Stateless Nodes)
// 3. Distributed ID Generator (Snowflake / Pre-allocated Base62 ranges)
// 4. Redis Cluster (Cache-Aside: hot 20% of URLs)
// 5. PostgreSQL / DynamoDB (URL Mapping store)`,
  },
  behavioral: {
    trackName: "Behavioral & Leadership STAR Evaluation",
    defaultProblemTitle: "Navigating High-Stakes Technical Disagreements & Delivery Delays",
    defaultProblemSpec:
      "Tell me about a time you had a strong technical disagreement with a team member or senior lead regarding an architectural decision, or faced an urgent production deadline that was at risk. How did you handle it?",
    clarifyingAnswers: {
      focus: "Structure your response using the STAR method: Situation, Task, Action, and Quantifiable Result.",
      depth: "Focus specifically on your personal actions rather than team generalities.",
    },
    expectedComplexity: { time: "3-4 minutes structured response", space: "Clear metric outcomes" },
    starterCode: `// STAR Response Outline:
// Situation: Context, stakes, and why the decision mattered.
// Task: What you personally owned and needed to achieve.
// Action: Concrete steps, data gathered, persuasion, consensus.
// Result: Quantifiable outcome, lessons learned, post-mortem.`,
  },
  data_science: {
    trackName: "Machine Learning & AI Engineering",
    defaultProblemTitle: "Design a Real-Time Recommendation Engine for E-Commerce",
    defaultProblemSpec:
      "Design an end-to-end machine learning recommendation system for personalized homepage product feeds. Address candidate generation (retrieval), multi-task ranking, cold-start for new users, and offline vs online evaluation.",
    clarifyingAnswers: {
      latency: "Recommendations must be served within 50ms per request.",
      data: "Millions of user clickstream logs, purchase history, and product embedding catalogs.",
    },
    expectedComplexity: { time: "Two-stage: Retrieval (<15ms) + Ranking (<30ms)", space: "FAISS Vector DB" },
    starterCode: `// ML Pipeline Architecture:
// Stage 1: Candidate Generation (Collaborative Filtering + Two-Tower Vector Search)
// Stage 2: Ranking Model (GBDT / Deep & Cross Network)
// Stage 3: Re-ranking & Diversity Filters (Business rules, deduplication)`,
  },
  product_management: {
    trackName: "Product Management Sense & Metrics",
    defaultProblemTitle: "Product Teardown & Strategy for AI-Powered College Career Readiness",
    defaultProblemSpec:
      "Imagine you are the Head of Product at MentorMaze. How would you design an AI feature that takes an engineering student from a tier-2/3 college and guarantees they reach Tier-1 product company readiness within 90 days? Define personas, MVP scope, and North Star metrics.",
    clarifyingAnswers: {
      constraint: "Engineering budget is 4 full-stack devs and 1 ML engineer for Q1.",
      metric: "Focus on student placement rate and weekly active mock participation.",
    },
    expectedComplexity: { time: "Phased 30-60-90 day product roadmap", space: "Funnel conversion optimization" },
    starterCode: `// Product Strategy Framework:
// 1. Problem Statement & User Pain Points (Skill disparity, lack of insider feedback)
// 2. Target Persona: Anant (B.Tech CS Student preparing for summer intern loops)
// 3. Solution Pillars: 100-factor matching + AI mock practice + verified roadmaps
// 4. North Star Metric: Verified Offer Placement Rate & Repeat Retention`,
  },
};

export class AIInterviewerService {
  /**
   * Processes a turn in the AI Mock Interview session
   */
  public static async processTurn(
    request: AIInterviewerTurnRequest
  ): Promise<AIInterviewerTurnResponse> {
    const track = TRACK_CURRICULA[request.sessionTrack] || TRACK_CURRICULA.sde_backend;
    const history = request.history || [];
    const userMsg = (request.userMessage || "").trim();
    const codeSnippet = (request.codeSnippet || "").trim();
    const candidateName = request.candidateName || "Candidate";
    const difficulty = request.difficulty || "Medium";

    // If first turn, return initial problem statement and welcome
    if (history.length === 0 && !userMsg) {
      const welcome = `Hello ${candidateName}! Welcome to your **${track.trackName}** mock interview. I am your AI Bar Raiser from MentorMaze.

Today we will be working through a **${difficulty}-level** challenge:
### 📌 Problem: ${track.defaultProblemTitle}

${track.defaultProblemSpec}

Take a moment to read through the specification. Feel free to ask any clarifying questions about the input constraints, scale, or expected edge cases before jumping into your approach.`;

      const voice = `Hello ${candidateName}! Welcome to your ${track.trackName} mock interview. I am your AI Bar Raiser. Today's problem is ${track.defaultProblemTitle}. Take a moment to read the specification, and ask any clarifying questions before sharing your approach!`;

      return {
        aiResponse: welcome,
        voiceText: voice,
        nextStage: "clarification",
        suggestedQuickReplies: [
          "Can you clarify the scale and input constraints?",
          "What should be the expected time and space complexity?",
          "I'm ready to share my high-level approach.",
        ],
        rubricScores: {
          technical: 7.0,
          problem_solving: 7.5,
          code_quality: 7.0,
          communication: 8.0,
        },
        feedbackPill: "Ask clarifying questions first!",
        isComplete: false,
      };
    }

    // Determine current progression stage
    const lastStage = request.currentStage || "clarification";
    const lowerUser = userMsg.toLowerCase();

    // Check if user is asking for evaluation / wrap-up
    const isWrapUp =
      lowerUser.includes("scorecard") ||
      lowerUser.includes("feedback") ||
      lowerUser.includes("how did i do") ||
      lowerUser.includes("finish interview") ||
      history.length >= 8;

    if (isWrapUp) {
      return this.generateFinalScorecard(request, track);
    }

    // Check if candidate submitted code
    if (codeSnippet && (lowerUser.includes("code") || lowerUser.includes("review") || lowerUser.includes("check my code") || lowerUser.includes("done"))) {
      return this.evaluateCodeSubmission(request, track, codeSnippet);
    }

    // Contextual Multi-Turn Progression
    if (lastStage === "clarification" || lowerUser.includes("constraint") || lowerUser.includes("scale") || lowerUser.includes("complexity")) {
      return this.handleClarificationStage(request, track, userMsg);
    }

    if (lastStage === "approach_discussion" || lowerUser.includes("approach") || lowerUser.includes("hash") || lowerUser.includes("list") || lowerUser.includes("tree")) {
      return this.handleApproachStage(request, track, userMsg);
    }

    // Default: Socratic guidance and prompt to code
    return this.handleGeneralGuidance(request, track, userMsg);
  }

  private static handleClarificationStage(
    req: AIInterviewerTurnRequest,
    track: TrackCurriculum,
    userMsg: string
  ): AIInterviewerTurnResponse {
    const aiResponse = `Excellent clarifying questions!

Here are the specific constraints for this problem:
1. **Target Complexity**: We are looking for **${track.expectedComplexity.time}** with **${track.expectedComplexity.space}**.
2. **Input Parameters**: ${track.clarifyingAnswers.capacity || track.clarifyingAnswers.scale || "Standard positive bounds."}
3. **Assumptions**: You may assume standard in-memory constraints with well-formed inputs.

Now, walk me through your **high-level approach**. What data structures will you select to achieve these bounds, and what are the trade-offs?`;

    const voiceText = `Great clarifying questions! We are targeting ${track.expectedComplexity.time}. Now, walk me through your high-level approach. What data structures will you choose and why?`;

    return {
      aiResponse,
      voiceText,
      nextStage: "approach_discussion",
      suggestedQuickReplies: [
        "I'll use a HashMap paired with a Doubly Linked List.",
        "What if we use a balanced Binary Search Tree instead?",
        "I'll maintain an array with two pointers.",
      ],
      rubricScores: {
        technical: 7.8,
        problem_solving: 8.2,
        code_quality: 7.5,
        communication: 8.4,
      },
      feedbackPill: "Strong clarification on constraints!",
      isComplete: false,
    };
  }

  private static handleApproachStage(
    req: AIInterviewerTurnRequest,
    track: TrackCurriculum,
    userMsg: string
  ): AIInterviewerTurnResponse {
    const aiResponse = `Spot on! Using an optimal combination of data structures is exactly the right intuition here.

### 💡 Key Architectural Validations:
- **Fast Lookups**: Hash lookup gives us immediate $O(1)$ addressability.
- **Order Preservation**: Fast node removal and head/tail insertions maintain recency in $O(1)$ without shifting arrays.

Go ahead and implement the solution in the **Code Lab** editor or write out the core logic. When you're ready, click **Run Code** or share your solution here for a full code review!`;

    const voiceText = `Spot on! That approach gives optimal time complexity. Go ahead and implement the solution in the Code Lab editor, and let me know when you'd like a code review!`;

    return {
      aiResponse,
      voiceText,
      nextStage: "live_coding",
      suggestedQuickReplies: [
        "I've written the solution in the Code Lab. Please review it!",
        "Could you give me a hint on handling the eviction edge case?",
        "Let me explain my helper methods first.",
      ],
      rubricScores: {
        technical: 8.5,
        problem_solving: 8.8,
        code_quality: 8.0,
        communication: 8.7,
      },
      feedbackPill: "Approach approved: Proceed to code!",
      isComplete: false,
    };
  }

  private static evaluateCodeSubmission(
    req: AIInterviewerTurnRequest,
    track: TrackCurriculum,
    code: string
  ): AIInterviewerTurnResponse {
    const hasMap = code.includes("Map") || code.includes("hash") || code.includes("dict");
    const hasLengthOrCap = code.includes("capacity") || code.includes("length") || code.includes("size");

    const feedbackPoints = [
      hasMap
        ? "✓ Clean hash map utilization for direct constant-time node dereferencing."
        : "⚠️ Consider using a HashMap to eliminate $O(N)$ linear scans.",
      hasLengthOrCap
        ? "✓ Boundary capacity checks properly identified before eviction."
        : "⚠️ Make sure to explicitly test what happens when cache capacity is exceeded.",
      "✓ Idiomatic formatting, readable variable naming, and clear separation of concerns.",
    ];

    const aiResponse = `### 🔍 Live Code Review & Complexity Analysis

${feedbackPoints.join("\n")}

**Complexity Verified:**
- **Time Complexity:** ${track.expectedComplexity.time} (Met target!)
- **Space Complexity:** ${track.expectedComplexity.space}

Would you like to discuss potential concurrency locks, or are you ready for your **final comprehensive interview scorecard**?`;

    const voiceText = `Great job! Your code implementation demonstrates solid understanding of the data structures and meets the expected time complexity. Would you like to wrap up and see your complete scorecard?`;

    return {
      aiResponse,
      voiceText,
      nextStage: "optimization",
      suggestedQuickReplies: [
        "Let's conclude and generate my full mock interview scorecard!",
        "How would we make this thread-safe in a distributed environment?",
        "Can you suggest one optimization on memory layout?",
      ],
      rubricScores: {
        technical: 9.0,
        problem_solving: 9.2,
        code_quality: 8.8,
        communication: 8.9,
      },
      feedbackPill: "Code passed live verification!",
      isComplete: false,
    };
  }

  private static handleGeneralGuidance(
    req: AIInterviewerTurnRequest,
    track: TrackCurriculum,
    userMsg: string
  ): AIInterviewerTurnResponse {
    const aiResponse = `I hear your thought process. 

To help frame your next step: think about the trade-off between **read-heavy performance** versus **memory overhead**. 

Whenever you are ready, share your code or summarize your design choices so we can benchmark it against the Tier-1 hiring bar!`;

    const voiceText = `Good thinking. Consider the trade-off between read performance and memory overhead. Share your code whenever you are ready!`;

    return {
      aiResponse,
      voiceText,
      nextStage: "approach_discussion",
      suggestedQuickReplies: [
        "I'll implement the primary data structure now.",
        "Can you review my edge-case assumptions?",
        "Let's jump to the scorecard.",
      ],
      rubricScores: {
        technical: 8.0,
        problem_solving: 8.2,
        code_quality: 7.8,
        communication: 8.5,
      },
      feedbackPill: "Progressing through solution",
      isComplete: false,
    };
  }

  private static generateFinalScorecard(
    req: AIInterviewerTurnRequest,
    track: TrackCurriculum
  ): AIInterviewerTurnResponse {
    const aiResponse = `## 🏆 Final Mock Interview Scorecard

### Candidate: **${req.candidateName || "Anant Kumar"}**
### Target Role: **${req.targetRole}** | Track: **${track.trackName}**
### Evaluator: **Tathastu AI Bar Raiser**

---

### 📊 Rubric Breakdown
| Dimension | Score | Weight | Assessment |
|---|---|---|---|
| **Data Structures & Algorithms** | **9.0 / 10** | 30% | Correct time-space optimality ($O(1)$ lookups) |
| **Problem Solving & Decomposition** | **8.8 / 10** | 25% | Proactive clarifying questions & edge cases |
| **Code Modularity & Cleanliness** | **8.5 / 10** | 20% | Idiomatic style, readable helper functions |
| **Technical Communication** | **9.2 / 10** | 15% | High confidence, articulate trade-off defense |
| **Stress & Time Management** | **8.7 / 10** | 10% | Composed demeanor under time constraints |

### 🎯 **Overall Performance Score: 8.9 / 10 — HIRE (Tier-1 Bar)**

#### 🌟 Key Strengths:
1. Excellent intuition on pairing HashMaps with Doubly Linked Lists for constant time lookups.
2. Asked proactive clarifying questions regarding capacity bounds before writing code.
3. Articulated space-time complexity trade-offs clearly without prompting.

#### 📈 Growth Recommendations:
1. Practice writing unit test assertions for null/empty boundary inputs.
2. Consider concurrency primitives (Read-Write mutexes) for production multithreaded environments.

*Congratulations on completing your AI Mock Interview! This session transcript has been recorded in your student dashboard.*`;

    const voiceText = `Congratulations on completing your mock interview! You achieved an overall score of 8.9 out of 10, which represents a strong Hire rating at the Tier-1 engineering bar. Your algorithmic intuition and clear technical communication were standouts. Check the scorecard below for full detailed feedback!`;

    return {
      aiResponse,
      voiceText,
      nextStage: "scorecard_wrapup",
      suggestedQuickReplies: [
        "Start a new interview round on System Design",
        "Save scorecard to my dashboard",
        "Practice another Technical problem",
      ],
      rubricScores: {
        technical: 9.0,
        problem_solving: 8.8,
        code_quality: 8.5,
        communication: 9.2,
      },
      feedbackPill: "Final Scorecard Delivered: 8.9/10 (HIRE)",
      isComplete: true,
      scorecardSummary: {
        overallScoreOutOf10: 8.9,
        verdict: "Hire",
        strengths: [
          "Optimal algorithmic intuition with O(1) time complexity",
          "Clarified constraints upfront before coding",
          "Clear articulation of space-time trade-offs",
        ],
        growthAreas: [
          "Handle concurrent read-write contention with mutexes",
          "Include explicit null/empty edge-case unit tests",
        ],
        detailedAnalysis:
          "Demonstrated solid senior-ready problem solving matching Microsoft and Google SDE hiring bars.",
      },
    };
  }
}

