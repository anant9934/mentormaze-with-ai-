"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CurvedHeroCarousel } from "@/components/landing/curved-hero-carousel";
import {
  User,
  Target,
  BarChart3,
  Video,
  Calendar as CalendarIcon,
  TrendingUp,
  ArrowRight,
  Play,
  ChevronLeft,
  ChevronRight,
  Star,
  Mic,
  PhoneOff,
} from "lucide-react";

export default function HomePage() {
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  // Testimonial Cards
  const testimonials = [
    {
      id: "t1",
      name: "Aman Sharma",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
      quote: "“",
      rating: 5,
    },
    {
      id: "t2",
      name: "Ananya Roy",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      quote: "“",
      rating: 5,
    },
    {
      id: "t3",
      name: "Karan Johar",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      quote: "”",
      rating: 5,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#FBF8F1] text-[#111827] font-sans antialiased selection:bg-[#123B2E] selection:text-white">
      {/* Top Navigation */}
      <Navbar />

      <main className="flex-1">
        {/* ======================================================== */}
        {/* 1. HERO SECTION                                          */}
        {/* ======================================================== */}
        <section className="pt-8 pb-14 sm:pt-14 sm:pb-20 overflow-hidden text-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Top Tagline */}
            <p className="text-xs sm:text-sm font-bold tracking-[0.22em] text-[#164E3A] uppercase mb-4">
              Real People. Real Guidance.
            </p>

            {/* Main Headline */}
            <h1 className="font-sans text-4xl sm:text-6xl lg:text-[4.25rem] font-extrabold tracking-tight text-[#111827] leading-[1.12]">
              Find the Right Mentor.
              <span className="block text-[#123B2E] mt-1 sm:mt-2">Grow Faster.</span>
            </h1>

            {/* Action Buttons */}
            <div className="mt-7 sm:mt-9 flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/mentors"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#123B2E] hover:bg-[#0E2E24] text-white text-sm font-semibold transition-all shadow-sm group"
              >
                <span>Explore Mentors</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white hover:bg-gray-50 border border-gray-300 text-[#1F2937] text-sm font-semibold transition-all shadow-sm"
              >
                <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center">
                  <Play className="w-2 h-2 fill-[#1F2937] text-[#1F2937] ml-0.5" />
                </div>
                <span>Watch Demo</span>
              </Link>
            </div>

            {/* ======================================================== */}
            {/* 3D CONCAVE CYLINDRICAL AUTO-SCROLLING MENTOR CAROUSEL    */}
            {/* ======================================================== */}
            <div className="mt-8 sm:mt-12 w-full">
              <CurvedHeroCarousel />
            </div>

            {/* ======================================================== */}
            {/* VALUE PROPS TRIPLET                                      */}
            {/* ======================================================== */}
            <div className="mt-10 sm:mt-14 max-w-2xl mx-auto flex items-center justify-center gap-6 sm:gap-14 text-center">
              {/* Item 1: Expert Mentors */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <User className="w-6 h-6 text-[#123B2E]" strokeWidth={1.75} />
                <span className="font-bold text-xs sm:text-sm text-[#111827]">
                  Expert Mentors
                </span>
              </div>

              {/* Divider 1 */}
              <div className="h-8 w-px bg-gray-300 flex-shrink-0" />

              {/* Item 2: Smart Match */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <Target className="w-6 h-6 text-[#123B2E]" strokeWidth={1.75} />
                <span className="font-bold text-xs sm:text-sm text-[#111827]">
                  Smart Match
                </span>
              </div>

              {/* Divider 2 */}
              <div className="h-8 w-px bg-gray-300 flex-shrink-0" />

              {/* Item 3: Track Growth */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <BarChart3 className="w-6 h-6 text-[#123B2E]" strokeWidth={1.75} />
                <span className="font-bold text-xs sm:text-sm text-[#111827]">
                  Track Growth
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 2. BENTO GRID FEATURE CARDS                              */}
        {/* ======================================================== */}
        <section className="py-6 sm:py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            {/* ---------------------------------------------------- */}
            {/* CARD 1: LIVE MENTORSHIP (TOP FULL-WIDTH)            */}
            {/* ---------------------------------------------------- */}
            <div className="rounded-[28px] sm:rounded-[36px] overflow-hidden bg-[#0D382B] shadow-sm grid grid-cols-1 md:grid-cols-12 min-h-[300px] sm:min-h-[340px]">
              {/* Left Half: Woman on Laptop during Live Video Call */}
              <div className="md:col-span-7 relative min-h-[260px] md:min-h-full bg-black/10 overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1573497620053-ea5300f94f21?auto=format&fit=crop&w=1200&q=80"
                  alt="Live Mentorship Video Session"
                  fill
                  className="object-cover object-center"
                />

                {/* Simulated WebRTC Call Control Overlay on Laptop */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 shadow-lg">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white">
                    <Mic className="w-3 h-3" />
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white">
                    <Video className="w-3 h-3" />
                  </div>
                  <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white">
                    <PhoneOff className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* Right Half: Live Mentorship Green Banner */}
              <div className="md:col-span-5 p-8 sm:p-12 flex flex-col justify-between relative bg-gradient-to-br from-[#0D382B] to-[#124B3A]">
                <div>
                  {/* Camera Icon */}
                  <Video className="w-8 h-8 text-[#A8D5BA] mb-4" strokeWidth={1.5} />

                  {/* Title */}
                  <h3 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] text-white font-normal leading-tight">
                    Live Mentorship
                  </h3>

                  {/* Subtle underline accent */}
                  <div className="w-14 h-0.5 bg-[#8FBFA5]/50 mt-3" />
                </div>

                {/* Action Arrow Button */}
                <div className="mt-8 flex justify-end">
                  <Link
                    href="/mentors"
                    className="w-11 h-11 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-[#0D382B] shadow-md transition-transform hover:scale-105"
                    aria-label="Book live mentorship"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* CARDS 2 & 3: BOTTOM SPLIT GRID                       */}
            {/* ---------------------------------------------------- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 2: Flexible Schedule */}
              <div className="rounded-[28px] sm:rounded-[36px] bg-[#F5EFE6] p-7 sm:p-9 flex items-center justify-between overflow-hidden shadow-sm min-h-[190px] group">
                <div className="space-y-3 max-w-[55%]">
                  <CalendarIcon className="w-6 h-6 text-[#8B5E3C]" strokeWidth={1.75} />
                  <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#1F2937]">
                    Flexible Schedule
                  </h3>
                </div>

                {/* Standing Desk Calendar Illustration */}
                <div className="relative w-36 h-32 sm:w-44 sm:h-36 flex-shrink-0 flex items-center justify-center">
                  <div className="w-32 h-28 sm:w-36 sm:h-32 rounded-xl bg-white p-3 shadow-md border border-amber-900/10 flex flex-col justify-between rotate-3 transition-transform group-hover:rotate-0">
                    {/* Spiral Ring Top */}
                    <div className="flex justify-between items-center px-1 pb-1 border-b border-gray-200">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-700/60" />
                      ))}
                    </div>
                    {/* Calendar Month & Grid */}
                    <div className="text-center">
                      <span className="text-[9px] font-bold text-red-600 uppercase tracking-widest block">
                        OCTOBER
                      </span>
                      <div className="grid grid-cols-5 gap-1 mt-1 text-[8px] text-gray-500 font-mono">
                        <span>12</span>
                        <span>13</span>
                        <span className="font-bold text-white bg-[#123B2E] rounded-full p-0.5">14</span>
                        <span>15</span>
                        <span>16</span>
                      </div>
                    </div>
                    {/* Desk base shadow */}
                    <div className="h-1 bg-amber-900/20 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Card 3: See Progress */}
              <div className="rounded-[28px] sm:rounded-[36px] bg-[#E5EFE2] p-7 sm:p-9 flex items-center justify-between overflow-hidden shadow-sm min-h-[190px] group">
                <div className="space-y-3 max-w-[55%]">
                  <TrendingUp className="w-6 h-6 text-[#2D6A4F]" strokeWidth={1.75} />
                  <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#1F2937]">
                    See Progress
                  </h3>
                </div>

                {/* 3D Green Bar Chart Blocks with Upward Arrow */}
                <div className="relative w-36 h-32 sm:w-44 sm:h-36 flex-shrink-0 flex items-end justify-center pb-2">
                  <svg
                    width="140"
                    height="100"
                    viewBox="0 0 140 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="overflow-visible"
                  >
                    {/* Bar 1 */}
                    <rect x="15" y="65" width="18" height="25" rx="3" fill="#6EA888" />
                    {/* Bar 2 */}
                    <rect x="42" y="50" width="18" height="40" rx="3" fill="#529972" />
                    {/* Bar 3 */}
                    <rect x="69" y="35" width="18" height="55" rx="3" fill="#3D855E" />
                    {/* Bar 4 */}
                    <rect x="96" y="20" width="18" height="70" rx="3" fill="#2D6A4F" />

                    {/* Surging Upward Green Arrow */}
                    <path
                      d="M10 75C40 65 70 40 120 15"
                      stroke="#4ADE80"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <polygon points="125,12 112,14 118,24" fill="#4ADE80" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 3. "REAL IMPACT." TESTIMONIALS SECTION                   */}
        {/* ======================================================== */}
        <section className="py-14 sm:py-20 text-center">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header with Laurel Branches flanking the title */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-12">
              {/* Left Laurel Branch */}
              <svg
                width="32"
                height="36"
                viewBox="0 0 32 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[#3A7D5C]"
              >
                <path
                  d="M26 32C18 30 12 24 9 14C8 9 9 3 9 2"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
                <path
                  d="M14 6C11 4 7 5 6 7C5 9 8 12 11 11C13 10 14 8 14 6Z"
                  fill="currentColor"
                  opacity="0.85"
                />
                <path
                  d="M18 14C14 13 10 15 10 17C10 20 14 21 16 19C19 17 19 15 18 14Z"
                  fill="currentColor"
                  opacity="0.85"
                />
                <path
                  d="M22 22C18 21 15 24 16 26C17 28 21 28 23 25C24 23 23 22 22 22Z"
                  fill="currentColor"
                  opacity="0.85"
                />
              </svg>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-[2.6rem] font-semibold text-[#111827]">
                Real Impact.
              </h2>

              {/* Right Laurel Branch (Mirrored) */}
              <svg
                width="32"
                height="36"
                viewBox="0 0 32 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[#3A7D5C] scale-x-[-1]"
              >
                <path
                  d="M26 32C18 30 12 24 9 14C8 9 9 3 9 2"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
                <path
                  d="M14 6C11 4 7 5 6 7C5 9 8 12 11 11C13 10 14 8 14 6Z"
                  fill="currentColor"
                  opacity="0.85"
                />
                <path
                  d="M18 14C14 13 10 15 10 17C10 20 14 21 16 19C19 17 19 15 18 14Z"
                  fill="currentColor"
                  opacity="0.85"
                />
                <path
                  d="M22 22C18 21 15 24 16 26C17 28 21 28 23 25C24 23 23 22 22 22Z"
                  fill="currentColor"
                  opacity="0.85"
                />
              </svg>
            </div>

            {/* Carousel Row with Navigation Chevrons */}
            <div className="relative flex items-center justify-center gap-3 sm:gap-6">
              {/* Left Arrow Button */}
              <button
                onClick={() => setTestimonialIndex((prev) => (prev > 0 ? prev - 1 : 2))}
                className="w-10 h-10 rounded-full bg-white hover:bg-gray-50 border border-gray-200 shadow-sm flex items-center justify-center text-gray-700 hover:text-black transition-colors flex-shrink-0"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* 3 Testimonial Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full max-w-4xl">
                {testimonials.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-2xl sm:rounded-3xl bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between text-left min-h-[140px] hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      {/* Avatar */}
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                        <Image
                          src={t.avatar}
                          alt={t.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Large Quotation Mark */}
                      <span className="font-serif text-3xl font-bold text-[#111827] leading-none select-none">
                        {t.quote}
                      </span>
                    </div>

                    {/* 5 Yellow Stars */}
                    <div className="mt-4 flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-3.5 h-3.5 fill-[#EAB308] text-[#EAB308]"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Arrow Button */}
              <button
                onClick={() => setTestimonialIndex((prev) => (prev < 2 ? prev + 1 : 0))}
                className="w-10 h-10 rounded-full bg-white hover:bg-gray-50 border border-gray-200 shadow-sm flex items-center justify-center text-gray-700 hover:text-black transition-colors flex-shrink-0"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 4. "START YOUR JOURNEY." CTA BANNER                      */}
        {/* ======================================================== */}
        <section className="py-6 sm:py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-[28px] sm:rounded-[36px] overflow-hidden bg-[#0A3023] shadow-md grid grid-cols-1 md:grid-cols-12 min-h-[220px] sm:min-h-[260px]">
              {/* Left Half: Green Wavy Banner + Heading + Button */}
              <div className="md:col-span-6 p-8 sm:p-12 flex flex-col justify-center relative bg-gradient-to-r from-[#07241A] via-[#0A3023] to-[#0D382B]">
                {/* Background topographic contour curves */}
                <div className="absolute inset-0 opacity-15 pointer-events-none">
                  <svg width="100%" height="100%" viewBox="0 0 500 250" fill="none">
                    <path
                      d="M-50 180C100 120 250 220 400 150C500 100 600 160 700 120"
                      stroke="#6EE7B7"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M-50 220C120 160 270 260 420 190C520 140 620 200 720 160"
                      stroke="#6EE7B7"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>

                <div className="relative z-10 space-y-6">
                  <h3 className="font-serif italic text-3xl sm:text-4xl lg:text-[2.75rem] text-white font-normal leading-tight">
                    Start Your Journey.
                  </h3>

                  <div>
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-gray-100 text-[#0A3023] text-sm font-semibold transition-all shadow-sm group"
                    >
                      <span>Get Started</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right Half: Hiker sitting on mountain peak watching golden sunrise */}
              <div className="md:col-span-6 relative min-h-[220px] md:min-h-full overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1200&q=80"
                  alt="Hiker watching sunrise on mountain"
                  fill
                  className="object-cover object-center"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Organic Wave Footer */}
      <Footer />
    </div>
  );
}
