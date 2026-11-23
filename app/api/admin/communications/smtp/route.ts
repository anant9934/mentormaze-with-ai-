import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-auth";
import { getServerSession } from "@/lib/auth/server-auth";
import { verifySmtpConnection, getCachedSmtpStatus, sendEmailDirect } from "@/lib/email/transport";
import { TEMPLATE_MAP } from "@/lib/email/templates/registry";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin.errorResponse) return admin.errorResponse;

  try {
    const status = getCachedSmtpStatus();
    return NextResponse.json({ success: true, status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to get SMTP status" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin.errorResponse) return admin.errorResponse;

  try {
    const session = await getServerSession();
    if (session && session.role !== "admin" && session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { action, recipientEmail, templateId, customVariables } = body;

    if (action === "test-connection") {
      const liveStatus = await verifySmtpConnection();
      return NextResponse.json({ success: true, status: liveStatus });
    }

    if (action === "send-test") {
      if (!recipientEmail) {
        return NextResponse.json({ error: "recipientEmail is required for test send" }, { status: 400 });
      }

      const targetTemplateId = templateId || "auth.welcome_student";
      const templateDef = TEMPLATE_MAP.get(targetTemplateId);
      if (!templateDef) {
        return NextResponse.json({ error: `Template ${targetTemplateId} not found` }, { status: 404 });
      }

      const sampleVars: Record<string, any> = {};
      templateDef.variables.forEach((v) => {
        sampleVars[v.key] = v.sampleValue;
      });
      const merged = { ...sampleVars, ...(customVariables || {}) };
      const rendered = templateDef.render(merged);

      const result = await sendEmailDirect({
        to: recipientEmail,
        subject: `[TEST] ${rendered.subject}`,
        html: rendered.html,
        text: rendered.text,
      });

      return NextResponse.json({
        success: result.success,
        messageId: result.messageId,
        response: result.response,
        error: result.error,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "SMTP operation failed" }, { status: 500 });
  }
}
