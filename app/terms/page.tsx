import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Scale, ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
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
            <Scale className="w-5 h-5" />
          </div>
          <span className="text-xs uppercase tracking-widest font-bold text-[#164E3A]">
            Terms & Conditions
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#111827] tracking-tight mb-4">
          Terms of Service
        </h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: November 2026</p>

        <div className="prose prose-emerald max-w-none space-y-8 text-sm sm:text-base text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[#111827] mb-3">1. Agreement to Terms</h2>
            <p>
              By accessing or using MentorMaze, you agree to be bound by these Terms of Service. If you do not agree to all terms, you may not access the platform or book mentorship sessions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#111827] mb-3">2. Human Mentorship & Code of Conduct</h2>
            <p>
              MentorMaze connects students with verified human mentors for career guidance, portfolio reviews, and mock interviews. All participants must uphold academic integrity, professionalism, mutual respect, and zero tolerance for harassment or discrimination.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#111827] mb-3">3. Bookings, Payments & Pilot Pricing</h2>
            <p>
              Sessions are priced according to configured pilot pricing tiers:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>1-on-1 Mentorship: ₹149 (15m), ₹249 (30m), ₹449 (60m)</li>
              <li>Human Mock Interviews: ₹299 (Starter), ₹399 (Standard), ₹499 (Detailed)</li>
            </ul>
            <p className="mt-2">
              Payments are processed securely via Cashfree Payments. The platform retains a standard 15% marketplace commission, and the remainder is disbursed to the verified mentor.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#111827] mb-3">4. Cancellations & Rescheduling</h2>
            <p>
              Bookings may be rescheduled or cancelled prior to the scheduled start time. When a session is cancelled due to mentor unavailability or student notice, the slot is immediately released and payments are refunded in accordance with our refund policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#111827] mb-3">5. Disclaimer of Employment Guarantees</h2>
            <p>
              MentorMaze provides career mentorship, portfolio critiques, and mock interview practice. MentorMaze and its mentors do not guarantee employment, internship offers, academic grades, or recruitment outcomes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#111827] mb-3">6. Governing Contact</h2>
            <p>
              For legal inquiries regarding these terms, contact{" "}
              <a href="mailto:hellomentormaze@gmail.com" className="text-[#0D382B] font-semibold underline">
                hellomentormaze@gmail.com
              </a>{" "}
              or visit{" "}
              <a href="https://mentormaze.aitathastu.com" className="text-[#0D382B] font-semibold underline">
                https://mentormaze.aitathastu.com
              </a>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

