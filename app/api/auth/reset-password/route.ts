import { NextRequest, NextResponse } from "next/server";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import { rateLimiter } from "@/lib/security/rate-limiter";
import { hashPassword, verifyAndConsumePasswordResetToken } from "@/lib/auth/password";
import { dispatchEmailEvent } from "@/lib/email/dispatcher";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.ip || "127.0.0.1";

    // Rate limit: 10 attempts per hour per IP
    const rateCheck = rateLimiter.check(`reset_pwd_${ip}`, 10, 3600);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many password reset attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": rateCheck.resetInSeconds.toString() } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { token, newPassword } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Reset token is required" }, { status: 400 });
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    await initializeDatabaseSchema();
    const db = getDb();

    // Verify and atomically consume the reset token
    const tokenResult = await verifyAndConsumePasswordResetToken(token);
    if (!tokenResult.isValid || !tokenResult.userId) {
      return NextResponse.json(
        { error: tokenResult.error || "Invalid or expired password reset link" },
        { status: 400 }
      );
    }

    // Hash the new password with bcrypt work factor 12
    const newHash = await hashPassword(newPassword);

    // Update password in users table
    await db.execute(sql`
      UPDATE users 
      SET password_hash = ${newHash}, updated_at = now()
      WHERE id = ${tokenResult.userId};
    `);

    // Invalidate all active user sessions for this user (defense in depth)
    await db.execute(sql`
      DELETE FROM user_sessions WHERE user_id = ${tokenResult.userId};
    `);

    // Retrieve user details for notification
    const userQuery: any = await db.execute(sql`
      SELECT id, email, display_name FROM users WHERE id = ${tokenResult.userId} LIMIT 1;
    `);
    const user = userQuery.rows?.[0] || userQuery?.[0];

    if (user) {
      // Dispatch password changed security alert
      await dispatchEmailEvent({
        eventType: "user.password_changed",
        recipient: {
          email: user.email,
          name: user.display_name,
        },
        variables: {
          user_name: user.display_name,
          timestamp: new Date().toUTCString(),
        },
      }).catch((err) => {
        console.error("[ResetPassword] Failed to dispatch alert email:", err.message);
      });
    }

    return NextResponse.json({
      success: true,
      message: "Password has been successfully reset. Please log in with your new password.",
    });
  } catch (error: any) {
    console.error("[ResetPassword] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
