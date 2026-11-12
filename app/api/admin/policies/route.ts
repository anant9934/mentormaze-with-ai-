/**
 * MentorMaze Versioned Financial & Booking Policy Management API
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Enforces audit logging for policy modifications, effective dates,
 * and tracks approval status (draft, pending_approval, approved, deprecated).
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    await initializeDatabaseSchema();
    const db = getDb();

    const policiesQuery: any = await db.execute(sql`
      SELECT 
        bp.*,
        u.display_name as approved_by_name
      FROM booking_policies bp
      LEFT JOIN users u ON u.id = bp.approved_by_user_id
      ORDER BY bp.created_at DESC;
    `);

    const auditLogsQuery: any = await db.execute(sql`
      SELECT 
        pal.*,
        u.display_name as changed_by_name
      FROM policy_audit_logs pal
      LEFT JOIN users u ON u.id = pal.changed_by_user_id
      ORDER BY pal.created_at DESC
      LIMIT 50;
    `);

    return NextResponse.json({
      success: true,
      policies: policiesQuery.rows || policiesQuery || [],
      auditLogs: auditLogsQuery.rows || auditLogsQuery || [],
    });
  } catch (err: any) {
    console.error("[Policy API GET Error]:", err);
    return NextResponse.json(
      { error: "Failed to fetch policies", message: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await initializeDatabaseSchema();
    const db = getDb();
    const body = await req.json();

    const {
      id,
      version,
      name,
      platformCommissionPercent = 15.0,
      mentorRevenueSharePercent = 85.0,
      gatewayFeePercent = 2.0,
      taxGstPercent = 18.0,
      cancellationCutoffHours = 24,
      reschedulingCutoffHours = 12,
      maxReschedules = 2,
      refundEligibilityPercent = 100,
      noShowRefundPercent = 0,
      payoutFrequency = "weekly",
      minPayoutThresholdPaise = 50000,
      settlementHoldDays = 3,
      disputeWindowHours = 72,
      effectiveFromUtc = new Date().toISOString(),
      approvalNotes,
      changedByUserId,
      reason = "Created new versioned policy",
    } = body;

    if (!id || !version || !name) {
      return NextResponse.json(
        { error: "id, version, and name are required fields" },
        { status: 400 }
      );
    }

    // Insert new policy in 'draft' or 'pending_approval'
    const insertResult: any = await db.execute(sql`
      INSERT INTO booking_policies (
        id, version, name, platform_commission_percent, mentor_revenue_share_percent,
        gateway_fee_percent, tax_gst_percent, cancellation_cutoff_hours,
        rescheduling_cutoff_hours, max_reschedules, refund_eligibility_percent,
        no_show_refund_percent, payout_frequency, min_payout_threshold_paise,
        settlement_hold_days, dispute_window_hours, effective_from_utc,
        approval_status, approval_notes, is_active
      ) VALUES (
        ${id}, ${version}, ${name}, ${platformCommissionPercent}, ${mentorRevenueSharePercent},
        ${gatewayFeePercent}, ${taxGstPercent}, ${cancellationCutoffHours},
        ${reschedulingCutoffHours}, ${maxReschedules}, ${refundEligibilityPercent},
        ${noShowRefundPercent}, ${payoutFrequency}, ${minPayoutThresholdPaise},
        ${settlementHoldDays}, ${disputeWindowHours}, ${effectiveFromUtc},
        'pending_approval', ${approvalNotes || 'Pending formal review'}, true
      )
      RETURNING *;
    `);

    const newPolicy = insertResult.rows?.[0] || insertResult?.[0];

    // Audit log
    await db.execute(sql`
      INSERT INTO policy_audit_logs (
        policy_id, changed_by_user_id, action, new_state, reason
      ) VALUES (
        ${id}, ${changedByUserId || null}, 'created', ${JSON.stringify(newPolicy)}, ${reason}
      );
    `);

    return NextResponse.json({ success: true, policy: newPolicy });
  } catch (err: any) {
    console.error("[Policy API POST Error]:", err);
    return NextResponse.json(
      { error: "Failed to create policy", message: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await initializeDatabaseSchema();
    const db = getDb();
    const body = await req.json();

    const { policyId, action, adminUserId, reason, notes } = body;

    if (!policyId || !action) {
      return NextResponse.json({ error: "policyId and action are required" }, { status: 400 });
    }

    // Fetch existing
    const existingQ: any = await db.execute(sql`
      SELECT * FROM booking_policies WHERE id = ${policyId} LIMIT 1;
    `);
    const existing = existingQ.rows?.[0] || existingQ?.[0];
    if (!existing) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    let targetStatus = existing.approval_status;
    let isActive = existing.is_active;

    if (action === "approve") {
      targetStatus = "approved";
      isActive = true;
    } else if (action === "deprecate") {
      targetStatus = "deprecated";
      isActive = false;
    }

    await db.execute(sql`
      UPDATE booking_policies
      SET approval_status = ${targetStatus},
          approved_by_user_id = ${adminUserId || null},
          approval_notes = COALESCE(${notes || null}, approval_notes),
          is_active = ${isActive}
      WHERE id = ${policyId};
    `);

    // Audit log
    await db.execute(sql`
      INSERT INTO policy_audit_logs (
        policy_id, changed_by_user_id, action, previous_state, new_state, reason
      ) VALUES (
        ${policyId}, ${adminUserId || null}, ${action},
        ${JSON.stringify(existing)},
        ${JSON.stringify({ ...existing, approval_status: targetStatus, is_active: isActive })},
        ${reason || `Admin executed ${action}`}
      );
    `);

    return NextResponse.json({
      success: true,
      policyId,
      approvalStatus: targetStatus,
      isActive
    });
  } catch (err: any) {
    console.error("[Policy API PATCH Error]:", err);
    return NextResponse.json(
      { error: "Failed to update policy", message: err.message },
      { status: 500 }
    );
  }
}
