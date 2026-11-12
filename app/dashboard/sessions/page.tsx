"use client";

import React, { useState, useEffect } from "react";
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
  Download,
  CalendarPlus,
  ShieldCheck,
} from "lucide-react";

export default function MySessionsPage() {
  const { user } = useAuth();
  const currentUserId = user?.id || "user-student-1";
  const [filter, setFilter] = useState<"all" | "mentorship" | "mock">("all");

  const [sessions, setSessions] = useState([
    {
      id: "booking-1",
      title: "Mentorship – Priya Sharma",
      subtitle: "Career Guidance & Systems Design",
      date: "Feb 11, 7:30 PM IST",
      status: "Upcoming",
      type: "mentorship",
      actionUrl: "/sessions/booking-1/live",
      actionLabel: "Join Video",
    },
    {
      id: "booking-2",
      title: "Mock Interview – SDE Technical",
      subtitle: "Data Structures & Algorithms",
      date: "Feb 13, 6:00 PM IST",
      status: "Upcoming",
      type: "mock",
      actionUrl: "/sessions/booking-2/live",
      actionLabel: "Join Interview",
    },
    {
      id: "booking-past-1",
      title: "Mock Interview – HR & Behavioral",
      subtitle: "HR Round Simulation",
      date: "Feb 08, 5:00 PM IST",
      status: "Completed",
      type: "mock",
      actionUrl: "/mock-interviews/booking-2/report",
      actionLabel: "View Report",
    },
    {
      id: "booking-past-2",
      title: "Mentorship – Rohan Mehta",
      subtitle: "Project Review: ML Pipeline",
      date: "Feb 05, 7:00 PM IST",
      status: "Completed",
      type: "mentorship",
      actionUrl: "/sessions/booking-1/summary",
      actionLabel: "View Summary",
    },
  ]);

  // Load any dynamically added bookings from store
  useEffect(() => {
    try {
      const allStoreBookings = store.getBookingsForUser(currentUserId);
      if (allStoreBookings && allStoreBookings.length > 0) {
        const dynamicSessions = allStoreBookings.map((b) => {
          const mentor = store.getMentorById(b.mentorProfileId);
          const isMock = b.serviceType === "mock_interview";
          const start = new Date(b.startTimeUtc);
          const formattedDate = new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            timeZone: b.userTimezone || "Asia/Kolkata",
          }).format(start);

          return {
            id: b.id,
            title: `${isMock ? "Mock Interview" : "Mentorship"} – ${mentor?.headline?.split(" ")[0] || "Mentor"}`,
            subtitle: b.studentDiscussionPoints?.slice(0, 45) || "1:1 Strategy & Guidance",
            date: `${formattedDate} (${b.userTimezone || "IST"})`,
            status: b.status === "confirmed" ? "Upcoming" : b.status === "completed" ? "Completed" : "Cancelled",
            type: isMock ? "mock" : "mentorship",
            actionUrl: `/sessions/${b.id}/live`,
            actionLabel: "Join Video",
          };
        });

        // Merge with initial sessions without duplicating IDs
        const existingIds = new Set(dynamicSessions.map((s) => s.id));
        const filteredOld = sessions.filter((s) => !existingIds.has(s.id));
        setSessions([...dynamicSessions, ...filteredOld]);
      }
    } catch {
      // Fallback to initial sessions
    }
  }, [currentUserId]);

  const filteredSessions = sessions.filter((s) => {
    if (filter === "mentorship") return s.type === "mentorship";
    if (filter === "mock") return s.type === "mock";
    return true;
  });

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-ink-950">My Sessions & Calendar</h1>
            <p className="text-xs text-ink-700 mt-1">
              Manage your upcoming mentorship calls, sync with Google/Apple/Outlook (.ICS), and review feedback.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>PostgreSQL Master Schedule</span>
            </span>
          </div>
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
            Mentorship ({sessions.filter((s) => s.type === "mentorship").length})
          </button>
          <button
            onClick={() => setFilter("mock")}
            className={`py-2 px-4 rounded-full transition-all ${
              filter === "mock" ? "bg-forest-900 text-white" : "bg-white text-ink-700 border border-border"
            }`}
          >
            Mock Interviews ({sessions.filter((s) => s.type === "mock").length})
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

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
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

                {/* Add to Calendar (.ICS) Download Button */}
                <a
                  href={`/api/calendar/bookings/${s.id}/ics`}
                  download={`mentormaze-${s.id}.ics`}
                  title="Add to Google / Apple / Outlook Calendar (.ICS)"
                  className="p-2.5 rounded-xl border border-border text-ink-700 hover:text-forest-900 hover:bg-cream-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                >
                  <CalendarPlus className="w-4 h-4 text-forest-700" />
                  <span className="hidden md:inline">.ICS</span>
                </a>

                {/* Primary Action Button */}
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
