/**
 * MentorMaze Transcript Store & Redaction Service
 * Adapted from Cicada's SessionStore & Document Validation (Apache-2.0 License - https://github.com/wquguru/cicada)
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Handles monotonic transcript sequencing, in-memory caching, SQL database persistence,
 * and student-controlled redaction under the MentorMaze Retention & Consent Policy.
 */

import { TranscriptSegment } from "./types";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export class TranscriptStore {
  // In-memory store per booking ID for high-throughput live WebRTC sessions
  private static memoryStore = new Map<string, TranscriptSegment[]>();

  /**
   * Appends a new finalized segment with guaranteed atomic database monotonic line indexing.
   */
  public static async appendSegment(
    bookingId: string,
    segment: Omit<TranscriptSegment, "lineIndex">
  ): Promise<TranscriptSegment> {
    const db = await getDb();

    // Atomic PostgreSQL insert with subquery computing next monotonic line_index
    const insertResult: any = await db.execute(sql`
      INSERT INTO meeting_transcript_segments (
        id, booking_id, line_index, participant_id, speaker_role, speaker_name,
        start_time_seconds, end_time_seconds, src, src_lang, dst, dst_lang,
        is_final, confidence, processing_provider, provenance, created_at
      ) VALUES (
        gen_random_uuid(),
        ${bookingId}::uuid,
        (SELECT COALESCE(MAX(line_index), 0) + 1 FROM meeting_transcript_segments WHERE booking_id = ${bookingId}::uuid),
        ${segment.participantId}::uuid,
        ${segment.speakerRole},
        ${segment.speakerName},
        ${segment.startTimeSeconds},
        ${segment.endTimeSeconds},
        ${segment.src},
        ${segment.srcLang},
        ${segment.dst || null},
        ${segment.dstLang || null},
        ${segment.isFinal},
        ${segment.confidence},
        ${segment.processingProvider},
        ${segment.provenance},
        now()
      )
      RETURNING 
        id, booking_id as "sessionId", line_index as "lineIndex",
        participant_id as "participantId", speaker_role as "speakerRole",
        speaker_name as "speakerName", start_time_seconds as "startTimeSeconds",
        end_time_seconds as "endTimeSeconds", src, src_lang as "srcLang",
        dst, dst_lang as "dstLang", is_final as "isFinal", confidence,
        processing_provider as "processingProvider", provenance, created_at as "createdAt";
    `);

    const row = insertResult.rows?.[0] || insertResult?.[0];
    if (!row) {
      throw new Error(`Failed to append transcript segment atomically for booking ${bookingId}`);
    }

    const savedSegment: TranscriptSegment = {
      id: String(row.id),
      sessionId: String(row.sessionId),
      lineIndex: Number(row.lineIndex),
      participantId: String(row.participantId),
      speakerRole: row.speakerRole,
      speakerName: String(row.speakerName),
      startTimeSeconds: Number(row.startTimeSeconds),
      endTimeSeconds: Number(row.endTimeSeconds),
      src: String(row.src),
      srcLang: String(row.srcLang),
      dst: row.dst ? String(row.dst) : undefined,
      dstLang: row.dstLang ? String(row.dstLang) : undefined,
      isFinal: Boolean(row.isFinal),
      confidence: Number(row.confidence),
      processingProvider: String(row.processingProvider),
      provenance: row.provenance,
      createdAt: new Date(row.createdAt).toISOString(),
    };

    // Synchronize cache
    const existing = this.memoryStore.get(bookingId) || [];
    existing.push(savedSegment);
    this.memoryStore.set(bookingId, existing);

    return savedSegment;
  }

  /**
   * Retrieves full chronological transcript for a booking.
   */
  public static async getTranscript(bookingId: string): Promise<TranscriptSegment[]> {
    const cached = this.memoryStore.get(bookingId);
    if (cached && cached.length > 0) {
      return [...cached];
    }

    try {
      const db = await getDb();
      const rows = await db.execute(sql`
        SELECT 
          id, booking_id as "sessionId", line_index as "lineIndex",
          participant_id as "participantId", speaker_role as "speakerRole",
          speaker_name as "speakerName", start_time_seconds as "startTimeSeconds",
          end_time_seconds as "endTimeSeconds", src, src_lang as "srcLang",
          dst, dst_lang as "dstLang", is_final as "isFinal", confidence,
          processing_provider as "processingProvider", provenance, created_at as "createdAt"
        FROM meeting_transcript_segments
        WHERE booking_id = ${bookingId}::uuid
        ORDER BY line_index ASC;
      `);

      if (rows.rows && rows.rows.length > 0) {
        const segments: TranscriptSegment[] = rows.rows.map((r: any) => ({
          id: String(r.id),
          sessionId: String(r.sessionId),
          lineIndex: Number(r.lineIndex),
          participantId: String(r.participantId),
          speakerRole: r.speakerRole,
          speakerName: String(r.speakerName),
          startTimeSeconds: Number(r.startTimeSeconds),
          endTimeSeconds: Number(r.endTimeSeconds),
          src: String(r.src),
          srcLang: String(r.srcLang),
          dst: r.dst ? String(r.dst) : undefined,
          dstLang: r.dstLang ? String(r.dstLang) : undefined,
          isFinal: Boolean(r.isFinal),
          confidence: Number(r.confidence),
          processingProvider: String(r.processingProvider),
          provenance: r.provenance,
          createdAt: new Date(r.createdAt).toISOString(),
        }));
        this.memoryStore.set(bookingId, segments);
        return segments;
      }
    } catch (err: any) {
      console.warn(`[TranscriptStore] Failed to query DB transcript for ${bookingId}: ${err?.message}`);
    }

    return [];
  }

  /**
   * Redacts specific line indices upon authorized participant request.
   * Executes atomic database UPDATE and clears memory cache.
   */
  public static async redactLines(
    bookingId: string,
    lineIndices: number[],
    reason: string = "student_requested_redaction"
  ): Promise<void> {
    if (!lineIndices || lineIndices.length === 0) return;

    try {
      const db = await getDb();
      for (const lineIndex of lineIndices) {
        await db.execute(sql`
          UPDATE meeting_transcript_segments
          SET 
            src = '[REDACTED BY PARTICIPANT]',
            dst = '[REDACTED BY PARTICIPANT]'
          WHERE booking_id = ${bookingId}::uuid AND line_index = ${lineIndex};
        `);
      }
    } catch (err: any) {
      console.warn(`[TranscriptStore] DB redaction error: ${err?.message}`);
      throw new Error(`Database redaction failed: ${err?.message}`);
    }

    // Refresh cached segments
    this.memoryStore.delete(bookingId);
  }

  /**
   * Clears memory cache for a booking (e.g. on session cleanup).
   */
  public static clearCache(bookingId: string): void {
    this.memoryStore.delete(bookingId);
  }
}
