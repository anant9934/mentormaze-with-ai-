"use client";

import React from "react";
import {
  Bot,
  Sparkles,
  BookOpen,
  Code2,
  Layers,
  FileText,
  Target,
  Compass,
  Cpu,
  Calendar,
  Zap,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { FocusArea } from "@/lib/ai-mentor/types";

interface AIMentorAgentsProps {
  onSelectCapability: (prompt: string, focusArea: FocusArea) => void;
}

export function AIMentorAgents({ onSelectCapability }: AIMentorAgentsProps) {
  const CAPABILITIES: {
    id: FocusArea;
    name: string;
    badge: string;
    icon: any;
    description: string;
    features: string[];
    samplePrompt: string;
  }[] = [
    {
      id: "learn",
      name: "Conceptual Pedagogy Specialist",
      badge: "First Principles Scaffolding",
      icon: BookOpen,
      description: "Deconstructs computer science concepts, distributed systems, and algorithmic theory into foundational invariants.",
      features: [
        "First-principles derivations and analogies",
        "Socratic invariant probing before code dumping",
        "Interactive concept verification quizzes",
      ],
      samplePrompt: "Explain how React reconciles virtual DOM diffs using first principles.",
    },
    {
      id: "coding_dsa",
      name: "Coding & DSA Specialist",
      badge: "Algorithmic Asymptotics",
      icon: Code2,
      description: "Line-by-line code review, asymptotic time/space proofs, edge-case analysis, and in-place memory optimization.",
      features: [
        "Big-O time and space complexity proofs",
        "Off-by-one and boundary violation detection",
        "Patience sorting, sliding window, and DP patterns",
      ],
      samplePrompt: "Walk me through the optimal approach for the Longest Increasing Subsequence with O(N log N) patience sorting.",
    },
    {
      id: "system_design",
      name: "Distributed Systems Architect",
      badge: "High-Throughput Systems",
      icon: Layers,
      description: "Scalability trade-offs, consensus protocols, caching layers, microservices decomposition, and resilience engineering.",
      features: [
        "Distributed idempotency key protocols",
        "Cache-aside invalidation and stampede mitigation",
        "CAP theorem and consistency trade-off analysis",
      ],
      samplePrompt: "How should I design an idempotency key layer for a distributed payment processing system?",
    },
    {
      id: "resume",
      name: "Resume Transformation Auditor",
      badge: "Google XYZ Alignment",
      icon: FileText,
      description: "Quantifies work history into high-impact Google XYZ bullets while strictly enforcing zero metric fabrication.",
      features: [
        "Accomplished [X] measured by [Y] by doing [Z]",
        "ATS keyword alignment from real job descriptions",
        "Zero-fabrication audit (flags unverified metric claims)",
      ],
      samplePrompt: "Rewrite this resume bullet using the Google XYZ formula: 'Worked on backend API to speed up search response time.'",
    },
    {
      id: "interview",
      name: "Interview Coach & Calibration",
      badge: "FAANG STAR Rubrics",
      icon: Target,
      description: "Conducts mock behavioral and technical rounds calibrated against engineering levels L3 to L6.",
      features: [
        "STAR framework story structuring",
        "Seniority calibration (L3 Junior to L6 Staff)",
        "Post-interview hiring decision rubric scoring",
      ],
      samplePrompt: "Conduct a mock behavioral interview question for an SDE-2 role focusing on conflict resolution with a senior engineer.",
    },
    {
      id: "career",
      name: "Career & Market Strategist",
      badge: "Job Intelligence",
      icon: Compass,
      description: "Analyzes 11,000+ Naukri and LinkedIn tech job descriptions to reveal exact skill gaps and compensation bands.",
      features: [
        "Real-time tech job market demand analysis",
        "Engineering ladder expectations and milestone roadmaps",
        "Market compensation benchmarks across Indian & global tech",
      ],
      samplePrompt: "What are the most in-demand skills for a High-Frequency Trading (HFT) C++ developer in 2026?",
    },
    {
      id: "projects",
      name: "Project Portfolio Architect",
      badge: "Full-Stack Portfolio",
      icon: Cpu,
      description: "Audits repository architecture, concurrency models, schema designs, and production readiness for standout portfolios.",
      features: [
        "CRDT and WebSocket real-time synchronization review",
        "Recruiter standout scoring and talking points",
        "Resiliency and fault-tolerance verification",
      ],
      samplePrompt: "Review my portfolio project architecture: a real-time collaborative code editor using WebSockets and CRDTs.",
    },
    {
      id: "study_planning",
      name: "Study Planner & Roadmap",
      badge: "Spaced Retrieval Pacing",
      icon: Calendar,
      description: "Designs evidence-based weekly study schedules calibrated to interview dates and student pacing.",
      features: [
        "8-to-24 week milestone pacing calendars",
        "Spaced repetition and active recall scheduling",
        "Continuous progress velocity tracking",
      ],
      samplePrompt: "Build me an 8-week intensive study roadmap to prepare for staff engineer system design rounds.",
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#DCE5D5]">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-[#174B39]" />
          <h1 className="text-2xl sm:text-3xl font-serif text-[#17211E]">Internal Specialist Capabilities</h1>
        </div>
        <p className="text-xs sm:text-sm text-[#69756B] mt-1">
          Dr. Aarav Mehta is a single unified mentor with 9 specialized analytical engines. Rather than multiple disconnected chatbots, you interact with one mentor who dynamically engages the right capability.
        </p>
      </div>

      {/* Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CAPABILITIES.map((cap) => {
          const Icon = cap.icon;
          return (
            <div
              key={cap.id}
              className="p-5 bg-white/90 hover:bg-white rounded-3xl border border-[#DCE5D5] hover:border-[#174B39]/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#174B39] bg-[#E7F2DA] px-2.5 py-0.5 rounded-full border border-[#DCE5D5]">
                    {cap.badge}
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-[#EDF3E8] group-hover:bg-[#E7F2DA] flex items-center justify-center text-[#174B39] transition-colors">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <h3 className="text-sm font-bold text-[#17211E] group-hover:text-[#174B39] transition-colors">
                  {cap.name}
                </h3>
                <p className="text-xs text-[#69756B] mt-1 leading-relaxed">
                  {cap.description}
                </p>

                <div className="mt-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#69756B]">
                    Core Analytical Strengths:
                  </span>
                  <ul className="text-xs text-[#17211E] space-y-1 pl-1">
                    {cap.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-1.5 text-[11px] text-[#69756B]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#27875E] mt-1.5 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectCapability(cap.samplePrompt, cap.id)}
                className="mt-4 pt-3 border-t border-[#EDF3E8] flex items-center justify-between w-full text-xs font-semibold text-[#174B39] group-hover:text-[#27875E] transition-colors"
              >
                <span>Engage this capability with Dr. Aarav</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
