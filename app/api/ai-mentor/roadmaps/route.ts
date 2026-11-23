import { NextRequest, NextResponse } from "next/server";
import { PersonalizedRoadmapService } from "@/lib/ai-mentor/roadmap/personalized-roadmap-service";
import { StudentGoalService } from "@/lib/ai-mentor/goals/student-goal-service";
import { PersonalizedAssessmentService } from "@/lib/ai-mentor/assessment/personalized-assessment-service";
import { PermissionAwareContextBuilder } from "@/lib/ai-mentor/permission-aware-context-builder";
import { getServerSession } from "@/lib/auth/server-auth";

export const dynamic = "force-dynamic";

/**
 * Resolves authenticated user identity strictly from real server session or verified auth headers
 */
async function resolveAuthenticatedUser(req: NextRequest): Promise<{ id: string; role: string } | null> {
  const session = await getServerSession(req);
  if (session?.id) return { id: session.id, role: session.role };

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

export async function GET(req: NextRequest) {
  try {
    const authUser = await resolveAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "401_UNAUTHORIZED: Authentication required to view roadmaps." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId") || authUser.id;
    const goalId = searchParams.get("goalId");

    if (targetUserId !== authUser.id && authUser.role !== "admin" && authUser.role !== "mentor") {
      return NextResponse.json(
        { success: false, error: "403_FORBIDDEN: You do not have permission to access another student's roadmaps." },
        { status: 403 }
      );
    }

    if (!goalId) {
      return NextResponse.json(
        { success: false, error: "400_BAD_REQUEST: goalId parameter is required." },
        { status: 400 }
      );
    }

    const roadmap = await PersonalizedRoadmapService.getRoadmapByGoalId(targetUserId, goalId);
    if (!roadmap) {
      return NextResponse.json(
        { success: false, error: "404_NOT_FOUND: No active roadmap found for specified goal." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, roadmap });
  } catch (err: any) {
    const status = err.message?.includes("403_FORBIDDEN") ? 403 : err.message?.includes("401_UNAUTHORIZED") ? 401 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await resolveAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "401_UNAUTHORIZED: Authentication required to manage roadmaps." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const studentUserId = authUser.id; // Enforce: student identity comes from authenticated server session!
    if (body.studentUserId && body.studentUserId !== authUser.id && authUser.role !== "admin" && authUser.role !== "mentor") {
      return NextResponse.json(
        { success: false, error: "403_FORBIDDEN: You do not have permission to modify another student's roadmaps." },
        { status: 403 }
      );
    }

    const action = body.action || "generate";

    // 1. Generate Roadmap
    if (action === "generate") {
      const goalId = body.goalId;
      if (!goalId) {
        return NextResponse.json(
          { success: false, error: "400_BAD_REQUEST: goalId is required to generate a roadmap." },
          { status: 400 }
        );
      }

      const goal = await StudentGoalService.getGoalById(studentUserId, goalId, authUser.id);
      if (!goal) {
        return NextResponse.json(
          { success: false, error: `404_NOT_FOUND: Goal ${goalId} not found.` },
          { status: 404 }
        );
      }

      const context = await PermissionAwareContextBuilder.buildContext(studentUserId, {
        requestingUserId: authUser.id,
        purpose: "service_personalization",
        includeGoalTracking: true,
      });

      const assessment = PersonalizedAssessmentService.assessCurrentState(context, goal);

      const roadmap = await PersonalizedRoadmapService.generatePersonalizedRoadmap(
        studentUserId,
        goal,
        assessment
      );

      return NextResponse.json({ success: true, roadmap }, { status: 201 });
    }

    // 2. Mark Milestone Progress
    if (action === "mark_progress") {
      const { roadmapId, weekNumber, status, studentConfirmation, evidenceRef, deliverableUrl, assessmentNotes, provenance, completionNotes } = body;
      if (!roadmapId || !weekNumber || !status) {
        return NextResponse.json(
          { success: false, error: "400_BAD_REQUEST: roadmapId, weekNumber, and status ('pending'|'in_progress'|'completed') are required." },
          { status: 400 }
        );
      }

      const updated = await PersonalizedRoadmapService.markMilestoneProgress(
        studentUserId,
        roadmapId,
        Number(weekNumber),
        status,
        {
          studentConfirmation: studentConfirmation ?? true,
          evidenceRef,
          deliverableUrl,
          assessmentNotes,
          provenance,
          completionNotes,
        }
      );

      return NextResponse.json({ success: true, roadmap: updated });
    }

    // 3. Adapt Roadmap
    if (action === "adapt") {
      const { roadmapId, reason, availableHoursPerWeek, targetEndDate, milestoneOverrides } = body;
      if (!roadmapId || !reason) {
        return NextResponse.json(
          { success: false, error: "400_BAD_REQUEST: roadmapId and reason are required to adapt roadmap." },
          { status: 400 }
        );
      }

      const adapted = await PersonalizedRoadmapService.adaptRoadmap(
        studentUserId,
        roadmapId,
        {
          reason,
          availableHoursPerWeek,
          targetEndDate,
          milestoneOverrides,
        },
        milestoneOverrides
      );

      return NextResponse.json({ success: true, roadmap: adapted });
    }

    return NextResponse.json(
      { success: false, error: `400_BAD_REQUEST: Unknown action '${action}'.` },
      { status: 400 }
    );
  } catch (err: any) {
    const status = err.message?.includes("403_FORBIDDEN")
      ? 403
      : err.message?.includes("401_UNAUTHORIZED")
      ? 401
      : err.message?.includes("not found")
      ? 404
      : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
