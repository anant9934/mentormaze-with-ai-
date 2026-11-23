/**
 * MentorMaze Cloud Speech Recognition Adapter
 * Adapted from Cicada's CloudHearing & LingClient (Apache-2.0 License - https://github.com/wquguru/cicada)
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * NOTE: Strictly Cloud API based (OpenAI Whisper cloud API or Google Cloud STT).
 * Zero local AI models, zero local LLM inference, zero on-device speech recognition.
 * Includes hallucination detection, repetition filtering, and noise suppression.
 */

import { AudioSegmentEnvelope, CloudHeard } from "./types";

export interface SpeechRecognitionOptions {
  preferredLanguage?: string; // "en" | "hi" | "hi-Latn"
  temperature?: number;
  promptGlossary?: string[];
}

export class SpeechRecognitionAdapter {
  private apiKey?: string;
  private apiEndpoint: string;
  private isMockMode: boolean;

  constructor(apiKey?: string, apiEndpoint: string = "https://api.openai.com/v1/audio/transcriptions") {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || process.env.WHISPER_API_KEY;
    this.apiEndpoint = apiEndpoint;
    // Activate mock mode if running in unit tests or no API key is provided
    this.isMockMode = process.env.NODE_ENV === "test" || !this.apiKey;
  }

  /**
   * Transcribes an audio segment envelope via Cloud STT API.
   */
  public async transcribe(
    segment: AudioSegmentEnvelope,
    options: SpeechRecognitionOptions = {}
  ): Promise<CloudHeard | null> {
    if (this.isMockMode) {
      return this.mockTranscribe(segment, options);
    }

    try {
      const buffer = Buffer.from(segment.audioData, "base64");
      const formData = new FormData();
      const blob = new Blob([buffer], { type: "audio/wav" });
      formData.append("file", blob, `audio-${segment.segmentId}.wav`);
      formData.append("model", "whisper-1");
      formData.append("response_format", "json");

      if (options.preferredLanguage) {
        formData.append("language", options.preferredLanguage.split("-")[0]);
      }

      if (options.promptGlossary && options.promptGlossary.length > 0) {
        formData.append("prompt", options.promptGlossary.slice(0, 50).join(", "));
      }

      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[SpeechRecognitionAdapter] Cloud STT failed: HTTP ${response.status} - ${errorText}`);
        return null;
      }

      const data = await response.json();
      const rawText = data.text ? data.text.trim() : "";

      if (!rawText) return null;

      // Filter hallucinations and noise artifacts
      if (this.isHallucinationOrNoise(rawText)) {
        return null;
      }

      const detectedLang = data.language || options.preferredLanguage || "en";

      return {
        original: rawText,
        lang: detectedLang,
        confidence: 0.95,
      };
    } catch (err: any) {
      console.error("[SpeechRecognitionAdapter] Cloud STT error:", err?.message || err);
      return null;
    }
  }

  /**
   * Filters common cloud STT hallucination patterns, repeating loops, and noise artifacts.
   */
  public isHallucinationOrNoise(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 2) return true;

    // Detect common YouTube/Subtitles hallucination artifacts from Whisper
    const hallucinationRegexes = [
      /thank you for watching/i,
      /thanks for watching/i,
      /subtitles by/i,
      /transcription by/i,
      /please subscribe/i,
      /like and subscribe/i,
      /copyright/i,
      /all rights reserved/i,
      /MBC/i,
      /amara\.org/i,
    ];

    for (const regex of hallucinationRegexes) {
      if (regex.test(trimmed)) return true;
    }

    // Detect pathological repetition loops (e.g. "you you you you you" or "and and and")
    const words = trimmed.split(/\s+/);
    if (words.length >= 6) {
      const firstWord = words[0].toLowerCase();
      const allSame = words.every((w) => w.toLowerCase() === firstWord);
      if (allSame) return true;

      // Check 2-word phrase repetition: "thank you thank you thank you thank you"
      if (words.length >= 6 && words.length % 2 === 0) {
        const p1 = `${words[0]} ${words[1]}`.toLowerCase();
        let loopCount = 0;
        for (let i = 0; i < words.length; i += 2) {
          if (`${words[i]} ${words[i + 1]}`.toLowerCase() === p1) {
            loopCount++;
          }
        }
        if (loopCount >= 3) return true;
      }
    }

    return false;
  }

  /**
   * Deterministic mock transcriber for test suites and offline contract testing.
   */
  private mockTranscribe(
    segment: AudioSegmentEnvelope,
    options: SpeechRecognitionOptions
  ): CloudHeard {
    // Generate deterministic transcript based on sequence and role
    const mockPhrasesStudent = [
      "I was reviewing dynamic programming algorithms, specifically the knapsack problem.",
      "Could we discuss how to optimize time complexity from O(2^N) to O(N*W)?",
      "I implemented memoization, but space complexity is still high in my solution.",
      "How should I structure my answer during a FAANG system design interview?",
    ];

    const mockPhrasesMentor = [
      "Let's break down the state transition equation for the 0/1 knapsack recurrence.",
      "Notice that dp[w] only depends on the previous row, so we can compress state to 1D array.",
      "For the interview, start with the functional requirements before jumping into database schemas.",
      "Make sure you clarify latency and read-heavy versus write-heavy tradeoffs upfront.",
    ];

    const pool = segment.role === "student" ? mockPhrasesStudent : mockPhrasesMentor;
    const text = pool[(segment.sequenceNumber - 1) % pool.length];

    return {
      original: text,
      lang: options.preferredLanguage || "en",
      confidence: 0.98,
    };
  }
}
