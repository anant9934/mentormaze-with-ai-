import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server-auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getServerSession();
    return NextResponse.json({
      authenticated: !!user,
      user: user || null,
    });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }
}

