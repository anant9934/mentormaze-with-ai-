"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  AlertCircle,
  TrendingUp,
  Brain,
  RotateCw,
} from "lucide-react";
import { CANONICAL_TAXONOMY, SkillTaxonomyNode, StudentSkillRecord } from "@/lib/ai-mentor/skills-constants";
import { FocusArea } from "@/lib/ai-mentor/types";
import { cn } from "@/lib/utils";

interface AIMentorSkillsProps {
  onVerifySkill: (skillName: string, focusArea: FocusArea) => void;
  userId?: string;
}

export function AIMentorSkills({ onVerifySkill, userId = "usr-student-1" }: AIMentorSkillsProps) {
  const [skills, setSkills] = useState<StudentSkillRecord[]>([]);
  const [taxonomy, setTaxonomy] = useState<SkillTaxonomyNode[]>(CANONICAL_TAXONOMY);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    async function loadSkills() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/ai-mentor/skills?userId=${userId}`);
        const data = await res.json();
        if (data.success) {
          setSkills(data.skills || []);
          if (data.taxonomy) setTaxonomy(data.taxonomy);
        }
      } catch (err) {
        console.error("Failed to load skills:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSkills();
  }, [userId]);

  // Aggregate stats
  const stats = useMemo(() => {
    const demonstrated = skills.filter(
      (s) => s.masteryState === "demonstrated" || s.masteryState === "consistently_demonstrated"
    ).length;
    const developing = skills.filter((s) => s.masteryState === "developing").length;
    const introduced = skills.filter(
      (s) => s.masteryState === "introduced" || s.masteryState === "not_assessed"
    ).length;
    const total = taxonomy.length;
    const avgScore =
      skills.length > 0
        ? (skills.reduce((acc, s) => acc + s.masteryScore, 0) / skills.length).toFixed(1)
        : "7.0";

    return { demonstrated, developing, introduced, total, avgScore };
  }, [skills, taxonomy]);

  // Merge taxonomy with recorded skills
  const mergedSkills = useMemo(() => {
    const recordMap = new Map<string, StudentSkillRecord>();
    skills.forEach((s) => recordMap.set(s.skillId, s));

    return taxonomy.map((node) => {
      const record = recordMap.get(node.id);
      return {
        ...node,
        record: record || {
          id: `rec-${node.id}`,
          studentUserId: userId,
          skillId: node.id,
          masteryState: "not_assessed" as const,
          masteryScore: 0,
          confidence: 0,
          assessmentCount: 0,
          successCount: 0,
          knownWeaknesses: [],
          commonMisconceptions: [],
          lastAssessedAt: new Date().toISOString(),
          evidenceSource: "self_reported" as const,
        },
      };
    });
  }, [taxonomy, skills, userId]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    taxonomy.forEach((t) => set.add(t.category));
    return ["All", ...Array.from(set)];
  }, [taxonomy]);

  const filteredSkills = useMemo(() => {
    if (selectedCategory === "All") return mergedSkills;
    return mergedSkills.filter((s) => s.category === selectedCategory);
  }, [mergedSkills, selectedCategory]);

  const getMasteryColor = (state: string) => {
    switch (state) {
      case "consistently_demonstrated":
      case "demonstrated":
        return "bg-emerald-500 text-white";
      case "developing":
        return "bg-amber-500 text-white";
      default:
        return "bg-slate-400 text-white";
    }
  };

  const getFocusAreaForSkill = (category: string): FocusArea => {
    switch (category) {
      case "DSA":
      case "Programming":
        return "coding_dsa";
      case "System Design":
        return "system_design";
      case "Backend":
      case "Databases":
        return "learn";
      default:
        return "learn";
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#DCE5D5]">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-[#174B39]" />
          <h1 className="text-2xl sm:text-3xl font-serif text-[#17211E]">Student Skill Graph</h1>
        </div>
        <p className="text-xs sm:text-sm text-[#69756B] mt-1">
          Evidence-backed mastery tracking across canonical software engineering competencies. Verified through Socratic problem-solving and code execution.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white/90 rounded-2xl border border-[#DCE5D5] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#69756B]">Demonstrated</span>
          <div className="text-2xl font-bold text-[#174B39] mt-1">{stats.demonstrated}</div>
          <span className="text-[11px] text-[#27875E] font-medium">Verified by mentor</span>
        </div>
        <div className="p-4 bg-white/90 rounded-2xl border border-[#DCE5D5] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#69756B]">Developing</span>
          <div className="text-2xl font-bold text-amber-700 mt-1">{stats.developing}</div>
          <span className="text-[11px] text-amber-600 font-medium">Active practice</span>
        </div>
        <div className="p-4 bg-white/90 rounded-2xl border border-[#DCE5D5] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#69756B]">Taxonomy Size</span>
          <div className="text-2xl font-bold text-[#17211E] mt-1">{stats.total}</div>
          <span className="text-[11px] text-[#69756B]">Canonical nodes</span>
        </div>
        <div className="p-4 bg-white/90 rounded-2xl border border-[#DCE5D5] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#69756B]">Average Score</span>
          <div className="text-2xl font-bold text-[#174B39] mt-1">{stats.avgScore} / 10</div>
          <span className="text-[11px] text-[#27875E] font-medium">Competency index</span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors",
              selectedCategory === cat
                ? "bg-[#174B39] text-white"
                : "bg-white border border-[#DCE5D5] text-[#69756B] hover:text-[#17211E]"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Skills Grid */}
      {isLoading ? (
        <div className="p-12 text-center">
          <RotateCw className="w-6 h-6 text-[#27875E] animate-spin mx-auto mb-2" />
          <p className="text-xs text-[#69756B]">Loading student skill knowledge graph...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSkills.map((item) => {
            const scorePercent = Math.min(100, Math.round((item.record.masteryScore / 10) * 100));
            return (
              <div
                key={item.id}
                className="p-4 bg-white/90 hover:bg-white rounded-2xl border border-[#DCE5D5] hover:border-[#174B39]/30 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#69756B] bg-[#EDF3E8] px-2 py-0.5 rounded-md">
                      {item.category}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full capitalize",
                        getMasteryColor(item.record.masteryState)
                      )}
                    >
                      {item.record.masteryState.replace(/_/g, " ")}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-[#17211E]">{item.name}</h3>
                  <p className="text-xs text-[#69756B] mt-1 line-clamp-2">{item.description}</p>

                  {/* Progress Bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[#69756B]">
                      <span>Mastery Score</span>
                      <span className="font-bold text-[#17211E]">{item.record.masteryScore.toFixed(1)} / 10.0</span>
                    </div>
                    <div className="w-full bg-[#EDF3E8] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#27875E] h-full rounded-full transition-all duration-500"
                        style={{ width: `${scorePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Prerequisites */}
                  {item.prerequisites.length > 0 && (
                    <div className="mt-2 text-[10px] text-[#69756B]">
                      <span className="font-semibold">Prereqs: </span>
                      <span>{item.prerequisites.join(", ")}</span>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-[#EDF3E8] flex items-center justify-between">
                  <span className="text-[10px] text-[#69756B]">
                    {item.record.assessmentCount > 0
                      ? `${item.record.assessmentCount} assessments recorded`
                      : "Not assessed yet"}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onVerifySkill(
                        `Verify my understanding of ${item.name} with a progressive Socratic problem.`,
                        getFocusAreaForSkill(item.category)
                      )
                    }
                    className="flex items-center gap-1 text-xs font-semibold text-[#174B39] hover:text-[#27875E] transition-colors"
                  >
                    <span>Assess with Dr. Aarav</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

