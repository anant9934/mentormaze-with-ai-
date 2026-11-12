import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server-auth";
import { emailService } from "@/lib/email/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession();
    if (session && session.role !== "admin" && session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const stats = await emailService.getDeliveryStats();
    return NextResponse.json({ success: true, stats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to get email statistics" }, { status: 500 });
  }
}
