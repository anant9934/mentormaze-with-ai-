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
  cancellationCutoffHours: number;
  reschedulingCutoffHours: number;
  maxReschedules: number;
  refundEligibilityPercent: number;
  noShowRefundPercent: number;
  isActive: boolean;
}

export const DEFAULT_POLICY: BookingPolicy = {
  id: "policy-v1",
  version: "1.0",
  name: "Standard MentorMaze Policy",
  cancellationCutoffHours: 24,
  reschedulingCutoffHours: 12,
  maxReschedules: 2,
  refundEligibilityPercent: 100,
  noShowRefundPercent: 0,
  isActive: true,
};

export class PolicyEngine {
  /**
   * Fetches active policy by version ID, falling back to DEFAULT_POLICY.
   */
  public static async getPolicy(policyVersionId?: string): Promise<BookingPolicy> {
    await initializeDatabaseSchema();
    const db = getDb();
    const targetId = policyVersionId || "policy-v1";

    try {
      const res: any = await db.execute(sql`
        SELECT id, version, name, cancellation_cutoff_hours, rescheduling_cutoff_hours,
               max_reschedules, refund_eligibility_percent, no_show_refund_percent, is_active
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
          cancellationCutoffHours: row.cancellation_cutoff_hours,
          reschedulingCutoffHours: row.rescheduling_cutoff_hours,
          maxReschedules: row.max_reschedules,
          refundEligibilityPercent: row.refund_eligibility_percent,
          noShowRefundPercent: row.no_show_refund_percent,
          isActive: row.is_active,
        };
      }
    } catch (e) {
      // Fallback
    }

    return DEFAULT_POLICY;
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
