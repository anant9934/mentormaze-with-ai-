import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-auth";
import { emailService } from "@/lib/email/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin.errorResponse) return admin.errorResponse;

  try {
    const stats = await emailService.getDeliveryStats();
    return NextResponse.json({ success: true, stats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to get email statistics" }, { status: 500 });
  }
}
