import { NextRequest, NextResponse } from "next/server";
import { ConversationStore } from "@/lib/ai-mentor/conversation-store";
import { TeachingMode, LanguageCode } from "@/lib/ai-mentor/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const studentUserId = req.nextUrl.searchParams.get("userId") || "usr-student-1";
    const requestingUserId = req.headers.get("x-user-id") || studentUserId;

    // Authorization check
    if (requestingUserId !== studentUserId) {
      return NextResponse.json(
        { success: false, error: "403_FORBIDDEN: You do not have permission to access another student's conversations." },
        { status: 403 }
      );
    }

    const conversations = ConversationStore.listConversations(studentUserId);
    return NextResponse.json({ success: true, conversations });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const studentUserId = body.studentUserId || "usr-student-1";
    const requestingUserId = req.headers.get("x-user-id") || studentUserId;

    if (requestingUserId !== studentUserId) {
      return NextResponse.json(
        { success: false, error: "403_FORBIDDEN: Unauthorized conversation creation." },
        { status: 403 }
      );
    }

    const title = body.title || "New Mentorship Session";
    const mode = (body.mode || "learn") as TeachingMode;
    const activeTopic = body.activeTopic || "general";
    const languagePreference = (body.languagePreference || "en") as LanguageCode;

    const conversation = ConversationStore.createConversation(
      studentUserId,
      title,
      mode,
      activeTopic,
      languagePreference
    );

    return NextResponse.json({ success: true, conversation });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
