"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { store } from "@/lib/data/store";
import { useAuth } from "@/lib/auth/context";
import {
  MatchmakingEngine,
  StudentTargetPreferences,
  MatchingStrategy,
  STRATEGY_PRESETS,
  MatchEvaluationResult,
} from "@/lib/matching/engine";
import { MATCH_DIMENSIONS, HUNDRED_MATCH_FACTORS, FactorDimensionId } from "@/lib/matching/factors";
import {
  Sparkles,
  Zap,
  Target,
  Code2,
  TrendingUp,
  MessageSquare,
  Calendar,
  DollarSign,
  Award,
  ChevronRight,
  Sliders,
  CheckCircle2,
  Info,
  X,
  Clock,
  ShieldCheck,
  Star,
  ArrowRight,
  BookOpen,
  Search,
  RotateCcw,
  Scale,
  Flame,
  Check,
} from "lucide-react";

const STRATEGY_OPTIONS: { id: MatchingStrategy; name: string; desc: string; icon: string }[] = [
  {
    id: "balanced",
    name: "Balanced 7-Dimension Fit",
    desc: "Comprehensive evaluation across technical, career, interview, pedagogy, and logistics.",
    icon: "⚖️",
  },
  {
    id: "technical_mastery",
    name: "Technical & System Architecture",
    desc: "Heavily weights deep HLD, LLD, distributed systems, clean code, and DSA problem solving.",
    icon: "💻",
  },
  {
    id: "interview_sprint",
    name: "Urgent Interview Sprint",
    desc: "Prioritizes hiring committee insiders, high-rigor mock interview loops, and 24-48h availability.",
    icon: "🎯",
  },
  {
    id: "career_pivot",
    name: "Career Pivot & Leveling",
    desc: "Optimized for non-traditional backgrounds, domain transitions, and senior promotion velocity.",
    icon: "🚀",
  },
  {
    id: "budget_optimizer",
    name: "Budget & ROI Optimizer",
    desc: "Prioritizes student-friendly pilot tiers (₹149 - ₹249) with high seniority experience return.",
    icon: "💡",
  },
];

const TARGET_ROLES = [
  "Software Engineer",
  "Backend Engineer",
  "Frontend Engineer",
  "Full Stack Developer",
  "Data Scientist / ML Engineer",
  "Product Manager",
  "System Architect",
];

const TOP_COMPANIES = ["Microsoft", "Google", "Adobe", "Amazon", "Flipkart", "Atlassian", "Uber"];

const POPULAR_SKILLS = [
  "System Design",
  "Distributed Systems",
  "Data Structures & Algorithms",
  "TypeScript",
  "Python",
  "Cloud Architecture",
  "Web Development",
  "Clean Code",
  "Machine Learning",
];

export default function MatchmakingPage() {
  const { user } = useAuth();
  const currentUserId = user?.id || "user-student-1";
  const student = store.getStudentProfile(currentUserId);
  const approvedMentors = store.getMentors(true);

  // Filter / Questionnaire State
  const [selectedStrategy, setSelectedStrategy] = useState<MatchingStrategy>("balanced");
  const [targetRole, setTargetRole] = useState(student?.targetRole || "Software Engineer");
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(["Microsoft", "Google"]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    "System Design",
    "Distributed Systems",
  ]);
  const [maxBudget, setMaxBudget] = useState<number>(500);
  const [tonePreference, setTonePreference] = useState<"direct_candor" | "gentle_encouraging">("direct_candor");
  const [mentorSearch, setMentorSearch] = useState("");

  // Modal States
  const [inspectingEvaluation, setInspectingEvaluation] = useState<MatchEvaluationResult | null>(null);
  const [activeModalDimension, setActiveModalDimension] = useState<FactorDimensionId>("technical_skills");
  const [modalFactorSearch, setModalFactorSearch] = useState("");
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Compute 100-Factor Matchmaking
  const { rankings, executionTimeMs } = useMemo(() => {
    const t0 = performance.now();
    const prefs: StudentTargetPreferences = {
      targetRole,
      targetCompanies: selectedCompanies,
      skillsToImprove: selectedSkills,
      maxBudgetInr: maxBudget,
      preferredTone: tonePreference,
    };
    const res = MatchmakingEngine.rankMentors(student || null, prefs, approvedMentors, selectedStrategy);
    const timeTaken = Number((performance.now() - t0).toFixed(2));
    return { rankings: res, executionTimeMs: timeTaken };
  }, [student, approvedMentors, selectedStrategy, targetRole, selectedCompanies, selectedSkills, maxBudget, tonePreference]);

  // Search Filtered Rankings
  const filteredRankings = useMemo(() => {
    if (!mentorSearch.trim()) return rankings;
    const q = mentorSearch.toLowerCase();
    return rankings.filter(
      (r) =>
        r.mentor.headline.toLowerCase().includes(q) ||
        r.mentor.organization.toLowerCase().includes(q) ||
        r.mentor.currentRole.toLowerCase().includes(q) ||
        r.mentor.skills.some((s) => s.toLowerCase().includes(q))
    );
  }, [rankings, mentorSearch]);

  const toggleCompany = (comp: string) => {
    setSelectedCompanies((prev) =>
      prev.includes(comp) ? prev.filter((c) => c !== comp) : [...prev, comp]
    );
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const resetFilters = () => {
    setSelectedStrategy("balanced");
    setTargetRole("Software Engineer");
    setSelectedCompanies(["Microsoft", "Google"]);
    setSelectedSkills(["System Design", "Distributed Systems"]);
    setMaxBudget(500);
    setTonePreference("direct_candor");
    setMentorSearch("");
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

  // Filter factors inside inspection modal
  const filteredModalFactors = useMemo(() => {
    if (!inspectingEvaluation) return [];
    const dimFactors = inspectingEvaluation.dimensions[activeModalDimension]?.factors || [];
    if (!modalFactorSearch.trim()) return dimFactors;
    const q = modalFactorSearch.toLowerCase();
    return dimFactors.filter(
      (f) =>
        f.factor.name.toLowerCase().includes(q) ||
        f.factor.code.toLowerCase().includes(q) ||
        f.explanation.toLowerCase().includes(q)
    );
  }, [inspectingEvaluation, activeModalDimension, modalFactorSearch]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F8F5] text-ink-950 font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* HERO BANNER */}
        <section className="mb-10 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/80">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-900 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>AI Multi-Factor Intelligence Matchmaker</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-emerald-200">100 Explicit Factors</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-ink-950">
                Precision Mentorship Matching
              </h1>
              <p className="text-sm sm:text-base text-ink-700 mt-2 max-w-2xl">
                Evaluates candidates and senior mentors across 7 dimensions and 100 quantified factors,
                from technical stack overlap and hiring committee standards to communication candor and scheduling reliability.
              </p>
            </div>

            {/* Quick Actions & Live Engine Benchmark */}
            <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-3 self-start sm:self-auto">
              <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-border shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                  <Zap className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-ink-950">
                    <span>Engine Speed:</span>
                    <span className="text-emerald-700 font-mono">{executionTimeMs} ms</span>
                  </div>
                  <p className="text-[11px] text-ink-500">100 Factors · Deterministic</p>
                </div>
              </div>

              {rankings.length >= 2 && (
                <button
                  onClick={() => setShowCompareModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Scale className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Compare Top Mentors</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 2-COLUMN WORKSPACE: LEFT (PREFERENCES) & RIGHT (RANKED RESULTS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ======================================================== */}
          {/* LEFT COLUMN: INTERACTIVE CONTROLS (4 COLS)              */}
          {/* ======================================================== */}
          <div className="lg:col-span-4 space-y-6">
            {/* Matching Strategy Presets */}
            <div className="bg-white p-6 rounded-3xl border border-border shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-forest-800 uppercase tracking-wider">
                  <Sliders className="w-4 h-4 text-forest-700" />
                  <span>Algorithm Strategy</span>
                </div>
                <button
                  onClick={resetFilters}
                  className="text-[11px] text-ink-500 hover:text-forest-900 flex items-center gap-1 transition-colors"
                  title="Reset to default settings"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {STRATEGY_OPTIONS.map((strat) => (
                  <button
                    key={strat.id}
                    onClick={() => setSelectedStrategy(strat.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all ${
                      selectedStrategy === strat.id
                        ? "bg-forest-900 text-white border-forest-900 shadow-md ring-2 ring-forest-700/20"
                        : "bg-white hover:bg-cream-50 text-ink-900 border-border"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                      <span>{strat.icon}</span>
                      <span>{strat.name}</span>
                    </div>
                    <p
                      className={`text-[11px] mt-1 line-clamp-2 ${
                        selectedStrategy === strat.id ? "text-emerald-200" : "text-ink-600"
                      }`}
                    >
                      {strat.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Role & Dream Companies */}
            <div className="bg-white p-6 rounded-3xl border border-border shadow-sm space-y-5">
              <div>
                <label className="block text-xs font-bold text-ink-900 uppercase tracking-wider mb-2">
                  Target Career Role
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-cream-50/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-forest-800 cursor-pointer"
                >
                  {TARGET_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-900 uppercase tracking-wider mb-2">
                  Dream Target Companies
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TOP_COMPANIES.map((comp) => {
                    const active = selectedCompanies.includes(comp);
                    return (
                      <button
                        key={comp}
                        onClick={() => toggleCompany(comp)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                          active
                            ? "bg-forest-900 text-white border-forest-900 shadow-sm"
                            : "bg-white hover:bg-cream-100 text-ink-700 border-border"
                        }`}
                      >
                        {comp}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-900 uppercase tracking-wider mb-2">
                  Key Skills to Strengthen
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SKILLS.map((skill) => {
                    const active = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all border ${
                          active
                            ? "bg-emerald-800 text-white border-emerald-800"
                            : "bg-cream-100/80 text-ink-700 border-border"
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-ink-900 uppercase tracking-wider mb-2">
                  <span>Max Budget Per Session</span>
                  <span className="text-forest-800 font-mono text-sm">₹{maxBudget}</span>
                </div>
                <input
                  type="range"
                  min={149}
                  max={600}
                  step={50}
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(parseInt(e.target.value, 10))}
                  className="w-full accent-forest-800 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-ink-500 font-mono mt-1">
                  <span>₹149 (15m Pilot)</span>
                  <span>₹249 (30m Deep Dive)</span>
                  <span>₹600 (Full Loop)</span>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: RANKED RECOMMENDATIONS (8 COLS)            */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header Strip with Search Input */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-ink-950 flex items-center gap-2">
                  <span>Top Ranked Mentors</span>
                  <span className="text-xs font-sans font-semibold bg-forest-100 text-forest-900 px-2 py-0.5 rounded-full">
                    {filteredRankings.length} of {rankings.length}
                  </span>
                </h3>
                <p className="text-xs text-ink-600">
                  Ranked by 100-factor compatibility vector for {user?.displayName || "You"}
                </p>
              </div>

              {/* In-page Mentor Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-ink-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={mentorSearch}
                  onChange={(e) => setMentorSearch(e.target.value)}
                  placeholder="Filter by name, company..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-cream-50/50 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-forest-800 placeholder-ink-400"
                />
                {mentorSearch && (
                  <button
                    onClick={() => setMentorSearch("")}
                    className="absolute right-2.5 top-2.5 text-ink-400 hover:text-ink-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Empty State when Search Yields Zero */}
            {filteredRankings.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-border text-center">
                <Search className="w-8 h-8 text-ink-400 mx-auto mb-2" />
                <h4 className="font-serif font-bold text-ink-950 text-base">No mentors matched &quot;{mentorSearch}&quot;</h4>
                <p className="text-xs text-ink-600 mt-1">Try clearing your search or adjusting the target company and role filters.</p>
                <button
                  onClick={() => setMentorSearch("")}
                  className="mt-4 px-4 py-2 rounded-xl bg-forest-900 text-white text-xs font-semibold"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              /* Mentor Cards List */
              <div className="space-y-6">
                {filteredRankings.map((res) => {
                  const { mentor, overallScore, dimensions, isBestMatch, rank, positiveHighlights, fitVerdict } = res;
                  return (
                    <div
                      key={mentor.id}
                      className={`bg-white rounded-3xl border transition-all duration-300 p-6 sm:p-7 relative overflow-hidden shadow-sm hover:shadow-md ${
                        isBestMatch
                          ? "border-emerald-600 ring-2 ring-emerald-500/10 shadow-emerald-950/5"
                          : "border-border"
                      }`}
                    >
                      {/* Top Ribbon for #1 Match */}
                      {isBestMatch && (
                        <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-600 to-forest-800 text-white text-[11px] font-bold px-4 py-1 rounded-bl-2xl shadow-sm flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>#1 TOP COMPATIBILITY MATCH</span>
                        </div>
                      )}

                      {/* Mentor Profile Header */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-5">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-forest-800/20 shadow-md flex-shrink-0">
                          <Image
                            src={mentor.recentReviews?.[0]?.avatarUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"}
                            alt={mentor.headline}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-lg sm:text-xl font-serif font-bold text-ink-950">
                              {mentor.headline}
                            </h4>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <ShieldCheck className="w-3 h-3 text-emerald-700" />
                              <span>Verified {mentor.organization}</span>
                            </span>
                          </div>
                          <p className="text-xs text-ink-700 mt-0.5">
                            {mentor.currentRole} at <strong className="text-ink-950">{mentor.organization}</strong> · {mentor.yearsOfExperience}+ YOE · {mentor.location}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-ink-600">
                            <span className="flex items-center gap-1 font-bold text-amber-600">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              {mentor.rating}
                            </span>
                            <span>·</span>
                            <span>{mentor.totalSessions}+ sessions</span>
                            <span>·</span>
                            <span className="text-emerald-700 font-semibold">{mentor.nextAvailableText}</span>
                          </div>
                        </div>

                        {/* Overall Match Score Badge */}
                        <div className="text-right sm:text-right flex-shrink-0 mt-3 sm:mt-0">
                          <div className="inline-flex flex-col items-center bg-forest-900 text-white px-4 py-2 rounded-2xl shadow-sm border border-forest-800">
                            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-300 leading-tight">
                              {overallScore}%
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-100">
                              {fitVerdict}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 7-Dimension Mini Radar Progress Bars */}
                      <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-border/80 mb-5">
                        <div className="flex items-center justify-between mb-3 text-xs font-bold text-ink-800 uppercase tracking-wider">
                          <span>7-Dimensional Score Breakdown</span>
                          <span className="text-forest-700 text-[11px] font-normal normal-case">
                            Computed across 100 quantified factors
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                          {Object.values(dimensions).map((dim) => {
                            const Icon = dimensionIcons[dim.dimensionId] || Sparkles;
                            return (
                              <div key={dim.dimensionId} className="flex flex-col justify-between">
                                <div className="flex items-center justify-between text-[11px] mb-1">
                                  <span className="font-semibold text-ink-700 truncate" title={dim.name}>
                                    {dim.name.split(" ")[0]}
                                  </span>
                                  <span className="font-mono font-bold text-forest-900">{dim.score}%</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-cream-200 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      dim.score >= 90
                                        ? "bg-emerald-600"
                                        : dim.score >= 80
                                        ? "bg-forest-700"
                                        : "bg-amber-600"
                                    }`}
                                    style={{ width: `${dim.score}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Top Evidence-Based Match Drivers */}
                      <div className="mb-5">
                        <h5 className="text-xs font-bold text-ink-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Key Compatibility Drivers</span>
                        </h5>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-ink-800">
                          {positiveHighlights.slice(0, 4).map((high, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 bg-white border border-border/70 p-2.5 rounded-xl shadow-2xs"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                              <span className="leading-snug">{high}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setInspectingEvaluation(res);
                              setModalFactorSearch("");
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cream-100 hover:bg-cream-200 text-ink-800 border border-border transition-all"
                          >
                            <Info className="w-3.5 h-3.5 text-forest-800" />
                            <span>Inspect All 100 Factors</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[11px] text-ink-500 block">From</span>
                            <span className="text-base font-bold font-mono text-ink-950">
                              ₹{mentor.price30MinInr} <span className="text-xs font-normal text-ink-600">/ 30m</span>
                            </span>
                          </div>
                          <Link
                            href={`/mentors/${mentor.id}`}
                            className="px-4 py-2 rounded-xl bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                          >
                            <span>Book Session</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ======================================================== */}
      {/* 100-FACTOR AUDIT MODAL WITH INSTANT SEARCH & METRICS     */}
      {/* ======================================================== */}
      {inspectingEvaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-border overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 bg-forest-950 text-white flex items-center justify-between border-b border-forest-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">
                    100-Factor Compatibility Audit
                  </h3>
                  <p className="text-xs text-emerald-300">
                    Candidate vs {inspectingEvaluation.mentor.headline} ({inspectingEvaluation.overallScore}% Overall Score)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectingEvaluation(null)}
                className="p-2 rounded-xl bg-forest-900 hover:bg-forest-800 text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Dimension Tabs & Search Strip */}
            <div className="border-b border-border bg-cream-50 p-3 space-y-2.5">
              <div className="flex overflow-x-auto gap-1.5 scrollbar-thin">
                {Object.values(inspectingEvaluation.dimensions).map((dim) => {
                  const active = activeModalDimension === dim.dimensionId;
                  const Icon = dimensionIcons[dim.dimensionId] || Sparkles;
                  return (
                    <button
                      key={dim.dimensionId}
                      onClick={() => setActiveModalDimension(dim.dimensionId)}
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
                        {dim.score}%
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* In-Modal Factor Search Bar */}
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-ink-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={modalFactorSearch}
                  onChange={(e) => setModalFactorSearch(e.target.value)}
                  placeholder={`Search factors in ${inspectingEvaluation.dimensions[activeModalDimension]?.name}...`}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-border text-xs focus:outline-none focus:ring-1 focus:ring-forest-800"
                />
                {modalFactorSearch && (
                  <button
                    onClick={() => setModalFactorSearch("")}
                    className="absolute right-2.5 top-2 text-ink-400 hover:text-ink-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Modal Body: Factors List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {filteredModalFactors.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink-500">
                  No factors matched &quot;{modalFactorSearch}&quot; in this dimension.
                </div>
              ) : (
                filteredModalFactors.map((fRes) => {
                  const scorePercent = Math.round(fRes.score * 100);
                  const isHighImpact = fRes.factor.weight >= 0.9;
                  return (
                    <div
                      key={fRes.factor.id}
                      className="p-3.5 rounded-2xl border border-border bg-white hover:bg-cream-50/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200">
                            {fRes.factor.code}
                          </span>
                          <span className="font-bold text-xs sm:text-sm text-ink-950">
                            {fRes.factor.name}
                          </span>
                          {isHighImpact && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              <Flame className="w-2.5 h-2.5" />
                              <span>Core Factor</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-700 mt-1">{fRes.explanation}</p>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                        <div className="text-right">
                          <span className="font-mono font-bold text-xs text-ink-950 block">
                            {scorePercent}%
                          </span>
                          <span className="text-[10px] text-ink-500">Weight: {fRes.factor.weight}</span>
                        </div>
                        <div className="w-16 h-2 rounded-full bg-cream-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              scorePercent >= 90
                                ? "bg-emerald-600"
                                : scorePercent >= 75
                                ? "bg-forest-700"
                                : "bg-amber-600"
                            }`}
                            style={{ width: `${scorePercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-cream-50 border-t border-border flex items-center justify-between">
              <span className="text-xs text-ink-600">
                100 Factors Evaluated · 100% Explainable & Transparent
              </span>
              <button
                onClick={() => setInspectingEvaluation(null)}
                className="px-4 py-2 rounded-xl bg-forest-900 text-white text-xs font-semibold hover:bg-forest-800 transition-all"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SIDE-BY-SIDE MENTOR COMPARISON MODAL                     */}
      {/* ======================================================== */}
      {showCompareModal && rankings.length >= 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-border overflow-hidden">
            <div className="p-5 bg-forest-950 text-white flex items-center justify-between border-b border-forest-800">
              <div className="flex items-center gap-2.5">
                <Scale className="w-5 h-5 text-emerald-400" />
                <h3 className="font-serif text-lg font-bold">Top Mentors Side-by-Side Comparison</h3>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                className="p-1.5 rounded-lg bg-forest-900 hover:bg-forest-800 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Mentors Header Grid */}
              <div className="grid grid-cols-2 gap-4">
                {rankings.slice(0, 2).map((r, i) => (
                  <div key={r.mentor.id} className="p-4 rounded-2xl bg-cream-50 border border-border text-center">
                    <span className="text-[10px] font-bold text-forest-800 uppercase tracking-wider block mb-1">
                      Rank #{i + 1} ({r.overallScore}% Match)
                    </span>
                    <h4 className="font-serif font-bold text-base text-ink-950">{r.mentor.headline}</h4>
                    <p className="text-xs text-ink-600">{r.mentor.currentRole} at {r.mentor.organization}</p>
                    <p className="font-mono font-bold text-forest-900 text-xs mt-1">₹{r.mentor.price30MinInr} / 30m</p>
                  </div>
                ))}
              </div>

              {/* 7 Dimensions Comparative Breakdown */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-ink-900 uppercase tracking-wider">
                  Dimensional Score Comparison
                </h5>
                {Object.values(MATCH_DIMENSIONS).map((dim) => {
                  const s1 = rankings[0].dimensions[dim.id]?.score || 0;
                  const s2 = rankings[1].dimensions[dim.id]?.score || 0;
                  return (
                    <div key={dim.id} className="p-3 rounded-xl bg-white border border-border space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-ink-900">
                        <span>{dim.name}</span>
                        <div className="flex gap-4 font-mono font-bold text-[11px]">
                          <span className="text-emerald-700">{s1}%</span>
                          <span className="text-forest-900">{s2}%</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="w-full h-2 rounded-full bg-cream-200 overflow-hidden">
                          <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${s1}%` }} />
                        </div>
                        <div className="w-full h-2 rounded-full bg-cream-200 overflow-hidden">
                          <div className="h-full bg-forest-800 rounded-full" style={{ width: `${s2}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-cream-50 border-t border-border flex justify-end">
              <button
                onClick={() => setShowCompareModal(false)}
                className="px-4 py-2 rounded-xl bg-forest-900 text-white text-xs font-semibold"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
