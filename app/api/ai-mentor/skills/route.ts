import { NextRequest, NextResponse } from "next/server";
import { StudentSkillGraph, CANONICAL_TAXONOMY } from "@/lib/ai-mentor/student-skill-graph";
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

export async function GET(req: NextRequest) {
  try {
    const authUser = await resolveAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "401_UNAUTHORIZED: Authentication required to view student skills." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId") || authUser.id;

    if (targetUserId !== authUser.id && authUser.role !== "admin" && authUser.role !== "mentor") {
      return NextResponse.json(
        { success: false, error: "403_FORBIDDEN: You do not have permission to access another student's skill profile." },
        { status: 403 }
      );
    }

    const skills = StudentSkillGraph.getStudentSkills(targetUserId);
    return NextResponse.json({
      success: true,
      skills,
      taxonomy: CANONICAL_TAXONOMY,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await resolveAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "401_UNAUTHORIZED: Authentication required to record skill evidence." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userId, skillId, score, evidenceSource, misconception } = body;
    const targetUserId = userId || authUser.id;

    if (targetUserId !== authUser.id && authUser.role !== "admin" && authUser.role !== "mentor") {
      return NextResponse.json(
        { success: false, error: "403_FORBIDDEN: You cannot record evidence for another student." },
        { status: 403 }
      );
    }

    const updated = StudentSkillGraph.recordEvidence(
      targetUserId,
      skillId,
      score || 8.0,
      evidenceSource || "self_reported",
      misconception
    );

    return NextResponse.json({ success: true, updatedSkill: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

