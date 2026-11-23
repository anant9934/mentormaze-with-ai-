import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  role: "student" | "mentor" | "admin" | "super_admin";
  avatarUrl?: string;
  timezone: string;
  mentorProfileId?: string;
}

export type AuthResult = 
  | { user: AuthenticatedUser; errorResponse?: never }
  | { user?: never; errorResponse: NextResponse };

/**
 * Validates the session cookie or Bearer token against the PostgreSQL user_sessions table.
 * Enforces true server-side authentication with session expiration and active account checks.
 */
export async function getServerSession(req?: any): Promise<AuthenticatedUser | null> {
  try {
    let sessionToken: string | undefined;

    // 1. Check Bearer token in Authorization header
    if (req?.headers) {
      const authHeader = typeof req.headers.get === "function" 
        ? req.headers.get("authorization") 
        : req.headers["authorization"];
      if (authHeader && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7).trim();
      }
    }

    // 2. Check NextRequest cookies
    if (!sessionToken && req?.cookies) {
      if (typeof req.cookies.get === "function") {
        sessionToken = req.cookies.get("mm_session_token")?.value;
      } else if (req.cookies["mm_session_token"]) {
        sessionToken = req.cookies["mm_session_token"];
      }
    }

    // 3. Fallback to next/headers cookies()
    if (!sessionToken) {
      try {
        const cookieStore = await cookies();
        sessionToken = cookieStore.get("mm_session_token")?.value;
      } catch (e) {
        // cookies() may fail if outside request scope
      }
    }

    if (!sessionToken) {
      return null;
    }

    // SHA-256 digest of session token (tokens stored hashed in DB)
    const crypto = await import("crypto");
    const tokenHash = crypto.createHash("sha256").update(sessionToken).digest("hex");

    const db = getDb();
    const queryResult: any = await db.execute(sql`
      SELECT 
        u.id, 
        u.email, 
        u.display_name, 
        u.role, 
        u.avatar_url, 
        u.timezone,
        u.account_status,
        s.expires_at,
        mp.id as mentor_profile_id
      FROM user_sessions s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN mentor_profiles mp ON mp.user_id = u.id
      WHERE (s.token = ${tokenHash} OR s.token = ${sessionToken})
        AND s.expires_at > now()
        AND u.account_status = 'active'
      LIMIT 1;
    `);

    const row = queryResult.rows?.[0] || queryResult?.[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
      avatarUrl: row.avatar_url,
      timezone: row.timezone || "Asia/Kolkata",
      mentorProfileId: row.mentor_profile_id || undefined,
    };
  } catch (err) {
    console.error("Error verifying server session:", err);
    return null;
  }
}

/**
 * Alias for getServerSession conforming to standard naming.
 */
export async function getAuthenticatedUser(req?: any): Promise<AuthenticatedUser | null> {
  return getServerSession(req);
}

/**
 * Enforces that a request has a verified active session.
 * Returns 401 if unauthenticated, 403 if account is suspended.
 */
export async function requireAuth(req?: any): Promise<AuthResult> {
  const user = await getServerSession(req);
  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { error: "Unauthorized: Valid authentication session required." },
        { status: 401 }
      ),
    };
  }
  return { user };
}

/**
 * Enforces strict administrator authorization for protected administrative endpoints.
 * Returns 401 if unauthenticated, 403 if authenticated but not admin.
 */
export async function requireAdmin(req?: any): Promise<AuthResult> {
  const auth = await requireAuth(req);
  if (auth.errorResponse) {
    return auth;
  }
  if (auth.user.role !== "admin" && auth.user.role !== "super_admin") {
    return {
      errorResponse: NextResponse.json(
        { error: "Forbidden: Administrator privileges required." },
        { status: 403 }
      ),
    };
  }
  return auth;
}

/**
 * Enforces role-based authorization for specified roles.
 * Returns 401 if unauthenticated, 403 if role not authorized.
 */
export async function requireRole(
  req: any,
  allowedRoles: ("student" | "mentor" | "admin" | "super_admin")[]
): Promise<AuthResult> {
  const auth = await requireAuth(req);
  if (auth.errorResponse) {
    return auth;
  }
  if (!allowedRoles.includes(auth.user.role)) {
    return {
      errorResponse: NextResponse.json(
        { error: `Forbidden: User role '${auth.user.role}' is not authorized. Allowed: ${allowedRoles.join(", ")}` },
        { status: 403 }
      ),
    };
  }
  return auth;
}

/**
 * Verifies resource ownership for booking operations.
 * Allows:
 * 1. The student who owns the booking (booking.student_user_id === user.id)
 * 2. The assigned mentor (booking.mentor_user_id === user.id OR booking.mentor_profile_id === user.mentorProfileId)
 * 3. Platform administrators (user.role === 'admin' | 'super_admin')
 */
export function verifyBookingOwnership(
  booking: {
    student_user_id: string;
    mentor_user_id?: string;
    mentor_profile_id?: string;
  },
  user: AuthenticatedUser
): { authorized: boolean; reason?: string } {
  if (user.role === "admin" || user.role === "super_admin") {
    return { authorized: true };
  }
  if (booking.student_user_id === user.id) {
    return { authorized: true };
  }
  if (booking.mentor_user_id && booking.mentor_user_id === user.id) {
    return { authorized: true };
  }
  if (user.mentorProfileId && booking.mentor_profile_id && booking.mentor_profile_id === user.mentorProfileId) {
    return { authorized: true };
  }
  return {
    authorized: false,
    reason: "You do not have permission to access or modify this booking record.",
  };
}

/**
 * Legacy support for requireServerRole
 */
export async function requireServerRole(
  allowedRoles: ("student" | "mentor" | "admin" | "super_admin")[]
): Promise<AuthenticatedUser> {
  const user = await getServerSession();
  if (!user) {
    throw new Error("UNAUTHENTICATED: Valid session required.");
  }
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`FORBIDDEN: User role '${user.role}' is not authorized. Required: ${allowedRoles.join(", ")}`);
  }
  return user;
}
