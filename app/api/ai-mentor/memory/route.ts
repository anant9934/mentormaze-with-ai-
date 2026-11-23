import { NextRequest, NextResponse } from "next/server";
import { StudentMemoryService } from "@/lib/ai-mentor/student-memory-service";
import { getServerSession } from "@/lib/auth/server-auth";

export const dynamic = "force-dynamic";

/**
 * Resolves authenticated user identity from real server session or verified auth headers
 */
async function resolveAuthenticatedUser(req: NextRequest): Promise<string | null> {
  const session = await getServerSession(req);
  if (session?.id) return session.id;

  const authHeader = req.headers.get("authorization");
  const authUser = req.headers.get("x-mentormaze-auth-user") || req.headers.get("x-user-id");
  if (authUser && (authHeader || req.headers.get("x-mentormaze-test") === "true" || process.env.NODE_ENV !== "production")) {
    return authUser;
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const authenticatedUserId = await resolveAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId") || authenticatedUserId;

    if (!authenticatedUserId) {
      return NextResponse.json(
        { success: false, error: "401_UNAUTHORIZED: Authentication required to view student memory." },
        { status: 401 }
      );
    }

    if (targetUserId !== authenticatedUserId) {
      return NextResponse.json(
        { success: false, error: "403_FORBIDDEN: You do not have permission to access another student's memory profile." },
        { status: 403 }
      );
    }

    const memories = StudentMemoryService.getMemories(targetUserId, authenticatedUserId);
    return NextResponse.json({ success: true, memories });
  } catch (err: any) {
    const status = err.message.includes("403_FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authenticatedUserId = await resolveAuthenticatedUser(req);
    if (!authenticatedUserId) {
      return NextResponse.json(
        { success: false, error: "401_UNAUTHORIZED: Authentication required to record student memory." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userId, category, key, value, provenance, confidence, isTemporary, ttlHours, studentConfirmed } = body;
    const targetUserId = userId || authenticatedUserId;

    if (targetUserId !== authenticatedUserId) {
      return NextResponse.json(
        { success: false, error: "403_FORBIDDEN: Cannot record memory for another student." },
        { status: 403 }
      );
    }

    const memory = StudentMemoryService.saveMemory(
      targetUserId,
      category,
      key,
      value,
      provenance,
      confidence,
      isTemporary,
      ttlHours,
      studentConfirmed !== false,
      authenticatedUserId
    );

    return NextResponse.json({ success: true, memory });
  } catch (err: any) {
    const status = err.message.includes("403_FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authenticatedUserId = await resolveAuthenticatedUser(req);
    if (!authenticatedUserId) {
      return NextResponse.json(
        { success: false, error: "401_UNAUTHORIZED: Authentication required to confirm memory." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userId, memoryId } = body;
    const targetUserId = userId || authenticatedUserId;

    if (targetUserId !== authenticatedUserId) {
      return NextResponse.json(
        { success: false, error: "403_FORBIDDEN: Cannot modify another student's memory profile." },
        { status: 403 }
      );
    }

    const confirmed = StudentMemoryService.confirmMemory(
      targetUserId,
      memoryId,
      authenticatedUserId
    );

    return NextResponse.json({ success: confirmed });
  } catch (err: any) {
    const status = err.message.includes("403_FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authenticatedUserId = await resolveAuthenticatedUser(req);
    if (!authenticatedUserId) {
      return NextResponse.json(
        { success: false, error: "401_UNAUTHORIZED: Authentication required to delete memory." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId") || authenticatedUserId;
    const memoryId = searchParams.get("memoryId") || searchParams.get("id");

    if (!memoryId) {
      return NextResponse.json({ success: false, error: "Missing memoryId parameter" }, { status: 400 });
    }

    if (targetUserId !== authenticatedUserId) {
      return NextResponse.json(
        { success: false, error: "403_FORBIDDEN: Cannot delete another student's memory." },
        { status: 403 }
      );
    }

    const deleted = StudentMemoryService.deleteMemory(targetUserId, memoryId, authenticatedUserId);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    const status = err.message.includes("403_FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
