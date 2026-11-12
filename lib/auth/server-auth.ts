import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  role: "student" | "mentor" | "admin" | "super_admin";
  avatarUrl?: string;
  timezone: string;
}

/**
 * Validates the session cookie against the PostgreSQL user_sessions table.
 * Enforces true server-side authentication with session expiration checks.
 */
export async function getServerSession(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("mm_session_token")?.value;

    if (!sessionToken) {
      return null;
    }

    const db = getDb();
    const queryResult: any = await db.execute(sql`
      SELECT 
        u.id, 
        u.email, 
        u.display_name, 
        u.role, 
        u.avatar_url, 
        u.timezone,
        s.expires_at
      FROM user_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = ${sessionToken}
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
    };
  } catch (err) {
    console.error("Error verifying server session:", err);
    return null;
  }
}

/**
 * Enforces server-side Role-Based Access Control (RBAC).
 * Throws an error or returns null if the session user does not hold an authorized role.
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
