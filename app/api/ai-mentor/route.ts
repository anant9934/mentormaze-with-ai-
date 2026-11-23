import { NextRequest, NextResponse } from "next/server";
import { AIMentorOrchestrator } from "@/lib/ai-mentor/orchestrator";
import { ModelProviderRouter } from "@/lib/ai-mentor/model-provider-router";
import { TeachingMode, LanguageCode } from "@/lib/ai-mentor/types";
import { getServerSession } from "@/lib/auth/server-auth";

export const dynamic = "force-dynamic";

/**
 * Resolves authenticated user identity from real server session or verified auth headers
 */
async function resolveAuthenticatedUser(req: NextRequest): Promise<{ id: string; role: string } | null> {
  const session = await getServerSession(req);
  if (session?.id) return { id: session.id, role: session.role || "student" };

  // For controlled test harnesses only when non-production and test header set
  if (process.env.NODE_ENV !== "production" && req.headers.get("x-mentormaze-test") === "true") {
    const testUser = req.headers.get("x-mentormaze-auth-user") || req.headers.get("x-user-id");
    if (testUser) {
      const role = testUser.startsWith("admin") ? "admin" : testUser.startsWith("mentor-") ? "mentor" : "student";
      return { id: testUser, role };
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await resolveAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "401_UNAUTHORIZED: Authentication required to interact with ASTRION." },
        { status: 401 }
      );
    }
    const studentUserId = authUser.id;

    const body = await req.json();

    const userMessage = String(body.userMessage || body.message || "");
    // Input validation: Enforce request size boundaries (DoS defense)
    if (userMessage.length > 8000) {
      return NextResponse.json(
        { success: false, error: "400_BAD_REQUEST: Message length exceeds 8,000 character maximum limit." },
        { status: 400 }
      );
    }

    const codeSnippet = body.codeSnippet ? String(body.codeSnippet) : undefined;
    if (codeSnippet && codeSnippet.length > 16000) {
      return NextResponse.json(
        { success: false, error: "400_BAD_REQUEST: Code snippet length exceeds 16,000 character maximum limit." },
        { status: 400 }
      );
    }

    const mode = (body.focusArea || body.mode || "learn") as TeachingMode;
    const focusArea = body.focusArea;
    const languagePreference = (body.languagePreference || "en") as LanguageCode;
    const hintLevel = body.hintLevel || 0;
    const activeTopic = body.activeTopic || body.topic;
    const conversationId = body.conversationId;
    const conversationHistory = body.conversationHistory;

    // Check if client requested streaming
    const isStream = req.headers.get("accept")?.includes("text/event-stream") || body.stream === true;

    const result = await AIMentorOrchestrator.processTurn({
      studentUserId,
      userMessage,
      mode,
      focusArea,
      codeSnippet,
      languagePreference,
      hintLevel,
      activeTopic,
      conversationId,
      conversationHistory,
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
                  requestId: result.requestId,
                  voiceText: result.voiceText,
                  teachingStrategy: result.teachingStrategy,
                  sources: result.sources,
                  recommendedActions: result.recommendedActions,
                  skillUpdates: result.skillUpdates,
                  escalationRecommendation: result.escalationRecommendation,
                  latencyMs: result.latencyMs,
                  modelProvider: result.modelProvider,
                  inferenceMode: result.inferenceMode,
                  specialistCapability: result.specialistCapability,
                  mentorIdentity: result.mentorIdentity,
                  tokenUsage: result.tokenUsage,
                  estimatedCostUsd: result.estimatedCostUsd,
                  fallbackReason: result.fallbackReason,
                  postInteractionCheck: result.postInteractionCheck,
                  studyPlan: result.studyPlan,
                  progressInsights: result.progressInsights,
                  resources: result.resources,
                  reminders: result.reminders,
                  mentorHandoff: result.mentorHandoff,
                  goalReference: result.goalReference,
                  assessment: result.assessment,
                  recommendedNextAction: result.recommendedNextAction,
                  roadmapUpdates: result.roadmapUpdates,
                  milestoneUpdates: result.milestoneUpdates,
                  followUpSuggestion: result.followUpSuggestion,
                  requiresStudentConfirmation: result.requiresStudentConfirmation,
                  confidence: result.confidence,
                  evidenceReferences: result.evidenceReferences,
                  adaptiveContext: result.adaptiveContext,
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
      requestId: result.requestId,
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
      inferenceMode: result.inferenceMode,
      specialistCapability: result.specialistCapability,
      mentorIdentity: result.mentorIdentity,
      tokenUsage: result.tokenUsage,
      estimatedCostUsd: result.estimatedCostUsd,
      fallbackReason: result.fallbackReason,
      postInteractionCheck: result.postInteractionCheck,
      studyPlan: result.studyPlan,
      progressInsights: result.progressInsights,
      resources: result.resources,
      reminders: result.reminders,
      mentorHandoff: result.mentorHandoff,
      goalReference: result.goalReference,
      assessment: result.assessment,
      recommendedNextAction: result.recommendedNextAction,
      roadmapUpdates: result.roadmapUpdates,
      milestoneUpdates: result.milestoneUpdates,
      followUpSuggestion: result.followUpSuggestion,
      requiresStudentConfirmation: result.requiresStudentConfirmation,
      confidence: result.confidence,
      evidenceReferences: result.evidenceReferences,
      adaptiveContext: result.adaptiveContext,
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

export async function GET(req: NextRequest) {
  try {
    const providers = ModelProviderRouter.getProviderStatus();
    const activeProvider = Object.keys(providers).find((k) => providers[k].isAvailable) || "gemini";
    return NextResponse.json({
      success: true,
      activeProvider,
      providers,
      hybridPolicy: {
        description: "Adaptive hybrid routing between local fine-tuned 2B model, Gemini 2.0 Flash, and deterministic pedagogical fallback.",
        local2BModel: "MentorMaze-2B (Qwen 3.5 2B base + SFT LoRA)",
        cloudModel: "Google Gemini 2.0 Flash",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
