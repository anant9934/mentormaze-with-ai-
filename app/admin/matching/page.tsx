"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { store } from "@/lib/data/store";
import {
  Sliders,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Save,
  Users,
} from "lucide-react";

export default function MatchingManagementPage() {
  const [weights, setWeights] = useState({
    careerGoalAlignment: 30,
    skillGapAlignment: 25,
    domainExpertise: 20,
    academicRelevance: 10,
    availability: 10,
    studentPreference: 5,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateSettings({
      matchingWeights: {
        careerGoalAlignment: weights.careerGoalAlignment / 100,
        skillGapAlignment: weights.skillGapAlignment / 100,
        domainExpertise: weights.domainExpertise / 100,
        academicRelevance: weights.academicRelevance / 100,
        availability: weights.availability / 100,
        studentPreference: weights.studentPreference / 100,
      },
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        <div className="mb-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold text-ink-700 hover:text-forest-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Dashboard</span>
          </Link>
        </div>

        <div>
          <h1 className="font-serif text-3xl font-bold text-ink-950">
            Matching & Recommendations Management
          </h1>
          <p className="text-xs text-ink-700 mt-1">
            Configure the explainable, deterministic scoring weights that power top-three mentor recommendations.
          </p>
        </div>

        {savedSuccess && (
          <div className="p-3.5 rounded-2xl bg-sage-100 text-forest-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Matching parameters updated and deployed to live algorithm.</span>
          </div>
        )}

        {/* Split Grid: Weights Config (Left) + Live Student Preview (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* PARAMETERS CONFIGURATION (7 COLS) */}
          <div className="md:col-span-7 card-warm bg-white p-6 rounded-3xl shadow-card space-y-5">
            <h3 className="font-bold text-sm text-ink-950 pb-3 border-b border-border flex items-center gap-2">
              <Sliders className="w-4 h-4 text-forest-800" />
              <span>Matching Parameter Weights</span>
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-ink-950 mb-1">
                  <span>Career Goal Alignment</span>
                  <span className="text-forest-900 font-bold">{weights.careerGoalAlignment}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={weights.careerGoalAlignment}
                  onChange={(e) =>
                    setWeights({ ...weights, careerGoalAlignment: parseInt(e.target.value) })
                  }
                  className="w-full accent-forest-900"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-ink-950 mb-1">
                  <span>Skill Gap Alignment</span>
                  <span className="text-forest-900 font-bold">{weights.skillGapAlignment}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={weights.skillGapAlignment}
                  onChange={(e) =>
                    setWeights({ ...weights, skillGapAlignment: parseInt(e.target.value) })
                  }
                  className="w-full accent-forest-900"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-ink-950 mb-1">
                  <span>Domain Expertise</span>
                  <span className="text-forest-900 font-bold">{weights.domainExpertise}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={weights.domainExpertise}
                  onChange={(e) =>
                    setWeights({ ...weights, domainExpertise: parseInt(e.target.value) })
                  }
                  className="w-full accent-forest-900"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-ink-950 mb-1">
                  <span>Academic Relevance</span>
                  <span className="text-forest-900 font-bold">{weights.academicRelevance}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  value={weights.academicRelevance}
                  onChange={(e) =>
                    setWeights({ ...weights, academicRelevance: parseInt(e.target.value) })
                  }
                  className="w-full accent-forest-900"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-ink-950 mb-1">
                  <span>Availability Fit</span>
                  <span className="text-forest-900 font-bold">{weights.availability}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  value={weights.availability}
                  onChange={(e) =>
                    setWeights({ ...weights, availability: parseInt(e.target.value) })
                  }
                  className="w-full accent-forest-900"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-ink-950 mb-1">
                  <span>Student Preference</span>
                  <span className="text-forest-900 font-bold">{weights.studentPreference}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  value={weights.studentPreference}
                  onChange={(e) =>
                    setWeights({ ...weights, studentPreference: parseInt(e.target.value) })
                  }
                  className="w-full accent-forest-900"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <button
                onClick={handleSave}
                className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>

          {/* LIVE MATCHING PREVIEW (5 COLS) */}
          <div className="md:col-span-5 card-warm bg-white p-6 rounded-3xl shadow-card space-y-4">
            <h3 className="font-bold text-sm text-ink-950 pb-3 border-b border-border flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Live Matching Preview</span>
            </h3>

            {/* Test Student Card */}
            <div className="p-3.5 rounded-2xl bg-cream-50 border border-border">
              <span className="text-[10px] uppercase font-bold text-ink-400 block">
                Sample Student
              </span>
              <h4 className="font-bold text-xs text-ink-950 mt-0.5">Anant Kumar</h4>
              <p className="text-[11px] text-ink-500">
                Goal: Software Engineer @ Product Company
              </p>
            </div>

            {/* Top Matches Output */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-bold text-ink-500 uppercase tracking-wider block">
                Calculated Top Recommendations
              </span>

              <div className="p-3 rounded-2xl bg-sage-50 border border-sage-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-forest-900 block">1. Priya Sharma</span>
                  <span className="text-[10px] text-forest-700">Software Engineer @ Microsoft</span>
                </div>
                <span className="badge-match text-xs font-bold">96%</span>
              </div>

              <div className="p-3 rounded-2xl bg-cream-50 border border-border flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-ink-950 block">2. Rohan Mehta</span>
                  <span className="text-[10px] text-ink-500">Data Scientist @ Google</span>
                </div>
                <span className="text-xs font-bold text-ink-700">92%</span>
              </div>

              <div className="p-3 rounded-2xl bg-cream-50 border border-border flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-ink-950 block">3. Aditya Singh</span>
                  <span className="text-[10px] text-ink-500">Product Manager @ Adobe</span>
                </div>
                <span className="text-xs font-bold text-ink-700">89%</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

