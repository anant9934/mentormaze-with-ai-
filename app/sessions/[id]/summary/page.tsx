"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { store } from "@/lib/data/store";
import {
  CheckCircle2,
  Calendar,
  FileText,
  Download,
  ArrowRight,
  Sparkles,
  Plus,
  Bot,
  Award,
  AlertTriangle,
  Code2,
  TrendingUp,
  Brain,
  Share2,
} from "lucide-react";

export default function SessionSummaryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingId = params.id as string;
  const isAIInterviewer = searchParams.get("role") === "ai_interviewer";
  const trackParam = searchParams.get("track") || "sde_backend";
  const difficulty = searchParams.get("diff") || "Medium";

  const booking = store.getBookingById(bookingId) || store.getBookingsForUser("user-student-1")[0];
  const mentor = store.getMentorById(booking?.mentorProfileId || "mentor-priya") || store.getMentors(true)[0];
  const mentorUser = store.getUser(mentor?.userId || "user-mentor-priya");

  const [notes, setNotes] = useState(
    "Mentor feedback: Strong grasp on fundamental algorithms. Recommend deep dive into concurrency control and Redis distributed locking mechanisms."
  );

  const trackTitles: Record<string, string> = {
    sde_backend: "Software Engineering (Backend & DSA)",
    sde_frontend: "Frontend Engineering & UI Systems",
    system_design: "High-Level Distributed System Design",
    behavioral: "Behavioral & Leadership Principles (STAR)",
    data_science: "Data Science & Machine Learning Pipeline",
    product_management: "Product Management & Metric Strategy",
  };

  const currentTrackTitle = trackTitles[trackParam] || "Technical Mock Interview";

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 print:bg-white">
      <div className="print:hidden">
        <Navbar />
      </div>

      <main className="flex-1 max-w-3xl mx-auto px-4 py-10 w-full">
        {/* ======================================================== */}
        {/* VIEW A: TATHASTU AI BAR RAISER MOCK EVALUATION REPORT     */}
        {/* ======================================================== */}
        {isAIInterviewer ? (
          <div className="space-y-6">
            {/* Top Navigation */}
            <div className="flex items-center justify-between print:hidden">
              <Link
                href="/mock-interviews/practice"
                className="text-xs font-semibold text-ink-700 hover:text-violet-700 flex items-center gap-1.5 transition-colors"
              >
                <span>← Back to Practice Arena</span>
              </Link>

              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF Report</span>
              </button>
            </div>

            {/* Executive Card */}
            <div className="card-warm bg-white p-8 rounded-3xl shadow-card border border-border">
              {/* Header Banner */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border">
                {/* Circular Score Dial */}
                <div className="relative w-28 h-28 rounded-full border-4 border-violet-500/20 flex flex-col items-center justify-center bg-violet-50 shadow-inner flex-shrink-0">
                  <span className="font-serif text-3xl font-extrabold text-violet-950 leading-none">
                    8.6
                  </span>
                  <span className="text-[10px] text-violet-700 font-bold mt-1">/ 10</span>
                  <div className="absolute inset-0 rounded-full border-4 border-violet-600 border-t-transparent animate-spin-slow" />
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                    <Bot className="w-3.5 h-3.5 text-violet-700" />
                    <span>Tathastu AI Bar Raiser Evaluation</span>
                  </div>
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-950">
                    FAANG Mock Interview Executive Scorecard
                  </h1>
                  <p className="text-xs text-ink-600 mt-1">
                    Track: <strong className="text-ink-900">{currentTrackTitle}</strong> · Difficulty:{" "}
                    <span className="px-2 py-0.5 rounded-full bg-cream-100 text-ink-800 font-mono text-[10px] font-bold">
                      {difficulty}
                    </span>
                  </p>
                </div>
              </div>

              {/* Hiring Verdict Banner */}
              <div className="my-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-800 block">
                      Bar Raiser Hiring Recommendation
                    </span>
                    <span className="text-sm font-bold text-emerald-950">
                      STRONG HIRE — Senior SDE-2 Equivalent
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 px-3 py-1 rounded-full bg-emerald-100/80">
                  FAANG Bar Met
                </span>
              </div>

              {/* 4 Rubric Dimensions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
                <div className="p-3.5 rounded-2xl bg-cream-50 border border-border text-center">
                  <span className="font-serif text-2xl font-bold text-violet-900 block">8.8</span>
                  <span className="text-xs font-semibold text-ink-800 mt-1 block">Technical</span>
                  <span className="text-[10px] text-ink-500">Asymptotic bounds</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-cream-50 border border-border text-center">
                  <span className="font-serif text-2xl font-bold text-violet-900 block">8.5</span>
                  <span className="text-xs font-semibold text-ink-800 mt-1 block">Problem Solving</span>
                  <span className="text-[10px] text-ink-500">Clarification & edge cases</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-cream-50 border border-border text-center">
                  <span className="font-serif text-2xl font-bold text-violet-900 block">8.6</span>
                  <span className="text-xs font-semibold text-ink-800 mt-1 block">Code Quality</span>
                  <span className="text-[10px] text-ink-500">Modularity & syntax</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-cream-50 border border-border text-center">
                  <span className="font-serif text-2xl font-bold text-violet-900 block">8.5</span>
                  <span className="text-xs font-semibold text-ink-800 mt-1 block">Communication</span>
                  <span className="text-[10px] text-ink-500">Thought articulation</span>
                </div>
              </div>

              {/* Strengths Identified */}
              <div className="my-6">
                <h3 className="font-bold text-xs uppercase tracking-wider text-ink-700 mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Key Strengths Identified</span>
                </h3>
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs text-ink-900">
                    <strong>Optimal Algorithmic Asymptotics:</strong> Correctly selected and implemented O(1) get/put operations with constant memory bounds.
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs text-ink-900">
                    <strong>Proactive Constraint Clarification:</strong> Asked relevant questions clarifying capacity limits and eviction triggers up-front.
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs text-ink-900">
                    <strong>Clean Modular Architecture:</strong> Separation of concern between node mapping and doubly linked list node updates.
                  </div>
                </div>
              </div>

              {/* Targeted Growth Areas */}
              <div className="my-6">
                <h3 className="font-bold text-xs uppercase tracking-wider text-amber-800 mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Targeted Areas for Improvement</span>
                </h3>
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-ink-900">
                    <strong>Concurrency Control & Lock Striping:</strong> Prepare to defend how the data structure functions under multi-threaded contention (e.g. read-write locks or concurrent segmentation).
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-ink-900">
                    <strong>Boundary Input Validation:</strong> Incorporate explicit safeguards for non-positive capacities or malformed keys.
                  </div>
                </div>
              </div>

              {/* Recommended 1-on-1 Mentor Follow-Up */}
              <div className="p-5 rounded-2xl bg-cream-100/60 border border-border my-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-bold text-xs text-ink-950 block">
                      Recommended Human Mentor to Bridge Gaps
                    </span>
                    <span className="text-[11px] text-ink-600">
                      Practice concurrency and distributed cache architecture with a verified tech lead
                    </span>
                  </div>
                  <Link
                    href={`/mentors/${mentor.id}`}
                    className="px-3 py-1.5 rounded-xl bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    Book with Priya Sharma
                  </Link>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-forest-700/20">
                    <Image
                      src={mentorUser?.avatarUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"}
                      alt={mentor.headline}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-ink-950">{mentor.headline}</h5>
                    <p className="text-[11px] text-forest-700">{mentor.organization} · {mentor.rating} ★ ({mentor.totalSessions} sessions)</p>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
                <Link
                  href="/mock-interviews/practice"
                  className="btn-secondary text-xs w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Practice Another Track</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="btn-primary text-xs w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <span>Return to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* VIEW B: HUMAN MENTORSHIP SESSION SUMMARY                 */
          /* ======================================================== */
          <div className="card-warm bg-white p-8 rounded-3xl shadow-card">
            <div className="flex items-center gap-3 pb-6 border-b border-border">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold text-ink-950">
                  Session Summary & Next Steps
                </h1>
                <p className="text-xs text-ink-700">
                  Mentorship with {mentor.headline} completed on Tue, Feb 11.
                </p>
              </div>
            </div>

            <div className="my-6 space-y-6">
              {/* Highlights */}
              <div className="p-5 rounded-2xl bg-cream-50 border border-border">
                <h3 className="font-bold text-xs uppercase tracking-wider text-ink-700 mb-3">
                  Session Highlights & Covered Topics
                </h3>
                <ul className="space-y-2 text-xs text-ink-950">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Discussed career path and hiring bar in tier-1 product companies.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Reviewed distributed KV store project code and architectural bottlenecks.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Established weekly practice schedule for dynamic programming.</span>
                  </li>
                </ul>
              </div>

              {/* Mentor Notes */}
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-ink-700 mb-2">
                  Mentor Visible Notes & Advice
                </h3>
                <div className="p-4 rounded-2xl bg-sage-50 border border-sage-200 text-xs text-forest-900 leading-relaxed">
                  {notes}
                </div>
              </div>

              {/* Action Items Created */}
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-ink-700 mb-3">
                  Assigned Action Items for Student
                </h3>
                <div className="space-y-2">
                  <div className="p-3.5 rounded-xl bg-white border border-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-ink-950">
                        Share updated resume highlighting system design project
                      </span>
                    </div>
                    <span className="text-[10px] text-ink-500">Due Nov 15</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-ink-950">
                        Solve 10 LeetCode Medium dynamic programming problems
                      </span>
                    </div>
                    <span className="text-[10px] text-ink-500">Due Nov 20</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={handlePrint}
                className="btn-secondary text-xs w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF Summary</span>
              </button>
              <Link
                href="/dashboard"
                className="btn-primary text-xs w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <span>Return to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}

