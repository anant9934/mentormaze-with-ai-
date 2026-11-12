import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FBF8F1] text-[#111827]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#0D382B] hover:text-[#164E3A] mb-8 font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#0D382B] text-white flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-xs uppercase tracking-widest font-bold text-[#164E3A]">
            Legal & Governance
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#111827] tracking-tight mb-4">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: November 2026</p>

        <div className="prose prose-emerald max-w-none space-y-8 text-sm sm:text-base text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[#111827] mb-3">1. Overview</h2>
            <p>
              MentorMaze (under AI Tathastu) is committed to protecting the privacy of students, alumni, faculty, and industry mentors. This Privacy Policy describes how we collect, use, and protect your information across our web platform and mentorship booking services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#111827] mb-3">2. Data We Collect</h2>
            <p>
              We collect information provided directly by you during registration, mentor application, and session booking, including your full name, university email, academic degree, target career goals, technical skills, and booking preferences.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#111827] mb-3">3. AI Tathastu SSO & Consent Sharing</h2>
            <p>
              When logging in via AI Tathastu SSO, you maintain granular control over the data attributes shared with mentors. You can review and revoke consent scopes (academic transcript, verified skills, portfolio projects, and goals) at any time from your account settings.
            </p>
          </section>

          <section id="cookies">
            <h2 className="text-xl font-bold text-[#111827] mb-3">4. Cookie Policy</h2>
            <p>
              MentorMaze uses strictly necessary HTTP-Only, SameSite cookies to securely maintain your authentication session (`mm_session_token`). We do not use third-party tracking cookies or sell your personal browsing information to advertising brokers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#111827] mb-3">5. Video & Communication Privacy</h2>
            <p>
              Live mentorship and mock interview video sessions operate over encrypted WebRTC media channels powered by LiveKit. Media streams are private between verified session participants and are not recorded or monitored without prior mutual written consent.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
