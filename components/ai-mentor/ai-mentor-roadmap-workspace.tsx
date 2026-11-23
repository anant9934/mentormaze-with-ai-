"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Target,
  Calendar,
  Clock,
  CheckCircle2,
  PlayCircle,
  Sparkles,
  ArrowRight,
  BookOpen,
  FileCode,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  AlertCircle,
  Sliders,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PersonalizedRoadmapRecord, PersonalizedMilestone } from "@/lib/ai-mentor/roadmap/personalized-roadmap-service";

interface AIMentorRoadmapWorkspaceProps {
  userId: string;
  initialGoalId?: string;
  activeGoalId?: string;
  activeGoalTitle?: string;
  onAskMentor?: (milestone: PersonalizedMilestone) => void;
  onAskMentorMilestone?: (prompt: string) => void;
  onNavigateToGoals?: () => void;
  onMilestoneCompleted?: () => void;
}

export function AIMentorRoadmapWorkspace({
  userId,
  initialGoalId,
  activeGoalId,
  activeGoalTitle,
  onAskMentor,
  onAskMentorMilestone,
  onNavigateToGoals,
  onMilestoneCompleted,
}: AIMentorRoadmapWorkspaceProps) {
  const [goals, setGoals] = useState<any[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(initialGoalId || activeGoalId || null);
  const [roadmap, setRoadmap] = useState<PersonalizedRoadmapRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // Deliverable submission modal state
  const [submittingMilestone, setSubmittingMilestone] = useState<PersonalizedMilestone | null>(null);
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [evidenceRef, setEvidenceRef] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [isSavingProgress, setIsSavingProgress] = useState(false);

  // Adaptation modal state
  const [showAdaptModal, setShowAdaptModal] = useState(false);
  const [adaptReason, setAdaptReason] = useState("");
  const [newAvailableHours, setNewAvailableHours] = useState(15);
  const [isAdapting, setIsAdapting] = useState(false);

  // 1. Load active goals
  const loadGoals = useCallback(async () => {
    try {
      const res = await fetch(`/api/ai-mentor/goals?userId=${userId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.goals)) {
        setGoals(data.goals);
        if (!selectedGoalId) {
          const primary = data.goals.find((g: any) => g.importance === "primary" && g.status === "active") || data.goals[0];
          if (primary) {
            setSelectedGoalId(primary.id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load goals for roadmap:", err);
    }
  }, [userId, selectedGoalId]);

  // 2. Load active roadmap for selected goal
  const loadRoadmap = useCallback(async (goalId: string) => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/ai-mentor/roadmaps?userId=${userId}&goalId=${goalId}`);
      const data = await res.json();
      if (data.success && data.roadmap) {
        setRoadmap(data.roadmap);
      } else {
        setRoadmap(null);
      }
    } catch (err: any) {
      console.error("Failed to load roadmap:", err);
      setActionError("Failed to load roadmap.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  useEffect(() => {
    if (selectedGoalId) {
      loadRoadmap(selectedGoalId);
    } else {
      setIsLoading(false);
    }
  }, [selectedGoalId, loadRoadmap]);

  // 3. Generate Roadmap for Selected Goal (if none exists)
  const handleGenerateRoadmap = async () => {
    if (!selectedGoalId) return;
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await fetch("/api/ai-mentor/roadmaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          goalId: selectedGoalId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Roadmap generation failed");
      setRoadmap(data.roadmap);
      setActionSuccessNotice("Generated personalized roadmap tailored to your verified goals.");
      setTimeout(() => setActionSuccessNotice(null), 3000);
    } catch (err: any) {
      setActionError(err.message || "Failed to generate roadmap.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Milestone Progression: Start Milestone
  const handleStartMilestone = async (weekNumber: number) => {
    if (!roadmap) return;
    try {
      const res = await fetch("/api/ai-mentor/roadmaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark_progress",
          roadmapId: roadmap.id,
          weekNumber,
          status: "in_progress",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to start milestone");
      setRoadmap(data.roadmap);
      setActionSuccessNotice(`Milestone Week ${weekNumber} started.`);
      setTimeout(() => setActionSuccessNotice(null), 3000);
    } catch (err: any) {
      setActionError(err.message || "Failed to start milestone.");
    }
  };

  // 5. Submit Deliverable & Confirm Completion
  const handleSubmitCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roadmap || !submittingMilestone) return;

    setIsSavingProgress(true);
    setActionError(null);
    try {
      const res = await fetch("/api/ai-mentor/roadmaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark_progress",
          roadmapId: roadmap.id,
          weekNumber: submittingMilestone.weekNumber,
          status: "completed",
          studentConfirmation: true,
          evidenceRef: evidenceRef.trim() || undefined,
          deliverableUrl: deliverableUrl.trim() || undefined,
          assessmentNotes: completionNotes.trim() || "Student confirmed completion of milestone deliverable.",
          provenance: "student_confirmed",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to mark completion");
      setRoadmap(data.roadmap);
      onMilestoneCompleted?.();
      setSubmittingMilestone(null);
      setDeliverableUrl("");
      setEvidenceRef("");
      setCompletionNotes("");
      setActionSuccessNotice(`Milestone Week ${submittingMilestone.weekNumber} completed and persisted with evidence.`);
      setTimeout(() => setActionSuccessNotice(null), 3500);
    } catch (err: any) {
      setActionError(err.message || "Failed to confirm milestone completion.");
    } finally {
      setIsSavingProgress(false);
    }
  };

  // 6. Adapt Roadmap Schedule
  const handleAdaptSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roadmap || !adaptReason.trim()) return;

    setIsAdapting(true);
    setActionError(null);
    try {
      const res = await fetch("/api/ai-mentor/roadmaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adapt",
          roadmapId: roadmap.id,
          reason: adaptReason.trim(),
          availableHoursPerWeek: Number(newAvailableHours),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Roadmap adaptation failed");
      setRoadmap(data.roadmap);
      setShowAdaptModal(false);
      setAdaptReason("");
      setActionSuccessNotice("Roadmap schedule successfully adapted. Completed milestones were preserved.");
      setTimeout(() => setActionSuccessNotice(null), 3500);
    } catch (err: any) {
      setActionError(err.message || "Failed to adapt roadmap schedule.");
    } finally {
      setIsAdapting(false);
    }
  };

  const selectedGoal = goals.find((g) => g.id === selectedGoalId);
  const completedMilestonesCount = roadmap?.milestones.filter((m) => m.status === "completed").length || 0;
  const totalMilestonesCount = roadmap?.milestones.length || 0;
  const progressPct = totalMilestonesCount > 0 ? Math.round((completedMilestonesCount / totalMilestonesCount) * 100) : 0;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* 1. Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE5D5]">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#174B39]" />
            <h1 className="text-2xl sm:text-3xl font-serif text-[#17211E]">Personalized Roadmap & Milestones</h1>
          </div>
          <p className="text-xs sm:text-sm text-[#69756B] mt-1">
            Structured week-by-week engineering curriculum aligned to your target goal and verified skills.
          </p>
        </div>

        {/* Goal Selector Switcher */}
        {goals.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#69756B] font-medium hidden sm:inline">Goal:</span>
            <select
              value={selectedGoalId || ""}
              onChange={(e) => setSelectedGoalId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#DCE5D5] text-xs font-semibold text-[#17211E] bg-[#FAFAF2] focus:outline-none focus:ring-1 focus:ring-[#27875E]"
            >
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} {g.importance === "primary" ? "(Primary)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {actionError && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="p-1 hover:text-red-950">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {actionSuccessNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccessNotice}</span>
        </div>
      )}

      {/* 2. Roadmap Summary Banner */}
      {roadmap ? (
        <div className="p-5 rounded-3xl bg-white/90 border border-[#DCE5D5] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#E7F2DA] text-[#174B39] border border-[#27875E]/30">
                  Status: {roadmap.status}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FAFAF2] text-[#69756B] border border-[#DCE5D5]">
                  {roadmap.totalWeeks} Weeks Total
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FAFAF2] text-[#69756B] border border-[#DCE5D5]">
                  Readiness: {roadmap.startingReadinessScore}%
                </span>
              </div>
              <h2 className="text-lg font-serif font-bold text-[#17211E]">
                {roadmap.targetRole || selectedGoal?.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAdaptModal(true)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#EDF3E8] text-[#174B39] border border-[#DCE5D5] font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Adjust Schedule</span>
              </button>
            </div>
          </div>

          {roadmap.adaptedReason && (
            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Schedule Adapted:</strong> {roadmap.adaptedReason}
              </span>
            </div>
          )}

          {/* Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#174B39]">
                Progress: {completedMilestonesCount} of {totalMilestonesCount} Milestones Completed
              </span>
              <span className="font-mono font-bold text-[#27875E]">{progressPct}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#EDF3E8] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#27875E] to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <div className="text-center py-12 text-[#69756B] text-xs">Loading roadmap...</div>
      ) : (
        <div className="text-center py-12 bg-white/70 rounded-3xl border border-[#DCE5D5] p-6 space-y-3">
          <Target className="w-8 h-8 text-[#69756B]/60 mx-auto" />
          <h3 className="font-semibold text-sm text-[#17211E]">No active roadmap for this goal</h3>
          <p className="text-xs text-[#69756B] max-w-sm mx-auto">
            Generate an evidence-aligned, structured week-by-week curriculum tailored to your background.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleGenerateRoadmap}
              className="px-4 py-2 rounded-xl bg-[#174B39] text-white text-xs font-semibold hover:bg-[#123B2E] transition-all shadow-xs"
            >
              Generate Personalized Roadmap
            </button>
            <button
              type="button"
              onClick={onNavigateToGoals}
              className="px-3 py-2 rounded-xl bg-white border border-[#DCE5D5] text-[#17211E] text-xs font-medium hover:bg-[#FAFAF2]"
            >
              Manage Goals
            </button>
          </div>
        </div>
      )}

      {/* 3. Milestone Cards List */}
      {roadmap && roadmap.milestones && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#69756B]">
              Curriculum Milestones
            </h3>
            <span className="text-xs text-[#27875E] font-medium hidden sm:inline">
              Evidence-based sign-off required
            </span>
          </div>

          {roadmap.milestones.map((ms) => {
            const isCompleted = ms.status === "completed";
            const isInProgress = ms.status === "in_progress";
            const isPending = ms.status === "pending";

            return (
              <div
                key={ms.id || ms.weekNumber}
                className={cn(
                  "p-5 rounded-3xl border transition-all space-y-4",
                  isCompleted
                    ? "bg-[#F0FDF4]/50 border-emerald-200"
                    : isInProgress
                    ? "bg-white border-[#27875E] shadow-sm ring-1 ring-[#27875E]/20"
                    : "bg-white/70 border-[#DCE5D5] opacity-90"
                )}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-[#EDF3E8] text-[#174B39] border border-[#27875E]/20">
                      Week {ms.weekNumber}
                    </span>
                    <h4 className="text-sm sm:text-base font-serif font-bold text-[#17211E]">
                      {ms.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#69756B] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#27875E]" />
                      <span>~{ms.estimatedEffortHours}h</span>
                    </span>

                    <span
                      className={cn(
                        "text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border",
                        isCompleted
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : isInProgress
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      )}
                    >
                      {ms.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Description & Tasks */}
                <p className="text-xs text-[#415349] leading-relaxed">
                  {ms.description}
                </p>

                {/* Required Skills & Success Criteria */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {ms.requiredSkills && ms.requiredSkills.length > 0 && (
                    <div className="p-3 rounded-2xl bg-[#FAFAF2] border border-[#EDF3E8] space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#174B39] block">
                        Target Skills
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {ms.requiredSkills.map((sk, sIdx) => (
                          <span key={sIdx} className="px-2 py-0.5 rounded-md bg-white border border-[#DCE5D5] text-[11px] font-medium text-[#17211E]">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {ms.successCriteria && ms.successCriteria.length > 0 && (
                    <div className="p-3 rounded-2xl bg-[#FAFAF2] border border-[#EDF3E8] space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#174B39] block">
                        Completion Criteria
                      </span>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-[#415349]">
                        {ms.successCriteria.map((sc, scIdx) => (
                          <li key={scIdx}>{sc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Completed Milestone Evidence Card */}
                {isCompleted && (
                  <div className="p-3.5 rounded-2xl bg-white border border-emerald-200 text-xs text-emerald-950 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between font-bold text-emerald-900">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Verified Student Evidence & Provenance</span>
                      </span>
                      {ms.completedAt && (
                        <span className="text-[10px] font-mono text-emerald-700">
                          {new Date(ms.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {ms.evidenceRef && (
                      <p className="text-[11px] font-mono text-emerald-800 break-all">
                        <span className="font-semibold">Evidence Ref:</span> {ms.evidenceRef}
                      </p>
                    )}
                    {ms.deliverableUrl && (
                      <div className="text-[11px]">
                        <span className="font-semibold text-emerald-900">Deliverable: </span>
                        <a
                          href={ms.deliverableUrl.startsWith("http") ? ms.deliverableUrl : `https://${ms.deliverableUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 underline font-mono hover:text-emerald-900"
                        >
                          {ms.deliverableUrl}
                        </a>
                      </div>
                    )}
                    {ms.assessmentNotes && (
                      <p className="text-[11px] text-emerald-900/90 italic">
                        "{ms.assessmentNotes}"
                      </p>
                    )}
                  </div>
                )}

                {/* Milestone Functional Actions */}
                <div className="pt-2 flex items-center justify-between gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (onAskMentor) {
                          onAskMentor(ms);
                        } else if (onAskMentorMilestone) {
                          onAskMentorMilestone(`ASTRION, can you mentor me on Milestone Week ${ms.weekNumber} (${ms.title})? Where should I start?`);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#EDF3E8] text-[#174B39] border border-[#DCE5D5] font-semibold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Ask ASTRION</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleStartMilestone(ms.weekNumber)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#174B39] hover:bg-[#123B2E] text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-2xs"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Start Milestone</span>
                      </button>
                    )}

                    {isInProgress && (
                      <button
                        type="button"
                        onClick={() => setSubmittingMilestone(ms)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#27875E] hover:bg-[#174B39] text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Submit Deliverable & Confirm</span>
                      </button>
                    )}

                    {isCompleted && (
                      <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Deliverable Submission Modal */}
      {submittingMilestone && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DCE5D5] shadow-xl w-full max-w-lg p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDF3E8]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#27875E]" />
                <h2 className="font-serif font-bold text-lg text-[#17211E]">
                  Confirm Milestone Completion
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSubmittingMilestone(null)}
                className="p-1.5 rounded-xl text-[#69756B] hover:bg-[#FAFAF2]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#69756B]">
              Week {submittingMilestone.weekNumber}: <strong>{submittingMilestone.title}</strong>
            </p>

            <form onSubmit={handleSubmitCompletion} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-[#17211E] block mb-1">
                  Deliverable Artifact URL or Pull Request
                </label>
                <input
                  type="text"
                  value={deliverableUrl}
                  onChange={(e) => setDeliverableUrl(e.target.value)}
                  placeholder="e.g. github.com/username/project/pull/12"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE5D5] text-[#17211E] focus:outline-none focus:ring-1 focus:ring-[#27875E]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#17211E] block mb-1">
                  Commit SHA / Test Evidence Reference
                </label>
                <input
                  type="text"
                  value={evidenceRef}
                  onChange={(e) => setEvidenceRef(e.target.value)}
                  placeholder="e.g. commit-sha-7a8b9c or pytest-suite-pass"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE5D5] text-[#17211E] focus:outline-none focus:ring-1 focus:ring-[#27875E]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#17211E] block mb-1">
                  Student Sign-off & Completion Notes
                </label>
                <textarea
                  rows={2}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Summarize what you built, solved, and verified against the completion criteria..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#DCE5D5] text-[#17211E] focus:outline-none focus:ring-1 focus:ring-[#27875E]"
                />
              </div>

              <div className="p-3 rounded-2xl bg-[#FAFAF2] border border-[#EDF3E8] text-[11px] text-[#415349] space-y-1">
                <span className="font-semibold text-[#174B39] block">Evidence-Based Integrity Guarantee:</span>
                <p>
                  Submitting will mark this milestone completed in your persistent database record with an immutable student confirmation timestamp.
                </p>
              </div>

              <div className="pt-3 border-t border-[#EDF3E8] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubmittingMilestone(null)}
                  className="px-4 py-2 rounded-xl text-[#69756B] hover:bg-[#FAFAF2] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProgress}
                  className="px-4 py-2 rounded-xl bg-[#174B39] hover:bg-[#123B2E] text-white font-semibold transition-all shadow-xs disabled:opacity-50"
                >
                  {isSavingProgress ? "Persisting..." : "Sign Off & Complete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Schedule Adaptation Modal */}
      {showAdaptModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DCE5D5] shadow-xl w-full max-w-lg p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDF3E8]">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#27875E]" />
                <h2 className="font-serif font-bold text-lg text-[#17211E]">
                  Adjust Roadmap Schedule
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAdaptModal(false)}
                className="p-1.5 rounded-xl text-[#69756B] hover:bg-[#FAFAF2]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdaptSchedule} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-[#17211E] block mb-1">
                  Reason for Adjustment *
                </label>
                <textarea
                  required
                  rows={2}
                  value={adaptReason}
                  onChange={(e) => setAdaptReason(e.target.value)}
                  placeholder="e.g. University exams next two weeks; reducing weekly study hours to 8h."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#DCE5D5] text-[#17211E] focus:outline-none focus:ring-1 focus:ring-[#27875E]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#17211E] block mb-1">
                  New Available Hours per Week ({newAvailableHours}h / week)
                </label>
                <input
                  type="range"
                  min={5}
                  max={40}
                  step={1}
                  value={newAvailableHours}
                  onChange={(e) => setNewAvailableHours(Number(e.target.value))}
                  className="w-full accent-[#27875E]"
                />
                <div className="flex justify-between text-[10px] text-[#69756B] mt-1 font-mono">
                  <span>5h (Part-time)</span>
                  <span>15h (Standard)</span>
                  <span>40h (Full-time)</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <span className="font-semibold block">Adaptation Safety Invariant:</span>
                <p>
                  No completed milestones or earned skill evidence will be lost. Subsequent milestones will be dynamically re-paced to match your availability.
                </p>
              </div>

              <div className="pt-3 border-t border-[#EDF3E8] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdaptModal(false)}
                  className="px-4 py-2 rounded-xl text-[#69756B] hover:bg-[#FAFAF2] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdapting || !adaptReason.trim()}
                  className="px-4 py-2 rounded-xl bg-[#174B39] hover:bg-[#123B2E] text-white font-semibold transition-all shadow-xs disabled:opacity-50"
                >
                  {isAdapting ? "Adapting..." : "Apply Adapted Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
