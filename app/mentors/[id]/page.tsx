"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { store } from "@/lib/data/store";
import {
  ArrowLeft,
  CheckCircle2,
  Star,
  Users,
  Briefcase,
  Share2,
  Heart,
  Sparkles,
  Compass,
  Code2,
  FolderGit2,
  TrendingUp,
  Clock,
  Globe2,
  Video,
  ArrowRight,
  MessageSquare,
} from "lucide-react";

export default function MentorProfileDetailPage() {
  const params = useParams();
  const mentorId = params.id as string;
  const mentor = store.getMentorById(mentorId) || store.getMentorById("mentor-priya")!;
  const [activeTab, setActiveTab] = useState<"about" | "experience" | "reviews" | "faqs">("about");
  const [isFavorited, setIsFavorited] = useState(false);

  const focusAreaIcons: Record<string, any> = {
    "Career Guidance": Compass,
    "Interview Prep": Code2,
    "Project Review": FolderGit2,
    "Skill Development": TrendingUp,
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/mentors"
            className="inline-flex items-center gap-2 text-xs font-semibold text-ink-700 hover:text-forest-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Mentors</span>
          </Link>
        </div>

        {/* Profile Header Card */}
        <div className="card-warm bg-white p-8 rounded-3xl shadow-card mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            {/* Mentor Photo */}
            <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden bg-cream-100 flex-shrink-0 shadow-sm">
              <Image
                src={
                  mentor.userId === "user-mentor-priya"
                    ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"
                    : mentor.userId === "user-mentor-rohan"
                    ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                    : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
                }
                alt={mentor.headline}
                fill
                className="object-cover"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="badge-match text-xs font-semibold">
                  <Sparkles className="w-3 h-3 text-emerald-700" />
                  <span>Top Match for You</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFavorited(!isFavorited)}
                    className="p-2 rounded-full border border-border hover:bg-cream-100 text-ink-700"
                    aria-label="Save"
                  >
                    <Heart className={`w-4 h-4 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
                  </button>
                  <button
                    onClick={() => alert("Profile link copied to clipboard!")}
                    className="p-2 rounded-full border border-border hover:bg-cream-100 text-ink-700"
                    aria-label="Share"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="font-serif text-3xl font-bold text-ink-950">
                  {mentor.userId === "user-mentor-priya" ? "Priya Sharma" : mentor.userId === "user-mentor-rohan" ? "Rohan Mehta" : "Aditya Singh"}
                </h1>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                {mentor.userId.startsWith("user-mentor-") && (
                  <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Demonstration Profile
                  </span>
                )}
              </div>

              <p className="text-sm font-medium text-ink-700 mb-4">{mentor.headline}</p>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-6 text-xs text-ink-700 pb-4 mb-4 border-b border-border">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-ink-950">{mentor.rating}</span>
                  <span className="text-ink-500">({mentor.totalSessions} sessions)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-forest-700" />
                  <span>{mentor.totalMentees}+ mentees</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-forest-700" />
                  <span>{mentor.yearsOfExperience}+ years experience</span>
                </div>
              </div>

              {/* Skills Tags */}
              <div className="flex flex-wrap gap-2">
                {mentor.skills.map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-cream-100 text-ink-700 border border-border"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Explainable Match Reason Box */}
          <div className="mt-8 p-4 rounded-2xl bg-sage-50 border border-sage-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-forest-900 font-bold">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>Why Recommended for You:</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-forest-800 font-medium">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Matches your career goal
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Relevant tech expertise
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Available this week
              </span>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="flex border-b border-border mb-8 text-sm font-medium">
          {(["about", "experience", "reviews", "faqs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-6 capitalize transition-all border-b-2 ${
                activeTab === tab
                  ? "border-forest-900 text-forest-900 font-bold"
                  : "border-transparent text-ink-500 hover:text-ink-950"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Main Content Grid: Left Details + Right Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {/* About Section */}
            <div>
              <h3 className="font-serif text-xl font-bold text-ink-950 mb-3">About Me</h3>
              <p className="text-sm text-ink-700 leading-relaxed">{mentor.bio}</p>
            </div>

            {/* Focus Areas Bento */}
            <div>
              <h3 className="font-serif text-xl font-bold text-ink-950 mb-4">Focus Areas</h3>
              <div className="grid grid-cols-2 gap-3">
                {mentor.focusAreas.map((area) => {
                  const Icon = focusAreaIcons[area] || Compass;
                  return (
                    <div
                      key={area}
                      className="p-4 rounded-2xl bg-white border border-border flex items-center gap-3 shadow-subtle"
                    >
                      <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center text-forest-900">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-xs text-ink-950">{area}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Mentees Say Carousel */}
            <div>
              <h3 className="font-serif text-xl font-bold text-ink-950 mb-4">Recent Mentees Say</h3>
              <div className="space-y-4">
                {mentor.recentReviews.map((rev, idx) => (
                  <div key={idx} className="card-warm bg-white p-6 rounded-2xl">
                    <p className="text-sm text-ink-700 italic mb-4">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-forest-900 text-white flex items-center justify-center text-xs font-bold">
                          {rev.studentName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-ink-950">{rev.studentName}</h4>
                          <p className="text-[10px] text-ink-500">{rev.studentTitle}</p>
                        </div>
                      </div>
                      <div className="flex text-amber-400">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Quick Info Card */}
          <div className="space-y-6">
            <div className="card-warm bg-white p-6 rounded-3xl space-y-4">
              <h4 className="font-bold text-sm text-ink-950 pb-2 border-b border-border">
                Quick Info
              </h4>

              <div className="flex items-start gap-3 text-xs">
                <Video className="w-4 h-4 text-forest-800 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-ink-500 block">Session Mode</span>
                  <span className="font-semibold text-ink-950">1:1 or Group Guidance</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <Globe2 className="w-4 h-4 text-forest-800 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-ink-500 block">Languages</span>
                  <span className="font-semibold text-ink-950">{mentor.languages.join(", ")}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <Clock className="w-4 h-4 text-forest-800 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-ink-500 block">Average Response Time</span>
                  <span className="font-semibold text-ink-950">{mentor.responseTime}</span>
                </div>
              </div>

              {/* Pricing Overview */}
              <div className="pt-3 border-t border-border">
                <span className="text-[10px] text-ink-500 block mb-2 font-semibold uppercase tracking-wider">
                  Session Pricing
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-ink-700">15 min call</span>
                    <span className="font-bold text-forest-900">₹{mentor.price15MinInr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-700">30 min call</span>
                    <span className="font-bold text-forest-900">₹{mentor.price30MinInr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-700">60 min call</span>
                    <span className="font-bold text-forest-900">₹{mentor.price60MinInr}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Booking Action Bar */}
        <div className="sticky bottom-4 mt-12 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-border shadow-elevated flex items-center justify-between gap-4 z-30">
          <div>
            <span className="text-xs text-ink-500 block">Starting from</span>
            <span className="font-serif text-2xl font-bold text-forest-900">₹{mentor.price30MinInr}</span>
            <span className="text-xs text-ink-500 ml-1">/ 30 min session</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/messages?mentorId=${mentor.id}`}
              className="btn-secondary text-xs py-2.5 px-4 flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Message</span>
            </Link>
            <Link
              href={`/mentors/${mentor.id}/book`}
              className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2 shadow-sm"
            >
              <span>Book a Session</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

