import { NextRequest, NextResponse } from "next/server";
import { requireServerRole } from "@/lib/auth/server-auth";
import { notificationService } from "@/lib/notifications/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireServerRole(["admin", "super_admin"]);
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const logs = await notificationService.getDeliveryLogs(limit, offset);
    return NextResponse.json({ logs });
  } catch (err: any) {
    console.error("GET /api/admin/communications/notifications/logs error:", err);
    return NextResponse.json({ error: err.message || "Unauthorized" }, { status: 403 });
  }
}

