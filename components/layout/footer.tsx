"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import {
  ArrowRight,
  MessageSquare,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  Github,
  Mail,
  Globe,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

export function Footer() {
  // Newsletter Form State
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Language Selector State
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("English");

  const languages = [
    { code: "en", name: "English" },
    { code: "hi", name: "हिन्दी (Hindi)" },
    { code: "bn", name: "বাংলা (Bengali)" },
    { code: "te", name: "తెలుగు (Telugu)" },
    { code: "ta", name: "தமிழ் (Tamil)" },
  ];

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setStatus("error");
      setFeedbackMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setFeedbackMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setFeedbackMessage("Thank you for subscribing! Check your inbox soon.");
        setEmail("");
      } else {
        setStatus("error");
        setFeedbackMessage(data.error || "Unable to subscribe. Please try again.");
      }
    } catch {
      setStatus("error");
      setFeedbackMessage("Network error. Please check your connection.");
    }
  };

  return (
    <footer id="contact" className="w-full relative bg-[#FBF8F1] pt-12 sm:pt-16">
      {/* ======================================================== */}
      {/* 1. LARGE OVERLAPPING CREAM CTA PANEL                     */}
      {/* Positioned half above and half over the dark green footer*/}
      {/* ======================================================== */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mb-16 sm:-mb-24 lg:-mb-28">
        <div className="w-full rounded-[28px] sm:rounded-[36px] bg-[#FBF8F2] border border-[#EBE3D5] shadow-[0_12px_40px_rgba(13,56,43,0.08)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[300px] sm:min-h-[330px]">
          {/* Left Column: Heading, Subtitle & Action Buttons */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center text-left">
            {/* Title with yellow celebratory spark marks */}
            <div className="relative inline-block">
              <h3 className="font-serif italic text-3xl sm:text-4xl lg:text-[2.65rem] font-semibold text-[#0D382B] tracking-tight leading-tight">
                Let&apos;s Get Started.
              </h3>
              {/* Three radiant yellow spark marks */}
              <div
                className="absolute -top-1.5 sm:-top-2 left-[285px] sm:left-[340px] lg:left-[360px] pointer-events-none"
                aria-hidden="true"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12L2 12" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M7 6L4.5 3.5" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M12 5L12 2" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Supporting Copy */}
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-700 max-w-md leading-relaxed font-normal">
              Start your mentorship journey with expert guidance, real conversations, and career-focused learning.
            </p>

            {/* CTA Button Group */}
            <div className="mt-6 sm:mt-8 flex items-center gap-3 sm:gap-4 flex-wrap">
              {/* Primary CTA */}
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 rounded-full bg-[#0D382B] hover:bg-[#07241A] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow group active:scale-[0.98]"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>

              {/* Secondary CTA */}
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-full bg-transparent hover:bg-white border border-[#0D382B] text-[#0D382B] text-xs sm:text-sm font-semibold transition-all shadow-xs active:scale-[0.98]"
              >
                <MessageSquare className="w-4 h-4 text-[#0D382B]" />
                <span>Talk to Us</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Original Mentorship-Themed Illustration */}
          <div className="lg:col-span-5 relative min-h-[220px] sm:min-h-[260px] lg:min-h-full flex items-end justify-center lg:justify-end overflow-hidden">
            <svg
              viewBox="0 0 460 300"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full max-h-[300px] object-cover object-bottom select-none"
              aria-label="Illustration of a happy student learning on a laptop with MentorMaze"
            >
              {/* Soft sage rolling hills */}
              <path
                d="M-40 280C80 230 200 240 290 200C370 165 430 180 500 220V300H-40V280Z"
                fill="#94C3A5"
                opacity="0.85"
              />
              <path
                d="M120 280C210 240 320 230 400 170C450 135 500 145 540 180V300H120V280Z"
                fill="#0D382B"
              />

              {/* Playful looping green guidance ribbon */}
              <path
                d="M-20 180C40 160 80 190 120 160C150 140 165 110 145 95C125 80 100 115 130 135C170 160 230 150 280 190"
                stroke="#84B898"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />

              {/* Celebratory yellow sparks near student */}
              <path d="M335 85L330 75" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M345 95L355 90" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M340 108L348 115" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />

              {/* Student Character: Legs & Trousers in Forest Green */}
              <path
                d="M290 170C285 195 280 225 315 240C330 245 350 242 360 230C365 225 350 195 340 180Z"
                fill="#0A3023"
              />
              <path
                d="M310 185C305 210 320 235 345 245C365 250 385 240 395 220C385 200 360 185 345 178Z"
                fill="#0E3D2E"
              />

              {/* White sneakers with sole details */}
              <ellipse cx="305" cy="245" rx="14" ry="9" fill="#FFFFFF" stroke="#1F2937" strokeWidth="1.5" />
              <ellipse cx="328" cy="250" rx="16" ry="10" fill="#FFFFFF" stroke="#1F2937" strokeWidth="1.5" />
              <path d="M320 245C325 247 332 247 337 245" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" />

              {/* Torso & Arms in Warm Cream Sweater */}
              <path
                d="M365 140C350 145 345 160 348 185C360 195 385 195 395 185C400 160 395 145 385 140Z"
                fill="#FFFDF7"
                stroke="#1F2937"
                strokeWidth="1.5"
              />
              {/* Sleeve / Arm typing */}
              <path
                d="M375 145C365 155 355 165 345 168C340 170 335 170 330 168"
                stroke="#1F2937"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />

              {/* Laptop resting on lap */}
              <path
                d="M320 165L355 168L360 140L325 137Z"
                fill="#FFFFFF"
                stroke="#1F2937"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <path
                d="M315 168L358 171"
                stroke="#1F2937"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* MentorMaze Emerald Logo 'M' on the Laptop Back */}
              <path
                d="M338 148L342 153L346 148L350 153L354 148"
                stroke="#10B981"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Head & Face */}
              <circle cx="382" cy="115" r="14" fill="#FCE7D6" stroke="#1F2937" strokeWidth="1.5" />
              {/* Happy Smiling Eye & Smile */}
              <path d="M378 113C379 111 381 111 382 113" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M377 119C380 122 384 122 387 119" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" fill="none" />

              {/* Dark Flowing Hair & Bun */}
              <path
                d="M375 105C385 98 400 102 402 115C405 125 398 135 390 138C385 132 382 125 382 120C375 120 370 115 372 108Z"
                fill="#18181B"
              />
              {/* Cute top bun */}
              <circle cx="400" cy="104" r="8" fill="#18181B" />
            </svg>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. DEEP FOREST GREEN FOOTER CONTAINER                    */}
      {/* ======================================================== */}
      <div className="w-full bg-[#0D382B] text-white rounded-t-[36px] sm:rounded-t-[48px] pt-24 sm:pt-36 lg:pt-40 pb-10 relative z-10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          {/* Main 5-Column Grid matching reference UI */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-[#1C4E3D]">
            {/* Column 1: Brand & Socials (span 4) */}
            <div className="lg:col-span-4 space-y-4">
              <Logo variant="light" />
              <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xs leading-relaxed">
                A mentorship platform to learn, grow, and achieve your goals.
              </p>
              {/* Social Icons matching mockup */}
              <div className="flex items-center gap-2 pt-2">
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg border border-[#1E5241] bg-[#0A3023] hover:bg-[#07241A] flex items-center justify-center text-emerald-200 hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg border border-[#1E5241] bg-[#0A3023] hover:bg-[#07241A] flex items-center justify-center text-emerald-200 hover:text-white transition-colors"
                  aria-label="X"
                >
                  <Twitter className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg border border-[#1E5241] bg-[#0A3023] hover:bg-[#07241A] flex items-center justify-center text-emerald-200 hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg border border-[#1E5241] bg-[#0A3023] hover:bg-[#07241A] flex items-center justify-center text-emerald-200 hover:text-white transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg border border-[#1E5241] bg-[#0A3023] hover:bg-[#07241A] flex items-center justify-center text-emerald-200 hover:text-white transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Column 2: Mentoring (span 2) */}
            <div className="lg:col-span-2">
              <h4 className="text-sm font-semibold text-white mb-3 tracking-wide">Mentorship</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-emerald-100/80">
                <li>
                  <Link href="/mentors" className="hover:text-white transition-colors">
                    Find a Mentor
                  </Link>
                </li>
                <li>
                  <Link href="/ai-mentor" className="hover:text-white transition-colors">
                    ASTRION AI Mentor
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className="hover:text-white transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white transition-colors">
                    Pricing & Plans
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Platform (span 2) */}
            <div className="lg:col-span-2">
              <h4 className="text-sm font-semibold text-white mb-3 tracking-wide">Platform</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-emerald-100/80">
                <li>
                  <Link href="/dashboard/mentorship" className="hover:text-white transition-colors">
                    My Mentorship
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="hover:text-white transition-colors">
                    Help & Support
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Company (span 2) */}
            <div className="lg:col-span-2">
              <h4 className="text-sm font-semibold text-white mb-3 tracking-wide">Company</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-emerald-100/80">
                <li>
                  <Link href="/how-it-works" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/mentor/apply" className="hover:text-white transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/mentor/apply" className="hover:text-white transition-colors">
                    Partner with Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 5: Stay in the Loop (Newsletter) (span 2) */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 text-white font-semibold text-sm mb-1.5">
                <Mail className="w-4 h-4 text-emerald-300" />
                <span>Stay in the Loop</span>
              </div>
              <p className="text-xs text-emerald-100/80 mb-3 leading-relaxed">
                Get updates on mentors, programs, and new features.
              </p>

              {/* Functional Subscription Input */}
              <form onSubmit={handleSubscribe} className="relative flex items-center">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={status === "loading" || status === "success"}
                  className="w-full bg-white rounded-full py-2.5 pl-4 pr-11 text-xs text-[#111827] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm disabled:opacity-80"
                  required
                />
                <button
                  type="submit"
                  disabled={status === "loading" || status === "success"}
                  className="absolute right-1 w-8 h-8 rounded-full bg-[#82BE9F] hover:bg-[#68A987] flex items-center justify-center text-[#0D382B] transition-all disabled:opacity-70 active:scale-95"
                  aria-label="Subscribe"
                >
                  {status === "loading" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </button>
              </form>

              {/* Subscription Feedback Message */}
              {status === "success" && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{feedbackMessage}</span>
                </div>
              )}
              {status === "error" && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-rose-300">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{feedbackMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Legal Navigation Bar */}
          <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-100/70 gap-4">
            <p>© 2026 MentorMaze. All rights reserved.</p>

            <div className="flex flex-wrap items-center gap-3 sm:gap-5">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <span className="text-[#1C4E3D]">|</span>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <span className="text-[#1C4E3D]">|</span>
              <Link href="/privacy#cookies" className="hover:text-white transition-colors">
                Cookie Policy
              </Link>
              <span className="text-[#1C4E3D]">|</span>

              {/* Interactive Language Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center gap-1 text-emerald-100/80 hover:text-white cursor-pointer transition-colors focus:outline-none"
                  aria-expanded={isLangOpen}
                  aria-haspopup="listbox"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{selectedLang}</span>
                  <ChevronDown className="w-3 h-3 transition-transform" />
                </button>

                {/* Language Dropdown Menu */}
                {isLangOpen && (
                  <ul
                    className="absolute bottom-full right-0 mb-2 w-40 rounded-xl bg-[#0A3023] border border-[#1E5241] shadow-xl py-1 text-xs text-emerald-100 z-50 overflow-hidden"
                    role="listbox"
                  >
                    {languages.map((lang) => (
                      <li key={lang.code}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLang(lang.name.split(" ")[0]);
                            setIsLangOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-1.5 hover:bg-[#0E3D2E] transition-colors ${
                            selectedLang === lang.name.split(" ")[0]
                              ? "text-white font-semibold bg-[#0E3D2E]"
                              : "text-emerald-100/80"
                          }`}
                        >
                          {lang.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
