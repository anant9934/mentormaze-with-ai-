/**
 * MentorMaze Mentor Earnings API
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 */

import { NextRequest, NextResponse } from "next/server";
import { SettlementService } from "@/lib/payments/settlement-service";
import { resolveMentorProfileId } from "@/lib/calendar/types";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    await initializeDatabaseSchema();
    const { searchParams } = new URL(req.url);
    let mentorProfileId = searchParams.get("mentorProfileId") || "mentor-1";
    mentorProfileId = resolveMentorProfileId(mentorProfileId);

    const summary = await SettlementService.getMentorEarningsSummary(mentorProfileId);

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error("[Mentor Earnings API Error]:", error);
    return NextResponse.json(
      { error: "Failed to load mentor earnings.", details: error.message },
      { status: 500 }
    );
  }
}
