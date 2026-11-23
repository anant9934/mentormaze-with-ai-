"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Sliders,
  Check,
  X,
  HeartHandshake,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIMentorCheckInModalProps {
  userId?: string;
  isOpen: boolean;
  onClose: () => void;
  activeGoalTitle?: string;
  currentMilestoneTitle?: string;
  onSubmitCheckIn?: (notes: string, availableHours?: number) => Promise<void>;
  onCheckInSubmitted?: () => void;
}

export function AIMentorCheckInModal({
  userId,
  isOpen,
  onClose,
  activeGoalTitle,
  currentMilestoneTitle,
  onSubmitCheckIn,
  onCheckInSubmitted,
}: AIMentorCheckInModalProps) {
  const [progressSummary, setProgressSummary] = useState("");
  const [blockers, setBlockers] = useState("");
  const [adjustedHours, setAdjustedHours] = useState<number | undefined>(undefined);
  const [checkInFrequency, setCheckInFrequency] = useState<"daily" | "weekly" | "paused">("weekly");
  const [preferredHour, setPreferredHour] = useState<number>(10);
  const [timezone, setTimezone] = useState<string>("Asia/Kolkata");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<string>("in_session_active");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing preferences on open
  useEffect(() => {
    if (!isOpen) return;
    setSaveSuccess(false);

    async function loadPreferences() {
      try {
        const studentParam = userId ? `?studentId=${encodeURIComponent(userId)}` : "";
        const res = await fetch(`/api/ai-mentor/checkins${studentParam}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.preferences) {
            setCheckInFrequency(data.preferences.frequency || "weekly");
            setPreferredHour(data.preferences.preferredHour ?? 10);
            setTimezone(data.preferences.timezone || "Asia/Kolkata");
            setDeliveryStatus(data.preferences.scheduledDeliveryStatus || "in_session_active");
          }
        }
      } catch (err) {
        console.warn("Failed to load check-in preferences:", err);
      }
    }

    loadPreferences();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSaveSuccess(false);

    try {
      let combinedNotes = "";
      if (progressSummary.trim()) {
        combinedNotes += `Progress update: ${progressSummary.trim()}`;
      }
      if (blockers.trim()) {
        combinedNotes += ` | Blockers / Questions: ${blockers.trim()}`;
      }
      combinedNotes += ` | Frequency: ${checkInFrequency}`;

      // Persist to check-in API
      const res = await fetch("/api/ai-mentor/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: userId,
          frequency: checkInFrequency,
          preferredHour,
          timezone,
          progressSummary: progressSummary.trim() || undefined,
          blockers: blockers.trim() || undefined,
          adjustedHours,
        }),
      });

      if (onSubmitCheckIn) {
        await onSubmitCheckIn(combinedNotes, adjustedHours);
      }

      onCheckInSubmitted?.();
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error("Failed to submit check-in:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-[#DCE5D5] shadow-xl w-full max-w-lg p-6 space-y-4 animate-in zoom-in-95 duration-200 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EDF3E8]">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-[#27875E]" />
            <h2 className="font-serif font-bold text-lg text-[#17211E]">
              ASTRION Mentorship Check-In
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#69756B] hover:bg-[#FAFAF2]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Honest Delivery Status Banner */}
        <div className="p-3 rounded-2xl bg-[#E7F2DA]/60 border border-[#27875E]/20 text-[#174B39] flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#27875E] shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-snug">
            <p className="font-semibold text-xs">
              Mentorship Session Guidance
            </p>
            <p className="text-[11px] text-[#415349]">
              Check-ins are available during your mentorship sessions. Automatic scheduled reminders are not currently enabled.
            </p>
          </div>
        </div>

        {/* Context notice */}
        <div className="p-3 rounded-2xl bg-[#FAFAF2] border border-[#EDF3E8] text-[#174B39] space-y-0.5">
          <p className="font-semibold text-xs">
            Goal: {activeGoalTitle || "Personal Engineering Mastery"}
          </p>
          {currentMilestoneTitle && (
            <p className="text-[11px] text-[#69756B]">
              Current Milestone: {currentMilestoneTitle}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-semibold text-[#17211E] block mb-1">
              What progress did you make since your last session?
            </label>
            <textarea
              rows={2}
              value={progressSummary}
              onChange={(e) => setProgressSummary(e.target.value)}
              placeholder="e.g. Completed the BFS/DFS graph traversal exercises, built small prototype..."
              className="w-full px-3.5 py-2 rounded-xl border border-[#DCE5D5] text-[#17211E] focus:outline-none focus:ring-1 focus:ring-[#27875E]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#17211E] block mb-1">
              Did anything block your progress or require clarification?
            </label>
            <textarea
              rows={2}
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="e.g. Struggling with memoization vs tabulation trade-offs in knapsack problems..."
              className="w-full px-3.5 py-2 rounded-xl border border-[#DCE5D5] text-[#17211E] focus:outline-none focus:ring-1 focus:ring-[#27875E]"
            />
          </div>

          {/* Frequency & Timezone controls */}
          <div className="space-y-2">
            <label className="font-semibold text-[#17211E] block">
              Check-In Cadence & Quiet Hours
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["weekly", "daily", "paused"] as const).map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setCheckInFrequency(freq)}
                  className={cn(
                    "p-2 rounded-xl border text-center capitalize font-medium transition-all text-xs",
                    checkInFrequency === freq
                      ? "bg-[#E7F2DA] border-[#27875E] text-[#174B39] font-bold"
                      : "bg-[#FAFAF2] border-[#DCE5D5] text-[#69756B] hover:bg-white"
                  )}
                >
                  {freq === "paused" ? "Pause" : `${freq}`}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#69756B] pt-1">
              <span>Timezone: <strong className="text-[#174B39]">{timezone}</strong></span>
              <span>Preferred Hour: <strong className="text-[#174B39]">{preferredHour}:00</strong></span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#EDF3E8] flex items-center justify-between">
            {saveSuccess ? (
              <span className="text-[#27875E] font-semibold text-xs flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Check-in saved!
              </span>
            ) : <span />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-[#69756B] hover:bg-[#FAFAF2] font-medium"
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-[#174B39] hover:bg-[#123B2E] text-white font-semibold transition-all shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Check-In"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
