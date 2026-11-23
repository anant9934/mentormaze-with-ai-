/**
 * Comprehensive Test Suite for MentorMaze Meeting Intelligence Subsystem
 * Adapted from Cicada (Apache-2.0 License - https://github.com/wquguru/cicada)
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 */

import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import { AudioSegmenter } from "@/lib/meeting-intelligence/audio-segmenter";
import { SpeakerAttributionAdapter } from "@/lib/meeting-intelligence/speaker-attribution-adapter";
import { SpeechRecognitionAdapter } from "@/lib/meeting-intelligence/speech-recognition-adapter";
import { TranslationAdapter, MENTORMAZE_TECHNICAL_GLOSSARY } from "@/lib/meeting-intelligence/translation-adapter";
import { TranscriptStore } from "@/lib/meeting-intelligence/transcript-store";
import { MeetingNotesEngine } from "@/lib/meeting-intelligence/meeting-notes-engine";
import { MeetingReportGenerator } from "@/lib/meeting-intelligence/meeting-report-generator";
import { MentorshipBridgeAdapter } from "@/lib/meeting-intelligence/mentorship-bridge-adapter";
import { TranscriptSegment, MeetingNotes } from "@/lib/meeting-intelligence/types";
import { StudentConsentService } from "@/lib/ai-mentor/student-consent-service";

describe("MentorMaze × Cicada Meeting Intelligence Subsystem", () => {
  const testBookingContext = {
    bookingId: "b0000000-0000-0000-0000-000000000001",
    studentUserId: "a0000000-0000-0000-0000-000000000001",
    studentName: "Anant Kumar",
    mentorUserId: "a0000000-0000-0000-0000-000000000002",
    mentorName: "Shivam Kumar Singh",
  };

  beforeAll(async () => {
    await initializeDatabaseSchema();
    const db = await getDb();

    // Seed test users, mentor profile, and booking so foreign key constraints are satisfied
    await db.execute(sql`
      INSERT INTO users (id, email, password_hash, display_name, role, account_status)
      VALUES 
        (${testBookingContext.studentUserId}::uuid, 'anant_test_mi@example.com', 'hash', 'Anant Kumar', 'student', 'active'),
        (${testBookingContext.mentorUserId}::uuid, 'shivam_test_mi@example.com', 'hash', 'Shivam Kumar Singh', 'mentor', 'active')
      ON CONFLICT (id) DO NOTHING;
    `);

    const mpRes: any = await db.execute(sql`
      INSERT INTO mentor_profiles (id, user_id, headline, bio, organization, "current_role", verification_status)
      VALUES 
        ('c0000000-0000-0000-0000-000000000001'::uuid, ${testBookingContext.mentorUserId}::uuid, 'Staff Eng', 'Expert', 'Google', 'Staff Engineer', 'approved')
      ON CONFLICT (user_id) DO UPDATE SET verification_status = 'approved'
      RETURNING id;
    `);
    const mpId = mpRes.rows?.[0]?.id || "c0000000-0000-0000-0000-000000000001";

    await db.execute(sql`
      INSERT INTO bookings (id, student_user_id, mentor_profile_id, service_type, start_time_utc, end_time_utc, status, price_inr, payment_status)
      VALUES (
        ${testBookingContext.bookingId}::uuid,
        ${testBookingContext.studentUserId}::uuid,
        ${mpId}::uuid,
        '1on1_mentorship',
        now(),
        now() + interval '1 hour',
        'confirmed',
        299,
        'paid'
      )
      ON CONFLICT (id) DO NOTHING;
    `);
  });

  beforeEach(() => {
    TranscriptStore.clearCache(testBookingContext.bookingId);
  });

  // ==========================================
  // 1. ALGORITHMIC RMS VAD & SEGMENTATION
  // ==========================================
  describe("Algorithmic RMS VAD & Audio Segmentation", () => {
    it("should calculate correct linear RMS and dBFS values", () => {
      const silence = new Float32Array(1600).fill(0);
      expect(AudioSegmenter.calculateRms(silence)).toBe(0);
      expect(AudioSegmenter.rmsToDbfs(0)).toBe(-100);

      // Constant amplitude wave at 0.5 peak
      const wave = new Float32Array(1600).fill(0.5);
      const rms = AudioSegmenter.calculateRms(wave);
      expect(rms).toBeCloseTo(0.5, 4);
      expect(AudioSegmenter.rmsToDbfs(rms)).toBeCloseTo(-6.02, 1);
    });

    it("should reject transient clicks shorter than the 30ms onset guard", () => {
      const segmenter = new AudioSegmenter(
        testBookingContext.bookingId,
        testBookingContext.studentUserId,
        "student",
        16000
      );

      // Single 10ms click frame (160 samples at 16kHz)
      const clickFrame = new Float32Array(160).fill(0.8);
      const result = segmenter.feed(clickFrame, 0.01);
      expect(result).toBeNull(); // Click ignored by 30ms onset guard

      // Followed by silence
      const silenceFrame = new Float32Array(1600).fill(0.0001);
      const afterSilence = segmenter.feed(silenceFrame, 0.11);
      expect(afterSilence).toBeNull();
    });

    it("should detect continuous speech and emit segment upon sentence pause boundary", () => {
      const segmenter = new AudioSegmenter(
        testBookingContext.bookingId,
        testBookingContext.studentUserId,
        "student",
        16000
      );

      // 1. Feed 600ms of active speech (0.3 amplitude)
      const speechChunk = new Float32Array(1600).fill(0.3); // 100ms per chunk
      for (let i = 0; i < 6; i++) {
        segmenter.feed(speechChunk, i * 0.1);
      }

      // 2. Feed 300ms of silence (exceeds 250ms sentence pause threshold)
      const silenceChunk = new Float32Array(1600).fill(0.0001);
      segmenter.feed(silenceChunk, 0.7);
      segmenter.feed(silenceChunk, 0.8);
      const emitted = segmenter.feed(silenceChunk, 0.9);

      expect(emitted).not.toBeNull();
      if (emitted) {
        expect(emitted.sessionId).toBe(testBookingContext.bookingId);
        expect(emitted.participantId).toBe(testBookingContext.studentUserId);
        expect(emitted.role).toBe("student");
        expect(emitted.durationSeconds).toBeGreaterThanOrEqual(0.6);
        expect(emitted.audioFormat).toBe("audio/wav");
        expect(typeof emitted.audioData).toBe("string");
      }
    });

    it("should correctly encode standard 16-bit Mono WAV headers", () => {
      const samples = new Float32Array(1600).fill(0.2); // 100ms at 16kHz
      const wavBytes = AudioSegmenter.encodeWav(samples, 16000);

      // RIFF header validation
      const view = new DataView(wavBytes.buffer);
      const riffHeader = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
      const waveFormat = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
      expect(riffHeader).toBe("RIFF");
      expect(waveFormat).toBe("WAVE");
      expect(view.getUint16(20, true)).toBe(1);     // PCM format
      expect(view.getUint16(22, true)).toBe(1);     // 1 channel (Mono)
      expect(view.getUint32(24, true)).toBe(16000); // 16kHz
      expect(view.getUint16(34, true)).toBe(16);    // 16 bits per sample
      expect(wavBytes.byteLength).toBe(44 + 1600 * 2); // 44 byte header + 3200 bytes PCM
    });
  });

  // ==========================================
  // 2. DETERMINISTIC SPEAKER ATTRIBUTION
  // ==========================================
  describe("Deterministic Track-Level Speaker Attribution", () => {
    it("should resolve student and mentor without voiceprints or local models", () => {
      const adapter = new SpeakerAttributionAdapter(testBookingContext);

      const studentRes = adapter.resolveSpeaker(testBookingContext.studentUserId);
      expect(studentRes.isAuthorized).toBe(true);
      expect(studentRes.role).toBe("student");
      expect(studentRes.name).toBe("Anant Kumar");

      const mentorRes = adapter.resolveSpeaker(testBookingContext.mentorUserId);
      expect(mentorRes.isAuthorized).toBe(true);
      expect(mentorRes.role).toBe("mentor");
      expect(mentorRes.name).toBe("Shivam Kumar Singh");
    });

    it("should reject unauthorized third-party participants from booking audio tracks", () => {
      const adapter = new SpeakerAttributionAdapter(testBookingContext);

      const intruderRes = adapter.resolveSpeaker("unauthorized-user-999", "Intruder User");
      expect(intruderRes.isAuthorized).toBe(false);
      expect(intruderRes.role).toBe("system");
      expect(adapter.isTrackAuthorized("unauthorized-user-999")).toBe(false);
    });
  });

  // ==========================================
  // 3. CLOUD SPEECH RECOGNITION ADAPTER
  // ==========================================
  describe("Cloud Speech Recognition & Noise Filtering", () => {
    it("should detect and reject Whisper hallucination patterns and loops", () => {
      const adapter = new SpeechRecognitionAdapter();

      expect(adapter.isHallucinationOrNoise("Thank you for watching.")).toBe(true);
      expect(adapter.isHallucinationOrNoise("Please like and subscribe!")).toBe(true);
      expect(adapter.isHallucinationOrNoise("Subtitles by Amara.org")).toBe(true);
      expect(adapter.isHallucinationOrNoise("")).toBe(true);
      expect(adapter.isHallucinationOrNoise("a")).toBe(true);

      // Repetition loops
      expect(adapter.isHallucinationOrNoise("you you you you you you")).toBe(true);
      expect(adapter.isHallucinationOrNoise("thank you thank you thank you thank you")).toBe(true);

      // Valid mentorship speech
      expect(adapter.isHallucinationOrNoise("Let's analyze the knapsack dynamic programming recurrence.")).toBe(false);
    });

    it("should produce deterministic mock transcripts in test mode", async () => {
      const adapter = new SpeechRecognitionAdapter();
      const envelope = {
        sessionId: testBookingContext.bookingId,
        segmentId: "seg-test-1",
        sequenceNumber: 1,
        participantId: testBookingContext.studentUserId,
        role: "student" as const,
        startTimeMs: 0,
        endTimeMs: 3000,
        durationSeconds: 3.0,
        audioFormat: "audio/wav" as const,
        audioData: "UklGRiQAAABXQVZFZm10...",
      };

      const result = await adapter.transcribe(envelope, { preferredLanguage: "en" });
      expect(result).not.toBeNull();
      if (result) {
        expect(result.original).toContain("dynamic programming");
        expect(result.lang).toBe("en");
        expect(result.confidence).toBeGreaterThan(0.9);
      }
    });
  });

  // ==========================================
  // 4. CLOUD TRANSLATION WITH TECHNICAL GLOSSARY
  // ==========================================
  describe("Cloud Translation Engine with Technical Glossary", () => {
    it("should preserve canonical technical terms via glossary post-processing", () => {
      const adapter = new TranslationAdapter();
      const rawText = "In DSA, we use DP and BST for optimizing LeetCode solutions before a Mock Interview.";
      const processed = adapter.applyGlossaryPostProcessing(rawText);

      expect(processed).toContain("Data Structures & Algorithms");
      expect(processed).toContain("Dynamic Programming");
      expect(processed).toContain("Binary Search Tree");
      expect(processed).toContain("Practice Technical Assessment");
    });

    it("should produce accurate Hindi translation in mock mode", async () => {
      const adapter = new TranslationAdapter();
      const text = "I was reviewing dynamic programming algorithms, specifically the knapsack problem.";
      const translation = await adapter.translate(text, "en", "hi");

      expect(translation).toContain("डायनेमिक प्रोग्रामिंग");
      expect(translation).toContain("नैपसैक");
    });
  });

  // ==========================================
  // 5. INCREMENTAL NOTES ENGINE (CICADA WINDOWING)
  // ==========================================
  describe("Incremental Meeting Notes Engine", () => {
    it("should enforce liveMaxTopics = 12 limit and generate fishbone diagrams", async () => {
      const engine = new MeetingNotesEngine();
      const mockSegments: TranscriptSegment[] = [
        {
          id: "seg-1",
          sessionId: testBookingContext.bookingId,
          lineIndex: 1,
          participantId: testBookingContext.studentUserId,
          speakerRole: "student",
          speakerName: "Anant Kumar",
          startTimeSeconds: 0,
          endTimeSeconds: 5,
          src: "I struggle with dynamic programming recurrence relations.",
          srcLang: "en",
          isFinal: true,
          confidence: 0.98,
          processingProvider: "cloud_stt",
          provenance: "transcript_extracted",
          createdAt: new Date().toISOString(),
        },
        {
          id: "seg-2",
          sessionId: testBookingContext.bookingId,
          lineIndex: 2,
          participantId: testBookingContext.mentorUserId,
          speakerRole: "mentor",
          speakerName: "Shivam Kumar Singh",
          startTimeSeconds: 6,
          endTimeSeconds: 15,
          src: "Let's formulate the 0/1 knapsack state table and backward array compression.",
          srcLang: "en",
          isFinal: true,
          confidence: 0.99,
          processingProvider: "cloud_stt",
          provenance: "transcript_extracted",
          createdAt: new Date().toISOString(),
        },
      ];

      const notes = await engine.updateNotes(testBookingContext.bookingId, null, mockSegments, false);

      expect(notes.topics.length).toBeLessThanOrEqual(12);
      expect(notes.topics.length).toBeGreaterThan(0);
      expect(notes.coveredLineCount).toBe(2);

      // Verify fishbone root-cause diagram is present
      const firstTopic = notes.topics[0];
      expect(firstTopic.fishbone).toBeDefined();
      if (firstTopic.fishbone) {
        expect(firstTopic.fishbone.question).toContain("Dynamic Programming");
        expect(firstTopic.fishbone.branches.length).toBeGreaterThanOrEqual(2);
      }

      // Verify action items and citations
      expect(notes.todos.length).toBeGreaterThan(0);
      expect(notes.todos[0].evidenceLines).toContain("L2");
      expect(notes.conclusions.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // 6. TRANSCRIPT STORE & REDACTION
  // ==========================================
  describe("Transcript Store & Student Redaction", () => {
    it("should guarantee monotonic line indexing", async () => {
      const seg1 = await TranscriptStore.appendSegment(testBookingContext.bookingId, {
        id: "s-1",
        sessionId: testBookingContext.bookingId,
        participantId: testBookingContext.studentUserId,
        speakerRole: "student",
        speakerName: "Anant",
        startTimeSeconds: 0,
        endTimeSeconds: 4,
        src: "First line",
        srcLang: "en",
        isFinal: true,
        confidence: 1.0,
        processingProvider: "cloud_stt",
        provenance: "transcript_extracted",
        createdAt: new Date().toISOString(),
      });

      const seg2 = await TranscriptStore.appendSegment(testBookingContext.bookingId, {
        id: "s-2",
        sessionId: testBookingContext.bookingId,
        participantId: testBookingContext.mentorUserId,
        speakerRole: "mentor",
        speakerName: "Shivam",
        startTimeSeconds: 5,
        endTimeSeconds: 9,
        src: "Second line",
        srcLang: "en",
        isFinal: true,
        confidence: 1.0,
        processingProvider: "cloud_stt",
        provenance: "transcript_extracted",
        createdAt: new Date().toISOString(),
      });

      expect(seg1.lineIndex).toBe(1);
      expect(seg2.lineIndex).toBe(2);

      const all = await TranscriptStore.getTranscript(testBookingContext.bookingId);
      expect(all.length).toBe(2);
      expect(all[0].lineIndex).toBe(1);
      expect(all[1].lineIndex).toBe(2);
    });

    it("should redact requested line indices completely", async () => {
      await TranscriptStore.appendSegment(testBookingContext.bookingId, {
        id: "s-10",
        sessionId: testBookingContext.bookingId,
        participantId: testBookingContext.studentUserId,
        speakerRole: "student",
        speakerName: "Anant",
        startTimeSeconds: 0,
        endTimeSeconds: 4,
        src: "My private email is secret@example.com",
        srcLang: "en",
        dst: "मेरा निजी ईमेल secret@example.com है",
        isFinal: true,
        confidence: 1.0,
        processingProvider: "cloud_stt",
        provenance: "transcript_extracted",
        createdAt: new Date().toISOString(),
      });

      await TranscriptStore.redactLines(testBookingContext.bookingId, [1], "student_request");

      const all = await TranscriptStore.getTranscript(testBookingContext.bookingId);
      expect(all[0].src).toBe("[REDACTED BY PARTICIPANT]");
      expect(all[0].dst).toBe("[REDACTED BY PARTICIPANT]");
    });
  });

  // ==========================================
  // 7. REPORT GENERATOR & PROVENANCE
  // ==========================================
  describe("14-Section Pedagogical Report Generator", () => {
    it("should construct full 14-section report with 5-tier provenance badges", async () => {
      const mockNotes: MeetingNotes = {
        title: "Dynamic Programming Mentorship",
        summary: "Comprehensive walkthrough of knapsack 1D compression.",
        topics: [
          {
            id: "t-1",
            startSeconds: 0,
            title: "0/1 Knapsack",
            summary: "Recurrence relation analysis",
            points: ["dp[w] = max(dp[w], dp[w-weight] + val)"],
            evidenceLines: ["L1", "L2"],
          },
        ],
        conclusions: [
          {
            id: "c-1",
            text: "Use 1D backward array iteration",
            evidenceLines: ["L2"],
          },
        ],
        todos: [
          {
            id: "td-1",
            text: "Solve LeetCode #416",
            owner: "student",
            evidenceLines: ["L2"],
            deadline: "Next week",
          },
        ],
        terms: [
          {
            name: "Memoization",
            note: "State cache",
            heardMisspellings: [],
          },
        ],
        unresolvedQuestions: ["What about fractional knapsack?"],
        coveredLineCount: 2,
        updatedAt: new Date().toISOString(),
        isFinal: true,
      };

      const report = MeetingReportGenerator.generateReport(testBookingContext, mockNotes, [], {
        mentorPrivateFeedback: "Candidate exhibits strong algorithmic intuition but needs faster recursion tracing.",
      });

      expect(report.bookingId).toBe(testBookingContext.bookingId);
      expect(report.studentReportedChallenges.length).toBeGreaterThan(0);
      expect(report.topicsDiscussed.length).toBe(1);
      expect(report.mentorGuidanceAndExplanations.length).toBe(1);
      expect(report.decisionsMade.length).toBe(1);
      expect(report.actionItems.length).toBe(1);
      expect(report.agreedMilestones.length).toBe(1);
      expect(report.unresolvedQuestions.length).toBe(1);
      expect(report.nextSessionAgenda.length).toBe(1);
      expect(report.verifiedResourcesRecommended.length).toBe(1);

      // Verify Markdown export excludes private feedback when student views
      const studentMarkdown = MeetingReportGenerator.exportMarkdown(report, false);
      expect(studentMarkdown).not.toContain("Mentor Private Notes");
      expect(studentMarkdown).not.toContain("Candidate exhibits strong algorithmic intuition");

      // Verify Markdown export includes private feedback when mentor views
      const mentorMarkdown = MeetingReportGenerator.exportMarkdown(report, true);
      expect(mentorMarkdown).toContain("Mentor Private Notes");
      expect(mentorMarkdown).toContain("Candidate exhibits strong algorithmic intuition");
    });
  });

  // ==========================================
  // 8. MENTORSHIP BRIDGE & OUTBOX SYNC
  // ==========================================
  describe("Mentorship Bridge & AI Tathastu Outbox Synchronization", () => {
    it("should format 7-part deterministic outbox idempotency key and fail closed without consent", async () => {
      const mockReport = MeetingReportGenerator.generateReport(
        testBookingContext,
        {
          title: "Session",
          summary: "Summary",
          topics: [],
          conclusions: [],
          todos: [],
          terms: [],
          unresolvedQuestions: [],
          coveredLineCount: 0,
          updatedAt: new Date().toISOString(),
          isFinal: true,
        },
        []
      );

      // 1. Without consent, sync fails closed and returns null
      const syncWithoutConsent = await MentorshipBridgeAdapter.syncToTathastuOutbox(mockReport);
      expect(syncWithoutConsent).toBeNull();

      // 2. Grant explicit consent
      await StudentConsentService.grantConsent(
        testBookingContext.studentUserId,
        "ai_tathastu_sync",
        "Test consent grant",
        testBookingContext.studentUserId
      );

      // 3. With consent, sync generates the canonical 7-part key
      const expectedKeyPrefix = `ai-tathastu:meeting-intelligence-sync:${testBookingContext.studentUserId}:booking:${testBookingContext.bookingId}`;
      const idempotencyKey = await MentorshipBridgeAdapter.syncToTathastuOutbox(mockReport);

      expect(idempotencyKey).not.toBeNull();
      if (idempotencyKey) {
        expect(idempotencyKey.startsWith(expectedKeyPrefix)).toBe(true);
        const parts = idempotencyKey.split(":");
        expect(parts.length).toBe(7);
      }
    });
  });
});
