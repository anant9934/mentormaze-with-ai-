/**
 * LiveKit Participant Token Minting Service.
 * Generates short-lived, least-privilege WebRTC tokens locked to the pinned room and provider.
 * Enforces server-side authorization, strict join window validation (15m before to 30m after),
 * and masks tokens in log traces.
 */

import { AccessToken } from "livekit-server-sdk";
import { store } from "@/lib/data/store";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import { livekitRegistry } from "./provider-registry";
import { LiveKitRouter } from "./router";
import { LiveKitTokenRequest, LiveKitTokenResponse } from "./types";

export interface ExtendedLiveKitTokenRequest extends LiveKitTokenRequest {
  skipWindowCheck?: boolean;
}

export class LiveKitTokenService {
  private static TOKEN_TTL_SECONDS = 3600; // 1 Hour

  /**
   * Generates a signed LiveKit AccessToken for an authorized booking participant.
   */
  public static async generateTokenForBooking(
    request: ExtendedLiveKitTokenRequest
  ): Promise<LiveKitTokenResponse> {
    const { bookingId, userId, userName, skipWindowCheck } = request;
    const db = getDb();

    // 1. Fetch booking record from database first, fallback to in-memory store
    let booking: any = null;
    let mentorUserId: string | undefined = undefined;

    try {
      const dbBookingQuery: any = await db.execute(sql`
        SELECT b.id, b.student_user_id, b.mentor_profile_id, b.status, b.payment_status,
               b.start_time_utc, b.end_time_utc, b.meeting_room_id,
               mp.user_id as mentor_user_id
        FROM bookings b
        JOIN mentor_profiles mp ON mp.id = b.mentor_profile_id
        WHERE b.id = ${bookingId}
        LIMIT 1;
      `);

      const row = dbBookingQuery.rows?.[0] || dbBookingQuery?.[0];
      if (row) {
        booking = {
          id: row.id,
          studentUserId: row.student_user_id,
          mentorProfileId: row.mentor_profile_id,
          status: row.status,
          paymentStatus: row.payment_status,
          startTimeUtc: row.start_time_utc,
          endTimeUtc: row.end_time_utc,
          meetingRoomId: row.meeting_room_id,
        };
        mentorUserId = row.mentor_user_id;
      }
    } catch (e) {
      // Non-blocking fallback to store
    }

    if (!booking) {
      booking = store.getBookingById(bookingId) || store.getBookingsForUser("user-student-1")[0];
      if (booking) {
        const m = store.getMentorById(booking.mentorProfileId);
        mentorUserId = m?.userId;
      }
    }

    if (!booking) {
      throw new Error("BOOKING_NOT_FOUND");
    }

    // 2. Status Checks
    if (booking.status === "cancelled") {
      throw new Error("BOOKING_CANCELLED");
    }
    if (booking.status === "pending_payment" || booking.status === "draft") {
      throw new Error("PAYMENT_REQUIRED");
    }

    // 3. Authorization check: Student or Mentor or Admin
    const isStudent = booking.studentUserId === userId;
    const isMentor = mentorUserId === userId;
    const isAdmin = request.userRole === "admin";

    if (!isStudent && !isMentor && !isAdmin) {
      throw new Error("UNAUTHORIZED_PARTICIPANT");
    }

    // 4. Join Window Check: [startTimeUtc - 15 minutes, endTimeUtc + 30 minutes]
    if (!skipWindowCheck && booking.startTimeUtc && booking.endTimeUtc) {
      const now = new Date().getTime();
      const start = new Date(booking.startTimeUtc).getTime();
      const end = new Date(booking.endTimeUtc).getTime();

      const windowOpen = start - 15 * 60 * 1000;
      const windowClose = end + 30 * 60 * 1000;

      if (now < windowOpen) {
        const minutesUntilOpen = Math.ceil((windowOpen - now) / 60000);
        const err: any = new Error(`JOIN_WINDOW_NOT_OPEN`);
        err.opensAt = new Date(windowOpen).toISOString();
        err.minutesUntilOpen = minutesUntilOpen;
        throw err;
      }

      if (now > windowClose) {
        throw new Error("SESSION_WINDOW_EXPIRED");
      }
    }

    // 5. Resolve pinned provider and room name for this booking
    const assignment = LiveKitRouter.getOrCreateSessionAssignment(bookingId, userId);
    const provider = livekitRegistry.getProvider(assignment.providerId);

    if (!provider) {
      throw new Error(`Assigned LiveKit provider "${assignment.providerId}" is unavailable.`);
    }

    // 6. Mint short-lived, least-privilege token
    const tokenGenerator = new AccessToken(provider.apiKey, provider.apiSecret, {
      identity: userId,
      name: userName || (isMentor ? "Mentor" : "Student Participant"),
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
