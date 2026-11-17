import { NextRequest, NextResponse } from "next/server";
import { AIInterviewerService, AIInterviewerTurnRequest } from "@/lib/interview/ai-interviewer-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const t0 = performance.now();
  try {
    const body: AIInterviewerTurnRequest = await req.json();

    if (!body.sessionTrack) {
      body.sessionTrack = "sde_backend";
    }
    if (!body.targetRole) {
      body.targetRole = "Software Engineer (SDE-2)";
    }

    const turnResponse = await AIInterviewerService.processTurn(body);
    const latencyMs = Number((performance.now() - t0).toFixed(2));

    return NextResponse.json({
      success: true,
      latencyMs,
      ...turnResponse,
    });
  } catch (error: any) {
    console.error("[AI Interviewer API Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process AI interview turn",
      },
      { status: 500 }
    );
  }
}

