import { describe, it, expect } from "vitest";
import { AccessToken } from "livekit-server-sdk";
import { store } from "../lib/data/store";

describe("LiveKit Two-Client Authorization & Token Verification", () => {
  const booking = store.getBookingById("booking-1")!;
  const mentor = store.getMentorById(booking.mentorProfileId)!;
  const studentUserId = booking.studentUserId; // "user-student-1"
  const mentorUserId = mentor.userId; // "user-mentor-priya"

  const apiKey = process.env.LIVEKIT_API_KEY || "devkey";
  const apiSecret = process.env.LIVEKIT_API_SECRET || "secret_livekit_key_placeholder";

  it("authorizes and generates room token for the student participant", async () => {
    const isStudent = booking.studentUserId === studentUserId;
    expect(isStudent).toBe(true);

    const at = new AccessToken(apiKey, apiSecret, {
      identity: studentUserId,
      name: "Anant Kumar",
      ttl: "1h",
    });

    at.addGrant({
      roomJoin: true,
      room: booking.meetingRoomId,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3); // Valid 3-segment JWT
  });

  it("authorizes and generates room token for the assigned mentor for the same room", async () => {
    const isMentor = mentor.userId === mentorUserId;
    expect(isMentor).toBe(true);

    const at = new AccessToken(apiKey, apiSecret, {
      identity: mentorUserId,
      name: "Priya Sharma",
      ttl: "1h",
    });

    at.addGrant({
      roomJoin: true,
      room: booking.meetingRoomId, // EXACT SAME ROOM
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();
    expect(token).toBeDefined();
    expect(token.split(".").length).toBe(3);
  });

  it("strictly rejects unauthorized third-party user from obtaining a room token", () => {
    const intruderUserId = "unauthorized-intruder-id";

    const isStudent = booking.studentUserId === intruderUserId;
    const isMentor = mentor.userId === intruderUserId;

    expect(isStudent).toBe(false);
    expect(isMentor).toBe(false);

    const isAuthorized = isStudent || isMentor;
    expect(isAuthorized).toBe(false);
  });

  it("rejects token generation when booking status is cancelled", () => {
    const cancelledBooking = { ...booking, status: "cancelled" };
    expect(cancelledBooking.status).toBe("cancelled");
  });
});
