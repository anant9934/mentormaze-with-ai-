import { NextResponse } from "next/server";
import { MATCH_DIMENSIONS, HUNDRED_MATCH_FACTORS } from "@/lib/matching/factors";

export async function GET() {
  return NextResponse.json({
    success: true,
    engine: "MentorMaze 100-Factor Multi-Dimensional Intelligence Layer v2.0",
    totalFactors: HUNDRED_MATCH_FACTORS.length,
    dimensions: Object.values(MATCH_DIMENSIONS),
    factors: HUNDRED_MATCH_FACTORS,
    metadata: {
      frameworkVersion: "2026.4.1",
      deterministic: true,
      subMillisecondBenchmark: true,
      explainabilityScore: 1.0,
    },
  });
}
