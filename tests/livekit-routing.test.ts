import { describe, it, expect, beforeEach } from "vitest";
import { livekitRegistry } from "../lib/livekit/provider-registry";
import { LiveKitRouter } from "../lib/livekit/router";
import { LiveKitHealthChecker } from "../lib/livekit/health-checker";
import { LiveKitTokenService } from "../lib/livekit/token-service";
import { store } from "../lib/data/store";

describe("MentorMaze Multi-Provider LiveKit Routing System", () => {
  beforeEach(() => {
    // Reset registry to clean state before each test
    livekitRegistry.initializeFromEnv();
    // Ensure primary and secondary weights are explicitly 80 and 20
    livekitRegistry.updateProviderWeight("meet-2uq83g48", 80);
    livekitRegistry.updateProviderWeight("meet-q81ufsro", 20);
    // Ensure both are closed and healthy
    livekitRegistry.resetCircuitBreaker("meet-2uq83g48");
    livekitRegistry.resetCircuitBreaker("meet-q81ufsro");
    livekitRegistry.toggleProvider("meet-2uq83g48", true);
    livekitRegistry.toggleProvider("meet-q81ufsro", true);
  });

  // 1. 80/20 Weighted Allocation Over Large Simulated Sample
  it("approaches the 80/20 ratio over 1,000 simulated new sessions", () => {
    const totalSimulations = 1000;
    const counts: { [id: string]: number } = {
      "meet-2uq83g48": 0,
      "meet-q81ufsro": 0,
    };

    for (let i = 0; i < totalSimulations; i++) {
      const provider = LiveKitRouter.selectProviderForNewSession();
      if (counts[provider.providerId] !== undefined) {
        counts[provider.providerId]++;
      }
    }

    const primaryPercent = (counts["meet-2uq83g48"] / totalSimulations) * 100;
    const secondaryPercent = (counts["meet-q81ufsro"] / totalSimulations) * 100;

    // Over 1000 samples, the 80/20 distribution should fall comfortably within 74% - 86%
    expect(primaryPercent).toBeGreaterThanOrEqual(74);
    expect(primaryPercent).toBeLessThanOrEqual(86);
    expect(secondaryPercent).toBeGreaterThanOrEqual(14);
    expect(secondaryPercent).toBeLessThanOrEqual(26);
    expect(counts["meet-2uq83g48"] + counts["meet-q81ufsro"]).toBe(totalSimulations);
    expect(primaryPercent + secondaryPercent).toBeCloseTo(100);
  });

  // 2. Primary Failure: Automatic Traffic Redistribution
  it("diverts 100% of new traffic to secondary when primary provider fails and trips circuit breaker", () => {
    const primary = livekitRegistry.getProvider("meet-2uq83g48")!;
    expect(primary).toBeDefined();

    // Simulate 3 consecutive failures to trip circuit breaker
    livekitRegistry.recordError("meet-2uq83g48", "Connection timeout");
    livekitRegistry.recordError("meet-2uq83g48", "502 Bad Gateway");
    livekitRegistry.recordError("meet-2uq83g48", "Socket hang up");

    expect(primary.circuitBreaker.state).toBe("open");
    expect(primary.healthStatus).toBe("unhealthy");

    // All subsequent new session selections must route to the secondary cluster
    for (let i = 0; i < 50; i++) {
      const selected = LiveKitRouter.selectProviderForNewSession();
      expect(selected.providerId).toBe("meet-q81ufsro");
    }
  });

  // 3. Secondary Failure: Shift Traffic to Primary
  it("diverts 100% of new traffic to primary when secondary provider fails", () => {
    // Trip secondary
    livekitRegistry.recordError("meet-q81ufsro", "Down for maintenance");
    livekitRegistry.recordError("meet-q81ufsro", "503 Service Unavailable");
    livekitRegistry.recordError("meet-q81ufsro", "503 Service Unavailable");

    const secondary = livekitRegistry.getProvider("meet-q81ufsro")!;
    expect(secondary.circuitBreaker.state).toBe("open");

    for (let i = 0; i < 50; i++) {
      const selected = LiveKitRouter.selectProviderForNewSession();
      expect(selected.providerId).toBe("meet-2uq83g48");
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
    livekitRegistry.recordError("meet-2uq83g48", "Error 1");
    livekitRegistry.recordError("meet-2uq83g48", "Error 2");
    livekitRegistry.recordError("meet-2uq83g48", "Error 3");

    const primary = livekitRegistry.getProvider("meet-2uq83g48")!;
    expect(primary.circuitBreaker.state).toBe("open");

    // Simulate recovery check
    livekitRegistry.recordSuccess("meet-2uq83g48", 18);
    expect(primary.circuitBreaker.state).toBe("closed");
    expect(primary.healthStatus).toBe("healthy");

    // Primary is once again eligible for weighted selection
    const eligible = LiveKitHealthChecker.isProviderEligible(primary);
    expect(eligible).toBe(true);
  });

  // 6. Existing Session Provider Pinning
  it("strictly pins both student and mentor to the identical provider and room name for a booking", async () => {
    const booking = store.getBookingById("booking-1")!;
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
    const primary = livekitRegistry.getProvider("meet-2uq83g48")!;
    // Set remaining quota to 0
    primary.usageMetrics.remainingQuotaMinutes = 0;

    const isEligible = LiveKitHealthChecker.isProviderEligible(primary);
    expect(isEligible).toBe(false);

    // All new traffic goes to secondary
    for (let i = 0; i < 20; i++) {
      const selected = LiveKitRouter.selectProviderForNewSession();
      expect(selected.providerId).not.toBe("meet-2uq83g48");
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
