/**
 * ASTRION Purpose-Specific Consent & Authorization Service
 * Enforces granular, purpose-separated permissions across all 7 platform purposes.
 * Brand: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 */

import { getDb } from "../db";
import { studentPurposeConsents, mentorshipBridgeShares } from "../db/ai-mentor-schema";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";

export type ConsentPurpose =
  | "service_personalization"
  | "student_memory"
  | "mentorship_checkins"
  | "external_data_integration"
  | "external_llm_processing"
  | "model_training"
  | "mentor_sharing"
  | "ai_tathastu_sync"
  | "analytics_evaluation";

export interface PurposeConsentRecord {
  purpose: ConsentPurpose;
  isGranted: boolean;
  consentVersion: string;
  consentEpoch: number;
  grantedAt: string;
  revokedAt?: string;
  expiresAt?: string;
  auditNotes?: string;
}

export interface ConsentPurposeMetadata {
  purpose: ConsentPurpose;
  title: string;
  description: string;
  targetDestination: string;
  permittedCategories: string[];
  isGranted: boolean;
  grantedAt?: string;
  revokedAt?: string;
}

export const PURPOSE_METADATA: Record<
  ConsentPurpose,
  {
    title: string;
    description: string;
    targetDestination: string;
    permittedCategories: string[];
  }
> = {
  service_personalization: {
    title: "Service Personalization",
    description: "Adaptive mentoring responses tailored to learning style and pace.",
    targetDestination: "MentorMaze Internal Orchestrator",
    permittedCategories: ["learning_style", "experience_level", "study_goals"],
  },
  student_memory: {
    title: "Student Memory & Continuity",
    description: "Persistent recall of past sessions, milestones, and challenges.",
    targetDestination: "MentorMaze Student Memory Store",
    permittedCategories: ["conversation_summaries", "milestone_history", "active_challenges"],
  },
  mentorship_checkins: {
    title: "Mentorship Check-Ins",
    description: "Scheduled check-ins and reflection prompts between sessions.",
    targetDestination: "MentorMaze Notification System",
    permittedCategories: ["checkin_responses", "reflection_notes"],
  },
  external_data_integration: {
    title: "External Academic Data Ingestion",
    description: "Ingesting verified academic records, skills, and coursework from AI Tathastu Central.",
    targetDestination: "AI Tathastu Ecosystem Inbound",
    permittedCategories: ["verified_skills", "academic_records", "curriculum_progress"],
  },
  external_llm_processing: {
    title: "AI Cognitive Processing",
    description: "Secure LLM inference for ASTRION conversational mentoring.",
    targetDestination: "Google DeepMind & Authorized Enterprise Inference",
    permittedCategories: ["anonymized_prompts", "coding_snippets"],
  },
  model_training: {
    title: "AI Model Fine-Tuning",
    description: "Contributing anonymized interactions to fine-tune future mentoring models. Strictly opt-in only.",
    targetDestination: "AI Tathastu Training Infrastructure",
    permittedCategories: ["anonymized_mentoring_transcripts"],
  },
  mentor_sharing: {
    title: "Human Mentor Sharing",
    description: "Sharing specifically approved student briefing and objectives with assigned human mentors for 1:1 sessions.",
    targetDestination: "Assigned Human Mentor (1:1 Call Briefing)",
    permittedCategories: ["student_background", "development_areas", "mentoring_objectives", "questions_for_mentor"],
  },
  ai_tathastu_sync: {
    title: "AI Tathastu Intelligence Synchronization",
    description: "Synchronizing verified mentorship outcomes and milestones back to AI Tathastu Central. Independent of mentor sharing.",
    targetDestination: "AI Tathastu Central (Ecosystem Outbound)",
    permittedCategories: ["verified_skills", "mentorship_milestones", "mentor_feedback_summaries"],
  },
  analytics_evaluation: {
    title: "Platform Quality & Analytics",
    description: "Aggregated platform health, latency, and session completion metrics.",
    targetDestination: "MentorMaze Telemetry",
    permittedCategories: ["session_completion_status", "performance_metrics"],
  },
};

/**
 * Validates that requested categories are explicitly permitted under the purpose policy.
 */
export function validatePermittedCategories(
  purpose: ConsentPurpose,
  categories: string[]
): { valid: boolean; unauthorizedCategories: string[] } {
  const allowed = PURPOSE_METADATA[purpose]?.permittedCategories || [];
  const unauthorized = categories.filter((c) => !allowed.includes(c));
  return {
    valid: unauthorized.length === 0,
    unauthorizedCategories: unauthorized,
  };
}

export class StudentConsentService {
  // In-memory synchronized cache for low-latency routing
  private static consentCache: Map<string, Map<ConsentPurpose, PurposeConsentRecord>> = new Map();

  /**
   * Default consent policies per purpose
   * MANDATORY RULE: model_training is STRICTLY FALSE by default (never opt-in without explicit consent).
   */
  public static getDefaultPolicy(purpose: ConsentPurpose): boolean {
    switch (purpose) {
      case "model_training":
        return false; // Explicit opt-in only
      case "service_personalization":
      case "student_memory":
      case "mentorship_checkins":
      case "external_data_integration":
      case "external_llm_processing":
      case "mentor_sharing":
      case "analytics_evaluation":
      default:
        return true;
    }
  }

  /**
   * Check if a student has granted active, non-expired, non-revoked consent for a specific purpose
   */
  public static async hasConsent(
    studentUserId: string,
    purpose: ConsentPurpose,
    requestingUserId?: string
  ): Promise<boolean> {
    const isMentorOrAdmin =
      requestingUserId &&
      (requestingUserId.startsWith("mentor-") ||
        requestingUserId.startsWith("user-mentor-") ||
        requestingUserId.includes("mentor") ||
        requestingUserId === "admin");

    if (requestingUserId && requestingUserId !== studentUserId && !isMentorOrAdmin) {
      throw new Error("403_FORBIDDEN: You do not have permission to inspect another student's consent settings.");
    }

    // 1. Check cache first
    const userCache = this.consentCache.get(studentUserId);
    if (userCache?.has(purpose)) {
      const record = userCache.get(purpose)!;
      if (!record.isGranted || record.revokedAt) return false;
      if (record.expiresAt && new Date(record.expiresAt).getTime() <= Date.now()) return false;
      return true;
    }

    // 2. Query SQL
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(studentPurposeConsents)
        .where(
          and(
            eq(studentPurposeConsents.studentUserId, studentUserId),
            eq(studentPurposeConsents.purpose, purpose)
          )
        )
        .limit(1);

      if (rows && rows.length > 0) {
        const row = rows[0];
        const epoch = typeof row.consentEpoch === "number" ? row.consentEpoch : 1;
        const record: PurposeConsentRecord = {
          purpose,
          isGranted: row.isGranted,
          consentVersion: row.consentVersion || String(epoch),
          consentEpoch: epoch,
          grantedAt: new Date(row.grantedAt).toISOString(),
          revokedAt: row.revokedAt ? new Date(row.revokedAt).toISOString() : undefined,
          expiresAt: row.expiresAt ? new Date(row.expiresAt).toISOString() : undefined,
          auditNotes: row.auditNotes || undefined,
        };

        if (!this.consentCache.has(studentUserId)) {
          this.consentCache.set(studentUserId, new Map());
        }
        this.consentCache.get(studentUserId)!.set(purpose, record);

        if (!record.isGranted || record.revokedAt) return false;
        if (record.expiresAt && new Date(record.expiresAt).getTime() <= Date.now()) return false;
        return true;
      }
    } catch (err: any) {
      if (err?.code !== "42P01") {
        console.warn("[StudentConsentService] SQL consent lookup error:", err?.message || err);
      }
    }

    // 3. Fallback to default policy
    return this.getDefaultPolicy(purpose);
  }

  /**
   * Synchronous check for hot paths
   */
  public static hasConsentSync(studentUserId: string, purpose: ConsentPurpose): boolean {
    const userCache = this.consentCache.get(studentUserId);
    if (userCache?.has(purpose)) {
      const record = userCache.get(purpose)!;
      if (!record.isGranted || record.revokedAt) return false;
      if (record.expiresAt && new Date(record.expiresAt).getTime() <= Date.now()) return false;
      return true;
    }
    return this.getDefaultPolicy(purpose);
  }

  /**
   * Explicitly grant consent for a purpose with monotonically advancing consent epoch
   */
  public static async grantConsent(
    studentUserId: string,
    purpose: ConsentPurpose,
    notes?: string,
    requestingUserId?: string,
    expiresInDays?: number
  ): Promise<PurposeConsentRecord> {
    if (requestingUserId && requestingUserId !== studentUserId) {
      throw new Error("403_FORBIDDEN: You do not have permission to modify another student's consent settings.");
    }

    const now = new Date();
    const expiresAt = expiresInDays !== undefined ? new Date(now.getTime() + expiresInDays * 86400000) : null;
    const rawId = `consent-${studentUserId}-${purpose}`;
    const id = rawId.length <= 64 ? rawId : `cst-${crypto.createHash("md5").update(rawId).digest("hex")}`;

    const db = getDb();
    let currentEpoch = 1;

    if (db) {
      try {
        await db.transaction(async (tx: any) => {
          // 1. Query existing record with lock
          const existingRows: any = await tx.execute(sql`
            SELECT id, is_granted, consent_epoch FROM student_purpose_consents
            WHERE student_user_id = ${studentUserId} AND purpose = ${purpose}
            FOR UPDATE;
          `);

          const existing = existingRows.rows?.[0] || existingRows?.[0] || null;

          if (existing) {
            const prevEpoch = typeof existing.consent_epoch === "number" ? existing.consent_epoch : parseInt(existing.consent_epoch || "1", 10) || 1;
            if (!existing.is_granted) {
              // Monotonically advance consent epoch on RE-GRANT transition
              currentEpoch = prevEpoch + 1;
            } else {
              // Retain current epoch if already granted
              currentEpoch = prevEpoch;
            }
          } else {
            currentEpoch = 1;
          }

          // 2. Upsert consent record
          await tx.execute(sql`
            INSERT INTO student_purpose_consents (
              id, student_user_id, purpose, is_granted, consent_version, consent_epoch, audit_notes, granted_at, revoked_at, expires_at, updated_at
            ) VALUES (
              ${id}, ${studentUserId}, ${purpose}, true, ${String(currentEpoch)}, ${currentEpoch}, ${notes || null}, ${now}, null, ${expiresAt}, ${now}
            )
            ON CONFLICT (id) DO UPDATE SET
              is_granted = true,
              consent_version = EXCLUDED.consent_version,
              consent_epoch = EXCLUDED.consent_epoch,
              revoked_at = null,
              expires_at = EXCLUDED.expires_at,
              audit_notes = EXCLUDED.audit_notes,
              updated_at = EXCLUDED.updated_at;
          `);
        });
      } catch (err) {
        console.warn("[StudentConsentService] Transactional grantConsent error:", err);
      }
    }

    const record: PurposeConsentRecord = {
      purpose,
      isGranted: true,
      consentVersion: String(currentEpoch),
      consentEpoch: currentEpoch,
      grantedAt: now.toISOString(),
      expiresAt: expiresAt ? expiresAt.toISOString() : undefined,
      auditNotes: notes,
    };

    if (!this.consentCache.has(studentUserId)) {
      this.consentCache.set(studentUserId, new Map());
    }
    this.consentCache.get(studentUserId)!.set(purpose, record);

    return record;
  }

  /**
   * Explicitly revoke consent for a purpose
   * 1. Marks consent as revoked.
   * 2. Transactionally suppresses pending outbound events from this revoked epoch.
   * 3. Creates a durable, idempotent deletion tombstone event bound to this epoch.
   * (A later re-grant will NOT suppress or cancel this tombstone!)
   */
  public static async revokeConsent(
    studentUserId: string,
    purpose: ConsentPurpose,
    notes?: string,
    requestingUserId?: string
  ): Promise<void> {
    if (requestingUserId && requestingUserId !== studentUserId) {
      throw new Error("403_FORBIDDEN: You do not have permission to revoke another student's consent settings.");
    }

    const now = new Date();
    const rawId = `consent-${studentUserId}-${purpose}`;
    const id = rawId.length <= 64 ? rawId : `cst-${crypto.createHash("md5").update(rawId).digest("hex")}`;

    const db = getDb();
    let currentEpoch = 1;

    if (db) {
      try {
        await db.transaction(async (tx: any) => {
          // 1. Lock existing record
          const existingRows: any = await tx.execute(sql`
            SELECT id, is_granted, consent_epoch FROM student_purpose_consents
            WHERE student_user_id = ${studentUserId} AND purpose = ${purpose}
            FOR UPDATE;
          `);

          const existing = existingRows.rows?.[0] || existingRows?.[0] || null;
          currentEpoch = existing ? (typeof existing.consent_epoch === "number" ? existing.consent_epoch : parseInt(existing.consent_epoch || "1", 10) || 1) : 1;

          // 2. Update consent to revoked in this epoch
          await tx.execute(sql`
            INSERT INTO student_purpose_consents (
              id, student_user_id, purpose, is_granted, consent_version, consent_epoch, audit_notes, granted_at, revoked_at, updated_at
            ) VALUES (
              ${id}, ${studentUserId}, ${purpose}, false, ${String(currentEpoch)}, ${currentEpoch}, ${notes || "Revoked by student"}, ${now}, ${now}, ${now}
            )
            ON CONFLICT (id) DO UPDATE SET
              is_granted = false,
              revoked_at = EXCLUDED.revoked_at,
              audit_notes = EXCLUDED.audit_notes,
              updated_at = EXCLUDED.updated_at;
          `);

          // 3. Downstream Action: When ai_tathastu_sync is revoked
          if (purpose === "ai_tathastu_sync") {
            // A. Invalidate and suppress any queued/pending ordinary outbound events from this revoked epoch
            await tx.execute(sql`
              UPDATE outbox_events
              SET status = 'suppressed',
                  error_message = ${`Consent ai_tathastu_sync revoked by student in epoch ${currentEpoch}`},
                  processed_at = now()
              WHERE (target_system = 'aitathastu' OR event_type LIKE '%tathastu%' OR event_type = 'mentorship.outcomes.synced')
                AND event_type != 'student.consent.revoked'
                AND (payload->>'studentUserId' = ${studentUserId} OR payload->>'studentId' = ${studentUserId})
                AND status IN ('pending', 'failed', 'retrying', 'processing');
            `);

            // B. Enqueue durable, idempotent downstream deletion/revocation tombstone event bound to this epoch
            // Follows deterministic format: targetSystem:eventType:studentId:sourceType:sourceId:consentEpoch:sourceVersion
            const downstreamKey = `aitathastu:student.consent.revoked:${studentUserId}:consent:purge_and_revoke:${currentEpoch}:1`;
            await tx.execute(sql`
              INSERT INTO outbox_events (event_type, payload, target_system, status, idempotency_key)
              VALUES (
                'student.consent.revoked',
                ${JSON.stringify({
                  studentUserId,
                  revokedPurpose: "ai_tathastu_sync",
                  revokedConsentEpoch: currentEpoch,
                  action: "purge_and_revoke",
                  revokedAt: now.toISOString(),
                  permittedCategoriesToPurge: PURPOSE_METADATA.ai_tathastu_sync.permittedCategories,
                })},
                'aitathastu',
                'pending',
                ${downstreamKey}
              )
              ON CONFLICT (idempotency_key) DO NOTHING;
            `);
          }

          // Downstream Action 2: When mentor_sharing is revoked, invalidate active Bridge share records
          if (purpose === "mentor_sharing") {
            await tx.execute(sql`
              UPDATE mentorship_bridge_shares
              SET status = 'revoked', updated_at = now()
              WHERE student_user_id = ${studentUserId} AND status = 'shared';
            `);
          }
        });
      } catch (err) {
        console.warn("[StudentConsentService] Transactional revokeConsent error:", err);
      }
    }

    const record: PurposeConsentRecord = {
      purpose,
      isGranted: false,
      consentVersion: String(currentEpoch),
      consentEpoch: currentEpoch,
      grantedAt: now.toISOString(),
      revokedAt: now.toISOString(),
      auditNotes: notes || "Revoked by student",
    };

    if (!this.consentCache.has(studentUserId)) {
      this.consentCache.set(studentUserId, new Map());
    }
    this.consentCache.get(studentUserId)!.set(purpose, record);
  }

  /**
   * Retrieves full consent record for a purpose, including current consent epoch
   */
  public static async getConsentRecord(
    studentUserId: string,
    purpose: ConsentPurpose
  ): Promise<PurposeConsentRecord | null> {
    const userCache = this.consentCache.get(studentUserId);
    if (userCache?.has(purpose)) {
      return userCache.get(purpose)!;
    }

    try {
      const db = getDb();
      if (db) {
        const rows: any = await db.execute(sql`
          SELECT * FROM student_purpose_consents
          WHERE student_user_id = ${studentUserId} AND purpose = ${purpose}
          LIMIT 1;
        `);
        const row = rows.rows?.[0] || rows?.[0] || null;
        if (row) {
          const epoch = typeof row.consent_epoch === "number" ? row.consent_epoch : parseInt(row.consent_epoch || "1", 10) || 1;
          const record: PurposeConsentRecord = {
            purpose,
            isGranted: row.is_granted,
            consentVersion: row.consent_version || String(epoch),
            consentEpoch: epoch,
            grantedAt: new Date(row.granted_at).toISOString(),
            revokedAt: row.revoked_at ? new Date(row.revoked_at).toISOString() : undefined,
            expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : undefined,
            auditNotes: row.audit_notes || undefined,
          };
          if (!this.consentCache.has(studentUserId)) {
            this.consentCache.set(studentUserId, new Map());
          }
          this.consentCache.get(studentUserId)!.set(purpose, record);
          return record;
        }
      }
    } catch (err) {
      console.warn("[StudentConsentService] Error fetching consent record:", err);
    }

    const isDefaultGranted = this.getDefaultPolicy(purpose);
    return {
      purpose,
      isGranted: isDefaultGranted,
      consentVersion: "1",
      consentEpoch: 1,
      grantedAt: new Date().toISOString(),
    };
  }

  /**
   * Transparent student consent ledger with category disclosures
   */
  public static async getStudentConsentLedger(
    studentUserId: string,
    requestingUserId?: string
  ): Promise<ConsentPurposeMetadata[]> {
    if (requestingUserId && requestingUserId !== studentUserId) {
      throw new Error("403_FORBIDDEN: You do not have permission to view another student's consent ledger.");
    }

    const allPurposes: ConsentPurpose[] = [
      "service_personalization",
      "student_memory",
      "mentorship_checkins",
      "external_data_integration",
      "external_llm_processing",
      "model_training",
      "mentor_sharing",
      "ai_tathastu_sync",
      "analytics_evaluation",
    ];

    const ledger: ConsentPurposeMetadata[] = [];

    for (const p of allPurposes) {
      const isGranted = await this.hasConsent(studentUserId, p);
      const meta = PURPOSE_METADATA[p];
      const userCache = this.consentCache.get(studentUserId)?.get(p);

      ledger.push({
        purpose: p,
        title: meta.title,
        description: meta.description,
        targetDestination: meta.targetDestination,
        permittedCategories: meta.permittedCategories,
        isGranted,
        grantedAt: userCache?.grantedAt,
        revokedAt: userCache?.revokedAt,
      });
    }

    return ledger;
  }

  /**
   * Retrieve full purpose consent profile for a student
   */
  public static async getConsentProfile(
    studentUserId: string,
    requestingUserId?: string
  ): Promise<Record<ConsentPurpose, boolean>> {
    if (requestingUserId && requestingUserId !== studentUserId) {
      throw new Error("403_FORBIDDEN: You do not have permission to view another student's consent settings.");
    }

    const purposes: ConsentPurpose[] = [
      "service_personalization",
      "student_memory",
      "mentorship_checkins",
      "external_data_integration",
      "external_llm_processing",
      "model_training",
      "mentor_sharing",
      "ai_tathastu_sync",
      "analytics_evaluation",
    ];

    const result: Partial<Record<ConsentPurpose, boolean>> = {};
    for (const p of purposes) {
      result[p] = await this.hasConsent(studentUserId, p);
    }

    return result as Record<ConsentPurpose, boolean>;
  }

  /**
   * Reset cache for test isolation
   */
  public static resetCache(): void {
    this.consentCache.clear();
  }

  public static reset(): void {
    this.resetCache();
  }
}
