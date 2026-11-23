import { NextRequest, NextResponse } from "next/server";
import { StudentGoalService } from "@/lib/ai-mentor/goals/student-goal-service";
import { GoalStatus, GoalCategory, GoalImportance } from "@/lib/ai-mentor/goals/student-goal-service";
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
        { success: false, error: "401_UNAUTHORIZED: Authentication required to view goals." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId") || authUser.id;

    if (targetUserId !== authUser.id && authUser.role !== "admin" && authUser.role !== "mentor") {
      return NextResponse.json(
        { success: false, error: "403_FORBIDDEN: You do not have permission to access another student's goals." },
        { status: 403 }
      );
    }

    // Check if requesting single goal
    const goalId = searchParams.get("goalId") || searchParams.get("id");
    if (goalId) {
      const goal = await StudentGoalService.getGoalById(targetUserId, goalId, authUser.id);
      if (!goal) {
        return NextResponse.json({ success: false, error: "404_NOT_FOUND: Goal not found." }, { status: 404 });
      }
      return NextResponse.json({ success: true, goal });
    }

    // Check if requesting conflict report
    if (searchParams.get("conflicts") === "true") {
      const availableHours = searchParams.get("availableHours") ? Number(searchParams.get("availableHours")) : undefined;
      const conflictReport = await StudentGoalService.detectGoalConflicts(targetUserId, authUser.id, { availableHoursPerWeek: availableHours });
      return NextResponse.json({ success: true, conflictReport });
    }

    // List goals with filters
    const status = searchParams.get("status") as GoalStatus | undefined;
    const category = searchParams.get("category") as GoalCategory | undefined;

    const goals = await StudentGoalService.getGoals(
      targetUserId,
      { status, category },
      authUser.id
    );

    return NextResponse.json({ success: true, goals });
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
        { success: false, error: "401_UNAUTHORIZED: Authentication required to manage goals." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const studentUserId = authUser.id; // Enforce: student identity comes from authenticated server session!
    if (body.studentUserId && body.studentUserId !== authUser.id && authUser.role !== "admin" && authUser.role !== "mentor") {
      return NextResponse.json(
        { success: false, error: "403_FORBIDDEN: You do not have permission to modify another student's goals." },
        { status: 403 }
      );
    }
    const action = body.action || "create";

    // 1. Create Goal
    if (action === "create") {
      if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
        return NextResponse.json(
          { success: false, error: "400_BAD_REQUEST: Goal title is required." },
          { status: 400 }
        );
      }

      const goal = await StudentGoalService.createGoal(
        studentUserId,
        {
          title: body.title,
          description: body.description,
          category: body.category as GoalCategory,
          importance: body.importance as GoalImportance,
          targetOutcome: body.targetOutcome,
          targetDate: body.targetDate,
          currentState: body.currentState,
          successCriteria: body.successCriteria,
          associatedSkills: body.associatedSkills,
          associatedProjects: body.associatedProjects,
          roadmapId: body.roadmapId,
        },
        authUser.id
      );

      return NextResponse.json({ success: true, goal }, { status: 201 });
    }

    // 2. Set Priority
    if (action === "set_priority") {
      if (!body.goalId || !body.importance) {
        return NextResponse.json(
          { success: false, error: "400_BAD_REQUEST: goalId and importance ('primary' | 'secondary' | 'exploratory') are required." },
          { status: 400 }
        );
      }

      const updated = await StudentGoalService.setGoalPriority(
        studentUserId,
        body.goalId,
        body.importance as GoalImportance,
        authUser.id
      );

      return NextResponse.json({ success: true, goal: updated });
    }

    // 3. Update Status (pause, resume, complete, abandon)
    if (action === "update_status") {
      if (!body.goalId || !body.status) {
        return NextResponse.json(
          { success: false, error: "400_BAD_REQUEST: goalId and status ('active' | 'paused' | 'completed' | 'abandoned') are required." },
          { status: 400 }
        );
      }

      const updated = await StudentGoalService.updateGoalStatus(
        studentUserId,
        body.goalId,
        body.status as GoalStatus,
        body.reason,
        authUser.id
      );

      return NextResponse.json({ success: true, goal: updated });
    }

    // 4. Update Goal Details
    if (action === "update") {
      if (!body.goalId) {
        return NextResponse.json(
          { success: false, error: "400_BAD_REQUEST: goalId is required." },
          { status: 400 }
        );
      }

      const updated = await StudentGoalService.updateGoal(
        studentUserId,
        body.goalId,
        body.updates || body,
        authUser.id
      );

      return NextResponse.json({ success: true, goal: updated });
    }

    return NextResponse.json(
      { success: false, error: `400_BAD_REQUEST: Unknown action '${action}'.` },
      { status: 400 }
    );
  } catch (err: any) {
    const status = err.message?.includes("403_FORBIDDEN")
      ? 403
      : err.message?.includes("400_BAD_REQUEST")
      ? 400
      : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
