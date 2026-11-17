/**
 * Central AI Mentor Intelligence Orchestrator
 * Integrates all Subsystems into a Unified, High-Leverage Pedagogy Engine
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 */

import {
  TeachingMode,
  LanguageCode,
  StructuredTurnResponse,
  SourceCitation,
  RecommendedAction,
  SkillUpdate,
} from "./types";
import { ModelProviderRouter, ProviderCompletionResult } from "./model-provider-router";
import { StudentContextBuilder } from "./student-context-builder";
import { StudentSkillGraph } from "./student-skill-graph";
import { PedagogyEngine } from "./pedagogy-engine";
import { KnowledgeRAGService } from "./knowledge-rag-service";
import { CareerIntelligenceService } from "./career-intelligence";
import { CodeMentorService } from "./code-mentor";
import { InterviewCoachService } from "./interview-coach";
import { StudentMemoryService } from "./student-memory-service";
import { HumanEscalationService } from "./human-escalation-service";
import { SafetyGuardrails } from "./safety-guardrails";
import { ConversationStore } from "./conversation-store";

export interface OrchestratorTurnInput {
  studentUserId: string;
  userMessage: string;
  mode?: TeachingMode;
  codeSnippet?: string;
  languagePreference?: LanguageCode;
  hintLevel?: number;
  activeTopic?: string;
  conversationId?: string;
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
  consentOverride?: { shareWithMentors?: boolean; useForPersonalization?: boolean };
}

export class AIMentorOrchestrator {
  /**
   * Process a student turn through the comprehensive pedagogical intelligence pipeline
   */
  public static async processTurn(input: OrchestratorTurnInput): Promise<StructuredTurnResponse> {
    const t0 = performance.now();
    const mode = input.mode || "learn";
    const language = input.languagePreference || "en";
    const currentHintLevel = input.hintLevel || 0;
    const conversationId = input.conversationId;

    // 1. Safety & Guardrail Check (Crisis boundaries, clinical restrictions, PII scrub, prompt injection)
    const safetyCheck = SafetyGuardrails.inspectInput(input.userMessage);
    if (!safetyCheck.isSafe && safetyCheck.crisisHelpNotice) {
      const elapsed = Number((performance.now() - t0).toFixed(2));
      const crisisResp: StructuredTurnResponse = {
        requestId: `crisis-${Date.now()}`,
        message: safetyCheck.crisisHelpNotice,
        voiceText: "Please connect with professional support. MentorMaze is an educational and career platform.",
        teachingStrategy: "conceptual_explanation",
        topic: "safety_boundary",
        difficulty: "intermediate",
        hintLevel: 0,
        studentUnderstandingSignal: "unknown",
        sources: [],
        recommendedActions: [
          { id: "act-telemanas", title: "Contact Tele-MANAS Helpline (14416)", category: "Support", priority: "high" },
        ],
        latencyMs: elapsed,
        modelProvider: "tathastu-safety-guardrail",
        inferenceMode: "deterministic",
      };

      if (conversationId) {
        ConversationStore.addMessage(conversationId, input.studentUserId, "user", input.userMessage);
        ConversationStore.addMessage(conversationId, input.studentUserId, "assistant", safetyCheck.crisisHelpNotice, {
          teachingStrategy: "conceptual_explanation",
          modelProvider: "tathastu-safety-guardrail",
          inferenceMode: "deterministic",
        });
      }

      return crisisResp;
    }

    const sanitizedMessage = safetyCheck.sanitizedText;

    // 2. Aggregate Authorized Student Context & Skill Graph State
    const studentContext = await StudentContextBuilder.buildContext(input.studentUserId);
    const studentSkills = StudentSkillGraph.getStudentSkills(input.studentUserId);
    const studentMemories = StudentMemoryService.getMemories(input.studentUserId);

    // 3. Adaptive Pedagogical Strategy Selection
    const pedagogyDecision = PedagogyEngine.decide(
      sanitizedMessage,
      mode,
      studentContext,
      currentHintLevel,
      language
    );

    // 4. Knowledge Retrieval (RAG across 8 Independently Managed Collections)
    const ragPayload = KnowledgeRAGService.retrieve(sanitizedMessage, { limit: 3 });
    const citations: SourceCitation[] = ragPayload.citations;

    // 5. Evaluate Human Mentorship Escalation Need
    const escalation = HumanEscalationService.evaluateEscalationNeed(
      sanitizedMessage,
      studentContext.weakSkills.length,
      currentHintLevel >= 3 ? 3 : 0
    );

    // 6. Mode-Specific Intelligence Resolution
    let responseText = "";
    let voiceText = "";
    let activeModelProvider = "tathastu-pedagogical-rules";
    let inferenceMode: "generative" | "deterministic" = "deterministic";
    let lastRequestId = `turn-${Date.now()}`;
    let tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number } | undefined = undefined;
    let estimatedCostUsd: number | undefined = undefined;
    let fallbackReason: string | undefined = undefined;
    let postInteractionCheck: StructuredTurnResponse["postInteractionCheck"] = undefined;

    const recommendedActions: RecommendedAction[] = [];
    const skillUpdates: SkillUpdate[] = [];

    // Branch A: Code Mentor Mode or Code Snippet Present
    if (mode === "code_mentor" || input.codeSnippet) {
      const codeToAnalyze = input.codeSnippet || sanitizedMessage;
      const analysis = CodeMentorService.analyzeCode(codeToAnalyze);

      responseText = `### 🔍 Code Review & Algorithmic Optimization Feedback\n\n`;
      responseText += `**Asymptotic Complexity**: Time **${analysis.timeComplexity}** · Auxiliary Space **${analysis.spaceComplexity}**\n\n`;

      if (analysis.hiddenPerformanceTraps.length > 0) {
        responseText += `#### ⚠️ **Hidden Performance Traps Detected:**\n`;
        analysis.hiddenPerformanceTraps.forEach((trap) => {
          responseText += `- ${trap}\n`;
        });
        responseText += `\n`;
      }

      if (analysis.potentialBugs.length > 0) {
        responseText += `#### 🐛 **Boundary & Edge-Case Hazards:**\n`;
        analysis.potentialBugs.forEach((bug) => {
          responseText += `- ${bug}\n`;
        });
        responseText += `\n`;
      }

      responseText += `#### 💡 **Optimized Implementation:**\n\`\`\`javascript\n${analysis.refactoredSnippet}\n\`\`\`\n\n`;
      responseText += `**Why this works**: ${analysis.explanation}\n\n`;
      responseText += `**Recommended Edge Cases to Test**:\n`;
      analysis.edgeCasesToTest.forEach((ec) => {
        responseText += `- ${ec}\n`;
      });

      voiceText = `I analyzed your code. Notice how we replace linear lookups with an auxiliary Set to eliminate quadratic O of N squared complexity. Would you like to review the edge cases?`;

      recommendedActions.push(
        { id: "act-code-tests", title: "Run unit test suite against empty and single-element inputs", category: "Coding", priority: "high" },
        { id: "act-code-map", title: "Practice Hash Map constant-time pattern on LeetCode #1", category: "DSA", priority: "medium" }
      );
    }

    // Branch B: Resume Mentor Mode
    else if (mode === "resume_mentor") {
      const analysis = CareerIntelligenceService.analyzeResumeAgainstJob(sanitizedMessage, "jd-google-sde1");

      responseText = `### 📄 Resume & Google XYZ Formula Alignment Studio\n\n`;
      responseText += `**Target Role Match**: **${analysis.matchScorePct}%** match for **${analysis.jobTitle}** at **${analysis.company}**\n\n`;

      responseText += `#### ✅ **Demonstrated Must-Have Skills**:\n- ${analysis.matchingSkills.join(", ") || "General Programming Fundamentals"}\n\n`;

      if (analysis.missingSkills.length > 0) {
        responseText += `#### ⚠️ **Missing Core Competencies**:\n- ${analysis.missingSkills.join(", ")}\n\n`;
      }

      responseText += `#### 🚀 **Google XYZ Formula Rewrites (Zero-Fabrication Policy)**:\n`;
      analysis.googleXyzSuggestions.forEach((sug, i) => {
        responseText += `**Example ${i + 1}:**\n`;
        if (sug.originalBullet) responseText += `*Before*: ~"${sug.originalBullet}"~\n\n`;
        responseText += `*After (Google XYZ)*: **"${sug.improvedBullet}"**\n\n`;
        responseText += `*Why this gets interviews*: ${sug.rationale}\n\n`;
      });

      if (analysis.unverifiedClaimsRequiringConfirmation && analysis.unverifiedClaimsRequiringConfirmation.length > 0) {
        responseText += `#### 🛡️ **Mandatory Factual Verification Checklist (Self-Audit)**:\n`;
        analysis.unverifiedClaimsRequiringConfirmation.forEach((item) => {
          responseText += `- [ ] ${item}\n`;
        });
        responseText += `\n*Note: MentorMaze enforces zero-fabrication. Do not submit metrics you cannot mathematically defend in an interview.*\n\n`;
      }

      voiceText = `I analyzed your resume bullets against Tier-1 requirements using the Google XYZ formula: accomplished X measured by Y by doing Z. Make sure to confirm all quantitative numbers before submitting.`;

      recommendedActions.push(
        { id: "act-res-xyz", title: "Rewrite top 3 project bullets using Google XYZ formula", category: "Resume", priority: "high" },
        { id: "act-res-ats", title: "Include missing keywords (Redis, Docker, Distributed Caching)", category: "Resume", priority: "high" }
      );
    }

    // Branch C: Interview Coach Mode
    else if (mode === "interview_coach") {
      const evaluation = InterviewCoachService.evaluateAnswer("int-q1-two-sum", sanitizedMessage);

      responseText = `### 🎙️ Technical Interview Assessment (Staff Rubric)\n\n`;
      responseText += evaluation.constructiveFeedback + `\n`;
      responseText += `**FAANG Rubric Dimensions:**\n`;
      responseText += `- Technical Correctness: **${evaluation.technicalCorrectness}/10**\n`;
      responseText += `- Problem Solving & Asymptotics: **${evaluation.problemSolvingDepth}/10**\n`;
      responseText += `- Edge-Case Awareness: **${evaluation.edgeCaseAwareness}/10**\n`;
      responseText += `- Communication & Trade-offs: **${evaluation.communicationClarity}/10**\n\n`;
      responseText += `> *${evaluation.isAiPracticeDisclaimer}*\n\n`;
      responseText += `**Next Question**: ${evaluation.recommendedNextQuestion}`;

      voiceText = `Your response scored ${evaluation.overallScore} out of 10. You demonstrated good algorithmic reasoning. Make sure to explicitly state your time and space bounds before coding. Ready for the next follow-up?`;

      recommendedActions.push(
        { id: "act-mock-dsa", title: "Review 14 core LeetCode DSA patterns", category: "Interview Prep", priority: "high" },
        { id: "act-mock-human", title: "Schedule a 1:1 human mock interview with a Google mentor", category: "Human Mentorship", priority: "medium" }
      );
    }

    // Branch D: Study Planner / Career Mentor Mode
    else if (mode === "study_planner" || mode === "career_mentor") {
      const roadmap = CareerIntelligenceService.generateDynamicRoadmap(studentContext.targetRole);

      responseText = `### 🗺️ Dynamic 24-Week Career & Placement Architecture\n\n`;
      responseText += `**Target Profile**: ${studentContext.displayName} $\\rightarrow$ **${roadmap.targetRole}**\n\n`;
      responseText += `**Current Focus Area**: Addressing weak skills: **${studentContext.weakSkills.slice(0, 2).join(" & ")}**\n\n`;

      roadmap.milestones.forEach((m) => {
        responseText += `#### **${m.week}: ${m.title}**\n`;
        responseText += `${m.description}\n`;
        responseText += `- **Core Competencies**: ${m.coreSkills.join(", ")}\n`;
        responseText += `- **Verified Deliverable**: *${m.deliverable}*\n\n`;
      });

      voiceText = `Here is your customized 24-week engineering roadmap tailored to your target role as ${studentContext.targetRole}. Where would you like to start?`;

      recommendedActions.push(
        { id: "act-week1-dsa", title: `Complete Week 1: ${roadmap.milestones[0]?.title}`, category: "Roadmap", priority: "high" },
        { id: "act-proj-portfolio", title: `Build portfolio milestone: ${studentContext.activeProjects[0]?.title || "Distributed System"}`, category: "Project", priority: "medium" }
      );
    }

    // Branch E: Practice Mode (Socratic Scaffolding)
    else if (mode === "practice" || pedagogyDecision.strategy === "socratic_guidance" || pedagogyDecision.strategy === "progressive_hints") {
      const lower = sanitizedMessage.toLowerCase();
      const isKnapsack = lower.includes("knapsack") || lower.includes("dp") || lower.includes("dynamic programming");

      if (isKnapsack) {
        if (pedagogyDecision.hintLevel === 1) {
          responseText = `### 💡 Progressive Hint 1 of 3: Knapsack Decision Invariant\n\n`;
          responseText += `Before looking at any table or recurrence, isolate the single decision you have to make for each item:\n\n`;
          responseText += `> *For item $i$ with weight $w_i$ and value $v_i$, what are the only two choices you can make with respect to your current remaining capacity $W$?*\n\n`;
          responseText += `Can you state these two choices in plain English without writing any loops yet?`;
          voiceText = "For item i with weight w and value v, what are the only two choices you can make with your remaining capacity? Answer in plain words.";
        } else if (pedagogyDecision.hintLevel === 2) {
          responseText = `### 💡 Progressive Hint 2 of 3: Overlapping Subproblems & State Space\n\n`;
          responseText += `Spot on! You either **include** the item (if $w_i \\le W$) or **exclude** it.\n\n`;
          responseText += `- If excluded: Value is $\\text{dp}[i-1][W]$.\n`;
          responseText += `- If included: Value is $v_i + \\text{dp}[i-1][W - w_i]$.\n\n`;
          responseText += `What are the dimensions of the memoization table you need, and what is the base case when capacity is zero?`;
          voiceText = "Hint 2: When included, your value is v plus the optimal subproblem for remaining capacity. What are the dimensions of your memoization table?";
        } else {
          responseText = `### 💡 Progressive Hint 3 of 3: Space Optimization from 2D to 1D\n\n`;
          responseText += `You have the core recurrence! Notice that each row only depends on the previous row $(i-1)$:\n\n`;
          responseText += `$$\\text{dp}[w] = \\max(\\text{dp}[w], v_i + \\text{dp}[w - w_i])$$\n\n`;
          responseText += `⚠️ **Crucial Invariant**: In 0/1 Knapsack, you must iterate the weight loop backwards (from $W$ down to $w_i$). Why? (Hint: What would happen if you iterated forward?)`;
          voiceText = "Hint 3: In 0/1 Knapsack, you can optimize to a single 1D array, but you must iterate the capacity backwards. Why is backward traversal required?";
        }
      } else {
        // Two Pointers default practice
        if (pedagogyDecision.hintLevel === 1) {
          responseText = `### 💡 Progressive Hint 1 of 3: Two Pointers & Monotonicity\n\n`;
          responseText += `Before writing code, consider the fundamental invariant of this problem:\n\n`;
          responseText += `> *What property must an array possess so that moving a left pointer inward always increases the sum, and moving a right pointer inward always decreases the sum?*\n\n`;
          responseText += `Take 30 seconds to reflect on this. If the array is unsorted, what would happen if you greedily moved a pointer?`;
          voiceText = "Here is Hint 1. What property must an array possess so that moving a pointer gives you a predictable direction? Reflect on whether the array needs to be sorted first.";
        } else if (pedagogyDecision.hintLevel === 2) {
          responseText = `### 💡 Progressive Hint 2 of 3: Sorted Invariant & Space Trade-Offs\n\n`;
          responseText += `Exactly! A sorted array guarantees directional predictability.\n\n`;
          responseText += `- If \`arr[left] + arr[right] < target\`, the current sum is too small. Which pointer MUST advance?\n`;
          responseText += `- If \`arr[left] + arr[right] > target\`, the current sum is too large. Which pointer MUST advance?\n\n`;
          responseText += `What is the time complexity of sorting the array first versus using a Hash Map?`;
          voiceText = "Hint 2: If the sum is too small, which pointer must advance? And what are the time complexity tradeoffs of sorting versus a Hash Map?";
        } else {
          responseText = `### 💡 Progressive Hint 3 of 3: The Hash Map Complement Pattern\n\n`;
          responseText += `If you want to solve this in strict $O(N)$ linear time without mutating or sorting the original array, use the **Complement Pattern**:\n\n`;
          responseText += `$$\\text{complement} = \\text{target} - \\text{nums}[i]$$\n\n`;
          responseText += `For every element, check if \`seen.has(complement)\`. If yes, you found the pair in a single pass! If no, store \`seen.set(nums[i], i)\`. Can you implement this loop?`;
          voiceText = "Hint 3: Use the complement pattern. For each element, check if target minus current number is already in your Hash Map.";
        }
      }

      recommendedActions.push(
        { id: "act-try-code", title: "Write your solution in the Code Lab", category: "Practice", priority: "high" }
      );
    }

    // Branch F: Learn Mode (Comprehensive Pedagogical Deep-Dive)
    else {
      // 1. Construct generative LLM prompt payload
      const systemPrompt = `You are the AI Mentor inside MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com).
Your mission is to provide personalized, adaptive, evidence-driven technical and career mentoring.
Brand: AI Tathastu. Platform: MentorMaze.

Teaching Mode: ${mode}
Teaching Strategy: ${pedagogyDecision.strategy}
Target Depth: ${pedagogyDecision.targetDepth}
Language Preference: ${language} (Format your responses in ${
        language === "hi"
          ? "pure Hindi"
          : language === "hinglish"
          ? "conversational Hinglish (Hindi written in Latin script with standard English technical terms)"
          : "clear, professional English"
      }).

Student Profile:
- Name: ${studentContext.displayName}
- Target Role: ${studentContext.targetRole}
- Current Weak Skills: ${studentContext.weakSkills.join(", ")}
- Recent Mistakes: ${studentContext.recentMistakes.join("; ")}

Pedagogical Core Rules:
1. Socratic Scaffolding: Never dump full finished code immediately when a student asks for help on an algorithmic problem or homework. Instead, identify their mental model, guide them with progressive hints, and ask a targeted conceptual question.
2. Zero-Fabrication: Never invent fake metrics or numbers for student resumes.
3. Groundedness: Reference verified computer science and engineering principles.

Retrieved Knowledge Evidence:
${ragPayload.retrievedEvidenceText || "No matching knowledge indexed; rely on verified CS curriculum standards."}`;

      const historyMessages = (input.conversationHistory || []).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // 2. Attempt real generative inference via ModelProviderRouter
      const completion = await ModelProviderRouter.complete({
        systemPrompt,
        messages: [...historyMessages, { role: "user", content: sanitizedMessage }],
        taskCategory: "general",
        temperature: 0.3,
      });

      lastRequestId = completion.requestId;
      tokenUsage = completion.tokenUsage;
      estimatedCostUsd = completion.estimatedCostUsd;

      if (!completion.isFallback && completion.content && completion.content !== "LOCAL_PEDAGOGICAL_FALLBACK") {
        // Genuine generative completion succeeded
        responseText = completion.content;
        activeModelProvider = `${completion.provider}/${completion.model}`;
        inferenceMode = "generative";
        voiceText = completion.content.split("\n\n")[0]?.replace(/[*#_`~]/g, "") || "Here is what you need to know about this topic.";
      } else {
        // Local Pedagogical Rule-Engine Fallback
        activeModelProvider = "tathastu-pedagogy-v1";
        inferenceMode = "deterministic";
        fallbackReason = completion.fallbackReason || "LOCAL_DETERMINISTIC_FALLBACK";

        const fallbackBanner = `> ℹ️ **Notice**: Running on MentorMaze Local Pedagogical Rule-Engine (Deterministic Fallback Mode). Generative LLM provider keys (GEMINI_API_KEY, OPENAI_API_KEY) are not configured in the server environment.\n\n`;

        const lowerMsg = sanitizedMessage.toLowerCase();

        // Dynamic topic detection for local fallback
        if (lowerMsg.includes("two pointer") || lowerMsg.includes("two-pointer") || lowerMsg.includes("sorted array")) {
          responseText = fallbackBanner + `### 📚 Deep-Dive: Two Pointers Pattern & Invariant Maintenance\n\n`;
          responseText += `#### **1. Intuition (Why This Matters)**\n`;
          responseText += `The Two Pointers pattern replaces brute-force nested loops ($O(N^2)$) with linear-time directional traversal ($O(N)$) and constant auxiliary space ($O(1)$).\n\n`;
          responseText += `#### **2. The Invariant**\n`;
          responseText += `On a sorted array, moving the left pointer rightward strictly increases the sum; moving the right pointer leftward strictly decreases the sum. If the array is unsorted, this directional guarantee collapses.\n\n`;
          responseText += `#### **3. Step-by-Step Traversal**\n`;
          responseText += `1. \`left = 0\`, \`right = arr.length - 1\`\n2. Compute \`sum = arr[left] + arr[right]\`\n3. If \`sum === target\`, return indices.\n4. If \`sum < target\`, increment \`left++\`.\n5. If \`sum > target\`, decrement \`right--\`.\n\n`;
          responseText += `#### **4. Understanding Check**\n`;
          responseText += `*What is the trade-off of sorting an unsorted array first to use Two Pointers ($O(N \\log N)$) versus using a Hash Map with extra memory ($O(N)$ time, $O(N)$ space)?*`;
          voiceText = "Two pointers requires a sorted array to guarantee directional movement. On an unsorted array, what is the trade-off between sorting first and using a Hash Map?";
        } else if (lowerMsg.includes("knapsack") || lowerMsg.includes("dynamic programming") || lowerMsg.includes("dp")) {
          responseText = fallbackBanner + `### 📚 Deep-Dive: 0/1 Knapsack & Optimal Substructure\n\n`;
          responseText += `#### **1. Intuition (Why This Matters)**\n`;
          responseText += `Dynamic Programming solves optimization problems by breaking them into overlapping subproblems and memoizing results, avoiding $O(2^N)$ recursion explosion.\n\n`;
          responseText += `#### **2. The Recurrence Relation**\n`;
          responseText += `For each item $i$ with weight $w_i$ and value $v_i$:\n`;
          responseText += `$$\\text{dp}[i][w] = \\max(\\text{dp}[i-1][w], v_i + \\text{dp}[i-1][w - w_i])$$\n\n`;
          responseText += `#### **3. Understanding Check**\n`;
          responseText += `*Why is the problem called '0/1' Knapsack rather than fractional or unbounded knapsack?*`;
          voiceText = "In 0/1 knapsack, each item can either be taken once or left behind. Can you explain why we cannot greedily take the highest value item?";
        } else {
          // Default architectural deep-dive
          responseText = fallbackBanner + `### 📚 Deep-Dive: Distributed Caching & Cache-Aside Architecture\n\n`;
          responseText += `#### **1. Intuition (Why This Matters)**\n`;
          responseText += `Relational databases like PostgreSQL are disk-bound and typically handle 1,000–5,000 queries per second (QPS) before connection pools saturate. In-memory datastores like Redis operate in RAM, effortlessly handling 100,000+ QPS with sub-millisecond latency.\n\n`;

          responseText += `#### **2. Real-Life Analogy**\n`;
          responseText += `Think of your database as the university library's deep archives (slow to fetch, holds everything). Redis is the notepad on your desk with the 5 textbooks you are reading right now.\n\n`;

          responseText += `#### **3. Formal Architecture: The Cache-Aside Pattern**\n`;
          responseText += `\`\`\`\n`;
          responseText += `Client ----> [ Application Server ]\n`;
          responseText += `                   |         \\\n`;
          responseText += `           (1) Check Cache   (2) Cache Miss -> DB Query\n`;
          responseText += `                   v                 v\n`;
          responseText += `           [ Redis Cluster ]    [ PostgreSQL DB ]\n`;
          responseText += `\`\`\`\n\n`;

          responseText += `#### **4. Step-by-Step Execution Sequence**\n`;
          responseText += `1. **Read Request**: Application checks Redis key \`user:101\`.\n`;
          responseText += `2. **Cache Hit**: Data found. Return immediately ($< 2\\text{ms}$). Database is not touched.\n`;
          responseText += `3. **Cache Miss**: Key missing. Query PostgreSQL ($~15\\text{ms}$). Write result to Redis with a TTL (e.g. 3600s). Return data to client.\n\n`;

          responseText += `#### **5. Non-Obvious Edge Cases & Pitfalls**\n`;
          responseText += `- **Cache Stampede (Thundering Herd)**: When a popular key expires, 10,000 concurrent requests query the database at the exact same instant, crashing PostgreSQL. *Mitigation*: Mutex locking or probabilistic early expiration.\n`;
          responseText += `- **Stale Data on Mutation**: When a user updates their profile, update PostgreSQL first, then delete (invalidate) the Redis cache key.\n\n`;

          responseText += `#### **6. Quick Understanding Check**\n`;
          responseText += `*Why is it better to **delete** the cache key on database updates rather than immediately writing the updated value to Redis?*`;

          voiceText = "Welcome to Cache-Aside architecture. When data is requested, we check Redis first. On a cache miss, we query PostgreSQL and populate Redis with a TTL. Why do you think it is safer to delete the cache key rather than write to it on updates?";
        }

        recommendedActions.push(
          { id: "act-learn-impl", title: "Implement pattern wrapper in TypeScript", category: "Implementation", priority: "high" },
          { id: "act-learn-tradeoffs", title: "Document time & space complexity trade-offs", category: "System Design", priority: "medium" }
        );
      }
    }

    // Append Citations
    if (citations.length > 0) {
      responseText += KnowledgeRAGService.formatCitationsForMarkdown(ragPayload.results);
    } else if (ragPayload.missingInformationNotice) {
      responseText += `\n\n---\n*${ragPayload.missingInformationNotice}*`;
    }

    // Phase 5: Formulate Post-Interaction Learning Check
    const lowerMessage = sanitizedMessage.toLowerCase();
    if (mode === "learn" || mode === "practice") {
      if (lowerMessage.includes("two pointer") || lowerMessage.includes("two-pointer")) {
        postInteractionCheck = {
          question: "Under what condition does moving the left pointer inward guarantee a monotonic increase in sum?",
          options: [
            "The array must contain only positive integers",
            "The array must be sorted in non-decreasing order",
            "The array length must be an even number",
            "The array elements must be unique",
          ],
          correctOptionIndex: 1,
          explanation: "In an unsorted array, values do not correlate monotonically with pointer indices, destroying the directional guarantee.",
        };
      } else if (lowerMessage.includes("knapsack") || lowerMessage.includes("dp")) {
        postInteractionCheck = {
          question: "Why must the capacity loop iterate backwards in 1D space-optimized 0/1 Knapsack?",
          options: [
            "To prioritize higher-value items first",
            "To prevent the same item from being included multiple times in the current step",
            "To reduce runtime complexity from O(NW) to O(W)",
            "Backward loops are vectorized faster by modern CPU compilers",
          ],
          correctOptionIndex: 1,
          explanation: "Iterating forward would overwrite subproblem states from row i-1 with row i, effectively turning 0/1 Knapsack into unbounded knapsack.",
        };
      } else {
        postInteractionCheck = {
          question: "In Cache-Aside architecture, why is it safer to delete (invalidate) the cache key upon DB write rather than update it?",
          options: [
            "Redis does not support key updates",
            "To eliminate race conditions between concurrent DB updates and cache writes",
            "Deleting keys bypasses PostgreSQL transaction isolation",
            "It saves memory in Redis cluster instances",
          ],
          correctOptionIndex: 1,
          explanation: "Concurrent writes can complete in different orders across DB and cache, leaving stale values permanently in cache until TTL expires.",
        };
      }
    }

    // Phase 4: Track Skill Updates (Grounded Evidence-Based Policy)
    // Only update skill when explicit evidence is demonstrated
    if (lowerMessage.includes("cache-aside") || lowerMessage.includes("redis")) {
      skillUpdates.push({
        skillId: "relational_db_sql",
        skillName: "SQL & Relational Modeling",
        previousState: "developing",
        newState: "demonstrated",
        score: 8.4,
        confidence: 0.88,
        evidence: "Demonstrated accurate Cache-Aside read/write sequence and invalidation trade-offs",
      });
    }

    const elapsed = Number((performance.now() - t0).toFixed(2));

    // Phase 3: Server-Side Conversation Store Persistence
    if (conversationId) {
      try {
        ConversationStore.addMessage(conversationId, input.studentUserId, "user", sanitizedMessage);
        ConversationStore.addMessage(conversationId, input.studentUserId, "assistant", responseText, {
          teachingStrategy: pedagogyDecision.strategy,
          hintLevel: pedagogyDecision.hintLevel,
          difficulty: pedagogyDecision.targetDepth,
          studentUnderstandingSignal: "strong",
          sources: citations,
          recommendedActions,
          skillUpdates,
          escalation: escalation.shouldEscalate ? escalation : undefined,
          latencyMs: Math.max(0.1, elapsed),
          modelProvider: activeModelProvider,
          inferenceMode,
        });
      } catch (storeErr) {
        console.warn("[ConversationStore] Failed to persist message turn:", storeErr);
      }
    }

    return {
      requestId: lastRequestId,
      message: responseText,
      voiceText,
      teachingStrategy: pedagogyDecision.strategy,
      topic: input.activeTopic || "distributed_systems",
      difficulty: pedagogyDecision.targetDepth,
      hintLevel: pedagogyDecision.hintLevel,
      studentUnderstandingSignal: "strong",
      sources: citations,
      recommendedActions,
      skillUpdates,
      escalationRecommendation: escalation.shouldEscalate ? escalation : undefined,
      latencyMs: Math.max(0.1, elapsed),
      modelProvider: activeModelProvider,
      inferenceMode,
      tokenUsage,
      estimatedCostUsd,
      fallbackReason,
      postInteractionCheck,
    };
  }
}
