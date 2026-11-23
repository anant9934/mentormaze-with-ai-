import { NextRequest, NextResponse } from "next/server";
import { BloomLearningJourneyService } from "@/lib/ai-mentor/learning-journey/bloom-journey-service";
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
        { success: false, error: "401_UNAUTHORIZED: Authentication required to access learning programmes." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const programmeId = searchParams.get("programmeId");
    const targetUserId = searchParams.get("userId") || authUser.id;
    const shouldExport = searchParams.get("export") === "true";

    if (targetUserId !== authUser.id && authUser.role !== "admin" && !authUser.role.startsWith("mentor")) {
      return NextResponse.json(
        { success: false, error: "403_FORBIDDEN: You do not have permission to access another student's learning programme." },
        { status: 403 }
      );
    }

    if (!programmeId) {
      return NextResponse.json(
        { success: false, error: "400_BAD_REQUEST: programmeId is required." },
        { status: 400 }
      );
    }

    if (shouldExport) {
      const markdown = BloomLearningJourneyService.exportLearningSummary(targetUserId, programmeId, authUser.id);
      return NextResponse.json({ success: true, markdown });
    }

    const programme = BloomLearningJourneyService.getProgramme(targetUserId, programmeId, authUser.id);
    return NextResponse.json({ success: true, programme });
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
        { success: false, error: "401_UNAUTHORIZED: Authentication required to manage learning programmes." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const action = String(body.action || "create");
    const targetUserId = body.studentUserId || authUser.id;

    if (targetUserId !== authUser.id && authUser.role !== "admin" && !authUser.role.startsWith("mentor")) {
      return NextResponse.json(
        { success: false, error: "403_FORBIDDEN: You do not have permission to manage another student's learning programme." },
        { status: 403 }
      );
    }

    switch (action) {
      case "create": {
        const { goalId, topicName, roadmapId } = body;
        if (!goalId || !topicName) {
          return NextResponse.json(
            { success: false, error: "400_BAD_REQUEST: goalId and topicName are required." },
            { status: 400 }
          );
        }
        const programme = BloomLearningJourneyService.createProgramme({
          studentUserId: targetUserId,
          goalId,
          topicName,
          roadmapId,
          requestingUserId: authUser.id,
        });
        return NextResponse.json({ success: true, programme });
      }

      case "feedback": {
        const { programmeId, lessonId, feedback } = body;
        if (!programmeId || !lessonId || !feedback) {
          return NextResponse.json(
            { success: false, error: "400_BAD_REQUEST: programmeId, lessonId, and feedback are required." },
            { status: 400 }
          );
        }
        const updated = BloomLearningJourneyService.submitLessonFeedback({
          studentUserId: targetUserId,
          programmeId,
          lessonId,
          feedback,
          requestingUserId: authUser.id,
        });
        return NextResponse.json({ success: true, programme: updated });
      }

      case "evaluate": {
        const { programmeId, lessonId, score, feedback } = body;
        if (!programmeId || !lessonId || score === undefined) {
          return NextResponse.json(
            { success: false, error: "400_BAD_REQUEST: programmeId, lessonId, and score are required." },
            { status: 400 }
          );
        }
        const result = BloomLearningJourneyService.evaluateLessonExercise({
          studentUserId: targetUserId,
          programmeId,
          lessonId,
          score: Number(score),
          feedback: feedback || "Completed exercise.",
          requestingUserId: authUser.id,
        });
        return NextResponse.json({ success: true, ...result });
      }

      case "add_note": {
        const { programmeId, lessonId, content } = body;
        if (!programmeId || !lessonId || !content) {
          return NextResponse.json(
            { success: false, error: "400_BAD_REQUEST: programmeId, lessonId, and content are required." },
            { status: 400 }
          );
        }
        const note = BloomLearningJourneyService.addNote({
          studentUserId: targetUserId,
          programmeId,
          lessonId,
          content,
          requestingUserId: authUser.id,
        });
        return NextResponse.json({ success: true, note });
      }

      case "add_annotation": {
        const { programmeId, lessonId, highlightedText, note } = body;
        if (!programmeId || !lessonId || !highlightedText || !note) {
          return NextResponse.json(
            { success: false, error: "400_BAD_REQUEST: programmeId, lessonId, highlightedText, and note are required." },
            { status: 400 }
          );
        }
        const annotation = BloomLearningJourneyService.addAnnotation({
          studentUserId: targetUserId,
          programmeId,
          lessonId,
          highlightedText,
          note,
          requestingUserId: authUser.id,
        });
        return NextResponse.json({ success: true, annotation });
      }

      case "complete_assessment": {
        const { programmeId, score, summary } = body;
        if (!programmeId || score === undefined) {
          return NextResponse.json(
            { success: false, error: "400_BAD_REQUEST: programmeId and score are required." },
            { status: 400 }
          );
        }
        const finalAssessment = BloomLearningJourneyService.completeFinalAssessment({
          studentUserId: targetUserId,
          programmeId,
          score: Number(score),
          summary: summary || "Final programme assessment evaluated.",
          requestingUserId: authUser.id,
        });
        return NextResponse.json({ success: true, finalAssessment });
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
