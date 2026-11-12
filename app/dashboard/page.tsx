"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { MentorCard } from "@/components/mentors/mentor-card";
import { store } from "@/lib/data/store";
import { useAuth } from "@/lib/auth/context";
import {
  Users,
  Video,
  ArrowRight,
  TrendingUp,
  Calendar,
  Sparkles,
  ChevronRight,
  Home,
  CheckCircle2,
  Compass,
} from "lucide-react";

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const currentUserId = user?.id || "user-student-1";
  const studentProfile = store.getStudentProfile(currentUserId) || store.getStudentProfile("user-student-1")!;
  const topMatches = store.getTopRecommendedMentors(currentUserId);
  const bookings = store.getBookingsForUser(currentUserId);
  const upcomingBooking = bookings.find((b) => b.status === "confirmed");

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* WELCOME SECTION */}
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink-950">
            Good Afternoon, {user?.displayName ? user.displayName.split(" ")[0] : "Anant"} 👋
          </h1>
          <p className="text-xs text-ink-700 mt-1">
            What would you like to achieve today?
          </p>
        </div>

        {/* TWO PROMINENT HERO CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Get Mentorship */}
          <div className="card-warm bg-white p-6 rounded-3xl border border-border flex flex-col justify-between shadow-card hover:shadow-elevated transition-shadow">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-sage-100 flex items-center justify-center text-forest-900 mb-4">
                <Users className="w-6 h-6 text-forest-800" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-ink-950">Get Mentorship</h2>
              <p className="text-xs text-ink-700 mt-1 leading-relaxed">
                Learn, get targeted guidance, and grow with verified experts for career, skills, and projects.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border">
              <Link
                href="/mentors"
                className="btn-primary text-xs py-2.5 px-5 flex items-center gap-2 w-fit"
              >
                <span>Find a Mentor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Practice Mock Interview */}
          <div className="card-warm bg-white p-6 rounded-3xl border border-border flex flex-col justify-between shadow-card hover:shadow-elevated transition-shadow">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-sage-100 flex items-center justify-center text-forest-900 mb-4">
                <Video className="w-6 h-6 text-forest-800" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-ink-950">Practice Mock Interview</h2>
              <p className="text-xs text-ink-700 mt-1 leading-relaxed">
                Experience real interview rounds (Technical, HR, System Design) with senior interviewers and rubrics.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border">
              <Link
                href="/mock-interviews/practice"
                className="btn-secondary text-xs py-2.5 px-5 flex items-center gap-2 w-fit font-bold"
              >
                <span>Start Practice</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: YOUR GOALS + UPCOMING SESSION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Your Goals */}
          <div className="card-warm bg-white p-6 rounded-3xl border border-border">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <h3 className="font-bold text-sm text-ink-950 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-forest-800" />
                <span>Your Goals</span>
              </h3>
              <Link href="/dashboard/progress" className="text-xs font-semibold text-forest-800 hover:underline">
                View All →
              </Link>
            </div>

            <div className="space-y-4">
              {studentProfile.goals.map((goal) => (
                <div key={goal.id} className="p-3.5 rounded-2xl bg-cream-50 border border-border">
                  <div className="flex items-center justify-between text-xs font-bold text-ink-950 mb-1.5">
                    <span>{goal.title}</span>
                    <span className="text-forest-900">{goal.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-sand-200 rounded-full h-2 overflow-hidden mb-2">
                    <div
                      className="bg-forest-900 h-2 rounded-full transition-all"
                      style={{ width: `${goal.progressPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-ink-500 line-clamp-1">{goal.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Upcoming Session */}
          <div className="card-warm bg-white p-6 rounded-3xl border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                <h3 className="font-bold text-sm text-ink-950 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-forest-800" />
                  <span>Upcoming Session</span>
                </h3>
                <Link href="/dashboard/sessions" className="text-xs font-semibold text-forest-800 hover:underline">
                  My Calendar →
                </Link>
              </div>

              {upcomingBooking ? (
                <Link
                  href={`/sessions/${upcomingBooking.id}/confirmation`}
                  className="p-4 rounded-2xl bg-cream-50 border border-border flex items-center justify-between group hover:bg-cream-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-cream-200 flex-shrink-0">
                      <Image
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80"
                        alt="Mentor"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-ink-950 group-hover:text-forest-900">
                        Mentorship with Priya Sharma
                      </h4>
                      <p className="text-[11px] text-ink-500">Tue, Feb 11 · 7:30 PM (IST)</p>
                      <span className="badge-match text-[9px] mt-1 inline-block">1:1 Session Confirmed</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <div className="p-6 text-center text-xs text-ink-500">
                  No upcoming sessions booked. Explore mentors to schedule your next call.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <Link
                href="/sessions/booking-1/live"
                className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Launch Test Live Room</span>
              </Link>
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
                Calculated using your declared goal ({studentProfile.targetRole}) and skills.
              </p>
            </div>
            <Link href="/mentors" className="text-xs font-bold text-forest-800 hover:underline">
              View All Mentors →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topMatches.map((item) => (
              <MentorCard
                key={item.mentor.id}
                mentor={item.mentor}
                matchScore={item.matchScore}
                matchReasons={item.reasons}
                isBestMatch={item.isBestMatch}
              />
            ))}
          </div>
        </div>

        {/* BOTTOM USER JOURNEY DIAGRAM PILL (Matching Mockup) */}
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
              <span className="text-[10px] text-ink-500">Dashboard</span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-border">
              <span className="font-bold text-forest-900 block">2. Choose Path</span>
              <span className="text-[10px] text-ink-500">Mentor / Mock</span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-border">
              <span className="font-bold text-forest-900 block">3. Match</span>
              <span className="text-[10px] text-ink-500">Top 3 Fit</span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-border">
              <span className="font-bold text-forest-900 block">4. Book</span>
              <span className="text-[10px] text-ink-500">Schedule</span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-border">
              <span className="font-bold text-forest-900 block">5. Attend Live</span>
              <span className="text-[10px] text-ink-500">WebRTC Call</span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-border">
              <span className="font-bold text-forest-900 block">6. Progress</span>
              <span className="text-[10px] text-ink-500">Rubrics & Growth</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

