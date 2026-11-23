"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  UserCheck,
  ShieldCheck,
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  X,
  Loader2,
  Save,
  MessageSquare,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  MentorshipBridgeSummaryData,
  ProvenanceBadge,
} from "@/lib/mentorship/mentorship-bridge-service";

interface MentorIntakeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: string;
  summaryId?: string;
  mentorUserId?: string;
  studentName?: string;
}

export function MentorIntakeDrawer({
  isOpen,
  onClose,
  bookingId,
  summaryId,
  mentorUserId,
  studentName = "Student",
}: MentorIntakeDrawerProps) {
  const [briefing, setBriefing] = useState<MentorshipBridgeSummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Post-session feedback form state
  const [activeTab, setActiveTab] = useState<"briefing" | "feedback">("briefing");
  const [sessionSummary, setSessionSummary] = useState("");
  const [observedStrengths, setObservedStrengths] = useState<string[]>([]);
  const [newStrength, setNewStrength] = useState("");
  const [developmentGaps, setDevelopmentGaps] = useState<string[]>([]);
  const [newGap, setNewGap] = useState("");
  const [recommendedActions, setRecommendedActions] = useState<string[]>([]);
  const [newAction, setNewAction] = useState("");
  const [followUpDate, setFollowUpDate] = useState("2026-12-05");
  const [nextSessionFocus, setNextSessionFocus] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadBriefing() {
      if (!isOpen) return;
      setLoading(true);
      setError(null);
      try {
        const query = bookingId
          ? `?bookingId=${encodeURIComponent(bookingId)}`
          : `?summaryId=${encodeURIComponent(summaryId || "")}`;
        const mentorParam = mentorUserId ? `&mentorUserId=${encodeURIComponent(mentorUserId)}` : "";
        const res = await fetch(`/api/mentorship-bridge/mentor${query}${mentorParam}`);
        const data = await res.json();
        if (res.ok && data.success && data.briefing) {
          setBriefing(data.briefing);
        } else {
          throw new Error(data.error || "No shared student briefing available.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load student briefing.");
      } finally {
        setLoading(false);
      }
    }
    loadBriefing();
  }, [isOpen, bookingId, summaryId, mentorUserId]);

  if (!isOpen) return null;

  const handleAddStrength = () => {
    if (!newStrength.trim()) return;
    setObservedStrengths([...observedStrengths, newStrength.trim()]);
    setNewStrength("");
  };

  const handleAddGap = () => {
    if (!newGap.trim()) return;
    setDevelopmentGaps([...developmentGaps, newGap.trim()]);
    setNewGap("");
  };

  const handleAddAction = () => {
    if (!newAction.trim()) return;
    setRecommendedActions([...recommendedActions, newAction.trim()]);
    setNewAction("");
  };

  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) {
      alert("Booking ID required to record post-session feedback.");
      return;
    }
    setSavingFeedback(true);
    setFeedbackSuccess(null);
    try {
      const res = await fetch("/api/mentorship-bridge/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          mentorUserId,
          sessionSummary: sessionSummary || "Completed 1:1 mentorship consultation.",
          observedStrengths,
          developmentGaps,
          recommendedActions,
          agreedMilestones: recommendedActions,
          followUpDate,
          nextSessionFocus,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackSuccess("Mentorship feedback saved and returned to ASTRION intelligence.");
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(data.error || "Failed to save feedback");
      }
    } catch (err: any) {
      alert("Error saving feedback: " + err.message);
    } finally {
      setSavingFeedback(false);
    }
  };

  const renderProvenanceBadge = (badge: ProvenanceBadge) => {
    switch (badge) {
      case "assessment_verified":
        return <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800">Assessment Verified</span>;
      case "mentor_recorded":
        return <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-blue-100 text-blue-800">Mentor Recorded</span>;
      case "student_reported":
        return <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-amber-100 text-amber-800">Student Reported</span>;
      case "ai_inferred":
        return <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-purple-100 text-purple-800">AI Inferred</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-gray-100 text-gray-800">Ecosystem</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-ink-950/50 backdrop-blur-xs">
      <div className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col border-l border-border animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-forest-900 to-[#174B39] text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300">
                Mentorship Intelligence Bridge
              </span>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-800 text-emerald-200 text-[9px] font-bold">
                Student Authorized
              </span>
            </div>
            <h2 className="font-serif text-lg font-bold">Student Briefing: {studentName}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-border bg-cream-50 px-4 text-xs">
          <button
            onClick={() => setActiveTab("briefing")}
            className={`py-3 px-4 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "briefing"
                ? "border-forest-900 text-forest-900 bg-white font-bold"
                : "border-transparent text-ink-600 hover:text-ink-950"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Pre-Session Briefing</span>
          </button>
          <button
            onClick={() => setActiveTab("feedback")}
            className={`py-3 px-4 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "feedback"
                ? "border-forest-900 text-forest-900 bg-white font-bold"
                : "border-transparent text-ink-600 hover:text-ink-950"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Post-Session Notes</span>
          </button>
        </div>

        {/* Body Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {error && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {feedbackSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{feedbackSuccess}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 text-forest-800 animate-spin" />
              <span className="text-ink-500">Loading student briefing...</span>
            </div>
          ) : activeTab === "briefing" && briefing ? (
            <div className="space-y-4">
              {/* Student Note */}
              {briefing.studentNote && (
                <div className="p-3.5 rounded-2xl bg-[#FAFAF2] border border-[#DCE5D5] space-y-1">
                  <span className="font-bold text-forest-900 block text-[11px] uppercase tracking-wider">
                    Student's Personal Note:
                  </span>
                  <p className="text-ink-800 italic">"{briefing.studentNote}"</p>
                </div>
              )}

              {/* Student Target & Background */}
              <div className="p-3.5 rounded-2xl bg-cream-50 border border-border space-y-2">
                <span className="font-bold text-ink-950 block">Target & Background</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-ink-500 block">Target Role</span>
                    <span className="font-semibold text-forest-900">{briefing.studentBackground.targetRole}</span>
                  </div>
                  <div>
                    <span className="text-ink-500 block">Education</span>
                    <span className="font-semibold text-ink-900">
                      {briefing.studentBackground.degree} ({briefing.studentBackground.graduationYear})
                    </span>
                  </div>
                </div>
              </div>

              {/* Questions for You */}
              {briefing.questionsForMentor && briefing.questionsForMentor.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-white border border-border space-y-2">
                  <span className="font-bold text-ink-950 block flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-forest-800" />
                    <span>Specific Questions Student Wants Addressed</span>
                  </span>
                  <ul className="space-y-1.5 pl-2">
                    {briefing.questionsForMentor.map((q, idx) => (
                      <li key={idx} className="p-2 rounded-xl bg-cream-50 border border-border text-[11px] text-ink-900 font-medium">
                        • {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI Mentoring History Highlights */}
              <div className="p-3.5 rounded-2xl bg-white border border-border space-y-2">
                <span className="font-bold text-ink-950 block flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#27875E]" />
                  <span>ASTRION Mentoring Summary ({briefing.timeframe.replace("_", " ")})</span>
                </span>
                <div className="space-y-2">
                  {briefing.mentoringHistory.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-cream-50 border border-border text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-ink-950">{item.topic}</span>
                        {renderProvenanceBadge(item.provenance)}
                      </div>
                      <p className="text-ink-600">{item.summary}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Progress & Evidence */}
              <div className="p-3.5 rounded-2xl bg-white border border-border space-y-2">
                <span className="font-bold text-ink-950 block">Verified Progress & Completed Deliverables</span>
                <div className="space-y-1.5">
                  {briefing.progressAndEvidence.map((prog, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-200 text-[11px] flex items-center justify-between">
                      <span className="font-semibold text-emerald-950">{prog.milestoneTitle}</span>
                      {renderProvenanceBadge(prog.provenance)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === "feedback" ? (
            /* Post-Session Feedback Form */
            <form onSubmit={handleSaveFeedback} className="space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-ink-950 block">Session Summary</label>
                <textarea
                  rows={3}
                  value={sessionSummary}
                  onChange={(e) => setSessionSummary(e.target.value)}
                  placeholder="Summarize main points discussed during this session..."
                  className="w-full p-2.5 rounded-xl border border-border text-xs text-ink-950"
                  required
                />
              </div>

              {/* Observed Strengths */}
              <div className="space-y-1.5">
                <label className="font-bold text-ink-950 block">Observed Strengths</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStrength}
                    onChange={(e) => setNewStrength(e.target.value)}
                    placeholder="e.g. Clean algorithmic breakdown"
                    className="flex-1 p-2 rounded-xl border border-border text-xs"
                  />
                  <button type="button" onClick={handleAddStrength} className="btn-secondary text-xs px-3 py-1.5">
                    Add
                  </button>
                </div>
                <div className="flex gap-1.5 flex-wrap pt-1">
                  {observedStrengths.map((str, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px]">
                      ✓ {str}
                    </span>
                  ))}
                </div>
              </div>

              {/* Development Gaps */}
              <div className="space-y-1.5">
                <label className="font-bold text-ink-950 block">Development Gaps</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGap}
                    onChange={(e) => setNewGap(e.target.value)}
                    placeholder="e.g. Edge case handling under concurrency"
                    className="flex-1 p-2 rounded-xl border border-border text-xs"
                  />
                  <button type="button" onClick={handleAddGap} className="btn-secondary text-xs px-3 py-1.5">
                    Add
                  </button>
                </div>
                <div className="flex gap-1.5 flex-wrap pt-1">
                  {developmentGaps.map((gap, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px]">
                      ! {gap}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommended Actions */}
              <div className="space-y-1.5">
                <label className="font-bold text-ink-950 block">Agreed Next Milestones / Action Items</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value)}
                    placeholder="e.g. Complete 2 transaction lock implementations"
                    className="flex-1 p-2 rounded-xl border border-border text-xs"
                  />
                  <button type="button" onClick={handleAddAction} className="btn-secondary text-xs px-3 py-1.5">
                    Add
                  </button>
                </div>
                <div className="flex gap-1.5 flex-wrap pt-1">
                  {recommendedActions.map((act, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[10px]">
                      → {act}
                    </span>
                  ))}
                </div>
              </div>

              {/* Follow-up Date & Next Focus */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-ink-700">Recommended Follow-up</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-border text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-ink-700">Next Session Focus</label>
                  <input
                    type="text"
                    value={nextSessionFocus}
                    onChange={(e) => setNextSessionFocus(e.target.value)}
                    placeholder="e.g. Architecture review"
                    className="w-full p-2 rounded-xl border border-border text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end">
                <button
                  type="submit"
                  disabled={savingFeedback}
                  className="btn-primary text-xs py-2.5 px-5 flex items-center gap-2 font-bold shadow-sm"
                >
                  {savingFeedback ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save & Return to ASTRION</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="py-8 text-center text-ink-500">
              No active briefing found for this session.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
