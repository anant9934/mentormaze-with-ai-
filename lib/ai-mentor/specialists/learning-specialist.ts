/**
 * SAGE Learning Intelligence — ASTRION Specialist Capability
 * Product: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 * Internal ID: sage-learning
 * Principle: Teach the reasoning, not merely the answer.
 */

import {
  ISpecialistCapability,
  SpecialistExecutionInput,
  SpecialistExecutionOutput,
  TaskCategoryType,
} from "./specialist-interface";
import { FocusArea, SpecialistCapabilityInfo } from "../types";
import { CurriculumKnowledgeService } from "../curriculum-knowledge";

export class LearningSpecialist implements ISpecialistCapability {
  public readonly id: FocusArea = "learn";
  public readonly codeName = "SAGE";
  public readonly responsibility = "Learning intelligence";
  public readonly name = "SAGE Learning Intelligence";
  public readonly badge = "SAGE Learning Intelligence";
  public readonly domain = "Conceptual Pedagogy, First Principles & Socratic Tutoring";
  public readonly description = "Teaches conceptual reasoning from first principles with formal computational invariants, step-by-step proofs, and progressive scaffolding.";

  public matchesIntent(message: string): boolean {
    const lower = message.toLowerCase();
    const keywords = [
      "teach me",
      "explain",
      "what is",
      "how does",
      "concept",
      "theory",
      "understand",
      "intuition",
      "learn",
      "why does",
      "difference between",
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
    return `### INTERNAL SPECIALIST ACTIVATION: SAGE Learning Intelligence (Core Principle: Teach the reasoning, not merely the answer)
- Explain concepts from first principles with formal definitions followed by real-world intuition.
- Break down mechanisms step-by-step and explicitly state underlying computational invariants.
- Contrast with alternative approaches and analyze asymptotic trade-offs (Time vs Space).
- End with a targeted conceptual verification question to test student retention.`;
  }

  public executeDeterministic(input: SpecialistExecutionInput): SpecialistExecutionOutput {
    const lower = input.userMessage.toLowerCase();
    const curriculumMatch = CurriculumKnowledgeService.findMatchingTopic(input.userMessage);

    let responseText = "";
    let voiceText = "";

    if (curriculumMatch) {
      responseText = `### 📚 Foundational Deep-Dive: ${curriculumMatch.title}\n\n`;
      responseText += curriculumMatch.conceptExplanation;
      voiceText = `Here is a foundational deep-dive into ${curriculumMatch.title}. What operational trade-offs stand out to you?`;
    } else if (lower.includes("two pointer") || lower.includes("two-pointer") || lower.includes("sorted array")) {
      responseText = `### 📚 Deep-Dive: Two Pointers Pattern & Invariant Maintenance\n\n`;
      responseText += `#### **1. Intuition (Why This Matters)**\n`;
      responseText += `The Two Pointers pattern replaces brute-force nested loops ($O(N^2)$) with linear-time directional traversal ($O(N)$) and constant auxiliary space ($O(1)$).\n\n`;
      responseText += `#### **2. The Invariant**\n`;
      responseText += `On a sorted array, moving the left pointer rightward strictly increases the sum; moving the right pointer leftward strictly decreases the sum. If the array is unsorted, this directional guarantee collapses.\n\n`;
      responseText += `#### **3. Step-by-Step Traversal**\n`;
      responseText += `1. \`left = 0\`, \`right = arr.length - 1\`\n2. Compute \`sum = arr[left] + arr[right]\`\n3. If \`sum === target\`, return indices.\n4. If \`sum < target\`, increment \`left++\`.\n5. If \`sum > target\`, decrement \`right--\`.\n\n`;
      responseText += `#### **4. Understanding Check**\n`;
      responseText += `*What is the trade-off of sorting an unsorted array first to use Two Pointers ($O(N \\log N)$) versus using a Hash Map with extra memory ($O(N)$ time, $O(N)$ space)?*`;
      voiceText = "Two pointers requires a sorted array to guarantee directional movement. On an unsorted array, what is the trade-off between sorting first and using a Hash Map?";
    } else if (lower.includes("knapsack") || lower.includes("dynamic programming") || lower.includes("dp")) {
      responseText = `### 📚 Deep-Dive: 0/1 Knapsack & Optimal Substructure\n\n`;
      responseText += `#### **1. Intuition (Why This Matters)**\n`;
      responseText += `Dynamic Programming solves optimization problems by breaking them into overlapping subproblems and memoizing results, avoiding $O(2^N)$ recursion explosion.\n\n`;
      responseText += `#### **2. The Recurrence Relation**\n`;
      responseText += `For each item $i$ with weight $w_i$ and value $v_i$:\n`;
      responseText += `$$\\text{dp}[i][w] = \\max(\\text{dp}[i-1][w], v_i + \\text{dp}[i-1][w - w_i])$$\n\n`;
      responseText += `#### **3. Understanding Check**\n`;
      responseText += `*Why is the problem called '0/1' Knapsack rather than fractional or unbounded knapsack?*`;
      voiceText = "In 0/1 knapsack, each item can either be taken once or left behind. Can you explain why we cannot greedily take the highest value item?";
    } else {
      responseText = `### 📚 Deep-Dive: Distributed Caching & Cache-Aside Architecture\n\n`;
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

    return {
      responseText,
      voiceText,
      recommendedActions: [
        { id: "act-learn-impl", title: "Implement pattern wrapper in TypeScript", category: "Implementation", priority: "high" },
        { id: "act-learn-tradeoffs", title: "Document time & space complexity trade-offs", category: "System Design", priority: "medium" },
      ],
      skillUpdates: [],
      postInteractionCheck: {
        question: "In Cache-Aside architecture, why is it safer to delete (invalidate) the cache key upon DB write rather than update it?",
        options: [
          "Redis does not support key updates",
          "To eliminate race conditions between concurrent DB updates and cache writes",
          "Deleting keys bypasses PostgreSQL transaction isolation",
          "It saves memory in Redis cluster instances",
        ],
        correctOptionIndex: 1,
        explanation: "Concurrent writes can complete in different orders across DB and cache, leaving stale values permanently in cache until TTL expires.",
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
        { id: "act-learn-review", title: "Review core CS invariant notes", category: "Learning", priority: "medium" },
        { id: "act-learn-exercise", title: "Test understanding with active recall check", category: "Practice", priority: "high" },
      ],
      skillUpdates: [],
    };
  }
}
