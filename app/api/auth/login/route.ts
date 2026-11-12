import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, role } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const db = getDb();

    // Query user by email from PostgreSQL
    const userQuery: any = await db.execute(sql`
      SELECT id, email, password_hash, display_name, role, avatar_url, account_status, timezone
      FROM users
      WHERE email = ${email.toLowerCase().trim()}
      LIMIT 1;
    `);

    let user = userQuery.rows?.[0] || userQuery?.[0];

    // If user not found and role is provided (demo auto-provisioning for dev)
    if (!user && role) {
      const generatedHash = await bcrypt.hash(password || "password123", 10);
      const insertResult: any = await db.execute(sql`
        INSERT INTO users (email, password_hash, display_name, role, account_status)
        VALUES (${email.toLowerCase().trim()}, ${generatedHash}, ${email.split("@")[0]}, ${role}, 'active')
        RETURNING id, email, display_name, role, avatar_url, timezone;
      `);
      user = insertResult.rows?.[0] || insertResult?.[0];
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials: User not found" }, { status: 401 });
    }

    if (user.account_status !== "active") {
      return NextResponse.json({ error: "Account suspended or inactive" }, { status: 403 });
    }

    // Verify password if password_hash exists
    if (user.password_hash && password) {
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }
    }

    // Generate secure 32-byte session token
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Persist session to PostgreSQL user_sessions
    const userAgent = req.headers.get("user-agent") || "unknown";
    const ip = req.headers.get("x-forwarded-for") || req.ip || "127.0.0.1";

    await db.execute(sql`
      INSERT INTO user_sessions (user_id, token, expires_at, user_agent, ip_address)
      VALUES (${user.id}, ${sessionToken}, ${expiresAt.toISOString()}, ${userAgent}, ${ip});
    `);

    // Update last_login_at
    await db.execute(sql`
      UPDATE users SET last_login_at = now() WHERE id = ${user.id};
    `);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        avatarUrl: user.avatar_url,
        timezone: user.timezone,
      },
    });

    // Set HTTP-only secure cookie
    response.cookies.set("mm_session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Login route error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
