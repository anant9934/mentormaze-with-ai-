import { NextRequest, NextResponse } from "next/server";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import crypto from "crypto";
import { rateLimiter } from "@/lib/security/rate-limiter";
import { sharedRateLimiter } from "@/lib/security/shared-rate-limiter";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { verifyTurnstileToken } from "@/lib/security/turnstile-service";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.ip || "127.0.0.1";

    // Enforce shared distributed rate limiting: 10 login attempts per minute per IP
    // Sensitive authentication endpoint enforces fail-closed policy
    const rateCheck = await sharedRateLimiter.check(`login_${ip}`, 10, 60, { policy: "fail-closed" });
    if (!rateCheck.success) {
      if (rateCheck.error === "limiter_unavailable") {
        return NextResponse.json(
          { error: "Service Unavailable: Authentication rate limiter temporarily unavailable." },
          { status: 503, headers: { "Retry-After": "15" } }
        );
      }
      return NextResponse.json(
        { error: "Too many login attempts. Please try again in " + rateCheck.resetInSeconds + " seconds." },
        { status: 429, headers: { "Retry-After": rateCheck.resetInSeconds.toString() } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { email, password, role, turnstileToken } = body;

    // Validate Cloudflare Turnstile challenge token if provided
    if (turnstileToken) {
      const turnstileCheck = await verifyTurnstileToken(turnstileToken, ip);
      if (!turnstileCheck.success) {
        return NextResponse.json(
          { error: "Security check failed. Please complete the verification challenge." },
          { status: 403 }
        );
      }
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const db = getDb();
    await initializeDatabaseSchema();

    // Query user by email from PostgreSQL
    const userQuery: any = await db.execute(sql`
      SELECT id, email, password_hash, display_name, role, avatar_url, account_status, timezone
      FROM users
      WHERE email = ${email.toLowerCase().trim()}
      LIMIT 1;
    `);

    let user = userQuery.rows?.[0] || userQuery?.[0];

    // Safe self-registration for new students/mentors if user does not exist
    if (!user && role) {
      // Security guard: Never permit client to self-provision admin or super_admin roles
      const safeRole = (role === "mentor") ? "mentor" : "student";
      const userPassword = password || "mm_temp_pwd_123";
      const generatedHash = await hashPassword(userPassword);
      const insertResult: any = await db.execute(sql`
        INSERT INTO users (email, password_hash, display_name, role, account_status)
        VALUES (${email.toLowerCase().trim()}, ${generatedHash}, ${email.split("@")[0]}, ${safeRole}, 'active')
        RETURNING id, email, password_hash, display_name, role, avatar_url, timezone, account_status;
      `);
      user = insertResult.rows?.[0] || insertResult?.[0];
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials: User not found" }, { status: 401 });
    }

    if (user.account_status !== "active") {
      return NextResponse.json({ error: "Account suspended or inactive" }, { status: 403 });
    }

    // Strict password verification:
    // - OAuth accounts (no password_hash): disallow password bypass, instruct OAuth / password reset
    // - Password accounts: verify using verifyPassword()
    // - Legacy / outdated hashes: automatically rehash upon successful authentication
    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 401 });
    }

    const verification = await verifyPassword(password, user.password_hash);

    if (!verification.isValid) {
      if (verification.isOAuthOnly) {
        return NextResponse.json(
          {
            error: "This account was registered via OAuth single sign-on. Please log in with your OAuth provider, or request a password reset to create a password.",
            code: "OAUTH_ACCOUNT",
          },
          { status: 401 }
        );
      }
      if (verification.requiresPasswordReset) {
        return NextResponse.json(
          {
            error: "Your account credentials cannot be verified due to an outdated format. Please reset your password to regain access.",
            code: "PASSWORD_RESET_REQUIRED",
          },
          { status: 401 }
        );
      }
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Zero-downtime automatic migration: rehash legacy SHA-256 or lower-cost bcrypt hashes to bcrypt-12
    if (verification.needsRehash) {
      const newHash = await hashPassword(password);
      await db.execute(sql`
        UPDATE users SET password_hash = ${newHash}, updated_at = now() WHERE id = ${user.id};
      `);
    }

    // Generate secure 32-byte session token and store its SHA-256 hash in database
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(sessionToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Persist session to PostgreSQL user_sessions (hashed token only)
    const userAgent = req.headers.get("user-agent") || "unknown";

    await db.execute(sql`
      INSERT INTO user_sessions (user_id, token, expires_at, user_agent, ip_address)
      VALUES (${user.id}, ${tokenHash}, ${expiresAt.toISOString()}, ${userAgent}, ${ip});
    `);

    // Update last_login_at
    await db.execute(sql`
      UPDATE users SET last_login_at = now() WHERE id = ${user.id};
    `);

    const response = NextResponse.json({
      success: true,
      sessionToken,
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
    console.error("Login route error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
