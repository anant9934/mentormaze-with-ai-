/**
 * Student Check-In & Cadence Service (Phase 4.1.1)
 * Manages dedicated persistent check-in records, cadence preferences, and provenance.
 * Brand: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 */

import { getDb } from "@/lib/db";
import { aiMentorCheckinPreferences, aiMentorCheckinRecords } from "@/lib/db/ai-mentor-schema";
import { eq, desc, and } from "drizzle-orm";
import { StudentConsentService } from "@/lib/ai-mentor/student-consent-service";

export interface CheckinPreferencesRecord {
  id: string;
  studentUserId: string;
  cadence: "daily" | "weekly" | "paused";
  preferredHour: number;
  timezone: string;
  quietHoursEnabled: boolean;
  updatedAt: string;
}

export interface CheckinRecord {
  id: string;
  studentUserId: string;
  checkinType: "session_checkin" | "daily" | "weekly" | "milestone_reflection";
  goalId?: string;
  roadmapId?: string;
  milestoneId?: string;
  studentResponse?: string;
  progressSummary?: string;
  blockers?: string;
  notes?: string;
  provenance: "student_reported";
  consentReference: "mentorship_checkins" | "student_memory";
  observedAt: string;
  createdAt: string;
}

export interface CreateCheckinInput {
  studentUserId: string;
  checkinType?: "session_checkin" | "daily" | "weekly" | "milestone_reflection";
  goalId?: string;
  roadmapId?: string;
  milestoneId?: string;
  studentResponse?: string;
  progressSummary?: string;
  blockers?: string;
  notes?: string;
  cadence?: "daily" | "weekly" | "paused";
  preferredHour?: number;
  timezone?: string;
  quietHoursEnabled?: boolean;
  consentReference?: "mentorship_checkins" | "student_memory";
}

export class StudentCheckinService {
  private static preferencesCache = new Map<string, CheckinPreferencesRecord>();
  private static checkinRecordsCache = new Map<string, CheckinRecord[]>();

  public static resetCache(): void {
    this.preferencesCache.clear();
    this.checkinRecordsCache.clear();
  }

  private static validateOwnership(studentUserId: string, requestingUserId?: string): void {
    if (
      requestingUserId &&
      requestingUserId !== studentUserId &&
      requestingUserId !== "admin" &&
      !requestingUserId.startsWith("admin-")
    ) {
      throw new Error("403_FORBIDDEN: You do not have permission to access another student's check-ins.");
    }
  }

  /**
   * Retrieves student's check-in preferences from PostgreSQL with in-memory fallback
   */
  public static async getPreferences(
    studentUserId: string,
    requestingUserId?: string
  ): Promise<CheckinPreferencesRecord> {
    this.validateOwnership(studentUserId, requestingUserId);

    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(aiMentorCheckinPreferences)
        .where(eq(aiMentorCheckinPreferences.studentUserId, studentUserId))
        .limit(1);

      if (rows && rows.length > 0) {
        const r = rows[0];
        const record: CheckinPreferencesRecord = {
          id: r.id,
          studentUserId: r.studentUserId,
          cadence: r.cadence as "daily" | "weekly" | "paused",
          preferredHour: r.preferredHour,
          timezone: r.timezone,
          quietHoursEnabled: r.quietHoursEnabled,
          updatedAt: new Date(r.updatedAt).toISOString(),
        };
        this.preferencesCache.set(studentUserId, record);
        return record;
      }
    } catch {
      // Fallback to cache / default
    }

    if (this.preferencesCache.has(studentUserId)) {
      return this.preferencesCache.get(studentUserId)!;
    }

    const defaultPrefs: CheckinPreferencesRecord = {
      id: `pref-${studentUserId}`,
      studentUserId,
      cadence: "weekly",
      preferredHour: 10,
      timezone: "Asia/Kolkata",
      quietHoursEnabled: false,
      updatedAt: new Date().toISOString(),
    };
    this.preferencesCache.set(studentUserId, defaultPrefs);
    return defaultPrefs;
  }

  /**
   * Saves or updates student's check-in preferences in PostgreSQL
   */
  public static async savePreferences(
    studentUserId: string,
    input: Partial<Omit<CheckinPreferencesRecord, "id" | "studentUserId" | "updatedAt">>,
    requestingUserId?: string
  ): Promise<CheckinPreferencesRecord> {
    this.validateOwnership(studentUserId, requestingUserId);

    const existing = await this.getPreferences(studentUserId, requestingUserId);
    const now = new Date();

    const updated: CheckinPreferencesRecord = {
      id: existing.id || `pref-${studentUserId}`,
      studentUserId,
      cadence: input.cadence || existing.cadence,
      preferredHour: input.preferredHour !== undefined ? input.preferredHour : existing.preferredHour,
      timezone: input.timezone || existing.timezone,
      quietHoursEnabled: input.quietHoursEnabled !== undefined ? input.quietHoursEnabled : existing.quietHoursEnabled,
      updatedAt: now.toISOString(),
    };

    this.preferencesCache.set(studentUserId, updated);

    try {
      const db = getDb();
      await db
        .insert(aiMentorCheckinPreferences)
        .values({
          id: updated.id,
          studentUserId,
          cadence: updated.cadence,
          preferredHour: updated.preferredHour,
          timezone: updated.timezone,
          quietHoursEnabled: updated.quietHoursEnabled,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: aiMentorCheckinPreferences.studentUserId,
          set: {
            cadence: updated.cadence,
            preferredHour: updated.preferredHour,
            timezone: updated.timezone,
            quietHoursEnabled: updated.quietHoursEnabled,
            updatedAt: now,
          },
        });
    } catch {
      // Memory cache preserved
    }

    return updated;
  }

  /**
   * Persists a dedicated structured check-in record
   * DOES NOT conflate progress with verified skills or blockers with confirmed weaknesses
   */
  public static async recordCheckin(
    input: CreateCheckinInput,
    requestingUserId?: string
  ): Promise<CheckinRecord> {
    const studentUserId = input.studentUserId;
    this.validateOwnership(studentUserId, requestingUserId);

    // Validate that student has granted authorization for mentorship_checkins
    const hasCheckinConsent = await StudentConsentService.hasConsent(
      studentUserId,
      "mentorship_checkins",
      requestingUserId
    );
    if (!hasCheckinConsent) {
      throw new Error("403_FORBIDDEN: Check-in writes are blocked because mentorship_checkins authorization is revoked.");
    }

    // Save any preference updates included with the check-in
    if (input.cadence || input.preferredHour !== undefined || input.timezone || input.quietHoursEnabled !== undefined) {
      await this.savePreferences(
        studentUserId,
        {
          cadence: input.cadence,
          preferredHour: input.preferredHour,
          timezone: input.timezone,
          quietHoursEnabled: input.quietHoursEnabled,
        },
        requestingUserId
      );
    }

    const checkinId = `chk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date();

    const record: CheckinRecord = {
      id: checkinId,
      studentUserId,
      checkinType: input.checkinType || "session_checkin",
      goalId: input.goalId,
      roadmapId: input.roadmapId,
      milestoneId: input.milestoneId,
      studentResponse: input.studentResponse,
      progressSummary: input.progressSummary,
      blockers: input.blockers,
      notes: input.notes,
      provenance: "student_reported",
      consentReference: input.consentReference || "mentorship_checkins",
      observedAt: now.toISOString(),
      createdAt: now.toISOString(),
    };

    // Update in-memory cache
    const existing = this.checkinRecordsCache.get(studentUserId) || [];
    this.checkinRecordsCache.set(studentUserId, [record, ...existing]);

    // Persist to PostgreSQL
    try {
      const db = getDb();
      await db.insert(aiMentorCheckinRecords).values({
        id: record.id,
        studentUserId: record.studentUserId,
        checkinType: record.checkinType,
        goalId: record.goalId || null,
        roadmapId: record.roadmapId || null,
        milestoneId: record.milestoneId || null,
        studentResponse: record.studentResponse || null,
        progressSummary: record.progressSummary || null,
        blockers: record.blockers || null,
        notes: record.notes || null,
        provenance: "student_reported",
        consentReference: record.consentReference,
        observedAt: now,
        createdAt: now,
      });
    } catch {
      // Memory record preserved
    }

    return record;
  }

  /**
   * Retrieves all check-in records for a student
   */
  public static async getCheckinHistory(
    studentUserId: string,
    requestingUserId?: string
  ): Promise<CheckinRecord[]> {
    this.validateOwnership(studentUserId, requestingUserId);

    // If student has revoked mentorship_checkins, check-in history access is blocked
    const hasCheckinConsent = await StudentConsentService.hasConsent(
      studentUserId,
      "mentorship_checkins",
      requestingUserId
    );
    if (!hasCheckinConsent) {
      return [];
    }

    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(aiMentorCheckinRecords)
        .where(eq(aiMentorCheckinRecords.studentUserId, studentUserId))
        .orderBy(desc(aiMentorCheckinRecords.observedAt));

      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          studentUserId: r.studentUserId,
          checkinType: r.checkinType as CheckinRecord["checkinType"],
          goalId: r.goalId || undefined,
          roadmapId: r.roadmapId || undefined,
          milestoneId: r.milestoneId || undefined,
          studentResponse: r.studentResponse || undefined,
          progressSummary: r.progressSummary || undefined,
          blockers: r.blockers || undefined,
          notes: r.notes || undefined,
          provenance: "student_reported",
          consentReference: (r.consentReference as CheckinRecord["consentReference"]) || "mentorship_checkins",
          observedAt: new Date(r.observedAt).toISOString(),
          createdAt: new Date(r.createdAt).toISOString(),
        }));
      }
    } catch {
      // Fallback to cache
    }

    return this.checkinRecordsCache.get(studentUserId) || [];
  }

  /**
   * Delete a single check-in record
   */
  public static async deleteCheckinRecord(
    studentUserId: string,
    checkinId: string,
    requestingUserId?: string
  ): Promise<boolean> {
    this.validateOwnership(studentUserId, requestingUserId);

    const existing = this.checkinRecordsCache.get(studentUserId) || [];
    this.checkinRecordsCache.set(
      studentUserId,
      existing.filter((r) => r.id !== checkinId)
    );

    try {
      const db = getDb();
      await db
        .delete(aiMentorCheckinRecords)
        .where(
          and(
            eq(aiMentorCheckinRecords.studentUserId, studentUserId),
            eq(aiMentorCheckinRecords.id, checkinId)
          )
        );
      return true;
    } catch {
      return true;
    }
  }

  /**
   * Clear all check-in history for student (retention policy enforcement)
   */
  public static async clearAllCheckinHistory(
    studentUserId: string,
    requestingUserId?: string
  ): Promise<boolean> {
    this.validateOwnership(studentUserId, requestingUserId);

    this.checkinRecordsCache.set(studentUserId, []);

    try {
      const db = getDb();
      await db
        .delete(aiMentorCheckinRecords)
        .where(eq(aiMentorCheckinRecords.studentUserId, studentUserId));
      return true;
    } catch {
      return true;
    }
  }

  /**
   * Update student check-in response / correction while strictly preserving provenance
   */
  public static async updateCheckinRecord(
    studentUserId: string,
    checkinId: string,
    updates: Partial<{
      studentResponse: string;
      progressSummary: string;
      blockers: string;
      notes: string;
    }>,
    requestingUserId?: string
  ): Promise<CheckinRecord> {
    this.validateOwnership(studentUserId, requestingUserId);

    const hasCheckinConsent = await StudentConsentService.hasConsent(
      studentUserId,
      "mentorship_checkins",
      requestingUserId
    );
    if (!hasCheckinConsent) {
      throw new Error("403_FORBIDDEN: Check-in modifications are blocked because mentorship_checkins authorization is revoked.");
    }

    const records = await this.getCheckinHistory(studentUserId, requestingUserId);
    const target = records.find((r) => r.id === checkinId);
    if (!target) {
      throw new Error(`404_NOT_FOUND: Check-in record ${checkinId} not found.`);
    }

    const updated: CheckinRecord = {
      ...target,
      studentResponse: updates.studentResponse !== undefined ? updates.studentResponse : target.studentResponse,
      progressSummary: updates.progressSummary !== undefined ? updates.progressSummary : target.progressSummary,
      blockers: updates.blockers !== undefined ? updates.blockers : target.blockers,
      notes: updates.notes !== undefined ? updates.notes : target.notes,
      provenance: "student_reported", // Strictly preserved
    };

    const existing = this.checkinRecordsCache.get(studentUserId) || [];
    this.checkinRecordsCache.set(
      studentUserId,
      existing.map((r) => (r.id === checkinId ? updated : r))
    );

    try {
      const db = getDb();
      await db
        .update(aiMentorCheckinRecords)
        .set({
          studentResponse: updated.studentResponse,
          progressSummary: updated.progressSummary,
          blockers: updated.blockers,
          notes: updated.notes,
        })
        .where(
          and(
            eq(aiMentorCheckinRecords.studentUserId, studentUserId),
            eq(aiMentorCheckinRecords.id, checkinId)
          )
        );
    } catch {
      // Memory record preserved
    }

    return updated;
  }
}
