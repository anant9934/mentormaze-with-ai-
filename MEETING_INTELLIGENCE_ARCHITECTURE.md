# MentorMaze × Cicada Meeting Intelligence Subsystem Architecture
**Official Platform**: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)  
**Document**: Architecture Specification & Integration Blueprint  
**Subsystem**: `lib/meeting-intelligence/`  
**Date**: November 2026  
**Status**: ACTIVE ARCHITECTURE SPECIFICATION  

---

## 1. System Overview & Integration Goals

The Meeting Intelligence Subsystem transforms the proven architectural patterns of **Cicada** into a native, cloud-first feature inside MentorMaze's LiveKit WebRTC sessions (`/sessions/[id]/live`). Students and mentors conduct 1-on-1 mentorship, group mentoring, and technical mock interviews with real-time multilingual transcription, live translated subtitles, incremental AI meeting notes, and automatic action-item tracking—without running separate desktop tools or on-device inference.

```
+-------------------------------------------------------------------------------------------------------------+
|                                    LIVEKIT WEBRTC MENTORSHIP SESSION                                        |
|                                       (/sessions/[id]/live)                                                 |
|                                                                                                             |
|   +----------------------------+   LiveKit MediaStream Tracks   +---------------------------------------+   |
|   |   Student Local Mic Track  | -----------------------------> |        AudioSessionManager            |   |
|   +----------------------------+                                |  - Verifies Booking & Auth            |   |
|   +----------------------------+   LiveKit Remote Audio Track   |  - Isolates Student / Mentor Tracks   |   |
|   |   Mentor Remote Mic Track  | -----------------------------> |  - Rejects Unauthorized Participants  |   |
|   +----------------------------+                                +---------------------------------------+   |
|                                                                                     |                       |
+-------------------------------------------------------------------------------------|-----------------------+
                                                                                      v
                                                                 +----------------------------------------+
                                                                 |            AudioSegmenter              |
                                                                 |  - Cicada Algorithmic VAD (RMS Energy) |
                                                                 |  - 30ms Onset Guard / 0.5 Hold Decay   |
                                                                 |  - 120ms Pause Boundary Detection      |
                                                                 |  - Monotonic Segment Sequencing        |
                                                                 +----------------------------------------+
                                                                                      |
                                            +-----------------------------------------+-----------------------------------------+
                                            v                                                                                   v
                         +--------------------------------------+                                            +--------------------------------------+
                         |    CloudSpeechRecognitionAdapter     |                                            |      SpeakerAttributionAdapter       |
                         |  - Streaming / Chunked Cloud STT     |                                            |  - LiveKit Participant Identity      |
                         |  - English, Hindi & Hinglish Support |                                            |  - Track-Level Role Binding          |
                         |  - Multilingual Language ID          |                                            |  - Zero Local Voiceprints            |
                         +--------------------------------------+                                            +--------------------------------------+
                                            |                                                                                   |
                                            +-----------------------------------------+-----------------------------------------+
                                                                                      v
                                                                 +----------------------------------------+
                                                                 |            TranscriptStore             |
                                                                 |  - Line Ordering & Idempotency         |
                                                                 |  - Raw Speech (`src`, `srcLang`)       |
                                                                 |  - Provenance Tracking                 |
                                                                 +----------------------------------------+
                                                                                      |
                                            +-----------------------------------------+-----------------------------------------+
                                            v                                                                                   v
                         +--------------------------------------+                                            +--------------------------------------+
                         |       CloudTranslationAdapter        |                                            |          MeetingNotesEngine          |
                         |  - Real-Time Subtitles (EN <-> HI)   |                                            |  - Incremental 45s Aggregation       |
                         |  - Cicada Terminology Glossary       |                                            |  - Settled / Editable Topic Windows  |
                         |  - Strict Text Separation (`dst`)    |                                            |  - Action Items & Owner Attribution  |
                         +--------------------------------------+                                            |  - Verifiable Evidence Citations     |
                                            |                                                                +--------------------------------------+
                                            |                                                                                   |
                                            +-----------------------------------------+-----------------------------------------+
                                                                                      v
                                                                 +----------------------------------------+
                                                                 |        MeetingReportGenerator          |
                                                                 |  - Pedagogical Assessment Synthesis    |
                                                                 |  - Structured JSON & Markdown Export   |
                                                                 |  - 5-Category Provenance Categorization|
                                                                 +----------------------------------------+
                                                                                      |
                                                                                      v
                                                                 +----------------------------------------+
                                                                 |       MentorshipBridgeService          |
                                                                 |  - Student & Mentor Redaction / Review |
                                                                 |  - Explicit Approval Gate              |
                                                                 |  - ASTRION Intelligence Graph Injection|
                                                                 |  - AI Tathastu Sync (Consent Epochs)   |
                                                                 +----------------------------------------+
```

---

## 2. Audio Ingestion Architecture Decision

We evaluated the two LiveKit audio capture topologies specified in Phase D:

1. **Architecture Option A (LiveKit Egress / Server-Side Agent):**
   - LiveKit Server streams participant tracks via TrackEgress or an external SIP/RTMP worker daemon to a cloud transcription backend.
   - *Limitation in Free Tier*: Requires LiveKit Egress quota, dedicated compute instances, and persistent worker daemons, which are not always available on free-tier Render services.
2. **Architecture Option B (Direct Client-Side LiveKit Track Subscription & Web Worker Segmenter):**
   - The web client inside `/sessions/[id]/live` is already securely connected to the LiveKit room via WebRTC and already receives decoded PCM streams for all participant audio tracks (`Track.Kind.Audio`).
   - Using the browser's standard Web Audio API (`AudioContext`, `ScriptProcessorNode` / `AudioWorkletNode`), the client runs Cicada's non-ML RMS VAD algorithm in real time on separate participant tracks.
   - Only active voice segments (compact PCM/WAV slices) are dispatched to authenticated cloud STT endpoints (`/api/meeting-intelligence/transcript`), completely bypassing long-running audio buffers on serverless functions.
   - *Result*: Zero local AI inference, zero server egress fees, sub-100ms latency, deterministic speaker attribution, and full resilience across Vercel and Render free tiers.

**Architectural Decision**: MentorMaze implements **Option B** as the primary real-time pipeline, backed by server-side verification and cloud STT adapters.

---

## 3. Subsystem Component Responsibilities

### 3.1 AudioSessionManager (`lib/meeting-intelligence/audio-session-manager.ts`)
- **Lifecycle Control**: Controls starting, pausing, resuming, and stopping intelligence capture during an active LiveKit booking.
- **Authorization Verification**: Validates the student user ID, mentor user ID, booking status (`confirmed` or `in_progress`), and valid join window before accepting audio.
- **Track Isolation**: Binds student microphone audio to role `student` and mentor audio to role `mentor`. Rejects unauthenticated audio or third-party observers.
- **State Synchronizer**: Emits real-time connection, capture, and error status to the UI.

### 3.2 AudioSegmenter (`lib/meeting-intelligence/audio-segmenter.ts`)
- **Algorithmic VAD**: Reuses Cicada's `VoiceActivity` state machine using pure RMS signal energy.
- **Timing Hysteresis**: Enforces `onset = 0.03s` (30ms) speech onset guard, `hold = 0.5` speech hold decay, and `shortestPause = 0.12s` (120ms) pause detection.
- **Sentence Boundary Detection**: Automatically cuts segments at natural pauses between 120ms and 500ms, or when maximum segment duration (10s) is reached.
- **Sequencing & Idempotency**: Assigns monotonic segment sequence numbers per participant for ordered, retry-safe delivery.

### 3.3 CloudSpeechRecognitionAdapter (`lib/meeting-intelligence/speech-recognition-adapter.ts`)
- **Cloud STT Interface**: Dispatches audio segments to verified cloud providers (OpenAI Whisper Cloud API, Google Cloud Speech-to-Text, Deepgram).
- **Multilingual Support**: Transcribes English, Hindi, and Hinglish. Automatically detects spoken language (`srcLang`).
- **Hallucination & Noise Filtering**: Reuses Cicada's `CloudHearing.isNoise` heuristics to discard audio artifacts, repeated phantom tokens, and non-speech sounds.

### 3.4 SpeakerAttributionAdapter (`lib/meeting-intelligence/speaker-attribution-adapter.ts`)
- **Deterministic Attribution**: Uses the LiveKit participant identity (`room.localParticipant.identity`, `RemoteParticipant.identity`) and track source to attribute every utterance.
- **Zero Voiceprints**: Fully complies with constraint #5 (no local voiceprint or Core ML speaker-identification models).

### 3.5 CloudTranslationAdapter (`lib/meeting-intelligence/translation-adapter.ts`)
- **Live Subtitles**: Translates speech in real time (English &rarr; Hindi, Hindi &rarr; English, etc.).
- **Terminology Glossary**: Reuses Cicada's glossary mechanism—extracts established technical terms and names from `MeetingNotes` and supplies them to the translation model to guarantee terminological consistency.
- **Strict Separation**: Stores original text (`src`, `srcLang`) and translated text (`dst`, `dstLang`) in separate fields; the original transcript is never overwritten.

### 3.6 MeetingNotesEngine (`lib/meeting-intelligence/meeting-notes-engine.ts`)
- **Incremental Live Notes**: Every ~45 seconds of active speech, requests an updated JSON notes snapshot from cloud LLMs via `ModelProviderRouter`.
- **Windowed Topic Aggregation**: Implements Cicada's settled vs. editable topic window (`editableTopics = 2`, `liveMaxTopics = 12`) to keep token usage bounded regardless of meeting duration.
- **Evidence-Backed Attribution**: Every extracted point, topic, conclusion, and to-do must reference source transcript line IDs (`evidence: ["L4", "L5"]`).
- **Owner Resolution**: Maps action items to verified participants (`student`, `mentor`).

### 3.7 TranscriptStore (`lib/meeting-intelligence/transcript-store.ts`)
- **Persistence & Isolation**: Stores transcript segments in Neon PostgreSQL / in-memory DB keyed by `bookingId`.
- **Audit Provenance**: Every record carries a provenance badge (`transcript_extracted`), timestamps, speaker identity, and confidence score.

### 3.8 MeetingReportGenerator (`lib/meeting-intelligence/meeting-report-generator.ts`)
- **End-of-Session Synthesis**: Produces the comprehensive Mentorship Intelligence Report.
- **14 Structured Sections**: Session overview, verified roles, challenges discussed, mentor explanations, decisions made, action items with owners and deadlines, unresolved questions, and next session agenda.
- **Five-Tier Provenance Badging**: Explicitly tags statements as `student_reported`, `mentor_recorded`, `transcript_extracted`, `assessment_verified`, or `ai_inferred`.

### 3.9 MentorshipBridgeAdapter (`lib/meeting-intelligence/mentorship-bridge-adapter.ts`)
- **Review & Approval Workflow**: Enables students and mentors to review the report, redact sensitive discussions, and provide explicit cryptographic/timestamped sign-off.
- **ASTRION Context Injection**: Injects approved mentorship milestones and growth areas into ASTRION's `PermissionAwareContextBuilder` and `StudentIntelligenceGraph`.
- **AI Tathastu Outbox Synchronization**: Transmits approved session outcomes to the external AI Tathastu ecosystem using deterministic idempotency keys and active consent epochs.

---

## 4. Compliance with Non-Negotiable Constraints

| Constraint | Enforcement Strategy |
| :--- | :--- |
| **1–3: No local AI / LLM models** | All generative notes, translations, and summaries execute via `ModelProviderRouter` calling official cloud APIs (Gemini, OpenAI, Anthropic, Groq). |
| **4–5: No local STT or voiceprint models** | Excluded Core ML `SpeakerEmbedding.mlpackage` and Apple SpeechAnalyzer. Speech attribution uses LiveKit WebRTC track identities; STT uses cloud APIs. |
| **6: Cloud APIs for STT/translation/LLM** | STT, translation, and structured LLM extraction use cloud API adapters with backoff, circuit breaking, and retry logic. |
| **7: LiveKit Infrastructure** | Directly hooks into MentorMaze's existing LiveKit Cloud provider (`wss://meet-2uq83g48.livekit.cloud`). |
| **8–9: Preserve ASTRION & Bridge** | Notes and reports seamlessly flow into `StudentIntelligenceGraph` and `MentorshipBridgeService`. |
| **10: AI Tathastu Sync & Consent** | Strict gating: no outbox sync occurs without verified student consent under the active consent epoch. |
| **11: Auth & Session Lifecycle** | Reuses existing `bookings`, `sessionNotes`, and `users` tables; verifies participant ownership. |
| **12–13: No paid calls / No production push** | Mock/sandbox fallback modes enabled; all development executed locally and on staging. |
| **14–15: Do not modify or copy Cicada app** | Upstream repository is referenced for algorithms and architectures only; no desktop binaries or macOS frameworks copied. |
