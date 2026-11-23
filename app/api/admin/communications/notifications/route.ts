import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-auth";
import { requireServerRole } from "@/lib/auth/server-auth";
import { notificationService } from "@/lib/notifications/service";
import { getDb, schema } from "@/lib/db";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const adminAuth = await requireAdmin(req);
  if (adminAuth.errorResponse) return adminAuth.errorResponse;

  try {
    const stats = await notificationService.getAdminStats();
    const db = getDb();

    const announcements = await db
      .select()
      .from(schema.notificationAnnouncements)
      .orderBy(desc(schema.notificationAnnouncements.publishedAt))
      .limit(30);

    return NextResponse.json({
      admin: { id: adminAuth.user.id, displayName: adminAuth.user.displayName },
      stats,
      announcements,
    });
  } catch (err: any) {
    console.error("GET /api/admin/communications/notifications error:", err);
    return NextResponse.json({ error: err.message || "Unauthorized" }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  const adminAuth = await requireAdmin(req);
  if (adminAuth.errorResponse) return adminAuth.errorResponse;

  try {
    const body = await req.json();

    if (!body.title || !body.content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const announcement = await notificationService.publishAnnouncement({
      title: body.title,
      content: body.content,
      audience: body.audience || "all",
      priority: body.priority || "normal",
      actionUrl: body.actionUrl,
      actionLabel: body.actionLabel,
      channels: body.channels || ["in_app", "push"],
      publishedByUserId: adminAuth.user.id,
    });

    return NextResponse.json({
      success: true,
      announcement,
    });
  } catch (err: any) {
    console.error("POST /api/admin/communications/notifications error:", err);
    return NextResponse.json({ error: err.message || "Failed to publish announcement" }, { status: 500 });
  }
}

