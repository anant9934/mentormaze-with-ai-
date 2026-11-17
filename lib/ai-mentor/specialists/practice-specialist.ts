/**
 * Practice Specialist Capability — Dr. Aarav Mehta Internal Module
 * Focus: Socratic scaffolding, progressive hints (Level 1-3), active recall, problem solving
 */

import {
  ISpecialistCapability,
  SpecialistExecutionInput,
  SpecialistExecutionOutput,
  TaskCategoryType,
} from "./specialist-interface";
import { FocusArea, SpecialistCapabilityInfo } from "../types";
import { CurriculumKnowledgeService } from "../curriculum-knowledge";

export class PracticeSpecialist implements ISpecialistCapability {
  public readonly id: FocusArea = "practice";
  public readonly name = "Active Practice & Socratic Specialist";
  public readonly badge = "Using Socratic Practice Expertise";
  public readonly domain = "Active Problem Solving & Scaffolding";
  public readonly description = "Guides students through problems using 3-tier progressive hints, invariant questions, and zero-code cognitive discovery.";

  public matchesIntent(message: string): boolean {
    const lower = message.toLowerCase();
    const keywords = [
      "practice",
      "quiz me",
      "hint",
      "stuck",
      "problem",
      "exercise",
      "solve",
      "challenge",
      "test me",
      "guide me",
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
    return `### INTERNAL SPECIALIST ACTIVATION: Socratic Practice & Scaffolding
- NEVER give complete solution code immediately.
- Current Hint Level: ${input.hintLevel || 1} of 3.
- Level 1: Ask an invariant or state question. Do not reveal the algorithm name.
- Level 2: Clarify the recurrence, data structure, or pointer direction, and explain why.
- Level 3: Provide minimal pseudo-code outline and prompt student to implement the loop boundaries.`;
  }

  public executeDeterministic(input: SpecialistExecutionInput): SpecialistExecutionOutput {
    const lower = input.userMessage.toLowerCase();
    const curriculumMatch = CurriculumKnowledgeService.findMatchingTopic(input.userMessage);
    const hintLevel = input.hintLevel || 1;
    const hintIdx = Math.min(2, Math.max(0, hintLevel - 1));

    let responseText = "";
    let voiceText = "";

    if (curriculumMatch) {
      responseText = `### 💡 Progressive Hint ${hintIdx + 1} of 3: ${curriculumMatch.title}\n\n`;
      responseText += `${curriculumMatch.socraticHints[hintIdx]}\n\n`;
      responseText += `Reflect on this constraint before writing any code. What invariant must hold true here?`;
      voiceText = curriculumMatch.socraticHints[hintIdx];
    } else {
      const isKnapsack = lower.includes("knapsack") || lower.includes("dp") || lower.includes("dynamic programming");

      if (isKnapsack) {
        if (hintLevel === 1) {
          responseText = `### 💡 Progressive Hint 1 of 3: Knapsack Decision Invariant\n\n`;
          responseText += `Before looking at any table or recurrence, isolate the single decision you have to make for each item:\n\n`;
          responseText += `> *For item $i$ with weight $w_i$ and value $v_i$, what are the only two choices you can make with respect to your current remaining capacity $W$?*\n\n`;
          responseText += `Can you state these two choices in plain English without writing any loops yet?`;
          voiceText = "For item i with weight w and value v, what are the only two choices you can make with your remaining capacity? Answer in plain words.";
        } else if (hintLevel === 2) {
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
        if (hintLevel === 1) {
          responseText = `### 💡 Progressive Hint 1 of 3: Two Pointers & Monotonicity\n\n`;
          responseText += `Before writing code, consider the fundamental invariant of this problem:\n\n`;
          responseText += `> *What property must an array possess so that moving a left pointer inward always increases the sum, and moving a right pointer inward always decreases the sum?*\n\n`;
          responseText += `Take 30 seconds to reflect on this. If the array is unsorted, what would happen if you greedily moved a pointer?`;
          voiceText = "Here is Hint 1. What property must an array possess so that moving a pointer gives you a predictable direction? Reflect on whether the array needs to be sorted first.";
        } else if (hintLevel === 2) {
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
    }

    return {
      responseText,
      voiceText,
      recommendedActions: [
        { id: "act-try-code", title: "Write your solution in the Code Lab", category: "Practice", priority: "high" },
        { id: "act-next-hint", title: `Request Hint ${Math.min(3, hintLevel + 1)}`, category: "Scaffolding", priority: "medium" },
      ],
      skillUpdates: [],
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
        { id: "act-practice-solve", title: "Implement solution with edge cases", category: "Practice", priority: "high" },
      ],
      skillUpdates: [],
    };
  }
}
