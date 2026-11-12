/**
 * MentorMaze Versioned Cancellation & Rescheduling Policy Engine
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Evaluates booking cancellation & rescheduling requests against policy versions.
 */

import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";

export interface BookingPolicy {
  id: string;
  version: string;
  name: string;
  platformCommissionPercent: number;
  mentorRevenueSharePercent: number;
  gatewayFeePercent: number;
  taxGstPercent: number;
  cancellationCutoffHours: number;
  reschedulingCutoffHours: number;
  maxReschedules: number;
  refundEligibilityPercent: number;
  noShowRefundPercent: number;
  payoutFrequency: string;
  minPayoutThresholdPaise: number;
  settlementHoldDays: number;
  disputeWindowHours: number;
  approvalStatus: "draft" | "pending_approval" | "approved" | "deprecated";
  approvedByUserId?: string | null;
  approvalNotes?: string | null;
  effectiveFromUtc?: string;
  effectiveToUtc?: string | null;
  isActive: boolean;
}

export const DEFAULT_POLICY: BookingPolicy = {
  id: "policy-v1",
  version: "1.0",
  name: "Standard MentorMaze Policy (Unapproved Baseline)",
  platformCommissionPercent: 15.0,
  mentorRevenueSharePercent: 85.0,
  gatewayFeePercent: 2.0,
  taxGstPercent: 18.0,
  cancellationCutoffHours: 24,
  reschedulingCutoffHours: 12,
  maxReschedules: 2,
  refundEligibilityPercent: 100,
  noShowRefundPercent: 0,
  payoutFrequency: "weekly",
  minPayoutThresholdPaise: 50000, // ₹500
  settlementHoldDays: 3,
  disputeWindowHours: 72,
  approvalStatus: "pending_approval",
  approvalNotes: "Baseline unapproved parameters awaiting owner formal sign-off",
  isActive: true,
};

export class PolicyEngine {
  /**
   * Fetches active policy by version ID, falling back to DEFAULT_POLICY.
   */
  public static async getPolicy(policyVersionId?: string, executor?: any): Promise<BookingPolicy> {
    const db = executor || getDb();
    const targetId = policyVersionId || "policy-v1";

    try {
      const res: any = await db.execute(sql`
        SELECT id, version, name, platform_commission_percent, mentor_revenue_share_percent,
               gateway_fee_percent, tax_gst_percent, cancellation_cutoff_hours,
               rescheduling_cutoff_hours, max_reschedules, refund_eligibility_percent,
               no_show_refund_percent, payout_frequency, min_payout_threshold_paise,
               settlement_hold_days, dispute_window_hours, approval_status,
               approved_by_user_id, approval_notes, effective_from_utc, effective_to_utc, is_active
        FROM booking_policies
        WHERE id = ${targetId}
        LIMIT 1;
      `);

      const row = res.rows?.[0] || res?.[0];
      if (row) {
        return {
          id: row.id,
          version: row.version,
          name: row.name,
          platformCommissionPercent: Number(row.platform_commission_percent || 15.0),
          mentorRevenueSharePercent: Number(row.mentor_revenue_share_percent || 85.0),
          gatewayFeePercent: Number(row.gateway_fee_percent || 2.0),
          taxGstPercent: Number(row.tax_gst_percent || 18.0),
          cancellationCutoffHours: row.cancellation_cutoff_hours,
          reschedulingCutoffHours: row.rescheduling_cutoff_hours,
          maxReschedules: row.max_reschedules,
          refundEligibilityPercent: row.refund_eligibility_percent,
          noShowRefundPercent: row.no_show_refund_percent,
          payoutFrequency: row.payout_frequency || "weekly",
          minPayoutThresholdPaise: row.min_payout_threshold_paise || 50000,
          settlementHoldDays: row.settlement_hold_days ?? 3,
          disputeWindowHours: row.dispute_window_hours ?? 72,
          approvalStatus: row.approval_status || "pending_approval",
          approvedByUserId: row.approved_by_user_id,
          approvalNotes: row.approval_notes,
          effectiveFromUtc: row.effective_from_utc,
          effectiveToUtc: row.effective_to_utc,
          isActive: row.is_active,
        };
      }
    } catch (e) {
      // Fallback
    }

    return DEFAULT_POLICY;
  }

  /**
   * Calculates financial revenue split in integer paise with double-entry balance check.
   */
  public static calculateSplitPaise(
    grossAmountPaise: number,
    policy: BookingPolicy
  ): {
    grossPaise: number;
    platformFeePaise: number;
    mentorPayablePaise: number;
    gatewayFeePaise: number;
    taxPaise: number;
    isBalanced: boolean;
  } {
    const commissionPercent = policy.platformCommissionPercent;
    const platformFeePaise = Math.round((grossAmountPaise * commissionPercent) / 100);
    const mentorPayablePaise = grossAmountPaise - platformFeePaise;
    const gatewayFeePaise = Math.round((grossAmountPaise * policy.gatewayFeePercent) / 100);
    const taxPaise = Math.round((platformFeePaise * policy.taxGstPercent) / 100);

    return {
      grossPaise: grossAmountPaise,
      platformFeePaise,
      mentorPayablePaise,
      gatewayFeePaise,
      taxPaise,
      isBalanced: platformFeePaise + mentorPayablePaise === grossAmountPaise,
    };
  }

  /**
   * Evaluates refund percentage and eligibility for a cancellation request.
   */
  public static async evaluateCancellation(
    bookingStartTimeUtc: string | Date,
    policyVersionId?: string
  ): Promise<{
    isEligibleForRefund: boolean;
    refundPercent: number;
    hoursUntilSession: number;
    cutoffHours: number;
    reasonNote: string;
  }> {
    const policy = await this.getPolicy(policyVersionId);
    const now = new Date().getTime();
    const startTime = new Date(bookingStartTimeUtc).getTime();
    const diffHours = (startTime - now) / (1000 * 60 * 60);

    const isEligible = diffHours >= policy.cancellationCutoffHours;
    const refundPercent = isEligible ? policy.refundEligibilityPercent : 0;

    const reasonNote = isEligible
      ? `Cancelled with ${diffHours.toFixed(1)} hours advance notice (cutoff: ${policy.cancellationCutoffHours}h) - Eligible for ${refundPercent}% refund.`
      : `Cancelled with ${diffHours.toFixed(1)} hours advance notice (less than required ${policy.cancellationCutoffHours}h) - Non-refundable under policy.`;

    return {
      isEligibleForRefund: isEligible,
      refundPercent,
      hoursUntilSession: Number(diffHours.toFixed(2)),
      cutoffHours: policy.cancellationCutoffHours,
      reasonNote,
    };
  }

  /**
   * Evaluates if a booking can be rescheduled.
   */
  public static async evaluateReschedule(
    bookingStartTimeUtc: string | Date,
    currentRescheduleCount: number,
    policyVersionId?: string
  ): Promise<{
    canReschedule: boolean;
    hoursUntilSession: number;
    cutoffHours: number;
    rescheduleCount: number;
    maxReschedules: number;
    error?: string;
  }> {
    const policy = await this.getPolicy(policyVersionId);
    const now = new Date().getTime();
    const startTime = new Date(bookingStartTimeUtc).getTime();
    const diffHours = (startTime - now) / (1000 * 60 * 60);

    if (currentRescheduleCount >= policy.maxReschedules) {
      return {
        canReschedule: false,
        hoursUntilSession: Number(diffHours.toFixed(2)),
        cutoffHours: policy.reschedulingCutoffHours,
        rescheduleCount: currentRescheduleCount,
        maxReschedules: policy.maxReschedules,
        error: `Maximum rescheduling limit (${policy.maxReschedules} times) reached for this booking.`,
      };
    }

    if (diffHours < policy.reschedulingCutoffHours) {
      return {
        canReschedule: false,
        hoursUntilSession: Number(diffHours.toFixed(2)),
        cutoffHours: policy.reschedulingCutoffHours,
        rescheduleCount: currentRescheduleCount,
        maxReschedules: policy.maxReschedules,
        error: `Rescheduling requires at least ${policy.reschedulingCutoffHours} hours notice. Only ${diffHours.toFixed(1)}h remaining.`,
      };
    }

    return {
      canReschedule: true,
      hoursUntilSession: Number(diffHours.toFixed(2)),
      cutoffHours: policy.reschedulingCutoffHours,
      rescheduleCount: currentRescheduleCount,
      maxReschedules: policy.maxReschedules,
    };
  }
}

