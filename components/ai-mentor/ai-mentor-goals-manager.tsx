"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Target,
  Plus,
  Compass,
  Calendar,
  Clock,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  RotateCcw,
  Edit2,
  Trash2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface StudentGoal {
  id: string;
  studentUserId: string;
  title: string;
  description?: string;
  category: "career" | "skill" | "project" | "academic" | "certification";
  importance: "primary" | "secondary" | "exploratory";
  targetDate?: string;
  status: "active" | "paused" | "completed" | "abandoned";
  targetOutcome?: string;
  currentState?: string;
  roadmapId?: string;
  createdAt: string;
  updatedAt: string;
}

interface AIMentorGoalsManagerProps {
  userId: string;
  onSelectGoal?: (goal: StudentGoal) => void;
  onOpenRoadmap?: (goalId: string) => void;
  onAskMentorAboutGoal?: (prompt: string) => void;
  onGoalsUpdated?: () => void;
  onGoalUpdated?: () => void;
}

export function AIMentorGoalsManager({
  userId,
  onSelectGoal,
  onOpenRoadmap,
  onAskMentorAboutGoal,
  onGoalsUpdated,
  onGoalUpdated,
}: AIMentorGoalsManagerProps) {
  const [goals, setGoals] = useState<StudentGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "paused" | "completed">("active");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<StudentGoal | null>(null);
  const [conflictReport, setConflictReport] = useState<any>(null);

  // Form states for creating/editing
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<StudentGoal["category"]>("career");
  const [importance, setImportance] = useState<StudentGoal["importance"]>("primary");
  const [targetOutcome, setTargetOutcome] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [declaredHours, setDeclaredHours] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // 1. Fetch Goals & Conflicts from API
  const loadGoals = useCallback(async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/ai-mentor/goals?userId=${userId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.goals)) {
        setGoals(data.goals);
      }

      // Check conflicts
      const conflictRes = await fetch(`/api/ai-mentor/goals?conflicts=true&availableHours=${declaredHours}`);
      const conflictData = await conflictRes.json();
      if (conflictData.success && conflictData.conflictReport) {
        setConflictReport(conflictData.conflictReport);
      }
    } catch (err: any) {
      console.error("Failed to load goals:", err);
      setActionError("Failed to load goals from database.");
    } finally {
      setIsLoading(false);
    }
  }, [userId, declaredHours]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  // 2. Goal Creation / Update
  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setActionError(null);
    try {
      if (editingGoal) {
        // Update existing goal
        const res = await fetch("/api/ai-mentor/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            goalId: editingGoal.id,
            updates: {
              title: title.trim(),
              category,
              importance,
              targetOutcome: targetOutcome.trim() || undefined,
              targetDate: targetDate || undefined,
            },
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Update failed");
      } else {
        // Create new goal
        const res = await fetch("/api/ai-mentor/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            category,
            importance,
            targetOutcome: targetOutcome.trim() || undefined,
            targetDate: targetDate || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Creation failed");
      }

      setShowCreateModal(false);
      setEditingGoal(null);
      resetForm();
      await loadGoals();
      onGoalsUpdated?.();
      onGoalUpdated?.();
    } catch (err: any) {
      console.error("Failed to save goal:", err);
      setActionError(err.message || "Failed to save goal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setCategory("career");
    setImportance("primary");
    setTargetOutcome("");
    setTargetDate("");
  };

  // 3. Priority Switch (Atomic Demotion)
  const handleSetPriority = async (goalId: string, newImportance: "primary" | "secondary") => {
    try {
      const res = await fetch("/api/ai-mentor/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_priority",
          goalId,
          importance: newImportance,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Priority switch failed");
      await loadGoals();
      onGoalsUpdated?.();
      onGoalUpdated?.();
    } catch (err: any) {
      setActionError(err.message || "Failed to change priority.");
    }
  };

  // 4. State Transitions (Pause, Resume, Complete, Abandon)
  const handleTransition = async (goalId: string, action: "pause" | "resume" | "complete" | "abandon" | "restore") => {
    try {
      const res = await fetch("/api/ai-mentor/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, goalId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Transition failed");
      await loadGoals();
      onGoalsUpdated?.();
      onGoalUpdated?.();
    } catch (err: any) {
      setActionError(err.message || "Action failed.");
    }
  };

  const filteredGoals = goals.filter((g) => {
    if (activeTab === "active") return g.status === "active";
    if (activeTab === "paused") return g.status === "paused";
    if (activeTab === "completed") return g.status === "completed" || g.status === "abandoned";
    return true;
  });

  const primaryGoal = goals.find((g) => g.importance === "primary" && g.status === "active");

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE5D5]">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-[#174B39]" />
            <h1 className="text-2xl sm:text-3xl font-serif text-[#17211E]">Personal Mentorship Goals</h1>
          </div>
          <p className="text-xs sm:text-sm text-[#69756B] mt-1">
            Define your targets, set priorities, and let ASTRION align your roadmap and daily milestones.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingGoal(null);
            resetForm();
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#174B39] hover:bg-[#123B2E] text-white font-semibold text-xs transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Personal Goal</span>
        </button>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="p-1 hover:text-red-950">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Personalized Workload & Capacity Banner */}
      {conflictReport && conflictReport.isWorkloadOverCapacity && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs shadow-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-amber-900">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Workload Capacity Warning: {conflictReport.totalEstimatedWeeklyEffortHours}h / week estimated</span>
            </span>
            <span className="font-mono text-[11px] bg-amber-200/80 px-2 py-0.5 rounded-full text-amber-900">
              Declared Limit: {conflictReport.studentDeclaredAvailableHoursPerWeek}h
            </span>
          </div>
          <p className="text-[11px] text-amber-900/90 leading-relaxed">
            {conflictReport.tradeOffAnalysis?.[0] || "Your active goals exceed your student-declared availability. Focus on one primary goal to prevent burnout."}
          </p>
        </div>
      )}

      {/* 3. Status Tabs */}
      <div className="flex items-center gap-2 border-b border-[#EDF3E8] pb-1">
        {(["active", "paused", "completed"] as const).map((tab) => {
          const count = goals.filter((g) => {
            if (tab === "active") return g.status === "active";
            if (tab === "paused") return g.status === "paused";
            if (tab === "completed") return g.status === "completed" || g.status === "abandoned";
            return false;
          }).length;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all flex items-center gap-1.5",
                activeTab === tab
                  ? "bg-[#E7F2DA] text-[#174B39] border border-[#27875E]/30"
                  : "text-[#69756B] hover:text-[#17211E] hover:bg-[#FAFAF2]"
              )}
            >
              <span>{tab} Goals</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/80 border border-[#DCE5D5]">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Goal List Cards */}
      {isLoading ? (
        <div className="text-center py-12 text-[#69756B] text-xs">Loading persisted goals...</div>
      ) : filteredGoals.length === 0 ? (
        <div className="text-center py-12 bg-white/70 rounded-3xl border border-[#DCE5D5] p-6 space-y-3">
          <Target className="w-8 h-8 text-[#69756B]/60 mx-auto" />
          <h3 className="font-semibold text-sm text-[#17211E]">No {activeTab} goals found</h3>
          <p className="text-xs text-[#69756B] max-w-sm mx-auto">
            {activeTab === "active"
              ? "Tell ASTRION what you want to achieve or create a personal goal to generate your personalized roadmap."
              : `You have no ${activeTab} goals.`}
          </p>
          {activeTab === "active" && (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#174B39] text-white text-xs font-semibold"
            >
              Define Your First Goal
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGoals.map((goal) => {
            const isPrimary = goal.importance === "primary" && goal.status === "active";
            return (
              <div
                key={goal.id}
                className={cn(
                  "p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4",
                  isPrimary
                    ? "bg-gradient-to-br from-white to-[#FAFAF2] border-[#27875E] shadow-sm ring-1 ring-[#27875E]/20"
                    : "bg-white/90 border-[#DCE5D5] hover:border-[#27875E]/40 shadow-xs"
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#EDF3E8] text-[#174B39]">
                        {goal.category}
                      </span>
                      {isPrimary && (
                        <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#E7F2DA] text-[#174B39] border border-[#27875E]/40 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-[#27875E]" />
                          <span>Primary Focus</span>
                        </span>
                      )}
                      {goal.status === "paused" && (
                        <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Paused
                        </span>
                      )}
                      {goal.status === "completed" && (
                        <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Completed
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGoal(goal);
                          setTitle(goal.title);
                          setCategory(goal.category);
                          setImportance(goal.importance);
                          setTargetOutcome(goal.targetOutcome || "");
                          setTargetDate(goal.targetDate || "");
                          setShowCreateModal(true);
                        }}
                        className="p-1.5 rounded-lg text-[#69756B] hover:text-[#17211E] hover:bg-[#EDF3E8]"
                        title="Edit goal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-serif font-bold text-[#17211E] leading-snug">
                    {goal.title}
                  </h3>

                  {goal.targetOutcome && (
                    <p className="text-xs text-[#69756B] mt-1.5 line-clamp-2">
                      <span className="font-semibold text-[#174B39]">Target Outcome:</span> {goal.targetOutcome}
                    </p>
                  )}

                  {goal.targetDate && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#69756B] mt-2 font-mono">
                      <Calendar className="w-3 h-3 text-[#27875E]" />
                      <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-[#EDF3E8] flex items-center justify-between gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-1.5">
                    {goal.status === "active" && !isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPriority(goal.id, "primary")}
                        className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#EDF3E8] text-[#174B39] border border-[#DCE5D5] font-semibold text-[11px] transition-colors"
                      >
                        Make Primary
                      </button>
                    )}

                    {goal.status === "active" ? (
                      <button
                        type="button"
                        onClick={() => handleTransition(goal.id, "pause")}
                        className="p-1.5 rounded-xl text-[#69756B] hover:text-amber-800 hover:bg-amber-50"
                        title="Pause Goal"
                      >
                        <PauseCircle className="w-4 h-4" />
                      </button>
                    ) : goal.status === "paused" ? (
                      <button
                        type="button"
                        onClick={() => handleTransition(goal.id, "resume")}
                        className="p-1.5 rounded-xl text-[#69756B] hover:text-emerald-800 hover:bg-emerald-50"
                        title="Resume Goal"
                      >
                        <PlayCircle className="w-4 h-4" />
                      </button>
                    ) : null}

                    {goal.status === "active" && (
                      <button
                        type="button"
                        onClick={() => handleTransition(goal.id, "complete")}
                        className="p-1.5 rounded-xl text-[#69756B] hover:text-emerald-800 hover:bg-emerald-50"
                        title="Mark Goal as Completed"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onAskMentorAboutGoal?.(`How am I progressing towards my goal '${goal.title}'? What should I do next?`)}
                      className="px-2.5 py-1 rounded-xl bg-[#FAFAF2] hover:bg-[#EDF3E8] text-[#17211E] text-[11px] font-medium border border-[#DCE5D5] transition-colors"
                    >
                      Ask ASTRION
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenRoadmap?.(goal.id)}
                      className="px-3 py-1 rounded-xl bg-[#174B39] hover:bg-[#123B2E] text-white text-[11px] font-semibold transition-all inline-flex items-center gap-1 shadow-2xs"
                    >
                      <span>Roadmap</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Create / Edit Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DCE5D5] shadow-xl w-full max-w-lg p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDF3E8]">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#27875E]" />
                <h2 className="font-serif font-bold text-lg text-[#17211E]">
                  {editingGoal ? "Edit Mentorship Goal" : "Define a New Goal"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl text-[#69756B] hover:bg-[#FAFAF2]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-[#17211E] block mb-1">
                  What do you want to achieve? *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Machine Learning Engineer at Google, Master Distributed Systems"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE5D5] text-[#17211E] focus:outline-none focus:ring-1 focus:ring-[#27875E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#17211E] block mb-1">Goal Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE5D5] text-[#17211E] bg-[#FAFAF2] focus:outline-none"
                  >
                    <option value="career">Career Progression</option>
                    <option value="skill">Technical Skill</option>
                    <option value="project">Production Project</option>
                    <option value="academic">Academic / Research</option>
                    <option value="certification">Certification</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#17211E] block mb-1">Priority</label>
                  <select
                    value={importance}
                    onChange={(e) => setImportance(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE5D5] text-[#17211E] bg-[#FAFAF2] focus:outline-none"
                  >
                    <option value="primary">Primary Focus</option>
                    <option value="secondary">Secondary (Parallel)</option>
                    <option value="exploratory">Exploratory</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#17211E] block mb-1">
                  What is your concrete target outcome?
                </label>
                <textarea
                  rows={2}
                  value={targetOutcome}
                  onChange={(e) => setTargetOutcome(e.target.value)}
                  placeholder="e.g. Design and deploy a real-time vector search pipeline with sub-10ms latency."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#DCE5D5] text-[#17211E] focus:outline-none focus:ring-1 focus:ring-[#27875E]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#17211E] block mb-1">Target Timeline / Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#DCE5D5] text-[#17211E] bg-[#FAFAF2] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#EDF3E8] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-[#69756B] hover:bg-[#FAFAF2] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="px-4 py-2 rounded-xl bg-[#174B39] hover:bg-[#123B2E] text-white font-semibold transition-all shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingGoal ? "Update Goal" : "Create Goal & Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
