/**
 * MentorMaze Algorithmic Audio Segmenter & Voice Activity Detection (VAD)
 * Adapted from Cicada's VoiceActivity & AudioRouter (Apache-2.0 License - https://github.com/wquguru/cicada)
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * NOTE: Strictly non-ML. Uses Root-Mean-Square (RMS) signal energy with adaptive noise floor,
 * 30ms onset guard, 0.5 hold decay, and 120ms pause detection.
 */

import { AudioSegmentEnvelope } from "./types";

export interface VADTuning {
  /** Seconds of continuous sound before classifying as active speech (default: 0.03 = 30ms) */
  onset: number;
  /** Fraction of energy threshold required to sustain speech (default: 0.5 = -6dB) */
  hold: number;
  /** Minimum silence run in seconds to declare a natural pause boundary (default: 0.12 = 120ms) */
  shortestPause: number;
  /** Silence run in seconds to force segment emission (default: 0.25 = 250ms) */
  sentencePause: number;
  /** Maximum segment duration in seconds before forcing a segment cut (default: 8.0s) */
  maxSegmentDuration: number;
  /** Minimum segment duration to avoid noise blips (default: 0.25s) */
  minSegmentDuration: number;
}

export const DEFAULT_VAD_TUNING: VADTuning = {
  onset: 0.03,
  hold: 0.5,
  shortestPause: 0.12,
  sentencePause: 0.25,
  maxSegmentDuration: 8.0,
  minSegmentDuration: 0.25,
};

export class AudioSegmenter {
  private tuning: VADTuning;
  private sampleRate: number;
  private sessionId: string;
  private participantId: string;
  private role: "student" | "mentor";

  // State Machine
  private noiseFloorDbfs: number = -55.0;
  private isSpeaking: boolean = false;
  private pendingSpeechDuration: number = 0;
  private silenceRunDuration: number = 0;
  private currentSegmentStartClock: number = 0;
  private currentSegmentSamples: Float32Array[] = [];
  private totalSegmentSamplesCount: number = 0;
  private sequenceCounter: number = 0;

  constructor(
    sessionId: string,
    participantId: string,
    role: "student" | "mentor",
    sampleRate: number = 16000,
    tuning: VADTuning = DEFAULT_VAD_TUNING
  ) {
    this.sessionId = sessionId;
    this.participantId = participantId;
    this.role = role;
    this.sampleRate = sampleRate;
    this.tuning = tuning;
  }

  /**
   * Calculates Root-Mean-Square (RMS) amplitude of audio frame.
   */
  public static calculateRms(samples: Float32Array): number {
    if (samples.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  /**
   * Converts linear RMS [0.0 - 1.0] to dBFS.
   */
  public static rmsToDbfs(rms: number): number {
    if (rms <= 0.000001) return -100.0;
    return 20 * Math.log10(rms);
  }

  /**
   * Feeds a block of audio samples into the segmenter.
   * Returns an AudioSegmentEnvelope if a segment boundary was reached, otherwise null.
   */
  public feed(samples: Float32Array, clockSeconds: number): AudioSegmentEnvelope | null {
    const frameSeconds = samples.length / this.sampleRate;
    const rms = AudioSegmenter.calculateRms(samples);
    const dbfs = AudioSegmenter.rmsToDbfs(rms);

    // Compute dynamic threshold (max of -42 dBFS or 12dB above adaptive noise floor)
    const speechThresholdDbfs = Math.max(-42.0, this.noiseFloorDbfs + 12.0);
    const speechThresholdRms = Math.pow(10, speechThresholdDbfs / 20);

    const isLoud =
      rms >= speechThresholdRms ||
      (this.isSpeaking && rms >= speechThresholdRms * this.tuning.hold);

    if (!isLoud) {
      // Update background noise floor during silence
      this.noiseFloorDbfs = 0.95 * this.noiseFloorDbfs + 0.05 * dbfs;
      this.silenceRunDuration += frameSeconds;
      this.pendingSpeechDuration = 0;

      if (this.isSpeaking) {
        // Accumulate trailing silence to preserve syllable releases
        this.currentSegmentSamples.push(samples);
        this.totalSegmentSamplesCount += samples.length;

        // Check for sentence boundary pause
        if (this.silenceRunDuration >= this.tuning.sentencePause) {
          this.isSpeaking = false;
          return this.emitSegment(clockSeconds);
        }
      }
      return null;
    }

    // Loud frame detected
    this.silenceRunDuration = 0;

    if (!this.isSpeaking) {
      this.pendingSpeechDuration += frameSeconds;

      // Check onset guard (speech must persist for >= onset seconds to reject transient clicks)
      if (this.pendingSpeechDuration >= this.tuning.onset) {
        this.isSpeaking = true;
        this.currentSegmentStartClock = Math.max(0, clockSeconds - this.pendingSpeechDuration);
        this.currentSegmentSamples = [samples];
        this.totalSegmentSamplesCount = samples.length;
        this.pendingSpeechDuration = 0;
      }
      return null;
    }

    // Active speech continues
    this.currentSegmentSamples.push(samples);
    this.totalSegmentSamplesCount += samples.length;

    const currentDuration = this.totalSegmentSamplesCount / this.sampleRate;
    if (currentDuration >= this.tuning.maxSegmentDuration) {
      // Force segment split to prevent unbounded latency
      return this.emitSegment(clockSeconds);
    }

    return null;
  }

  /**
   * Forces flush of any in-progress speech segment (e.g. on participant mute or session completion).
   */
  public flush(clockSeconds: number): AudioSegmentEnvelope | null {
    if (this.totalSegmentSamplesCount === 0) return null;
    this.isSpeaking = false;
    return this.emitSegment(clockSeconds);
  }

  /**
   * Encodes accumulated audio buffers into a standardized WAV container and emits envelope.
   */
  private emitSegment(endClockSeconds: number): AudioSegmentEnvelope | null {
    const totalSamples = this.totalSegmentSamplesCount;
    const duration = totalSamples / this.sampleRate;

    // Discard noise blips shorter than minSegmentDuration
    if (duration < this.tuning.minSegmentDuration) {
      this.currentSegmentSamples = [];
      this.totalSegmentSamplesCount = 0;
      return null;
    }

    // Merge Float32Array chunks into single contiguous buffer
    const merged = new Float32Array(totalSamples);
    let offset = 0;
    for (const chunk of this.currentSegmentSamples) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    this.currentSegmentSamples = [];
    this.totalSegmentSamplesCount = 0;
    this.sequenceCounter++;

    const wavBuffer = AudioSegmenter.encodeWav(merged, this.sampleRate);
    const base64Audio = AudioSegmenter.bufferToBase64(wavBuffer);

    return {
      sessionId: this.sessionId,
      segmentId: `seg-${this.sessionId}-${this.participantId}-${this.sequenceCounter}`,
      sequenceNumber: this.sequenceCounter,
      participantId: this.participantId,
      role: this.role,
      startTimeMs: Math.round(this.currentSegmentStartClock * 1000),
      endTimeMs: Math.round(endClockSeconds * 1000),
      durationSeconds: Math.round(duration * 100) / 100,
      audioFormat: "audio/wav",
      audioData: base64Audio,
    };
  }

  /**
   * Encodes linear PCM Float32Array into standard 16-bit Mono WAV format.
   */
  public static encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    AudioSegmenter.writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    AudioSegmenter.writeString(view, 8, "WAVE");

    // fmt sub-chunk
    AudioSegmenter.writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);          // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true);           // AudioFormat (1 for PCM)
    view.setUint16(22, 1, true);           // NumChannels (1 mono)
    view.setUint32(24, sampleRate, true);  // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
    view.setUint16(32, 2, true);           // BlockAlign (NumChannels * BitsPerSample/8)
    view.setUint16(34, 16, true);          // BitsPerSample (16 bits)

    // data sub-chunk
    AudioSegmenter.writeString(view, 36, "data");
    view.setUint32(40, samples.length * 2, true);

    // Write 16-bit PCM samples
    let index = 44;
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(index, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      index += 2;
    }

    return new Uint8Array(buffer);
  }

  private static writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  private static bufferToBase64(bytes: Uint8Array): string {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(bytes).toString("base64");
    }
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
