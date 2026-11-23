"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  Download,
  CheckCircle,
  AlertTriangle,
  Send,
  Eye,
  Shield,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { MentorshipIntelligenceReport } from "@/lib/meeting-intelligence/types";

interface PostSessionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  studentUserId: string;
  studentName: string;
  mentorUserId: string;
  mentorName: string;
  userRole: "student" | "mentor" | "admin";
}

export function PostSessionReportModal({
  isOpen,
  onClose,
  bookingId,
  studentUserId,
  studentName,
  mentorUserId,
  mentorName,
  userRole,
}: PostSessionReportModalProps) {
  const [report, setReport] = useState<MentorshipIntelligenceReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [corrections, setCorrections] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function loadReport() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/meeting-intelligence/report?bookingId=${bookingId}&role=${userRole}`);
        if (res.ok) {
          const data = await res.json();
          setReport(data.report);
        } else {
          // If no report yet, generate one
          const genRes = await fetch("/api/meeting-intelligence/report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookingId,
              action: "generate",
              studentUserId,
              studentName,
              mentorUserId,
              mentorName,
            }),
          });
          if (genRes.ok) {
            const genData = await genRes.json();
            setReport(genData.report);
          }
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadReport();
  }, [isOpen, bookingId, userRole, studentUserId, studentName, mentorUserId, mentorName]);

  if (!isOpen) return null;

  const handleApproveReport = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/meeting-intelligence/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          action: "approve",
          corrections: corrections.trim() || undefined,
        }),
      });
      if (res.ok) {
        setSuccessMessage("Report approved! Successfully updated ASTRION context & AI Tathastu outbox.");
        if (report) {
          setReport({
            ...report,
            reviewStatus: "approved",
            injectedIntoAstrion: true,
            syncedToTathastu: true,
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadMarkdown = async () => {
    window.open(`/api/meeting-intelligence/report?bookingId=${bookingId}&role=${userRole}&format=markdown`, "_blank");
  };

  const handleDownloadJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mentormaze-report-${bookingId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1b1f26] border border-stone-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-stone-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-[#15181e]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-stone-100">
                  {report?.sessionTitle || "Mentorship Intelligence Report"}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                  {report?.reviewStatus?.toUpperCase() || "PENDING"}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Student: {studentName} • Mentor: {mentorName} • 14-Section Pedagogical Summary
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadMarkdown}
              className="px-2.5 py-1.5 rounded-md bg-stone-800 hover:bg-stone-700 text-xs text-stone-300 flex items-center gap-1.5 border border-stone-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Markdown</span>
            </button>
            <button
              onClick={handleDownloadJson}
              className="px-2.5 py-1.5 rounded-md bg-stone-800 hover:bg-stone-700 text-xs text-stone-300 flex items-center gap-1.5 border border-stone-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-md text-stone-400 hover:text-stone-100 hover:bg-stone-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
              <Sparkles className="w-10 h-10 text-emerald-400 animate-pulse" />
              <p className="text-stone-300 font-medium">Synthesizing Pedagogical Report...</p>
              <p className="text-xs text-stone-500">
                Evaluating transcript line citations, fishbone diagrams, and action items via cloud LLM.
              </p>
            </div>
          ) : report ? (
            <>
              {/* Executive Summary */}
              <div className="p-4 rounded-lg bg-[#222731] border border-stone-700/70">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                  1. Executive Summary
                </h4>
                <p className="text-stone-300 leading-relaxed text-xs">{report.executiveSummary}</p>
              </div>

              {/* Student Reported Challenges */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  2. Student Reported Challenges ({report.studentReportedChallenges.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {report.studentReportedChallenges.map((c, i) => (
                    <div key={i} className="p-3 rounded-lg bg-[#222731] border border-stone-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-stone-200">{c.challenge}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 font-mono">
                          {c.provenance}
                        </span>
                      </div>
                      <p className="text-stone-400 text-[11px]">{c.evidence}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Items */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  3. Action Items & Commitments ({report.actionItems.length})
                </h4>
                <div className="border border-stone-800 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#15181e] text-stone-400 border-b border-stone-800">
                      <tr>
                        <th className="p-2.5">Task</th>
                        <th className="p-2.5">Owner</th>
                        <th className="p-2.5">Deadline</th>
                        <th className="p-2.5">Ref</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/60 bg-[#222731]">
                      {report.actionItems.map((a, i) => (
                        <tr key={i}>
                          <td className="p-2.5 font-medium text-stone-200">{a.task}</td>
                          <td className="p-2.5 text-stone-300">
                            {a.owner} ({a.ownerRole})
                          </td>
                          <td className="p-2.5 text-stone-400">{a.deadline || "Next session"}</td>
                          <td className="p-2.5 text-[10px] font-mono text-emerald-400">
                            {a.evidenceLines.join(", ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Decisions & Milestones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">4. Decisions Made</h4>
                  <div className="space-y-1.5">
                    {report.decisionsMade.map((d, i) => (
                      <div key={i} className="p-2.5 rounded bg-[#222731] border border-stone-800 text-xs">
                        <p className="text-stone-200 font-medium">{d.decision}</p>
                        <span className="text-[10px] text-stone-400 mt-1 block">Agreed by: {d.agreedBy}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">5. Agreed Milestones</h4>
                  <div className="space-y-1.5">
                    {report.agreedMilestones.map((m, i) => (
                      <div key={i} className="p-2.5 rounded bg-[#222731] border border-stone-800 text-xs">
                        <p className="text-stone-200 font-medium">{m.milestone}</p>
                        <span className="text-[10px] text-emerald-400 mt-1 block">Target: {m.targetDate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mentor Private Notes (Mentor/Admin Only) */}
              {userRole !== "student" && report.mentorPrivateFeedback && (
                <div className="p-4 rounded-lg bg-amber-950/30 border border-amber-900/60 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Mentor Private Notes (Confidential to Mentor & Admin)</span>
                  </div>
                  <p className="text-stone-300 italic">{report.mentorPrivateFeedback}</p>
                </div>
              )}

              {/* Student Corrections & Feedback Area */}
              <div className="p-4 rounded-lg bg-[#181c23] border border-stone-800 space-y-3">
                <h4 className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
                  Review, Corrections & Approval
                </h4>
                <textarea
                  value={corrections}
                  onChange={(e) => setCorrections(e.target.value)}
                  placeholder="Optional: Enter any factual clarifications, omissions, or notes to update..."
                  rows={2}
                  className="w-full bg-[#12151b] border border-stone-700 rounded-lg p-2.5 text-xs text-stone-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />

                {successMessage && (
                  <div className="p-2.5 rounded bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-stone-400 text-center py-10">Unable to load report.</p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-stone-800 bg-[#15181e] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                report?.syncedToTathastu ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            <span>
              {report?.syncedToTathastu
                ? "Synchronized with AI Tathastu & ASTRION"
                : "Awaiting participant sign-off"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium"
            >
              Close
            </button>
            <button
              onClick={handleApproveReport}
              disabled={isSubmitting || report?.reviewStatus === "approved"}
              className="px-4 py-2 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{report?.reviewStatus === "approved" ? "Approved" : "Approve & Synchronize"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
