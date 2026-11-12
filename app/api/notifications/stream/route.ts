import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth/server-auth";
import { notificationEventBus } from "@/lib/notifications/event-bus";
import { notificationService } from "@/lib/notifications/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getServerSession();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  let heartbeatTimer: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      // 1. Register with real-time event bus
      notificationEventBus.registerConnection(user.id, connectionId, controller);

      // 2. Send initial unread count
      try {
        const unreadCount = await notificationService.getUnreadCount(user.id);
        const encoder = new TextEncoder();
        const initialPayload = `event: unread_count\ndata: ${JSON.stringify({ unreadCount })}\n\n`;
        controller.enqueue(encoder.encode(initialPayload));
      } catch (err) {
        console.error("Error sending initial unread count:", err);
      }

      // 3. Keep-alive heartbeat every 20 seconds
      heartbeatTimer = setInterval(() => {
        try {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
        } catch {
          if (heartbeatTimer) clearInterval(heartbeatTimer);
          notificationEventBus.removeConnection(user.id, connectionId);
        }
      }, 20000);
    },
    cancel() {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      notificationEventBus.removeConnection(user.id, connectionId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disables Nginx buffering
    },
  });
}

