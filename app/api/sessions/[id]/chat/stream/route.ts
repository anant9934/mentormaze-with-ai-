import { NextRequest } from "next/server";
import { RealtimeChatHub } from "@/lib/chat/realtime-hub";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const bookingId = params.id;
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // Send initial connection packet
  writer.write(encoder.encode(`data: ${JSON.stringify({ type: "CONNECTED", timestamp: Date.now() })}\n\n`)).catch(() => {});

  // Subscribe to instant message broadcasts (< 1ms)
  const unsubscribe = RealtimeChatHub.subscribe(bookingId, (message) => {
    try {
      const packet = `data: ${JSON.stringify(message)}\n\n`;
      writer.write(encoder.encode(packet)).catch(() => {});
    } catch {}
  });

  // Keep-alive heartbeat every 15s to prevent proxy timeouts
  const heartbeatInterval = setInterval(() => {
    writer.write(encoder.encode(`: ping\n\n`)).catch(() => {});
  }, 15000);

  req.signal.addEventListener("abort", () => {
    clearInterval(heartbeatInterval);
    unsubscribe();
    writer.close().catch(() => {});
  });

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
