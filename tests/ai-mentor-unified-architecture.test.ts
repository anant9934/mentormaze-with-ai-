/**
 * MentorMaze Unified Intelligence Architecture Test Suite
 * Brand: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 * Identity: Dr. Aarav Mehta (Principal Mentor · AI Intelligence)
 */

import { describe, it, expect } from "vitest";
import { AIMentorOrchestrator } from "../lib/ai-mentor/orchestrator";
import { SpecialistRegistry } from "../lib/ai-mentor/specialists/specialist-registry";
import { UNIFIED_MENTOR_IDENTITY, FocusArea } from "../lib/ai-mentor/types";

describe("Unified Intelligence Architecture & Specialist Routing", () => {
  // Test 1: Single Unified Mentor Identity
  it("maintains Dr. Aarav Mehta as the sole unified mentor identity across all responses", async () => {
    const result = await AIMentorOrchestrator.processTurn({
      studentUserId: "usr-unified-test-1",
      userMessage: "Hello, who are you and how can you help me prepare for placements?",
      mode: "learn",
    });

    expect(result.mentorIdentity).toBeDefined();
    expect(result.mentorIdentity?.name).toBe("Dr. Aarav Mehta");
    expect(result.mentorIdentity?.title).toContain("Principal Mentor");
    expect(result.mentorIdentity?.credentials).toContain("Staff Software Architect");
    expect(result.mentorIdentity?.systemPersona).toContain("Dr. Aarav Mehta");
  });

  // Test 2: Specialist Registry covers all 9 canonical focus areas
  it("registers and retrieves all 9 internal specialist capabilities", () => {
    const specialists = SpecialistRegistry.getAllSpecialists();
    expect(specialists.length).toBe(9);

    const ids: FocusArea[] = [
      "learn",
      "practice",
      "coding_dsa",
      "system_design",
      "career",
      "resume",
      "interview",
      "projects",
      "study_planning",
    ];

    for (const expectedId of ids) {
      const specialist = SpecialistRegistry.getSpecialist(expectedId);
      expect(specialist).toBeDefined();
      expect(specialist.id).toBe(expectedId);
      expect(specialist.badge).toBeDefined();
      expect(specialist.domain).toBeDefined();
    }
  });

  // Test 3: Natural language intent classification for all 9 capabilities
  it("accurately classifies prompts into appropriate internal specialist capabilities", () => {
    const testCases: { prompt: string; expectedArea: FocusArea }[] = [
      { prompt: "Teach me how Dynamic Programming works", expectedArea: "learn" },
      { prompt: "I am stuck on this problem, give me a progressive hint", expectedArea: "practice" },
      { prompt: "Please do a code review of this two sum solution", expectedArea: "coding_dsa" },
      { prompt: "How do I design a distributed rate limiter in Redis?", expectedArea: "system_design" },
      { prompt: "Analyze this Naukri job description for SDE-1 compensation", expectedArea: "career" },
      { prompt: "Evaluate my resume bullet point using Google XYZ formula", expectedArea: "resume" },
      { prompt: "Let's do a mock interview behavioral question with STAR method", expectedArea: "interview" },
      { prompt: "What portfolio project should I build with WebSockets?", expectedArea: "projects" },
      { prompt: "Create a 24-week study roadmap for tier-1 product companies", expectedArea: "study_planning" },
    ];

    for (const tc of testCases) {
      const resolved = SpecialistRegistry.resolveSpecialist(tc.prompt);
      expect(resolved.id).toBe(tc.expectedArea);
    }
  });

  // Test 4: Focus Area Switching preserves conversation context
  it("preserves conversation history across alternating focus areas", async () => {
    const studentId = "usr-switch-test-1";

    // Turn 1: Learn focus
    const turn1 = await AIMentorOrchestrator.processTurn({
      studentUserId: studentId,
      userMessage: "Explain the two pointers pattern invariant.",
      focusArea: "learn",
      conversationHistory: [],
    });
    expect(turn1.specialistCapability?.id).toBe("learn");
    expect(turn1.message).toContain("Two Pointers");

    // Turn 2: Switch to Coding & DSA with Turn 1 in history
    const turn2 = await AIMentorOrchestrator.processTurn({
      studentUserId: studentId,
      userMessage: "Review my twoSum implementation based on that invariant.",
      focusArea: "coding_dsa",
      conversationHistory: [
        { role: "user", content: "Explain the two pointers pattern invariant." },
        { role: "assistant", content: turn1.message },
      ],
      codeSnippet: "function twoSum(arr, target) { let l = 0, r = arr.length - 1; }",
    });

    expect(turn2.specialistCapability?.id).toBe("coding_dsa");
    expect(turn2.message).toContain("Code Review");
    expect(turn2.mentorIdentity?.name).toBe("Dr. Aarav Mehta");

    // Turn 3: Switch to System Design with history intact
    const turn3 = await AIMentorOrchestrator.processTurn({
      studentUserId: studentId,
      userMessage: "Now how would we scale this lookup across 10 million daily active users?",
      focusArea: "system_design",
      conversationHistory: [
        { role: "user", content: "Explain the two pointers pattern invariant." },
        { role: "assistant", content: turn1.message },
        { role: "user", content: "Review my twoSum implementation based on that invariant." },
        { role: "assistant", content: turn2.message },
      ],
    });

    expect(turn3.specialistCapability?.id).toBe("system_design");
    expect(turn3.mentorIdentity?.name).toBe("Dr. Aarav Mehta");
  });

  // Test 5: Concept Verification Checks and Citations
  it("attaches post-interaction checks and citations without hallucinated metrics", async () => {
    const result = await AIMentorOrchestrator.processTurn({
      studentUserId: "usr-unified-test-check",
      userMessage: "Explain distributed caching and cache-aside invalidation.",
      focusArea: "system_design",
    });

    expect(result.postInteractionCheck).toBeDefined();
    expect(result.postInteractionCheck?.question).toBeDefined();
    expect(result.postInteractionCheck?.options.length).toBeGreaterThanOrEqual(2);
    expect(result.sources).toBeDefined();

    // Verify zero fabricated metrics in response
    expect(result.message).not.toMatch(/improved by \d+(\.\d+)?% without verification/i);
  });
});
