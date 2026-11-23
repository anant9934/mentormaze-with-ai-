import { NextRequest, NextResponse } from "next/server";
import { SocialCommunicationCoachService } from "@/lib/ai-mentor/communication/social-coach-service";
import { CommunicationScenarioType } from "@/lib/ai-mentor/types";
import { getServerSession } from "@/lib/auth/server-auth";

export const dynamic = "force-dynamic";

async function resolveAuthenticatedUser(req: NextRequest): Promise<{ id: string; role: string } | null> {
  const session = await getServerSession(req);
  if (session?.id) return { id: session.id, role: session.role || "student" };

  if (process.env.NODE_ENV !== "production" && req.headers.get("x-mentormaze-test") === "true") {
    const testUser = req.headers.get("x-mentormaze-auth-user") || req.headers.get("x-user-id");
    if (testUser) {
      const role = testUser.startsWith("admin") ? "admin" : testUser.startsWith("mentor-") ? "mentor" : "student";
      return { id: testUser, role };
    }
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await resolveAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "401_UNAUTHORIZED: Authentication required to access communication simulations." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const targetUserId = searchParams.get("userId") || authUser.id;

    if (targetUserId !== authUser.id && authUser.role !== "admin" && !authUser.role.startsWith("mentor")) {
      return NextResponse.json(
        { success: false, error: "403_FORBIDDEN: You do not have permission to access another student's communication simulation." },
        { status: 403 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "400_BAD_REQUEST: sessionId is required." },
        { status: 400 }
      );
    }

    const session = SocialCommunicationCoachService.getSession(targetUserId, sessionId, authUser.id);
    return NextResponse.json({ success: true, session });
  } catch (err: any) {
    const status = err.message?.includes("403_FORBIDDEN")
      ? 403
      : err.message?.includes("400_BAD_REQUEST")
      ? 400
      : err.message?.includes("not found")
      ? 404
      : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await resolveAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "401_UNAUTHORIZED: Authentication required to manage communication simulations." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const action = String(body.action || "start");
    const targetUserId = body.studentUserId || authUser.id;

    if (targetUserId !== authUser.id && authUser.role !== "admin" && !authUser.role.startsWith("mentor")) {
      return NextResponse.json(
        { success: false, error: "403_FORBIDDEN: You do not have permission to manage another student's communication simulation." },
        { status: 403 }
      );
    }

    switch (action) {
      case "start": {
        const scenarioType = (body.scenarioType || "salary_negotiation") as CommunicationScenarioType;
        const customCounterpart = body.customCounterpart;

        const session = SocialCommunicationCoachService.startSession({
          studentUserId: targetUserId,
          scenarioType,
          customCounterpart,
          requestingUserId: authUser.id,
        });
        return NextResponse.json({ success: true, session });
      }

      case "turn": {
        const { sessionId, studentMessage } = body;
        if (!sessionId || !studentMessage) {
          return NextResponse.json(
            { success: false, error: "400_BAD_REQUEST: sessionId and studentMessage are required." },
            { status: 400 }
          );
        }

        const turnResult = SocialCommunicationCoachService.processTurn({
          studentUserId: targetUserId,
          sessionId,
          studentMessage,
          requestingUserId: authUser.id,
        });
        return NextResponse.json({ success: true, ...turnResult });
      }

      case "evaluate": {
        const { sessionId } = body;
        if (!sessionId) {
          return NextResponse.json(
            { success: false, error: "400_BAD_REQUEST: sessionId is required." },
            { status: 400 }
          );
        }

        const evaluation = SocialCommunicationCoachService.completeAndEvaluate({
          studentUserId: targetUserId,
          sessionId,
          requestingUserId: authUser.id,
        });
        return NextResponse.json({ success: true, evaluation });
      }

      case "retry": {
        const { sessionId, adjustedAttitude } = body;
        if (!sessionId) {
          return NextResponse.json(
            { success: false, error: "400_BAD_REQUEST: sessionId is required." },
            { status: 400 }
          );
        }

        const newSession = SocialCommunicationCoachService.retrySession({
          studentUserId: targetUserId,
          sessionId,
          adjustedAttitude,
          requestingUserId: authUser.id,
        });
        return NextResponse.json({ success: true, session: newSession });
      }

      default:
        return NextResponse.json(
          { success: false, error: `400_BAD_REQUEST: Unknown action '${action}'.` },
          { status: 400 }
        );
    }
  } catch (err: any) {
    const status = err.message?.includes("403_FORBIDDEN")
      ? 403
      : err.message?.includes("400_BAD_REQUEST")
      ? 400
      : err.message?.includes("not found")
      ? 404
      : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
