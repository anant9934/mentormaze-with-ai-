import { NextRequest, NextResponse } from "next/server";
import { StudentContextBuilder } from "@/lib/ai-mentor/student-context-builder";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "usr-student-1";

    const context = await StudentContextBuilder.buildContext(userId);
    return NextResponse.json({ success: true, context });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
