"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MentorCard } from "@/components/mentors/mentor-card";
import { store } from "@/lib/data/store";
import { useAuth } from "@/lib/auth/context";
import {
  Search,
  Filter,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Users,
} from "lucide-react";

export default function MentorsDirectoryPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("All");

  const currentUserId = user?.id || "user-student-1";
  const topMatches = store.getTopRecommendedMentors(currentUserId);
  const allApprovedMentors = store.getMentors(true);

  const filteredMentors = allApprovedMentors.filter((m) => {
    const matchesDomain =
      selectedDomain === "All" || m.primaryDomain.toLowerCase() === selectedDomain.toLowerCase();
    const matchesSearch =
      m.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.primaryDomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDomain && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* TOP RECOMMENDED SECTION (Top Mentors for Your Goals) */}
        <section className="mb-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-100 text-forest-800 text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-forest-700" />
                <span>Recommended for You</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-ink-950">
                Top Mentors for Your Goals
              </h1>
              <p className="text-sm text-ink-700 mt-1">
                Handpicked based on your target role, declared skills, and learning goals.
              </p>
            </div>

            <Link
              href="/match"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-forest-900 hover:bg-forest-800 text-white text-xs sm:text-sm font-semibold shadow-md transition-all self-start sm:self-auto"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Launch 100-Factor AI Matchmaker</span>
            </Link>
          </div>

          {/* Top 3 Cards Grid */}
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

          {/* 3 Values Below Recommended */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10 p-6 rounded-3xl bg-cream-100/70 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-forest-900 shadow-sm">
                <Sparkles className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-ink-950">Personalized Match</h4>
                <p className="text-[11px] text-ink-500">Mentors aligned with your target goals</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-forest-900 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-forest-800" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-ink-950">Verified Experts</h4>
                <p className="text-[11px] text-ink-500">Industry professionals you can trust</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-forest-900 shadow-sm">
                <Calendar className="w-5 h-5 text-forest-800" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-ink-950">Flexible Sessions</h4>
                <p className="text-[11px] text-ink-500">1:1 or group, at your convenience</p>
              </div>
            </div>
          </div>
        </section>

        {/* FULL DIRECTORY & FILTERS */}
        <section>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 pt-8 border-t border-border">
            <div>
              <h2 className="font-serif text-2xl font-bold text-ink-950">
                Explore All Verified Mentors
              </h2>
              <p className="text-xs text-ink-500">
                Showing {filteredMentors.length} active approved mentors
              </p>
            </div>

            {/* Search Input */}
            <div className="w-full md:w-80 relative">
              <Search className="w-4 h-4 text-ink-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search mentors by name, skill, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-full border border-border bg-white text-ink-950 focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>
          </div>

          {/* Domain Filter Pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {["All", "Software Engineering", "Data Science", "Product Management"].map((dom) => (
              <button
                key={dom}
                onClick={() => setSelectedDomain(dom)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedDomain.toLowerCase() === dom.toLowerCase()
                    ? "bg-forest-900 text-white"
                    : "bg-white text-ink-700 border border-border hover:bg-cream-100"
                }`}
              >
                {dom}
              </button>
            ))}
          </div>

          {/* Mentors Grid */}
          {filteredMentors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredMentors.map((m) => (
                <MentorCard key={m.id} mentor={m} />
              ))}
            </div>
          ) : (
            <div className="card-warm bg-white p-12 text-center max-w-md mx-auto">
              <h3 className="font-bold text-sm text-ink-950 mb-1">No mentors found</h3>
              <p className="text-xs text-ink-500 mb-4">
                No mentors match &ldquo;{searchQuery}&rdquo;. Try clearing your search query or broadening filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedDomain("All");
                }}
                className="btn-secondary text-xs"
              >
                Reset Filters
              </button>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

