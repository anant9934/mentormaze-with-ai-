import { NextRequest, NextResponse } from "next/server";
import { LiveKitTokenService } from "@/lib/livekit/token-service";
import { getServerSession } from "@/lib/auth/server-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("bookingId");
  let userId = searchParams.get("userId");
  let userName = searchParams.get("userName");
  const roleParam = searchParams.get("role");

  // Validate server session if available
  const session = await getServerSession(req);
  if (session?.id) {
    userId = session.id;
    userName = session.displayName;
  } else if (!userId) {
    if (roleParam === "mentor") {
      userId = "user-mentor-priya";
      userName = "Priya Sharma";
    } else {
      userId = "user-student-1";
      userName = "Anant Kumar";
    }
  }

  if (!bookingId) {
    return NextResponse.json({ error: "Missing required query parameter: bookingId" }, { status: 400 });
  }

  try {
    const tokenResponse = await LiveKitTokenService.generateTokenForBooking({
      bookingId,
      userId,
      userName: userName || (roleParam === "mentor" ? "Priya Sharma" : "Anant Kumar"),
      userRole: (roleParam === "mentor" ? "mentor" : session?.role || "student") as any,
      skipWindowCheck: true, // Allow joining anytime for live rooms
    });

    return NextResponse.json({
      success: true,
      ...tokenResponse,
    });
  } catch (err: any) {
    switch (err.message) {
      case "BOOKING_NOT_FOUND":
        return NextResponse.json({ error: "Booking not found." }, { status: 404 });
      case "BOOKING_CANCELLED":
        return NextResponse.json(
          { error: "Cannot generate session token: This booking has been cancelled." },
          { status: 400 }
        );
      case "UNAUTHORIZED_PARTICIPANT":
        return NextResponse.json(
          { error: "Forbidden: You are not an authorized participant in this mentorship session." },
          { status: 403 }
        );
      default:
        return NextResponse.json(
          {
            error: "Failed to generate LiveKit room token",
            details: err.message,
          },
          { status: 500 }
        );
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, userId, userName, role } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId in request body" }, { status: 400 });
    }

    const effectiveUserId = userId || (role === "mentor" ? "user-mentor-priya" : "user-student-1");
    const effectiveName = userName || (role === "mentor" ? "Priya Sharma" : "Anant Kumar");

    const tokenResponse = await LiveKitTokenService.generateTokenForBooking({
      bookingId,
      userId: effectiveUserId,
      userName: effectiveName,
      userRole: (role || "student") as any,
      skipWindowCheck: true,
    });

    return NextResponse.json({
      success: true,
      ...tokenResponse,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to generate LiveKit token", details: err.message },
      { status: 500 }
    );
  }
}
