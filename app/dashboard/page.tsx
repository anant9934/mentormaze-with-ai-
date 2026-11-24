"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { MentorCard } from "@/components/mentors/mentor-card";
import { useAuth } from "@/lib/auth/context";
import {
  Users,
  Video,
  ArrowRight,
  TrendingUp,
  Calendar,
  Sparkles,
  ChevronRight,
  Compass,
  AlertCircle,
  Loader2,
  LogIn,
} from "lucide-react";

export default function StudentDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [dashboardData, setDashboardData] = useState<{
    profile: any;
    goals: any[];
    upcomingBooking: any;
    topMatches: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboard() {
      if (authLoading) return;
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch("/api/student/dashboard", {
          credentials: "same-origin",
        });
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("Please log in to view your student dashboard.");
          }
          throw new Error(`Failed to load student dashboard (HTTP ${res.status})`);
        }
        const data = await res.json();
        if (isMounted) {
          if (data.success) {
            setDashboardData({
              profile: data.profile,
              goals: data.goals || [],
              upcomingBooking: data.upcomingBooking || null,
              topMatches: data.topMatches || [],
            });
          } else {
            throw new Error(data.error || "Failed to load dashboard data");
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Dashboard error:", err);
          setError(err.message || "Failed to load student dashboard.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchDashboard();
    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-8 py-12 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-forest-800 animate-spin mb-4" />
          <p className="text-xs text-ink-600 font-medium">Loading your student dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto my-16 text-center card-warm bg-white p-8 rounded-3xl shadow-card">
          <div className="w-12 h-12 rounded-full bg-forest-100 text-forest-900 mx-auto flex items-center justify-center mb-4">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-ink-950 mb-2">Sign In Required</h1>
          <p className="text-xs text-ink-600 mb-6">
            Please sign in to access your personalized student dashboard, tracked goals, and scheduled mentorship calls.
          </p>
          <Link href="/login?redirect=/dashboard" className="btn-primary text-xs py-2.5 px-6 inline-flex items-center gap-2">
            <span>Sign In to Continue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const displayName = user?.displayName ? user.displayName.split(" ")[0] : "Student";
  const studentProfile = dashboardData?.profile || {};
  const goals = dashboardData?.goals || [];
  const upcomingBooking = dashboardData?.upcomingBooking || null;
  const topMatches = dashboardData?.topMatches || [];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* WELCOME SECTION */}
        <div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-ink-950">
            Good Afternoon, {displayName} 👋
          </h1>
          <p className="text-xs text-ink-700 mt-1">
            Your continuous mentoring ecosystem: ASTRION AI guidance and verified human mentors.
          </p>
        </div>

        {/* 1. CONTINUE ASTRION CONVERSATION & 2. PRIORITY NEXT ACTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Card 1: Continue ASTRION Conversation */}
          <div className="card-warm bg-gradient-to-br from-forest-900 to-[#174B39] text-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-border flex flex-col justify-between shadow-card hover:shadow-elevated transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-800/80 text-emerald-200 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>ASTRION · Unified AI Mentor</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-300">24/7 Available</span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-white">Continue Mentoring</h2>
              <p className="text-xs text-emerald-100/90 mt-1.5 leading-relaxed">
                ASTRION maintains continuous context of your career trajectory, coding capabilities, and active milestones.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-emerald-800/60 flex items-center justify-between">
              <span className="text-[11px] text-emerald-200">Unified Socratic Mentoring</span>
              <Link
                href="/ai-mentor"
                className="px-4 py-2 rounded-xl bg-white text-forest-900 hover:bg-emerald-50 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <span>Talk to ASTRION</span>
                <ArrowRight className="w-3.5 h-3.5 text-forest-900" />
              </Link>
            </div>
          </div>

          {/* Card 2: Priority Next Action */}
          <div className="card-warm bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-border flex flex-col justify-between shadow-card hover:shadow-elevated transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-forest-900 font-bold bg-forest-100 px-2.5 py-0.5 rounded-full">
                  Priority Next Action
                </span>
                <span className="text-[10px] text-ink-500 font-mono">Evidence-Backed</span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink-950">
                {goals[0] ? goals[0].title : "Define Your Primary Goal"}
              </h2>
              <p className="text-xs text-ink-600 mt-1.5 leading-relaxed">
                {goals[0]?.description ||
                  "Set your primary engineering target or prepare a structured Mentorship Intelligence briefing for your upcoming human session."}
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-ink-500">
                {goals[0] ? `Progress: ${goals[0].progressPercentage || 0}%` : "No goal defined yet"}
              </span>
              <Link
                href="/dashboard/mentorship"
                className="btn-primary min-h-[38px] text-xs py-2 px-4 flex items-center gap-1.5 font-bold"
              >
                <span>Open Mentorship Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: YOUR GOALS + UPCOMING SESSION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Left: Current Development Goal & Evidence Summary */}
          <div className="card-warm bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-border mb-3 sm:mb-4">
                <h3 className="font-bold text-sm text-ink-950 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-forest-800" />
                  <span>Current Development Goals</span>
                </h3>
                <Link href="/dashboard/mentorship?tab=goals" className="text-xs font-semibold text-forest-800 hover:underline min-h-[36px] flex items-center">
                  View All →
                </Link>
              </div>

              {goals.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {goals.slice(0, 2).map((goal: any) => (
                    <div key={goal.id} className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-cream-50 border border-border">
                      <div className="flex items-center justify-between text-xs font-bold text-ink-950 mb-1.5">
                        <span>{goal.title}</span>
                        <span className="text-forest-900 font-mono">{goal.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-sand-200 rounded-full h-2 overflow-hidden mb-2">
                        <div
                          className="bg-forest-900 h-2 rounded-full transition-all"
                          style={{ width: `${goal.progressPercentage}%` }}
                        ></div>
                      </div>
                      {goal.description && (
                        <p className="text-[11px] text-ink-500 line-clamp-1">{goal.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-cream-50 rounded-2xl border border-border">
                  <p className="text-xs text-ink-500 mb-3">No active learning goals tracked yet.</p>
                  <Link href="/dashboard/mentorship?tab=goals" className="btn-secondary text-xs py-2 px-3 inline-flex items-center justify-center">
                    + Add Your First Goal
                  </Link>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-ink-500">
              <span>Synchronized with AI Tathastu student profile</span>
              <Link href="/ai-mentor" className="text-forest-900 font-bold hover:underline">
                Ask ASTRION to Review →
              </Link>
            </div>
          </div>

          {/* Right: Upcoming Session */}
          <div className="card-warm bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-border mb-3 sm:mb-4">
                <h3 className="font-bold text-sm text-ink-950 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-forest-800" />
                  <span>Next Upcoming Mentoring Session</span>
                </h3>
                <Link href="/dashboard/mentorship?tab=sessions" className="text-xs font-semibold text-forest-800 hover:underline min-h-[36px] flex items-center">
                  My Sessions →
                </Link>
              </div>

              {upcomingBooking ? (
                <Link
                  href={`/sessions/${upcomingBooking.id}/confirmation`}
                  className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-cream-50 border border-border flex items-center justify-between group hover:bg-cream-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-cream-200 flex-shrink-0">
                      <Image
                        src={upcomingBooking.mentorAvatarUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80"}
                        alt="Mentor"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-ink-950 group-hover:text-forest-900">
                        {upcomingBooking.mentorName ? `Mentorship with ${upcomingBooking.mentorName}` : "Mentorship Session"}
                      </h4>
                      <p className="text-[11px] text-ink-500">
                        {new Date(upcomingBooking.startTimeUtc).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                      <span className="badge-match text-[9px] mt-1 inline-block capitalize">
                        {upcomingBooking.status} Session
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <div className="p-8 text-center text-xs text-ink-500 bg-cream-50 rounded-2xl border border-border">
                  No upcoming sessions booked. Explore verified mentors to schedule your next 1:1 call.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <Link
                href="/dashboard/mentorship?tab=bridge"
                className="text-[11px] text-forest-900 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Prepare Bridge Summary →</span>
              </Link>
              {upcomingBooking ? (
                <Link
                  href={`/sessions/${upcomingBooking.id}/live`}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Join Live Room</span>
                </Link>
              ) : (
                <Link
                  href="/mentors"
                  className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book a Session</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* RECOMMENDED MENTORS SECTION */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-2xl font-bold text-ink-950">
                Top Matches for Your Goals
              </h3>
              <p className="text-xs text-ink-500">
                Calculated using your declared goal ({studentProfile.targetRole || "Software Engineering"}) and skills.
              </p>
            </div>
            <Link href="/mentors" className="text-xs font-bold text-forest-800 hover:underline">
              View All Mentors →
            </Link>
          </div>

          {topMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topMatches.map((item: any) => (
                <MentorCard
                  key={item.mentor.id}
                  mentor={item.mentor}
                  matchScore={item.matchScore}
                  matchReasons={item.reasons}
                  isBestMatch={item.isBestMatch}
                />
              ))}
            </div>
          ) : (
            <div className="card-warm bg-white p-8 rounded-3xl text-center">
              <p className="text-xs text-ink-500">No mentors available at this moment.</p>
            </div>
          )}
        </div>

        {/* BOTTOM USER JOURNEY DIAGRAM PILL */}
        <div className="p-6 rounded-3xl bg-cream-100 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Compass className="w-5 h-5 text-forest-800" />
            <span className="font-serif text-base font-bold text-ink-950">
              Your Complete Mentorship Journey
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center text-xs">
            <div className="p-3 rounded-2xl bg-white border border-border">
              <span className="font-bold text-forest-900 block">1. Home</span>
              <span className="text-[10px] text-ink-500">Next Action</span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-border">
              <span className="font-bold text-forest-900 block">2. AI Mentor</span>
              <span className="text-[10px] text-ink-500">ASTRION 24/7</span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-border">
              <span className="font-bold text-forest-900 block">3. Human Mentor</span>
              <span className="text-[10px] text-ink-500">Verified Expert</span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-border">
              <span className="font-bold text-forest-900 block">4. Bridge Briefing</span>
              <span className="text-[10px] text-ink-500">Selective Share</span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-border">
              <span className="font-bold text-forest-900 block">5. Live Session</span>
              <span className="text-[10px] text-ink-500">Video & Advice</span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-border">
              <span className="font-bold text-forest-900 block">6. Growth Loop</span>
              <span className="text-[10px] text-ink-500">Return to ASTRION</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
