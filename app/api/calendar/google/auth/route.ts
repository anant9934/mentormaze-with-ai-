import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server-auth";
import { resolveMentorProfileId } from "@/lib/calendar/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const session = await getServerSession();

    const mentorProfileId = resolveMentorProfileId(
      url.searchParams.get("mentorProfileId") || "mentor-priya"
    );
    const returnUrl = url.searchParams.get("returnUrl") || "/mentor/availability";

    const clientId = process.env.GOOGLE_CLIENT_ID || "";
    if (!clientId) {
      return NextResponse.json(
        {
          success: false,
          error: "Google Client ID not configured. Please set GOOGLE_CLIENT_ID in your environment.",
        },
        { status: 500 }
      );
    }

    // Determine redirect URI: use current origin or production default
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "mentormaze.aitathastu.com";
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const redirectUri = `${proto}://${host}/api/calendar/google/callback`;

    const stateObj = {
      mentorProfileId,
      userId: session?.id || "00000000-0000-0000-0000-000000000002",
      returnUrl,
      timestamp: Date.now(),
    };
    const state = Buffer.from(JSON.stringify(stateObj)).toString("base64url");

    const scopes = [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "openid",
    ].join(" ");

    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", clientId);
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", scopes);
    googleAuthUrl.searchParams.set("access_type", "offline");
    googleAuthUrl.searchParams.set("prompt", "consent");
    googleAuthUrl.searchParams.set("state", state);

    if (url.searchParams.get("format") === "json") {
      return NextResponse.json({ success: true, authUrl: googleAuthUrl.toString() });
    }

    return NextResponse.redirect(googleAuthUrl.toString());
  } catch (error: any) {
    console.error("[API calendar/google/auth] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to initiate Google Calendar auth" },
      { status: 500 }
    );
  }
}

