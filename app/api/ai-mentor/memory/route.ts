import { NextRequest, NextResponse } from "next/server";
import { StudentMemoryService } from "@/lib/ai-mentor/student-memory-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "usr-student-1";

    const memories = StudentMemoryService.getMemories(userId);
    return NextResponse.json({ success: true, memories });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, category, key, value, provenance, confidence, isTemporary, ttlHours } = body;

    const memory = StudentMemoryService.saveMemory(
      userId || "usr-student-1",
      category,
      key,
      value,
      provenance,
      confidence,
      isTemporary,
      ttlHours
    );

    return NextResponse.json({ success: true, memory });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "usr-student-1";
    const memoryId = searchParams.get("memoryId");

    if (!memoryId) {
      return NextResponse.json({ success: false, error: "Missing memoryId parameter" }, { status: 400 });
    }

    const deleted = StudentMemoryService.deleteMemory(userId, memoryId);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

