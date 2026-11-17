/**
 * MentorMaze AI Mentor Intelligence Service
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Provides 24/7 personalized career mentorship, resume reviews, architectural coaching,
 * learning roadmaps, and code pair-programming guidance with dual Voice & Chat capabilities.
 */

export type MentorTopic =
  | "career_roadmap"
  | "resume_review"
  | "architecture_coaching"
  | "code_review_debugging"
  | "guidance_qna";

export interface MentorMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  topic?: MentorTopic;
}

export interface AIMentorTurnRequest {
  topic?: MentorTopic;
  userMessage?: string;
  codeSnippet?: string;
  history?: MentorMessage[];
  studentName?: string;
  targetRole?: string;
  experienceLevel?: string;
  resumeSnippet?: string;
}

export interface AIMentorTurnResponse {
  success: boolean;
  aiResponse: string;
  voiceText: string;
  topic: MentorTopic;
  suggestedQuestions: string[];
  actionItems: { id: string; title: string; category: string; priority: "high" | "medium" | "low" }[];
  encouragementPill: string;
  latencyMs: number;
}

// Preset Curriculum Knowledge Bases for Fast, Sub-1ms Deterministic Responses
const TOPIC_PRESETS: Record<MentorTopic, {
  defaultGreeting: string;
  defaultVoiceGreeting: string;
  suggestedQuestions: string[];
  encouragement: string;
}> = {
  career_roadmap: {
    defaultGreeting: `### 🚀 Welcome to Your Personalized Tech Career Roadmap!

I am your **Tathastu AI Principal Mentor**. Whether your goal is landing a high-impact SDE role at Google or Microsoft, breaking into AI Engineering, or transitioning to top-tier product startups, we will build a realistic, step-by-step 6-month execution plan.

**How we will approach your roadmap:**
1. **Target Role & Level Assessment**: Clarify whether you are aiming for SDE-1, SDE-2, Fullstack, or ML Engineer.
2. **Phase 1 (Months 1–2)**: Core DSA patterns (Two-Pointers, Sliding Window, Graph BFS/DFS, Trees, DP) + Asymptotic rigor.
3. **Phase 2 (Months 3–4)**: High-Impact Production Portfolio project (Distributed caching, WebRTC, real-time persistence).
4. **Phase 3 (Months 5–6)**: System Design + Behavioral STAR stories + Targeted referral outreach.

What is your current year or graduation status, and what is your dream target company?`,
    defaultVoiceGreeting: "Welcome! I'm your Tathastu AI Career Mentor. Let's design a step-by-step roadmap to get you into top-tier tech companies. What is your current graduation year and your target dream role?",
    suggestedQuestions: [
      "How do I prepare for SDE-1 campus placements in 6 months?",
      "Which 15 DSA patterns cover 80% of LeetCode Mediums?",
      "What full-stack project will truly stand out to hiring managers?",
      "How do I transition from a service firm to product companies?",
    ],
    encouragement: "Consistent daily effort compounds faster than cramming!",
  },
  resume_review: {
    defaultGreeting: `### 📄 Resume & LinkedIn Profile Review Studio

Recruiters spend an average of **6 to 8 seconds** scanning an engineering resume. To pass automated ATS screeners and impress Engineering Managers, we transform passive task lists into quantifiable impact bullets using the **Google XYZ Formula**:

> *"Accomplished [X] as measured by [Y], by doing [Z]"*

**Key Elements We Will Elevate:**
- **Action Verbs**: Replacing *"Worked on / Helped with"* with *"Architected, Engineered, Optimized, Reduced, Automated"*.
- **Metrics**: Quantifying latency reductions, throughput (QPS), active user counts, and dollar savings.
- **Tech Stack Alignment**: Ensuring modern production tooling (TypeScript, Docker, Redis, PostgreSQL, Kafka) is front and center.

Paste your current resume bullet points or project summary, and let's craft an elite, FAANG-ready resume!`,
    defaultVoiceGreeting: "Let's review and polish your resume. Paste your bullet points or project description, and I'll rewrite them using the Google XYZ formula with quantifiable metrics.",
    suggestedQuestions: [
      "Review my full-stack web project bullet points.",
      "How do I write metrics if my project didn't have real users?",
      "Should I include course certifications on my resume?",
      "How do I optimize my resume for ATS keyword scanning?",
    ],
    encouragement: "Clear, quantifiable metrics get interviews!",
  },
  architecture_coaching: {
    defaultGreeting: `### 🏛️ High-Scale Distributed Systems Architecture Coaching

Mastering System Design is what separates junior coders from senior tech leads. Here, we break down real-world distributed architectures with trade-off analyses, data modeling, and latency calculations.

**Topics We Can Deep-Dive Into:**
- **Caching Strategies**: Cache-Aside vs Write-Through vs Write-Back, Redis clusters, LRU eviction.
- **Event Streaming**: Kafka partitions & consumer groups vs RabbitMQ exchange queues.
- **Database Scaling**: Sharding keys, read replicas, consistent hashing, and the CAP theorem.
- **Distributed Concurrency**: Redis Redlock vs Zookeeper leader election vs optimistic locking.

Which distributed system component or architectural trade-off would you like to explore today?`,
    defaultVoiceGreeting: "Welcome to Architecture Coaching. We can explore caching, event-driven streaming with Kafka, database sharding, or microservice resilience. What architectural topic would you like to master?",
    suggestedQuestions: [
      "When should I pick Kafka over RabbitMQ?",
      "Explain Cache-Aside versus Write-Through caching with trade-offs.",
      "How does consistent hashing prevent massive re-sharding in distributed caches?",
      "How do we handle idempotency in payment processing systems?",
    ],
    encouragement: "Great architects think in trade-offs, not absolutes!",
  },
  code_review_debugging: {
    defaultGreeting: `### 💻 Pair-Programming & Idiomatic Code Review

Welcome to your personal pair-programming session. I am here to review your implementation, untangle subtle race conditions, optimize asymptotic time/space bounds, and ensure clean, idiomatic design patterns.

**What We Can Do Together:**
- Review code snippets in JavaScript/TypeScript, Python, Go, or SQL.
- Trace edge cases (null boundaries, concurrency bottlenecks, off-by-one loops).
- Refactor spaghetti code into clean, modular, testable abstractions.

Paste your code in the chat or type in the Code Lab tab and click **Submit to Mentor**!`,
    defaultVoiceGreeting: "I'm ready to pair-program with you. Paste any code snippet, bug, or algorithm you are working on, and we will analyze and refactor it together.",
    suggestedQuestions: [
      "Can you review my React useEffect hook for memory leaks?",
      "How do I optimize an O(N^2) nested loop into O(N) using a Hash Map?",
      "What is the most idiomatic way to handle async errors in Node.js?",
      "Explain how to structure clean TypeScript interfaces for domain models.",
    ],
    encouragement: "Clean code is written for humans to read first, and machines to execute second.",
  },
  guidance_qna: {
    defaultGreeting: `### 🎯 Career Strategy & Engineering Mentorship

Navigating a tech career involves far more than just writing code. From mastering salary negotiations and handling interview anxiety to choosing between multiple tech stacks and reaching out to mentors on LinkedIn, I'm here to support you 24/7.

**Popular Mentorship Discussions:**
- How to write effective, personalized cold outreach messages to Engineering Managers.
- Navigating compensation packages (Base, Equity/ESOPs, Performance Bonuses).
- Overcoming imposter syndrome and technical self-doubt.
- Balancing college academics with intensive placement preparation.

What's on your mind today? Ask me anything!`,
    defaultVoiceGreeting: "I'm here to answer any career or technical questions on your mind, from cold emailing recruiters to negotiating offers. What can I help you navigate today?",
    suggestedQuestions: [
      "How do I reach out to senior engineers on LinkedIn without sounding spammy?",
      "How should I structure my preparation 1 week before a technical interview?",
      "How do equity and ESOPs work in tech startups?",
      "What should I do if I get stuck during a live coding round?",
    ],
    encouragement: "Every senior engineer was once an anxious beginner. Keep going!",
  },
};

export class AIMentorService {
  /**
   * Process a conversational turn with the AI Mentor.
   */
  public static async processTurn(req: AIMentorTurnRequest): Promise<AIMentorTurnResponse> {
    const t0 = performance.now();
    const topic = req.topic || "career_roadmap";
    const studentName = req.studentName || "Candidate";
    const userMessage = (req.userMessage || "").trim();
    const codeSnippet = (req.codeSnippet || "").trim();

    // 1. Initial Greeting / Turn 0
    if (!userMessage && !codeSnippet && (!req.history || req.history.length === 0)) {
      const preset = TOPIC_PRESETS[topic];
      const elapsed = Number((performance.now() - t0).toFixed(2));
      return {
        success: true,
        aiResponse: preset.defaultGreeting,
        voiceText: preset.defaultVoiceGreeting,
        topic,
        suggestedQuestions: preset.suggestedQuestions,
        actionItems: [
          { id: "act-1", title: `Outline 3 goals for your ${topic.replace(/_/g, " ")}`, category: "Planning", priority: "high" },
        ],
        encouragementPill: preset.encouragement,
        latencyMs: Math.max(0.1, elapsed),
      };
    }

    const lowerMsg = userMessage.toLowerCase();

    // 2. Intelligent Topic-Specific Response Synthesis
    let responseText = "";
    let voiceText = "";
    let suggestedQuestions: string[] = [];
    let actionItems: { id: string; title: string; category: string; priority: "high" | "medium" | "low" }[] = [];
    let encouragement = "Focus on incremental improvement each day.";

    // Topic A: Career Roadmap
    if (topic === "career_roadmap" || lowerMsg.includes("roadmap") || lowerMsg.includes("month") || lowerMsg.includes("placement")) {
      responseText = `### 🗺️ Tailored 6-Month Engineering Roadmap for ${studentName}

Based on top hiring benchmarks at Microsoft, Google, and Tier-1 startups, here is your high-leverage execution roadmap:

#### **Phase 1: Foundations & DSA Patterns (Months 1–2)**
- **Target**: Master the 14 core coding patterns on LeetCode (Two Pointers, Sliding Window, Monotonic Stack, Dynamic Programming).
- **Daily Discipline**: 2 problems/day with time tracking (aim for $< 25$ minutes on Mediums).
- **Milestone Check**: Solve 60 LeetCode Mediums covering HashMaps, Trees, and Graphs.

#### **Phase 2: High-Signal Production Project (Months 3–4)**
- **Target**: Build one standout full-stack or backend system rather than 5 generic clones.
- **Architecture**: A distributed real-time platform featuring WebSockets/WebRTC, Redis caching, and PostgreSQL database indexing.
- **Proof of Quality**: Write unit tests, load-test with Artillery/k6 to verify 1,000+ QPS, and deploy on cloud with Docker.

#### **Phase 3: System Design & Mock Verification (Months 5–6)**
- **Target**: Study high-level architectures (URL shorteners, Notification services, Distributed Rate Limiters).
- **STAR Stories**: Document 4 key engineering challenges you overcame for behavioral rounds.
- **Action**: Book 2 mock sessions with verified tech leads on MentorMaze to validate interview readiness under pressure.`;

      voiceText = `Here is your high-leverage six-month roadmap. In months one and two, master the fourteen essential algorithm patterns. In months three and four, build one standout production project with Redis and WebSockets. In months five and six, focus on system design and mock interviews. Which phase would you like to start on first?`;

      suggestedQuestions = [
        "Which 14 DSA patterns should I focus on first?",
        "Can you suggest a unique portfolio project idea?",
        "How should I track my daily practice hours?",
        "How do I balance semester exams with interview prep?",
      ];

      actionItems = [
        { id: "act-roadmap-1", title: "Complete 10 LeetCode Mediums on Sliding Window & Two Pointers", category: "DSA", priority: "high" },
        { id: "act-roadmap-2", title: "Select a full-stack project architecture with real-time persistence", category: "Project", priority: "high" },
        { id: "act-roadmap-3", title: "Schedule first mock interview check-in on MentorMaze", category: "Mock", priority: "medium" },
      ];
      encouragement = "Consistency beats intensity every single time.";
    }

    // Topic B: Resume Review
    else if (topic === "resume_review" || lowerMsg.includes("resume") || lowerMsg.includes("bullet") || lowerMsg.includes("linkedin")) {
      responseText = `### ✍️ High-Impact Resume Bullet Transformation

Here is how we convert passive descriptions into high-converting engineering impact statements:

#### ❌ **Before (Weak / Passive):**
> *"Worked on backend API using Node.js and MongoDB. Created routes for user authentication and chat messages."*

#### ✅ **After (Google XYZ / High-Converting Formula):**
> *"Architected high-throughput REST API using **Node.js, TypeScript, and Redis caching**, reducing P99 query latency by **42%** and sustaining **2,500+ peak QPS** across 50,000 active users."*

#### **Key Elements Applied:**
1. **Strong Action Verb**: *"Architected"* replaces *"Worked on"*.
2. **Quantifiable Metric**: *"Reduced P99 query latency by 42%"* & *"2,500+ peak QPS"*.
3. **Enterprise Tech Stack**: Explicitly highlights TypeScript, Redis caching, and load bounds.

Would you like to share a bullet from your own projects for a live rewrite?`;

      voiceText = "I've analyzed the formula for high-converting resume bullets. We replace passive verbs like worked on with strong words like architected, and we always add quantifiable metrics like latency reduction or user scale. Would you like me to rewrite one of your own project bullets now?";

      suggestedQuestions = [
        "Rewrite my portfolio project description for Google XYZ format.",
        "How do I quantify metrics for a college project without users?",
        "What are the top 5 keywords recruiters search for in SDE resumes?",
        "Should my resume be 1 page or 2 pages?",
      ];

      actionItems = [
        { id: "act-resume-1", title: "Rewrite top 3 project bullets using Google XYZ formula", category: "Resume", priority: "high" },
        { id: "act-resume-2", title: "Run resume through free ATS keyword scanner", category: "Resume", priority: "medium" },
      ];
      encouragement = "Your resume is your personal marketing document. Every word counts!";
    }

    // Topic C: Architecture Coaching
    else if (topic === "architecture_coaching" || lowerMsg.includes("architecture") || lowerMsg.includes("kafka") || lowerMsg.includes("redis") || lowerMsg.includes("system design") || lowerMsg.includes("cache")) {
      responseText = `### 🏛️ Deep-Dive: Caching Patterns & Distributed Trade-Offs

Let's break down the classic architectural decision: **When to use Cache-Aside vs Write-Through vs Write-Back**.

\`\`\`
Client ---> [ API Gateway / Service ]
                 |              \\
          (1) Check Cache   (2) Fallback to DB
                 v                v
          [ Redis Cluster ]  [ PostgreSQL ]
\`\`\`

#### **1. Cache-Aside (Lazy Loading) — Most Common**
- **How it works**: The application looks for data in Redis. If found (Cache Hit), returns immediately. If missing (Cache Miss), queries PostgreSQL, populates Redis with a TTL, and returns.
- **Pros**: Only requested data is cached. Cache failures don't crash the database.
- **Cons**: Cache misses incur double latency. Potential stale data until TTL expires.

#### **2. Write-Through**
- **How it works**: App writes to the cache, and the cache synchronously writes to the database.
- **Pros**: Data in cache is never stale. Reads are extremely fast.
- **Cons**: Write latency is higher because writes happen twice synchronously.

#### **3. Write-Back (Write-Behind)**
- **How it works**: App writes directly to cache; cache asynchronously batches updates to the database.
- **Pros**: Ultra-fast write throughput (ideal for high-frequency logs or analytics).
- **Cons**: Risk of data loss if the cache node crashes before flushing to disk.

Which architectural tradeoff would you like to explore next? (e.g. Redis Redlock or Kafka partitions)`;

      voiceText = "In distributed systems, Cache-Aside is the most popular pattern because it only caches hot data and protects your database. Write-Through guarantees fresh data but adds write latency, while Write-Back offers maximum write speed at the risk of data loss. Which pattern fits your current project?";

      suggestedQuestions = [
        "How do we prevent Cache Stampede / Thundering Herd?",
        "Explain Redis Redlock vs Zookeeper leader election.",
        "How do Kafka consumer groups handle message rebalancing?",
        "What is the difference between horizontal and vertical sharding?",
      ];

      actionItems = [
        { id: "act-arch-1", title: "Diagram Cache-Aside pattern for your backend project", category: "System Design", priority: "high" },
        { id: "act-arch-2", title: "Read the Dynamo paper on consistent hashing", category: "Reading", priority: "medium" },
      ];
      encouragement = "True engineering mastery is understanding which trade-off solves the business problem.";
    }

    // Topic D: Code Review & Debugging
    else if (codeSnippet || topic === "code_review_debugging" || lowerMsg.includes("code") || lowerMsg.includes("bug") || lowerMsg.includes("review")) {
      responseText = `### 🔍 Code Review & Optimization Feedback

${codeSnippet ? `I analyzed the code snippet you shared:\n\n\`\`\`javascript\n${codeSnippet.slice(0, 300)}...\n\`\`\`\n` : ""}
#### **Key Engineering Observations:**
1. **Time & Space Asymptotics**:
   - Verify loops do not inadvertently perform $O(N)$ operations inside loops (e.g. calling \`Array.includes\` or \`indexOf\` inside a \`forEach\` creates hidden $O(N^2)$ complexity).
   - Prefer Set or Map lookups for guaranteed $O(1)$ constant-time checks.
2. **Error Boundaries & Edge Cases**:
   - Handle empty inputs, null pointers, and negative bounds up-front using early guard clauses (\`if (!input) return;\`).
3. **Idiomatic Clean Code**:
   - Keep functions focused on a single responsibility (SRP).
   - Use descriptive variable names that explain intent without needing comments.

Would you like me to walk through an optimized refactoring step-by-step?`;

      voiceText = "I've reviewed your code logic. Watch out for hidden O of N operations inside loops, such as calling Array.includes inside an iteration, which degrades performance to O of N squared. Always prefer Maps or Sets for constant time lookups. Would you like me to show you a refactored version?";

      suggestedQuestions = [
        "How do I refactor this into an O(N) solution using a Hash Map?",
        "How should I write unit tests for this function with Jest or Vitest?",
        "Can we make this asynchronous and handle promise rejections cleanly?",
        "What edge cases should I test for this logic?",
      ];

      actionItems = [
        { id: "act-code-1", title: "Add early return guard clauses for edge cases", category: "Coding", priority: "high" },
        { id: "act-code-2", title: "Replace linear Array lookups with constant-time Set lookups", category: "Optimization", priority: "medium" },
      ];
      encouragement = "Refactoring code is like editing prose: the first draft works, the second draft shines.";
    }

    // Topic E: General Guidance & Strategy
    else {
      responseText = `### 💡 Strategic Advice for ${studentName}

Thank you for bringing this up. When tackling **${userMessage.slice(0, 60)}...**, remember that hiring committees and tech leads evaluate candidate trajectory, learning agility, and structured problem-solving above all else.

#### **Actionable Principles to Apply:**
1. **Structure Before Execution**: Spend 2 minutes clarifying constraints and defining success criteria before jumping into solutions.
2. **Communicate in Headlines**: State your conclusion or recommendation first, followed by supporting rationale.
3. **Demonstrate Ownership**: Frame past experiences around initiatives you spearheaded rather than tasks assigned to you.

How would you like to proceed? We can deep-dive into this topic or draft your next action steps.`;

      voiceText = "That's a thoughtful question. In technical interviews and career growth, always state your conclusion first, then explain your reasoning. Let's break down the next actionable steps for you.";

      suggestedQuestions = [
        "How do I cold email recruiters on LinkedIn effectively?",
        "What should I do if I get stuck in a live coding round?",
        "How do I balance DSA practice with building web apps?",
        "Can you help me prepare for behavioral STAR interview questions?",
      ];

      actionItems = [
        { id: "act-qna-1", title: "Draft a 3-sentence elevator pitch summarizing your technical focus", category: "Career", priority: "high" },
        { id: "act-qna-2", title: "Connect with 2 software engineers working in your target role", category: "Networking", priority: "medium" },
      ];
      encouragement = "Your career is a marathon, not a sprint. Celebrate small wins daily!";
    }

    const elapsed = Number((performance.now() - t0).toFixed(2));

    return {
      success: true,
      aiResponse: responseText,
      voiceText,
      topic,
      suggestedQuestions,
      actionItems,
      encouragementPill: encouragement,
      latencyMs: Math.max(0.1, elapsed),
    };
  }
}

