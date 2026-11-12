import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server-auth";
import { emailService } from "@/lib/email/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (session && session.role !== "admin" && session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const failed = await emailService.getFailedEmails();
    return NextResponse.json({ success: true, failed });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load failed emails" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (session && session.role !== "admin" && session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: "id and action are required" }, { status: 400 });
    }

    if (action === "retry") {
      const ok = await emailService.retryFailedEmail(
        id,
        session ? { id: session.id, email: session.email } : undefined
      );
      return NextResponse.json({ success: ok });
    }

    if (action === "cancel") {
      const ok = await emailService.cancelQueuedEmail(
        id,
        session ? { id: session.id, email: session.email } : undefined
      );
      return NextResponse.json({ success: ok });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process failed email action" }, { status: 500 });
  }
}
