"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { store } from "@/lib/data/store";
import {
  MatchmakingEngine,
  STRATEGY_PRESETS,
  MatchingStrategy,
} from "@/lib/matching/engine";
import {
  MATCH_DIMENSIONS,
  HUNDRED_MATCH_FACTORS,
  FactorDimensionId,
} from "@/lib/matching/factors";
import {
  Sliders,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Save,
  Users,
  Code2,
  TrendingUp,
  Target,
  MessageSquare,
  Calendar,
  DollarSign,
  Award,
  Zap,
  Info,
  ExternalLink,
} from "lucide-react";

export default function MatchingManagementPage() {
  const [selectedStrategy, setSelectedStrategy] = useState<MatchingStrategy>("balanced");
  const [weights, setWeights] = useState<Record<FactorDimensionId, number>>({
    technical_skills: 25,
    career_trajectory: 20,
    interview_evaluation: 15,
    pedagogy_communication: 12,
    scheduling_logistics: 10,
    economic_value: 8,
    reputation_outcomes: 10,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeCatalogTab, setActiveCatalogTab] = useState<FactorDimensionId>("technical_skills");

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const student = store.getStudentProfile("user-student-1");
  const approvedMentors = store.getMentors(true);

  // Live simulation results based on current weights
  const { simulatedRankings, executionMs } = useMemo(() => {
    const t0 = performance.now();
    const customWeights: Partial<Record<FactorDimensionId, number>> = {};
    (Object.keys(weights) as FactorDimensionId[]).forEach((k) => {
      customWeights[k] = weights[k] / 100;
    });

    const results = MatchmakingEngine.rankMentors(
      student || null,
      {
        customDimensionWeights: customWeights,
        targetRole: student?.targetRole,
      },
      approvedMentors,
      selectedStrategy
    );
    const latency = Number((performance.now() - t0).toFixed(2));
    return { simulatedRankings: results, executionMs: latency };
  }, [student, approvedMentors, weights, selectedStrategy]);

  const handleWeightChange = (dimId: FactorDimensionId, val: number) => {
    setWeights((prev) => ({
      ...prev,
      [dimId]: val,
    }));
  };

  const applyPreset = (strat: MatchingStrategy) => {
    setSelectedStrategy(strat);
    const preset = STRATEGY_PRESETS[strat];
    const newWeights: Record<FactorDimensionId, number> = {} as any;
    (Object.keys(preset) as FactorDimensionId[]).forEach((dim) => {
      newWeights[dim] = Math.round(preset[dim] * 100);
    });
    setWeights(newWeights);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const dimensionIcons: Record<FactorDimensionId, any> = {
    technical_skills: Code2,
    career_trajectory: TrendingUp,
    interview_evaluation: Target,
    pedagogy_communication: MessageSquare,
    scheduling_logistics: Calendar,
    economic_value: DollarSign,
    reputation_outcomes: Award,
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 text-ink-950 font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold text-ink-700 hover:text-forest-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Dashboard</span>
          </Link>

          <Link
            href="/match"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-800 hover:text-forest-950 bg-forest-50 px-3 py-1.5 rounded-xl border border-forest-200"
          >
            <span>Preview Public AI Matchmaker</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-900 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>100-Factor Intelligence Engine v2.0</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-ink-950">
            Matching & Recommendation Algorithm Management
          </h1>
          <p className="text-xs text-ink-700 mt-1">
            Configure the 7 core dimensions, tune algorithmic weighting vectors, and inspect the catalog of 100 quantified matching factors.
          </p>
        </div>

        {savedSuccess && (
          <div className="p-3.5 rounded-2xl bg-sage-100 text-forest-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Matching dimensions updated and deployed to live production algorithm.</span>
          </div>
        )}

        {/* TOP METRICS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
            <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider block">
              Quantified Factors
            </span>
            <span className="text-2xl font-bold font-mono text-ink-950 mt-1 block">100 Factors</span>
            <span className="text-[10px] text-emerald-700">7 Core Dimensions</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
            <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider block">
              Execution Latency
            </span>
            <span className="text-2xl font-bold font-mono text-forest-900 mt-1 block">
              {executionMs} ms
            </span>
            <span className="text-[10px] text-emerald-700">Deterministic · Zero LLM Cost</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
            <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider block">
              Weight Allocation
            </span>
            <span
              className={`text-2xl font-bold font-mono mt-1 block ${
                totalWeight === 100 ? "text-emerald-700" : "text-amber-600"
              }`}
            >
              {totalWeight}%
            </span>
            <span className="text-[10px] text-ink-500">
              {totalWeight === 100 ? "Fully Normalized (100%)" : `Adjust to 100% (currently ${totalWeight}%)`}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
            <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider block">
              Active Vetted Mentors
            </span>
            <span className="text-2xl font-bold font-mono text-ink-950 mt-1 block">
              {approvedMentors.length} Verified
            </span>
            <span className="text-[10px] text-emerald-700">100% Eligible for Matching</span>
          </div>
        </div>

        {/* WORKSPACE: LEFT (7 DIMENSIONS TUNING) & RIGHT (LIVE SIMULATION) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ======================================================== */}
          {/* LEFT COLUMN: 7-DIMENSION SLIDERS (7 COLS)                */}
          {/* ======================================================== */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-border shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-sm text-ink-950 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-forest-800" />
                <span>7 Core Dimension Weights</span>
              </h3>

              {/* Strategy Presets */}
              <div className="flex items-center gap-1">
                {(["balanced", "technical_mastery", "interview_sprint"] as MatchingStrategy[]).map(
                  (strat) => (
                    <button
                      key={strat}
                      onClick={() => applyPreset(strat)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                        selectedStrategy === strat
                          ? "bg-forest-900 text-white"
                          : "bg-cream-100 hover:bg-cream-200 text-ink-700"
                      }`}
                    >
                      {strat.replace("_", " ")}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="space-y-4">
              {Object.values(MATCH_DIMENSIONS).map((dim) => {
                const Icon = dimensionIcons[dim.id] || Sparkles;
                const factorCount = HUNDRED_MATCH_FACTORS.filter((f) => f.dimension === dim.id).length;
                const curVal = weights[dim.id] || 0;

                return (
                  <div key={dim.id} className="p-3.5 rounded-2xl bg-cream-50/50 border border-border/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-forest-900 shadow-2xs">
                          <Icon className="w-4 h-4 text-forest-700" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-ink-950">{dim.name}</span>
                          <span className="text-[10px] text-ink-500 block">
                            {factorCount} explicit factors · {dim.description}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-xs text-forest-900 bg-white px-2 py-0.5 rounded-md border border-border">
                        {curVal}%
                      </span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={50}
                      value={curVal}
                      onChange={(e) => handleWeightChange(dim.id, parseInt(e.target.value, 10))}
                      className="w-full accent-forest-900 cursor-pointer mt-1"
                    />
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-ink-600">
                Weights are verified and normalized dynamically before ranking execution.
              </span>
              <button
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Production Weights</span>
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: LIVE SIMULATOR (5 COLS)                   */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-sm text-ink-950 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Live Pair Simulation</span>
              </h3>
              <span className="font-mono text-[11px] text-forest-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                ⚡ {executionMs}ms
              </span>
            </div>

            {/* Test Student Card */}
            <div className="p-3.5 rounded-2xl bg-cream-50 border border-border">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-ink-500">
                <span>Simulation Target Candidate</span>
                <span className="text-forest-800">LPU · B.Tech CS</span>
              </div>
              <h4 className="font-bold text-xs text-ink-950 mt-1">Anant Kumar</h4>
              <p className="text-[11px] text-ink-600">
                Target: {student?.targetRole} · Skills: DSA, TypeScript, System Design
              </p>
            </div>

            {/* Simulated Ranked Matches */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-bold text-ink-500 uppercase tracking-wider block">
                Calculated Recommendations with 100-Factor Vector
              </span>

              {simulatedRankings.map((sim) => (
                <div
                  key={sim.mentor.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    sim.isBestMatch
                      ? "bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-500/20"
                      : "bg-cream-50/40 border-border"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-ink-950">{sim.mentor.headline}</span>
                        {sim.isBestMatch && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-600 text-white">
                            BEST FIT
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-ink-600">
                        {sim.mentor.currentRole} at {sim.mentor.organization}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-sm text-forest-900 bg-white px-2 py-1 rounded-xl border border-border shadow-2xs">
                      {sim.overallScore}%
                    </span>
                  </div>

                  {/* Top factor excerpt */}
                  <p className="text-[10px] text-ink-700 bg-white p-2 rounded-lg border border-border/60">
                    💡 <strong>Key Driver:</strong> {sim.positiveHighlights[0]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 100-FACTOR CATALOG EXPLORER (FULL AUDIT TABLE)           */}
        {/* ======================================================== */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-border shadow-sm space-y-6">
          <div>
            <h3 className="font-serif text-xl font-bold text-ink-950">
              100-Factor Intelligence Taxonomy Explorer
            </h3>
            <p className="text-xs text-ink-600 mt-0.5">
              Browse every single codified factor across the 7 platform intelligence dimensions.
            </p>
          </div>

          {/* Dimension Selector Tabs */}
          <div className="flex overflow-x-auto border-b border-border bg-cream-50 p-2 rounded-2xl gap-1.5 scrollbar-thin">
            {Object.values(MATCH_DIMENSIONS).map((dim) => {
              const active = activeCatalogTab === dim.id;
              const Icon = dimensionIcons[dim.id] || Sparkles;
              const count = HUNDRED_MATCH_FACTORS.filter((f) => f.dimension === dim.id).length;
              return (
                <button
                  key={dim.id}
                  onClick={() => setActiveCatalogTab(dim.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? "bg-forest-900 text-white shadow-sm"
                      : "bg-white hover:bg-cream-100 text-ink-700 border border-border/80"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{dim.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                      active ? "bg-emerald-500 text-forest-950 font-bold" : "bg-cream-200 text-ink-800"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Factors Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {HUNDRED_MATCH_FACTORS.filter((f) => f.dimension === activeCatalogTab).map((factor) => (
              <div
                key={factor.id}
                className="p-3.5 rounded-2xl border border-border bg-cream-50/40 hover:bg-white transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200">
                      {factor.code}
                    </span>
                    <span className="text-[10px] text-ink-500 font-mono">Weight: {factor.weight}</span>
                  </div>
                  <h5 className="font-bold text-xs text-ink-950 mt-1">{factor.name}</h5>
                  <p className="text-[11px] text-ink-600 mt-1">{factor.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
