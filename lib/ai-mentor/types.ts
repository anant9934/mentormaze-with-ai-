/**
 * Universal Types & Interfaces for MentorMaze AI Mentor Intelligence System
 * Brand: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 */

export type TeachingMode =
  | "learn"
  | "practice"
  | "code_mentor"
  | "career_mentor"
  | "resume_mentor"
  | "interview_coach"
  | "project_mentor"
  | "study_planner"
  | "coding_dsa"
  | "system_design"
  | "career"
  | "resume"
  | "interview"
  | "projects"
  | "study_planning";

export type FocusArea =
  | "learn"
  | "practice"
  | "coding_dsa"
  | "system_design"
  | "career"
  | "resume"
  | "interview"
  | "projects"
  | "study_planning";

export interface SpecialistCapabilityInfo {
  id: FocusArea;
  name: string;
  badge: string;
  domain: string;
  description: string;
}

export interface MentorIdentity {
  name: string;
  title: string;
  credentials: string;
  avatarUrl: string;
  systemPersona: string;
}

export const UNIFIED_MENTOR_IDENTITY: MentorIdentity = {
  name: "Dr. Aarav Mehta",
  title: "Principal Mentor · AI Intelligence",
  credentials: "Staff Software Architect & Placement Strategist · MentorMaze by AI Tathastu",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  systemPersona:
    "You are Dr. Aarav Mehta, Principal Mentor at MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com). You are a single, unified mentor with deep cross-disciplinary expertise spanning conceptual teaching, coding & DSA, system design, career roadmapping, resume transformation, and technical interviews. Maintain your singular persona, voice, and empathy across all interactions while dynamically engaging specialized internal analytical capabilities.",
};

export type TeachingStrategy =
  | "socratic_guidance"
  | "conceptual_explanation"
  | "guided_problem_solving"
  | "progressive_hints"
  | "worked_example"
  | "misconception_correction"
  | "retrieval_practice"
  | "challenge_mode";

export type MasteryState =
  | "not_assessed"
  | "introduced"
  | "developing"
  | "demonstrated"
  | "consistently_demonstrated"
  | "needs_reassessment";

export type LanguageCode = "en" | "hi" | "hinglish";

export type ProvenanceType =
  | "student_reported"
  | "institution_provided"
  | "mentor_assessed"
  | "ai_inferred";

export interface SourceCitation {
  sourceTitle: string;
  collection: "technical" | "academic" | "career" | "interview" | "proprietary";
  publisher: string;
  urlOrId?: string;
  publicationDate?: string;
  lastVerified: string;
  license: string;
  confidence: number;
}

export interface RecommendedAction {
  id: string;
  title: string;
  category: string;
  priority: "high" | "medium" | "low";
  deepLink?: string;
}

export interface SkillUpdate {
  skillId: string;
  skillName: string;
  previousState: MasteryState;
  newState: MasteryState;
  score: number;
  confidence: number;
  evidence: string;
}

export interface EscalationRecommendation {
  shouldEscalate: boolean;
  reason?: string;
  targetDomain?: string;
  recommendedMentors: {
    mentorId: string;
    name: string;
    role: string;
    company: string;
    hourlyRatePaise: number;
    matchReason: string;
    avatarUrl?: string;
  }[];
  suggestedAgenda?: string[];
}

export interface StructuredTurnResponse {
  requestId?: string;
  message: string;
  voiceText: string;
  teachingStrategy: TeachingStrategy;
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  hintLevel: number;
  studentUnderstandingSignal: "strong" | "partial" | "confused" | "misconception" | "unknown";
  sources: SourceCitation[];
  recommendedActions: RecommendedAction[];
  skillUpdates?: SkillUpdate[];
  escalationRecommendation?: EscalationRecommendation;
  latencyMs: number;
  modelProvider: string;
  inferenceMode?: "generative" | "deterministic" | "fine-tuned-2b";
  specialistCapability?: SpecialistCapabilityInfo;
  mentorIdentity?: MentorIdentity;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  estimatedCostUsd?: number;
  fallbackReason?: string;
  postInteractionCheck?: {
    question: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
    expectedKeyPoints?: string[];
  };
}

export interface StudentProfileContext {
  userId: string;
  displayName: string;
  email: string;
  currentRoleOrLevel: string;
  targetRole: string;
  graduationYear?: number;
  verifiedSkills: {
    skillId: string;
    skillName: string;
    masteryState: MasteryState;
    masteryScore: number;
    confidence: number;
    provenance: ProvenanceType;
    lastAssessedAt?: string;
  }[];
  weakSkills: string[];
  recentMistakes: string[];
  activeProjects: {
    id: string;
    title: string;
    techStack: string[];
    sourceSystem: "MentorMaze" | "Collaborate" | "Avsar" | "IRIS";
  }[];
  humanMentorshipHistory: {
    sessionId: string;
    mentorName: string;
    topic: string;
    actionItemsCount: number;
    mentorFeedbackSummary?: string;
  }[];
  mockInterviewScorecard?: {
    overallScore: number;
    rubricHighlights: string[];
  };
  preferredLanguage: LanguageCode;
  consentScope: {
    shareWithMentors: boolean;
    useForPersonalization: boolean;
    retentionDays: number;
  };
}

export interface JobDescriptionRecord {
  id: string;
  company: string;
  title: string;
  jobFamily: string;
  department?: string;
  location: string;
  experienceReq: string;
  educationReq?: string;
  mustHaveSkills: string[];
  preferredSkills: string[];
  toolsTech: string[];
  responsibilities: string[];
  seniority: "entry" | "mid" | "senior" | "lead";
  employmentType: string;
  salaryRange?: string;
  sourceUrl?: string;
  publicationDate?: string;
  lastVerifiedDate: string;
  isVerified: boolean;
}

export interface ResumeMatchResult {
  jobId: string;
  jobTitle: string;
  company: string;
  matchScorePct: number;
  matchingSkills: string[];
  missingSkills: string[];
  keywordGaps: string[];
  googleXyzSuggestions: {
    originalBullet?: string;
    improvedBullet: string;
    rationale: string;
  }[];
  priorityPreparationTasks: string[];
  unverifiedClaimsRequiringConfirmation?: string[];
}

