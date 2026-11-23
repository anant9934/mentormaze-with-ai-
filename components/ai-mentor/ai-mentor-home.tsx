"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Sparkles,
  Target,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Bell,
  PlayCircle,
  BookOpen,
  Code2,
  Layers,
  FileText,
  Compass,
  Cpu,
  HeartHandshake,
  AlertTriangle,
} from "lucide-react";
import { FocusArea, LanguageCode } from "@/lib/ai-mentor/types";
import { FOCUS_AREAS_CONFIG, ConversationSummary } from "./ai-mentor-types";
import { AIMentorComposer } from "./ai-mentor-composer";
import { cn } from "@/lib/utils";
import { StudentGoal } from "./ai-mentor-goals-manager";
import { PersonalizedRoadmapRecord } from "@/lib/ai-mentor/roadmap/personalized-roadmap-service";

interface AIMentorHomeProps {
  onStartSession: (initialPrompt: string, focusArea?: FocusArea) => void;
  onOpenConversation: (conversationId: string) => void;
  onViewAllHistory: () => void;
  conversations: ConversationSummary[];
  onRenameConversation?: (conversationId: string, newTitle: string) => Promise<void>;
  onDeleteConversation?: (conversationId: string) => Promise<void>;
  studentName?: string;
  isStreaming?: boolean;
  userId?: string;
  activeGoal?: StudentGoal | null;
  activeRoadmap?: PersonalizedRoadmapRecord | null;
  onNavigateToRoadmap?: () => void;
  onNavigateToGoals?: () => void;
  onOpenCheckIn?: () => void;
}

export function AIMentorHome({
  onStartSession,
  onOpenConversation,
  onViewAllHistory,
  conversations,
  onRenameConversation,
  onDeleteConversation,
  studentName = "Student",
  isStreaming = false,
  userId = "usr-student-1",
  activeGoal: propActiveGoal,
  activeRoadmap: propActiveRoadmap,
  onNavigateToRoadmap,
  onNavigateToGoals,
  onOpenCheckIn,
}: AIMentorHomeProps) {
  const [selectedFocus, setSelectedFocus] = useState<FocusArea>("learn");
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>("en");

  // Local state for goals and roadmaps if not provided from parent shell
  const [localGoal, setLocalGoal] = useState<StudentGoal | null>(null);
  const [localRoadmap, setLocalRoadmap] = useState<PersonalizedRoadmapRecord | null>(null);
  const [verifiedSkillsCount, setVerifiedSkillsCount] = useState<number>(0);
  const [isLoadingState, setIsLoadingState] = useState(false);

  // Time-of-day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const primaryGoal = propActiveGoal !== undefined ? propActiveGoal : localGoal;
  const roadmap = propActiveRoadmap !== undefined ? propActiveRoadmap : localRoadmap;

  // Fetch real goal & roadmap on mount if not supplied
  const loadMentorshipState = useCallback(async () => {
    if (propActiveGoal !== undefined) return;
    setIsLoadingState(true);
    try {
      const goalsRes = await fetch(`/api/ai-mentor/goals?userId=${userId}`);
      const goalsData = await goalsRes.json();
      if (goalsData.success && Array.isArray(goalsData.goals)) {
        const primary =
          goalsData.goals.find((g: StudentGoal) => g.importance === "primary" && g.status === "active") ||
          goalsData.goals.find((g: StudentGoal) => g.status === "active") ||
          null;
        setLocalGoal(primary);

        if (primary) {
          const rdmRes = await fetch(`/api/ai-mentor/roadmaps?userId=${userId}&goalId=${primary.id}`);
          const rdmData = await rdmRes.json();
          if (rdmData.success && rdmData.roadmap) {
            setLocalRoadmap(rdmData.roadmap);
          }
        }
      }

      // Fetch verified skills count
      const skillsRes = await fetch(`/api/ai-mentor/skills?userId=${userId}`);
      const skillsData = await skillsRes.json();
      if (skillsData.success && Array.isArray(skillsData.skills)) {
        const verified = skillsData.skills.filter((s: any) => s.masteryState === "verified" || s.masteryScore >= 80);
        setVerifiedSkillsCount(verified.length);
      }
    } catch (err) {
      console.warn("Failed to load initial mentorship state on home:", err);
    } finally {
      setIsLoadingState(false);
    }
  }, [userId, propActiveGoal]);

  useEffect(() => {
    loadMentorshipState();
  }, [loadMentorshipState]);

  // Derived Roadmap details
  const completedMilestones = useMemo(() => {
    return roadmap?.milestones?.filter((m) => m.status === "completed") || [];
  }, [roadmap]);

  const remainingMilestones = useMemo(() => {
    return roadmap?.milestones?.filter((m) => m.status !== "completed") || [];
  }, [roadmap]);

  const currentMilestone = useMemo(() => {
    if (!roadmap?.milestones) return null;
    return (
      roadmap.milestones.find((m) => m.status === "in_progress") ||
      roadmap.milestones.find((m) => m.status === "pending") ||
      roadmap.milestones[0] ||
      null
    );
  }, [roadmap]);

  const lastCompletedMilestone = useMemo(() => {
    if (!completedMilestones.length) return null;
    return completedMilestones[completedMilestones.length - 1];
  }, [completedMilestones]);

  const roadmapProgressPct = useMemo(() => {
    if (!roadmap?.milestones?.length) return 0;
    return Math.round((completedMilestones.length / roadmap.milestones.length) * 100);
  }, [roadmap, completedMilestones]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* ========================================================================= */}
      {/* SECTION A: WELCOME FROM ASTRION (Context-Aware Greeting) */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-[#FAFAF2] to-[#EDF3E8] border border-[#DCE5D5] shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F2DA] border border-[#27875E]/30 text-[#174B39] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#27875E]" />
            <span>ASTRION · UNIFIED AI MENTOR</span>
          </div>

          {onOpenCheckIn && (
            <button
              type="button"
              onClick={onOpenCheckIn}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#E7F2DA] text-[#174B39] border border-[#DCE5D5] font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <HeartHandshake className="w-3.5 h-3.5 text-[#27875E]" />
              <span>Daily Check-In</span>
            </button>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#17211E] tracking-tight leading-tight">
          {greeting}, {studentName}.
        </h1>

        <p className="text-xs sm:text-sm text-[#415349] max-w-2xl leading-relaxed">
          {primaryGoal ? (
            <>
              Your active mentorship goal is <strong>{primaryGoal.title}</strong>.{" "}
              {currentMilestone ? (
                <>
                  You are currently scheduled for <strong>Week {currentMilestone.weekNumber}: {currentMilestone.title}</strong>.{" "}
                  {lastCompletedMilestone && `Your last milestone (${lastCompletedMilestone.title}) is verified and saved.`}
                </>
              ) : (
                "Your personalized roadmap is ready to be structured and reviewed."
              )}
            </>
          ) : (
            "Welcome to MentorMaze. I am ASTRION, your personal AI mentor. Let's define your primary engineering or career goal to begin."
          )}
        </p>
      </div>

      {/* ========================================================================= */}
      {/* SECTION D: YOUR NEXT STEP (Most Important Action on the Page) */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-3xl bg-[#174B39] text-white shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-200 font-bold">
            Recommended Next Step
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-800/80 text-emerald-100 border border-emerald-600">
            Priority Action
          </span>
        </div>

        {primaryGoal && currentMilestone ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-serif font-bold text-white leading-snug">
                Week {currentMilestone.weekNumber}: {currentMilestone.title}
              </h3>
              <p className="text-xs text-emerald-100/90 line-clamp-2 max-w-xl">
                {currentMilestone.description}
              </p>
              {currentMilestone.estimatedEffortHours && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-200 font-mono mt-1">
                  <Clock className="w-3 h-3" />
                  <span>Estimated effort: ~{currentMilestone.estimatedEffortHours} hours</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onStartSession(
                    `ASTRION, let's work on my current milestone: Week ${currentMilestone.weekNumber} (${currentMilestone.title}). Can you mentor me through the first concept?`,
                    "learn"
                  );
                }}
                className="px-4 py-2.5 rounded-2xl bg-white hover:bg-[#E7F2DA] text-[#174B39] font-bold text-xs transition-all shadow-sm flex items-center gap-1.5"
              >
                <span>Execute with ASTRION</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {onNavigateToRoadmap && (
                <button
                  type="button"
                  onClick={onNavigateToRoadmap}
                  className="px-3.5 py-2.5 rounded-2xl bg-emerald-800/80 hover:bg-emerald-700 text-white font-semibold text-xs border border-emerald-600 transition-colors"
                >
                  View Full Roadmap
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-serif font-bold text-white">Define your Primary Goal</h3>
              <p className="text-xs text-emerald-100/90 mt-1">
                Tell ASTRION what career milestone or engineering topic you want to master.
              </p>
            </div>
            {onNavigateToGoals && (
              <button
                type="button"
                onClick={onNavigateToGoals}
                className="px-4 py-2.5 rounded-2xl bg-white text-[#174B39] font-bold text-xs hover:bg-[#E7F2DA] transition-all shadow-sm shrink-0"
              >
                Set Primary Goal
              </button>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION B & C: CURRENT PRIMARY GOAL & PROGRESS OVERVIEW */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SECTION B: Current Primary Goal Card */}
        <div className="p-5 rounded-3xl bg-white/90 border border-[#DCE5D5] shadow-xs space-y-3.5 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[#27875E]" />
              <h3 className="font-serif font-bold text-sm text-[#17211E]">Current Primary Goal</h3>
            </div>
            {onNavigateToGoals && (
              <button
                type="button"
                onClick={onNavigateToGoals}
                className="text-[11px] font-semibold text-[#174B39] hover:underline flex items-center gap-1"
              >
                <span>Manage All Goals</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {primaryGoal ? (
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#EDF3E8] text-[#174B39]">
                    {primaryGoal.category}
                  </span>
                  <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Status: {primaryGoal.status}
                  </span>
                </div>
                <h4 className="text-base font-serif font-bold text-[#17211E]">
                  {primaryGoal.title}
                </h4>
                {primaryGoal.targetOutcome && (
                  <p className="text-xs text-[#69756B] mt-1 line-clamp-2">
                    {primaryGoal.targetOutcome}
                  </p>
                )}
              </div>

              {roadmap ? (
                <div className="p-3.5 rounded-2xl bg-[#FAFAF2] border border-[#EDF3E8] space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#174B39]">
                      Roadmap: {roadmap.targetRole || "Custom Engineering Path"}
                    </span>
                    <span className="font-mono text-emerald-700 font-bold">{roadmapProgressPct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#EDF3E8] overflow-hidden">
                    <div
                      className="h-full bg-[#27875E] rounded-full transition-all"
                      style={{ width: `${roadmapProgressPct}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-[#FAFAF2] border border-[#EDF3E8] text-xs text-[#69756B]">
                  No roadmap generated yet. Click below to generate your curriculum.
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#69756B] py-4">
              No active primary goal defined yet. Create your first goal to unlock structured roadmap guidance.
            </p>
          )}
        </div>

        {/* SECTION C: Real Persisted Progress Overview */}
        <div className="p-5 rounded-3xl bg-white/90 border border-[#DCE5D5] shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-[#27875E]" />
              <h3 className="font-serif font-bold text-sm text-[#17211E]">Progress Overview</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#FAFAF2] border border-[#EDF3E8] flex items-center justify-between">
                <span className="text-[#69756B]">Completed Milestones</span>
                <span className="font-mono font-bold text-[#17211E]">{completedMilestones.length}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAFAF2] border border-[#EDF3E8] flex items-center justify-between">
                <span className="text-[#69756B]">Remaining Milestones</span>
                <span className="font-mono font-bold text-[#17211E]">{remainingMilestones.length}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAFAF2] border border-[#EDF3E8] flex items-center justify-between">
                <span className="text-[#69756B]">Verified Competencies</span>
                <span className="font-mono font-bold text-emerald-700">{verifiedSkillsCount}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAFAF2] border border-[#EDF3E8] flex items-center justify-between">
                <span className="text-[#69756B]">Roadmap State</span>
                <span className="font-mono text-[11px] font-semibold text-[#174B39]">
                  {roadmap?.status || "None"}
                </span>
              </div>
            </div>
          </div>

          {onNavigateToRoadmap && (
            <button
              type="button"
              onClick={onNavigateToRoadmap}
              className="w-full py-2 rounded-xl bg-white hover:bg-[#EDF3E8] border border-[#DCE5D5] text-[#174B39] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Explore Milestones</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION E: TALK TO ASTRION (Unified Immediate Conversation Composer) */}
      {/* ========================================================================= */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#27875E]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#69756B]">
              Continue Mentorship with ASTRION
            </h3>
          </div>
          <span className="text-xs text-[#27875E] font-medium hidden sm:inline">
            Unified Mentorship · No specialist selection needed
          </span>
        </div>

        <AIMentorComposer
          onSendMessage={(content, options) => {
            onStartSession(content, options?.focusArea || selectedFocus);
          }}
          isStreaming={isStreaming}
          currentFocusArea={selectedFocus}
          onFocusAreaChange={setSelectedFocus}
          currentLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          variant="floating"
        />
      </div>

      {/* Recent Sessions */}
      {conversations.length > 0 && (
        <div className="pt-4 border-t border-[#EDF3E8]">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#69756B]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#69756B]">
                Recent Sessions
              </h4>
            </div>
            <button
              type="button"
              onClick={onViewAllHistory}
              className="text-xs font-semibold text-[#174B39] hover:text-[#27875E] flex items-center gap-1"
            >
              <span>View all ({conversations.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {conversations.slice(0, 3).map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => onOpenConversation(conv.id)}
                className="p-3.5 rounded-2xl bg-white border border-[#DCE5D5] hover:border-[#27875E] text-left transition-all space-y-1 shadow-2xs group"
              >
                <div className="font-semibold text-xs text-[#17211E] group-hover:text-[#174B39] truncate">
                  {conv.title || "Mentorship Session"}
                </div>
                <div className="text-[10px] text-[#69756B] flex items-center justify-between">
                  <span className="capitalize">{String(conv.mode || "learn").replace("_", " ")}</span>
                  <span>{new Date(conv.updatedAt || conv.createdAt).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
