import { NextRequest, NextResponse } from "next/server";
import { AIMentorService, AIMentorTurnRequest } from "@/lib/mentor/ai-mentor-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body: AIMentorTurnRequest = await req.json();

    // Fast deterministic pipeline with optional GEMINI_API_KEY support
    const turnResponse = await AIMentorService.processTurn(body);

    return NextResponse.json(turnResponse);
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

