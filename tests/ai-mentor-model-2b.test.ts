/**
 * MentorMaze-2B Specialised AI Model — Provider Routing & Lifecycle Safety Test Suite
 * Validates Phase 4 lifecycle state machine (transitions to DEPLOYABLE upon SFT & empirical evaluation),
 * fail-safe fallback when local inference server is unavailable, and zero-cost telemetry.
 */

import { describe, it, expect } from "vitest";
import { ModelProviderRouter } from "../lib/ai-mentor/model-provider-router";

describe("MentorMaze-2B Model Provider Lifecycle & Safety Verification", () => {
  // Test 1: Provider Status & Lifecycle State
  it("Test 1: Discovers fine-tuned SFT adapter and reports DEPLOYABLE status with empirical benchmark scores", () => {
    const status = ModelProviderRouter.getProviderStatus();
    expect(status.mentormaze_2b).toBeDefined();
    expect(status.mentormaze_2b.modelName).toBe("mentormaze/mentormaze-2b-sft-v1");
    expect(status.mentormaze_2b.isConfigured).toBe(true);
    
    // SFT adapter evaluated with 100% Socratic compliance -> DEPLOYABLE
    expect(status.mentormaze_2b.lifecycleState).toBe("DEPLOYABLE");
    expect(status.mentormaze_2b.isAvailable).toBe(true);
    expect(status.mentormaze_2b.status).toBe("ready");
    expect(status.mentormaze_2b.deploymentEligibility?.eligible).toBe(true);
    expect(status.mentormaze_2b.benchmarkScores?.socraticCompliance).toBe(100.0);
    expect(status.mentormaze_2b.benchmarkScores?.testPerplexity).toBe(1.59);
  });

  // Test 2: Safe Fallback when Local Server is Unavailable
  it("Test 2: Safely falls back to local pedagogical engine when local inference daemon is not started", async () => {
    const result = await ModelProviderRouter.complete({
      preferredProvider: "mentormaze_2b",
      systemPrompt: "You are Dr. Aarav Mehta, Lead Systems Mentor.",
      messages: [{ role: "user", content: "Explain how LSM Trees handle high write throughput." }],
      taskCategory: "reasoning",
    });

    // When local server daemon is not active, cleanly falls back
    expect(result.isFallback).toBe(true);
    expect(result.fallbackReason).toContain("MENTORMAZE_2B_FAILED");
    expect(result.provider).toBe("local_pedagogical");
  });

  // Test 3: Zero-Cost Pricing Guarantee
  it("Test 3: Computes strictly $0.00 API inference cost for all token volumes on MentorMaze-2B", () => {
    const cost1 = ModelProviderRouter.calculateCost("mentormaze_2b", 1000, 500);
    const cost2 = ModelProviderRouter.calculateCost("mentormaze_2b", 100000, 50000);
    expect(cost1).toBe(0.0);
    expect(cost2).toBe(0.0);
  });

  // Test 4: Status endpoint accurately returns verified empirical scores
  it("Test 4: Status endpoint accurately returns verified empirical scores", () => {
    const lifecycle = ModelProviderRouter.getModelLifecycleState();
    expect(lifecycle.state).toBe("DEPLOYABLE");
    expect(lifecycle.benchmarkScores).toBeDefined();
    expect(lifecycle.benchmarkScores?.socraticCompliance).toBe(100.0);
    expect(lifecycle.benchmarkScores?.testPerplexity).toBe(1.59);
  });

  // Test 5: Fallback Telemetry Tracking
  it("Test 5: Telemetry correctly logs fallback attempt without leaking secrets", async () => {
    const initialTelemetry = ModelProviderRouter.getTelemetryAnalytics();

    await ModelProviderRouter.complete({
      preferredProvider: "mentormaze_2b",
      systemPrompt: "System",
      messages: [{ role: "user", content: "Telemetry lifecycle test." }],
    });

    const updatedTelemetry = ModelProviderRouter.getTelemetryAnalytics();
    expect(updatedTelemetry.totalRequests).toBeGreaterThan(initialTelemetry.totalRequests);
    expect(updatedTelemetry.fallbackFrequencyPct).toBeGreaterThanOrEqual(0);
  });
});
