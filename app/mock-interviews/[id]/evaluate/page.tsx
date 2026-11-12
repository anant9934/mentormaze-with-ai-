"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Award,
  ArrowLeft,
  Save,
  CheckCircle2,
  Sliders,
  Sparkles,
  HelpCircle,
  FileCheck,
  Send,
} from "lucide-react";
import { CATEGORY_RUBRICS, InterviewCategory } from "@/lib/interview/rubric-constants";

export default function MentorEvaluateMockPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [category, setCategory] = useState<InterviewCategory>("sde_backend");
  const [targetRole, setTargetRole] = useState("SDE II (Backend)");
  const [difficulty, setDifficulty] = useState("Medium");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [strengths, setStrengths] = useState<string[]>([
    "Clear explanation of time and space complexity",
    "Great problem decomposition and clarifying questions",
  ]);
  const [growthAreas, setGrowthAreas] = useState<string[]>([
    "Practice handling edge cases upfront before coding",
    "Brush up on dynamic programming memoization patterns",
  ]);
  const [detailedFeedback, setDetailedFeedback] = useState(
    "Candidate demonstrated solid algorithmic thinking. When tackling the graph cycle detection problem, candidate correctly identified DFS with three-color marking. Communication was crisp and confident throughout."
  );
  const [recommendations, setRecommendations] = useState(
    "1. Solve 15 LeetCode Medium graph problems.\n2. Practice mock interviews focusing on edge case handling.\n3. Review clean code modularization techniques."
  );

  const [newStrength, setNewStrength] = useState("");
  const [newGrowth, setNewGrowth] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Initialize dimension scores whenever category changes
  useEffect(() => {
    const dimensions = CATEGORY_RUBRICS[category] || CATEGORY_RUBRICS.sde_backend;
    const initialScores: Record<string, number> = {};
    dimensions.forEach((d) => {
      initialScores[d.key] = scores[d.key] ?? 7.5;
    });
    setScores(initialScores);
  }, [category]);

  // Compute live overall score
  const currentDimensions = CATEGORY_RUBRICS[category] || CATEGORY_RUBRICS.sde_backend;
  const overallScore = (() => {
    let sum = 0;
    let totalWeight = 0;
    currentDimensions.forEach((d) => {
      const s = scores[d.key] ?? 7.5;
      sum += s * d.weight;
      totalWeight += d.weight;
    });
    return totalWeight > 0 ? (sum / totalWeight).toFixed(1) : "7.5";
  })();

  const handleScoreChange = (key: string, val: number) => {
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  const addStrength = () => {
    if (newStrength.trim()) {
      setStrengths([...strengths, newStrength.trim()]);
      setNewStrength("");
    }
  };

  const removeStrength = (idx: number) => {
    setStrengths(strengths.filter((_, i) => i !== idx));
  };

  const addGrowth = () => {
    if (newGrowth.trim()) {
      setGrowthAreas([...growthAreas, newGrowth.trim()]);
      setNewGrowth("");
    }
  };

  const removeGrowth = (idx: number) => {
    setGrowthAreas(growthAreas.filter((_, i) => i !== idx));
  };

  const handleSave = async (isDraft: boolean) => {
    setLoading(true);
    setSaveMessage(null);
    try {
      const res = await fetch(`/api/mock-interviews/${bookingId}/evaluation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorProfileId: "mentor-1",
          studentUserId: "user-student-1",
          category,
          targetRole,
          difficulty,
          dimensionScores: scores,
          strengths,
          growthAreas,
          detailedFeedback,
          actionableRecommendations: recommendations,
          isDraft,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveMessage(
          isDraft
            ? "Evaluation saved as private draft."
            : "Evaluation published successfully! Candidate has been notified."
        );
        if (!isDraft) {
          setTimeout(() => {
            router.push(`/mock-interviews/${bookingId}/report`);
          }, 1200);
        }
      } else {
        setSaveMessage("Error: " + (data.error || "Failed to save evaluation"));
      }
    } catch (e: any) {
      setSaveMessage("Submission error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF8F1] text-[#17211E]">
      <header className="border-b border-[#DED2BF]/50 bg-white sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/mentor/dashboard"
              className="text-xs font-semibold text-[#46514B] hover:text-[#123B2E] flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Mentor Dashboard</span>
            </Link>
            <span className="text-[#DED2BF]">/</span>
            <span className="font-semibold text-sm text-[#123B2E]">Mock Interview Evaluation</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave(true)}
              disabled={loading}
              className="px-4 py-2 border border-[#DED2BF] bg-white text-[#46514B] rounded-xl text-xs font-semibold hover:bg-[#F4EFE4] transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={loading}
              className="px-5 py-2 bg-[#123B2E] text-white rounded-xl text-xs font-semibold hover:bg-[#174B39] transition flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publish Scorecard</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {saveMessage && (
          <div className="p-4 rounded-xl bg-[#EDF1E8] border border-[#DDE6D7] text-sm text-[#123B2E] flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-[#21634A]" />
            {saveMessage}
          </div>
        )}

        {/* Overview Banner */}
        <div className="bg-white p-6 rounded-3xl border border-[#DED2BF]/60 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDF1E8] text-[#123B2E] text-[11px] font-bold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-[#21634A]" />
              <span>Structured Rubric Grading</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-[#123B2E]">
              Evaluate Candidate Performance
            </h1>
            <p className="text-xs text-[#46514B]">
              Standardized evaluation based on category weights. The student will receive a full scorecard once published.
            </p>
          </div>

          {/* Overall Live Score Badge */}
          <div className="flex items-center gap-4 bg-[#FBF8F1] p-4 rounded-2xl border border-[#DED2BF]">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#46514B] block">Computed Overall</span>
              <span className="text-xs text-[#21634A] font-medium">Weighted Composite</span>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-[#123B2E] text-white flex flex-col items-center justify-center font-bold">
              <span className="text-2xl leading-none">{overallScore}</span>
              <span className="text-[9px] text-[#DDE6D7]">/ 10</span>
            </div>
          </div>
        </div>

        {/* Category & Role Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded-2xl border border-[#DED2BF]/60 shadow-sm">
          <div>
            <label className="block text-xs font-semibold text-[#46514B] uppercase mb-1">
              Interview Track / Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 border border-[#DED2BF] rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#123B2E]"
            >
              <option value="sde_backend">Software Engineering (Backend & DSA)</option>
              <option value="sde_frontend">Software Engineering (Frontend & Web)</option>
              <option value="system_design">System Design & Cloud Architecture</option>
              <option value="behavioral">Behavioral & Leadership (STAR)</option>
              <option value="data_science">Data Science & Machine Learning</option>
              <option value="product_management">Product Management & Product Sense</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#46514B] uppercase mb-1">
              Target Candidate Role
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full px-3 py-2 border border-[#DED2BF] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#123B2E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#46514B] uppercase mb-1">
              Problem Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3 py-2 border border-[#DED2BF] rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#123B2E]"
            >
              <option value="Easy">Entry / Easy</option>
              <option value="Medium">Mid-Level / Medium</option>
              <option value="Hard">Senior / Hard</option>
            </select>
          </div>
        </div>

        {/* Dimension Sliders */}
        <div className="bg-white p-6 rounded-3xl border border-[#DED2BF]/60 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#DED2BF]/40 pb-3">
            <h3 className="font-serif font-bold text-lg text-[#123B2E]">
              Core Competency Dimensions ({currentDimensions.length})
            </h3>
            <span className="text-xs text-[#46514B]">Scale: 0.0 to 10.0</span>
          </div>

          <div className="space-y-6">
            {currentDimensions.map((dim) => {
              const currentVal = scores[dim.key] ?? 7.5;
              return (
                <div key={dim.key} className="p-4 rounded-2xl bg-[#FBF8F1] border border-[#DED2BF]/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#123B2E]">{dim.label}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EDF1E8] text-[#21634A] font-bold">
                          Weight: {dim.weight}%
                        </span>
                      </div>
                      <p className="text-xs text-[#46514B] mt-0.5">{dim.description}</p>
                    </div>
                    <div className="text-xl font-bold font-serif text-[#123B2E] px-3 py-1 bg-white rounded-xl border border-[#DED2BF]">
                      {currentVal.toFixed(1)}
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={currentVal}
                    onChange={(e) => handleScoreChange(dim.key, parseFloat(e.target.value))}
                    className="w-full accent-[#123B2E] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#46514B]">
                    <span>0.0 (Unprepared)</span>
                    <span>5.0 (Developing)</span>
                    <span>8.0 (Ready for Hire)</span>
                    <span>10.0 (Exceptional)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Strengths & Growth Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Strengths */}
          <div className="bg-white p-6 rounded-3xl border border-[#DED2BF]/60 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-[#21634A] flex items-center gap-1.5 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Key Strengths Observed</span>
            </h3>

            <div className="space-y-2">
              {strengths.map((str, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-[#EDF1E8] border border-[#DDE6D7] text-xs text-[#123B2E] flex items-center justify-between">
                  <span>{str}</span>
                  <button onClick={() => removeStrength(idx)} className="text-[#46514B] hover:text-red-600 font-bold ml-2">×</button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Add a key strength..."
                value={newStrength}
                onChange={(e) => setNewStrength(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addStrength()}
                className="flex-1 px-3 py-2 border border-[#DED2BF] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#123B2E]"
              />
              <button
                type="button"
                onClick={addStrength}
                className="px-3 py-2 bg-[#123B2E] text-white rounded-xl text-xs font-semibold hover:bg-[#174B39]"
              >
                Add
              </button>
            </div>
          </div>

          {/* Growth Areas */}
          <div className="bg-white p-6 rounded-3xl border border-[#DED2BF]/60 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-amber-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Growth Areas & Gaps</span>
            </h3>

            <div className="space-y-2">
              {growthAreas.map((ga, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                  <span>{ga}</span>
                  <button onClick={() => removeGrowth(idx)} className="text-amber-700 hover:text-red-600 font-bold ml-2">×</button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Add a growth area..."
                value={newGrowth}
                onChange={(e) => setNewGrowth(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addGrowth()}
                className="flex-1 px-3 py-2 border border-[#DED2BF] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#123B2E]"
              />
              <button
                type="button"
                onClick={addGrowth}
                className="px-3 py-2 bg-[#123B2E] text-white rounded-xl text-xs font-semibold hover:bg-[#174B39]"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Narrative Feedback & Actionable Next Steps */}
        <div className="bg-white p-6 rounded-3xl border border-[#DED2BF]/60 shadow-sm space-y-6">
          <div>
            <label className="block text-xs font-bold text-[#123B2E] uppercase tracking-wider mb-2">
              Detailed Narrative Feedback
            </label>
            <textarea
              rows={5}
              value={detailedFeedback}
              onChange={(e) => setDetailedFeedback(e.target.value)}
              className="w-full p-4 border border-[#DED2BF] rounded-2xl text-xs text-[#17211E] focus:outline-none focus:ring-2 focus:ring-[#123B2E]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#123B2E] uppercase tracking-wider mb-2">
              Actionable Next Steps & Study Recommendations
            </label>
            <textarea
              rows={4}
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              className="w-full p-4 border border-[#DED2BF] rounded-2xl text-xs text-[#17211E] focus:outline-none focus:ring-2 focus:ring-[#123B2E]"
            />
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            onClick={() => handleSave(true)}
            disabled={loading}
            className="px-6 py-3 border border-[#DED2BF] bg-white text-[#46514B] rounded-xl text-sm font-semibold hover:bg-[#F4EFE4] transition"
          >
            Save as Draft
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={loading}
            className="px-8 py-3 bg-[#123B2E] text-white rounded-xl text-sm font-semibold hover:bg-[#174B39] transition shadow-md flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Publish Scorecard to Candidate</span>
          </button>
        </div>
      </main>
    </div>
  );
}

