import { NextRequest, NextResponse } from "next/server";
import { StudentMemoryService } from "@/lib/ai-mentor/student-memory-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "usr-student-1";
    const requestingUserId = req.headers.get("x-user-id") || userId;

    const memories = StudentMemoryService.getMemories(userId, requestingUserId);
    return NextResponse.json({ success: true, memories });
  } catch (err: any) {
    const status = err.message.includes("403_FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, category, key, value, provenance, confidence, isTemporary, ttlHours, studentConfirmed } = body;
    const requestingUserId = req.headers.get("x-user-id") || userId;

    const memory = StudentMemoryService.saveMemory(
      userId || "usr-student-1",
      category,
      key,
      value,
      provenance,
      confidence,
      isTemporary,
      ttlHours,
      studentConfirmed !== false,
      requestingUserId
    );

    return NextResponse.json({ success: true, memory });
  } catch (err: any) {
    const status = err.message.includes("403_FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, memoryId } = body;
    const requestingUserId = req.headers.get("x-user-id") || userId;

    const confirmed = StudentMemoryService.confirmMemory(
      userId || "usr-student-1",
      memoryId,
      requestingUserId
    );

    return NextResponse.json({ success: confirmed });
  } catch (err: any) {
    const status = err.message.includes("403_FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "usr-student-1";
    const memoryId = searchParams.get("memoryId");
    const requestingUserId = req.headers.get("x-user-id") || userId;

    if (!memoryId) {
      return NextResponse.json({ success: false, error: "Missing memoryId parameter" }, { status: 400 });
    }

    const deleted = StudentMemoryService.deleteMemory(userId, memoryId, requestingUserId);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    const status = err.message.includes("403_FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
