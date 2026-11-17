import { NextRequest, NextResponse } from "next/server";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";

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
    } = body;

    if (!content.trim()) {
      return NextResponse.json(
        { success: false, error: "Message content cannot be empty." },
        { status: 400 }
      );
    }

    const insertResult: any = await db.execute(sql`
      INSERT INTO session_chat_messages (
        booking_id, sender_user_id, sender_name, sender_role, content, latency_ms
      )
      VALUES (
        ${bookingId}, ${senderUserId}, ${senderName}, ${senderRole}, ${content.trim()}, ${latencyMs}
      )
      RETURNING id, booking_id, sender_user_id, sender_name, sender_role, content, latency_ms, created_at;
    `);

    const message = insertResult.rows?.[0] || insertResult?.[0];

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: any) {
    console.error("[Session Chat POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save message" },
      { status: 500 }
    );
  }
}

