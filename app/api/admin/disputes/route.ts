export const dynamic = "force-dynamic";
/**
 * MentorMaze Admin Disputes Management API
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-auth";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import { BookingStateMachine } from "@/lib/db/booking-state-machine";
import { paymentGateway } from "@/lib/payments/adapter";
import { notificationService } from "@/lib/notifications/service";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin.errorResponse) return admin.errorResponse;

  try {
    await initializeDatabaseSchema();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = sql`
      SELECT d.id, d.booking_id, d.reason, d.student_explanation, d.mentor_response,
             d.evidence_urls, d.status, d.resolution_notes, d.refund_amount_paise,
             d.resolved_at, d.created_at,
             u_student.display_name as student_name, u_student.email as student_email,
             u_mentor.display_name as mentor_name, u_mentor.email as mentor_email,
             b.price_inr, b.service_type, b.start_time_utc
      FROM disputes d
      JOIN bookings b ON b.id = d.booking_id
      JOIN users u_student ON u_student.id = d.student_user_id
      JOIN mentor_profiles mp ON mp.id = d.mentor_profile_id
      JOIN users u_mentor ON u_mentor.id = mp.user_id
    `;

    if (status && status !== "all") {
      query = sql`
        SELECT d.id, d.booking_id, d.reason, d.student_explanation, d.mentor_response,
               d.evidence_urls, d.status, d.resolution_notes, d.refund_amount_paise,
               d.resolved_at, d.created_at,
               u_student.display_name as student_name, u_student.email as student_email,
               u_mentor.display_name as mentor_name, u_mentor.email as mentor_email,
               b.price_inr, b.service_type, b.start_time_utc
        FROM disputes d
        JOIN bookings b ON b.id = d.booking_id
        JOIN users u_student ON u_student.id = d.student_user_id
        JOIN mentor_profiles mp ON mp.id = d.mentor_profile_id
        JOIN users u_mentor ON u_mentor.id = mp.user_id
        WHERE d.status = ${status}
        ORDER BY d.created_at DESC;
      `;
    } else {
      query = sql`
        SELECT d.id, d.booking_id, d.reason, d.student_explanation, d.mentor_response,
               d.evidence_urls, d.status, d.resolution_notes, d.refund_amount_paise,
               d.resolved_at, d.created_at,
               u_student.display_name as student_name, u_student.email as student_email,
               u_mentor.display_name as mentor_name, u_mentor.email as mentor_email,
               b.price_inr, b.service_type, b.start_time_utc
        FROM disputes d
        JOIN bookings b ON b.id = d.booking_id
        JOIN users u_student ON u_student.id = d.student_user_id
        JOIN mentor_profiles mp ON mp.id = d.mentor_profile_id
        JOIN users u_mentor ON u_mentor.id = mp.user_id
        ORDER BY d.created_at DESC;
      `;
    }

    const result: any = await db.execute(query);
    const disputes = result.rows || result || [];

    return NextResponse.json({
      success: true,
      disputes,
    });
  } catch (error: any) {
    console.error("[Admin Disputes API Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch disputes.", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin.errorResponse) return admin.errorResponse;

  try {
    await initializeDatabaseSchema();
    const body = await req.json();
    const { action, disputeId, resolutionNotes, resolutionType, adminUserId = "admin-1" } = body;

    const db = getDb();

    if (action === "resolve") {
      const disputeQuery: any = await db.execute(sql`
        SELECT d.*, b.price_inr, b.student_user_id, mp.user_id as mentor_user_id
        FROM disputes d
        JOIN bookings b ON b.id = d.booking_id
        JOIN mentor_profiles mp ON mp.id = d.mentor_profile_id
        WHERE d.id = ${disputeId}
        LIMIT 1;
      `);

      const dispute = disputeQuery.rows?.[0] || disputeQuery?.[0];
      if (!dispute) {
        return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
      }

      if (resolutionType === "refund") {
        // Issue full refund
        const refundPaise = dispute.price_inr * 100;
        await paymentGateway.createRefund({
          orderId: `order_cf_${dispute.booking_id}`,
          refundAmount: dispute.price_inr,
          refundReason: `Dispute resolved in student's favor: ${resolutionNotes}`,
        });

        await db.execute(sql`
          UPDATE disputes
          SET status = 'resolved_refund',
              resolution_notes = ${resolutionNotes},
              refund_amount_paise = ${refundPaise},
              resolved_by_user_id = ${adminUserId},
              resolved_at = now(),
              updated_at = now()
          WHERE id = ${disputeId};
        `);

        await BookingStateMachine.transition(dispute.booking_id, "cancelled", {
          actorId: adminUserId,
          actorRole: "admin",
          reason: `Dispute resolved with refund: ${resolutionNotes}`,
        });

        await notificationService.dispatch({
          userId: dispute.student_user_id,
          title: "Dispute Resolved in Your Favor",
          message: `Your dispute for session #${dispute.booking_id.slice(0, 8)} was upheld. A 100% refund of ₹${dispute.price_inr} has been processed.`,
          category: "payments",
          priority: "high",
          actionUrl: "/dashboard/sessions",
          actionLabel: "View Receipt",
        });
      } else {
        // Reject dispute claim
        await db.execute(sql`
          UPDATE disputes
          SET status = 'resolved_rejected',
              resolution_notes = ${resolutionNotes},
              resolved_by_user_id = ${adminUserId},
              resolved_at = now(),
              updated_at = now()
          WHERE id = ${disputeId};
        `);

        await BookingStateMachine.transition(dispute.booking_id, "completed", {
          actorId: adminUserId,
          actorRole: "admin",
          reason: `Dispute claim reviewed and dismissed: ${resolutionNotes}`,
        });

        await notificationService.dispatch({
          userId: dispute.student_user_id,
          title: "Dispute Review Concluded",
          message: `Your dispute claim for session #${dispute.booking_id.slice(0, 8)} was reviewed and resolved without refund: ${resolutionNotes}.`,
          category: "bookings",
          priority: "normal",
          actionUrl: "/dashboard/sessions",
          actionLabel: "View Details",
        });
      }

      return NextResponse.json({ success: true, disputeId, resolutionType });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("[Dispute Resolution Action Error]:", error);
    return NextResponse.json(
      { error: "Failed to resolve dispute.", details: error.message },
      { status: 500 }
    );
  }
}
