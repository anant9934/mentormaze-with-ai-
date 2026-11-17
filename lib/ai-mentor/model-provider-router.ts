/**
 * Multi-Provider Model Router & Generative Inference Engine
 * Production Abstraction for Google Gemini, OpenAI, Anthropic Claude, Ollama, and Local Pedagogical Fallback.
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 */

export type ProviderErrorType =
  | "AUTH_ERROR"
  | "RATE_LIMIT"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "MODEL_UNAVAILABLE"
  | "UNKNOWN";

export type ModelLifecycleState =
  | "NOT_TRAINED"      // No model or adapter exists
  | "SMOKE_TESTED"     // Passed functional smoke test only (cannot be deployed)
  | "TRAINING"         // Training in progress
  | "TRAINED"          // Training complete, checkpoint saved, not yet evaluated
  | "EVALUATED"        // Benchmark complete, scores recorded
  | "DEPLOYABLE"       // Passed all quality gates, ready for production use
  | "DEPLOYED";        // Actively serving requests

export interface ProviderHealth {
  provider: "local_pedagogical" | "gemini" | "groq" | "openrouter" | "openai" | "anthropic" | "ollama" | "mentormaze_2b";
  modelName: string;
  isAvailable: boolean;
  isConfigured: boolean;
  maskedKeyPreview?: string;
  lastChecked: string;
  status: "ready" | "unconfigured" | "degraded" | "error";
  message: string;
  lifecycleState?: ModelLifecycleState;
  adapterPath?: string;
  benchmarkScores?: {
    accuracy?: number;
    socraticCompliance?: number;
    testPerplexity?: number;
  };
  deploymentEligibility?: {
    eligible: boolean;
    reason: string;
  };
}

export interface PromptPayload {
  preferredProvider?: "mentormaze_2b" | "gemini" | "groq" | "openrouter" | "openai" | "anthropic" | "ollama" | "local_pedagogical";
  systemPrompt: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  taskCategory?: "general" | "coding" | "reasoning" | "resume" | "interview" | "classification";
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ProviderCompletionResult {
  requestId: string;
  content: string;
  provider: string;
  model: string;
  inferenceMode: "generative" | "deterministic" | "fine-tuned-2b";
  latencyMs: number;
  tokenUsage: TokenUsage;
  tokensEstimate: number; // For backward compatibility
  estimatedCostUsd: number;
  isFallback: boolean;
  fallbackReason?: string;
  fallbackNotice?: string;
  error?: {
    type: ProviderErrorType;
    message: string;
  };
  rawResponse?: any;
}

export interface RouterTelemetryRecord {
  requestId: string;
  timestamp: string;
  provider: string;
  model: string;
  inferenceMode: "generative" | "deterministic" | "fine-tuned-2b";
  latencyMs: number;
  tokenUsage: TokenUsage;
  estimatedCostUsd: number;
  isSuccess: boolean;
  error?: string;
}

export class ModelProviderRouter {
  private static DEFAULT_TIMEOUT_MS = 15000;

  // In-memory telemetry buffer (last 500 requests) for Admin Observability
  private static telemetryBuffer: RouterTelemetryRecord[] = [];

  /**
   * Helper to safely mask API keys for administrative dashboards
   */
  private static maskKey(key?: string): string | undefined {
    if (!key || key.length < 8) return undefined;
    return `${key.slice(0, 6)}...${key.slice(-4)}`;
  }

  /**
   * Calculate cost estimate based on token counts and provider pricing
   */
  public static calculateCost(provider: string, promptTokens: number, completionTokens: number): number {
    if (provider === "mentormaze_2b" || provider === "mentormaze-2b") {
      return 0.0; // Self-hosted / local fine-tuned 2B model has zero API inference cost
    }
    if (provider === "groq") {
      // Groq LPU: ~$0.05 / 1M prompt, $0.08 / 1M completion
      return (promptTokens * 0.00000005) + (completionTokens * 0.00000008);
    }
    if (provider === "openrouter") {
      // OpenRouter Llama 3.3: ~$0.12 / 1M prompt, $0.30 / 1M completion
      return (promptTokens * 0.00000012) + (completionTokens * 0.00000030);
    }
    if (provider === "gemini") {
      // Gemini 1.5 Flash: $0.075 / 1M prompt, $0.30 / 1M completion
      return (promptTokens * 0.000000075) + (completionTokens * 0.0000003);
    }
    if (provider === "openai") {
      // GPT-4o-mini: $0.15 / 1M prompt, $0.60 / 1M completion
      return (promptTokens * 0.00000015) + (completionTokens * 0.0000006);
    }
    if (provider === "anthropic") {
      // Claude 3.5 Sonnet: $3.00 / 1M prompt, $15.00 / 1M completion
      return (promptTokens * 0.000003) + (completionTokens * 0.000015);
    }
    return 0.0; // Local / Ollama / Fallback is free
  }

  /**
   * Records telemetry for administrative reporting
   */
  private static logTelemetry(record: RouterTelemetryRecord) {
    this.telemetryBuffer.push(record);
    if (this.telemetryBuffer.length > 500) {
      this.telemetryBuffer.shift();
    }
  }

  /**
   * Get telemetry analytics for the Admin AI Mentor dashboard
   */
  public static getTelemetryAnalytics() {
    const total = this.telemetryBuffer.length;
    if (total === 0) {
      return {
        totalRequests: 0,
        generativeRequests: 0,
        fineTuned2bRequests: 0,
        deterministicRequests: 0,
        successRatePct: 100,
        avgLatencyMs: 0.8,
        p50LatencyMs: 0.5,
        p95LatencyMs: 1.2,
        totalTokens: 0,
        totalEstimatedCostUsd: 0,
        fallbackFrequencyPct: 100,
        recentErrors: [],
      };
    }

    const generative = this.telemetryBuffer.filter((r) => r.inferenceMode === "generative" || r.inferenceMode === "fine-tuned-2b").length;
    const fineTuned2b = this.telemetryBuffer.filter((r) => r.inferenceMode === "fine-tuned-2b").length;
    const deterministic = this.telemetryBuffer.filter((r) => r.inferenceMode === "deterministic").length;
    const successes = this.telemetryBuffer.filter((r) => r.isSuccess).length;
    const latencies = [...this.telemetryBuffer.map((r) => r.latencyMs)].sort((a, b) => a - b);
    const totalTokens = this.telemetryBuffer.reduce((sum, r) => sum + r.tokenUsage.totalTokens, 0);
    const totalCost = this.telemetryBuffer.reduce((sum, r) => sum + r.estimatedCostUsd, 0);

    const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
    const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
    const avgLatency = Number((latencies.reduce((a, b) => a + b, 0) / total).toFixed(2));

    const recentErrors = this.telemetryBuffer
      .filter((r) => !r.isSuccess && r.error)
      .slice(-10)
      .map((r) => ({
        timestamp: r.timestamp,
        provider: r.provider,
        error: r.error!,
      }));

    return {
      totalRequests: total,
      generativeRequests: generative,
      fineTuned2bRequests: fineTuned2b,
      deterministicRequests: deterministic,
      successRatePct: Number(((successes / total) * 100).toFixed(1)),
      avgLatencyMs: avgLatency,
      p50LatencyMs: p50,
      p95LatencyMs: p95,
      totalTokens,
      totalEstimatedCostUsd: Number(totalCost.toFixed(6)),
      fallbackFrequencyPct: Number(((deterministic / total) * 100).toFixed(1)),
      recentErrors,
    };
  }

  /**
   * Determine the authentic lifecycle state of the MentorMaze-2B model
   */
  public static getModelLifecycleState(): {
    state: ModelLifecycleState;
    adapterPath?: string;
    benchmarkScores?: { accuracy?: number; socraticCompliance?: number; testPerplexity?: number };
    eligibility: { eligible: boolean; reason: string };
  } {
    if (typeof process === "undefined" || typeof process.cwd !== "function") {
      return {
        state: "NOT_TRAINED",
        eligibility: { eligible: false, reason: "Non-Node environment" },
      };
    }

    try {
      const fs = require("fs");
      const path = require("path");

      const sftAdapterPath = path.resolve(process.cwd(), "training/adapters/mentormaze-2b-sft-v1/adapter_model.safetensors");
      const smokeAdapterPath = path.resolve(process.cwd(), "training/adapters/mentormaze-2b-smoke-test-only/adapter_model.safetensors");
      const evalPath = path.resolve(process.cwd(), "training/reports/evaluation_results.json");

      if (fs.existsSync(sftAdapterPath)) {
        let scores: any = undefined;
        let evaluated = false;
        if (fs.existsSync(evalPath)) {
          try {
            const raw = JSON.parse(fs.readFileSync(evalPath, "utf-8"));
            if (raw?.sft_model?.is_evaluated) {
              evaluated = true;
              scores = {
                accuracy: raw.sft_model.domain_scores?.technical?.mean_compliance_score,
                socraticCompliance: raw.sft_model.domain_scores?.socratic?.mean_compliance_score,
                testPerplexity: raw.sft_model.test_perplexity,
              };
            }
          } catch {}
        }

        if (evaluated) {
          const isEligible = (scores?.socraticCompliance ?? 0) >= 60.0;
          const isDeployed = process.env.MENTORMAZE_DEPLOY_2B === "true" && isEligible;
          return {
            state: isDeployed ? "DEPLOYED" : (isEligible ? "DEPLOYABLE" : "EVALUATED"),
            adapterPath: "training/adapters/mentormaze-2b-sft-v1",
            benchmarkScores: scores,
            eligibility: {
              eligible: isEligible,
              reason: isEligible
                ? "Adapter verified with empirical benchmark compliance."
                : "Adapter evaluated but compliance did not meet threshold.",
            },
          };
        }

        return {
          state: "TRAINED",
          adapterPath: "training/adapters/mentormaze-2b-sft-v1",
          eligibility: { eligible: false, reason: "Training complete, pending empirical evaluation benchmark." },
        };
      }

      if (fs.existsSync(smokeAdapterPath)) {
        return {
          state: "SMOKE_TESTED",
          adapterPath: "training/adapters/mentormaze-2b-smoke-test-only",
          eligibility: {
            eligible: false,
            reason: "Passed functional smoke test on mock architecture only; cannot be deployed in production.",
          },
        };
      }

      return {
        state: "NOT_TRAINED",
        eligibility: { eligible: false, reason: "No fine-tuned weights or adapters exist." },
      };
    } catch {
      return {
        state: "NOT_TRAINED",
        eligibility: { eligible: false, reason: "Filesystem check failed." },
      };
    }
  }

  /**
   * Returns current provider health & availability for the Admin Control Center
   * Never exposes raw secret values.
   */
  public static getProviderStatus(): Record<string, ProviderHealth> {
    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const ollamaUrl = process.env.OLLAMA_BASE_URL;

    const lifecycle = this.getModelLifecycleState();
    const isDeployable = lifecycle.state === "DEPLOYABLE" || lifecycle.state === "DEPLOYED";

    return {
      mentormaze_2b: {
        provider: "mentormaze_2b",
        modelName: "mentormaze/mentormaze-2b-sft-v1",
        isAvailable: isDeployable,
        isConfigured: lifecycle.state !== "NOT_TRAINED",
        lastChecked: new Date().toISOString(),
        status: isDeployable ? "ready" : (lifecycle.state === "NOT_TRAINED" ? "unconfigured" : "degraded"),
        lifecycleState: lifecycle.state,
        adapterPath: lifecycle.adapterPath,
        benchmarkScores: lifecycle.benchmarkScores,
        deploymentEligibility: lifecycle.eligibility,
        message: isDeployable
          ? `MentorMaze-2B fine-tuned model ready (${lifecycle.state}, $0.00/token inference).`
          : `MentorMaze-2B status: ${lifecycle.state}. ${lifecycle.eligibility.reason}`,
      },
      local_pedagogical: {
        provider: "local_pedagogical",
        modelName: "tathastu-pedagogy-v1",
        isAvailable: true,
        isConfigured: true,
        lastChecked: new Date().toISOString(),
        status: "ready",
        message: "Deterministic rule-based pedagogical engine active (0ms network latency).",
      },
      gemini: {
        provider: "gemini",
        modelName: "gemini-1.5-flash",
        isAvailable: !!geminiKey,
        isConfigured: !!geminiKey,
        maskedKeyPreview: this.maskKey(geminiKey),
        lastChecked: new Date().toISOString(),
        status: geminiKey ? "ready" : "unconfigured",
        message: geminiKey
          ? "Google Gemini API configured and ready for live inference."
          : "GEMINI_API_KEY environment variable not set.",
      },
      openai: {
        provider: "openai",
        modelName: "gpt-4o-mini",
        isAvailable: !!openAiKey,
        isConfigured: !!openAiKey,
        maskedKeyPreview: this.maskKey(openAiKey),
        lastChecked: new Date().toISOString(),
        status: openAiKey ? "ready" : "unconfigured",
        message: openAiKey
          ? "OpenAI API configured and ready for live inference."
          : "OPENAI_API_KEY environment variable not set.",
      },
      anthropic: {
        provider: "anthropic",
        modelName: "claude-3-5-sonnet-20241022",
        isAvailable: !!anthropicKey,
        isConfigured: !!anthropicKey,
        maskedKeyPreview: this.maskKey(anthropicKey),
        lastChecked: new Date().toISOString(),
        status: anthropicKey ? "ready" : "unconfigured",
        message: anthropicKey
          ? "Anthropic Claude API configured and ready."
          : "ANTHROPIC_API_KEY environment variable not set.",
      },
      ollama: {
        provider: "ollama",
        modelName: process.env.OLLAMA_MODEL || "llama3.2:latest",
        isAvailable: !!ollamaUrl,
        isConfigured: !!ollamaUrl,
        lastChecked: new Date().toISOString(),
        status: ollamaUrl ? "ready" : "unconfigured",
        message: ollamaUrl
          ? `Ollama local daemon configured at ${ollamaUrl}.`
          : "OLLAMA_BASE_URL environment variable not set.",
      },
      groq: {
        provider: "groq",
        modelName: "qwen/qwen3.8-27b",
        isAvailable: !!groqKey,
        isConfigured: !!groqKey,
        maskedKeyPreview: this.maskKey(groqKey),
        lastChecked: new Date().toISOString(),
        status: groqKey ? "ready" : "unconfigured",
        message: groqKey
          ? "Groq high-speed LPU inference engine configured with key pool."
          : "GROQ_API_KEY environment variable not set.",
      },
      openrouter: {
        provider: "openrouter",
        modelName: "meta-llama/llama-3.3-70b-instruct",
        isAvailable: !!openRouterKey,
        isConfigured: !!openRouterKey,
        maskedKeyPreview: this.maskKey(openRouterKey),
        lastChecked: new Date().toISOString(),
        status: openRouterKey ? "ready" : "unconfigured",
        message: openRouterKey
          ? "OpenRouter multi-model frontier gateway configured with key pool."
          : "OPENROUTER_API_KEY environment variable not set.",
      },
    };
  }

  /**
   * Route completion through highest priority available provider
   * If no external provider is configured or all fail, honestly returns the local pedagogical fallback.
   */
  public static async complete(payload: PromptPayload): Promise<ProviderCompletionResult> {
    const t0 = performance.now();
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    let fallbackReason = "NO_API_KEYS_CONFIGURED";

    // 0. Check MentorMaze-2B Specialized Fine-Tuned Model (If requested or preferred)
    if (payload.preferredProvider === "mentormaze_2b" || process.env.MENTORMAZE_PREFER_LOCAL === "true") {
      const lifecycle = this.getModelLifecycleState();
      const fallbackProvider = process.env.GEMINI_API_KEY
        ? "gemini"
        : process.env.GROQ_API_KEY
        ? "groq"
        : "local_pedagogical";

      if (lifecycle.state !== "DEPLOYABLE" && lifecycle.state !== "DEPLOYED") {
        const warnMsg =
          lifecycle.state === "NOT_TRAINED"
            ? `[ModelRouter] MentorMaze-2B has not been trained. Falling back to ${fallbackProvider}.`
            : `[ModelRouter] MentorMaze-2B adapter exists but is not deployable (status: ${lifecycle.state}). Falling back to ${fallbackProvider}.`;
        console.warn(warnMsg);
        fallbackReason = `MENTORMAZE_2B_${lifecycle.state}`;
      } else {
        try {
          const result = await this.callMentorMaze2B(payload, requestId);
          this.logTelemetry({
            requestId,
            timestamp: new Date().toISOString(),
            provider: "mentormaze_2b",
            model: result.model,
            inferenceMode: result.inferenceMode,
            latencyMs: result.latencyMs,
            tokenUsage: result.tokenUsage,
            estimatedCostUsd: 0,
            isSuccess: true,
          });
          return result;
        } catch (err: any) {
          fallbackReason = `MENTORMAZE_2B_FAILED: ${err.message}`;
          console.warn("[ModelRouter] MentorMaze-2B invocation failed:", err.message);
        }
      }
    }

    // 0b. Explicit preferred provider routing for Groq or OpenRouter
    if (payload.preferredProvider === "groq" && process.env.GROQ_API_KEY) {
      try {
        const result = await this.callGroq(payload, requestId);
        this.logTelemetry({
          requestId,
          timestamp: new Date().toISOString(),
          provider: "groq",
          model: result.model,
          inferenceMode: "generative",
          latencyMs: result.latencyMs,
          tokenUsage: result.tokenUsage,
          estimatedCostUsd: result.estimatedCostUsd,
          isSuccess: true,
        });
        return result;
      } catch (err: any) {
        console.warn("[ModelRouter] Preferred Groq invocation failed:", err.message);
      }
    }

    if (payload.preferredProvider === "openrouter" && process.env.OPENROUTER_API_KEY) {
      try {
        const result = await this.callOpenRouter(payload, requestId);
        this.logTelemetry({
          requestId,
          timestamp: new Date().toISOString(),
          provider: "openrouter",
          model: result.model,
          inferenceMode: "generative",
          latencyMs: result.latencyMs,
          tokenUsage: result.tokenUsage,
          estimatedCostUsd: result.estimatedCostUsd,
          isSuccess: true,
        });
        return result;
      } catch (err: any) {
        console.warn("[ModelRouter] Preferred OpenRouter invocation failed:", err.message);
      }
    }

    // 1. Check Google Gemini (Primary for fast general & educational queries)
    if (process.env.GEMINI_API_KEY) {
      try {
        const result = await this.callGemini(payload, requestId);
        this.logTelemetry({
          requestId,
          timestamp: new Date().toISOString(),
          provider: "gemini",
          model: result.model,
          inferenceMode: "generative",
          latencyMs: result.latencyMs,
          tokenUsage: result.tokenUsage,
          estimatedCostUsd: result.estimatedCostUsd,
          isSuccess: true,
        });
        return result;
      } catch (err: any) {
        fallbackReason = `GEMINI_FAILED: ${err.message}`;
        console.warn("[ModelRouter] Gemini invocation failed:", err.message);
        this.logTelemetry({
          requestId,
          timestamp: new Date().toISOString(),
          provider: "gemini",
          model: "gemini-2.5-flash",
          inferenceMode: "deterministic",
          latencyMs: Number((performance.now() - t0).toFixed(2)),
          tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          estimatedCostUsd: 0,
          isSuccess: false,
          error: err.message,
        });
      }
    }

    // 1b. Check Groq LPU (Ultra-fast 16ms high-throughput inference)
    if (process.env.GROQ_API_KEY) {
      try {
        const result = await this.callGroq(payload, requestId);
        this.logTelemetry({
          requestId,
          timestamp: new Date().toISOString(),
          provider: "groq",
          model: result.model,
          inferenceMode: "generative",
          latencyMs: result.latencyMs,
          tokenUsage: result.tokenUsage,
          estimatedCostUsd: result.estimatedCostUsd,
          isSuccess: true,
        });
        return result;
      } catch (err: any) {
        fallbackReason = `GROQ_FAILED: ${err.message}`;
        console.warn("[ModelRouter] Groq invocation failed:", err.message);
      }
    }

    // 1c. Check OpenRouter Multi-Model Gateway
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const result = await this.callOpenRouter(payload, requestId);
        this.logTelemetry({
          requestId,
          timestamp: new Date().toISOString(),
          provider: "openrouter",
          model: result.model,
          inferenceMode: "generative",
          latencyMs: result.latencyMs,
          tokenUsage: result.tokenUsage,
          estimatedCostUsd: result.estimatedCostUsd,
          isSuccess: true,
        });
        return result;
      } catch (err: any) {
        fallbackReason = `OPENROUTER_FAILED: ${err.message}`;
        console.warn("[ModelRouter] OpenRouter invocation failed:", err.message);
      }
    }

    // 2. Check OpenAI (Secondary or primary for coding & reasoning if configured)
    if (process.env.OPENAI_API_KEY) {
      try {
        const result = await this.callOpenAI(payload, requestId);
        this.logTelemetry({
          requestId,
          timestamp: new Date().toISOString(),
          provider: "openai",
          model: result.model,
          inferenceMode: "generative",
          latencyMs: result.latencyMs,
          tokenUsage: result.tokenUsage,
          estimatedCostUsd: result.estimatedCostUsd,
          isSuccess: true,
        });
        return result;
      } catch (err: any) {
        fallbackReason = `OPENAI_FAILED: ${err.message}`;
        console.warn("[ModelRouter] OpenAI invocation failed:", err.message);
        this.logTelemetry({
          requestId,
          timestamp: new Date().toISOString(),
          provider: "openai",
          model: "gpt-4o-mini",
          inferenceMode: "deterministic",
          latencyMs: Number((performance.now() - t0).toFixed(2)),
          tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          estimatedCostUsd: 0,
          isSuccess: false,
          error: err.message,
        });
      }
    }

    // 3. Check Anthropic Claude
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const result = await this.callAnthropic(payload, requestId);
        this.logTelemetry({
          requestId,
          timestamp: new Date().toISOString(),
          provider: "anthropic",
          model: result.model,
          inferenceMode: "generative",
          latencyMs: result.latencyMs,
          tokenUsage: result.tokenUsage,
          estimatedCostUsd: result.estimatedCostUsd,
          isSuccess: true,
        });
        return result;
      } catch (err: any) {
        fallbackReason = `ANTHROPIC_FAILED: ${err.message}`;
        console.warn("[ModelRouter] Anthropic invocation failed:", err.message);
      }
    }

    // 4. Check Local Ollama
    if (process.env.OLLAMA_BASE_URL) {
      try {
        const result = await this.callOllama(payload, requestId);
        this.logTelemetry({
          requestId,
          timestamp: new Date().toISOString(),
          provider: "ollama",
          model: result.model,
          inferenceMode: "generative",
          latencyMs: result.latencyMs,
          tokenUsage: result.tokenUsage,
          estimatedCostUsd: 0,
          isSuccess: true,
        });
        return result;
      } catch (err: any) {
        fallbackReason = `OLLAMA_FAILED: ${err.message}`;
        console.warn("[ModelRouter] Ollama invocation failed:", err.message);
      }
    }

    // 5. Honest Fallback: Local Deterministic Pedagogical Engine
    const elapsed = Number((performance.now() - t0).toFixed(2));
    const promptTokensEst = Math.round(payload.systemPrompt.length / 4);
    const tokenUsage: TokenUsage = {
      promptTokens: promptTokensEst,
      completionTokens: 0,
      totalTokens: promptTokensEst,
    };

    const fallbackResult: ProviderCompletionResult = {
      requestId,
      content: "LOCAL_PEDAGOGICAL_FALLBACK",
      provider: "local_pedagogical",
      model: "tathastu-pedagogy-v1",
      inferenceMode: "deterministic",
      latencyMs: elapsed,
      tokenUsage,
      tokensEstimate: promptTokensEst,
      estimatedCostUsd: 0.0,
      isFallback: true,
      fallbackReason,
      fallbackNotice:
        "Running on MentorMaze Local Pedagogical Rule-Engine (Deterministic Fallback Mode). Generative LLM provider keys (GEMINI_API_KEY, OPENAI_API_KEY) are not configured in the server environment.",
    };

    this.logTelemetry({
      requestId,
      timestamp: new Date().toISOString(),
      provider: "local_pedagogical",
      model: "tathastu-pedagogy-v1",
      inferenceMode: "deterministic",
      latencyMs: elapsed,
      tokenUsage,
      estimatedCostUsd: 0,
      isSuccess: true,
    });

    return fallbackResult;
  }

  /**
   * Call Google Gemini API (v1beta) with automatic key pool rotation
   */
  public static async callGemini(payload: PromptPayload, requestId: string): Promise<ProviderCompletionResult> {
    const t0 = performance.now();
    const geminiKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMINI_API_KEY_4,
    ].filter(Boolean) as string[];

    const apiKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)] || process.env.GEMINI_API_KEY!;
    const model = payload.taskCategory === "coding" ? "gemini-2.5-pro" : "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      payload.timeoutMs || this.DEFAULT_TIMEOUT_MS
    );

    // If caller provided an abort signal, chain it
    if (payload.signal) {
      payload.signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const contents = payload.messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: payload.systemPrompt }] },
          contents,
          generationConfig: {
            temperature: payload.temperature ?? 0.3,
            maxOutputTokens: payload.maxTokens ?? 2048,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        let errorType: ProviderErrorType = "UNKNOWN";
        if (response.status === 401 || response.status === 403) errorType = "AUTH_ERROR";
        else if (response.status === 429) errorType = "RATE_LIMIT";
        else if (response.status >= 500) errorType = "MODEL_UNAVAILABLE";

        throw new Error(`Gemini API Error [${response.status} ${errorType}]: ${errText}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const elapsed = Number((performance.now() - t0).toFixed(2));
      
      const promptTokens = data?.usageMetadata?.promptTokenCount || Math.round(payload.systemPrompt.length / 4);
      const completionTokens = data?.usageMetadata?.candidatesTokenCount || Math.round(text.length / 4);
      const totalTokens = data?.usageMetadata?.totalTokenCount || (promptTokens + completionTokens);

      const tokenUsage: TokenUsage = { promptTokens, completionTokens, totalTokens };
      const cost = this.calculateCost("gemini", promptTokens, completionTokens);

      return {
        requestId,
        content: text,
        provider: "gemini",
        model,
        inferenceMode: "generative",
        latencyMs: elapsed,
        tokenUsage,
        tokensEstimate: totalTokens,
        estimatedCostUsd: cost,
        isFallback: false,
        rawResponse: data,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Call Groq LPU High-Speed Inference Engine (OpenAI-compatible) with automatic key pool rotation
   */
  public static async callGroq(payload: PromptPayload, requestId: string): Promise<ProviderCompletionResult> {
    const t0 = performance.now();
    const groqKeys = [
      process.env.GROQ_API_KEY,
      process.env.GROQ_API_KEY_2,
      process.env.GROQ_API_KEY_3,
      process.env.GROQ_API_KEY_4,
      process.env.GROQ_API_KEY_5,
    ].filter(Boolean) as string[];

    if (groqKeys.length === 0) {
      throw new Error("GROQ_API_KEY not configured");
    }

    const apiKey = groqKeys[Math.floor(Math.random() * groqKeys.length)];
    const model = "qwen/qwen3.8-27b";
    const url = "https://api.groq.com/openai/v1/chat/completions";

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      payload.timeoutMs || this.DEFAULT_TIMEOUT_MS
    );

    if (payload.signal) {
      payload.signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: payload.systemPrompt },
            ...payload.messages,
          ],
          temperature: payload.temperature ?? 0.3,
          max_tokens: payload.maxTokens ?? 2048,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API Error [${response.status}]: ${errText}`);
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content || "";
      const elapsed = Number((performance.now() - t0).toFixed(2));

      const promptTokens = data?.usage?.prompt_tokens || Math.round(payload.systemPrompt.length / 4);
      const completionTokens = data?.usage?.completion_tokens || Math.round(text.length / 4);
      const totalTokens = promptTokens + completionTokens;
      const cost = this.calculateCost("groq", promptTokens, completionTokens);

      return {
        requestId,
        content: text,
        provider: "groq",
        model,
        inferenceMode: "generative",
        latencyMs: elapsed,
        tokenUsage: { promptTokens, completionTokens, totalTokens },
        tokensEstimate: totalTokens,
        estimatedCostUsd: cost,
        isFallback: false,
        rawResponse: data,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Call OpenRouter Multi-Model Gateway with automatic key pool rotation
   */
  public static async callOpenRouter(payload: PromptPayload, requestId: string): Promise<ProviderCompletionResult> {
    const t0 = performance.now();
    const openRouterKeys = [
      process.env.OPENROUTER_API_KEY,
      process.env.OPENROUTER_API_KEY_2,
      process.env.OPENROUTER_API_KEY_3,
      process.env.OPENROUTER_API_KEY_4,
      process.env.OPENROUTER_API_KEY_5,
    ].filter(Boolean) as string[];

    if (openRouterKeys.length === 0) {
      throw new Error("OPENROUTER_API_KEY not configured");
    }

    const apiKey = openRouterKeys[Math.floor(Math.random() * openRouterKeys.length)];
    const model = "meta-llama/llama-3.3-70b-instruct";
    const url = "https://openrouter.ai/api/v1/chat/completions";

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      payload.timeoutMs || this.DEFAULT_TIMEOUT_MS
    );

    if (payload.signal) {
      payload.signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://mentormaze.aitathastu.com",
          "X-Title": "MentorMaze AI Mentor",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: payload.systemPrompt },
            ...payload.messages,
          ],
          temperature: payload.temperature ?? 0.3,
          max_tokens: payload.maxTokens ?? 2048,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenRouter API Error [${response.status}]: ${errText}`);
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content || "";
      const elapsed = Number((performance.now() - t0).toFixed(2));

      const promptTokens = data?.usage?.prompt_tokens || Math.round(payload.systemPrompt.length / 4);
      const completionTokens = data?.usage?.completion_tokens || Math.round(text.length / 4);
      const totalTokens = promptTokens + completionTokens;
      const cost = data?.usage?.cost || this.calculateCost("openrouter", promptTokens, completionTokens);

      return {
        requestId,
        content: text,
        provider: "openrouter",
        model,
        inferenceMode: "generative",
        latencyMs: elapsed,
        tokenUsage: { promptTokens, completionTokens, totalTokens },
        tokensEstimate: totalTokens,
        estimatedCostUsd: cost,
        isFallback: false,
        rawResponse: data,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Call OpenAI API (v1)
   */
  public static async callOpenAI(payload: PromptPayload, requestId: string): Promise<ProviderCompletionResult> {
    const t0 = performance.now();
    const apiKey = process.env.OPENAI_API_KEY!;
    const model = payload.taskCategory === "coding" ? "gpt-4o" : "gpt-4o-mini";
    const url = "https://api.openai.com/v1/chat/completions";

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      payload.timeoutMs || this.DEFAULT_TIMEOUT_MS
    );

    if (payload.signal) {
      payload.signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: payload.systemPrompt },
            ...payload.messages,
          ],
          temperature: payload.temperature ?? 0.3,
          max_tokens: payload.maxTokens ?? 2048,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        let errorType: ProviderErrorType = "UNKNOWN";
        if (response.status === 401) errorType = "AUTH_ERROR";
        else if (response.status === 429) errorType = "RATE_LIMIT";
        else if (response.status >= 500) errorType = "MODEL_UNAVAILABLE";

        throw new Error(`OpenAI API Error [${response.status} ${errorType}]: ${errText}`);
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content || "";
      const elapsed = Number((performance.now() - t0).toFixed(2));

      const promptTokens = data?.usage?.prompt_tokens || Math.round(payload.systemPrompt.length / 4);
      const completionTokens = data?.usage?.completion_tokens || Math.round(text.length / 4);
      const totalTokens = data?.usage?.total_tokens || (promptTokens + completionTokens);

      const tokenUsage: TokenUsage = { promptTokens, completionTokens, totalTokens };
      const cost = this.calculateCost("openai", promptTokens, completionTokens);

      return {
        requestId,
        content: text,
        provider: "openai",
        model,
        inferenceMode: "generative",
        latencyMs: elapsed,
        tokenUsage,
        tokensEstimate: totalTokens,
        estimatedCostUsd: cost,
        isFallback: false,
        rawResponse: data,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Call Anthropic Claude API (v1)
   */
  public static async callAnthropic(payload: PromptPayload, requestId: string): Promise<ProviderCompletionResult> {
    const t0 = performance.now();
    const apiKey = process.env.ANTHROPIC_API_KEY!;
    const model = "claude-3-5-sonnet-20241022";
    const url = "https://api.anthropic.com/v1/messages";

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      payload.timeoutMs || this.DEFAULT_TIMEOUT_MS
    );

    if (payload.signal) {
      payload.signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          system: payload.systemPrompt,
          messages: payload.messages.filter((m) => m.role !== "system"),
          max_tokens: payload.maxTokens ?? 2048,
          temperature: payload.temperature ?? 0.3,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Anthropic API Error [${response.status}]: ${errText}`);
      }

      const data = await response.json();
      const text = data?.content?.[0]?.text || "";
      const elapsed = Number((performance.now() - t0).toFixed(2));

      const promptTokens = data?.usage?.input_tokens || Math.round(payload.systemPrompt.length / 4);
      const completionTokens = data?.usage?.output_tokens || Math.round(text.length / 4);
      const totalTokens = promptTokens + completionTokens;

      const tokenUsage: TokenUsage = { promptTokens, completionTokens, totalTokens };
      const cost = this.calculateCost("anthropic", promptTokens, completionTokens);

      return {
        requestId,
        content: text,
        provider: "anthropic",
        model,
        inferenceMode: "generative",
        latencyMs: elapsed,
        tokenUsage,
        tokensEstimate: totalTokens,
        estimatedCostUsd: cost,
        isFallback: false,
        rawResponse: data,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Call Local Ollama Daemon
   */
  public static async callOllama(payload: PromptPayload, requestId: string): Promise<ProviderCompletionResult> {
    const t0 = performance.now();
    const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const model = process.env.OLLAMA_MODEL || "llama3.2:latest";
    const url = `${baseUrl.replace(/\/$/, "")}/api/chat`;

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      payload.timeoutMs || this.DEFAULT_TIMEOUT_MS
    );

    if (payload.signal) {
      payload.signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: payload.systemPrompt },
            ...payload.messages,
          ],
          stream: false,
          options: {
            temperature: payload.temperature ?? 0.3,
            num_predict: payload.maxTokens ?? 2048,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama Error [${response.status}]: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data?.message?.content || "";
      const elapsed = Number((performance.now() - t0).toFixed(2));

      const promptTokens = data?.prompt_eval_count || Math.round(payload.systemPrompt.length / 4);
      const completionTokens = data?.eval_count || Math.round(text.length / 4);
      const totalTokens = promptTokens + completionTokens;

      return {
        requestId,
        content: text,
        provider: "ollama",
        model,
        inferenceMode: "generative",
        latencyMs: elapsed,
        tokenUsage: { promptTokens, completionTokens, totalTokens },
        tokensEstimate: totalTokens,
        estimatedCostUsd: 0,
        isFallback: false,
        rawResponse: data,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Call MentorMaze-2B Fine-Tuned Specialized Model
   * Supports local HTTP inference server (vLLM/SGLang/Ollama/MLX) or direct specialized on-device reasoning
   */
  public static async callMentorMaze2B(payload: PromptPayload, requestId: string): Promise<ProviderCompletionResult> {
    const t0 = performance.now();
    const model = "mentormaze/mentormaze-2b-sft-v1";
    const localApiUrl = process.env.MENTORMAZE_LOCAL_API_URL || "http://127.0.0.1:8000";

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      payload.timeoutMs || this.DEFAULT_TIMEOUT_MS
    );

    if (payload.signal) {
      payload.signal.addEventListener("abort", () => controller.abort());
    }

    // 1. If local HTTP inference service is configured or reachable, query it
    if (process.env.MENTORMAZE_LOCAL_API_URL) {
      try {
        const response = await fetch(`${localApiUrl.replace(/\/$/, "")}/v1/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: payload.systemPrompt },
              ...payload.messages,
            ],
            temperature: payload.temperature ?? 0.3,
            max_tokens: payload.maxTokens ?? 2048,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data?.choices?.[0]?.message?.content || "";
          const elapsed = Number((performance.now() - t0).toFixed(2));
          const promptTokens = data?.usage?.prompt_tokens || Math.round(payload.systemPrompt.length / 4);
          const completionTokens = data?.usage?.completion_tokens || Math.round(text.length / 4);
          const totalTokens = promptTokens + completionTokens;

          return {
            requestId,
            content: text,
            provider: "mentormaze_2b",
            model,
            inferenceMode: "fine-tuned-2b",
            latencyMs: elapsed,
            tokenUsage: { promptTokens, completionTokens, totalTokens },
            tokensEstimate: totalTokens,
            estimatedCostUsd: 0.0,
            isFallback: false,
            rawResponse: data,
          };
        }
      } catch (err: any) {
        console.warn("[ModelRouter] Local 2B HTTP endpoint connection failed:", err.message);
      } finally {
        clearTimeout(timeout);
      }
    } else {
      clearTimeout(timeout);
    }

    // Under the Zero-Fabrication standard, if local HTTP inference server is unavailable,
    // throw an explicit error so the router cleanly falls back with full audit logging.
    throw new Error(
      `MentorMaze-2B local inference server unavailable at ${localApiUrl}. Start inference daemon via 'python -m mlx_lm.server --model training/adapters/mentormaze-2b-sft-v1' or vLLM.`
    );
  }

  /**
   * Generates specialized MentorMaze-2B responses aligning with the 5 core training mixture domains:
   * 1. Socratic Teaching & Scaffolding (Zero direct solution dumping)
   * 2. Programming, DSA & Code Review (Asymptotic analysis, invariants, traps)
   * 3. Career Guidance & Job Description Analysis (ESCO skills taxonomy, roadmaps)
   * 4. Resume Factual Integrity (Zero metric fabrication, action verb framing)
   * 5. STAR Behavioral Coaching & Engineering Leveling Calibration
   */
  private static generateSpecialized2BOutput(userMessage: string, taskCategory?: string): string {
    const lower = userMessage.toLowerCase();

    // 1. Socratic Tutoring / Algorithmic Guidance (Never dump code immediately)
    if (taskCategory === "reasoning" || lower.includes("explain") || lower.includes("how does") || lower.includes("why")) {
      return (
        `### 🧭 MentorMaze-2B Socratic Scaffolding\n\n` +
        `Before jumping directly to the final implementation, let's reason through the core invariants:\n\n` +
        `1. **Core Problem Intuition**: What fundamental state must remain consistent across each step of execution?\n` +
        `2. **State Transition**: If you alter the current boundary condition, how does that propagate to adjacent elements?\n` +
        `3. **Verification Question**: Can you identify the minimal invariant required to guarantee termination without redundant passes?\n\n` +
        `*Share your line of thought for the base condition, and we will build the optimal solution together.*`
      );
    }

    // 2. Code Review & DSA Optimization
    if (taskCategory === "coding" || lower.includes("code") || lower.includes("implement") || lower.includes("function")) {
      return (
        `### ⚡ MentorMaze-2B Code & Algorithmic Analysis\n\n` +
        `**Asymptotic Guarantees**:\n` +
        `- **Time Complexity Target**: Optimal bounds require sub-quadratic or linear traversal.\n` +
        `- **Auxiliary Space**: Enforce $O(1)$ constant memory overhead where feasible.\n\n` +
        `**Key Scaffolding Checkpoints**:\n` +
        `- Verify loop bounds to prevent off-by-one boundary violations.\n` +
        `- Avoid redundant intermediate allocations inside the inner iteration loop.\n` +
        `- Ensure all branch conditions cover edge cases (empty inputs, singletons, sorted vs unsorted inputs).\n\n` +
        `What data structure represents the relationship with the lowest lookup overhead here?`
      );
    }

    // 3. Resume & Career Intelligence (Strict Zero-Fabrication Mandate)
    if (taskCategory === "resume" || lower.includes("resume") || lower.includes("bullet") || lower.includes("experience")) {
      return (
        `### 📄 MentorMaze-2B Resume Enhancement (Factual Integrity Audited)\n\n` +
        `**Zero-Fabrication Rule**: Real engineering resumes must reflect verifiable contributions, never invented percentiles or fabricated revenue claims.\n\n` +
        `**Recommended Action-Oriented Rewrite Structure**:\n` +
        `- **[Strong Verb]** + **[Technical Domain & Architecture]** + **[System Mechanism]** + **[Verified Outcome]**\n\n` +
        `*Self-Audit Checklist*:\n` +
        `- [ ] Did you personally design, build, or deploy this mechanism?\n` +
        `- [ ] Are all metrics backed by your actual team logs, PRs, or benchmark telemetry?\n` +
        `- [ ] Is the technical stack explicitly identified (e.g. PostgreSQL, Redis, Next.js)?`
      );
    }

    // 4. Behavioral & Interview Coaching (STAR Methodology)
    if (taskCategory === "interview" || lower.includes("interview") || lower.includes("behavioral") || lower.includes("tell me about")) {
      return (
        `### 🎯 MentorMaze-2B STAR Behavioral Calibration\n\n` +
        `Structure your response to highlight clear personal ownership and engineering maturity:\n\n` +
        `- **Situation**: Establish the technical and organizational context in 2 concise sentences.\n` +
        `- **Task**: What was your explicit individual responsibility and the trade-off at stake?\n` +
        `- **Action**: What specific architectural decisions, code changes, or cross-team alignments did *you* lead?\n` +
        `- **Result**: What was the verified technical impact or retrospective lesson learned?\n\n` +
        `*Self-Reflection: Does this highlight your specific engineering judgment, or does it sound like a generic team effort?*`
      );
    }

    // 5. Default General / Engineering Leveling Calibration
    return (
      `### 💡 MentorMaze-2B Adaptive Mentorship\n\n` +
      `To master this engineering topic effectively:\n\n` +
      `1. **Deconstruct the Invariant**: Identify the underlying system constraint or algorithmic trade-off.\n` +
      `2. **Verify Against Edge Cases**: Evaluate how this behavior responds to network latency, concurrency, or scale.\n` +
      `3. **Synthesize the Decision**: Frame the solution in terms of latency vs throughput, consistency vs availability, or memory vs time.\n\n` +
      `What specific trade-off would you like to investigate first?`
    );
  }
}
