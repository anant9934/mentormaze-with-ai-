/**
 * MentorMaze Admin Settlements API
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Review, batch approval, and disbursement management for mentor payouts.
 */

import { NextRequest, NextResponse } from "next/server";
import { SettlementService } from "@/lib/payments/settlement-service";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    await initializeDatabaseSchema();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    let query = sql`
      SELECT s.id, s.mentor_profile_id, s.period_start, s.period_end,
             s.session_count, s.gross_amount_paise, s.platform_fee_paise,
             s.net_payable_paise, s.status, s.payout_method, s.payout_reference,
             s.approved_at, s.settled_at, s.created_at,
             u.display_name as mentor_name, u.email as mentor_email
      FROM mentor_settlements s
      JOIN mentor_profiles mp ON mp.id = s.mentor_profile_id
      JOIN users u ON u.id = mp.user_id
    `;

    if (statusFilter) {
      query = sql`
        SELECT s.id, s.mentor_profile_id, s.period_start, s.period_end,
               s.session_count, s.gross_amount_paise, s.platform_fee_paise,
               s.net_payable_paise, s.status, s.payout_method, s.payout_reference,
               s.approved_at, s.settled_at, s.created_at,
               u.display_name as mentor_name, u.email as mentor_email
        FROM mentor_settlements s
        JOIN mentor_profiles mp ON mp.id = s.mentor_profile_id
        JOIN users u ON u.id = mp.user_id
        WHERE s.status = ${statusFilter}
        ORDER BY s.created_at DESC;
      `;
    } else {
      query = sql`
        SELECT s.id, s.mentor_profile_id, s.period_start, s.period_end,
               s.session_count, s.gross_amount_paise, s.platform_fee_paise,
               s.net_payable_paise, s.status, s.payout_method, s.payout_reference,
               s.approved_at, s.settled_at, s.created_at,
               u.display_name as mentor_name, u.email as mentor_email
        FROM mentor_settlements s
        JOIN mentor_profiles mp ON mp.id = s.mentor_profile_id
        JOIN users u ON u.id = mp.user_id
        ORDER BY s.created_at DESC;
      `;
    }

    const result: any = await db.execute(query);
    const settlements = result.rows || result || [];

    return NextResponse.json({
      success: true,
      settlements,
    });
  } catch (error: any) {
    console.error("[Admin Settlements API Error]:", error);
    return NextResponse.json(
      { error: "Failed to list settlements.", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await initializeDatabaseSchema();
    const body = await req.json();
    const { action, settlementId, adminUserId = "admin-1", payoutReference, mentorProfileId } = body;

    if (action === "create_settlement") {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const result = await SettlementService.createPendingSettlement(
        mentorProfileId,
        monthStart,
        now
      );
      return NextResponse.json(result);
    }

    if (action === "approve") {
      if (!settlementId) {
        return NextResponse.json({ error: "settlementId required" }, { status: 400 });
      }
      const result = await SettlementService.approveSettlement(settlementId, adminUserId);
      return NextResponse.json(result);
    }

    if (action === "mark_paid") {
      if (!settlementId || !payoutReference) {
        return NextResponse.json(
          { error: "settlementId and payoutReference required" },
          { status: 400 }
        );
      }
      const result = await SettlementService.markSettlementPaid(settlementId, payoutReference);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("[Admin Settlements Action Error]:", error);
    return NextResponse.json(
      { error: "Failed to perform settlement action.", details: error.message },
      { status: 500 }
    );
  }
}
