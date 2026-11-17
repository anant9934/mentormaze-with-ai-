import { NextRequest, NextResponse } from "next/server";
import { ConversationStore } from "@/lib/ai-mentor/conversation-store";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentUserId = req.nextUrl.searchParams.get("userId") || "usr-student-1";
    const requestingUserId = req.headers.get("x-user-id") || studentUserId;

    const conversation = ConversationStore.getConversation(studentUserId, params.id);
    if (!conversation) {
      return NextResponse.json({ success: false, error: "404_NOT_FOUND: Conversation not found." }, { status: 404 });
    }

    if (requestingUserId !== conversation.studentUserId) {
      return NextResponse.json(
        { success: false, error: "403_FORBIDDEN: You do not have permission to view this conversation." },
        { status: 403 }
      );
    }

    const messages = ConversationStore.getMessages(studentUserId, params.id);

    return NextResponse.json({
      success: true,
      conversation,
      messages,
    });
  } catch (err: any) {
    const status = err.message.includes("403_FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const studentUserId = body.studentUserId || "usr-student-1";
    const requestingUserId = req.headers.get("x-user-id") || studentUserId;

    if (requestingUserId !== studentUserId) {
      return NextResponse.json({ success: false, error: "403_FORBIDDEN" }, { status: 403 });
    }

    const updated = ConversationStore.renameConversation(studentUserId, params.id, body.title);
    return NextResponse.json({ success: true, conversation: updated });
  } catch (err: any) {
    const status = err.message.includes("403_FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentUserId = req.nextUrl.searchParams.get("userId") || "usr-student-1";
    const requestingUserId = req.headers.get("x-user-id") || studentUserId;

    if (requestingUserId !== studentUserId) {
      return NextResponse.json({ success: false, error: "403_FORBIDDEN" }, { status: 403 });
    }

    const deleted = ConversationStore.deleteConversation(studentUserId, params.id);
    return NextResponse.json({ success: true, deleted });
  } catch (err: any) {
    const status = err.message.includes("403_FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
