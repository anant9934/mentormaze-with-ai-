import { describe, it, expect, beforeEach } from "vitest";
import { livekitRegistry } from "../lib/livekit/provider-registry";
import { LiveKitRouter } from "../lib/livekit/router";
import { LiveKitHealthChecker } from "../lib/livekit/health-checker";
import { LiveKitTokenService } from "../lib/livekit/token-service";
import { store } from "../lib/data/store";

describe("MentorMaze Multi-Provider LiveKit Routing System", () => {
  let primaryId: string;
  let secondaryId: string;

  beforeEach(() => {
    // Reset registry to clean state before each test
    livekitRegistry.initializeFromEnv();
    const providers = livekitRegistry.getAllProviders();
    primaryId = providers[0]?.providerId || "meet-q81ufsro";
    secondaryId = providers[1]?.providerId || "meet-dkw974m2";

    // Ensure primary and secondary weights are explicitly 80 and 20
    livekitRegistry.updateProviderWeight(primaryId, 80);
    livekitRegistry.updateProviderWeight(secondaryId, 20);
    // Ensure both are closed and healthy
    livekitRegistry.resetCircuitBreaker(primaryId);
    livekitRegistry.resetCircuitBreaker(secondaryId);
    livekitRegistry.toggleProvider(primaryId, true);
    livekitRegistry.toggleProvider(secondaryId, true);
  });

  // 1. 80/20 Weighted Allocation Over Large Simulated Sample
  it("approaches the 80/20 ratio over 1,000 simulated new sessions", () => {
    const totalSimulations = 1000;
    const counts: { [id: string]: number } = {
      [primaryId]: 0,
      [secondaryId]: 0,
    };

    for (let i = 0; i < totalSimulations; i++) {
      const provider = LiveKitRouter.selectProviderForNewSession();
      if (counts[provider.providerId] !== undefined) {
        counts[provider.providerId]++;
      }
    }

    const primaryPercent = (counts[primaryId] / totalSimulations) * 100;
    const secondaryPercent = (counts[secondaryId] / totalSimulations) * 100;

    // Over 1000 samples, the 80/20 distribution should fall comfortably within 74% - 86%
    expect(primaryPercent).toBeGreaterThanOrEqual(74);
    expect(primaryPercent).toBeLessThanOrEqual(86);
    expect(secondaryPercent).toBeGreaterThanOrEqual(14);
    expect(secondaryPercent).toBeLessThanOrEqual(26);
    expect(counts[primaryId] + counts[secondaryId]).toBe(totalSimulations);
    expect(primaryPercent + secondaryPercent).toBeCloseTo(100);
  });

  // 2. Primary Failure: Automatic Traffic Redistribution
  it("diverts 100% of new traffic to secondary when primary provider fails and trips circuit breaker", () => {
    const primary = livekitRegistry.getProvider(primaryId)!;
    expect(primary).toBeDefined();

    // Simulate 3 consecutive failures to trip circuit breaker
    livekitRegistry.recordError(primaryId, "Connection timeout");
    livekitRegistry.recordError(primaryId, "502 Bad Gateway");
    livekitRegistry.recordError(primaryId, "Socket hang up");

    expect(primary.circuitBreaker.state).toBe("open");
    expect(primary.healthStatus).toBe("unhealthy");

    // All subsequent new session selections must route to the secondary cluster
    for (let i = 0; i < 50; i++) {
      const selected = LiveKitRouter.selectProviderForNewSession();
      expect(selected.providerId).toBe(secondaryId);
    }
  });

  // 3. Secondary Failure: Shift Traffic to Primary
  it("diverts 100% of new traffic to primary when secondary provider fails", () => {
    // Trip secondary
    livekitRegistry.recordError(secondaryId, "Down for maintenance");
    livekitRegistry.recordError(secondaryId, "503 Service Unavailable");
    livekitRegistry.recordError(secondaryId, "503 Service Unavailable");

    const secondary = livekitRegistry.getProvider(secondaryId)!;
    expect(secondary).toBeDefined();
    expect(secondary.circuitBreaker.state).toBe("open");

    for (let i = 0; i < 50; i++) {
      const selected = LiveKitRouter.selectProviderForNewSession();
      expect(selected.providerId).toBe(primaryId);
    }
  });

  // 4. Both Configured Providers Unavailable (Degraded Fallback or Emergency)
  it("handles dual outage gracefully by attempting available standby or throwing descriptive error", () => {
    // Disable or trip all providers
    const allProviders = livekitRegistry.getAllProviders();
    for (const p of allProviders) {
      livekitRegistry.toggleProvider(p.providerId, false);
    }

    expect(() => {
      LiveKitRouter.selectProviderForNewSession();
    }).toThrow("No available LiveKit video providers");
  });

  // 5. Provider Recovery: Half-Open Trial and Circuit Breaker Reset
  it("successfully detects recovery and restores traffic distribution when circuit breaker closes", async () => {
    // Trip primary
    livekitRegistry.recordError(primaryId, "Error 1");
    livekitRegistry.recordError(primaryId, "Error 2");
    livekitRegistry.recordError(primaryId, "Error 3");

    const primary = livekitRegistry.getProvider(primaryId)!;
    expect(primary.circuitBreaker.state).toBe("open");

    // Simulate recovery check
    livekitRegistry.recordSuccess(primaryId, 18);
    expect(primary.circuitBreaker.state).toBe("closed");
    expect(primary.healthStatus).toBe("healthy");

    // Primary is once again eligible for weighted selection
    const eligible = LiveKitHealthChecker.isProviderEligible(primary);
    expect(eligible).toBe(true);
  });

  // 6. Existing Session Provider Pinning
  it("strictly pins both student and mentor to the identical provider and room name for a booking", async () => {
    const booking = store.getBookingById("booking-1")!;
    // Set booking within join window for test execution
    booking.startTimeUtc = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    booking.endTimeUtc = new Date(Date.now() + 55 * 60 * 1000).toISOString();
    const studentUserId = booking.studentUserId; // "user-student-1"
    const mentor = store.getMentorById(booking.mentorProfileId)!;
    const mentorUserId = mentor.userId; // "user-mentor-priya"

    // 1. Student requests token first
    const studentToken = await LiveKitTokenService.generateTokenForBooking({
      bookingId: booking.id,
      userId: studentUserId,
      userName: "Anant Kumar",
    });

    expect(studentToken.providerId).toBeDefined();
    expect(studentToken.wsUrl).toBeDefined();
    expect(studentToken.roomName).toBeDefined();

    // 2. Mentor requests token second
    const mentorToken = await LiveKitTokenService.generateTokenForBooking({
      bookingId: booking.id,
      userId: mentorUserId,
      userName: "Priya Sharma",
    });

    // Verification: EXACT SAME PROVIDER, WS URL, AND ROOM NAME
    expect(mentorToken.providerId).toBe(studentToken.providerId);
    expect(mentorToken.wsUrl).toBe(studentToken.wsUrl);
    expect(mentorToken.roomName).toBe(studentToken.roomName);

    // 3. Subsequent calls from either participant return the exact same pinned cluster
    const repeatStudentToken = await LiveKitTokenService.generateTokenForBooking({
      bookingId: booking.id,
      userId: studentUserId,
      userName: "Anant Kumar",
    });
    expect(repeatStudentToken.providerId).toBe(studentToken.providerId);
    expect(repeatStudentToken.roomName).toBe(studentToken.roomName);
  });

  // 7. Security: Unauthorized Participant Rejection
  it("strictly rejects third-party users with UNAUTHORIZED_PARTICIPANT error", async () => {
    const intruderUserId = "random-unauthorized-user-999";

    await expect(
      LiveKitTokenService.generateTokenForBooking({
        bookingId: "booking-1",
        userId: intruderUserId,
        userName: "Intruder",
      })
    ).rejects.toThrow("UNAUTHORIZED_PARTICIPANT");
  });

  // 8. Security: Cancelled Booking Rejection
  it("rejects token minting when the target booking is cancelled", async () => {
    // Create or check a cancelled booking
    const booking = store.getBookingById("booking-1")!;
    const originalStatus = booking.status;
    booking.status = "cancelled";

    try {
      await expect(
        LiveKitTokenService.generateTokenForBooking({
          bookingId: booking.id,
          userId: booking.studentUserId,
          userName: "Anant Kumar",
        })
      ).rejects.toThrow("BOOKING_CANCELLED");
    } finally {
      booking.status = originalStatus;
    }
  });

  // 9. Quota Threshold Transitions: 100% Stops New Allocations
  it("stops allocating new sessions to a provider when its quota reaches 100%", () => {
    const primary = livekitRegistry.getProvider(primaryId)!;
    // Set remaining quota to 0
    primary.usageMetrics.remainingQuotaMinutes = 0;

    const isEligible = LiveKitHealthChecker.isProviderEligible(primary);
    expect(isEligible).toBe(false);

    // All new traffic goes to secondary
    for (let i = 0; i < 20; i++) {
      const selected = LiveKitRouter.selectProviderForNewSession();
      expect(selected.providerId).not.toBe(primaryId);
    }
  });

  // 10. Zero Credential Leakage in Public API Summary
  it("strictly omits apiKey and apiSecret from public provider summaries", () => {
    const summary = livekitRegistry.getSummary();

    for (const provider of summary.providers) {
      expect((provider as any).apiKey).toBeUndefined();
      expect((provider as any).apiSecret).toBeUndefined();
      expect(provider.providerId).toBeDefined();
      expect(provider.serverUrl).toBeDefined();
      expect(provider.trafficWeight).toBeDefined();
    }
  });
});
