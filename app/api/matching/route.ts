import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import {
  MatchmakingEngine,
  StudentTargetPreferences,
  MatchingStrategy,
  STRATEGY_PRESETS,
} from "@/lib/matching/engine";
import { MATCH_DIMENSIONS } from "@/lib/matching/factors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || "user-student-1";
    const strategy = (searchParams.get("strategy") as MatchingStrategy) || "balanced";
    const targetRole = searchParams.get("role") || undefined;
    const targetCompany = searchParams.get("company") || undefined;
    const maxBudget = searchParams.get("maxBudget") ? parseInt(searchParams.get("maxBudget")!, 10) : undefined;

    const student = store.getStudentProfile(studentId) || null;
    const approvedMentors = store.getMentors(true);

    const preferences: StudentTargetPreferences = {
      targetRole: targetRole || student?.targetRole,
      targetCompanies: targetCompany ? [targetCompany] : undefined,
      maxBudgetInr: maxBudget,
    };

    const startTime = performance.now();
    const rankings = MatchmakingEngine.rankMentors(
      student,
      preferences,
      approvedMentors,
      strategy in STRATEGY_PRESETS ? strategy : "balanced"
    );
    const durationMs = Number((performance.now() - startTime).toFixed(2));

    return NextResponse.json({
      success: true,
      strategy,
      totalMentorsEvaluated: approvedMentors.length,
      evaluatedFactorsCount: 100,
      executionLatencyMs: durationMs,
      dimensions: Object.values(MATCH_DIMENSIONS),
      rankings,
    });
  } catch (error: any) {
    console.error("Matchmaking API GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to compute 100-factor matchmaking" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const studentId = body.studentId || "user-student-1";
    const strategy: MatchingStrategy = body.strategy || "balanced";
    const preferences: StudentTargetPreferences = body.preferences || {};

    const student = store.getStudentProfile(studentId) || null;
    const approvedMentors = store.getMentors(true);

    const startTime = performance.now();
    const rankings = MatchmakingEngine.rankMentors(
      student,
      preferences,
      approvedMentors,
      strategy in STRATEGY_PRESETS ? strategy : "balanced"
    );
    const durationMs = Number((performance.now() - startTime).toFixed(2));

    return NextResponse.json({
      success: true,
      strategy,
      totalMentorsEvaluated: approvedMentors.length,
      evaluatedFactorsCount: 100,
      executionLatencyMs: durationMs,
      preferences,
      dimensions: Object.values(MATCH_DIMENSIONS),
      rankings,
    });
  } catch (error: any) {
    console.error("Matchmaking API POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to compute 100-factor matchmaking" },
      { status: 500 }
    );
  }
}
