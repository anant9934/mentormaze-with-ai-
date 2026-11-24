"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  FileText,
  Languages,
  CheckSquare,
  ListOrdered,
  Play,
  Pause,
  RefreshCw,
  Eye,
  Shield,
  Trash2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Download,
  AlertCircle,
  HelpCircle,
  Radio,
} from "lucide-react";
import { TranscriptSegment, MeetingNotes, NoteTopic, NoteItem } from "@/lib/meeting-intelligence/types";

interface MeetingIntelligencePanelProps {
  bookingId: string;
  studentUserId: string;
  studentName: string;
  mentorUserId: string;
  mentorName: string;
  userRole: "student" | "mentor" | "admin";
  onOpenReportModal?: () => void;
}

export function MeetingIntelligencePanel({
  bookingId,
  studentUserId,
  studentName,
  mentorUserId,
  mentorName,
  userRole,
  onOpenReportModal,
}: MeetingIntelligencePanelProps) {
  const [activeTab, setActiveTab] = useState<"transcript" | "translation" | "notes" | "todos">("notes");
  const [sessionStatus, setSessionStatus] = useState<"idle" | "capturing" | "paused" | "completed">("capturing");
  const [targetLanguage, setTargetLanguage] = useState<string>("hi");
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [notes, setNotes] = useState<MeetingNotes | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isFeatureDisabled, setIsFeatureDisabled] = useState<boolean>(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [selectedLinesForRedaction, setSelectedLinesForRedaction] = useState<number[]>([]);
  const transcriptBottomRef = useRef<HTMLDivElement>(null);

  // Poll for live transcript and notes updates
  useEffect(() => {
    let isMounted = true;

    async function fetchLiveIntelligence() {
      try {
        const [transRes, notesRes, sessRes] = await Promise.all([
          fetch(`/api/meeting-intelligence/transcript?bookingId=${bookingId}`),
          fetch(`/api/meeting-intelligence/notes?bookingId=${bookingId}`),
          fetch(`/api/meeting-intelligence/session?bookingId=${bookingId}`),
        ]);

        if (transRes.status === 503 || sessRes.status === 503) {
          if (isMounted) {
            setIsFeatureDisabled(true);
          }
          return;
        }

        if ((transRes.ok || sessRes.ok) && isMounted) {
          setIsFeatureDisabled(false);
        }

        if (transRes.ok && isMounted) {
          const tData = await transRes.json();
          if (tData.segments) {
            setTranscript(tData.segments);
          }
        }

        if (notesRes.ok && isMounted) {
          const nData = await notesRes.json();
          if (nData.notes) {
            setNotes(nData.notes);
          }
        }

        if (sessRes.ok && isMounted) {
          const sData = await sessRes.json();
          if (sData.session?.status) {
            setSessionStatus(sData.session.status);
          }
        }
      } catch (err) {
        // Silently handle polling glitch
      }
    }

    fetchLiveIntelligence();
    const interval = setInterval(fetchLiveIntelligence, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [bookingId]);

  // Scroll to bottom on transcript tab
  useEffect(() => {
    if (activeTab === "transcript" || activeTab === "translation") {
      transcriptBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript.length, activeTab]);

  const handleToggleCapture = async () => {
    if (isFeatureDisabled) return;
    setConsentError(null);
    const nextAction = sessionStatus === "capturing" ? "pause" : sessionStatus === "paused" ? "resume" : "start";
    setIsUpdating(true);
    try {
      const res = await fetch("/api/meeting-intelligence/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          action: nextAction,
          targetLanguage,
        }),
      });
      if (res.status === 503) {
        setIsFeatureDisabled(true);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "CONSENT_REQUIRED") {
          setConsentError("Student consent is required before starting audio capture. Please enable student memory consent in your privacy settings.");
        }
        return;
      }
      if (data.status) {
        setSessionStatus(data.status);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTriggerManualNotes = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch("/api/meeting-intelligence/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, isFinalPass: false }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.notes) setNotes(data.notes);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRedactLines = async () => {
    if (selectedLinesForRedaction.length === 0) return;
    try {
      const res = await fetch("/api/meeting-intelligence/transcript", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          lineIndices: selectedLinesForRedaction,
          reason: "student_requested_redaction",
        }),
      });
      if (res.ok) {
        setSelectedLinesForRedaction([]);
        const updated = await fetch(`/api/meeting-intelligence/transcript?bookingId=${bookingId}`);
        const data = await updated.json();
        if (data.segments) setTranscript(data.segments);
      }
    } catch {
      // Handle error
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e232a] text-stone-200 border-l border-stone-800 select-none">
      {/* Intelligence Header */}
      <div className="px-4 py-3 bg-[#181c22] border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-100 tracking-wide">MEETING INTELLIGENCE</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                AI COPILOT
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div
                className={`w-2 h-2 rounded-full ${
                  sessionStatus === "capturing"
                    ? "bg-emerald-400 animate-pulse"
                    : sessionStatus === "paused"
                    ? "bg-amber-400"
                    : "bg-stone-500"
                }`}
              />
              <span className="text-[11px] text-stone-400 font-medium capitalize">
                {sessionStatus === "capturing" ? "Listening & Summarizing" : sessionStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleCapture}
            disabled={isUpdating || isFeatureDisabled}
            className={`p-1.5 rounded-md transition-colors border ${
              isFeatureDisabled
                ? "bg-stone-900 text-stone-600 border-stone-800 cursor-not-allowed"
                : "bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700"
            }`}
            title={sessionStatus === "capturing" ? "Pause Capture" : "Resume Capture"}
          >
            {sessionStatus === "capturing" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleTriggerManualNotes}
            disabled={isUpdating || isFeatureDisabled}
            className={`p-1.5 rounded-md transition-colors border ${
              isFeatureDisabled
                ? "bg-stone-900 text-stone-600 border-stone-800 cursor-not-allowed"
                : "bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700"
            }`}
            title="Refresh Notes"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? "animate-spin" : ""}`} />
          </button>
          {onOpenReportModal && (
            <button
              onClick={onOpenReportModal}
              disabled={isFeatureDisabled}
              className={`px-2 py-1 text-xs rounded font-medium flex items-center gap-1 transition-colors ${
                isFeatureDisabled
                  ? "bg-stone-800 text-stone-500 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Feature Gate Disabled Notice */}
      {isFeatureDisabled && (
        <div className="m-3 p-3 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-300">Meeting Intelligence Temporarily Unavailable</div>
            <div className="text-amber-200/80 text-[11px] mt-0.5">
              Live transcription, translation, and automated notes are temporarily paused while security and runtime updates are being completed.
            </div>
          </div>
        </div>
      )}

      {/* Consent Required Notice */}
      {consentError && (
        <div className="m-3 p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs">{consentError}</div>
        </div>
      )}

      {/* Subsystem Navigation Tabs */}
      <div className="grid grid-cols-4 bg-[#14171c] border-b border-stone-800 text-xs font-medium">
        <button
          onClick={() => setActiveTab("notes")}
          className={`py-2 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === "notes"
              ? "border-emerald-500 text-emerald-400 bg-stone-800/40"
              : "border-transparent text-stone-400 hover:text-stone-200"
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>Notes</span>
        </button>
        <button
          onClick={() => setActiveTab("todos")}
          className={`py-2 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === "todos"
              ? "border-emerald-500 text-emerald-400 bg-stone-800/40"
              : "border-transparent text-stone-400 hover:text-stone-200"
          }`}
        >
          <CheckSquare className="w-3 h-3" />
          <span>Actions ({notes?.todos.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveTab("transcript")}
          className={`py-2 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === "transcript"
              ? "border-emerald-500 text-emerald-400 bg-stone-800/40"
              : "border-transparent text-stone-400 hover:text-stone-200"
          }`}
        >
          <ListOrdered className="w-3 h-3" />
          <span>Transcript</span>
        </button>
        <button
          onClick={() => setActiveTab("translation")}
          className={`py-2 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === "translation"
              ? "border-emerald-500 text-emerald-400 bg-stone-800/40"
              : "border-transparent text-stone-400 hover:text-stone-200"
          }`}
        >
          <Languages className="w-3 h-3" />
          <span>Translate</span>
        </button>
      </div>

      {/* Tab 1: AI Structured Notes */}
      {activeTab === "notes" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {notes && notes.summary ? (
            <>
              {/* Executive Summary Card */}
              <div className="p-3 rounded-lg bg-stone-800/60 border border-stone-700/60 text-xs">
                <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Executive Summary</span>
                  <span className="text-stone-400 text-[10px] font-normal">{notes.coveredLineCount} lines synthesized</span>
                </div>
                <p className="text-stone-300 leading-relaxed">{notes.summary}</p>
              </div>

              {/* Topics Breakdown */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Topics Discussed ({notes.topics.length})
                </span>

                {notes.topics.map((topic, idx) => (
                  <div
                    key={topic.id || idx}
                    className="p-3 rounded-lg bg-[#252a33] border border-stone-700/60 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-100">{topic.title}</span>
                        <div className="flex gap-1">
                          {topic.evidenceLines.map((line) => (
                            <span
                              key={line}
                              className="px-1 py-0.2 rounded bg-stone-700 text-stone-300 text-[9px] font-mono"
                            >
                              {line}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {Math.floor(topic.startSeconds / 60)}:
                        {String(Math.floor(topic.startSeconds % 60)).padStart(2, "0")}
                      </span>
                    </div>

                    <p className="text-stone-300 text-[11px]">{topic.summary}</p>

                    {/* Key points takeaways */}
                    <ul className="space-y-1 pl-3 border-l-2 border-emerald-500/40">
                      {topic.points.map((pt, pIdx) => (
                        <li key={pIdx} className="text-stone-300 text-[11px] leading-snug">
                          {pt}
                        </li>
                      ))}
                    </ul>

                    {/* Fishbone Diagram (Root-Cause Analysis) */}
                    {topic.fishbone && (
                      <div className="mt-2 p-2 rounded bg-[#1c2027] border border-stone-700/50">
                        <div className="text-[10px] font-semibold text-amber-400 flex items-center gap-1 mb-1.5">
                          <AlertCircle className="w-3 h-3" />
                          <span>Pedagogical Root Cause Analysis (Fishbone)</span>
                        </div>
                        <p className="text-[10px] text-stone-300 italic mb-2">&ldquo;{topic.fishbone.question}&rdquo;</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {topic.fishbone.branches.map((b, bIdx) => (
                            <div key={bIdx} className="p-1.5 rounded bg-stone-800/80 border border-stone-700/40">
                              <span className="text-[9px] font-semibold text-emerald-300 block">{b.label}</span>
                              <span className="text-[9px] text-stone-400 leading-tight block">{b.detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Conclusions & Outcomes */}
              {notes.conclusions.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Agreed Conclusions</span>
                  <div className="space-y-1.5">
                    {notes.conclusions.map((c, idx) => (
                      <div
                        key={c.id || idx}
                        className="p-2 rounded bg-stone-800/50 border border-stone-700/40 text-xs flex items-start gap-2"
                      >
                        <span className="text-emerald-400 font-bold">•</span>
                        <div className="flex-1">
                          <span className="text-stone-200">{c.text}</span>
                          <div className="flex gap-1 mt-1">
                            {c.evidenceLines.map((line) => (
                              <span key={line} className="px-1 py-0.2 rounded bg-stone-700 text-stone-300 text-[9px] font-mono">
                                {line}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-2">
              <Sparkles className="w-8 h-8 text-emerald-500/40 animate-pulse" />
              <p className="text-xs">Meeting Intelligence is listening...</p>
              <p className="text-[11px] text-stone-500">
                Spoken dialogue will be incrementally structured into topics, fishbone root-cause diagrams, and action items.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Action Items */}
      {activeTab === "todos" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Assigned Commitments</span>
            <span className="text-[10px] text-stone-500 font-mono">Action Items</span>
          </div>

          {notes && notes.todos.length > 0 ? (
            notes.todos.map((todo, idx) => (
              <div
                key={todo.id || idx}
                className="p-3 rounded-lg bg-[#252a33] border border-stone-700/60 text-xs space-y-2"
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={Boolean(todo.isCompleted)}
                    readOnly
                    className="mt-0.5 rounded border-stone-600 bg-stone-700 text-emerald-500 focus:ring-0"
                  />
                  <div className="flex-1">
                    <p className="text-stone-200 font-medium leading-snug">{todo.text}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Owner: {todo.owner === "mentor" ? mentorName : studentName}
                      </span>
                      {todo.deadline && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                          Due: {todo.deadline}
                        </span>
                      )}
                      <div className="flex gap-1 ml-auto">
                        {todo.evidenceLines.map((line) => (
                          <span key={line} className="px-1 py-0.2 rounded bg-stone-700 text-stone-300 text-[9px] font-mono">
                            {line}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-2">
              <CheckSquare className="w-8 h-8 text-stone-600" />
              <p className="text-xs">No action items declared yet.</p>
              <p className="text-[11px] text-stone-500">
                Action items assigned verbally during the conversation will automatically appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Live Transcript */}
      {activeTab === "transcript" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {selectedLinesForRedaction.length > 0 && (
            <div className="p-2 rounded bg-red-950/70 border border-red-800 flex items-center justify-between text-xs mb-2">
              <span className="text-red-300">
                {selectedLinesForRedaction.length} line(s) selected for student redaction
              </span>
              <button
                onClick={handleRedactLines}
                className="px-2 py-0.5 rounded bg-red-700 hover:bg-red-600 text-white font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Confirm Redaction</span>
              </button>
            </div>
          )}

          {transcript.length > 0 ? (
            transcript.map((seg) => (
              <div
                key={seg.id || seg.lineIndex}
                className={`p-2.5 rounded-lg border text-xs space-y-1 transition-colors ${
                  seg.speakerRole === "student"
                    ? "bg-[#252c38] border-blue-900/40"
                    : "bg-[#242e2b] border-emerald-900/40"
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1 py-0.2 rounded bg-stone-800 text-stone-400 font-mono">
                      L{seg.lineIndex}
                    </span>
                    <span
                      className={`font-semibold ${
                        seg.speakerRole === "student" ? "text-blue-300" : "text-emerald-300"
                      }`}
                    >
                      {seg.speakerName} ({seg.speakerRole})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 font-mono">
                      {Math.floor(seg.startTimeSeconds / 60)}:
                      {String(Math.floor(seg.startTimeSeconds % 60)).padStart(2, "0")}
                    </span>
                    {userRole === "student" && (
                      <button
                        onClick={() => {
                          if (selectedLinesForRedaction.includes(seg.lineIndex)) {
                            setSelectedLinesForRedaction(selectedLinesForRedaction.filter((l) => l !== seg.lineIndex));
                          } else {
                            setSelectedLinesForRedaction([...selectedLinesForRedaction, seg.lineIndex]);
                          }
                        }}
                        className="text-stone-500 hover:text-red-400"
                        title="Redact this line"
                      >
                        <Shield className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-stone-200 leading-relaxed">{seg.src}</p>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-2">
              <Radio className="w-8 h-8 text-stone-600 animate-pulse" />
              <p className="text-xs">Waiting for speech...</p>
              <p className="text-[11px] text-stone-500">
                LiveKit WebRTC audio tracks are automatically segmented by RMS VAD and transcribed via cloud STT.
              </p>
            </div>
          )}
          <div ref={transcriptBottomRef} />
        </div>
      )}

      {/* Tab 4: Live Translation */}
      {activeTab === "translation" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <span className="text-xs text-stone-400 font-medium">Target Language</span>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="bg-stone-800 border border-stone-700 text-stone-200 text-xs rounded px-2 py-1 focus:ring-0"
            >
              <option value="hi">Hindi (हिंदी)</option>
              <option value="hi-Latn">Hinglish</option>
              <option value="en">English</option>
              <option value="es">Spanish (Español)</option>
            </select>
          </div>

          {transcript.length > 0 ? (
            transcript.map((seg) => (
              <div
                key={seg.id || seg.lineIndex}
                className="p-2.5 rounded-lg bg-[#222730] border border-stone-700/60 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-stone-300">
                    {seg.speakerName} (L{seg.lineIndex})
                  </span>
                  <span className="text-[9px] px-1 rounded bg-stone-800 text-stone-400 font-mono">
                    {seg.srcLang} → {seg.dstLang || targetLanguage}
                  </span>
                </div>
                <p className="text-stone-400 text-[11px] italic">&ldquo;{seg.src}&rdquo;</p>
                <p className="text-emerald-300 font-medium leading-relaxed">
                  {seg.dst || "[Translating...]"}
                </p>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-2">
              <Languages className="w-8 h-8 text-stone-600" />
              <p className="text-xs">No translation stream active yet.</p>
            </div>
          )}
          <div ref={transcriptBottomRef} />
        </div>
      )}
    </div>
  );
}
