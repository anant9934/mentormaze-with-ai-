/**
 * ASTRION Mentor Response Contract
 * Standardized output contract returned by ASTRION CORE.
 */

import { SourceCitation, RecommendedAction, SkillUpdate, EscalationRecommendation } from "../types";
import { SpecialistCodeName } from "./specialist.contract";

export interface MentorResponseContract {
  conversationId: string;
  messageId: string;
  response: string;
  specialist: {
    codeName: SpecialistCodeName;
    displayName: string;
    focusArea: string;
  };
  modelMetadata: {
    provider: string;
    modelName: string;
    isLocal: boolean;
    latencyMs: number;
    tokensGenerated?: number;
  };
  pedagogicalMetadata?: {
    teachingStrategy: string;
    hintLevel: number;
    difficulty: string;
    studentUnderstandingSignal?: string;
  };
  sources?: SourceCitation[];
  recommendedActions?: RecommendedAction[];
  skillUpdates?: SkillUpdate[];
  escalation?: EscalationRecommendation;
  timestamp: string;
}
