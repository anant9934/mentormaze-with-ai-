import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-auth";
import { getServerSession } from "@/lib/auth/server-auth";
import { emailService } from "@/lib/email/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin.errorResponse) return admin.errorResponse;

  try {
    const session = await getServerSession();
    if (session && session.role !== "admin" && session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const automations = await emailService.getAutomations();
    return NextResponse.json({ success: true, automations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load automations" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin.errorResponse) return admin.errorResponse;

  try {
    const session = await getServerSession();
    if (session && session.role !== "admin" && session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { id, isEnabled, delaySeconds, quietHoursEnabled, maxRetries } = body;

    if (!id) {
      return NextResponse.json({ error: "Automation id is required" }, { status: 400 });
    }

    let automation;
    if (isEnabled !== undefined) {
      automation = await emailService.toggleAutomation(
        id,
        isEnabled,
        session ? { id: session.id, email: session.email } : undefined
      );
    }

    if (delaySeconds !== undefined || quietHoursEnabled !== undefined || maxRetries !== undefined) {
      automation = await emailService.updateAutomation(
        id,
        { delaySeconds, quietHoursEnabled, maxRetries },
        session ? { id: session.id, email: session.email } : undefined
      );
    }

    return NextResponse.json({ success: true, automation });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update automation" }, { status: 500 });
  }
}
