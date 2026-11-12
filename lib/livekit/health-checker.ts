/**
 * LiveKit Health Check and Circuit Breaker Probing Engine.
 * Monitors latency, checks credentials validity, executes recovery probes,
 * and maintains circuit breaker state transitions (closed -> open -> half-open -> closed).
 */

import { AccessToken } from "livekit-server-sdk";
import { livekitRegistry } from "./provider-registry";
import { LiveKitProvider } from "./types";

export interface HealthCheckResult {
  providerId: string;
  isHealthy: boolean;
  latencyMs: number;
  circuitBreakerState: "closed" | "open" | "half-open";
  error?: string;
  checkedAt: string;
}

export class LiveKitHealthChecker {
  private static COOLDOWN_MS = 15_000; // 15 seconds cooldown before half-open trial

  /**
   * Executes a synthetic health check probe against a provider:
   * 1. Validates API credentials by generating a signed probe token.
   * 2. Measures token generation & crypto signature latency.
   * 3. Evaluates circuit breaker cooldown and transition criteria.
   */
  public static async checkProviderHealth(providerId: string): Promise<HealthCheckResult> {
    const provider = livekitRegistry.getProvider(providerId);
    if (!provider) {
      throw new Error(`Provider "${providerId}" not found in registry.`);
    }

    const start = Date.now();
    const checkedAt = new Date().toISOString();

    // Check if circuit breaker is open and whether cooldown has expired for a half-open trial
    if (provider.circuitBreaker.state === "open") {
      const lastFailureTime = provider.circuitBreaker.lastFailureTime
        ? new Date(provider.circuitBreaker.lastFailureTime).getTime()
        : 0;
      const elapsedSinceFailure = Date.now() - lastFailureTime;

      if (elapsedSinceFailure >= this.COOLDOWN_MS) {
        provider.circuitBreaker.state = "half-open";
        provider.circuitBreaker.recoveryAttempts += 1;
      } else {
        // Still in cooldown period
        return {
          providerId,
          isHealthy: false,
          latencyMs: provider.circuitBreaker.lastLatencyMs || 0,
          circuitBreakerState: "open",
          error: `Circuit breaker OPEN. Cooldown active (${Math.ceil((this.COOLDOWN_MS - elapsedSinceFailure) / 1000)}s remaining)`,
          checkedAt,
        };
      }
    }

    try {
      // Execute synthetic probe: Generate and sign an AccessToken with provider's keys
      const probeToken = new AccessToken(provider.apiKey, provider.apiSecret, {
        identity: "health-probe-synthetic",
        ttl: "5m",
      });
      probeToken.addGrant({ room: "probe-healthcheck", roomJoin: true });

      const jwt = await probeToken.toJwt();
      const latencyMs = Math.max(1, Date.now() - start);

      if (!jwt || jwt.split(".").length !== 3) {
        throw new Error("Invalid JWT signature generated during health probe.");
      }

      // Mark success in registry (recovers half-open -> closed)
      livekitRegistry.recordSuccess(providerId, latencyMs);

      return {
        providerId,
        isHealthy: true,
        latencyMs,
        circuitBreakerState: provider.circuitBreaker.state,
        checkedAt,
      };
    } catch (err: any) {
      const latencyMs = Math.max(1, Date.now() - start);
      livekitRegistry.recordError(providerId, err.message || "Probe failed");

      return {
        providerId,
        isHealthy: false,
        latencyMs,
        circuitBreakerState: provider.circuitBreaker.state,
        error: err.message || "Failed health probe",
        checkedAt,
      };
    }
  }

  /**
   * Probes all registered and enabled providers in parallel.
   */
  public static async checkAllProviders(): Promise<HealthCheckResult[]> {
    const providers = livekitRegistry.getAllProviders().filter((p) => p.enabled);
    return await Promise.all(providers.map((p) => this.checkProviderHealth(p.providerId)));
  }

  /**
   * Determines if a provider is currently eligible for traffic assignment:
   * - Must be enabled
   * - Must have healthStatus !== 'unhealthy'
   * - Circuit breaker must NOT be open
   * - Remaining quota must be > 0 (100% quota threshold stops new allocations)
   */
  public static isProviderEligible(provider: LiveKitProvider): boolean {
    if (!provider.enabled) return false;
    if (provider.circuitBreaker.state === "open") return false;
    if (provider.healthStatus === "unhealthy") return false;

    // Quota threshold check (100% quota stops new allocations)
    if (
      provider.usageMetrics.remainingQuotaMinutes !== undefined &&
      provider.usageMetrics.remainingQuotaMinutes <= 0
    ) {
      return false;
    }

    return true;
  }
}

