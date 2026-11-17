/**
 * MentorMaze AI Mentor — Standalone Workspace Types
 * Brand: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 * Mentor: Dr. Aarav Mehta (Principal Mentor · AI Intelligence)
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
  | "skills"
  | "memory"
  | "progress"
  | "learning_profile"
  | "career_goals"
  | "preferences"
  | "model_info"
  | "notifications"
  | "settings"
  | "help";

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
    label: "Learn a Concept",
    iconName: "BookOpen",
    specialistTitle: "Conceptual Learning & Pedagogy",
    badge: "Conceptual Specialist",
    description: "Deep-dive explanations using first principles and progressive scaffolding.",
    placeholder: "Ask Dr. Aarav Mehta to explain any technical or scientific concept...",
    suggestionPrompt: "Explain how React reconciles virtual DOM diffs under the hood using first principles.",
  },
  {
    id: "coding_dsa",
    label: "Solve Coding & DSA",
    iconName: "Code2",
    specialistTitle: "DSA & Code Specialist",
    badge: "Coding Specialist",
    description: "Algorithm walkthroughs, edge cases, space-time complexity analysis.",
    placeholder: "Paste code or ask about an algorithmic pattern (graphs, DP, trees)...",
    suggestionPrompt: "Walk me through the optimal approach for the Longest Increasing Subsequence with O(N log N) patience sorting.",
  },
  {
    id: "system_design",
    label: "Design a System",
    iconName: "Layers",
    specialistTitle: "Distributed Systems Architect",
    badge: "Systems Architect",
    description: "High-level architecture, scalability trade-offs, microservices & caching.",
    placeholder: "Describe a distributed system requirement or ask architectural trade-offs...",
    suggestionPrompt: "How should I design an idempotency key layer for a distributed payment processing system?",
  },
  {
    id: "resume",
    label: "Improve Resume",
    iconName: "FileText",
    specialistTitle: "Resume Auditor & Transformer",
    badge: "Resume Specialist",
    description: "Google XYZ formula alignment, ATS score diagnostics, metric quantification.",
    placeholder: "Paste a resume bullet or work summary to transform into high-impact metrics...",
    suggestionPrompt: "Rewrite this resume bullet using the Google XYZ formula: 'Worked on backend API to speed up search response time.'",
  },
  {
    id: "interview",
    label: "Prepare for Interview",
    iconName: "Target",
    specialistTitle: "Interview Coach & Calibration",
    badge: "Interview Coach",
    description: "Technical & behavioral STAR calibration, mock questions, rubric evaluation.",
    placeholder: "Simulate a technical screen or ask for behavioral interview feedback...",
    suggestionPrompt: "Conduct a mock behavioral interview question for an SDE-2 role focusing on conflict resolution with a senior engineer.",
  },
  {
    id: "career",
    label: "Explore Career",
    iconName: "Compass",
    specialistTitle: "Career & Market Intelligence",
    badge: "Career Strategist",
    description: "Real-time Naukri & LinkedIn JD analysis, market compensation, role ladders.",
    placeholder: "Ask about career trajectories, in-demand skills, or market expectations...",
    suggestionPrompt: "What are the most in-demand skills for a High-Frequency Trading (HFT) C++ developer in 2026?",
  },
  {
    id: "projects",
    label: "Review Projects",
    iconName: "Cpu",
    specialistTitle: "Project Portfolio Architect",
    badge: "Project Architect",
    description: "Production readiness audits, architectural critique, standout portfolio features.",
    placeholder: "Share your project architecture or repository structure for expert review...",
    suggestionPrompt: "Review my portfolio project architecture: a real-time collaborative code editor using WebSockets and CRDTs.",
  },
  {
    id: "study_planning",
    label: "Create a Study Plan",
    iconName: "Calendar",
    specialistTitle: "Study Planner & Roadmap",
    badge: "Study Planner",
    description: "Personalized milestone calendars, spaced retrieval, weekly focus goals.",
    placeholder: "Tell me your target role and timeline to generate an evidence-based roadmap...",
    suggestionPrompt: "Build me an 8-week intensive study roadmap to prepare for staff engineer system design rounds.",
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
