"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/lib/auth/context";
import {
  Clock,
  Users,
  Video,
  ShieldCheck,
  AlertCircle,
  Loader2,
  LogIn,
  CheckCircle2,
  XCircle,
  Briefcase,
  FileText,
  Share2,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { MentorIntakeDrawer } from "@/components/mentorship/mentor-intake-drawer";

export default function MentorDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [selectedBookingForBriefing, setSelectedBookingForBriefing] = useState<any | null>(null);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);

  const fetchMentorDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/mentor/dashboard", { credentials: "same-origin" });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Please sign in to access your mentor dashboard.");
        }
        if (res.status === 403) {
          throw new Error("NOT_A_MENTOR");
        }
        throw new Error(`Failed to load mentor workspace (HTTP ${res.status})`);
      }
      const data = await res.json();
      if (data.success) {
        setDashboardData(data);
        setRequests(data.bookingRequests || []);
      } else {
        throw new Error(data.error || "Failed to load mentor workspace");
      }
    } catch (err: any) {
      console.error("Mentor dashboard load error:", err);
      setError(err.message || "Failed to load mentor workspace.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }
    fetchMentorDashboard();
  }, [user, authLoading]);

  const handleAcceptRequest = async (id: string) => {
    try {
      const res = await fetch("/api/mentor/dashboard", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", bookingId: id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
        setActionMessage("Session request accepted. Mentee notified via calendar invite.");
        setTimeout(() => setActionMessage(null), 4000);
      } else {
        alert(data.error || "Failed to accept session request");
      }
    } catch (err: any) {
      alert("Error accepting booking request: " + err.message);
    }
  };

  const handleDeclineRequest = async (id: string) => {
    try {
      const res = await fetch("/api/mentor/dashboard", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline", bookingId: id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
        setActionMessage("Session request declined.");
        setTimeout(() => setActionMessage(null), 4000);
      } else {
        alert(data.error || "Failed to decline session request");
      }
    } catch (err: any) {
      alert("Error declining booking request: " + err.message);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-cream-50">
        <Navbar />
        <main className="flex-1 max-w-6xl mx-auto px-4 py-16 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-forest-800 animate-spin mb-4" />
          <p className="text-xs text-ink-600 font-medium">Loading mentor workspace...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-cream-50">
        <Navbar />
        <main className="flex-1 max-w-md mx-auto px-4 py-20 text-center">
          <div className="card-warm bg-white p-8 rounded-3xl shadow-card">
            <div className="w-12 h-12 rounded-full bg-forest-100 text-forest-900 mx-auto flex items-center justify-center mb-4">
              <LogIn className="w-6 h-6" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-ink-950 mb-2">Mentor Access Required</h1>
            <p className="text-xs text-ink-600 mb-6">
              Please log in with your verified mentor account to view upcoming sessions and student booking requests.
            </p>
            <div className="flex flex-col gap-2.5">
              <Link
                href="/api/auth/quick-login?role=mentor"
                className="btn-primary text-xs py-3 px-6 w-full inline-flex items-center justify-center gap-2 shadow-sm font-semibold"
              >
                <span>⚡ 1-Click Sign In as Mentor (Priya)</span>
              </Link>
              <Link
                href="/login?redirect=/mentor/dashboard"
                className="btn-secondary text-xs py-2.5 px-4 w-full inline-flex items-center justify-center gap-2"
              >
                <span>Other Sign In</span>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error === "NOT_A_MENTOR") {
    return (
      <div className="min-h-screen flex flex-col bg-cream-50">
        <Navbar />
        <main className="flex-1 max-w-md mx-auto px-4 py-20 text-center">
          <div className="card-warm bg-white p-8 rounded-3xl shadow-card">
            <div className="w-12 h-12 rounded-full bg-sage-100 text-forest-900 mx-auto flex items-center justify-center mb-4">
              <Briefcase className="w-6 h-6" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-ink-950 mb-2">Become a Mentor</h1>
            <p className="text-xs text-ink-600 mb-6">
              You are currently signed in as a student. To access the Mentor Space, please switch to a verified mentor account or apply.
            </p>
            <div className="flex flex-col gap-2.5">
              <Link
                href="/api/auth/quick-login?role=mentor"
                className="btn-primary text-xs py-3 px-6 w-full inline-flex items-center justify-center gap-2 shadow-sm font-semibold"
              >
                <span>⚡ Switch to Mentor Account (Priya)</span>
              </Link>
              <div className="flex items-center justify-center gap-2 pt-1">
                <Link
                  href="/mentor/apply"
                  className="btn-secondary text-xs py-2 px-3 flex-1 inline-flex items-center justify-center gap-1"
                >
                  <span>Apply to Mentor</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="btn-secondary text-xs py-2 px-3 flex-1 inline-flex items-center justify-center gap-1"
                >
                  <span>Student Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const mentor = dashboardData?.mentor || {};
  const stats = dashboardData?.stats || { upcomingSessions: 0, totalConducted: 0, studentRating: 5.0 };
  const todaySession = dashboardData?.todaySession || null;
  const mentorName = mentor.name || user.displayName || "Mentor";
  const firstName = mentorName.split(" ")[0];
  const pendingCount = requests.length;

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Action / Error Banner */}
        {actionMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}
        {error && error !== "NOT_A_MENTOR" && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Header Greeting */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-sage text-[10px] font-bold">Mentor Space</span>
              <span className="badge-match text-[10px]">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span className="capitalize">{mentor.verificationStatus || "Verified"} Mentor</span>
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-950">
              Good Evening, {firstName} 👋
            </h1>
            <p className="text-xs text-ink-700">
              Here’s your mentor dashboard overview and upcoming student bookings.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Link
              href={mentor.id ? `/mentors/${mentor.id}` : "/mentors"}
              className="btn-secondary min-h-[44px] text-xs py-2 px-3 sm:px-4 flex-1 sm:flex-initial flex items-center justify-center text-center"
            >
              View Public Profile
            </Link>
            <Link
              href="/mentor/availability"
              className="btn-primary min-h-[44px] text-xs py-2 px-3 sm:px-4 flex-1 sm:flex-initial flex items-center justify-center text-center"
            >
              Manage Availability
            </Link>
          </div>
        </div>

        {/* Mentor Sub-Navigation */}
        <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
          <Link
            href="/mentor/dashboard"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-forest-900 text-white"
          >
            Overview
          </Link>
          <Link
            href="/mentor/availability"
            className="px-4 py-2 text-xs font-semibold rounded-xl text-ink-700 hover:text-ink-950 hover:bg-cream-100 transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-forest-800" />
            <span>Availability</span>
          </Link>
          <Link
            href="/messages"
            className="px-4 py-2 text-xs font-semibold rounded-xl text-ink-700 hover:text-ink-950 hover:bg-cream-100 transition-colors flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5 text-forest-800" />
            <span>Messages</span>
          </Link>
          <Link
            href="/mentor/earnings"
            className="px-4 py-2 text-xs font-semibold rounded-xl text-ink-700 hover:text-ink-950 hover:bg-cream-100 transition-colors flex items-center gap-1.5"
          >
            <Briefcase className="w-3.5 h-3.5 text-forest-800" />
            <span>Earnings</span>
          </Link>
          <Link
            href={mentor.id ? `/mentors/${mentor.id}` : "/mentors"}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-ink-700 hover:text-ink-950 hover:bg-cream-100 transition-colors flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-forest-800" />
            <span>Public Profile</span>
          </Link>
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="card-warm bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border text-center">
            <span className="font-serif text-3xl sm:text-4xl font-extrabold text-forest-900 block">
              {stats.upcomingSessions}
            </span>
            <span className="text-xs font-semibold text-ink-700 mt-1 block">Upcoming Sessions</span>
            <span className="text-[10px] text-ink-500">Next 7 days</span>
          </div>

          <div className="card-warm bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border text-center">
            <span className="font-serif text-3xl sm:text-4xl font-extrabold text-forest-900 block">
              {stats.totalConducted}
            </span>
            <span className="text-xs font-semibold text-ink-700 mt-1 block">Total Conducted</span>
            <span className="text-[10px] text-ink-500">100% attendance rate</span>
          </div>

          <div className="card-warm bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border text-center">
            <span className="font-serif text-3xl sm:text-4xl font-extrabold text-forest-900 block">
              ★ {stats.studentRating.toFixed(1)}
            </span>
            <span className="text-xs font-semibold text-ink-700 mt-1 block">Student Rating</span>
            <span className="text-[10px] text-ink-500">Based on verified reviews</span>
          </div>
        </div>

        {/* TODAY'S SESSIONS SPOTLIGHT */}
        <div className="card-warm bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border shadow-card">
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-border mb-3 sm:mb-4">
            <h3 className="font-bold text-sm text-ink-950 flex items-center gap-2">
              <Clock className="w-4 h-4 text-forest-800" />
              <span>Today&apos;s Sessions</span>
            </h3>
            {todaySession && (
              <span className="badge-match text-xs font-semibold">Active Today</span>
            )}
          </div>

          {todaySession ? (
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-cream-50 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-forest-900 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {todaySession.studentAvatarUrl ? (
                    <Image src={todaySession.studentAvatarUrl} alt={todaySession.studentName} fill className="object-cover" />
                  ) : (
                    todaySession.studentName?.slice(0, 2).toUpperCase() || "ST"
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-ink-950">{todaySession.studentName}</h4>
                  <p className="text-xs text-ink-500">{todaySession.discussionPoints || "1:1 Mentorship Session"}</p>
                  <span className="text-[11px] font-semibold text-forest-800 block mt-0.5">
                    {new Date(todaySession.startTimeUtc).toLocaleTimeString("en-IN", {
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                    })} · 1:1 Call ({todaySession.sessionDurationMinutes || 30} mins)
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setSelectedBookingForBriefing(todaySession);
                    setIsBriefingOpen(true);
                  }}
                  className="btn-secondary min-h-[44px] text-xs py-2 px-3 sm:px-4 flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-forest-800" />
                  <span>Student Briefing</span>
                </button>
                <Link
                  href={`/sessions/${todaySession.id}/live`}
                  className="btn-primary min-h-[44px] text-xs py-2 px-5 flex items-center justify-center gap-2"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Join Live Room</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8 text-center text-xs text-ink-500 bg-cream-50 rounded-2xl border border-border">
              No sessions scheduled for today. Check your calendar for upcoming calls this week.
            </div>
          )}
        </div>

        {/* INCOMING SESSION REQUESTS */}
        <div className="card-warm bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border shadow-card">
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-border mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-forest-800" />
              <h3 className="font-bold text-sm text-ink-950">Student Booking Requests</h3>
            </div>
            <span className="badge-sage text-xs font-bold">
              {pendingCount} Pending
            </span>
          </div>

          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-cream-50 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-cream-200 flex-shrink-0">
                    <Image src={req.avatar} alt={req.studentName} fill className="object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-ink-950">{req.studentName}</h4>
                    <p className="text-[11px] text-ink-500">{req.topic}</p>
                    <span className="text-[10px] text-ink-400 block mt-0.5">
                      {req.duration} · {req.time}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setSelectedBookingForBriefing(req);
                      setIsBriefingOpen(true);
                    }}
                    title="Inspect student goals & background before accepting"
                    className="btn-secondary min-h-[44px] text-xs py-2 px-3 flex items-center justify-center gap-1 text-ink-700"
                  >
                    <FileText className="w-3.5 h-3.5 text-forest-800" />
                    <span>Student Briefing</span>
                  </button>
                  <button
                    onClick={() => handleAcceptRequest(req.id)}
                    className="btn-primary min-h-[44px] text-xs py-2 px-4 flex-1 sm:flex-none flex items-center justify-center"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDeclineRequest(req.id)}
                    className="btn-secondary min-h-[44px] text-xs py-2 px-3 flex-1 sm:flex-none flex items-center justify-center text-red-600 border-red-200"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}

            {pendingCount === 0 && (
              <div className="p-6 sm:p-8 text-center text-xs text-ink-500 bg-cream-50 rounded-2xl border border-border">
                No pending requests. All student inquiries have been processed.
              </div>
            )}
          </div>
        </div>

        {/* MENTOR INTAKE & FEEDBACK DRAWER */}
        <MentorIntakeDrawer
          isOpen={isBriefingOpen}
          onClose={() => setIsBriefingOpen(false)}
          bookingId={selectedBookingForBriefing?.id}
          studentName={selectedBookingForBriefing?.studentName}
          mentorUserId={user.id}
        />
      </main>

      <Footer />
    </div>
  );
}
