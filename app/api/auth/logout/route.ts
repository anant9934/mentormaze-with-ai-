import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get("mm_session_token")?.value;

    if (sessionToken) {
      const db = getDb();
      await db.execute(sql`
        DELETE FROM user_sessions WHERE token = ${sessionToken};
      `);
    }

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });
    
    // Clear cookie
    response.cookies.delete("mm_session_token");
    return response;
  } catch (err: any) {
    console.error("Logout route error:", err);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
