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
  role?: string;
  title: string;
  credentials: string;
  avatarUrl: string;
  systemPersona: string;
  organization?: string;
}

export const UNIFIED_MENTOR_IDENTITY: MentorIdentity = {
  name: "ASTRION",
  role: "ASTRION Lead AI Mentor",
  title: "Adaptive Strategic Intelligence & Reasoning Network",
  credentials: "ASTRION CORE · MentorMaze by AI Tathastu",
  organization: "MentorMaze by AI Tathastu",
  avatarUrl: "/brand/astrion-icon.svg",
  systemPersona:
    "You are ASTRION, the Adaptive Strategic Intelligence & Reasoning Network at MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com). You are a single, unified mentor with deep cross-disciplinary expertise spanning learning pedagogy (SAGE), software engineering (CIPHER), systems architecture (ATLAS), project execution (FORGE), career strategy (VECTRA), resume transformation (PRISM), interview preparation (ORACLE), and disciplined planning (CHRONOS). Maintain your singular persona, analytical depth, and intellectual honesty across all interactions while dynamically engaging specialized internal intelligence modules.",
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
  | "ai_inferred"
  | "confirmed_evidence"
  | "extracted"
  | "system_inference";

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
  studyPlan?: {
    primaryGoal: string;
    totalWeeks: number;
    currentMilestone: {
      weekNumber: number;
      title: string;
      objectives: string[];
      deliverables: string[];
      status: "pending" | "in_progress" | "completed";
    };
    milestones: {
      weekNumber: number;
      title: string;
      objectives: string[];
      deliverables: string[];
      status: "pending" | "in_progress" | "completed";
    }[];
  };
  progressInsights?: {
    confirmedStrengths: string[];
    confirmedGaps: { skillName: string; gapType: string; remediation: string }[];
    suspectedGaps: { skillName: string; gapType: string }[];
    masteryLevel: string;
  };
  resources?: {
    id: string;
    title: string;
    category: string;
    provider: string;
    urlOrRef: string;
    freshnessDate: string;
  }[];
  reminders?: {
    milestoneTitle: string;
    prompt: string;
    scheduledTime: string;
  }[];
  mentorHandoff?: {
    eligible: boolean;
    domains: string[];
    sanitizedBriefing: string;
  };
  postInteractionCheck?: {
    question: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
    expectedKeyPoints?: string[];
  };
  goalReference?: {
    goalId: string;
    goalTitle: string;
    category: string;
    importance: string;
    status: string;
  };
  assessment?: any;
  recommendedNextAction?: RecommendedAction;
  roadmapUpdates?: {
    roadmapId: string;
    adaptedReason: string;
    updatedMilestones: any[];
  };
  milestoneUpdates?: {
    milestoneId: string;
    weekNumber: number;
    status: string;
    progressPct: number;
  };
  followUpSuggestion?: string;
  requiresStudentConfirmation?: boolean;
  confidence?: number;
  evidenceReferences?: string[];
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

