"use client";

import React from "react";
import {
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Flame,
  Zap,
} from "lucide-react";
import { FocusArea } from "@/lib/ai-mentor/types";

interface AIMentorProgressProps {
  onContinueLearning: (topic: string, focusArea: FocusArea) => void;
}

export function AIMentorProgress({ onContinueLearning }: AIMentorProgressProps) {
  const MILESTONES = [
    {
      title: "Data Structures & Core Algorithmic Invariants",
      status: "completed",
      completedDate: "Nov 12, 2026",
      score: "94%",
    },
    {
      title: "Dynamic Programming (1D & 2D Tabulation Patterns)",
      status: "in_progress",
      completedDate: "In Progress",
      progress: 68,
    },
    {
      title: "Distributed Systems & Idempotency Key Protocols",
      status: "upcoming",
      completedDate: "Starts next week",
      progress: 0,
    },
    {
      title: "Mock Interview STAR Calibration & Technical Screen",
      status: "upcoming",
      completedDate: "Target: Week 6",
      progress: 0,
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#DCE5D5]">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-[#174B39]" />
          <h1 className="text-2xl sm:text-3xl font-serif text-[#17211E]">Learning Progress & Velocity</h1>
        </div>
        <p className="text-xs sm:text-sm text-[#69756B] mt-1">
          Evidence-driven progress metrics computed from verified Socratic quizzes, code reviews, and structured problem solving.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white/90 rounded-2xl border border-[#DCE5D5] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#69756B]">Active Streak</span>
            <div className="text-xl font-bold text-[#17211E]">5 Days</div>
          </div>
        </div>

        <div className="p-4 bg-white/90 rounded-2xl border border-[#DCE5D5] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EDF3E8] text-[#174B39] flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#69756B]">Concepts Solved</span>
            <div className="text-xl font-bold text-[#17211E]">24 Topics</div>
          </div>
        </div>

        <div className="p-4 bg-white/90 rounded-2xl border border-[#DCE5D5] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#69756B]">Quiz Accuracy</span>
            <div className="text-xl font-bold text-[#174B39]">87.5%</div>
          </div>
        </div>

        <div className="p-4 bg-white/90 rounded-2xl border border-[#DCE5D5] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#69756B]">Study Time</span>
            <div className="text-xl font-bold text-[#17211E]">14.2 hrs</div>
          </div>
        </div>
      </div>

      {/* Structured Roadmap Milestones */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#69756B] px-1">
          Active Curriculum Milestones
        </h2>

        <div className="space-y-3">
          {MILESTONES.map((ms, idx) => (
            <div
              key={idx}
              className="p-4 bg-white/90 rounded-2xl border border-[#DCE5D5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      ms.status === "completed"
                        ? "bg-emerald-500"
                        : ms.status === "in_progress"
                        ? "bg-amber-500 animate-pulse"
                        : "bg-slate-300"
                    }`}
                  />
                  <h3 className="text-sm font-semibold text-[#17211E]">{ms.title}</h3>
                </div>
                <div className="text-xs text-[#69756B] pl-4.5">{ms.completedDate}</div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {ms.status === "completed" && (
                  <span className="text-xs font-bold text-[#27875E] bg-[#E7F2DA] px-2.5 py-1 rounded-full border border-[#DCE5D5]">
                    Mastery: {ms.score}
                  </span>
                )}
                {ms.status === "in_progress" && (
                  <button
                    type="button"
                    onClick={() =>
                      onContinueLearning(
                        "Continue our Dynamic Programming study on 1D and 2D tabulation patterns.",
                        "coding_dsa"
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#174B39] hover:bg-[#123B2E] text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <span>Resume Module</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {ms.status === "upcoming" && (
                  <span className="text-xs text-[#69756B] bg-[#EDF3E8] px-2.5 py-1 rounded-full">
                    Locked
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

