/**
 * LiveKit Participant Token Minting Service.
 * Generates short-lived, least-privilege WebRTC tokens locked to the pinned room and provider.
 * Enforces server-side authorization and masks tokens in log traces.
 */

import { AccessToken } from "livekit-server-sdk";
import { store } from "@/lib/data/store";
import { livekitRegistry } from "./provider-registry";
import { LiveKitRouter } from "./router";
import { LiveKitTokenRequest, LiveKitTokenResponse } from "./types";

export class LiveKitTokenService {
  private static TOKEN_TTL_SECONDS = 3600; // 1 Hour

  /**
   * Generates a signed LiveKit AccessToken for an authorized booking participant.
   */
  public static async generateTokenForBooking(
    request: LiveKitTokenRequest
  ): Promise<LiveKitTokenResponse> {
    const { bookingId, userId, userName } = request;

    // 1. Fetch booking record
    const booking = store.getBookingById(bookingId);
    if (!booking) {
      throw new Error("BOOKING_NOT_FOUND");
    }

    // 2. Cancellation check
    if (booking.status === "cancelled") {
      throw new Error("BOOKING_CANCELLED");
    }

    // 3. Authorization check: Student or Mentor on the booking
    const mentor = store.getMentorById(booking.mentorProfileId);
    const mentorUser = mentor ? store.getUser(mentor.userId) : undefined;
    const isStudent = booking.studentUserId === userId;
    const isMentor = mentor?.userId === userId;
    const isAdmin = request.userRole === "admin";

    if (!isStudent && !isMentor && !isAdmin) {
      throw new Error("UNAUTHORIZED_PARTICIPANT");
    }

    // 4. Resolve pinned provider and room name for this booking
    const assignment = LiveKitRouter.getOrCreateSessionAssignment(bookingId, userId);
    const provider = livekitRegistry.getProvider(assignment.providerId);

    if (!provider) {
      throw new Error(`Assigned LiveKit provider "${assignment.providerId}" is unavailable.`);
    }

    // 5. Mint short-lived, least-privilege token
    const tokenGenerator = new AccessToken(provider.apiKey, provider.apiSecret, {
      identity: userId,
      name: userName || (isMentor ? mentorUser?.displayName || "Mentor" : "Student Participant"),
      ttl: `${this.TOKEN_TTL_SECONDS}s`,
    });

    // Least-privilege grant: restricted to this exact room only
    tokenGenerator.addGrant({
      roomJoin: true,
      room: assignment.roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await tokenGenerator.toJwt();
    const expiresAt = new Date(Date.now() + this.TOKEN_TTL_SECONDS * 1000).toISOString();

    // Mask token in internal diagnostics trace
    const maskedToken = `${token.slice(0, 10)}...${token.slice(-6)}`;
    if (process.env.NODE_ENV !== "test") {
      console.info(
        `[LiveKit] Token minted for user ${userId} in room ${assignment.roomName} via provider ${provider.displayName} (${maskedToken})`
      );
    }

    return {
      token,
      roomName: assignment.roomName,
      wsUrl: provider.serverUrl,
      providerId: provider.providerId,
      providerName: provider.displayName,
      expiresAt,
      ttlSeconds: this.TOKEN_TTL_SECONDS,
      circuitBreakerStatus: provider.circuitBreaker.state,
    };
  }
}
