"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
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
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function MentorProfileDetailPage() {
  const params = useParams();
  const mentorId = params?.id as string;

  const [mentor, setMentor] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"about" | "experience" | "reviews" | "faqs">("about");
  const [isFavorited, setIsFavorited] = useState(false);

  const focusAreaIcons: Record<string, any> = {
    "Career Guidance": Compass,
    "Interview Prep": Code2,
    "Project Review": FolderGit2,
    "Skill Development": TrendingUp,
  };

  useEffect(() => {
    let isMounted = true;
    async function loadMentor() {
      if (!mentorId) return;
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`/api/mentors/${encodeURIComponent(mentorId)}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Mentor profile not found or is currently not approved.");
          }
          throw new Error(`Failed to load mentor profile (HTTP ${res.status})`);
        }
        const data = await res.json();
        if (isMounted) {
          if (data.success && data.mentor) {
            setMentor(data.mentor);
          } else {
            throw new Error(data.error || "Mentor profile not found");
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Error fetching mentor profile:", err);
          setError(err.message || "Failed to load mentor profile.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadMentor();
    return () => {
      isMounted = false;
    };
  }, [mentorId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-cream-50">
        <Navbar />
        <main className="flex-1 max-w-5xl mx-auto px-4 py-16 w-full flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-forest-800 animate-spin mb-4" />
          <p className="text-xs text-ink-600 font-medium">Loading verified mentor profile...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div className="min-h-screen flex flex-col bg-cream-50">
        <Navbar />
        <main className="flex-1 max-w-xl mx-auto px-4 py-20 w-full text-center">
          <div className="card-warm bg-white p-8 rounded-3xl shadow-card">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 mx-auto flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-ink-950 mb-2">Mentor Not Found</h1>
            <p className="text-xs text-ink-600 mb-6 leading-relaxed">
              {error || "The mentor profile you requested does not exist or has not been verified yet."}
            </p>
            <Link href="/mentors" className="btn-primary text-xs py-2.5 px-6 inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Mentors Directory</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const mentorName = mentor.name || mentor.displayName || "Verified Mentor";
  const avatarSrc = mentor.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80";

  const reviews = Array.isArray(mentor.recentReviews) ? mentor.recentReviews : [];

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
        <div className="card-warm bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-card mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
            {/* Mentor Photo */}
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden bg-cream-100 flex-shrink-0 shadow-sm">
              <Image
                src={avatarSrc}
                alt={mentor.headline || mentorName}
                fill
                className="object-cover"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1 w-full text-center md:text-left">
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="badge-match text-xs font-semibold">
                  <Sparkles className="w-3 h-3 text-emerald-700" />
                  <span>Verified Mentor</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFavorited(!isFavorited)}
                    className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full border border-border hover:bg-cream-100 text-ink-700 transition-colors"
                    aria-label="Save"
                  >
                    <Heart className={`w-4 h-4 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
                  </button>
                  <button
                    onClick={() => {
                      if (typeof navigator !== "undefined" && navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                        alert("Profile link copied to clipboard!");
                      }
                    }}
                    className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full border border-border hover:bg-cream-100 text-ink-700 transition-colors"
                    aria-label="Share"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-2 mb-1 flex-wrap">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-950">
                  {mentorName}
                </h1>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                {mentor.userId?.startsWith("user-mentor-") && (
                  <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Demonstration Profile
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm font-medium text-ink-700 mb-4">{mentor.headline}</p>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6 text-xs text-ink-700 pb-4 mb-4 border-b border-border">
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
              <div className="flex flex-wrap justify-center md:justify-start gap-1.5 sm:gap-2">
                {(mentor.skills || []).map((s: string) => (
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
          <div className="mt-6 sm:mt-8 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-sage-50 border border-sage-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
            <div className="flex items-center gap-2 text-forest-900 font-bold">
              <Sparkles className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              <span>Verified Qualifications:</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-forest-800 font-medium text-[11px] sm:text-xs">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> Verified {mentor.organization}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> {mentor.yearsOfExperience}+ Yrs Exp
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> {mentor.nextAvailableText || "Available this week"}
              </span>
            </div>
          </div>
        </div>

        {/* Content Tabs (scrollable on mobile) */}
        <div className="flex overflow-x-auto no-scrollbar whitespace-nowrap border-b border-border mb-6 sm:mb-8 text-xs sm:text-sm font-medium">
          {(["about", "experience", "reviews", "faqs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2.5 sm:py-3 px-4 sm:px-6 min-h-[44px] flex-shrink-0 capitalize transition-all border-b-2 ${
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
              <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-line">{mentor.bio}</p>
            </div>

            {/* Focus Areas Bento */}
            <div>
              <h3 className="font-serif text-xl font-bold text-ink-950 mb-4">Focus Areas</h3>
              <div className="grid grid-cols-2 gap-3">
                {(mentor.focusAreas || ["Career Guidance", "Interview Prep", "Project Review"]).map((area: string) => {
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

            {/* Recent Mentees Say */}
            <div>
              <h3 className="font-serif text-xl font-bold text-ink-950 mb-4">Recent Mentees Say</h3>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((rev: any, idx: number) => (
                    <div key={idx} className="card-warm bg-white p-6 rounded-2xl">
                      <p className="text-sm text-ink-700 italic mb-4">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-forest-900 text-white flex items-center justify-center text-xs font-bold">
                            {(rev.studentName || "ST").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-ink-950">{rev.studentName}</h4>
                            <p className="text-[10px] text-ink-500">{rev.studentTitle || "Verified Mentee"}</p>
                          </div>
                        </div>
                        <div className="flex text-amber-400">
                          {[...Array(rev.rating || 5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card-warm bg-white p-6 rounded-2xl text-center border border-dashed border-border py-8">
                  <p className="text-xs text-ink-600 font-medium">No student reviews published yet.</p>
                  <p className="text-[11px] text-ink-500 mt-1">
                    Reviews appear after verified mentees complete sessions with this mentor.
                  </p>
                </div>
              )}
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
                  <span className="font-semibold text-ink-950">
                    {(mentor.sessionModes || ["1:1"]).join(", ")}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <Globe2 className="w-4 h-4 text-forest-800 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-ink-500 block">Languages</span>
                  <span className="font-semibold text-ink-950">
                    {(mentor.languages || ["English"]).join(", ")}
                  </span>
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
        <div className="sticky bottom-4 mt-8 sm:mt-12 p-3 sm:p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-border shadow-elevated flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 z-30">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <div>
              <span className="text-[11px] sm:text-xs text-ink-500 block">Starting from</span>
              <div className="flex items-baseline gap-1">
                <span className="font-serif text-xl sm:text-2xl font-bold text-forest-900">₹{mentor.price30MinInr}</span>
                <span className="text-[11px] text-ink-500">/ 30m</span>
              </div>
            </div>
            <span className="sm:hidden text-[11px] font-semibold text-forest-800 bg-sage-50 px-2 py-0.5 rounded-full border border-sage-200">
              Verified
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={`/dashboard/messages?mentorId=${mentor.id}`}
              className="btn-secondary min-h-[44px] text-xs py-2 px-3 sm:px-4 flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Message</span>
            </Link>
            <Link
              href={`/mentors/${mentor.id}/book`}
              className="btn-primary min-h-[44px] text-xs py-2 px-4 sm:px-6 flex-1 sm:flex-initial flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>Book Session</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
