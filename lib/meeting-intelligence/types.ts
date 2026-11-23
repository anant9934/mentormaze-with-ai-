/**
 * MentorMaze Meeting Intelligence Types & Contracts
 * Adapted from Cicada (Apache-2.0 License - https://github.com/wquguru/cicada)
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 */

export type ProvenanceBadge =
  | "student_reported"
  | "assessment_verified"
  | "mentor_recorded"
  | "transcript_extracted"
  | "ai_inferred"
  | "external_ecosystem";

export type SessionIntelligenceStatus =
  | "idle"
  | "capturing"
  | "paused"
  | "processing"
  | "completed"
  | "error";

export interface TranscriptSegment {
  id: string;                       // e.g. "seg-101-1"
  sessionId: string;                // MentorMaze booking ID
  lineIndex: number;                // 1-based sequential line index ("L1", "L2")
  participantId: string;            // User ID
  speakerRole: "student" | "mentor" | "system";
  speakerName: string;
  startTimeSeconds: number;         // Start offset from session start
  endTimeSeconds: number;           // End offset from session start
  src: string;                      // Verbatim original spoken speech
  srcLang: string;                  // BCP-47 language tag (e.g. "en", "hi", "hi-Latn")
  dst?: string;                     // Translated text
  dstLang?: string;                 // BCP-47 target language tag
  isFinal: boolean;                 // true if finalized; false if partial draft
  confidence: number;               // [0.0 - 1.0]
  processingProvider: string;       // Cloud STT provider
  provenance: ProvenanceBadge;      // Always "transcript_extracted"
  createdAt: string;                // ISO timestamp
}

export interface FishboneBranch {
  label: string;                    // Short branch label (2-6 words)
  detail: string;                   // Short explanation
  timestamp?: number;               // Seconds from session start
  supportLineCount: number;         // Supporting line count
}

export interface FishboneDiagram {
  question: string;                 // Question or problem
  branches: FishboneBranch[];
}

export interface NoteTopic {
  id: string;                       // Composite key: `${startSeconds}-${slug}`
  startSeconds: number;             // When topic started
  title: string;                    // Short topic title (<= 12 chars / 6 words)
  summary: string;                  // Single-sentence summary of the topic (<= 40 chars)
  points: string[];                 // Up to 4 key takeaways
  pointTimes?: (number | null)[];   // Spoken timestamps for each point
  evidenceLines: string[];          // Line citations (e.g. ["L3", "L4"])
  fishbone?: FishboneDiagram | null;
}

export interface NoteItem {
  id: string;
  text: string;
  owner?: string | null;            // "student" | "mentor" | participant name
  evidenceLines: string[];          // Line citations (e.g. ["L15"])
  timestamp?: number | null;        // Seconds when spoken
  isCompleted?: boolean;
  deadline?: string | null;         // Stated deadline
}

export interface NoteTerm {
  name: string;                     // Canonical spelling
  note: string;                     // Definition or role
  heardMisspellings: string[];      // Misrecognitions observed
}

export interface MeetingNotes {
  title?: string;                   // Auto-generated meeting title
  summary: string;                  // 2-3 sentence executive summary
  topics: NoteTopic[];              // Chronologically ordered topics
  conclusions: NoteItem[];          // Explicit outcomes
  todos: NoteItem[];                // Action items assigned to participants
  terms: NoteTerm[];                // Session terminology glossary
  unresolvedQuestions: string[];    // Questions left unanswered
  coveredLineCount: number;         // Number of transcript lines covered
  updatedAt: string;                // ISO timestamp of last update
  isFinal: boolean;                 // true if post-session complete pass; false if live
}

export interface AudioSegmentEnvelope {
  sessionId: string;
  segmentId: string;
  sequenceNumber: number;
  participantId: string;
  role: "student" | "mentor";
  startTimeMs: number;
  endTimeMs: number;
  durationSeconds: number;
  audioFormat: "audio/wav" | "audio/pcm";
  audioData: string;                // Base64 encoded WAV/PCM audio
}

export interface CloudHeard {
  lang: string;
  original: string;
  translation?: string;
  confidence: number;
}

export interface MentorshipIntelligenceReport {
  id: string;
  bookingId: string;
  sessionTitle: string;
  sessionType: string;
  studentUserId: string;
  studentName: string;
  mentorUserId: string;
  mentorName: string;
  startTimeUtc: string;
  endTimeUtc: string;
  durationMinutes: number;
  studentReportedChallenges: {
    challenge: string;
    evidence: string;
    provenance: ProvenanceBadge;
  }[];
  topicsDiscussed: {
    topic: string;
    summary: string;
    durationSeconds: number;
    evidenceLines: string[];
    provenance: ProvenanceBadge;
  }[];
  mentorGuidanceAndExplanations: {
    guidance: string;
    context: string;
    evidenceLines: string[];
    provenance: ProvenanceBadge;
  }[];
  decisionsMade: {
    decision: string;
    agreedBy: string;
    evidenceLines: string[];
    provenance: ProvenanceBadge;
  }[];
  actionItems: {
    task: string;
    owner: string;
    ownerRole: "student" | "mentor";
    deadline?: string;
    evidenceLines: string[];
    provenance: ProvenanceBadge;
  }[];
  agreedMilestones: {
    milestone: string;
    targetDate?: string;
    provenance: ProvenanceBadge;
  }[];
  unresolvedQuestions: {
    question: string;
    raisedBy: string;
    provenance: ProvenanceBadge;
  }[];
  nextSessionAgenda: {
    proposedFocus: string;
    provenance: ProvenanceBadge;
  }[];
  verifiedResourcesRecommended: {
    title: string;
    url?: string;
    discussionContext: string;
    provenance: ProvenanceBadge;
  }[];
  executiveSummary: string;
  mentorPrivateFeedback?: string;   // Confidential to mentor and admin only
  reviewStatus: "pending_review" | "student_reviewed" | "mentor_reviewed" | "approved" | "contested";
  studentCorrections?: string;
  mentorCorrections?: string;
  injectedIntoAstrion: boolean;
  syncedToTathastu: boolean;
  createdAt: string;
  updatedAt: string;
}
