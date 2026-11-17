import { NextRequest, NextResponse } from "next/server";
import { EvaluationBenchmarkSuite } from "@/lib/ai-mentor/evaluation-benchmark";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const results = EvaluationBenchmarkSuite.runBenchmarkSuite();
    return NextResponse.json({ success: true, benchmark: results });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const results = EvaluationBenchmarkSuite.runBenchmarkSuite();
    return NextResponse.json({ success: true, benchmark: results });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
