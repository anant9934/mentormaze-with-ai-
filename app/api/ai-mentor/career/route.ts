import { NextRequest, NextResponse } from "next/server";
import { CareerIntelligenceService } from "@/lib/ai-mentor/career-intelligence";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const company = searchParams.get("company") || undefined;
    const action = searchParams.get("action");

    if (action === "roadmap") {
      const targetRole = searchParams.get("targetRole") || "Software Development Engineer (SDE-1)";
      const roadmap = CareerIntelligenceService.generateDynamicRoadmap(targetRole);
      return NextResponse.json({ success: true, roadmap });
    }

    const jobs = CareerIntelligenceService.searchJobs(query, company);
    return NextResponse.json({ success: true, jobs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resumeText, jobId } = body;

    if (!resumeText) {
      return NextResponse.json({ success: false, error: "Missing resumeText" }, { status: 400 });
    }

    const analysis = CareerIntelligenceService.analyzeResumeAgainstJob(
      resumeText,
      jobId || "jd-google-sde1"
    );

    return NextResponse.json({ success: true, analysis });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
