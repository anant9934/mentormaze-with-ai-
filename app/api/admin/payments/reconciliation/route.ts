/**
 * MentorMaze Financial Ledger Reconciliation Engine
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Provides real-time double-entry verification (Debits == Credits),
 * GMV vs Take-rate reconciliation, mentor payable balances, and payout audits.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    await initializeDatabaseSchema();
    const db = getDb();

    // 1. Double-Entry Journal Balance Check
    const journalSummary: any = await db.execute(sql`
      SELECT 
        entry_type,
        COUNT(*)::int as count,
        COALESCE(SUM(amount_paise), 0)::bigint as total_paise
      FROM journal_entries
      GROUP BY entry_type;
    `);

    let totalDebitsPaise = 0;
    let totalCreditsPaise = 0;
    const rows = journalSummary.rows || journalSummary || [];
    for (const r of rows) {
      if (r.entry_type === "debit") {
        totalDebitsPaise = Number(r.total_paise);
      } else if (r.entry_type === "credit") {
        totalCreditsPaise = Number(r.total_paise);
      }
    }

    const isDoubleEntryBalanced = totalDebitsPaise === totalCreditsPaise;
    const variancePaise = totalDebitsPaise - totalCreditsPaise;

    // 2. Account Breakdown
    const accountBreakdown: any = await db.execute(sql`
      SELECT 
        account,
        entry_type,
        COUNT(*)::int as entry_count,
        COALESCE(SUM(amount_paise), 0)::bigint as total_paise
      FROM journal_entries
      GROUP BY account, entry_type
      ORDER BY account, entry_type;
    `);

    // 3. Transactions Summary by Type
    const txSummary: any = await db.execute(sql`
      SELECT 
        COALESCE(transaction_type, 'payment') as transaction_type,
        COUNT(*)::int as count,
        COALESCE(SUM(gross_amount_paise), 0)::bigint as gross_paise,
        COALESCE(SUM(platform_fee_paise), 0)::bigint as platform_fee_paise,
        COALESCE(SUM(mentor_payable_paise), 0)::bigint as mentor_payable_paise
      FROM ledger_transactions
      GROUP BY transaction_type;
    `);

    // 4. Mentor Settlements Summary
    const settlementSummary: any = await db.execute(sql`
      SELECT 
        status,
        COUNT(*)::int as batch_count,
        COALESCE(SUM(net_payable_paise), 0)::bigint as total_payout_paise
      FROM mentor_settlements
      GROUP BY status;
    `);

    // 5. Booking Financial Status Summary
    const bookingFinancialSummary: any = await db.execute(sql`
      SELECT 
        payment_status,
        COUNT(*)::int as count,
        COALESCE(SUM(amount_paise), 0)::bigint as total_paise
      FROM bookings
      GROUP BY payment_status;
    `);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      reconciliation: {
        doubleEntryAudit: {
          isBalanced: isDoubleEntryBalanced,
          totalDebitsPaise,
          totalCreditsPaise,
          variancePaise,
          totalDebitsInr: (totalDebitsPaise / 100).toFixed(2),
          totalCreditsInr: (totalCreditsPaise / 100).toFixed(2),
          verdict: isDoubleEntryBalanced ? "BALANCED" : "DISCREPANCY_DETECTED"
        },
        accounts: accountBreakdown.rows || accountBreakdown || [],
        transactionsByType: txSummary.rows || txSummary || [],
        settlementBatches: settlementSummary.rows || settlementSummary || [],
        bookingsByPaymentStatus: bookingFinancialSummary.rows || bookingFinancialSummary || [],
      }
    });
  } catch (err: any) {
    console.error("[Reconciliation Error]:", err);
    return NextResponse.json(
      { error: "Failed to generate reconciliation report", message: err.message },
      { status: 500 }
    );
  }
}

