"use client";

import React from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Award, ArrowRight, Video, CheckCircle2, Star } from "lucide-react";

export default function StudentMockInterviewsDashboard() {
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-ink-950">
              Mock Interview Practice
            </h1>
            <p className="text-xs text-ink-700 mt-1">
              Simulate high-stakes coding, system design, and HR rounds with verified tech leads.
            </p>
          </div>
          <Link
            href="/mock-interviews/practice"
            className="btn-primary text-xs py-2.5 px-5 flex items-center gap-2"
          >
            <span>Start Practice Round</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Recent Evaluation Report Spotlight Card */}
        <div className="card-warm bg-white p-6 rounded-3xl border border-border shadow-card">
          <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
            <span className="badge-match text-xs font-semibold">Latest Evaluation Report</span>
            <span className="text-xs text-ink-500">Evaluated on Nov 12, 2026</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-sage-100 flex flex-col items-center justify-center text-forest-900 flex-shrink-0">
                <span className="font-serif text-2xl font-bold leading-none">8.2</span>
                <span className="text-[10px] text-ink-500 font-bold">/ 10</span>
              </div>
              <div>
                <h3 className="font-bold text-base text-ink-950">
                  Technical Mock Interview — SDE Round
                </h3>
                <p className="text-xs text-ink-500">
                  Interviewer: Rohan Mehta (Data Scientist @ Google)
                </p>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-forest-800">
                  <span className="bg-sage-100 px-2 py-0.5 rounded font-semibold">Technical: 8.5</span>
                  <span className="bg-sage-100 px-2 py-0.5 rounded font-semibold">Problem Solving: 7.8</span>
                  <span className="bg-sage-100 px-2 py-0.5 rounded font-semibold">Communication: 8.0</span>
                </div>
              </div>
            </div>

            <Link
              href="/mock-interviews/booking-2/report"
              className="btn-secondary text-xs py-2 px-5 font-bold"
            >
              View Full Report →
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
