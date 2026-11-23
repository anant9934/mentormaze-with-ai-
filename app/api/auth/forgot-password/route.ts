import { NextRequest, NextResponse } from "next/server";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import { rateLimiter } from "@/lib/security/rate-limiter";
import { createPasswordResetToken } from "@/lib/auth/password";
import { dispatchEmailEvent } from "@/lib/email/dispatcher";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.ip || "127.0.0.1";

    // Rate limit: 5 requests per hour per IP to prevent spam and enumeration
    const rateCheck = rateLimiter.check(`forgot_pwd_${ip}`, 5, 3600);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many password reset requests. Please try again later." },
        { status: 429, headers: { "Retry-After": rateCheck.resetInSeconds.toString() } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    await initializeDatabaseSchema();
    const db = getDb();

    // Query user
    const userQuery: any = await db.execute(sql`
      SELECT id, email, display_name, account_status
      FROM users
      WHERE email = ${cleanEmail}
      LIMIT 1;
    `);

    const user = userQuery.rows?.[0] || userQuery?.[0];

    // Security practice: Always return generic success to prevent user enumeration
    if (user && user.account_status === "active") {
      const { rawToken } = await createPasswordResetToken(user.id);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mentormaze.aitathastu.com";
      const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

      // Dispatch password reset email via outbox / SMTP
      await dispatchEmailEvent({
        eventType: "user.password_reset_requested",
        recipient: {
          email: user.email,
          name: user.display_name,
        },
        variables: {
          user_name: user.display_name,
          reset_url: resetUrl,
          expires_in: "1 hour",
        },
      }).catch((err) => {
        console.error("[ForgotPassword] Failed to dispatch reset email:", err.message);
      });
    }

    return NextResponse.json({
      success: true,
      message: "If an active account exists with that email address, a password reset link has been sent.",
    });
  } catch (error: any) {
    console.error("[ForgotPassword] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
