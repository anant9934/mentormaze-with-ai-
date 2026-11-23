/**
 * ASTRION Mentor Request Contract
 * Standardized input contract for all mentorship interactions.
 */

import { FocusArea, LanguageCode, TeachingMode } from "../types";
import { SpecialistCodeName } from "./specialist.contract";

export interface MentorRequestContract {
  studentUserId: string;
  userMessage: string;
  conversationId?: string;
  focusArea?: FocusArea;
  specialistHint?: SpecialistCodeName;
  teachingMode?: TeachingMode;
  languagePreference?: LanguageCode;
  stream?: boolean;
  contextOverrides?: {
    currentTopic?: string;
    targetRole?: string;
    studentUnderstandingSignal?: "confused" | "neutral" | "mastered";
    codeSnippet?: string;
    resumeText?: string;
  };
  consentScope?: {
    useMemory?: boolean;
    useProfile?: boolean;
  };
}
