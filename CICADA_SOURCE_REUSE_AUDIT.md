# Cicada Source & Architectural Reuse Audit for MentorMaze
**Ecosystem**: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)  
**Upstream Reference**: Cicada (https://github.com/wquguru/cicada, https://cicada.indaloop.app/)  
**License**: Apache License 2.0 (Copyright 2024–2026 Cicada Contributors)  
**Date**: November 2026  
**Status**: APPROVED FOR INTEGRATION  

---

## 1. Executive Summary

This audit assesses the open-source **Cicada** codebase for integration into **MentorMaze**, the human mentorship and mock interview platform under AI Tathastu. The goal is to provide first-class meeting intelligence (real-time multilingual transcription, translation, dynamic meeting notes, action-item extraction, and post-session pedagogical summaries) inside MentorMaze's LiveKit WebRTC sessions without requiring users to launch external tools or install desktop applications.

In strict adherence to the project's non-negotiable architectural constraints, all local ML execution (Core ML, Apple SpeechAnalyzer, local voiceprint embeddings, Ollama, BlackHole drivers) is **excluded**. Instead, Cicada's proven algorithmic designs—specifically its voice activity detection (VAD), pause-based sentence segmentation, incremental meeting notes extraction, glossary-anchored translation, and structured share projections—are abstracted and ported into a pure TypeScript/Node.js subsystem powered exclusively by cloud APIs.

---

## 2. Reusable Components & Architectural Mapping

| Cicada Component | Upstream Implementation | MentorMaze Reusable Concept & Port Target | Architectural Mapping & Modifications |
| :--- | :--- | :--- | :--- |
| **NotesEngine** | `Sources/Cicada/Notes.swift` | `MeetingNotesEngine` (`lib/meeting-intelligence/meeting-notes-engine.ts`) | Ported incremental 45s note aggregation, topic windowing (`liveMaxTopics=12`), fishbone root-cause extraction, terminology glossary tracking, and evidence-line attribution (`[L1 00:15 你]`). Backed by cloud LLMs via `ModelProviderRouter`. |
| **MeetingNotes & NoteTopic** | `Sources/Cicada/Notes.swift` | `MeetingNotes`, `NoteTopic`, `NoteItem`, `NoteTerm` | Standardized JSON schema representing meeting title, executive summary, chronologically ordered topics with timestamped points, conclusions with line evidence, and assigned to-dos with speaker attribution. |
| **AudioRouter & VoiceActivity** | `Sources/Cicada/VoiceActivity.swift` | `AudioSegmenter` (`lib/meeting-intelligence/audio-segmenter.ts`) | Reused pure algorithmic energy/RMS Voice Activity Detection (`feed(rms:seconds:clock:)`), onset threshold (0.03s), hold decay factor (0.5), and minimum pause detection (0.12s) to segment speech without local ML models. |
| **CloudHearing** | `Sources/Cicada/CloudHearing.swift` | `CloudSpeechRecognitionAdapter` (`lib/meeting-intelligence/speech-recognition-adapter.ts`) | Ported cloud audio transcription prompt format, BCP-47 language normalization, hallucination/noise filtering (`isNoise` heuristics), and structured reply parsing. |
| **Translator & GoogleHealth** | `Sources/Cicada/Translator.swift` | `CloudTranslationAdapter` (`lib/meeting-intelligence/translation-adapter.ts`) | Reused glossary-anchored translation chaining, term preservation, and circuit breaker/exponential backoff (`GoogleHealth` pattern) to guarantee translation resiliency for English, Hindi, and Hinglish. |
| **SessionStore & TranscriptLine** | `Sources/Cicada/SessionStore.swift` | `TranscriptStore` (`lib/meeting-intelligence/transcript-store.ts`) | Reused session data model: segment ID, session ID, timestamp `t`, speaker role, original text `src`, translation `dst`, language tags, and line fixes. Stored in Neon PostgreSQL / in-memory DB with idempotency guarantees. |
| **ShareProjection** | `Sources/Cicada/ShareProjection.swift` | `MeetingReportGenerator` (`lib/meeting-intelligence/meeting-report-generator.ts`) | Adapted privacy-preserving projection: strips raw device paths, separates public summary from private mentor notes, and formats clean Markdown/JSON artifacts for student and mentor review. |
| **Document Validation** | `server/src/doc.js`, `review.js` | API validation schemas (`lib/meeting-intelligence/schemas.ts`) | Adapted Cloudflare Worker JSON payload validation to enforce schema integrity and reject malformed transcript or note structures. |

---

## 3. Explicitly Excluded Components (Non-Negotiable Constraints)

The following components from the upstream Cicada repository are **strictly excluded** from MentorMaze to maintain cloud compliance, zero-local-inference requirements, and platform portability:

1. **Apple on-device SpeechAnalyzer / SFSpeechRecognizer (`Sources/Cicada/Recognition.swift`):**
   - *Reason for Exclusion*: Requires native Apple macOS/iOS frameworks and runs on-device neural models. Excluded in favor of unified cloud STT providers.
2. **Core ML Voiceprint & Speaker Identification (`Resources/models/SpeakerEmbedding.mlpackage`, `SpeakerID.swift`):**
   - *Reason for Exclusion*: Relies on local Core ML embedding models and local voiceprint libraries. Excluded in favor of deterministic LiveKit participant track identity and cloud diarization.
3. **BlackHole Virtual Microphone Audio Driver (`Sources/Cicada/VirtualMic.swift`, `SystemAudioTap.swift`):**
   - *Reason for Exclusion*: Requires host kernel extensions / audio loopback drivers. Excluded because MentorMaze accesses audio natively via WebRTC MediaStream tracks in the LiveKit room.
4. **Local LLM / Ollama Integrations (`Sources/Cicada/AIProviders.swift` - Ollama/LMStudio):**
   - *Reason for Exclusion*: Violates constraint forbidding local/self-hosted AI inference. Excluded in favor of cloud LLMs configured in `ModelProviderRouter` (Google Gemini, OpenAI, Anthropic, Groq).
5. **Desktop App Shell / Native AppKit & SwiftUI UI (`Sources/Cicada/Views.swift`, `Overlay.swift`, `ListenPill.swift`):**
   - *Reason for Exclusion*: MentorMaze is a responsive web application. Excluded in favor of native React/Tailwind/shadcn UI embedded directly inside `/sessions/[id]/live`.

---

## 4. Reused Algorithms & Mathematical Formulations

### A. Algorithmic Voice Activity Detection (VAD)
Cicada implements an efficient, non-machine-learning VAD based on Root-Mean-Square (RMS) signal energy:
$$\text{RMS} = \sqrt{\frac{1}{N} \sum_{i=0}^{N-1} s_i^2}$$

The signal state transitions between **Silence** and **Voiced** using double-threshold hysteresis and timing guards:
1. **Onset Guard**: A loud sound must persist for $\ge 30\,\text{ms}$ (`onset = 0.03s`) before transitioning from silence to active speech. This rejects transient clicks, keyboard clatter, and microphone pops.
2. **Hold Decay**: Once speech is detected, audio is considered active down to $0.5 \times \text{threshold}$ (`hold = 0.5`) to prevent word-final consonants and breathy closures from prematurely fragmenting the segment.
3. **Pause Boundary**: A contiguous silence run $\ge 120\,\text{ms}$ (`shortestPause = 0.12s`) marks a natural pause boundary suitable for speech segmentation.

### B. Incremental Notes Windowing & Compression
To prevent token explosion in long meetings, Cicada's `NotesEngine` divides the transcript into frozen settled topics and active editable topics:
- **Editable Topic Window**: Only the most recent $k = 2$ topics are modified during live 45-second updates; earlier topics are marked *settled* and frozen to preserve stability and bounded token usage.
- **Topic Joining**: If the total topic count exceeds `liveMaxTopics = 12`, the algorithm identifies the two chronologically adjacent settled topics that span the least time ($\Delta t = t_{i+1} - t_i$) and merges them into a single compound topic.
- **Evidence Preservation**: Every extracted summary point, topic, conclusion, and to-do must maintain an `evidence` array pointing to source line identifiers (e.g. `["L12", "L13"]`), ensuring verifiable provenance.

---

## 5. Licensing & Attribution Notice

The reusable logic adapted from Cicada is licensed under the **Apache License, Version 2.0**.

```text
Copyright 2024–2026 Cicada Contributors (https://github.com/wquguru/cicada)
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

All ported files inside MentorMaze (`lib/meeting-intelligence/*`) preserve this copyright notice and clearly state adaptations made for MentorMaze and AI Tathastu.
