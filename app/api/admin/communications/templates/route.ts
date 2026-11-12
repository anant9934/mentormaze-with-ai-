import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server-auth";
import { emailService } from "@/lib/email/service";
import { TEMPLATE_MAP } from "@/lib/email/templates/registry";
import { EmailCategory } from "@/lib/email/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    // Allow admin access
    if (session && session.role !== "admin" && session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") as EmailCategory | null;
    const search = searchParams.get("search")?.toLowerCase();

    let templates = await emailService.getTemplates(category || undefined);

    if (search) {
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          t.id.toLowerCase().includes(search) ||
          t.subject.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ success: true, templates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load email templates" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (session && session.role !== "admin" && session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { id, subject, previewText, htmlBody, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Template id is required" }, { status: 400 });
    }

    const updated = await emailService.updateTemplate(
      id,
      { subject, previewText, htmlBody, isActive },
      session ? { id: session.id, email: session.email } : undefined
    );

    return NextResponse.json({ success: true, template: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update email template" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (session && session.role !== "admin" && session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { id, action, variables } = body;

    if (action === "reset") {
      if (!id) {
        return NextResponse.json({ error: "Template id is required" }, { status: 400 });
      }
      const reset = await emailService.resetTemplate(
        id,
        session ? { id: session.id, email: session.email } : undefined
      );
      return NextResponse.json({ success: true, template: reset });
    }

    if (action === "preview") {
      if (!id) {
        return NextResponse.json({ error: "Template id is required" }, { status: 400 });
      }
      const templateDef = TEMPLATE_MAP.get(id);
      if (!templateDef) {
        return NextResponse.json({ error: `Template ${id} not found` }, { status: 404 });
      }

      const sampleVars: Record<string, any> = {};
      templateDef.variables.forEach((v) => {
        sampleVars[v.key] = v.sampleValue;
      });
      const merged = { ...sampleVars, ...(variables || {}) };

      const rendered = templateDef.render(merged);
      return NextResponse.json({
        success: true,
        rendered,
        variables: templateDef.variables,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process template request" }, { status: 500 });
  }
}
