import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server-auth";
import { tathastuSyncService } from "@/lib/ai-mentor/integrations/ai-tathastu-sync-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/student/tathastu-sync
 * Trigger two-way intelligence synchronization between MentorMaze and AI Tathastu
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session || !session.id) {
      return NextResponse.json({ error: "401_UNAUTHORIZED: Authentication required to trigger synchronization." }, { status: 401 });
    }
    const studentUserId = session.id;

    const result = await tathastuSyncService.syncTwoWay(studentUserId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Tathastu sync error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync with AI Tathastu" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/student/tathastu-sync
 * Check connector status and readiness
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session || !session.id) {
      return NextResponse.json({ error: "401_UNAUTHORIZED: Authentication required." }, { status: 401 });
    }
    const studentUserId = session.id;

    const status = await tathastuSyncService.getStatus();
    return NextResponse.json({
      connected: status.isConfigured,
      status: status.status,
      description: status.description,
      studentUserId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get Tathastu sync status" },
      { status: 500 }
    );
  }
}
