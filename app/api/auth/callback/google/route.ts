import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const host = req.headers.get("host") || "localhost:3000";
  const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const baseUrl = `${protocol}://${host}`;

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(error || "Authorization cancelled")}`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${baseUrl}/api/auth/callback/google`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/login?error=Google+OAuth+credentials+missing`);
  }

  try {
    // 1. Exchange authorization code for Google access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Google token exchange failed:", tokenData);
      return NextResponse.redirect(`${baseUrl}/login?error=Failed+to+exchange+Google+authorization+code`);
    }

    // 2. Fetch authenticated user profile from Google
    const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await userinfoResponse.json();
    if (!profile.email) {
      return NextResponse.redirect(`${baseUrl}/login?error=Google+profile+did+not+provide+an+email`);
    }

    const email = profile.email.toLowerCase().trim();
    const displayName = profile.name || email.split("@")[0];
    const avatarUrl = profile.picture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";

    const db = getDb();

    // 3. Query or Provision User in PostgreSQL
    const existingUserQuery: any = await db.execute(sql`
      SELECT id, email, display_name, role, avatar_url, account_status, timezone
      FROM users
      WHERE email = ${email}
      LIMIT 1;
    `);

    let user = existingUserQuery.rows?.[0] || existingUserQuery?.[0];

    if (!user) {
      // Auto-provision Google user as student
      const insertResult: any = await db.execute(sql`
        INSERT INTO users (email, display_name, avatar_url, role, account_status)
        VALUES (${email}, ${displayName}, ${avatarUrl}, 'student', 'active')
        RETURNING id, email, display_name, role, avatar_url, timezone;
      `);
      user = insertResult.rows?.[0] || insertResult?.[0];
    } else {
      // Update avatar if provided
      if (profile.picture) {
        await db.execute(sql`
          UPDATE users SET avatar_url = ${avatarUrl}, last_login_at = now() WHERE id = ${user.id};
        `);
      }
    }

    // 4. Generate secure session token and persist to user_sessions
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(sessionToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const userAgent = req.headers.get("user-agent") || "unknown";
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    await db.execute(sql`
      INSERT INTO user_sessions (user_id, token, expires_at, user_agent, ip_address)
      VALUES (${user.id}, ${tokenHash}, ${expiresAt.toISOString()}, ${userAgent}, ${ip});
    `);

    // 5. Set session cookie and redirect to dashboard
    const destination = user.role === "admin" ? "/admin" : user.role === "mentor" ? "/mentor/dashboard" : "/dashboard";
    const redirectResponse = NextResponse.redirect(`${baseUrl}${destination}`);

    redirectResponse.cookies.set("mm_session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return redirectResponse;
  } catch (err: any) {
    console.error("Google OAuth callback exception:", err);
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(err.message || "OAuth processing failed")}`);
  }
}
