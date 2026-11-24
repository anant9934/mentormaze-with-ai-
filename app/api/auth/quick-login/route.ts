import { NextRequest, NextResponse } from "next/server";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get("role")?.toLowerCase() || "mentor";

    let targetEmail = "priya.sharma@microsoft.com";
    let targetRole = "mentor";
    let redirectPath = "/mentor/dashboard";

    if (roleParam === "student") {
      targetEmail = "anant@example.com";
      targetRole = "student";
      redirectPath = "/dashboard";
    } else if (roleParam === "admin") {
      targetEmail = "admin@mentormaze.com";
      targetRole = "admin";
      redirectPath = "/admin";
    }

    const db = getDb();
    await initializeDatabaseSchema();

    // Query target user
    const userQuery: any = await db.execute(sql`
      SELECT id, email, display_name, role, avatar_url, account_status
      FROM users
      WHERE email = ${targetEmail}
      LIMIT 1;
    `);

    let user = userQuery.rows?.[0] || userQuery?.[0];
    if (!user) {
      return NextResponse.redirect(new URL("/login?error=user_not_found", req.url));
    }

    // Generate secure 32-byte session token
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(sessionToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const ip = req.headers.get("x-forwarded-for") || req.ip || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "quick-login";

    await db.execute(sql`
      INSERT INTO user_sessions (user_id, token, expires_at, user_agent, ip_address)
      VALUES (${user.id}, ${tokenHash}, ${expiresAt.toISOString()}, ${userAgent}, ${ip});
    `);

    await db.execute(sql`
      UPDATE users SET last_login_at = now() WHERE id = ${user.id};
    `);

    const destinationUrl = new URL(redirectPath, req.url);
    const response = NextResponse.redirect(destinationUrl);

    const isLocalhost = req.nextUrl.hostname === "localhost" || req.nextUrl.hostname === "127.0.0.1";
    response.cookies.set("mm_session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" && !isLocalhost,
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("[QuickLogin] Failed to create fast session:", err);
    return NextResponse.redirect(new URL("/login?error=quick_login_failed", req.url));
  }
}
