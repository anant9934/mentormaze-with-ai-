"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Timer,
  Filter,
  RefreshCw,
  ArrowLeft,
  CalendarPlus,
  Video,
  Download,
  Users,
} from "lucide-react";

export default function AdminCalendarPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeHolds, setActiveHolds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");

  const fetchAdminCalendar = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (serviceTypeFilter !== "all") params.set("serviceType", serviceTypeFilter);

      const res = await fetch(`/api/admin/calendar?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions || []);
        setActiveHolds(data.activeHolds || []);
      }
    } catch (err) {
      console.error("Error fetching admin calendar:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminCalendar();
  }, [statusFilter, serviceTypeFilter]);

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold text-ink-700 hover:text-forest-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Portal</span>
          </Link>

          <span className="text-xs font-semibold text-ink-700">
            MentorMaze Calendar Engine • mentormaze.aitathastu.com
          </span>
        </div>

        {/* Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-100 text-forest-800 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
              <span>Master Calendar Operations</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-ink-950">
              Platform Calendar & Booking Engine
            </h1>
            <p className="text-xs text-ink-700 mt-1">
              Global PostgreSQL scheduling registry, slot concurrency locks, active 10-minute holds, and RFC 5545 calendar feeds.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchAdminCalendar}
            disabled={loading}
            className="btn-secondary text-xs py-2 px-4 flex items-center gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Overview</span>
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl shadow-card border border-border">
            <span className="text-xs text-ink-700 font-medium block">Total Bookings</span>
            <span className="font-serif text-2xl font-bold text-ink-950 mt-1 block">
              {sessions.length}
            </span>
            <span className="text-[11px] text-forest-700 font-semibold mt-1 block">
              Across all mentors
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-card border border-border">
            <span className="text-xs text-ink-700 font-medium block">Active Slot Holds</span>
            <span className="font-serif text-2xl font-bold text-amber-600 mt-1 block">
              {activeHolds.length}
            </span>
            <span className="text-[11px] text-ink-700 mt-1 block">
              In-flight checkout locks
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-card border border-border">
            <span className="text-xs text-ink-700 font-medium block">Confirmed Sessions</span>
            <span className="font-serif text-2xl font-bold text-emerald-600 mt-1 block">
              {sessions.filter((s) => s.status === "confirmed").length}
            </span>
            <span className="text-[11px] text-emerald-700 mt-1 block">
              Ready for video rooms
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-card border border-border">
            <span className="text-xs text-ink-700 font-medium block">Google Cal Connections</span>
            <span className="font-serif text-2xl font-bold text-blue-600 mt-1 block">Active</span>
            <span className="text-[11px] text-blue-700 mt-1 block">
              OAuth token encryption (AES-256)
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-border">
          <div className="flex items-center gap-2 text-xs font-bold text-ink-950">
            <Filter className="w-4 h-4 text-forest-700" />
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-border bg-cream-50 text-xs font-semibold text-ink-950 focus:outline-none focus:ring-1 focus:ring-forest-700"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={serviceTypeFilter}
            onChange={(e) => setServiceTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-border bg-cream-50 text-xs font-semibold text-ink-950 focus:outline-none focus:ring-1 focus:ring-forest-700"
          >
            <option value="all">All Service Types</option>
            <option value="1on1_mentorship">1:1 Mentorship</option>
            <option value="group_mentorship">Group Mentorship</option>
            <option value="mock_interview">Mock Interview</option>
          </select>
        </div>

        {/* In-Flight Active Holds Section */}
        {activeHolds.length > 0 && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-amber-700 animate-spin" />
              <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                Active Temporary Slot Holds (10-Minute Lock Mutex)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {activeHolds.map((h) => (
                <div
                  key={h.id}
                  className="bg-white p-3 rounded-2xl border border-amber-200 text-xs space-y-1 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink-950">Hold #{h.id.slice(0, 8)}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      Active
                    </span>
                  </div>
                  <div className="text-[11px] text-ink-700">
                    Slot: {new Date(h.startTimeUtc).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-ink-500 font-mono">
                    Expires: {new Date(h.expiresAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Platform Sessions Table */}
        <div className="bg-white rounded-3xl shadow-card border border-border overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-ink-950">
              Master Session Registry ({sessions.length})
            </h3>
            <span className="text-xs text-ink-700">
              Deterministic PostgreSQL Source of Truth
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-cream-50 text-[11px] font-bold text-ink-700 uppercase tracking-wider border-b border-border">
                  <th className="p-4">Session & Type</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Mentor Profile</th>
                  <th className="p-4">Time (UTC / Local)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Price</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-ink-700">
                      No sessions found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-cream-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-ink-950">
                          {s.serviceType === "mock_interview" ? "Mock Interview" : "Mentorship"}
                        </div>
                        <div className="text-[10px] text-ink-500 font-mono">ID: {s.id.slice(0, 8)}</div>
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-ink-950">{s.studentName || "Student"}</div>
                        <div className="text-[10px] text-ink-500">{s.studentEmail}</div>
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-ink-950">
                          {s.mentorHeadline || "Approved Mentor"}
                        </div>
                        <div className="text-[10px] text-ink-500">{s.mentorOrganization}</div>
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-ink-950">
                          {new Date(s.startTimeUtc).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-ink-500">
                          Duration: {s.sessionDurationMinutes || 30} mins
                        </div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            s.status === "confirmed"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : s.status === "completed"
                              ? "bg-blue-50 text-blue-800 border border-blue-200"
                              : "bg-rose-50 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>

                      <td className="p-4 font-bold text-ink-950">
                        ₹{s.priceInr || 249}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/api/calendar/bookings/${s.id}/ics`}
                            download={`mentormaze-${s.id}.ics`}
                            className="p-1.5 rounded-lg border border-border text-ink-700 hover:text-forest-900 hover:bg-cream-100"
                            title="Download .ICS Calendar Event"
                          >
                            <CalendarPlus className="w-3.5 h-3.5 text-forest-700" />
                          </a>
                          <Link
                            href={`/sessions/${s.id}/live`}
                            className="p-1.5 rounded-lg bg-forest-900 hover:bg-forest-800 text-white"
                            title="Open Video Room"
                          >
                            <Video className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
