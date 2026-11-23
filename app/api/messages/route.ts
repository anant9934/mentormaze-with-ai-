import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server-auth";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { resolveMentorProfileId } from "@/lib/calendar/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    const mentorIdParam = searchParams.get("mentorId");

    const db = getDb();

    // CASE 1: Query messages for a specific conversation
    if (conversationId) {
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
        return NextResponse.json(
          { success: false, error: "Forbidden: Not a participant of this conversation" },
          { status: 403 }
        );
      }

      // Retrieve messages from PostgreSQL
      const messagesQuery: any = await db.execute(sql`
        SELECT 
          id, 
          conversation_id as "conversationId", 
          sender_user_id as "senderUserId", 
          content, 
          attachment_url as "attachmentUrl", 
          attachment_name as "attachmentName", 
          is_read as "isRead", 
          created_at as "createdAt"
        FROM messages
        WHERE conversation_id = ${conversationId}
        ORDER BY created_at ASC;
      `);

      const messages = messagesQuery.rows || messagesQuery || [];

      // Mark messages received by current user as read
      await db.execute(sql`
        UPDATE messages
        SET is_read = true
        WHERE conversation_id = ${conversationId}
          AND sender_user_id != ${session.id}
          AND is_read = false;
      `);

      return NextResponse.json({
        success: true,
        conversationId,
        messages,
      });
    }

    // CASE 2: Query or start conversation with a mentor by mentorId/slug
    if (mentorIdParam) {
      const resolvedProfileId = resolveMentorProfileId(mentorIdParam);

      // Find mentor's user_id, verification status, and account status
      const mentorUserResult: any = await db.execute(sql`
        SELECT mp.user_id, mp.verification_status, u.account_status
        FROM mentor_profiles mp
        JOIN users u ON u.id = mp.user_id
        WHERE mp.id = ${resolvedProfileId} OR mp.user_id = ${mentorIdParam}
        LIMIT 1;
      `);
      const mentorUser = mentorUserResult.rows?.[0] || mentorUserResult?.[0];

      if (!mentorUser) {
        return NextResponse.json({ success: false, error: "Mentor not found" }, { status: 404 });
      }

      const mentorUserId = mentorUser.user_id;

      // Disallow self-messaging
      if (mentorUserId === session.id) {
        return NextResponse.json(
          { success: false, error: "Cannot start a conversation with yourself." },
          { status: 400 }
        );
      }

      // Disallow messaging unapproved or suspended mentors
      if (mentorUser.verification_status !== "approved") {
        return NextResponse.json(
          { success: false, error: "Mentor is not approved or available for direct messaging." },
          { status: 400 }
        );
      }

      if (mentorUser.account_status === "suspended") {
        return NextResponse.json(
          { success: false, error: "Mentor account is currently suspended." },
          { status: 403 }
        );
      }

      // Disallow peer mentor messaging (mentor targeting another mentor)
      if (session.role === "mentor") {
        return NextResponse.json(
          { success: false, error: "Peer mentor messaging is not permitted under current platform policy." },
          { status: 403 }
        );
      }

      // Check if conversation already exists between this student and mentor
      let convResult: any = await db.execute(sql`
        SELECT id FROM conversations
        WHERE (student_user_id = ${session.id} AND mentor_user_id = ${mentorUserId})
           OR (student_user_id = ${mentorUserId} AND mentor_user_id = ${session.id})
        LIMIT 1;
      `);
      let conv = convResult.rows?.[0] || convResult?.[0];

      // If not, create new conversation
      if (!conv) {
        const createConvResult: any = await db.execute(sql`
          INSERT INTO conversations (student_user_id, mentor_user_id, last_message_text, last_message_at)
          VALUES (${session.id}, ${mentorUserId}, 'Conversation initiated', now())
          RETURNING id;
        `);
        conv = createConvResult.rows?.[0] || createConvResult?.[0];
      }

      // Fetch messages for this conversation
      const messagesResult: any = await db.execute(sql`
        SELECT 
          id, 
          conversation_id as "conversationId", 
          sender_user_id as "senderUserId", 
          content, 
          attachment_url as "attachmentUrl", 
          attachment_name as "attachmentName", 
          is_read as "isRead", 
          created_at as "createdAt"
        FROM messages
        WHERE conversation_id = ${conv.id}
        ORDER BY created_at ASC;
      `);

      return NextResponse.json({
        success: true,
        conversationId: conv.id,
        messages: messagesResult.rows || messagesResult || [],
      });
    }

    // CASE 3: List all conversations for the authenticated user
    const conversationsResult: any = await db.execute(sql`
      SELECT 
        c.id,
        c.student_user_id as "studentUserId",
        c.mentor_user_id as "mentorUserId",
        c.last_message_text as "lastMessageText",
        c.last_message_at as "lastMessageAt",
        c.created_at as "createdAt",
        other.id as "participantId",
        other.display_name as "participantName",
        other.avatar_url as "participantAvatarUrl",
        other.role as "participantRole",
        mp.headline as "participantHeadline",
        COALESCE(
          (SELECT count(*)::int FROM messages m WHERE m.conversation_id = c.id AND m.sender_user_id != ${session.id} AND m.is_read = false),
          0
        ) as "unreadCount"
      FROM conversations c
      JOIN users other ON (other.id = CASE WHEN c.student_user_id = ${session.id} THEN c.mentor_user_id ELSE c.student_user_id END)
      LEFT JOIN mentor_profiles mp ON mp.user_id = other.id
      WHERE c.student_user_id = ${session.id} OR c.mentor_user_id = ${session.id}
      ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC;
    `);

    const rawConvs = conversationsResult.rows || conversationsResult || [];

    const conversations = rawConvs.map((c: any) => ({
      id: c.id,
      participantId: c.participantId,
      mentorName: c.participantName,
      mentorRole: c.participantHeadline || (c.participantRole === "mentor" ? "Industry Mentor" : "Student"),
      avatar: c.participantAvatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      unreadCount: Number(c.unreadCount) || 0,
      lastMessage: c.lastMessageText || "No messages yet",
      time: c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "New",
      online: true,
    }));

    return NextResponse.json({
      success: true,
      conversations,
    });
  } catch (err: any) {
    console.error("[API /api/messages GET] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load messages" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    let { conversationId, content, attachmentUrl, attachmentName, mentorId, recipientUserId } = body;

    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: "Message content cannot be empty." }, { status: 400 });
    }

    const db = getDb();

    // If conversationId not provided, but mentorId or recipientUserId is, resolve conversation
    if (!conversationId) {
      let targetUserId = recipientUserId;
      if (!targetUserId && mentorId) {
        const resolvedProfileId = resolveMentorProfileId(mentorId);
        const mentorUserResult: any = await db.execute(sql`
          SELECT mp.user_id, mp.verification_status, u.account_status
          FROM mentor_profiles mp
          JOIN users u ON u.id = mp.user_id
          WHERE mp.id = ${resolvedProfileId} OR mp.user_id = ${mentorId}
          LIMIT 1;
        `);
        const mentorUser = mentorUserResult.rows?.[0] || mentorUserResult?.[0];
        if (!mentorUser) {
          return NextResponse.json({ success: false, error: "Mentor not found" }, { status: 404 });
        }
        if (mentorUser.verification_status !== "approved") {
          return NextResponse.json(
            { success: false, error: "Mentor is not approved or available for messaging." },
            { status: 400 }
          );
        }
        if (mentorUser.account_status === "suspended") {
          return NextResponse.json(
            { success: false, error: "Mentor account is suspended." },
            { status: 403 }
          );
        }
        if (session.role === "mentor") {
          return NextResponse.json(
            { success: false, error: "Peer mentor messaging is not permitted under current platform policy." },
            { status: 403 }
          );
        }
        targetUserId = mentorUser.user_id;
      }

      if (!targetUserId) {
        return NextResponse.json(
          { success: false, error: "conversationId or valid recipient required." },
          { status: 400 }
        );
      }

      if (targetUserId === session.id) {
        return NextResponse.json(
          { success: false, error: "Cannot send messages to yourself." },
          { status: 400 }
        );
      }

      // Check if conversation exists
      let convResult: any = await db.execute(sql`
        SELECT id FROM conversations
        WHERE (student_user_id = ${session.id} AND mentor_user_id = ${targetUserId})
           OR (student_user_id = ${targetUserId} AND mentor_user_id = ${session.id})
        LIMIT 1;
      `);
      let conv = convResult.rows?.[0] || convResult?.[0];

      if (!conv) {
        const createConvResult: any = await db.execute(sql`
          INSERT INTO conversations (student_user_id, mentor_user_id, last_message_text, last_message_at)
          VALUES (${session.id}, ${targetUserId}, ${content.trim()}, now())
          RETURNING id;
        `);
        conv = createConvResult.rows?.[0] || createConvResult?.[0];
      }
      conversationId = conv.id;
    }

    // Atomic transaction for membership check, message insert, conversation update, and outbox event
    const message = await db.transaction(async (tx: any) => {
      // Enforce conversation membership
      const convCheck: any = await tx.execute(sql`
        SELECT id, student_user_id, mentor_user_id
        FROM conversations
        WHERE id = ${conversationId}
          AND (student_user_id = ${session.id} OR mentor_user_id = ${session.id})
        LIMIT 1;
      `);

      const conv = convCheck.rows?.[0] || convCheck?.[0];
      if (!conv) {
        const err: any = new Error("Forbidden: Not authorized to send messages to this conversation");
        err.statusCode = 403;
        throw err;
      }

      // Insert message into PostgreSQL
      const insertResult: any = await tx.execute(sql`
        INSERT INTO messages (conversation_id, sender_user_id, content, attachment_url, attachment_name, is_read)
        VALUES (${conversationId}, ${session.id}, ${content.trim()}, ${attachmentUrl || null}, ${attachmentName || null}, false)
        RETURNING id, conversation_id as "conversationId", sender_user_id as "senderUserId", content, attachment_url as "attachmentUrl", attachment_name as "attachmentName", created_at as "createdAt";
      `);

      const msg = insertResult.rows?.[0] || insertResult?.[0];

      // Update conversation last_message
      await tx.execute(sql`
        UPDATE conversations
        SET last_message_text = ${content.trim()}, last_message_at = now()
        WHERE id = ${conversationId};
      `);

      // Audit outbox event for real-time notification
      await tx.execute(sql`
        INSERT INTO outbox_events (event_type, payload, status)
        VALUES ('chat.message_sent', ${JSON.stringify({ messageId: msg.id, conversationId, senderId: session.id })}, 'pending');
      `);

      return msg;
    });

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (err: any) {
    console.error("[API /api/messages POST] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to send message" },
      { status: err.statusCode || 500 }
    );
  }
}
