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

export type CanonicalMasteryLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const MASTERY_LEVEL_TO_STATE: Record<CanonicalMasteryLevel, MasteryState> = {
  0: "not_assessed",
  1: "introduced",
  2: "developing",
  3: "developing",
  4: "demonstrated",
  5: "consistently_demonstrated",
};

export const MASTERY_STATE_TO_LEVEL: Record<MasteryState, CanonicalMasteryLevel> = {
  not_assessed: 0,
  introduced: 1,
  developing: 2,
  demonstrated: 4,
  consistently_demonstrated: 5,
  needs_reassessment: 1,
};

export type LanguageCode = "en" | "hi" | "hinglish";

export type ProvenanceType =
  | "student_reported"
  | "assessment_verified"
  | "independently_verified"
  | "project_demonstrated"
  | "mentor_recorded"
  | "transcript_extracted"
  | "ai_inferred"
  | "external_ecosystem"
  | "institution_provided"
  | "mentor_assessed"
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
  adaptiveContext?: AdaptiveContextArea;
}

export interface AdaptiveContextArea {
  currentLearningObjective: string;
  currentSkill: string;
  demonstratedMastery: string;
  masteryLevel: CanonicalMasteryLevel;
  activeMisconception?: string;
  currentActivity: string;
  nextReview?: string;
  reasonForRecommendation: string;
  supportingEvidence?: string[];
  subskillMap?: { id: string; name: string; masteryLevel: CanonicalMasteryLevel }[];
  bktKnowledgeEstimate?: number;
  bktMasteryBand?: BKTMasteryBand;
  fsrsRetrievability?: number;
  fsrsStabilityDays?: number;
  reviewQueueLength?: number;
  learningPhase?: LearningPhase;
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

// ----------------------------------------------------------------------------
// BKT & FSRS Pedagogical Intelligence Types (Tutor MCP Adaptation)
// ----------------------------------------------------------------------------

export type BKTInteractionOutcome =
  | "independent_success"
  | "hint_probing"
  | "hint_property"
  | "hint_worked_example"
  | "solution_explained"
  | "failed_attempt"
  | "unprompted_delayed_retrieval"
  | "transfer_assessment";

export type BKTMasteryBand = "novice" | "developing" | "competent" | "proficient" | "mastered";

export interface BKTConceptState {
  conceptId: string;
  studentUserId: string;
  knowledgeProbability: number; // P(L_t) in [0, 1]
  initialProbability: number;   // P(L_0), default 0.15
  learnProbability: number;     // P(T), default 0.20
  guessProbability: number;     // P(G), default 0.15
  slipProbability: number;      // P(S), default 0.10
  masteryBand: BKTMasteryBand;
  canonicalMasteryLevel: CanonicalMasteryLevel;
  independentChecksCount: number;
  totalAttempts: number;
  lastAssistanceLevel?: string;
  lastOutcome?: BKTInteractionOutcome;
  lastEvidenceSource: ProvenanceType;
  lastUpdatedAt: string;
}

export type FSRSRating = 1 | 2 | 3 | 4; // 1: again, 2: hard, 3: good, 4: easy

export type FSRSState = "new" | "learning" | "review" | "relearning";

export interface FSRSConceptRecord {
  conceptId: string;
  studentUserId: string;
  stability: number; // S (days)
  difficulty: number; // D in [1, 10]
  retrievability: number; // R in [0, 1]
  lastReviewedAt: string;
  nextReviewAt: string;
  reps: number;
  lapses: number;
  state: FSRSState;
  historicalRatings: {
    rating: FSRSRating;
    reviewedAt: string;
    retrievabilityBefore: number;
  }[];
  lastUpdatedAt: string;
}

export type ReviewQueueCategory =
  | "daily_review"
  | "weak_concept_revision"
  | "forgotten_concept_recovery"
  | "prerequisite_reinforcement";

export interface ReviewQueueItem {
  conceptId: string;
  conceptName: string;
  category: ReviewQueueCategory;
  retrievability: number;
  stability: number;
  difficulty: number;
  dueDaysAgo: number;
  priority: "high" | "medium" | "low";
  reason: string;
}

export type LearningPhase =
  | "1_diagnostic_placement"
  | "2_initial_instruction"
  | "3_guided_practice"
  | "4_independent_practice"
  | "5_transfer_challenge"
  | "6_mastery_verification"
  | "7_spaced_review";

export interface AdaptiveActivityDecision {
  recommendedSkillId: string;
  recommendedSkillName: string;
  recommendedActivity: string;
  recommendedDifficulty: "introductory" | "developing" | "intermediate" | "advanced" | "rigorous";
  learningPhase: LearningPhase;
  teachingStrategy: TeachingStrategy;
  expectedLearningObjective: string;
  reasonForRecommendation: string;
  supportingEvidence: string[];
  reviewQueueLength: number;
  bktKnowledgeEstimate: number;
  bktMasteryBand: BKTMasteryBand;
}

// ----------------------------------------------------------------------------
// BloomTutor Learning Journey Types
// ----------------------------------------------------------------------------

export interface ProgrammeLessonExercise {
  id: string;
  prompt: string;
  starterCode?: string;
  sampleSolution: string;
  testCases?: { input: string; expected: string }[];
  hintLevelAvailable: number;
}

export interface ProgrammeLessonFeedback {
  rating: 1 | 2 | 3 | 4 | 5;
  clarity: "clear" | "confusing" | "too_fast" | "too_slow";
  comment?: string;
  timestamp: string;
}

export interface ProgrammeLessonEvaluation {
  score: number; // 0 - 10
  isPassed: boolean;
  demonstratedMastery: CanonicalMasteryLevel;
  feedback: string;
  evaluatedAt: string;
}

export interface ProgrammeLesson {
  id: string;
  subskillId: string;
  order: number;
  title: string;
  conceptualOverview: string;
  learningObjectives: string[];
  prerequisites: string[];
  exercise: ProgrammeLessonExercise;
  status: "pending" | "in_progress" | "completed" | "needs_remediation";
  studentFeedback?: ProgrammeLessonFeedback;
  evaluation?: ProgrammeLessonEvaluation;
}

export interface StudentProgrammeNote {
  id: string;
  lessonId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentAnnotation {
  id: string;
  lessonId: string;
  highlightedText: string;
  note: string;
  createdAt: string;
}

export interface ProgrammeFinalAssessment {
  id: string;
  score: number;
  overallMastery: CanonicalMasteryLevel;
  passed: boolean;
  assessedAt: string;
  summary: string;
}

export interface LearningProgramme {
  id: string;
  studentUserId: string;
  goalId: string;
  roadmapId?: string;
  title: string;
  topic: string;
  currentLessonIndex: number;
  lessons: ProgrammeLesson[];
  notes: StudentProgrammeNote[];
  annotations: StudentAnnotation[];
  status: "active" | "completed" | "paused" | "remediating";
  remediationQueue: string[];
  finalAssessment?: ProgrammeFinalAssessment;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------------------------------
// SocialCoach Communication Coach Types
// ----------------------------------------------------------------------------

export type CommunicationScenarioType =
  | "salary_negotiation"
  | "executive_status_update"
  | "technical_disagreement"
  | "behavioral_interview"
  | "non_technical_explanation";

export interface CounterpartPersona {
  name: string;
  role: string;
  attitude: "skeptical" | "collaborative" | "demanding" | "neutral" | "supportive";
  background: string;
}

export interface DialogueTurn {
  turnIndex: number;
  speaker: "counterpart" | "student" | "coach_whisper";
  content: string;
  timestamp: string;
  coachingWhisper?: string;
}

export interface CommunicationRubricDimension {
  score: number; // 1 to 10
  feedback: string;
}

export interface CommunicationRubricEvaluation {
  clarity: CommunicationRubricDimension;
  structure: CommunicationRubricDimension;
  toneAndEmotionalAwareness: CommunicationRubricDimension;
  professionalPresence: CommunicationRubricDimension;
  technicalAccuracy: CommunicationRubricDimension;
  persuasiveness: CommunicationRubricDimension;
  overallScore: number; // 1 to 10
  concreteRevisionSuggestions: string[];
  exemplaryRewrite: string;
}

export interface SocialSimulationSession {
  id: string;
  studentUserId: string;
  scenarioType: CommunicationScenarioType;
  scenarioTitle: string;
  scenarioBriefing: string;
  counterpartPersona: CounterpartPersona;
  turns: DialogueTurn[];
  status: "setup" | "in_progress" | "completed";
  evaluation?: CommunicationRubricEvaluation;
  createdAt: string;
  updatedAt: string;
}

