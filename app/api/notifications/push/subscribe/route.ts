import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server-auth";
import { notificationService } from "@/lib/notifications/service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getServerSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const subscription = body.subscription;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
    }

    const userAgent = req.headers.get("user-agent") || undefined;

    await notificationService.registerPushSubscription(user.id, {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST /api/notifications/push/subscribe error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getServerSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }

    await notificationService.unregisterPushSubscription(body.endpoint);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/notifications/push/subscribe error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

