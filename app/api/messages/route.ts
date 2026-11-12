import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server-auth";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }

    const db = getDb();

    // Verify conversation membership: user must be student or mentor
    const convCheck: any = await db.execute(sql`
      SELECT id, student_user_id, mentor_user_id
      FROM conversations
      WHERE id = ${conversationId}
        AND (student_user_id = ${session.id} OR mentor_user_id = ${session.id})
      LIMIT 1;
    `);

    const conv = convCheck.rows?.[0] || convCheck?.[0];
    if (!conv) {
      return NextResponse.json({ error: "Forbidden: Not a participant of this conversation" }, { status: 403 });
    }

    // Retrieve messages from PostgreSQL
    const messagesQuery: any = await db.execute(sql`
      SELECT id, conversation_id, sender_user_id, content, attachment_url, attachment_name, is_read, created_at
      FROM messages
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at ASC;
    `);

    return NextResponse.json({
      messages: messagesQuery.rows || messagesQuery || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { conversationId, content, attachmentUrl, attachmentName } = body;

    if (!conversationId || !content?.trim()) {
      return NextResponse.json({ error: "conversationId and content are required" }, { status: 400 });
    }

    const db = getDb();

    // Enforce conversation membership
    const convCheck: any = await db.execute(sql`
      SELECT id, student_user_id, mentor_user_id
      FROM conversations
      WHERE id = ${conversationId}
        AND (student_user_id = ${session.id} OR mentor_user_id = ${session.id})
      LIMIT 1;
    `);

    const conv = convCheck.rows?.[0] || convCheck?.[0];
    if (!conv) {
      return NextResponse.json({ error: "Forbidden: Not authorized to send messages to this conversation" }, { status: 403 });
    }

    // Insert message into PostgreSQL
    const insertResult: any = await db.execute(sql`
      INSERT INTO messages (conversation_id, sender_user_id, content, attachment_url, attachment_name, is_read)
      VALUES (${conversationId}, ${session.id}, ${content.trim()}, ${attachmentUrl || null}, ${attachmentName || null}, false)
      RETURNING id, conversation_id, sender_user_id, content, attachment_url, attachment_name, created_at;
    `);

    const message = insertResult.rows?.[0] || insertResult?.[0];

    // Update conversation last_message
    await db.execute(sql`
      UPDATE conversations
      SET last_message_text = ${content.trim()}, last_message_at = now()
      WHERE id = ${conversationId};
    `);

    // Audit outbox event for real-time notification
    await db.execute(sql`
      INSERT INTO outbox_events (event_type, payload, status)
      VALUES ('chat.message_sent', ${JSON.stringify({ messageId: message.id, conversationId })}, 'pending');
    `);

    return NextResponse.json({ success: true, message });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send message" }, { status: 500 });
  }
}
