"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MentorProfileRecord } from "@/lib/data/mock-data";
import {
  CheckCircle2,
  Star,
  Users,
  Calendar,
  Video,
  Heart,
  ArrowRight,
  Sparkles,
  Crown,
} from "lucide-react";

interface MentorCardProps {
  mentor: any;
  matchScore?: number;
  matchReasons?: string[];
  isBestMatch?: boolean;
}

export function MentorCard({
  mentor,
  matchScore = 92,
  matchReasons = ["Matches your career goals", "Relevant tech expertise"],
  isBestMatch = false,
}: MentorCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  const mentorName = mentor.name || mentor.displayName || (mentor.userId === "user-mentor-priya" ? "Priya Sharma" : mentor.userId === "user-mentor-rohan" ? "Rohan Mehta" : mentor.userId === "user-mentor-aditya" ? "Aditya Singh" : "Verified Mentor");
  const avatarSrc = mentor.avatarUrl || (
    mentor.userId === "user-mentor-priya" || mentor.id?.includes("priya")
      ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"
      : mentor.userId === "user-mentor-rohan" || mentor.id?.includes("rohan")
      ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
      : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
  );

  return (
    <div
      className={`card-warm bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
        isBestMatch
          ? "ring-2 ring-forest-900 border-forest-800 shadow-elevated"
          : "hover:shadow-elevated"
      }`}
    >
      {/* Best Match Crown Badge */}
      {isBestMatch && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-0.5 sm:py-1 rounded-full bg-forest-900 text-white text-[11px] sm:text-xs font-bold flex items-center gap-1.5 shadow-sm z-20">
          <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>Best Match</span>
        </div>
      )}

      <div>
        {/* Mentor Image Container with Match Badge & Heart */}
        <div className="relative aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden bg-cream-100 mb-4 sm:mb-5">
          <Image
            src={avatarSrc}
            alt={mentor.headline || mentorName}
            fill
            className="object-cover"
          />

          {/* Match Score Badge */}
          <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 badge-match bg-white/90 backdrop-blur-sm shadow-sm font-bold text-[11px] sm:text-xs py-0.5 sm:py-1 px-2 sm:px-2.5">
            <Sparkles className="w-3 h-3 text-emerald-700" />
            <span>{matchScore}% Match</span>
          </div>

          {/* Favorite Button */}
          <button
            onClick={() => setIsFavorited(!isFavorited)}
            className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-ink-700 hover:text-red-500 transition-colors shadow-sm focus:outline-none"
            aria-label="Save mentor"
          >
            <Heart
              className={`w-4 h-4 ${
                isFavorited ? "fill-red-500 text-red-500" : "text-ink-700"
              }`}
            />
          </button>
        </div>

        {/* Name & Headline */}
        <div className="mb-3">
          <div className="flex items-center justify-between gap-1.5 font-serif text-lg sm:text-xl font-bold text-ink-950">
            <div className="flex items-center gap-1.5 truncate">
              <span className="truncate">{mentorName}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            </div>
            {mentor.userId?.startsWith("user-mentor-") && (
              <span className="text-[9px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
                Demo
              </span>
            )}
          </div>
          <p className="text-xs text-ink-700 font-medium mt-0.5 line-clamp-2">{mentor.headline}</p>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs text-ink-700 pb-2.5 mb-2.5 sm:pb-3 sm:mb-3 border-b border-border">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-bold text-ink-950">{mentor.rating}</span>
            <span className="text-ink-500">({mentor.totalSessions})</span>
          </div>
          <div className="flex items-center gap-1 text-ink-500">
            <Users className="w-3.5 h-3.5" />
            <span>{mentor.totalMentees}+ mentees</span>
          </div>
        </div>

        {/* Skills Pills */}
        <div className="flex flex-wrap gap-1.5 mb-3.5 sm:mb-4">
          {(mentor.skills || []).slice(0, 3).map((skill: string) => (
            <span
              key={skill}
              className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-cream-100 text-ink-700 border border-border"
            >
              {skill}
            </span>
          ))}
        </div>

        {/* Next Available & Session Mode */}
        <div className="grid grid-cols-2 gap-2 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-cream-50 border border-border text-xs mb-4 sm:mb-5">
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="w-4 h-4 text-forest-800 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-ink-500 block truncate">Next Available</span>
              <span className="font-semibold text-ink-950 text-[11px] block truncate">
                {mentor.nextAvailableText}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <Video className="w-4 h-4 text-forest-800 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-ink-500 block truncate">Session Mode</span>
              <span className="font-semibold text-ink-950 text-[11px] block truncate">1:1, Group</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1 sm:pt-2">
        <Link
          href={`/mentors/${mentor.id}/book`}
          className="btn-primary min-h-[44px] text-xs py-2 px-2 sm:px-3 flex items-center justify-center gap-1 text-center"
        >
          <span>Book</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
        <Link
          href={`/mentors/${mentor.id}`}
          className="btn-secondary min-h-[44px] text-xs py-2 px-2 sm:px-3 flex items-center justify-center text-center"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}

