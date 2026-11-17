/**
 * Coding & DSA Specialist Capability — Dr. Aarav Mehta Internal Module
 * Focus: Asymptotic complexity, algorithmic edge cases, code review, bug detection
 */

import {
  ISpecialistCapability,
  SpecialistExecutionInput,
  SpecialistExecutionOutput,
  TaskCategoryType,
} from "./specialist-interface";
import { FocusArea, SpecialistCapabilityInfo } from "../types";
import { CodeMentorService } from "../code-mentor";

export class CodingSpecialist implements ISpecialistCapability {
  public readonly id: FocusArea = "coding_dsa";
  public readonly name = "Coding & DSA Specialist";
  public readonly badge = "Using Coding & DSA Expertise";
  public readonly domain = "Data Structures, Algorithms & Code Optimization";
  public readonly description = "Performs deep line-by-line code review, identifies asymptotic bottlenecks, and provides optimized, bug-free implementations.";

  public matchesIntent(message: string): boolean {
    const lower = message.toLowerCase();
    const keywords = [
      "code",
      "review",
      "bug",
      "debug",
      "optimize",
      "complexity",
      "time complexity",
      "space complexity",
      "dsa",
      "algorithm",
      "leetcode",
      "refactor",
      "python",
      "javascript",
      "typescript",
      "java",
      "c++",
      "two sum",
      "binary search",
    ];
    return keywords.some((kw) => lower.includes(kw));
  }

  public getTaskCategory(): TaskCategoryType {
    return "coding";
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
    return `### INTERNAL SPECIALIST ACTIVATION: Coding & DSA Engineering
- Perform rigorous line-by-line algorithmic review.
- Compute exact Time Complexity (Worst, Average, Best) and Auxiliary Space Complexity using standard asymptotic notation ($O(N)$, $O(N \\log N)$, etc.).
- Highlight hidden traps (e.g. \`indexOf\` / \`includes\` inside a loop creating unintended $O(N^2)$ complexity, unhandled \`null\`/\`undefined\` inputs, integer overflows).
- Provide clean, idiomatic, typed refactored code with explanatory comments.
- Enumerate 3 mandatory edge-case test cases (empty input, single element, negative/large values).`;
  }

  public executeDeterministic(input: SpecialistExecutionInput): SpecialistExecutionOutput {
    const codeToAnalyze = input.codeSnippet || input.userMessage;
    const analysis = CodeMentorService.analyzeCode(codeToAnalyze);

    let responseText = `### 🔍 Code Review & Algorithmic Optimization Feedback\n\n`;
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

    const voiceText = `I analyzed your code. Notice how we replace linear lookups with an auxiliary Set to eliminate quadratic O of N squared complexity. Would you like to review the edge cases?`;

    return {
      responseText,
      voiceText,
      recommendedActions: [
        { id: "act-code-tests", title: "Run unit test suite against empty and single-element inputs", category: "Coding", priority: "high" },
        { id: "act-code-map", title: "Practice Hash Map constant-time pattern on LeetCode #1", category: "DSA", priority: "medium" },
      ],
      skillUpdates: [
        {
          skillId: "dsa_arrays_hashing",
          skillName: "Arrays & Hashing (DSA)",
          previousState: "developing",
          newState: "demonstrated",
          score: 8.5,
          confidence: 0.9,
          evidence: "Implemented single-pass hash map complement optimization with boundary validation",
        },
      ],
      postInteractionCheck: {
        question: "Why does performing 'arr.includes(val)' inside an array loop result in O(N^2) time complexity?",
        options: [
          "Arrays cannot store duplicate values",
          "'includes' executes a linear scan O(N) on each iteration of the outer loop",
          "JavaScript engine disables JIT compiler when includes is nested",
          "Memory allocation fails on nested calls",
        ],
        correctOptionIndex: 1,
        explanation: "Calling an O(N) scan inside an O(N) loop yields N * N = O(N^2) total operations. Using a Set/Map reduces the lookup to O(1).",
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
        { id: "act-code-test", title: "Test edge cases: empty input, duplicates, large inputs", category: "Coding", priority: "high" },
        { id: "act-code-benchmark", title: "Benchmark execution time vs baseline", category: "Optimization", priority: "medium" },
      ],
      skillUpdates: [],
    };
  }
}
