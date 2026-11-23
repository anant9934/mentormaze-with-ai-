/**
 * Unified Intelligence Architecture — Specialist Capability Interface
 * Product: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 * Identity: ASTRION (Adaptive Strategic Intelligence & Reasoning Network)
 */

import {
  FocusArea,
  LanguageCode,
  StudentProfileContext,
  SourceCitation,
  RecommendedAction,
  SkillUpdate,
  StructuredTurnResponse,
  SpecialistCapabilityInfo,
} from "../types";
import { RetrievalResult } from "../knowledge-rag-service";
import { PedagogyDecision } from "../pedagogy-engine";

export interface SpecialistExecutionInput {
  studentUserId: string;
  userMessage: string;
  codeSnippet?: string;
  languagePreference?: LanguageCode;
  hintLevel?: number;
  studentContext: StudentProfileContext;
  ragPayload: {
    retrievedEvidenceText: string;
    citations: SourceCitation[];
    results: RetrievalResult[];
    missingInformationNotice?: string;
  };
  pedagogyDecision: PedagogyDecision;
}

export type TaskCategoryType =
  | "general"
  | "coding"
  | "reasoning"
  | "resume"
  | "interview"
  | "classification";

export interface SpecialistExecutionOutput {
  responseText: string;
  voiceText: string;
  recommendedActions: RecommendedAction[];
  skillUpdates: SkillUpdate[];
  postInteractionCheck?: StructuredTurnResponse["postInteractionCheck"];
  systemPromptEnrichment: string;
  taskCategory: TaskCategoryType;
}

export interface ISpecialistCapability {
  readonly id: FocusArea;
  readonly name: string;
  readonly badge: string;
  readonly domain: string;
  readonly description: string;
  readonly codeName?: string;
  readonly responsibility?: string;

  /**
   * Evaluates whether an incoming message matches this specialist capability
   */
  matchesIntent(message: string): boolean;

  /**
   * System prompt enrichment defining internal expertise for this turn
   */
  getSystemPromptEnrichment(input: SpecialistExecutionInput): string;

  /**
   * Hybrid routing classification category
   */
  getTaskCategory(): TaskCategoryType;

  /**
   * High-leverage deterministic fallback output when generative LLM is offline
   */
  executeDeterministic(input: SpecialistExecutionInput): SpecialistExecutionOutput;

  /**
   * Post-processes generative LLM output with structured metadata, checks, and skill tracking
   */
  postProcessGenerative(
    content: string,
    input: SpecialistExecutionInput
  ): Partial<SpecialistExecutionOutput>;

  /**
   * Returns presentation metadata for UI badges
   */
  getMetadata(): SpecialistCapabilityInfo;
}
