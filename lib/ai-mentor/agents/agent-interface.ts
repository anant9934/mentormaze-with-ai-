/**
 * ASTRION Multi-Agent Ecosystem — Base Agent Interface & Common Contracts
 * Brand: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 * Identity: ASTRION (Adaptive Strategic Intelligence & Reasoning Network)
 */

import { AuthorizedStudentContext } from "../permission-aware-context-builder";
import { SkillNodeWithEvidence, EvidenceClassification } from "../student-intelligence-graph";
import { FocusArea, SourceCitation, RecommendedAction } from "../types";

export type AgentLayer = "DomainSpecialist" | "StudentIntelligence" | "SupportingIntelligence";

export interface AgentMetadata {
  id: string;
  name: string;
  layer: AgentLayer;
  description: string;
  isDeterministic: boolean;
  requiredConsentPurposes: string[];
}

export interface AgentExecutionInput {
  studentUserId: string;
  userMessage: string;
  context: AuthorizedStudentContext;
  focusArea?: FocusArea;
  language?: string;
  activeTopic?: string;
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
}

export interface AgentExecutionResult {
  agentId: string;
  success: boolean;
  insights?: string[];
  recommendedActions?: RecommendedAction[];
  citations?: SourceCitation[];
  evidenceUpdates?: {
    skillId: string;
    evidenceType: EvidenceClassification;
    score: number;
    notes: string;
  }[];
  payload?: any;
}
