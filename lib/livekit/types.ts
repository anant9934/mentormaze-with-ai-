/**
 * Multi-Provider LiveKit WebRTC Video Infrastructure Types.
 * Designed for weighted traffic distribution, quota-aware routing, circuit breaker failover,
 * and session pinning across multiple independent LiveKit deployments.
 */

export type CircuitBreakerState = "closed" | "open" | "half-open";
export type ProviderHealthStatus = "healthy" | "degraded" | "unhealthy";
export type ProviderOperationalStatus = "active" | "degraded" | "offline";

export interface LiveKitUsageMetrics {
  participantMinutes: number;
  activeParticipants: number;
  activeSessions: number;
  dataTransferBytes: number;
  egressUsageBytes: number;
  monthlyUsageEstimateMinutes: number;
  apiErrors: number;
  totalSessionsRouted: number;
  remainingQuotaMinutes?: number;
  maxMonthlyQuotaMinutes: number;
}

export interface LiveKitCircuitBreaker {
  state: CircuitBreakerState;
  failureCount: number;
  consecutiveFailures: number;
  lastFailureTime?: string;
  lastSuccessTime?: string;
  recoveryAttempts: number;
  lastLatencyMs: number;
  latencyHistory: number[];
}

export interface QuotaThresholds {
  warningPercent: number;  // 70%
  throttlePercent: number; // 85%
  criticalPercent: number; // 95%
  maxPercent: number;      // 100% (stop new allocations)
}

export interface LiveKitProvider {
  providerId: string;
  displayName: string;
  serverUrl: string;
  apiKey: string;
  apiSecret: string;
  projectId: string;
  status: ProviderOperationalStatus;
  priority: number;
  trafficWeight: number; // 0 - 100
  healthStatus: ProviderHealthStatus;
  lastHealthCheck: string;
  usageMetrics: LiveKitUsageMetrics;
  circuitBreaker: LiveKitCircuitBreaker;
  quotaThresholds: QuotaThresholds;
  enabled: boolean;
  notes?: string;
}

/**
 * Public/Sanitized version of LiveKitProvider.
 * Strictly strips apiKey and apiSecret before returning to any client or admin UI.
 */
export type LiveKitProviderPublic = Omit<LiveKitProvider, "apiKey" | "apiSecret">;

export interface LiveKitSessionAssignment {
  bookingId: string;
  roomName: string;
  providerId: string;
  serverUrl: string;
  createdAt: string;
  lastAccessedAt: string;
  activeParticipantsCount: number;
  participantUserIds: string[];
}

export interface LiveKitTokenRequest {
  bookingId: string;
  userId: string;
  userName: string;
  userRole?: "student" | "mentor" | "admin";
}

export interface LiveKitTokenResponse {
  token: string;
  roomName: string;
  wsUrl: string;
  providerId: string;
  providerName: string;
  expiresAt: string;
  ttlSeconds: number;
  circuitBreakerStatus?: CircuitBreakerState;
}

export interface LiveKitRoutingSummary {
  multiProviderActive: boolean;
  activeRoutingStrategy: "weighted_multi_provider" | "single_provider_fallback" | "standby_pool";
  totalProviders: number;
  enabledProvidersCount: number;
  healthyProvidersCount: number;
  trippedCircuitBreakersCount: number;
  totalActiveSessions: number;
  totalActiveParticipants: number;
  monthlyUsageTotalMinutes: number;
  averageLatencyMs: number;
  systemErrorRatePercent: number;
  providers: LiveKitProviderPublic[];
  recentAssignments: LiveKitSessionAssignment[];
}

