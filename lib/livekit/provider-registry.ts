/**
 * Multi-Provider LiveKit Registry and Lifecycle Manager.
 * Loads independently configured LiveKit cloud deployments from environment variables.
 * Manages runtime operational state, usage metrics, circuit breaker states, and session pinning.
 */

import {
  LiveKitProvider,
  LiveKitProviderPublic,
  LiveKitSessionAssignment,
  LiveKitRoutingSummary,
} from "./types";
import { loadEnvConfig } from "@next/env";

class LiveKitProviderRegistry {
  private providers: Map<string, LiveKitProvider> = new Map();
  private assignments: Map<string, LiveKitSessionAssignment> = new Map();
  private recentErrors: { providerId: string; timestamp: string; message: string }[] = [];
  private isInitialized = false;

  constructor() {
    this.initializeFromEnv();
  }

  /**
   * Initializes providers from environment variables.
   * Supports Primary/Secondary configuration, numbered provider variables (P1..P12),
   * and legacy single-provider fallbacks.
   */
  public initializeFromEnv(): void {
    // Ensure environment is loaded even under test runners / CLI scripts
    try {
      loadEnvConfig(process.cwd());
    } catch {
      // Ignore if already loaded or not available in browser
    }

    this.providers.clear();

    const discoveredProviders: LiveKitProvider[] = [];

    // 1. Primary Provider Configuration (Default: 80% weight)
    const primaryId = process.env.LIVEKIT_PRIMARY_PROVIDER_ID || "meet-q81ufsro";
    const primaryUrl = process.env.LIVEKIT_PRIMARY_URL || process.env.LIVEKIT_URL;
    const primaryKey = process.env.LIVEKIT_PRIMARY_API_KEY || process.env.LIVEKIT_API_KEY;
    const primarySecret = process.env.LIVEKIT_PRIMARY_API_SECRET || process.env.LIVEKIT_API_SECRET;
    const primaryWeight = parseInt(process.env.LIVEKIT_PRIMARY_WEIGHT || "80", 10);

    if (primaryUrl && primaryKey && primarySecret) {
      discoveredProviders.push(
        this.createProviderInstance({
          providerId: primaryId,
          displayName: process.env.LIVEKIT_PRIMARY_NAME || "LiveKit Primary (Alpha)",
          serverUrl: primaryUrl,
          apiKey: primaryKey,
          apiSecret: primarySecret,
          projectId: primaryId,
          trafficWeight: isNaN(primaryWeight) ? 80 : primaryWeight,
          priority: 1,
          enabled: true,
          notes: "Primary designated production cluster",
        })
      );
    }

    // 2. Secondary Provider Configuration (Default: 20% weight / Failover)
    const secondaryId = process.env.LIVEKIT_SECONDARY_PROVIDER_ID || "meet-q81ufsro";
    const secondaryUrl = process.env.LIVEKIT_SECONDARY_URL;
    const secondaryKey = process.env.LIVEKIT_SECONDARY_API_KEY;
    const secondarySecret = process.env.LIVEKIT_SECONDARY_API_SECRET;
    const secondaryWeight = parseInt(process.env.LIVEKIT_SECONDARY_WEIGHT || "20", 10);

    if (secondaryUrl && secondaryKey && secondarySecret) {
      // Ensure distinct from primary
      if (secondaryId !== primaryId) {
        discoveredProviders.push(
          this.createProviderInstance({
            providerId: secondaryId,
            displayName: process.env.LIVEKIT_SECONDARY_NAME || "LiveKit Secondary (Beta Failover)",
            serverUrl: secondaryUrl,
            apiKey: secondaryKey,
            apiSecret: secondarySecret,
            projectId: secondaryId,
            trafficWeight: isNaN(secondaryWeight) ? 20 : secondaryWeight,
            priority: 2,
            enabled: true,
            notes: "Secondary designated failover cluster",
          })
        );
      }
    }

    // 3. Scan numbered providers (LIVEKIT_P1_... through LIVEKIT_P12_...)
    for (let i = 1; i <= 12; i++) {
      const pId = process.env[`LIVEKIT_P${i}_ID`];
      const pUrl = process.env[`LIVEKIT_P${i}_URL`];
      const pKey = process.env[`LIVEKIT_P${i}_KEY`];
      const pSecret = process.env[`LIVEKIT_P${i}_SECRET`];
      const pName = process.env[`LIVEKIT_P${i}_NAME`];
      const pWeight = parseInt(process.env[`LIVEKIT_P${i}_WEIGHT`] || "0", 10);
      const pEnabled = process.env[`LIVEKIT_P${i}_ENABLED`] !== "false";

      if (pId && pUrl && pKey && pSecret) {
        // If already added via primary/secondary, update display name if more specific
        const existing = discoveredProviders.find((p) => p.providerId === pId);
        if (!existing) {
          discoveredProviders.push(
            this.createProviderInstance({
              providerId: pId,
              displayName: pName || `LiveKit Cluster P${i}`,
              serverUrl: pUrl,
              apiKey: pKey,
              apiSecret: pSecret,
              projectId: pId,
              trafficWeight: isNaN(pWeight) ? 0 : pWeight,
              priority: i + 2,
              enabled: pEnabled,
              notes: `Standby pool cluster #${i}`,
            })
          );
        }
      }
    }

    // 4. Fallback if no environment variables are populated at all (safe dev fallback)
    if (discoveredProviders.length === 0) {
      discoveredProviders.push(
        this.createProviderInstance({
          providerId: "livekit-dev-standalone",
          displayName: "LiveKit Local Dev Fallback",
          serverUrl: "wss://mentormaze-dev.livekit.cloud",
          apiKey: "devkey",
          apiSecret: "secret_livekit_key_placeholder",
          projectId: "dev-standalone",
          trafficWeight: 100,
          priority: 1,
          enabled: true,
          notes: "Auto-generated mock dev fallback (single provider mode)",
        })
      );
    }

    // Store discovered providers
    for (const provider of discoveredProviders) {
      this.providers.set(provider.providerId, provider);
    }

    this.isInitialized = true;
  }

  private createProviderInstance(params: {
    providerId: string;
    displayName: string;
    serverUrl: string;
    apiKey: string;
    apiSecret: string;
    projectId: string;
    trafficWeight: number;
    priority: number;
    enabled: boolean;
    notes?: string;
  }): LiveKitProvider {
    return {
      providerId: params.providerId,
      displayName: params.displayName,
      serverUrl: params.serverUrl,
      apiKey: params.apiKey,
      apiSecret: params.apiSecret,
      projectId: params.projectId,
      status: "active",
      priority: params.priority,
      trafficWeight: params.trafficWeight,
      healthStatus: "healthy",
      lastHealthCheck: new Date().toISOString(),
      usageMetrics: {
        participantMinutes: 0,
        activeParticipants: 0,
        activeSessions: 0,
        dataTransferBytes: 0,
        egressUsageBytes: 0,
        monthlyUsageEstimateMinutes: 0,
        apiErrors: 0,
        totalSessionsRouted: 0,
        remainingQuotaMinutes: 10000,
        maxMonthlyQuotaMinutes: 10000,
      },
      circuitBreaker: {
        state: "closed",
        failureCount: 0,
        consecutiveFailures: 0,
        recoveryAttempts: 0,
        lastLatencyMs: 24,
        latencyHistory: [24, 28, 22],
      },
      quotaThresholds: {
        warningPercent: 70,
        throttlePercent: 85,
        criticalPercent: 95,
        maxPercent: 100,
      },
      enabled: params.enabled,
      notes: params.notes,
    };
  }

  /**
   * Retrieves all registered providers (internal server-side use only).
   */
  public getAllProviders(): LiveKitProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Retrieves a specific provider by its ID.
   */
  public getProvider(id: string): LiveKitProvider | undefined {
    return this.providers.get(id);
  }

  /**
   * Returns sanitized public providers with api secrets and keys stripped.
   * Safe for transmission to frontend admin dashboard.
   */
  public getPublicProviders(): LiveKitProviderPublic[] {
    return Array.from(this.providers.values()).map((p) => {
      const safe = { ...p };
      delete (safe as any).apiKey;
      delete (safe as any).apiSecret;
      return safe;
    });
  }

  /**
   * Dynamically updates a provider's traffic weight.
   */
  public updateProviderWeight(id: string, weight: number): void {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`Provider "${id}" not found in registry.`);
    }
    const clampedWeight = Math.max(0, Math.min(100, Math.round(weight)));
    provider.trafficWeight = clampedWeight;
  }

  /**
   * Enables or disables a provider.
   */
  public toggleProvider(id: string, enabled: boolean): void {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`Provider "${id}" not found in registry.`);
    }
    provider.enabled = enabled;
  }

  /**
   * Records a new session assignment for the given provider.
   */
  public recordSessionAssigned(providerId: string): void {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.usageMetrics.activeSessions += 1;
      provider.usageMetrics.totalSessionsRouted += 1;
      provider.usageMetrics.activeParticipants += 2; // student + mentor
      provider.usageMetrics.monthlyUsageEstimateMinutes += 45; // average 45 min allocation
      if (provider.usageMetrics.remainingQuotaMinutes !== undefined) {
        provider.usageMetrics.remainingQuotaMinutes = Math.max(
          0,
          provider.usageMetrics.remainingQuotaMinutes - 45
        );
      }
    }
  }

  /**
   * Records session conclusion and duration.
   */
  public recordSessionEnded(providerId: string, durationMinutes = 45): void {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.usageMetrics.activeSessions = Math.max(0, provider.usageMetrics.activeSessions - 1);
      provider.usageMetrics.activeParticipants = Math.max(0, provider.usageMetrics.activeParticipants - 2);
      provider.usageMetrics.participantMinutes += durationMinutes * 2;
    }
  }

  /**
   * Records an API error or failure for circuit breaker monitoring.
   */
  public recordError(providerId: string, errorMessage = "Connection failed"): void {
    const provider = this.providers.get(providerId);
    if (!provider) return;

    provider.usageMetrics.apiErrors += 1;
    provider.circuitBreaker.failureCount += 1;
    provider.circuitBreaker.consecutiveFailures += 1;
    provider.circuitBreaker.lastFailureTime = new Date().toISOString();

    this.recentErrors.unshift({
      providerId,
      timestamp: new Date().toISOString(),
      message: errorMessage,
    });
    if (this.recentErrors.length > 50) this.recentErrors.pop();

    // Check circuit breaker trip condition: 3 consecutive failures
    if (provider.circuitBreaker.consecutiveFailures >= 3) {
      provider.circuitBreaker.state = "open";
      provider.healthStatus = "unhealthy";
      provider.status = "degraded";
    } else {
      provider.healthStatus = "degraded";
    }
  }

  /**
   * Records a successful operation or health check probe.
   */
  public recordSuccess(providerId: string, latencyMs = 25): void {
    const provider = this.providers.get(providerId);
    if (!provider) return;

    provider.circuitBreaker.consecutiveFailures = 0;
    provider.circuitBreaker.lastSuccessTime = new Date().toISOString();
    provider.circuitBreaker.lastLatencyMs = latencyMs;
    provider.circuitBreaker.latencyHistory.push(latencyMs);
    if (provider.circuitBreaker.latencyHistory.length > 20) {
      provider.circuitBreaker.latencyHistory.shift();
    }

    if (provider.circuitBreaker.state === "half-open" || provider.circuitBreaker.state === "open") {
      // Successful trial probe or health check recovers the circuit breaker to closed
      provider.circuitBreaker.state = "closed";
    }

    provider.healthStatus = "healthy";
    provider.status = "active";
    provider.lastHealthCheck = new Date().toISOString();
  }

  /**
   * Manually resets a provider's circuit breaker to closed.
   */
  public resetCircuitBreaker(providerId: string): void {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider "${providerId}" not found.`);
    }
    provider.circuitBreaker.state = "closed";
    provider.circuitBreaker.consecutiveFailures = 0;
    provider.healthStatus = "healthy";
    provider.status = "active";
    provider.lastHealthCheck = new Date().toISOString();
  }

  /**
   * Session Pinning: Stores or retrieves the deterministic assignment for a booking.
   */
  public getSessionAssignment(bookingId: string): LiveKitSessionAssignment | undefined {
    return this.assignments.get(bookingId);
  }

  public saveSessionAssignment(assignment: LiveKitSessionAssignment): void {
    this.assignments.set(assignment.bookingId, assignment);
  }

  /**
   * Generates comprehensive system summary for the Video Infrastructure Dashboard.
   */
  public getSummary(): LiveKitRoutingSummary {
    const allProviders = this.getAllProviders();
    const enabledProviders = allProviders.filter((p) => p.enabled);
    const healthyProviders = allProviders.filter((p) => p.healthStatus === "healthy");
    const trippedBreakers = allProviders.filter((p) => p.circuitBreaker.state === "open");

    const multiProviderActive = enabledProviders.filter((p) => p.trafficWeight > 0).length >= 2;
    const activeRoutingStrategy = multiProviderActive
      ? "weighted_multi_provider"
      : enabledProviders.length === 1
      ? "single_provider_fallback"
      : "standby_pool";

    let totalSessions = 0;
    let totalParticipants = 0;
    let totalMinutes = 0;
    let totalErrors = 0;
    let latencySum = 0;
    let latencyCount = 0;

    for (const p of allProviders) {
      totalSessions += p.usageMetrics.activeSessions;
      totalParticipants += p.usageMetrics.activeParticipants;
      totalMinutes += p.usageMetrics.monthlyUsageEstimateMinutes;
      totalErrors += p.usageMetrics.apiErrors;
      if (p.circuitBreaker.lastLatencyMs > 0) {
        latencySum += p.circuitBreaker.lastLatencyMs;
        latencyCount++;
      }
    }

    const averageLatencyMs = latencyCount > 0 ? Math.round(latencySum / latencyCount) : 24;
    const systemErrorRatePercent =
      totalSessions > 0 ? parseFloat(((totalErrors / (totalSessions * 10)) * 100).toFixed(2)) : 0;

    const recentAssignments = Array.from(this.assignments.values())
      .sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime())
      .slice(0, 15);

    return {
      multiProviderActive,
      activeRoutingStrategy,
      totalProviders: allProviders.length,
      enabledProvidersCount: enabledProviders.length,
      healthyProvidersCount: healthyProviders.length,
      trippedCircuitBreakersCount: trippedBreakers.length,
      totalActiveSessions: totalSessions,
      totalActiveParticipants: totalParticipants,
      monthlyUsageTotalMinutes: totalMinutes,
      averageLatencyMs,
      systemErrorRatePercent,
      providers: this.getPublicProviders(),
      recentAssignments,
    };
  }

  public getRecentErrors() {
    return [...this.recentErrors];
  }
}

// Global Singleton Instance
export const livekitRegistry = new LiveKitProviderRegistry();
