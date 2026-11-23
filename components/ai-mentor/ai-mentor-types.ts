/**
 * MentorMaze AI Mentor — ASTRION Workspace Types
 * Brand: ASTRION by MentorMaze (AI Tathastu Ecosystem)
 * Identity: ASTRION (Adaptive Strategic Intelligence & Reasoning Network)
 */

import {
  FocusArea,
  TeachingMode,
  LanguageCode,
  SourceCitation,
  RecommendedAction,
  SkillUpdate,
  EscalationRecommendation,
  SpecialistCapabilityInfo,
  MentorIdentity,
} from "@/lib/ai-mentor/types";

export type NavSection =
  | "chat"
  | "history"
  | "codework"
  | "discover"
  | "projects"
  | "agents"
  | "skills"
  | "memory"
  | "progress"
  | "learning_profile"
  | "career_goals"
  | "preferences"
  | "model_info"
  | "notifications"
  | "settings"
  | "help"
  | "report_issue";

export interface PostInteractionCheck {
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "mentor";
  content: string;
  timestamp: string;
  teachingStrategy?: string;
  specialistCapability?: SpecialistCapabilityInfo;
  sources?: SourceCitation[];
  recommendedActions?: RecommendedAction[];
  skillUpdates?: SkillUpdate[];
  escalation?: EscalationRecommendation;
  latencyMs?: number;
  modelProvider?: string;
  inferenceMode?: "generative" | "deterministic" | "fine-tuned-2b";
  requestId?: string;
  tokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  estimatedCostUsd?: number;
  fallbackReason?: string;
  postInteractionCheck?: PostInteractionCheck;
  savedNote?: boolean;
  feedback?: "like" | "dislike";
  isEdited?: boolean;
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
  goalReference?: {
    goalId: string;
    goalTitle: string;
    category: string;
    importance: string;
    status: string;
  };
  assessment?: {
    goalTitle?: string;
    readinessScore: number;
    strengths: { skillName: string; evidenceSource: string; tier: number }[];
    confirmedGaps: { skillName: string; gapType: string; remediation: string }[];
    suspectedGaps: { skillName: string; gapType: string; suggestedClarification: string }[];
    missingInfoQuestions: string[];
    evidenceSummary: {
      confirmedCount: number;
      selfReportedCount: number;
      inferredCount: number;
      unknownCount: number;
    };
  };
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

export interface ConversationSummary {
  id: string;
  title: string;
  mode: TeachingMode | FocusArea;
  updatedAt: string;
  createdAt: string;
}

export interface StudentSkillItem {
  skillId: string;
  skillName: string;
  masteryState: string;
  masteryScore: number;
}

export interface StudentMemoryItem {
  id: string;
  category: string;
  key: string;
  value: string;
  confidence?: number;
  studentConfirmed?: boolean;
  isTemporary?: boolean;
  source?: string;
}

export interface FocusAreaDef {
  id: FocusArea;
  label: string;
  iconName: string;
  specialistTitle: string;
  badge: string;
  description: string;
  placeholder: string;
  suggestionPrompt: string;
}

export const FOCUS_AREAS_CONFIG: FocusAreaDef[] = [
  {
    id: "learn",
    label: "SAGE — Learn a Concept",
    iconName: "BookOpen",
    specialistTitle: "SAGE Learning Intelligence",
    badge: "SAGE · Learning",
    description: "Conceptual explanations, Socratic tutoring, mathematical proofs & first principles.",
    placeholder: "Ask ASTRION to explain any technical or scientific concept using first principles...",
    suggestionPrompt: "Explain how React reconciles virtual DOM diffs under the hood using first principles.",
  },
  {
    id: "coding_dsa",
    label: "CIPHER — Review Code & DSA",
    iconName: "Code2",
    specialistTitle: "CIPHER Engineering Intelligence",
    badge: "CIPHER · Engineering",
    description: "Programming fundamentals, algorithm walkthroughs, debugging & complexity analysis.",
    placeholder: "Paste code or ask about an algorithmic pattern (graphs, DP, trees)...",
    suggestionPrompt: "Review my Longest Increasing Subsequence patience sorting implementation and prove its O(N log N) complexity.",
  },
  {
    id: "system_design",
    label: "ATLAS — Design a System",
    iconName: "Layers",
    specialistTitle: "ATLAS Systems Intelligence",
    badge: "ATLAS · Systems",
    description: "High-level architecture, scalability trade-offs, distributed systems & API design.",
    placeholder: "Describe a distributed system requirement or ask architectural trade-offs...",
    suggestionPrompt: "How should I design an idempotency key layer for a distributed payment processing system?",
  },
  {
    id: "projects",
    label: "FORGE — Build & Review Projects",
    iconName: "Cpu",
    specialistTitle: "FORGE Project Intelligence",
    badge: "FORGE · Projects",
    description: "Project planning, production-readiness reviews, architecture & test strategies.",
    placeholder: "Share your project architecture or repository structure for engineering critique...",
    suggestionPrompt: "Review my portfolio project architecture: a real-time collaborative code editor using WebSockets and CRDTs.",
  },
  {
    id: "career",
    label: "VECTRA — Explore Career Options",
    iconName: "Compass",
    specialistTitle: "VECTRA Career Intelligence",
    badge: "VECTRA · Career",
    description: "Career-roadmap planning, skill-gap analysis, market demand & role ladders.",
    placeholder: "Ask about career trajectories, in-demand skills, or market expectations...",
    suggestionPrompt: "What are the most in-demand skills for a High-Frequency Trading (HFT) C++ developer in 2026?",
  },
  {
    id: "resume",
    label: "PRISM — Improve Your Resume",
    iconName: "FileText",
    specialistTitle: "PRISM Resume Intelligence",
    badge: "PRISM · Resume",
    description: "Google XYZ formula alignment, ATS compatibility, impact metric quantification.",
    placeholder: "Paste a resume bullet or work summary to transform into high-impact metrics...",
    suggestionPrompt: "Rewrite this resume bullet using the Google XYZ formula: 'Worked on backend API to speed up search response time.'",
  },
  {
    id: "interview",
    label: "ORACLE — Prepare for Interviews",
    iconName: "Target",
    specialistTitle: "ORACLE Interview Intelligence",
    badge: "ORACLE · Interviews",
    description: "Technical & behavioral STAR calibration, mock questions, rubric scorecards.",
    placeholder: "Simulate a technical interview screen or practice behavioral STAR questions...",
    suggestionPrompt: "Conduct a mock behavioral interview question for an SDE-2 role focusing on conflict resolution with a senior engineer.",
  },
  {
    id: "study_planning",
    label: "CHRONOS — Plan Your Learning",
    iconName: "Calendar",
    specialistTitle: "CHRONOS Planning Intelligence",
    badge: "CHRONOS · Planning",
    description: "Milestone roadmaps, target competencies, spaced retrieval & habit consistency.",
    placeholder: "Tell me your target role and timeline to set a tailored learning roadmap...",
    suggestionPrompt: "Set a tailored 12-week learning roadmap to master distributed systems and staff engineer system design.",
  },
];

export interface ModelProviderInfo {
  provider: string;
  modelName: string;
  isAvailable: boolean;
  isConfigured: boolean;
  status: string;
  message?: string;
  lifecycleState?: string;
}
