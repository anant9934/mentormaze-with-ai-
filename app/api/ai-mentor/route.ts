import { NextRequest, NextResponse } from "next/server";
import { AIMentorOrchestrator } from "@/lib/ai-mentor/orchestrator";
import { TeachingMode, LanguageCode } from "@/lib/ai-mentor/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const studentUserId = body.studentUserId || "usr-student-1";
    const userMessage = body.userMessage || body.message || "";
    const mode = (body.mode || "learn") as TeachingMode;
    const languagePreference = (body.languagePreference || "en") as LanguageCode;
    const codeSnippet = body.codeSnippet;
    const hintLevel = body.hintLevel || 0;
    const activeTopic = body.activeTopic || body.topic;

    // Check if client requested streaming
    const isStream = req.headers.get("accept")?.includes("text/event-stream") || body.stream === true;

    const result = await AIMentorOrchestrator.processTurn({
      studentUserId,
      userMessage,
      mode,
      codeSnippet,
      languagePreference,
      hintLevel,
      activeTopic,
    });

    if (isStream) {
      // Return server-sent events stream
      const encoder = new TextEncoder();
      const chunks = result.message.split(/(?<=\n)/);

      const stream = new ReadableStream({
        async start(controller) {
          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk, done: false })}\n\n`));
            await new Promise((r) => setTimeout(r, 15)); // Natural streaming delay
          }
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                metadata: {
                  voiceText: result.voiceText,
                  teachingStrategy: result.teachingStrategy,
                  sources: result.sources,
                  recommendedActions: result.recommendedActions,
                  skillUpdates: result.skillUpdates,
                  escalationRecommendation: result.escalationRecommendation,
                  latencyMs: result.latencyMs,
                },
              })}\n\n`
            )
          );
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    return NextResponse.json({
      success: true,
      aiResponse: result.message,
      voiceText: result.voiceText,
      teachingStrategy: result.teachingStrategy,
      topic: result.topic,
      difficulty: result.difficulty,
      hintLevel: result.hintLevel,
      studentUnderstandingSignal: result.studentUnderstandingSignal,
      sources: result.sources,
      recommendedActions: result.recommendedActions,
      skillUpdates: result.skillUpdates,
      escalationRecommendation: result.escalationRecommendation,
      latencyMs: result.latencyMs,
      modelProvider: result.modelProvider,
    });
  } catch (error: any) {
    console.error("[API AI Mentor Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process turn with AI Mentor.",
      },
      { status: 500 }
    );
  }
}
