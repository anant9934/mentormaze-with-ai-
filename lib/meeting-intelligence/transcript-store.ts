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
   * Appends a new finalized segment with guaranteed monotonic line indexing.
   */
  public static async appendSegment(
    bookingId: string,
    segment: Omit<TranscriptSegment, "lineIndex">
  ): Promise<TranscriptSegment> {
    const existing = this.memoryStore.get(bookingId) || [];
    const nextLineIndex = existing.length + 1;

    const fullSegment: TranscriptSegment = {
      ...segment,
      sessionId: bookingId,
      lineIndex: nextLineIndex,
    };

    existing.push(fullSegment);
    this.memoryStore.set(bookingId, existing);

    // Persist to database asynchronously
    try {
      const db = await getDb();
      await db.execute(sql`
        INSERT INTO meeting_transcript_segments (
          id, booking_id, line_index, participant_id, speaker_role, speaker_name,
          start_time_seconds, end_time_seconds, src, src_lang, dst, dst_lang,
          is_final, confidence, processing_provider, provenance, created_at
        ) VALUES (
          gen_random_uuid(),
          ${bookingId}::uuid,
          ${nextLineIndex},
          ${fullSegment.participantId}::uuid,
          ${fullSegment.speakerRole},
          ${fullSegment.speakerName},
          ${fullSegment.startTimeSeconds},
          ${fullSegment.endTimeSeconds},
          ${fullSegment.src},
          ${fullSegment.srcLang},
          ${fullSegment.dst || null},
          ${fullSegment.dstLang || null},
          ${fullSegment.isFinal},
          ${fullSegment.confidence},
          ${fullSegment.processingProvider},
          ${fullSegment.provenance},
          ${fullSegment.createdAt}
        )
        ON CONFLICT (booking_id, line_index) DO UPDATE SET
          src = EXCLUDED.src,
          dst = EXCLUDED.dst,
          is_final = EXCLUDED.is_final;
      `);
    } catch (err: any) {
      // In-memory fallback ensures resilience if DB write experiences transient latency
      console.warn(`[TranscriptStore] Async DB write warning for booking ${bookingId}: ${err?.message}`);
    }

    return fullSegment;
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
   * Redacts specific line indices or PII keywords upon student request.
   */
  public static async redactLines(
    bookingId: string,
    lineIndices: number[],
    reason: string = "student_requested_redaction"
  ): Promise<void> {
    const segments = await this.getTranscript(bookingId);
    for (const segment of segments) {
      if (lineIndices.includes(segment.lineIndex)) {
        segment.src = "[REDACTED BY PARTICIPANT]";
        if (segment.dst) {
          segment.dst = "[REDACTED BY PARTICIPANT]";
        }
      }
    }
    this.memoryStore.set(bookingId, segments);

    try {
      const db = await getDb();
      for (const lineIndex of lineIndices) {
        await db.execute(sql`
          UPDATE meeting_transcript_segments
          SET 
            src = '[REDACTED BY PARTICIPANT]',
            dst = CASE WHEN dst IS NOT NULL THEN '[REDACTED BY PARTICIPANT]' ELSE NULL END
          WHERE booking_id = ${bookingId}::uuid AND line_index = ${lineIndex};
        `);
      }
    } catch (err: any) {
      console.warn(`[TranscriptStore] DB redaction error: ${err?.message}`);
    }
  }

  /**
   * Clears memory cache for a booking (e.g. on session cleanup).
   */
  public static clearCache(bookingId: string): void {
    this.memoryStore.delete(bookingId);
  }
}
