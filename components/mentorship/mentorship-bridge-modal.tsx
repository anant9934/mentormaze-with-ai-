"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ShieldCheck,
  Check,
  X,
  Clock,
  UserCheck,
  Target,
  AlertCircle,
  HelpCircle,
  Lock,
  ArrowRight,
  Edit2,
  Trash2,
  Share2,
  FileText,
  AlertTriangle,
  Loader2,
  Eye,
} from "lucide-react";
import {
  MentorshipBridgeSummaryData,
  BridgeTimeframe,
  ProvenanceBadge,
} from "@/lib/mentorship/mentorship-bridge-service";

interface MentorshipBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentUserId?: string;
  bookingId?: string;
  mentorProfileId?: string;
  mentorName?: string;
  onShareComplete?: (summary: MentorshipBridgeSummaryData) => void;
}

export function MentorshipBridgeModal({
  isOpen,
  onClose,
  studentUserId = "user-student-1",
  bookingId,
  mentorProfileId,
  mentorName = "Your Mentor",
  onShareComplete,
}: MentorshipBridgeModalProps) {
  const [timeframe, setTimeframe] = useState<BridgeTimeframe>("30_days");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [summary, setSummary] = useState<MentorshipBridgeSummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Editable fields
  const [editableStudentNote, setEditableStudentNote] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState("");

  const handleGenerate = async (selectedTimeframe = timeframe) => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/mentorship-bridge/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentUserId,
          timeframe: selectedTimeframe,
          bookingId,
          mentorProfileId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.summary) {
        setSummary(data.summary);
        setEditableStudentNote(data.summary.studentNote || "");
        setQuestions(data.summary.questionsForMentor || []);
      } else {
        throw new Error(data.error || "Failed to generate summary");
      }
    } catch (err: any) {
      setError(err.message || "Could not generate mentorship summary.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isOpen && !summary) {
      handleGenerate("30_days");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;
    setQuestions([...questions, newQuestion.trim()]);
    setNewQuestion("");
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleAuthorizeAndShare = async () => {
    if (!summary) return;
    setIsSharing(true);
    setError(null);
    try {
      const res = await fetch("/api/mentorship-bridge/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summaryId: summary.id,
          studentUserId,
          mentorProfileId: mentorProfileId || "mentor-1",
          bookingId,
          updates: {
            studentNote: editableStudentNote,
            questionsForMentor: questions,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage("Mentorship summary authorized and shared with your mentor!");
        onShareComplete?.(data.summary);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(data.error || "Failed to share summary");
      }
    } catch (err: any) {
      setError(err.message || "Failed to authorize sharing.");
    } finally {
      setIsSharing(false);
    }
  };

  const renderProvenanceBadge = (badge: ProvenanceBadge) => {
    switch (badge) {
      case "assessment_verified":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Assessment Verified</span>;
      case "mentor_recorded":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-300">Mentor Recorded</span>;
      case "student_reported":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">Student Reported</span>;
      case "ai_inferred":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-300">AI Inferred</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-gray-100 text-gray-800 border border-gray-300">Ecosystem</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-border overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-forest-900 to-[#174B39] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-300">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold">Mentorship Intelligence Bridge</h2>
              <p className="text-xs text-emerald-100">
                Generate, review, and selectively share your continuous mentoring context with {mentorName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Timeframe Selector */}
          <div className="p-4 rounded-2xl bg-cream-50 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-ink-950">
                <Clock className="w-4 h-4 text-forest-800" />
                <span>Select Summary Timeframe</span>
              </div>
              <span className="text-[11px] text-ink-500">Only relevant sessions will be analyzed</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "session", label: "Last Session" },
                { id: "7_days", label: "Past 7 Days" },
                { id: "30_days", label: "Past 30 Days" },
                { id: "custom", label: "All Active Goals" },
              ].map((tf) => (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => {
                    setTimeframe(tf.id as BridgeTimeframe);
                    handleGenerate(tf.id as BridgeTimeframe);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                    timeframe === tf.id
                      ? "bg-forest-900 text-white border-forest-900 shadow-xs"
                      : "bg-white text-ink-700 border-border hover:bg-cream-100"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loading Indicator */}
          {isGenerating && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-forest-800 animate-spin" />
              <p className="text-xs text-ink-600 font-medium">
                Synthesizing student background, conversation history, and verified evidence...
              </p>
            </div>
          )}

          {/* Summary Preview & Editing */}
          {summary && !isGenerating && (
            <div className="space-y-6">
              {/* Privacy Notice Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-forest-900">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">Consent-Governed Sharing Guarantee</span>
                  <p className="text-[11px] text-forest-800 leading-relaxed">
                    Raw AI chat logs are never sent to your human mentor. Only this structured, data-minimized briefing is shared. You can edit any note or question below before granting explicit access.
                  </p>
                </div>
              </div>

              {/* 1. Student Background */}
              <div className="p-4 rounded-2xl bg-white border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-sm font-bold text-ink-950 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-forest-800" />
                    <span>Student Profile & Target</span>
                  </h4>
                  <span className="text-[10px] text-ink-500 font-mono">From AI Tathastu</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-cream-50 p-3 rounded-xl border border-border">
                  <div>
                    <span className="text-[10px] text-ink-500 block">Name</span>
                    <span className="font-semibold text-ink-950">{summary.studentBackground.displayName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-500 block">Education</span>
                    <span className="font-semibold text-ink-950">
                      {summary.studentBackground.degree} ({summary.studentBackground.graduationYear})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-500 block">Target Role</span>
                    <span className="font-semibold text-forest-900">{summary.studentBackground.targetRole}</span>
                  </div>
                </div>
              </div>

              {/* 2. Mentoring History & Decisions */}
              <div className="p-4 rounded-2xl bg-white border border-border space-y-2.5">
                <h4 className="font-serif text-sm font-bold text-ink-950 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-forest-800" />
                  <span>ASTRION Mentoring History & Decisions</span>
                </h4>
                <div className="space-y-2">
                  {summary.mentoringHistory.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-cream-50 border border-border space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-ink-950">{item.topic}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-ink-500 font-mono">{item.date}</span>
                          {renderProvenanceBadge(item.provenance)}
                        </div>
                      </div>
                      <p className="text-ink-600 text-[11px]">{item.summary}</p>
                      {item.decisionsMade && item.decisionsMade.length > 0 && (
                        <div className="mt-1 pt-1 border-t border-border/60">
                          <span className="text-[10px] text-forest-900 font-semibold block">Key Decision:</span>
                          <span className="text-[11px] text-ink-700 italic">"{item.decisionsMade[0]}"</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Current Challenges & Development Areas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-border space-y-2.5">
                  <h4 className="font-serif text-sm font-bold text-ink-950 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span>Current Challenges</span>
                  </h4>
                  <div className="space-y-2">
                    {summary.currentChallenges.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-ink-950">{item.challenge}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-ink-500">{item.evidence}</span>
                          {renderProvenanceBadge(item.provenance)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-border space-y-2.5">
                  <h4 className="font-serif text-sm font-bold text-ink-950 flex items-center gap-2">
                    <Target className="w-4 h-4 text-forest-800" />
                    <span>Development Areas</span>
                  </h4>
                  <div className="space-y-2">
                    {summary.developmentAreas.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-cream-50 border border-border text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-ink-950">{item.area}</span>
                          <span className="text-[10px] font-mono text-forest-900 capitalize px-1.5 py-0.5 rounded bg-forest-50 border border-forest-200">
                            {item.type.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-[10px] text-ink-500">{item.details}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Progress and Milestone Evidence */}
              <div className="p-4 rounded-2xl bg-white border border-border space-y-2.5">
                <h4 className="font-serif text-sm font-bold text-ink-950 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>Progress & Completed Evidence</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {summary.progressAndEvidence.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-ink-950">{item.milestoneTitle}</span>
                        {renderProvenanceBadge(item.provenance)}
                      </div>
                      <p className="text-[11px] text-ink-600">{item.completionEvidence}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Questions for Human Mentor (Editable) */}
              <div className="p-4 rounded-2xl bg-white border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-sm font-bold text-ink-950 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-forest-800" />
                    <span>Questions for {mentorName}</span>
                  </h4>
                  <span className="text-[11px] text-ink-500">Edit or add questions you want answered</span>
                </div>

                <div className="space-y-2">
                  {questions.map((q, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-cream-50 border border-border text-xs">
                      <span className="text-ink-950">{q}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="text-ink-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Add a specific question for your session..."
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddQuestion())}
                      className="flex-1 p-2 rounded-xl border border-border text-xs text-ink-950 focus:outline-none focus:ring-2 focus:ring-forest-800"
                    />
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="btn-secondary text-xs px-3 py-2 font-semibold"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* 6. Student's Own Note to Mentor (Editable) */}
              <div className="p-4 rounded-2xl bg-white border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-sm font-bold text-ink-950 flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-forest-800" />
                    <span>Your Note to {mentorName}</span>
                  </h4>
                  <span className="text-[11px] text-ink-500">Personal message to provide session context</span>
                </div>
                <textarea
                  rows={3}
                  value={editableStudentNote}
                  onChange={(e) => setEditableStudentNote(e.target.value)}
                  placeholder="Tell your mentor about your current focus or what you'd like to achieve in this session..."
                  className="w-full p-3 rounded-xl border border-border text-xs text-ink-950 focus:outline-none focus:ring-2 focus:ring-forest-800"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-cream-50 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-ink-600">
            <Lock className="w-4 h-4 text-forest-800" />
            <span>Access expires in 14 days and can be revoked at any time.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs py-2.5 px-4 w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!summary || isGenerating || isSharing}
              onClick={handleAuthorizeAndShare}
              className="btn-primary text-xs py-2.5 px-5 w-full sm:w-auto flex items-center justify-center gap-2 font-bold shadow-sm"
            >
              {isSharing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authorizing...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Authorize & Share Summary</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
