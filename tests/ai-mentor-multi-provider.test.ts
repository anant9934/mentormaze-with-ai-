/**
 * Multi-Provider Live Inference & Harvester Integration Test Suite
 * Validates Gemini, Groq, OpenRouter, and Harvester output without secret leakage.
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 */

import { describe, it, expect } from "vitest";
import { ModelProviderRouter } from "../lib/ai-mentor/model-provider-router";
import fs from "fs";
import path from "path";

describe("Multi-Provider Live Routing & Credential Governance", () => {
  // Test 1: Provider Status includes all configured live providers
  it("Test 1: Exposes provider status for Gemini, Groq, OpenRouter, and MentorMaze-2B", () => {
    const status = ModelProviderRouter.getProviderStatus();
    expect(status.mentormaze_2b).toBeDefined();
    expect(status.groq).toBeDefined();
    expect(status.openrouter).toBeDefined();
    expect(status.gemini).toBeDefined();

    // Verify key masking: No raw secrets ever present
    const serialized = JSON.stringify(status);
    expect(serialized).not.toMatch(/gsk_[A-Za-z0-9]{30,}/);
    expect(serialized).not.toMatch(/sk-or-v1-[A-Za-z0-9]{30,}/);
    expect(serialized).not.toMatch(/fc-[A-Za-z0-9]{25,}/);
    expect(serialized).not.toMatch(/apify_api_[A-Za-z0-9]{25,}/);
  });

  // Test 2: Cost Calculation for Groq and OpenRouter
  it("Test 2: Computes correct token cost estimates for Groq and OpenRouter", () => {
    const groqCost = ModelProviderRouter.calculateCost("groq", 1000000, 1000000);
    expect(groqCost).toBeCloseTo(0.13, 2);

    const openRouterCost = ModelProviderRouter.calculateCost("openrouter", 1000000, 1000000);
    expect(openRouterCost).toBeCloseTo(0.42, 2);
  });

  // Test 3: Harvested Datasets on Disk
  it("Test 3: Verifies external datasets harvested from Stack Overflow and Kaggle APIs exist", () => {
    const soFile = path.resolve(process.cwd(), "training/datasets/harvested/stackoverflow_curated_qa.jsonl");
    const kaggleFile = path.resolve(process.cwd(), "training/datasets/harvested/kaggle_tech_datasets_catalog.jsonl");

    expect(fs.existsSync(soFile)).toBe(true);
    expect(fs.existsSync(kaggleFile)).toBe(true);

    const soLines = fs.readFileSync(soFile, "utf-8").trim().split("\n");
    expect(soLines.length).toBeGreaterThan(0);
    const firstSoRecord = JSON.parse(soLines[0]);
    expect(firstSoRecord.source).toBe("Stack Overflow");
    expect(firstSoRecord.url).toContain("stackoverflow.com");

    const kaggleLines = fs.readFileSync(kaggleFile, "utf-8").trim().split("\n");
    expect(kaggleLines.length).toBeGreaterThan(0);
    const firstKaggleRecord = JSON.parse(kaggleLines[0]);
    expect(firstKaggleRecord.url).toContain("kaggle.com/datasets");
  });

  // Test 4: MentorMaze-2B Socratic Preferred Routing
  it("Test 4: Maintains MentorMaze-2B preference with zero marginal API cost", async () => {
    const result = await ModelProviderRouter.complete({
      preferredProvider: "mentormaze_2b",
      systemPrompt: "You are the AI Mentor.",
      messages: [{ role: "user", content: "Explain how binary search halves the search space." }],
      taskCategory: "reasoning",
    });

    expect(result.provider).toBe("mentormaze_2b");
    expect(result.inferenceMode).toBe("fine-tuned-2b");
    expect(result.estimatedCostUsd).toBe(0.0);
    expect(result.content).toContain("MentorMaze-2B Socratic Scaffolding");
  });
});
