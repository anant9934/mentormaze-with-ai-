/**
 * Real Cloud Inference, Fallback & Privacy Consent Verification Suite
 * Phase 3 — Verified against live cloud APIs (Groq, Gemini, OpenRouter)
 */

import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";

function loadEnvIfNeeded() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}
loadEnvIfNeeded();

import { ModelProviderRouter } from "@/lib/ai-mentor/model-provider-router";
import { StudentConsentService } from "@/lib/ai-mentor/student-consent-service";

describe("Phase 3 — Real Cloud Inference, Provider Fallback & Consent Revocation", { timeout: 35000 }, () => {
  it("1. makes a real cloud inference request via Groq using synthetic content", async () => {
    const result = await ModelProviderRouter.complete({
      systemPrompt: "You are an automated synthetic testing agent for MentorMaze. Answer in one short sentence.",
      messages: [{ role: "user", content: "State: Staging live cloud inference test ping." }],
      preferredProvider: "groq",
    });

    expect(result.provider).toBe("groq");
    expect(result.inferenceMode).toBe("generative");
    expect(result.isFallback).toBe(false);
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.tokenUsage.totalTokens).toBeGreaterThan(0);
    expect(result.latencyMs).toBeGreaterThan(0);
  });

  it("2. makes a real cloud inference request via Gemini using synthetic content", async () => {
    const result = await ModelProviderRouter.complete({
      systemPrompt: "You are an automated synthetic testing agent for MentorMaze. Answer in one short sentence.",
      messages: [{ role: "user", content: "State: Staging live cloud inference test ping." }],
      preferredProvider: "gemini",
    });

    expect(result.provider).toBe("gemini");
    expect(result.inferenceMode).toBe("generative");
    expect(result.isFallback).toBe(false);
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.tokenUsage.totalTokens).toBeGreaterThan(0);
    expect(result.latencyMs).toBeGreaterThan(0);
  });

  it("3. verifies provider fallback when primary provider is unavailable", async () => {
    const groqKeys = ["GROQ_API_KEY", "GROQ_API_KEY_2", "GROQ_API_KEY_3", "GROQ_API_KEY_4", "GROQ_API_KEY_5"];
    const savedKeys: Record<string, string | undefined> = {};
    for (const k of groqKeys) {
      savedKeys[k] = process.env[k];
      process.env[k] = "gsk_invalid_test_key_for_outage_simulation";
    }

    try {
      const result = await ModelProviderRouter.complete({
        systemPrompt: "You are an automated testing agent. Answer in one word: PONG.",
        messages: [{ role: "user", content: "PING" }],
        preferredProvider: "groq",
      });

      // Should fall back to Gemini or OpenRouter or deterministic rule engine, NOT crash and NOT produce fabricated answer
      expect(["gemini", "openrouter", "local_pedagogical"]).toContain(result.provider);
      expect(result.content.length).toBeGreaterThan(0);
    } finally {
      for (const k of groqKeys) {
        if (savedKeys[k] !== undefined) {
          process.env[k] = savedKeys[k];
        } else {
          delete process.env[k];
        }
      }
    }
  });

  it("4. verifies all configured cloud providers failing produces controlled error/notice, NOT fabricated AI answer", async () => {
    const originalGemini = process.env.GEMINI_API_KEY;
    const originalGroq = process.env.GROQ_API_KEY;
    const originalOpenRouter = process.env.OPENROUTER_API_KEY;

    try {
      delete process.env.GEMINI_API_KEY;
      delete process.env.GROQ_API_KEY;
      delete process.env.OPENROUTER_API_KEY;

      const result = await ModelProviderRouter.complete({
        systemPrompt: "You are a test agent.",
        messages: [{ role: "user", content: "Hello" }],
      });

      // When all generative providers are unavailable, router must NOT fabricate an AI answer.
      // It returns local_pedagogical deterministic fallback with transparent notice.
      expect(result.provider).toBe("local_pedagogical");
      expect(result.inferenceMode).toBe("deterministic");
      expect(result.isFallback).toBe(true);
      expect(result.fallbackNotice).toContain("Deterministic Fallback Mode");
      expect(result.estimatedCostUsd).toBe(0.0);
    } finally {
      process.env.GEMINI_API_KEY = originalGemini;
      process.env.GROQ_API_KEY = originalGroq;
      process.env.OPENROUTER_API_KEY = originalOpenRouter;
    }
  });

  it("5. confirms no local inference endpoint (no Ollama) is enabled in staging", () => {
    const status = ModelProviderRouter.getProviderStatus();
    expect(status.ollama.isAvailable).toBe(false);
    expect(process.env.OLLAMA_BASE_URL).toBeUndefined();
    expect(process.env.ENABLE_LOCAL_LLM).toBeUndefined();
  });

  it("6. confirms API keys are safely masked in administrative status outputs", () => {
    const status = ModelProviderRouter.getProviderStatus();
    for (const [providerName, p] of Object.entries(status)) {
      if (p.maskedKeyPreview) {
        expect(p.maskedKeyPreview).toMatch(/^.{4,6}\.\.\..{4}$/);
        expect(p.maskedKeyPreview).not.toBe(process.env.GEMINI_API_KEY);
        expect(p.maskedKeyPreview).not.toBe(process.env.GROQ_API_KEY);
        expect(p.maskedKeyPreview).not.toBe(process.env.OPENROUTER_API_KEY);
      }
    }
  });

  it("7. verifies token and cost tracking based on actual provider metadata", async () => {
    const result = await ModelProviderRouter.complete({
      systemPrompt: "You are a cost tracking validator. Answer briefly.",
      messages: [{ role: "user", content: "Brief status report" }],
      preferredProvider: "groq",
    });

    expect(result.tokenUsage.totalTokens).toBeGreaterThan(0);
    expect(result.estimatedCostUsd).toBeGreaterThanOrEqual(0.0);
  });

  it("8. verifies consent revocation blocks cloud inference BEFORE provider call occurs", async () => {
    const studentId = "student_consent_test_" + Date.now();

    // 1. Grant consent
    await StudentConsentService.grantConsent(studentId, "external_llm_processing");
    const granted = await StudentConsentService.hasConsent(studentId, "external_llm_processing");
    expect(granted).toBe(true);

    // 2. Revoke consent
    await StudentConsentService.revokeConsent(studentId, "external_llm_processing");
    const revoked = await StudentConsentService.hasConsent(studentId, "external_llm_processing");
    expect(revoked).toBe(false);

    // Spy on callGroq and callGemini to prove NO outbound provider call is made
    const groqSpy = vi.spyOn(ModelProviderRouter as any, "callGroq");
    const geminiSpy = vi.spyOn(ModelProviderRouter as any, "callGemini");

    const result = await ModelProviderRouter.complete({
      studentUserId: studentId,
      systemPrompt: "You are a tutor.",
      messages: [{ role: "user", content: "Explain recursion" }],
      preferredProvider: "groq",
    });

    // Zero outbound provider calls made
    expect(groqSpy).not.toHaveBeenCalled();
    expect(geminiSpy).not.toHaveBeenCalled();

    // Controlled deterministic fallback with explicit privacy notice returned
    expect(result.provider).toBe("local_pedagogical");
    expect(result.inferenceMode).toBe("deterministic");
    expect(result.isFallback).toBe(true);
    expect(result.fallbackNotice).toContain("privacy consent preferences");

    groqSpy.mockRestore();
    geminiSpy.mockRestore();

    // 3. Restore consent only through authorized flow
    await StudentConsentService.grantConsent(studentId, "external_llm_processing");
    const restored = await StudentConsentService.hasConsent(studentId, "external_llm_processing");
    expect(restored).toBe(true);
  });

  it("9. verifies mentor sharing revocation blocks context export without deleting student data", async () => {
    const studentId = "student_share_test_" + Date.now();

    // Grant both
    await StudentConsentService.grantConsent(studentId, "service_personalization");
    await StudentConsentService.grantConsent(studentId, "mentor_sharing");

    expect(await StudentConsentService.hasConsent(studentId, "service_personalization")).toBe(true);
    expect(await StudentConsentService.hasConsent(studentId, "mentor_sharing")).toBe(true);

    // Revoke ONLY mentor_sharing
    await StudentConsentService.revokeConsent(studentId, "mentor_sharing");

    // mentor_sharing is blocked
    expect(await StudentConsentService.hasConsent(studentId, "mentor_sharing")).toBe(false);

    // Personalization remains unaffected (not deleted)
    expect(await StudentConsentService.hasConsent(studentId, "service_personalization")).toBe(true);
  });
});
