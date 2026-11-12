import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server-auth";
import { emailService } from "@/lib/email/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email") || session?.email;

    if (!email) {
      return NextResponse.json({ error: "Email or active session required" }, { status: 400 });
    }

    const prefs = await emailService.getUserPreferences(email, session?.id);
    return NextResponse.json({ success: true, preferences: prefs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load preferences" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    const body = await req.json();
    const { email, preferences, unsubscribeToken } = body;

    // Handle token-based 1-click unsubscribe
    if (unsubscribeToken) {
      const ok = await emailService.unsubscribeByToken(unsubscribeToken);
      if (ok) {
        return NextResponse.json({ success: true, message: "Successfully unsubscribed from promotional emails." });
      } else {
        return NextResponse.json({ error: "Invalid or expired unsubscribe token." }, { status: 400 });
      }
    }

    const targetEmail = email || session?.email;
    if (!targetEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const updated = await emailService.updateUserPreferences(targetEmail, preferences);
    return NextResponse.json({ success: true, preferences: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update preferences" }, { status: 500 });
  }
}
