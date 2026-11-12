import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get("mm_session_token")?.value;

    if (sessionToken) {
      const crypto = await import("crypto");
      const tokenHash = crypto.createHash("sha256").update(sessionToken).digest("hex");
      const db = getDb();
      await db.execute(sql`
        DELETE FROM user_sessions WHERE token = ${tokenHash} OR token = ${sessionToken};
      `);
    }

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });
    
    // Clear session cookie
    response.cookies.set("mm_session_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      path: "/",
    });
    return response;
  } catch (err: any) {
    console.error("Logout route error:", err);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}

