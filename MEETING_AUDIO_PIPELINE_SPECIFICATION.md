# Meeting Audio Pipeline Specification
**Subsystem**: MentorMaze Meeting Intelligence (`lib/meeting-intelligence/`)  
**Ecosystem**: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)  
**Date**: November 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. Scope & Objective

This specification details the end-to-end audio processing pipeline connecting LiveKit WebRTC participant audio tracks to cloud speech recognition, cloud translation, and structured meeting notes.

---

## 2. Ingestion & Track Disaggregation

### 2.1 LiveKit WebRTC Track Binding
1. When a user connects to a LiveKit room in `/sessions/[id]/live`:
   - The local participant's audio track is acquired via `navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })`.
   - Remote participants' audio tracks are acquired via LiveKit `RoomEvent.TrackSubscribed` when `track.kind === Track.Kind.Audio`.
2. Each audio track is passed to an isolated `AudioTrackProcessor` pipeline:
   - **Student Audio Stream**: Bound to `participantId: studentUserId`, `role: "student"`.
   - **Mentor Audio Stream**: Bound to `participantId: mentorUserId`, `role: "mentor"`.
   - Audio from any participant without an active, verified booking record is immediately dropped.

### 2.2 PCM Decoding & Format Standardization
Each audio stream is processed via the Web Audio API (`AudioContext` or audio worklet):
- **Sample Rate**: Standardized to 16,000 Hz (16 kHz mono).
- **Bit Depth**: 16-bit linear PCM (or 32-bit Float normalized to $[-1.0, 1.0]$).
- **Channels**: 1 (mono).
- **Block Size**: 160 samples per block (10 ms frame at 16 kHz).

---

## 3. Algorithmic Voice Activity Detection (VAD)

To satisfy the non-negotiable constraint forbidding local neural networks or ML models, voice activity detection is implemented using Cicada's proven algorithmic energy-gate state machine:

### 3.1 Signal Metric (RMS Energy)
For each 10 ms audio frame $F_k = [s_0, s_1, \dots, s_{M-1}]$ where $M = 160$:
$$\text{RMS}_k = \sqrt{\frac{1}{M} \sum_{i=0}^{M-1} s_i^2}$$
$$\text{dBFS}_k = 20 \log_{10}(\text{RMS}_k + \epsilon)$$

### 3.2 State Machine Parameters
1. **Adaptive Noise Floor ($N_{\text{floor}}$)**:
   - Initialized at $-55\,\text{dBFS}$.
   - Dynamically tracks ambient background noise during confirmed silence runs using an exponential moving average:
     $$N_{\text{floor}} \leftarrow (1 - \alpha) N_{\text{floor}} + \alpha \cdot \text{dBFS}_k \quad (\alpha = 0.05)$$
2. **Speech Threshold ($\Theta_{\text{speech}}$)**:
   - Set to $\max(-42\,\text{dBFS}, N_{\text{floor}} + 12\,\text{dB})$.
3. **Onset Guard ($\tau_{\text{onset}} = 30\,\text{ms}$)**:
   - Energy must exceed $\Theta_{\text{speech}}$ for 3 consecutive 10 ms blocks before transitioning from `SILENCE` to `VOICED`.
   - Prevents transient acoustic spikes (keyboard taps, mouse clicks) from triggering false voice segments.
4. **Hold Factor ($H_{\text{factor}} = 0.5$)**:
   - Once speech is active, the frame is classified as voiced down to $0.5 \times \Theta_{\text{speech}}$ (a $6\,\text{dB}$ margin below threshold) to preserve low-energy word endings and unstressed syllables.
5. **Pause Detection ($\tau_{\text{pause}} = 120\,\text{ms}$)**:
   - A contiguous run of frames below threshold lasting $\ge 120\,\text{ms}$ marks a natural pause boundary.

---

## 4. Audio Segmentation & Dispatch

### 4.1 Segment Boundary Rules
An active audio segment is finalized and dispatched to the cloud STT pipeline under any of the following conditions:
1. **Natural Sentence Pause**: Speech is followed by a silence run $\ge 250\,\text{ms}$.
2. **Maximum Duration Window**: Continuous speech reaches $8.0\,\text{seconds}$ (to prevent cloud timeout and preserve real-time UI interactivity).
3. **Participant Mute / Stream End**: The participant mutes their microphone or disconnects from the session.

Segments shorter than $0.25\,\text{seconds}$ containing no phonetic energy are discarded as background noise.

### 4.2 Sequence Ordering & Metadata
Each segment dispatched to the cloud carries immutable envelope metadata:
```typescript
interface AudioSegmentEnvelope {
  sessionId: string;          // MentorMaze booking ID
  segmentId: string;          // Deterministic UUID
  sequenceNumber: number;     // Monotonically increasing sequence per participant
  participantId: string;      // Verified User ID
  role: "student" | "mentor"; // Verified Role
  startTimeMs: number;        // Session-relative start timestamp
  endTimeMs: number;          // Session-relative end timestamp
  durationSeconds: number;    // Segment length in seconds
  audioFormat: "audio/wav";   // 16kHz mono 16-bit PCM WAV
  audioData: string;          // Base64 encoded payload
}
```

---

## 5. Cloud Speech Recognition Adapter

1. **Protocol**: HTTP/2 POST or WebSocket stream to approved cloud providers.
2. **Primary Cloud Provider**: OpenAI Whisper Cloud API (`/v1/audio/transcriptions`) or Google Cloud Speech-to-Text v2.
3. **Multilingual Settings**:
   - Model parameters: `language: null` (enables automatic cloud language identification between English, Hindi, and regional dialects).
   - Temperature: $0.0$ for deterministic, hallucination-free transcription.
4. **Cicada Noise & Hallucination Filter**:
   - Rejects common Whisper phantom tokens on silent or noisy segments (e.g., `"Thank you."`, `"Subtitles by..."`, `"Bye!"`, `"NONE"`).
   - Rejects text with no alphanumeric characters or repeating token loops.

---

## 6. Cloud Translation & Subtitle Chaining

1. **Trigger**: Occurs immediately upon generation of a final transcript line if translation is active.
2. **Default Direction**:
   - If spoken language is Hindi (`hi`) or Hinglish &rarr; translates to English (`en`).
   - If spoken language is English (`en`) &rarr; translates to Hindi (`hi`).
3. **Cicada Terminology Glossary**:
   - The translation adapter automatically injects extracted terms and mentor names from `MeetingNotes.terms` into the translation context so domain terms (e.g., "dynamic programming", "event loop", "idempotency key") are translated consistently throughout the session.
4. **Data Isolation**: Original speech is preserved in `src`; translated text is stored in `dst`.

---

## 7. Fault Tolerance & Circuit Breaking

- **Network Interruption**: In-flight audio segments are retained in a client-side ring buffer (up to 30 seconds of speech). When connectivity resumes, segments are retransmitted in sequence order.
- **Provider Degradation**: If cloud STT fails with a 5xx error or times out 3 consecutive times, the system enters a 30-second backoff period and displays a degraded service notice without disrupting the LiveKit WebRTC video call.
