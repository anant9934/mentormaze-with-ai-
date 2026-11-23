"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Info,
  Edit2,
  Check,
  X,
  FileCode,
  ExternalLink,
  Target,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIMentorAssessmentViewProps {
  userId: string;
  activeGoalId?: string;
  activeGoalTitle?: string;
  onAskMentorQuestion?: (question: string) => void;
  onStartPractice?: (skill: string) => void;
  onNavigateToRoadmap?: () => void;
}

export function AIMentorAssessmentView({
  userId,
  activeGoalId,
  activeGoalTitle,
  onAskMentorQuestion,
  onStartPractice,
  onNavigateToRoadmap,
}: AIMentorAssessmentViewProps) {
  const [skills, setSkills] = useState<any[]>([]);
  const [memories, setMemories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMemoryKey, setEditingMemoryKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [skillsRes, memRes] = await Promise.all([
        fetch(`/api/ai-mentor/skills?userId=${userId}`),
        fetch(`/api/ai-mentor/memory?userId=${userId}`),
      ]);
      const skillsData = await skillsRes.json();
      const memData = await memRes.json();

      if (skillsData.success && Array.isArray(skillsData.skills)) {
        setSkills(skillsData.skills);
      }
      if (memData.success && Array.isArray(memData.memories)) {
        setMemories(memData.memories);
      }
    } catch (err) {
      console.error("Failed to load assessment data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle student correction of inaccurate profile information
  const handleSaveCorrection = async (memoryId: string, category: string, key: string) => {
    try {
      const res = await fetch("/api/ai-mentor/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          key,
          value: editValue.trim(),
          studentConfirmed: true,
          confidence: 1.0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccessNotice(`Updated '${key}' successfully.`);
        setTimeout(() => setSaveSuccessNotice(null), 3000);
        setEditingMemoryKey(null);
        await loadData();
      }
    } catch (err) {
      console.error("Failed to update memory:", err);
    }
  };

  // Reconcile with Canonical 5-Tier Evidence Model:
  // 1. confirmed_evidence: Independently verified test passes, verified deliverables, assessed skills
  // 2. student_reported: Explicit student statements and preferences (with inline edit controls)
  // 3. extracted: Facts extracted from resume, GitHub commits, coursework artifacts
  // 4. system_inference: Diagnostic hypotheses and identified gaps (unverified)
  // 5. unknown_or_missing: Unobserved prerequisites with targeted clarifying prompts

  const confirmedSkills = skills.filter(
    (s) => s.masteryState === "verified" || s.masteryState === "confirmed" || s.evidenceSource === "code_execution" || s.evidenceSource === "assessment"
  );

  const studentReportedMemories = memories.filter(
    (m) => m.provenance === "student_reported" || m.category === "learning_preferences" || m.category === "current_goals"
  );

  const extractedItems = memories.filter(
    (m) => m.provenance === "extracted" || m.category === "resume_extracted" || m.category === "active_projects"
  );

  const inferredGapSkills = skills.filter(
    (s) => s.masteryState === "unverified" || s.masteryState === "learning" || s.masteryScore < 65
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* 1. Header */}
      <div className="pb-4 border-b border-[#DCE5D5]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-[#174B39]" />
          <h1 className="text-2xl sm:text-3xl font-serif text-[#17211E]">Canonical 5-Tier Assessment</h1>
        </div>
        <p className="text-xs sm:text-sm text-[#69756B] mt-1 max-w-3xl leading-relaxed">
          ASTRION enforces strict evidence classification. Inferred proficiency is never presented as independently verified, confidence is never displayed as a vanity rating, and all claims remain traceable to their underlying evidence source.
        </p>
      </div>

      {saveSuccessNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{saveSuccessNotice}</span>
          </span>
        </div>
      )}

      {/* 2. Current Goal Alignment Notice */}
      {activeGoalTitle && (
        <div className="p-4 rounded-2xl bg-[#E7F2DA] border border-[#27875E]/30 text-xs text-[#174B39] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#27875E]" />
            <span>
              Target Goal Alignment: <strong>{activeGoalTitle}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={onNavigateToRoadmap}
            className="text-[11px] font-bold text-[#174B39] hover:underline flex items-center gap-1"
          >
            <span>View Aligned Roadmap</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 3. The Canonical 5 Evidence Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TIER 1: Confirmed Evidence (confirmed_evidence) */}
        <div className="p-5 rounded-3xl bg-white/90 border border-[#DCE5D5] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-bold font-mono text-xs flex items-center justify-center">
                T1
              </span>
              <h3 className="font-serif font-bold text-sm text-[#17211E]">Confirmed Evidence</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Independently Verified
            </span>
          </div>
          <p className="text-[11px] text-[#69756B] leading-relaxed">
            Directly verified through completed milestone deliverables, verified commit SHAs, passing test suites, or solved coding challenges.
          </p>
          <div className="space-y-1.5 pt-1">
            {confirmedSkills.length > 0 ? (
              confirmedSkills.map((s, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-[#F0FDF4] border border-emerald-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-emerald-950 block">{s.skillName}</span>
                    <span className="text-[10px] text-emerald-700/80 font-mono">
                      Source: {s.evidenceSource || "Milestone Deliverable / Code Execution"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    Verified Proof
                  </span>
                </div>
              ))
            ) : (
              <div className="text-[11px] text-[#69756B] italic p-2.5 bg-slate-50 rounded-xl">
                No T1 deliverables verified yet. Complete roadmap milestones to record verified evidence.
              </div>
            )}
          </div>
        </div>

        {/* TIER 2: Student-Reported Profile (student_reported) */}
        <div className="p-5 rounded-3xl bg-white/90 border border-[#DCE5D5] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 font-bold font-mono text-xs flex items-center justify-center">
                T2
              </span>
              <h3 className="font-serif font-bold text-sm text-[#17211E]">Student-Reported Profile</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Student Stated (Editable)
            </span>
          </div>
          <p className="text-[11px] text-[#69756B] leading-relaxed">
            Information you explicitly shared with ASTRION. You have complete agency to edit or correct any inaccurate entry below.
          </p>
          <div className="space-y-1.5 pt-1">
            {studentReportedMemories.length > 0 ? (
              studentReportedMemories.slice(0, 4).map((m, idx) => {
                const isEditing = editingMemoryKey === m.id;
                return (
                  <div key={idx} className="p-2.5 rounded-xl bg-[#FAFAF2] border border-[#DCE5D5] space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#174B39] font-mono text-[11px]">{m.key}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMemoryKey(m.id);
                          setEditValue(m.value);
                        }}
                        className="p-1 text-[#69756B] hover:text-[#17211E]"
                        title="Correct this entry"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 pt-1">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 px-2 py-1 bg-white border border-[#27875E] rounded text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveCorrection(m.id, m.category, m.key)}
                          className="p-1 rounded bg-[#174B39] text-white"
                          title="Save correction"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingMemoryKey(null)}
                          className="p-1 text-[#69756B]"
                          title="Cancel"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#17211E]">{m.value}</p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-[11px] text-[#69756B] italic p-2.5 bg-slate-50 rounded-xl">
                Tell ASTRION about your experience or preferences in chat to populate your student-reported profile.
              </div>
            )}
          </div>
        </div>

        {/* TIER 3: Extracted Evidence (extracted) */}
        <div className="p-5 rounded-3xl bg-white/90 border border-[#DCE5D5] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-bold font-mono text-xs flex items-center justify-center">
                T3
              </span>
              <h3 className="font-serif font-bold text-sm text-[#17211E]">Extracted Evidence</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
              Separately Identified
            </span>
          </div>
          <p className="text-[11px] text-[#69756B] leading-relaxed">
            Structured claims extracted from uploaded resumes, Git commit logs, or coursework artifacts. Traceable to original artifacts.
          </p>
          <div className="space-y-1.5 pt-1">
            {extractedItems.length > 0 ? (
              extractedItems.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-blue-950 block">{item.key}</span>
                    <span className="text-[10px] text-blue-800/80 line-clamp-1">{item.value}</span>
                  </div>
                  <span className="text-[10px] font-mono font-medium text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 shrink-0">
                    Extracted Artifact
                  </span>
                </div>
              ))
            ) : (
              <div className="text-[11px] text-[#69756B] italic p-2.5 bg-slate-50 rounded-xl">
                Resume parsed skills and repository commits will be separately identified here.
              </div>
            )}
          </div>
        </div>

        {/* TIER 4: System Inferences & Gaps (system_inference) */}
        <div className="p-5 rounded-3xl bg-white/90 border border-[#DCE5D5] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 font-bold font-mono text-xs flex items-center justify-center">
                T4
              </span>
              <h3 className="font-serif font-bold text-sm text-[#17211E]">System Inferences & Gaps</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
              Hypothesis (Unverified)
            </span>
          </div>
          <p className="text-[11px] text-[#69756B] leading-relaxed">
            Algorithmic inferences regarding pacing or prerequisite gaps. ASTRION never treats these as verified claims until proven through practical execution.
          </p>
          <div className="space-y-1.5 pt-1">
            {inferredGapSkills.length > 0 ? (
              inferredGapSkills.slice(0, 4).map((g, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-purple-950 block">{g.skillName}</span>
                    <span className="text-[10px] text-purple-800/80">Diagnostic Status: Pacing check recommended</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onStartPractice
                        ? onStartPractice(g.skillName)
                        : onAskMentorQuestion?.(`I'd like to practice ${g.skillName}. Can you give me a first-principles exercise?`)
                    }
                    className="px-2 py-1 rounded-lg bg-white border border-purple-200 text-purple-900 font-medium text-[10px] hover:bg-purple-100/60 shrink-0"
                  >
                    Practice & Verify
                  </button>
                </div>
              ))
            ) : (
              <div className="text-[11px] text-[#69756B] italic p-2.5 bg-slate-50 rounded-xl">
                No active prerequisite gaps flagged for this goal.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TIER 5: Unknown or Missing Information (unknown_or_missing) */}
      <div className="p-5 rounded-3xl bg-[#FAFAF2] border border-[#DCE5D5] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-800 font-bold font-mono text-xs flex items-center justify-center">
              T5
            </span>
            <h3 className="font-serif font-bold text-sm text-[#17211E]">
              Unknown or Missing Information (Zero Assumptions)
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
            Pending Input
          </span>
        </div>
        <p className="text-xs text-[#69756B] leading-relaxed">
          Rather than guessing your experience level or making unfounded assumptions, ASTRION highlights missing competencies and requests your input:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {[
            "Have you written production Python, PyTorch, or C++ in a team setting?",
            "What is your target interview timeline (e.g. 30 days vs 6 months)?",
            "How many dedicated hours per week can you reliably commit to practice?",
            "Do you have existing GitHub repositories or projects you want reviewed?",
          ].map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onAskMentorQuestion?.(`Regarding the question '${q}': here is my background...`)}
              className="p-3 rounded-2xl bg-white border border-[#DCE5D5] hover:border-[#27875E] text-left text-xs text-[#17211E] transition-all flex items-center justify-between group shadow-2xs"
            >
              <span className="line-clamp-2">{q}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#69756B] group-hover:text-[#27875E] shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
