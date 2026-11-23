import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server-auth";
import { notificationService } from "@/lib/notifications/service";
import { StudentCheckinService } from "@/lib/ai-mentor/checkins/student-checkin-service";

export const dynamic = "force-dynamic";

async function resolveAuthenticatedUser(
  req: NextRequest
): Promise<{ id: string; role: string } | null> {
  const session = await getServerSession(req);
  if (session?.id) return { id: session.id, role: session.role };

  if (
    process.env.NODE_ENV !== "production" &&
    req.headers.get("x-mentormaze-test") === "true"
  ) {
    const testUser =
      req.headers.get("x-mentormaze-auth-user") || req.headers.get("x-user-id");
    if (testUser) {
      const role = testUser.startsWith("admin")
        ? "admin"
        : testUser.startsWith("mentor-")
        ? "mentor"
        : "student";
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
        {
          success: false,
          error: "401_UNAUTHORIZED: Authentication required to view check-in preferences.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || authUser.id;

    if (studentId !== authUser.id && authUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "403_FORBIDDEN: You cannot view another student's check-in settings.",
        },
        { status: 403 }
      );
    }

    const prefs = await StudentCheckinService.getPreferences(studentId, authUser.id);
    const history = await StudentCheckinService.getCheckinHistory(studentId, authUser.id);

    return NextResponse.json({
      success: true,
      preferences: {
        frequency: prefs.cadence,
        preferredHour: prefs.preferredHour,
        timezone: prefs.timezone,
        quietHoursEnabled: prefs.quietHoursEnabled,
        scheduledDeliveryStatus: "in_session_active",
        backgroundRemindersEnabled: false,
        deliveryNotice:
          "Check-ins are available during your mentorship sessions. Automatic scheduled reminders are not currently enabled.",
        lastDeliveredAt: prefs.updatedAt,
      },
      recentCheckins: history.slice(0, 5),
    });
  } catch (err: any) {
    const status = err.message?.includes("403_FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await resolveAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          error: "401_UNAUTHORIZED: Authentication required to submit check-in.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      studentId: reqStudentId,
      frequency,
      cadence,
      preferredHour,
      timezone,
      quietHoursEnabled,
      progressSummary,
      blockers,
      notes,
      studentResponse,
      goalId,
      roadmapId,
      milestoneId,
      checkinType,
    } = body;

    const studentId = reqStudentId || authUser.id;
    if (studentId !== authUser.id && authUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "403_FORBIDDEN: You cannot submit check-ins for another student.",
        },
        { status: 403 }
      );
    }

    const cadenceToUse = (frequency || cadence) as "daily" | "weekly" | "paused" | undefined;

    // Record dedicated checkin via StudentCheckinService (structured, dedicated table)
    const checkinRecord = await StudentCheckinService.recordCheckin(
      {
        studentUserId: studentId,
        checkinType: checkinType || "session_checkin",
        goalId,
        roadmapId,
        milestoneId,
        studentResponse: studentResponse || progressSummary || undefined,
        progressSummary: progressSummary || undefined,
        blockers: blockers || undefined,
        notes: notes || undefined,
        cadence: cadenceToUse,
        preferredHour,
        timezone,
        quietHoursEnabled,
      },
      authUser.id
    );

    const updatedPrefs = await StudentCheckinService.getPreferences(studentId, authUser.id);

    // Dispatch in-app notification if progress or blockers provided
    if (progressSummary || blockers) {
      const todayStr = new Date().toISOString().split("T")[0];
      try {
        await notificationService.dispatch({
          userId: studentId,
          title: "Mentorship Check-In Recorded",
          message: blockers
            ? `Your check-in was logged. ASTRION noted your reported challenge: "${blockers.slice(0, 80)}..." and will adapt your next session.`
            : `Great work! Your self-reported progress has been recorded in your mentorship log.`,
          category: "mentorship",
          priority: "normal",
          idempotencyKey: `checkin-${studentId}-${todayStr}`,
          channels: ["in_app"],
        });
      } catch {
        // Soft fail if notifications table is unavailable
      }
    }

    return NextResponse.json({
      success: true,
      message: "Check-in recorded and preferences saved.",
      record: checkinRecord,
      preferences: {
        frequency: updatedPrefs.cadence,
        preferredHour: updatedPrefs.preferredHour,
        timezone: updatedPrefs.timezone,
        quietHoursEnabled: updatedPrefs.quietHoursEnabled,
        scheduledDeliveryStatus: "in_session_active",
        backgroundRemindersEnabled: false,
        deliveryNotice:
          "Check-ins are available during your mentorship sessions. Automatic scheduled reminders are not currently enabled.",
      },
    });
  } catch (err: any) {
    const status = err.message?.includes("403_FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await resolveAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          error: "401_UNAUTHORIZED: Authentication required to delete check-ins.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || authUser.id;
    const checkinId = searchParams.get("checkinId");
    const clearAll = searchParams.get("all") === "true";

    if (studentId !== authUser.id && authUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "403_FORBIDDEN: You cannot delete check-ins for another student.",
        },
        { status: 403 }
      );
    }

    if (clearAll) {
      await StudentCheckinService.clearAllCheckinHistory(studentId, authUser.id);
      return NextResponse.json({
        success: true,
        message: "All check-in history deleted in accordance with retention policy.",
      });
    }

    if (!checkinId) {
      return NextResponse.json(
        {
          success: false,
          error: "400_BAD_REQUEST: Missing checkinId to delete.",
        },
        { status: 400 }
      );
    }

    await StudentCheckinService.deleteCheckinRecord(studentId, checkinId, authUser.id);
    return NextResponse.json({
      success: true,
      message: `Check-in record ${checkinId} successfully deleted.`,
    });
  } catch (err: any) {
    const status = err.message?.includes("403_FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await resolveAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          error: "401_UNAUTHORIZED: Authentication required to update check-in.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { studentId: reqStudentId, checkinId, progressSummary, blockers, notes, studentResponse } = body;

    const studentId = reqStudentId || authUser.id;
    if (studentId !== authUser.id && authUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "403_FORBIDDEN: You cannot update check-ins for another student.",
        },
        { status: 403 }
      );
    }

    if (!checkinId) {
      return NextResponse.json(
        {
          success: false,
          error: "400_BAD_REQUEST: Missing checkinId to update.",
        },
        { status: 400 }
      );
    }

    const updated = await StudentCheckinService.updateCheckinRecord(
      studentId,
      checkinId,
      { progressSummary, blockers, notes, studentResponse },
      authUser.id
    );

    return NextResponse.json({
      success: true,
      record: updated,
      message: "Check-in reflection updated while preserving student_reported provenance.",
    });
  } catch (err: any) {
    const status = err.message?.includes("403_FORBIDDEN") ? 403 : err.message?.includes("404_NOT_FOUND") ? 404 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
