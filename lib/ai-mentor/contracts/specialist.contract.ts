/**
 * ASTRION Specialist Capabilities Contract
 * Defines canonical specialist contracts for SAGE, CIPHER, ATLAS, FORGE, VECTRA, PRISM, ORACLE, CHRONOS.
 */

import { FocusArea } from "../types";

export type SpecialistCodeName =
  | "SAGE"
  | "CIPHER"
  | "ATLAS"
  | "FORGE"
  | "VECTRA"
  | "PRISM"
  | "ORACLE"
  | "CHRONOS";

export interface SpecialistContract {
  codeName: SpecialistCodeName;
  focusAreaId: FocusArea;
  responsibility: string;
  displayName: string;
  tagline: string;
  description: string;
  domainTags: readonly string[];
  intentKeywords: readonly string[];
  requiredContext: readonly string[];
  outputFormat: "markdown_with_structured_pills" | "code_review" | "system_architecture" | "roadmap";
  isAvailable: boolean;
}

export const CANONICAL_SPECIALISTS: Record<SpecialistCodeName, SpecialistContract> = {
  SAGE: {
    codeName: "SAGE",
    focusAreaId: "learn",
    responsibility: "Learning intelligence",
    displayName: "SAGE — Learning Intelligence",
    tagline: "First-Principles Conceptual Scaffolding",
    description: "Deep-dive explanations using first principles, intuitive analogies, and progressive scaffolding.",
    domainTags: ["conceptual", "theory", "first_principles", "pedagogy"],
    intentKeywords: ["explain", "concept", "how does", "what is", "intuition", "under the hood"],
    requiredContext: ["learning_preferences", "current_goals"],
    outputFormat: "markdown_with_structured_pills",
    isAvailable: true,
  },
  CIPHER: {
    codeName: "CIPHER",
    focusAreaId: "coding_dsa",
    responsibility: "Programming and DSA",
    displayName: "CIPHER — Programming and DSA",
    tagline: "Algorithm Optimization & Space-Time Analysis",
    description: "Code syntax audits, edge case diagnostics, Big-O asymptotic analysis, and optimal data structure guidance.",
    domainTags: ["algorithms", "data_structures", "code_review", "leetcode", "complexity"],
    intentKeywords: ["code", "debug", "time complexity", "space complexity", "leetcode", "dsa", "two sum"],
    requiredContext: ["confirmed_weaknesses", "confirmed_strengths"],
    outputFormat: "code_review",
    isAvailable: true,
  },
  ATLAS: {
    codeName: "ATLAS",
    focusAreaId: "system_design",
    responsibility: "Systems architecture",
    displayName: "ATLAS — Systems Architecture",
    tagline: "High-Scale Distributed Systems & Trade-Offs",
    description: "High-level architecture, scalability trade-offs, microservices, consensus protocols, and caching patterns.",
    domainTags: ["distributed_systems", "scalability", "microservices", "caching", "databases"],
    intentKeywords: ["system design", "distributed", "rate limiter", "kafka", "cache", "scale", "sharding"],
    requiredContext: ["career_objectives"],
    outputFormat: "system_architecture",
    isAvailable: true,
  },
  FORGE: {
    codeName: "FORGE",
    focusAreaId: "projects",
    responsibility: "Project intelligence",
    displayName: "FORGE — Project Intelligence",
    tagline: "Production Engineering & Architecture Audits",
    description: "Production readiness audits, architectural critique, standout portfolio features, and Docker/CI-CD reviews.",
    domainTags: ["projects", "portfolio", "fullstack", "devops", "production_readiness"],
    intentKeywords: ["project", "portfolio", "build", "tech stack", "docker", "ci/cd"],
    requiredContext: ["active_projects"],
    outputFormat: "markdown_with_structured_pills",
    isAvailable: true,
  },
  VECTRA: {
    codeName: "VECTRA",
    focusAreaId: "career",
    responsibility: "Career strategy",
    displayName: "VECTRA — Career Strategy",
    tagline: "Real-Time Job Intelligence & Role Ladders",
    description: "Real-time market compensation, JD skill gap analysis, seniority ladders, and target company roadmaps.",
    domainTags: ["career", "compensation", "job_market", "seniority", "skills_gap"],
    intentKeywords: ["career", "salary", "job description", "sde 1", "sde 2", "compensation", "role ladder"],
    requiredContext: ["career_objectives"],
    outputFormat: "markdown_with_structured_pills",
    isAvailable: true,
  },
  PRISM: {
    codeName: "PRISM",
    focusAreaId: "resume",
    responsibility: "Resume intelligence",
    displayName: "PRISM — Resume Intelligence",
    tagline: "Google XYZ Metric Alignment & ATS Optimization",
    description: "Google XYZ formula alignment, ATS score diagnostics, metric quantification, and action verb calibration.",
    domainTags: ["resume", "cv", "google_xyz", "ats_optimization", "impact_metrics"],
    intentKeywords: ["resume", "cv", "bullet point", "xyz formula", "ats", "accomplished"],
    requiredContext: ["career_objectives", "active_projects"],
    outputFormat: "markdown_with_structured_pills",
    isAvailable: true,
  },
  ORACLE: {
    codeName: "ORACLE",
    focusAreaId: "interview",
    responsibility: "Interview intelligence",
    displayName: "ORACLE — Interview Intelligence",
    tagline: "STAR Method Diagnostics & Rubric Calibration",
    description: "Technical & behavioral STAR calibration, mock questions, FAANG rubric evaluation, and live feedback.",
    domainTags: ["interview", "mock_interview", "behavioral", "star_method", "rubric"],
    intentKeywords: ["interview", "behavioral", "star", "mock interview", "tell me about a time"],
    requiredContext: ["career_objectives", "confirmed_strengths", "confirmed_weaknesses"],
    outputFormat: "markdown_with_structured_pills",
    isAvailable: true,
  },
  CHRONOS: {
    codeName: "CHRONOS",
    focusAreaId: "study_planning",
    responsibility: "Planning intelligence",
    displayName: "CHRONOS — Planning Intelligence",
    tagline: "Milestone Roadmaps & Spaced Retrieval",
    description: "Personalized milestone calendars, spaced retrieval, weekly focus goals, and prerequisite tracking.",
    domainTags: ["study_plan", "roadmap", "milestones", "schedule", "pacing"],
    intentKeywords: ["study plan", "roadmap", "schedule", "timeline", "weeks", "how to prepare"],
    requiredContext: ["learning_preferences", "current_goals"],
    outputFormat: "roadmap",
    isAvailable: true,
  },
};
