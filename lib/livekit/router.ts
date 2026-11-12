/**
 * LiveKit Weighted Random Routing and Session Pinning Engine.
 * Implements cryptographically secure weighted traffic distribution, quota-aware throttling,
 * automatic failover, and strict session-to-provider pinning.
 */

import crypto from "crypto";
import { livekitRegistry } from "./provider-registry";
import { LiveKitHealthChecker } from "./health-checker";
import { LiveKitProvider, LiveKitSessionAssignment } from "./types";
import { store } from "@/lib/data/store";

export class LiveKitRouter {
  /**
   * Generates a cryptographically secure random float in [0, 1).
   */
  private static getSecureRandom(): number {
    // Generate a 32-bit unsigned integer using crypto
    const buf = crypto.randomBytes(4);
    const uint32 = buf.readUInt32BE(0);
    return uint32 / 0x100000000;
  }

  /**
   * Selects a provider for a NEW session using weighted random distribution.
   * Filters out disabled, unhealthy, circuit-broken, and quota-exhausted providers.
   * Adjusts effective weights based on quota utilization (85% throttles traffic).
   */
  public static selectProviderForNewSession(): LiveKitProvider {
    const allProviders = livekitRegistry.getAllProviders();

    // 1. Filter eligible providers
    const eligibleProviders = allProviders.filter((p) =>
      LiveKitHealthChecker.isProviderEligible(p)
    );

    if (eligibleProviders.length === 0) {
      // Emergency: If all eligible providers are tripped, check if any enabled provider exists
      const anyEnabled = allProviders.filter((p) => p.enabled);
      if (anyEnabled.length > 0) {
        // Fallback: Pick highest priority enabled provider in degraded mode
        return anyEnabled.sort((a, b) => a.priority - b.priority)[0];
      }
      throw new Error("No available LiveKit video providers. All clusters are offline or exhausted.");
    }

    // 2. Single Provider Fallback: If only one eligible provider exists, route 100% to it
    if (eligibleProviders.length === 1) {
      return eligibleProviders[0];
    }

    // 3. Compute effective weights with quota awareness
    const weightedItems: { provider: LiveKitProvider; effectiveWeight: number }[] = [];

    for (const provider of eligibleProviders) {
      let weight = provider.trafficWeight;

      // If weight is explicitly 0, skip
      if (weight <= 0) continue;

      // Quota check: calculate percentage used
      const maxQuota = provider.usageMetrics.maxMonthlyQuotaMinutes || 10000;
      const used = provider.usageMetrics.monthlyUsageEstimateMinutes;
      const usagePercent = (used / maxQuota) * 100;

      // If usage >= 85%, throttle traffic weight by 75%
      if (usagePercent >= provider.quotaThresholds.throttlePercent) {
        weight = Math.max(1, Math.round(weight * 0.25));
      }

      weightedItems.push({ provider, effectiveWeight: weight });
    }

    // If all configured weights were 0, fall back to equal weight among eligible
    if (weightedItems.length === 0) {
      for (const provider of eligibleProviders) {
        weightedItems.push({ provider, effectiveWeight: 10 });
      }
    }

    // 4. Calculate total effective weight
    const totalWeight = weightedItems.reduce((sum, item) => sum + item.effectiveWeight, 0);
    if (totalWeight <= 0) {
      return eligibleProviders[0];
    }

    // 5. Cryptographically secure weighted selection
    const randomThreshold = this.getSecureRandom() * totalWeight;
    let accumulated = 0;

    for (const item of weightedItems) {
      accumulated += item.effectiveWeight;
      if (randomThreshold <= accumulated) {
        return item.provider;
      }
    }

    // Fallback to the last item
    return weightedItems[weightedItems.length - 1].provider;
  }

  /**
   * Deterministic Session Pinning:
   * Resolves or assigns the provider and room name for a booking.
   * Once assigned, subsequent requests (by student or mentor) always return the identical
   * provider and room.
   */
  public static getOrCreateSessionAssignment(
    bookingId: string,
    participantUserId: string
  ): LiveKitSessionAssignment {
    // 1. Check in-memory registry for existing assignment
    const existing = livekitRegistry.getSessionAssignment(bookingId);
    if (existing) {
      existing.lastAccessedAt = new Date().toISOString();
      if (!existing.participantUserIds.includes(participantUserId)) {
        existing.participantUserIds.push(participantUserId);
        existing.activeParticipantsCount = existing.participantUserIds.length;
      }
      return existing;
    }

    // 2. Check store booking record for existing room ID or session
    const booking = store.getBookingById(bookingId);
    const existingRoomName = booking?.meetingRoomId || `mm-livekit-${bookingId}`;

    // 3. Select a provider for this new session
    const selectedProvider = this.selectProviderForNewSession();

    // 4. Create and persist the assignment
    const assignment: LiveKitSessionAssignment = {
      bookingId,
      roomName: existingRoomName,
      providerId: selectedProvider.providerId,
      serverUrl: selectedProvider.serverUrl,
      createdAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      activeParticipantsCount: 1,
      participantUserIds: [participantUserId],
    };

    livekitRegistry.saveSessionAssignment(assignment);
    livekitRegistry.recordSessionAssigned(selectedProvider.providerId);

    return assignment;
  }
}
