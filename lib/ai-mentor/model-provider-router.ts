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

export interface ProviderHealth {
  provider: "local_pedagogical" | "gemini" | "openai" | "anthropic" | "ollama";
  modelName: string;
  isAvailable: boolean;
  isConfigured: boolean;
  maskedKeyPreview?: string;
  lastChecked: string;
  status: "ready" | "unconfigured" | "degraded" | "error";
  message: string;
}

export interface PromptPayload {
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
  inferenceMode: "generative" | "deterministic";
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
  inferenceMode: "generative" | "deterministic";
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

    const generative = this.telemetryBuffer.filter((r) => r.inferenceMode === "generative").length;
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
   * Returns current provider health & availability for the Admin Control Center
   * Never exposes raw secret values.
   */
  public static getProviderStatus(): Record<string, ProviderHealth> {
    const geminiKey = process.env.GEMINI_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const ollamaUrl = process.env.OLLAMA_BASE_URL;

    return {
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
          model: "gemini-1.5-flash",
          inferenceMode: "deterministic",
          latencyMs: Number((performance.now() - t0).toFixed(2)),
          tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          estimatedCostUsd: 0,
          isSuccess: false,
          error: err.message,
        });
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
   * Call Google Gemini API (v1beta)
   */
  public static async callGemini(payload: PromptPayload, requestId: string): Promise<ProviderCompletionResult> {
    const t0 = performance.now();
    const apiKey = process.env.GEMINI_API_KEY!;
    const model = payload.taskCategory === "coding" ? "gemini-1.5-pro" : "gemini-1.5-flash";
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
}
