"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
} from "lucide-react";

export default function SessionSummaryPage() {
  const params = useParams();
  const bookingId = params.id as string;
  const booking = store.getBookingById(bookingId) || store.getBookingsForUser("user-student-1")[0];
  const mentor = store.getMentorById(booking?.mentorProfileId || "mentor-priya") || store.getMentors(true)[0];

  const [notes, setNotes] = useState(
    "Mentor feedback: Strong grasp on fundamental algorithms. Recommend deep dive into concurrency control and Redis distributed locking mechanisms."
  );

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full">
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
              onClick={() => alert("Summary exported as PDF.")}
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
      </main>

      <Footer />
    </div>
  );
}
