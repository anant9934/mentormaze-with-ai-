"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { store } from "@/lib/data/store";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Award,
  Download,
  Share2,
  TrendingUp,
  Brain,
  Code2,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export default function MockInterviewReportPage() {
  const params = useParams();
  const bookingId = params.id as string;
  const report = store.getMockReportByBookingId(bookingId) || store.getMockReportByBookingId("booking-2")!;
  const [activeTab, setActiveTab] = useState<"detailed" | "strengths" | "improve" | "next">("detailed");

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard/mentorship?tab=sessions"
            className="inline-flex items-center gap-2 text-xs font-semibold text-ink-700 hover:text-forest-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sessions</span>
          </Link>

          <button
            onClick={() => alert("Report exported as PDF.")}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Report</span>
          </button>
        </div>

        {/* PRIMARY REPORT CARD */}
        <div className="card-warm bg-white p-8 rounded-3xl shadow-card mb-8">
          {/* Header Score Overview */}
          <div className="flex flex-col sm:flex-row items-center gap-8 pb-8 border-b border-border text-center sm:text-left">
            {/* Circular Overall Score Widget */}
            <div className="relative w-32 h-32 rounded-full border-4 border-emerald-500/20 flex flex-col items-center justify-center bg-cream-50 shadow-inner flex-shrink-0">
              <span className="font-serif text-4xl font-extrabold text-forest-900 leading-none">
                {report.overallScore}
              </span>
              <span className="text-xs text-ink-500 font-bold mt-1">/ 10</span>
              <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin-slow"></div>
            </div>

            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-100 text-forest-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                <Award className="w-3.5 h-3.5 text-forest-700" />
                <span>Verified Interview Evaluation</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-950">
                Overall Performance: Good Job!
              </h1>
              <p className="text-xs text-ink-700 mt-1 max-w-xl leading-relaxed">
                You have demonstrated a solid understanding of core algorithmic concepts and communication structure. Target key optimization patterns for top tier performance.
              </p>
            </div>
          </div>

          {/* 4 Dimension Score Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-8">
            <div className="p-4 rounded-2xl bg-cream-50 border border-border text-center">
              <span className="font-serif text-2xl font-bold text-forest-900 block">
                {report.scoreTechnical}
              </span>
              <span className="text-xs font-semibold text-ink-700 mt-1 block">Technical</span>
              <span className="text-[10px] text-ink-500">Algorithm depth</span>
            </div>

            <div className="p-4 rounded-2xl bg-cream-50 border border-border text-center">
              <span className="font-serif text-2xl font-bold text-forest-900 block">
                {report.scoreProblemSolving}
              </span>
              <span className="text-xs font-semibold text-ink-700 mt-1 block">Problem Solving</span>
              <span className="text-[10px] text-ink-500">Edge cases & logic</span>
            </div>

            <div className="p-4 rounded-2xl bg-cream-50 border border-border text-center">
              <span className="font-serif text-2xl font-bold text-forest-900 block">
                {report.scoreCommunication}
              </span>
              <span className="text-xs font-semibold text-ink-700 mt-1 block">Communication</span>
              <span className="text-[10px] text-ink-500">Clarity & phrasing</span>
            </div>

            <div className="p-4 rounded-2xl bg-cream-50 border border-border text-center">
              <span className="font-serif text-2xl font-bold text-forest-900 block">
                {report.scoreConfidence}
              </span>
              <span className="text-xs font-semibold text-ink-700 mt-1 block">Confidence</span>
              <span className="text-[10px] text-ink-500">Pacing & composure</span>
            </div>
          </div>

          {/* Feedback Tabs */}
          <div className="flex border-b border-border mb-6 text-xs font-bold">
            {(
              [
                { id: "detailed", label: "Detailed Feedback" },
                { id: "strengths", label: "Strengths" },
                { id: "improve", label: "Areas to Improve" },
                { id: "next", label: "Next Steps" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 transition-all border-b-2 ${
                  activeTab === tab.id
                    ? "border-forest-900 text-forest-900 font-bold"
                    : "border-transparent text-ink-500 hover:text-ink-950"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB CONTENT */}
          <div className="space-y-4">
            {activeTab === "detailed" && (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-cream-50 border border-border text-xs text-ink-950 leading-relaxed">
                  <p className="font-medium">{report.detailedFeedback}</p>
                </div>

                <div className="space-y-2 pt-2">
                  {report.strengths.map((s, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5 text-xs text-forest-950"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </div>
                  ))}
                  {report.areasToImprove.map((item, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-950"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "strengths" && (
              <div className="space-y-2">
                {report.strengths.map((s, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-sage-50 border border-sage-200 flex items-start gap-3 text-xs text-forest-950"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="font-medium">{s}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "improve" && (
              <div className="space-y-2">
                {report.areasToImprove.map((item, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-950"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "next" && (
              <div className="p-6 rounded-2xl bg-cream-50 border border-border space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-sm text-ink-950 mb-1">Recommended Action Plan</h4>
                  <p className="text-ink-700 leading-relaxed">{report.recommendedNextSteps}</p>
                </div>
                <div className="pt-3 border-t border-border flex gap-3">
                  <Link href="/mentors" className="btn-primary text-xs py-2 px-4">
                    Book System Design Follow-Up
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

