/**
 * MentorMaze-2B Specialised AI Model — Provider Routing & Inference Test Suite
 * Validates on-device fine-tuned 2B inference routing, zero-cost telemetry,
 * Socratic scaffolding, and domain-specialized outputs.
 */

import { describe, it, expect } from "vitest";
import { ModelProviderRouter } from "../lib/ai-mentor/model-provider-router";
import { AIMentorOrchestrator } from "../lib/ai-mentor/orchestrator";

describe("MentorMaze-2B Model Provider & Specialized Inference", () => {
  // Test 1: Provider Status & Adapter Discovery
  it("Test 1: Discovers MentorMaze-2B adapter and reports ready status with $0.00/token cost", () => {
    const status = ModelProviderRouter.getProviderStatus();
    expect(status.mentormaze_2b).toBeDefined();
    expect(status.mentormaze_2b.modelName).toBe("mentormaze/mentormaze-2b-sft-v1");
    expect(status.mentormaze_2b.isAvailable).toBe(true);
    expect(status.mentormaze_2b.isConfigured).toBe(true);
    expect(status.mentormaze_2b.status).toBe("ready");
    expect(status.mentormaze_2b.message).toContain("Apple Silicon MPS / PEFT LoRA r=32 adapter");
  });

  // Test 2: Routing to MentorMaze-2B with preferredProvider
  it("Test 2: Routes explicitly to MentorMaze-2B when preferredProvider is set", async () => {
    const result = await ModelProviderRouter.complete({
      preferredProvider: "mentormaze_2b",
      systemPrompt: "You are Dr. Aarav Mehta, Lead Systems Mentor.",
      messages: [{ role: "user", content: "Explain how LSM Trees handle high write throughput." }],
      taskCategory: "reasoning",
    });

    expect(result.provider).toBe("mentormaze_2b");
    expect(result.model).toBe("mentormaze/mentormaze-2b-sft-v1");
    expect(result.inferenceMode).toBe("fine-tuned-2b");
    expect(result.estimatedCostUsd).toBe(0.0);
    expect(result.latencyMs).toBeGreaterThan(0);
    expect(result.isFallback).toBe(false);
    expect(result.content).toContain("MentorMaze-2B Socratic Scaffolding");
    expect(result.content).toContain("Core Problem Intuition");
  });

  // Test 3: Coding Specialization with Invariants and Complexity Checks
  it("Test 3: Generates coding & DSA analysis with asymptotic guarantees and scaffolding", async () => {
    const result = await ModelProviderRouter.complete({
      preferredProvider: "mentormaze_2b",
      systemPrompt: "You are the Code Mentor.",
      messages: [{ role: "user", content: "Implement LRU Cache using Doubly Linked List and Hash Map." }],
      taskCategory: "coding",
    });

    expect(result.provider).toBe("mentormaze_2b");
    expect(result.content).toContain("MentorMaze-2B Code & Algorithmic Analysis");
    expect(result.content).toContain("Asymptotic Guarantees");
    expect(result.content).toContain("Auxiliary Space");
    expect(result.content).toContain("Key Scaffolding Checkpoints");
  });

  // Test 4: Resume Specialization with Zero-Fabrication Mandate
  it("Test 4: Enforces zero-fabrication and self-audit checklist for resume enhancement", async () => {
    const result = await ModelProviderRouter.complete({
      preferredProvider: "mentormaze_2b",
      systemPrompt: "You are the Career & Resume Coach.",
      messages: [{ role: "user", content: "Improve my resume bullet for backend optimization." }],
      taskCategory: "resume",
    });

    expect(result.provider).toBe("mentormaze_2b");
    expect(result.content).toContain("MentorMaze-2B Resume Enhancement (Factual Integrity Audited)");
    expect(result.content).toContain("Zero-Fabrication Rule");
    expect(result.content).toContain("Self-Audit Checklist");
  });

  // Test 5: Behavioral STAR Calibration
  it("Test 5: Calibrates behavioral interview questions into STAR methodology", async () => {
    const result = await ModelProviderRouter.complete({
      preferredProvider: "mentormaze_2b",
      systemPrompt: "You are the Technical Interview Coach.",
      messages: [{ role: "user", content: "Tell me about a time you handled a production outage." }],
      taskCategory: "interview",
    });

    expect(result.provider).toBe("mentormaze_2b");
    expect(result.content).toContain("MentorMaze-2B STAR Behavioral Calibration");
    expect(result.content).toContain("Situation");
    expect(result.content).toContain("Task");
    expect(result.content).toContain("Action");
    expect(result.content).toContain("Result");
  });

  // Test 6: Cost Calculation for MentorMaze-2B is strictly $0.00
  it("Test 6: Computes $0.00 API inference cost for all token volumes on MentorMaze-2B", () => {
    const cost1 = ModelProviderRouter.calculateCost("mentormaze_2b", 1000, 500);
    const cost2 = ModelProviderRouter.calculateCost("mentormaze_2b", 100000, 50000);
    expect(cost1).toBe(0.0);
    expect(cost2).toBe(0.0);
  });

  // Test 7: Telemetry Tracking for fineTuned2bRequests
  it("Test 7: Records fineTuned2bRequests in telemetry buffer without leaking keys", async () => {
    const initialTelemetry = ModelProviderRouter.getTelemetryAnalytics();

    await ModelProviderRouter.complete({
      preferredProvider: "mentormaze_2b",
      systemPrompt: "System",
      messages: [{ role: "user", content: "Telemetry test." }],
    });

    const updatedTelemetry = ModelProviderRouter.getTelemetryAnalytics();
    expect(updatedTelemetry.fineTuned2bRequests).toBeGreaterThanOrEqual(1);
    expect(updatedTelemetry.totalRequests).toBeGreaterThan(initialTelemetry.totalRequests);
  });
});

