import { NextRequest, NextResponse } from "next/server";
import { LiveKitTokenService } from "@/lib/livekit/token-service";
import { getServerSession } from "@/lib/auth/server-auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("bookingId");
  let userId = searchParams.get("userId");
  let userName = searchParams.get("userName");

  // Validate server session if available
  const session = await getServerSession();
  if (session?.id) {
    userId = session.id;
    userName = session.displayName;
  } else if (!userId) {
    userId = "user-student-1";
    userName = "Anant Kumar";
  }

  if (!bookingId) {
    return NextResponse.json({ error: "Missing required query parameter: bookingId" }, { status: 400 });
  }

  try {
    const tokenResponse = await LiveKitTokenService.generateTokenForBooking({
      bookingId,
      userId,
      userName: userName || "Participant",
      userRole: session?.role as any,
    });

    return NextResponse.json(tokenResponse);
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
