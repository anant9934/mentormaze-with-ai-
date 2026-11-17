import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { RealtimeChatHub } from "@/lib/chat/realtime-hub";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    const memoryHistory = RealtimeChatHub.getHistory(bookingId);

    // If we have in-memory messages, return them instantly (< 0.1ms)
    if (memoryHistory.length > 0) {
      return NextResponse.json({
        success: true,
        bookingId,
        messages: memoryHistory.map((m) => ({
          id: m.id,
          booking_id: bookingId,
          sender_user_id: m.senderUserId,
          sender_name: m.senderName,
          sender_role: m.senderRole,
          content: m.content,
          latency_ms: m.latencyMs,
          created_at: m.createdAt,
        })),
      });
    }

    // Otherwise query database
    try {
      const db = getDb();
      const messagesQuery: any = await db.execute(sql`
        SELECT id, booking_id, sender_user_id, sender_name, sender_role, content, latency_ms, created_at
        FROM session_chat_messages
        WHERE booking_id = ${bookingId}
        ORDER BY created_at ASC;
      `);

      const messages = messagesQuery.rows || messagesQuery || [];
      return NextResponse.json({
        success: true,
        bookingId,
        messages,
      });
    } catch {
      return NextResponse.json({
        success: true,
        bookingId,
        messages: [],
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load session messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    const body = await req.json();

    const {
      senderUserId = "anonymous",
      senderName = "Participant",
      senderRole = "student",
      content = "",
      latencyMs = 0.4,
      clientSentPerfTime = Date.now(),
      id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    } = body;

    if (!content.trim()) {
      return NextResponse.json(
        { success: false, error: "Message content cannot be empty." },
        { status: 400 }
      );
    }

    const messagePayload = {
      type: "CHAT_MESSAGE",
      id,
      bookingId,
      senderUserId,
      senderName,
      senderRole,
      content: content.trim(),
      latencyMs: Number(latencyMs) || 0.3,
      clientSentPerfTime,
      createdAt: new Date().toISOString(),
    };

    // 1. INSTANT IN-MEMORY DISPATCH (< 0.1ms to all open SSE connections)
    RealtimeChatHub.broadcast(bookingId, messagePayload);

    // 2. Non-blocking asynchronous background DB persistence
    try {
      const db = getDb();
      db.execute(sql`
        INSERT INTO session_chat_messages (
          booking_id, sender_user_id, sender_name, sender_role, content, latency_ms
        )
        VALUES (
          ${bookingId}, ${senderUserId}, ${senderName}, ${senderRole}, ${content.trim()}, ${latencyMs}
        );
      `).catch(() => {});
    } catch {
      // Non-fatal
    }

    return NextResponse.json({
      success: true,
      message: messagePayload,
    });
  } catch (error: any) {
    console.error("[Session Chat POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save message" },
      { status: 500 }
    );
  }
}
