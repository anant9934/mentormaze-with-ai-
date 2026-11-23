export const dynamic = "force-dynamic";
/**
 * MentorMaze Admin Payments Management API
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-auth";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin.errorResponse) return admin.errorResponse;

  try {
    await initializeDatabaseSchema();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = sql`
      SELECT lt.id, lt.booking_id, lt.gross_amount_inr, lt.platform_commission_percent,
             lt.platform_fee_inr, lt.mentor_payable_inr, lt.status, lt.payment_provider,
             lt.provider_order_id, lt.provider_payment_id, lt.refund_amount_inr, lt.refund_reason,
             lt.created_at, lt.settled_at,
             u_student.display_name as student_name, u_student.email as student_email,
             u_mentor.display_name as mentor_name, u_mentor.email as mentor_email
      FROM ledger_transactions lt
      JOIN users u_student ON u_student.id = lt.student_user_id
      JOIN mentor_profiles mp ON mp.id = lt.mentor_profile_id
      JOIN users u_mentor ON u_mentor.id = mp.user_id
    `;

    if (status && status !== "all") {
      query = sql`
        SELECT lt.id, lt.booking_id, lt.gross_amount_inr, lt.platform_commission_percent,
               lt.platform_fee_inr, lt.mentor_payable_inr, lt.status, lt.payment_provider,
               lt.provider_order_id, lt.provider_payment_id, lt.refund_amount_inr, lt.refund_reason,
               lt.created_at, lt.settled_at,
               u_student.display_name as student_name, u_student.email as student_email,
               u_mentor.display_name as mentor_name, u_mentor.email as mentor_email
        FROM ledger_transactions lt
        JOIN users u_student ON u_student.id = lt.student_user_id
        JOIN mentor_profiles mp ON mp.id = lt.mentor_profile_id
        JOIN users u_mentor ON u_mentor.id = mp.user_id
        WHERE lt.status = ${status}
        ORDER BY lt.created_at DESC;
      `;
    } else {
      query = sql`
        SELECT lt.id, lt.booking_id, lt.gross_amount_inr, lt.platform_commission_percent,
               lt.platform_fee_inr, lt.mentor_payable_inr, lt.status, lt.payment_provider,
               lt.provider_order_id, lt.provider_payment_id, lt.refund_amount_inr, lt.refund_reason,
               lt.created_at, lt.settled_at,
               u_student.display_name as student_name, u_student.email as student_email,
               u_mentor.display_name as mentor_name, u_mentor.email as mentor_email
        FROM ledger_transactions lt
        JOIN users u_student ON u_student.id = lt.student_user_id
        JOIN mentor_profiles mp ON mp.id = lt.mentor_profile_id
        JOIN users u_mentor ON u_mentor.id = mp.user_id
        ORDER BY lt.created_at DESC;
      `;
    }

    const result: any = await db.execute(query);
    const transactions = result.rows || result || [];

    // Calculate aggregate totals
    let totalGrossInr = 0;
    let totalPlatformFeeInr = 0;
    let totalMentorPayableInr = 0;
    let totalRefundsInr = 0;

    for (const t of transactions) {
      if (t.status === "settled") {
        totalGrossInr += t.gross_amount_inr;
        totalPlatformFeeInr += t.platform_fee_inr;
        totalMentorPayableInr += t.mentor_payable_inr;
      }
      if (t.refund_amount_inr) {
        totalRefundsInr += t.refund_amount_inr;
      }
    }

    return NextResponse.json({
      success: true,
      transactions,
      totals: {
        totalGrossInr,
        totalPlatformFeeInr,
        totalMentorPayableInr,
        totalRefundsInr,
      },
    });
  } catch (error: any) {
    console.error("[Admin Payments API Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch ledger transactions.", details: error.message },
      { status: 500 }
    );
  }
}
