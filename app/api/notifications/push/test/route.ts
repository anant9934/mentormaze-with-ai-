import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server-auth";
import { notificationService } from "@/lib/notifications/service";
import { getVapidPublicKey } from "@/lib/notifications/web-push";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    publicKey: getVapidPublicKey(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getServerSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Dispatch a test notification with all channels enabled
    const result = await notificationService.dispatch({
      userId: user.id,
      title: "MentorMaze Push Test 🚀",
      message: "Browser push notifications are active and properly configured for your device.",
      category: "general",
      priority: "normal",
      actionUrl: "/notifications",
      actionLabel: "View Notifications",
      channels: ["in_app", "sse", "push"],
    });

    return NextResponse.json({
      success: true,
      message: "Test push notification dispatched",
      result,
    });
  } catch (err: any) {
    console.error("POST /api/notifications/push/test error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

