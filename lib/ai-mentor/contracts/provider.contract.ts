/**
 * ASTRION Model Provider Contract
 * Standardized metadata contract for inference model providers.
 */

export type ModelProviderKey = "local" | "gemini" | "groq" | "openrouter";

export type ModelLifecycleState = "production" | "experimental" | "fallback" | "offline";

export interface ProviderCapabilityContract {
  provider: ModelProviderKey;
  modelName: string;
  isLocal: boolean;
  isConfigured: boolean;
  isAvailable: boolean;
  lifecycleState: ModelLifecycleState;
  maxContextTokens: number;
  averageLatencyMs: number;
  supportsStreaming: boolean;
  fallbackPriority: number;
}
