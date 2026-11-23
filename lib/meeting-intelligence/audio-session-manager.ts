/**
 * MentorMaze Audio Session Manager
 * Adapted from Cicada's ListenEngine & AudioRouter (Apache-2.0 License - https://github.com/wquguru/cicada)
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Coordinates live audio stream intake from LiveKit, runs RMS VAD segmentation,
 * routes segments to Cloud STT, executes live translation, updates incremental notes,
 * and tracks session lifecycle with authorization verification.
 */

import { AudioSegmenter } from "./audio-segmenter";
import { SpeakerAttributionAdapter, BookingParticipantContext } from "./speaker-attribution-adapter";
import { SpeechRecognitionAdapter } from "./speech-recognition-adapter";
import { TranslationAdapter } from "./translation-adapter";
import { TranscriptStore } from "./transcript-store";
import { MeetingNotesEngine } from "./meeting-notes-engine";
import { SessionIntelligenceStatus, TranscriptSegment, MeetingNotes } from "./types";
import { StudentConsentService } from "@/lib/ai-mentor/student-consent-service";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export class AudioSessionManager {
  private bookingContext: BookingParticipantContext;
  private status: SessionIntelligenceStatus = "idle";
  private segmenters: Map<string, AudioSegmenter> = new Map();
  private speakerAdapter: SpeakerAttributionAdapter;
  private sttAdapter: SpeechRecognitionAdapter;
  private translationAdapter: TranslationAdapter;
  private notesEngine: MeetingNotesEngine;

  private startTimeSeconds: number = 0;
  private totalWordCount: number = 0;
  private lastNotesUpdateLine: number = 0;
  private targetLanguage?: string;

  constructor(
    bookingContext: BookingParticipantContext,
    targetLanguage: string = "hi"
  ) {
    this.bookingContext = bookingContext;
    this.targetLanguage = targetLanguage;
    this.speakerAdapter = new SpeakerAttributionAdapter(bookingContext);
    this.sttAdapter = new SpeechRecognitionAdapter();
    this.translationAdapter = new TranslationAdapter();
    this.notesEngine = new MeetingNotesEngine();
  }

  public getStatus(): SessionIntelligenceStatus {
    return this.status;
  }

  /**
   * Starts live intelligence capture for the booking.
   * Enforces verified student consent prior to activation.
   */
  public async startCapture(): Promise<void> {
    // 1. Verify student consent before capturing
    const hasConsent = await StudentConsentService.hasConsent(
      this.bookingContext.studentUserId,
      "student_memory"
    );
    if (!hasConsent) {
      throw new Error("CONSENT_REQUIRED: Student consent is required before capturing meeting intelligence.");
    }

    this.status = "capturing";
    this.startTimeSeconds = Date.now() / 1000;

    try {
      const db = await getDb();
      await db.execute(sql`
        INSERT INTO meeting_intelligence_sessions (
          id, booking_id, status, started_at, active_languages
        ) VALUES (
          gen_random_uuid(),
          ${this.bookingContext.bookingId}::uuid,
          'capturing',
          now(),
          '["en", "hi"]'::jsonb
        )
        ON CONFLICT (booking_id) DO UPDATE SET
          status = 'capturing',
          updated_at = now();
      `);
    } catch (err: any) {
      console.warn(`[AudioSessionManager] DB session start record notice: ${err?.message}`);
    }
  }

  /**
   * Pauses intelligence capture and updates database state.
   */
  public async pauseCapture(): Promise<void> {
    if (this.status === "capturing") {
      this.status = "paused";
      try {
        const db = await getDb();
        await db.execute(sql`
          UPDATE meeting_intelligence_sessions
          SET status = 'paused', updated_at = now()
          WHERE booking_id = ${this.bookingContext.bookingId}::uuid;
        `);
      } catch (err: any) {
        console.warn(`[AudioSessionManager] DB pause update notice: ${err?.message}`);
      }
    }
  }

  /**
   * Resumes intelligence capture and updates database state.
   */
  public async resumeCapture(): Promise<void> {
    if (this.status === "paused") {
      this.status = "capturing";
      try {
        const db = await getDb();
        await db.execute(sql`
          UPDATE meeting_intelligence_sessions
          SET status = 'capturing', updated_at = now()
          WHERE booking_id = ${this.bookingContext.bookingId}::uuid;
        `);
      } catch (err: any) {
        console.warn(`[AudioSessionManager] DB resume update notice: ${err?.message}`);
      }
    }
  }

  /**
   * Ingests a raw Float32Array PCM frame from a specific participant's LiveKit WebRTC audio track.
   * Returns newly finalized TranscriptSegment if a sentence boundary was reached.
   */
  public async ingestAudioFrame(
    participantUserId: string,
    samples: Float32Array,
    clockSeconds?: number
  ): Promise<TranscriptSegment | null> {
    if (this.status !== "capturing") {
      return null;
    }

    // Verify participant authorization
    const participant = this.speakerAdapter.resolveSpeaker(participantUserId);
    if (!participant.isAuthorized || participant.role === "system") {
      console.warn(`[AudioSessionManager] Rejecting unauthorized audio track from ${participantUserId}`);
      return null;
    }

    // Get or initialize participant's VAD segmenter
    let segmenter = this.segmenters.get(participantUserId);
    if (!segmenter) {
      segmenter = new AudioSegmenter(
        this.bookingContext.bookingId,
        participantUserId,
        participant.role as "student" | "mentor",
        16000
      );
      this.segmenters.set(participantUserId, segmenter);
    }

    const currentClock = clockSeconds ?? (Date.now() / 1000 - this.startTimeSeconds);
    const envelope = segmenter.feed(samples, currentClock);

    if (!envelope) {
      return null;
    }

    // Process finalized audio envelope through Cloud STT
    const heard = await this.sttAdapter.transcribe(envelope, {
      preferredLanguage: "en",
    });

    if (!heard || !heard.original.trim()) {
      return null;
    }

    // Perform live translation if requested
    let dstText: string | undefined;
    if (this.targetLanguage && this.targetLanguage !== heard.lang) {
      dstText = await this.translationAdapter.translate(heard.original, heard.lang, this.targetLanguage);
    }

    // Calculate word count
    const words = heard.original.trim().split(/\s+/).length;
    this.totalWordCount += words;

    // Append to transcript store with monotonic line indexing
    const segment = await TranscriptStore.appendSegment(this.bookingContext.bookingId, {
      id: envelope.segmentId,
      sessionId: this.bookingContext.bookingId,
      participantId: participantUserId,
      speakerRole: participant.role as "student" | "mentor",
      speakerName: participant.name,
      startTimeSeconds: envelope.startTimeMs / 1000,
      endTimeSeconds: envelope.endTimeMs / 1000,
      src: heard.original,
      srcLang: heard.lang,
      dst: dstText,
      dstLang: this.targetLanguage,
      isFinal: true,
      confidence: heard.confidence,
      processingProvider: "cloud_stt",
      provenance: "transcript_extracted",
      createdAt: new Date().toISOString(),
    });

    // Check if incremental notes update is due (e.g. every 3 segments)
    const transcript = await TranscriptStore.getTranscript(this.bookingContext.bookingId);
    if (transcript.length - this.lastNotesUpdateLine >= 3) {
      this.lastNotesUpdateLine = transcript.length;
      await this.notesEngine.updateNotes(this.bookingContext.bookingId, null, transcript, false);
    }

    return segment;
  }

  /**
   * Finalizes the audio session, flushes remaining buffers, and runs final synthesis.
   */
  public async stopCapture(): Promise<MeetingNotes> {
    this.status = "processing";
    const endClock = Date.now() / 1000 - this.startTimeSeconds;

    // Flush any pending audio across all segmenters
    for (const [userId, segmenter] of this.segmenters.entries()) {
      const envelope = segmenter.flush(endClock);
      if (envelope) {
        const participant = this.speakerAdapter.resolveSpeaker(userId);
        const heard = await this.sttAdapter.transcribe(envelope);
        if (heard && heard.original.trim()) {
          let dstText: string | undefined;
          if (this.targetLanguage && this.targetLanguage !== heard.lang) {
            dstText = await this.translationAdapter.translate(heard.original, heard.lang, this.targetLanguage);
          }
          await TranscriptStore.appendSegment(this.bookingContext.bookingId, {
            id: envelope.segmentId,
            sessionId: this.bookingContext.bookingId,
            participantId: userId,
            speakerRole: participant.role as "student" | "mentor",
            speakerName: participant.name,
            startTimeSeconds: envelope.startTimeMs / 1000,
            endTimeSeconds: envelope.endTimeMs / 1000,
            src: heard.original,
            srcLang: heard.lang,
            dst: dstText,
            dstLang: this.targetLanguage,
            isFinal: true,
            confidence: heard.confidence,
            processingProvider: "cloud_stt",
            provenance: "transcript_extracted",
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    // Retrieve all segments and execute final notes pass
    const allSegments = await TranscriptStore.getTranscript(this.bookingContext.bookingId);
    const finalNotes = await this.notesEngine.updateNotes(
      this.bookingContext.bookingId,
      null,
      allSegments,
      true
    );

    this.status = "completed";

    // Update DB session status
    try {
      const db = await getDb();
      await db.execute(sql`
        UPDATE meeting_intelligence_sessions
        SET 
          status = 'completed',
          ended_at = now(),
          duration_seconds = ${Math.round(endClock)},
          total_segments = ${allSegments.length},
          total_words = ${this.totalWordCount},
          updated_at = now()
        WHERE booking_id = ${this.bookingContext.bookingId}::uuid;
      `);
    } catch (err: any) {
      console.warn(`[AudioSessionManager] DB session complete record error: ${err?.message}`);
    }

    return finalNotes;
  }
}
