import { NextRequest, NextResponse } from "next/server";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import { RealtimeChatHub } from "@/lib/chat/realtime-hub";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initializeDatabaseSchema();
    const db = getDb();
    const bookingId = params.id;

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
  } catch (error: any) {
    console.error("[Session Chat GET Error]:", error);
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
    await initializeDatabaseSchema();
    const db = getDb();
    const bookingId = params.id;
    const body = await req.json();

    const {
      senderUserId = "anonymous",
      senderName = "Participant",
      senderRole = "student",
      content = "",
      latencyMs = 0.5,
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
      latencyMs: Number(latencyMs) || 0.4,
      clientSentPerfTime,
      createdAt: new Date().toISOString(),
    };

    // Instant in-memory broadcast (< 0.1ms dispatch)
    RealtimeChatHub.broadcast(bookingId, messagePayload);

    // Asynchronously insert into database
    db.execute(sql`
      INSERT INTO session_chat_messages (
        booking_id, sender_user_id, sender_name, sender_role, content, latency_ms
      )
      VALUES (
        ${bookingId}, ${senderUserId}, ${senderName}, ${senderRole}, ${content.trim()}, ${latencyMs}
      );
    `).catch((dbErr: any) => console.warn("[Session Chat DB Async Insert Error]:", dbErr));

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

