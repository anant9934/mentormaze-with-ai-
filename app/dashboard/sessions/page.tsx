"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { store } from "@/lib/data/store";
import { useAuth } from "@/lib/auth/context";
import {
  Calendar,
  Video,
  Award,
  ChevronRight,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export default function MySessionsPage() {
  const { user } = useAuth();
  const currentUserId = user?.id || "user-student-1";
  const [filter, setFilter] = useState<"all" | "mentorship" | "mock">("all");

  const sessions = [
    {
      id: "booking-1",
      title: "Mentorship – Priya Sharma",
      subtitle: "Career Guidance & Systems",
      date: "Feb 11, 7:30 PM",
      status: "Upcoming",
      type: "mentorship",
      actionUrl: "/sessions/booking-1/live",
      actionLabel: "Join Video",
    },
    {
      id: "booking-2",
      title: "Mock Interview – SDE Technical",
      subtitle: "Data Structures & Algorithms",
      date: "Feb 13, 6:00 PM",
      status: "Upcoming",
      type: "mock",
      actionUrl: "/sessions/booking-2/live",
      actionLabel: "Join Interview",
    },
    {
      id: "booking-past-1",
      title: "Mock Interview – HR & Behavioral",
      subtitle: "HR Round Simulation",
      date: "Feb 08, 5:00 PM",
      status: "Completed",
      type: "mock",
      actionUrl: "/mock-interviews/booking-2/report",
      actionLabel: "View Report",
    },
    {
      id: "booking-past-2",
      title: "Mentorship – Rohan Mehta",
      subtitle: "Project Review: ML Pipeline",
      date: "Feb 05, 7:00 PM",
      status: "Completed",
      type: "mentorship",
      actionUrl: "/sessions/booking-1/summary",
      actionLabel: "View Summary",
    },
  ];

  const filteredSessions = sessions.filter((s) => {
    if (filter === "mentorship") return s.type === "mentorship";
    if (filter === "mock") return s.type === "mock";
    return true;
  });

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink-950">My Sessions</h1>
          <p className="text-xs text-ink-700 mt-1">
            Manage your upcoming mentorship calls, view calendar times, and inspect past feedback reports.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-border pb-2 gap-4 text-xs font-bold">
          <button
            onClick={() => setFilter("all")}
            className={`py-2 px-4 rounded-full transition-all ${
              filter === "all" ? "bg-forest-900 text-white" : "bg-white text-ink-700 border border-border"
            }`}
          >
            All ({sessions.length})
          </button>
          <button
            onClick={() => setFilter("mentorship")}
            className={`py-2 px-4 rounded-full transition-all ${
              filter === "mentorship" ? "bg-forest-900 text-white" : "bg-white text-ink-700 border border-border"
            }`}
          >
            Mentorship (2)
          </button>
          <button
            onClick={() => setFilter("mock")}
            className={`py-2 px-4 rounded-full transition-all ${
              filter === "mock" ? "bg-forest-900 text-white" : "bg-white text-ink-700 border border-border"
            }`}
          >
            Mock Interviews (2)
          </button>
        </div>

        {/* Sessions List */}
        <div className="space-y-3">
          {filteredSessions.map((s) => (
            <div
              key={s.id}
              className="card-warm bg-white p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-border hover:shadow-card transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    s.type === "mock" ? "bg-sage-100 text-forest-900" : "bg-cream-100 text-forest-900"
                  }`}
                >
                  {s.type === "mock" ? <Award className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-ink-950">{s.title}</h3>
                  <p className="text-xs text-ink-500">{s.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right">
                  <span className="text-xs font-semibold text-ink-950 block">{s.date}</span>
                  <span
                    className={`badge-sage text-[10px] mt-0.5 ${
                      s.status === "Upcoming" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : ""
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                <Link
                  href={s.actionUrl}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                >
                  <span>{s.actionLabel}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
