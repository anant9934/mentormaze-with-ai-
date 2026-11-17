import { NextRequest, NextResponse } from "next/server";
import { StudentSkillGraph, CANONICAL_TAXONOMY } from "@/lib/ai-mentor/student-skill-graph";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "usr-student-1";

    const skills = StudentSkillGraph.getStudentSkills(userId);
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
    const body = await req.json();
    const { userId, skillId, score, evidenceSource, misconception } = body;

    const updated = StudentSkillGraph.recordEvidence(
      userId || "usr-student-1",
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
