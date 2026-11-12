import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { store } from "@/lib/data/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("bookingId");
  const userId = searchParams.get("userId") || "user-student-1";
  const userName = searchParams.get("userName") || "Anant Kumar";

  if (!bookingId) {
    return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
  }

  const booking = store.getBookingById(bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Enforce booking participant authorization: Only the booked student or assigned mentor can join
  const mentor = store.getMentorById(booking.mentorProfileId);
  const isStudent = booking.studentUserId === userId;
  const isMentor = mentor?.userId === userId;

  if (!isStudent && !isMentor) {
    return NextResponse.json(
      { error: "Forbidden: You are not an authorized participant in this mentorship session." },
      { status: 403 }
    );
  }

  if (booking.status === "cancelled") {
    return NextResponse.json(
      { error: "Cannot generate session token: This booking has been cancelled." },
      { status: 400 }
    );
  }

  const apiKey = process.env.LIVEKIT_API_KEY || "devkey";
  const apiSecret = process.env.LIVEKIT_API_SECRET || "secret_livekit_key_placeholder";
  const roomName = booking.meetingRoomId || `room-${booking.id}`;

  try {
    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: userName,
      ttl: "1h",
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      roomName,
      wsUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://mentormaze-dev.livekit.cloud",
    });
  } catch (err: any) {
    return NextResponse.json({
      error: "Failed to generate LiveKit room token",
      details: err.message,
    }, { status: 500 });
  }
}

