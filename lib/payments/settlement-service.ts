/**
 * MentorMaze Mentor Settlement Service
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Provides double-entry accounting in integer paise (minor units),
 * settlement cycle generation, admin review/approval, and disbursement tracking.
 */

import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import { paymentGateway } from "./adapter";

export interface SettlementSummary {
  mentorProfileId: string;
  totalSessions: number;
  grossAmountPaise: number;
  platformFeePaise: number;
  netPayablePaise: number;
  pendingPayoutPaise: number;
  settledPayoutPaise: number;
  settlements: any[];
  transactions: any[];
}

export class SettlementService {
  /**
   * Calculates real-time earnings breakdown for a mentor in integer paise.
   */
  public static async getMentorEarningsSummary(mentorProfileId: string): Promise<SettlementSummary> {
    await initializeDatabaseSchema();
    const db = getDb();

    // 1. Fetch all settled ledger transactions for this mentor
    const txQuery: any = await db.execute(sql`
      SELECT lt.id, lt.booking_id, lt.gross_amount_inr, lt.platform_commission_percent,
             lt.platform_fee_inr, lt.mentor_payable_inr, lt.status, lt.created_at, lt.settled_at,
             b.service_type, b.start_time_utc, b.status as booking_status,
             u.display_name as student_name
      FROM ledger_transactions lt
      JOIN bookings b ON b.id = lt.booking_id
      JOIN users u ON u.id = lt.student_user_id
      WHERE lt.mentor_profile_id = ${mentorProfileId}
      ORDER BY lt.created_at DESC;
    `);

    const rawTransactions = txQuery.rows || txQuery || [];

    let totalGrossPaise = 0;
    let totalPlatformFeePaise = 0;
    let netEarningsPaise = 0;
    let pendingPayoutPaise = 0;
    let settledPayoutPaise = 0;
    let totalSessions = 0;

    const transactions = rawTransactions.map((tx: any) => {
      const grossPaise = tx.gross_amount_inr * 100;
      const feePaise = tx.platform_fee_inr * 100;
      const payablePaise = tx.mentor_payable_inr * 100;

      if (tx.status === "settled" && tx.booking_status !== "cancelled") {
        totalGrossPaise += grossPaise;
        totalPlatformFeePaise += feePaise;
        netEarningsPaise += payablePaise;
        totalSessions += 1;
      }

      return {
        id: tx.id,
        bookingId: tx.booking_id,
        studentName: tx.student_name || "Student",
        serviceType: tx.service_type,
        startTimeUtc: tx.start_time_utc,
        grossPaise,
        platformFeePaise: feePaise,
        mentorPayablePaise: payablePaise,
        status: tx.status,
        createdAt: tx.created_at,
        settledAt: tx.settled_at,
      };
    });

    // 2. Fetch past and pending mentor settlements
    const settlementQuery: any = await db.execute(sql`
      SELECT id, period_start, period_end, session_count, gross_amount_paise,
             platform_fee_paise, net_payable_paise, status, payout_method,
             payout_reference, approved_at, settled_at, created_at
      FROM mentor_settlements
      WHERE mentor_profile_id = ${mentorProfileId}
      ORDER BY created_at DESC;
    `);

    const settlements = settlementQuery.rows || settlementQuery || [];

    for (const s of settlements) {
      if (s.status === "settled" || s.status === "manually_recorded") {
        settledPayoutPaise += s.net_payable_paise;
      }
    }

    pendingPayoutPaise = Math.max(0, netEarningsPaise - settledPayoutPaise);

    return {
      mentorProfileId,
      totalSessions,
      grossAmountPaise: totalGrossPaise,
      platformFeePaise: totalPlatformFeePaise,
      netPayablePaise: netEarningsPaise,
      pendingPayoutPaise,
      settledPayoutPaise,
      settlements,
      transactions,
    };
  }

  /**
   * Generates a pending settlement invoice for a mentor's unpaid balance.
   */
  public static async createPendingSettlement(
    mentorProfileId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<{ success: boolean; settlement?: any; error?: string }> {
    await initializeDatabaseSchema();
    const db = getDb();

    const summary = await this.getMentorEarningsSummary(mentorProfileId);
    if (summary.pendingPayoutPaise <= 0) {
      return { success: false, error: "No pending earnings available for settlement." };
    }

    const insertResult: any = await db.execute(sql`
      INSERT INTO mentor_settlements (
        mentor_profile_id,
        period_start,
        period_end,
        session_count,
        gross_amount_paise,
        platform_fee_paise,
        net_payable_paise,
        status,
        payout_method
      ) VALUES (
        ${mentorProfileId},
        ${periodStart},
        ${periodEnd},
        ${summary.totalSessions},
        ${summary.grossAmountPaise},
        ${summary.platformFeePaise},
        ${summary.pendingPayoutPaise},
        'pending',
        'manual_bank_transfer'
      )
      RETURNING *;
    `);

    const settlement = insertResult.rows?.[0] || insertResult?.[0];
    return { success: true, settlement };
  }

  /**
   * Approves a settlement batch by an administrator.
   */
  public static async approveSettlement(
    settlementId: string,
    adminUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    await initializeDatabaseSchema();
    const db = getDb();

    await db.execute(sql`
      UPDATE mentor_settlements
      SET status = 'approved',
          approved_by_user_id = ${adminUserId},
          approved_at = now()
      WHERE id = ${settlementId}
        AND status = 'pending';
    `);

    return { success: true };
  }

  /**
   * Finalizes and marks a settlement as settled with a payout transaction reference.
   * Accurately labels status as 'manually_recorded' and records balancing journal entries.
   */
  public static async markSettlementPaid(
    settlementId: string,
    payoutReference: string
  ): Promise<{ success: boolean; error?: string }> {
    await initializeDatabaseSchema();
    const db = getDb();

    return await db.transaction(async (tx: any) => {
      const q: any = await tx.execute(sql`
        SELECT id, mentor_profile_id, net_payable_paise, status
        FROM mentor_settlements
        WHERE id = ${settlementId}
        FOR UPDATE;
      `);

      const batch = q.rows?.[0] || q?.[0];
      if (!batch) {
        return { success: false, error: "Settlement batch not found." };
      }

      await tx.execute(sql`
        UPDATE mentor_settlements
        SET status = 'manually_recorded',
            payout_reference = ${payoutReference},
            settled_at = now()
        WHERE id = ${settlementId}
          AND status IN ('pending', 'approved');
      `);

      // Double-entry disbursement journal entries:
      // Debit: mentor_payable (reduces liability to mentor)
      await tx.execute(sql`
        INSERT INTO journal_entries (
          entry_type, account, amount_paise, currency, description
        ) VALUES (
          'debit', 'mentor_payable', ${batch.net_payable_paise}, 'INR', ${`Manual disbursement recorded with UTR ${payoutReference}`}
        );
      `);

      // Credit: cash_bank (reduces bank cash account)
      await tx.execute(sql`
        INSERT INTO journal_entries (
          entry_type, account, amount_paise, currency, description
        ) VALUES (
          'credit', 'cash_bank', ${batch.net_payable_paise}, 'INR', ${`Manual bank transfer executed: UTR ${payoutReference}`}
        );
      `);

      return { success: true };
    });
  }
}
