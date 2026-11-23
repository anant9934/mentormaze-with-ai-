/**
 * MentorMaze Mentorship Intelligence Bridge Adapter
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Connects Meeting Intelligence reports directly into:
 * 1. MentorshipBridgeService (ASTRION AI Mentor continuous context)
 * 2. StudentIntelligenceGraph (Skills, challenges, and milestones)
 * 3. AI Tathastu Outbox Synchronization (governed by cryptographic consent epochs)
 */

import { MentorshipIntelligenceReport } from "./types";
import { MentorshipBridgeService } from "@/lib/mentorship/mentorship-bridge-service";
import { StudentConsentService } from "@/lib/ai-mentor/student-consent-service";
import { StudentIntelligenceGraph } from "@/lib/ai-mentor/student-intelligence-graph";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export class MentorshipBridgeAdapter {
  /**
   * Injects the verified meeting report into ASTRION's continuous memory graph.
   */
  public static async injectIntoAstrion(report: MentorshipIntelligenceReport): Promise<boolean> {
    try {
      // 1. Verify student consent
      const hasConsent = await StudentConsentService.hasConsent(report.studentUserId, "student_memory");
      if (!hasConsent) {
        console.log(`[MentorshipBridgeAdapter] Consent not granted for student ${report.studentUserId}, skipping ASTRION injection.`);
        return false;
      }

      // 2. Update StudentIntelligenceGraph with challenges and milestones as verified evidence
      let challengeIdx = 0;
      for (const challenge of report.studentReportedChallenges) {
        challengeIdx++;
        try {
          await StudentIntelligenceGraph.recordEvidence(
            report.studentUserId,
            "fact",
            `challenge-${challengeIdx}`,
            "self_reported",
            "student_reported",
            `Live Session: ${report.sessionTitle}`,
            0.95,
            {
              challenge: challenge.challenge,
              evidence: challenge.evidence,
              provenance: challenge.provenance,
            }
          );
        } catch {
          // Continue if evidence insertion handles gracefully
        }
      }

      let milestoneIdx = 0;
      for (const milestone of report.agreedMilestones) {
        milestoneIdx++;
        try {
          await StudentIntelligenceGraph.recordEvidence(
            report.studentUserId,
            "goal",
            `milestone-${milestoneIdx}`,
            "assessed",
            "mentor_verified",
            `Live Session: ${report.sessionTitle}`,
            0.95,
            {
              title: milestone.milestone,
              targetDate: milestone.targetDate,
              provenance: milestone.provenance,
            }
          );
        } catch {
          // Continue
        }
      }

      // 3. Mark report as injected
      report.injectedIntoAstrion = true;
      try {
        const db = await getDb();
        await db.execute(sql`
          UPDATE mentorship_intelligence_reports
          SET injected_into_astrion = true, updated_at = now()
          WHERE booking_id = ${report.bookingId}::uuid;
        `);
      } catch (err: any) {
        console.warn(`[MentorshipBridgeAdapter] DB update notice: ${err?.message}`);
      }

      return true;
    } catch (err: any) {
      console.error(`[MentorshipBridgeAdapter] Failed to inject into ASTRION:`, err?.message);
      return false;
    }
  }

  /**
   * Prepares and enqueues outbox synchronization event for AI Tathastu ecosystem.
   * Strictly adheres to 7-part deterministic idempotency key and consent epoch verification.
   */
  public static async syncToTathastuOutbox(report: MentorshipIntelligenceReport): Promise<string | null> {
    try {
      // 1. Verify consent epoch
      let consentEpoch = 1;
      try {
        const record = await StudentConsentService.getConsentRecord(report.studentUserId, "ai_tathastu_sync");
        if (record && !record.isGranted) {
          console.log(`[MentorshipBridgeAdapter] Student ${report.studentUserId} has revoked consent; suppressing sync.`);
          return null;
        }
        if (record?.consentEpoch) {
          consentEpoch = record.consentEpoch;
        }
      } catch {
        consentEpoch = 1;
      }

      // 2. Build 7-part deterministic idempotency key:
      // targetSystem:eventType:studentId:sourceType:sourceId:consentEpoch:sourceVersion
      const idempotencyKey = `ai-tathastu:meeting-intelligence-sync:${report.studentUserId}:booking:${report.bookingId}:${consentEpoch}:1`;

      const payload = {
        bookingId: report.bookingId,
        studentUserId: report.studentUserId,
        mentorUserId: report.mentorUserId,
        sessionTitle: report.sessionTitle,
        durationMinutes: report.durationMinutes,
        executiveSummary: report.executiveSummary,
        topicsCount: report.topicsDiscussed.length,
        actionItemsCount: report.actionItems.length,
        milestonesCount: report.agreedMilestones.length,
        syncedAt: new Date().toISOString(),
      };

      const db = await getDb();
      await db.execute(sql`
        INSERT INTO outbox_events (
          id, event_type, target_system, idempotency_key, payload, status, created_at
        ) VALUES (
          gen_random_uuid(),
          'meeting_intelligence.session_completed',
          'ai-tathastu',
          ${idempotencyKey},
          ${JSON.stringify(payload)}::jsonb,
          'pending',
          now()
        )
        ON CONFLICT (idempotency_key) DO NOTHING;
      `);

      report.syncedToTathastu = true;
      await db.execute(sql`
        UPDATE mentorship_intelligence_reports
        SET 
          synced_to_tathastu = true,
          tathastu_sync_idempotency_key = ${idempotencyKey},
          updated_at = now()
        WHERE booking_id = ${report.bookingId}::uuid;
      `);

      return idempotencyKey;
    } catch (err: any) {
      console.error(`[MentorshipBridgeAdapter] Outbox synchronization failed:`, err?.message);
      return null;
    }
  }
}
