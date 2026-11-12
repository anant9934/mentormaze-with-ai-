import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CheckCircle2, ArrowRight, ShieldCheck, Clock, Users } from "lucide-react";

export default function PricingPage() {
  const mentorshipTiers = [
    {
      name: "Quick Clarity Call",
      duration: "15 min",
      price: "₹149",
      description: "Fast answers to a specific blocker, resume quick-scan, or course advice.",
      features: [
        "15 minutes live 1-on-1 video call",
        "Targeted feedback on 1 specific question",
        "Direct text recap from your mentor",
        "Add to Google Calendar / ICS invite",
      ],
      popular: false,
      cta: "Book 15-Min Call",
    },
    {
      name: "Standard Mentorship",
      duration: "30 min",
      price: "₹249",
      description: "Deep dive into career direction, project feedback, or interview strategy.",
      features: [
        "30 minutes live 1-on-1 video call",
        "In-depth project or resume review",
        "Collaborative session agenda & notes",
        "Actionable next steps & learning plan",
        "7-day follow-up text support",
      ],
      popular: true,
      cta: "Book 30-Min Session",
    },
    {
      name: "Deep Mentorship",
      duration: "60 min",
      price: "₹449",
      description: "Comprehensive end-to-end guidance, system design review, or portfolio overhaul.",
      features: [
        "60 minutes live 1-on-1 session",
        "Complete portfolio & architecture review",
        "Custom milestone roadmap",
        "Direct shared resources & documentation",
        "14-day follow-up messaging support",
      ],
      popular: false,
      cta: "Book Deep Mentorship",
    },
  ];

  const interviewTiers = [
    {
      name: "Starter Mock Round",
      duration: "30-40 min",
      price: "₹299",
      role: "Technical or HR Round",
      description: "Ideal for first-time practice and identifying foundational weaknesses.",
      features: [
        "Live 1-on-1 mock interview with verified interviewer",
        "Real interview problem statements & questions",
        "Verbal post-session debrief",
        "Standard rubric score breakdown",
      ],
    },
    {
      name: "Standard Mock Round",
      duration: "45-60 min",
      price: "₹399",
      role: "DSA / System Design / Behavioral",
      description: "Full-scale corporate simulation matching tier-1 hiring bars.",
      features: [
        "60-minute realistic interview round",
        "Live coding / design whiteboard review",
        "Detailed performance rubric (1-10 scores)",
        "Key strengths & areas to improve breakdown",
        "Targeted practice problem recommendations",
      ],
      popular: true,
    },
    {
      name: "Detailed Mock + Report",
      duration: "60 min + Report",
      price: "₹499",
      role: "Senior Engineering / PM Bar",
      description: "Complete formal evaluation with an employer-grade written report.",
      features: [
        "60-minute rigorous interview round",
        "Comprehensive written evaluation report",
        "Detailed rubric scoring across 4 dimensions",
        "Curated next-step problem set & study roadmap",
        "Priority rescheduling protection",
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-100 text-forest-800 text-xs font-semibold uppercase tracking-wider mb-3">
            Transparent Market Pricing
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold text-ink-950">
            Predictable, Student-First Pricing
          </h1>
          <p className="mt-4 text-base sm:text-lg text-ink-700">
            Evidence-based pricing positioned well below commercial marketplace medians, ensuring every student has access to top human expertise.
          </p>
        </div>

        {/* Section 1: Mentorship Sessions */}
        <div className="mb-20">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-forest-800" />
            <h2 className="font-serif text-2xl font-bold text-ink-950">
              1-on-1 Human Mentorship Calls
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {mentorshipTiers.map((tier) => (
              <div
                key={tier.name}
                className={`card-warm flex flex-col justify-between relative ${
                  tier.popular ? "ring-2 ring-forest-900 shadow-elevated bg-white" : "bg-white"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-forest-900 text-white text-[11px] font-bold">
                    Most Popular
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-ink-950">{tier.name}</h3>
                    <span className="text-xs font-medium text-ink-500 bg-cream-100 px-2.5 py-1 rounded-full">
                      {tier.duration}
                    </span>
                  </div>
                  <div className="mt-4 mb-3">
                    <span className="font-serif text-4xl font-bold text-forest-900">{tier.price}</span>
                    <span className="text-xs text-ink-500 ml-1">/ session</span>
                  </div>
                  <p className="text-xs text-ink-700 mb-6">{tier.description}</p>

                  <ul className="space-y-2.5 text-xs text-ink-950 border-t border-border pt-4">
                    {tier.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    href="/mentors"
                    className={`w-full text-center ${
                      tier.popular ? "btn-primary" : "btn-secondary"
                    }`}
                  >
                    {tier.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Mock Interviews */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-forest-800" />
            <h2 className="font-serif text-2xl font-bold text-ink-950">
              Human-Led Mock Interview Practice
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {interviewTiers.map((tier) => (
              <div
                key={tier.name}
                className={`card-warm flex flex-col justify-between relative ${
                  tier.popular ? "ring-2 ring-forest-900 shadow-elevated bg-white" : "bg-white"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-forest-900 text-white text-[11px] font-bold">
                    Recommended
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-ink-950">{tier.name}</h3>
                    <span className="text-xs font-medium text-ink-500 bg-cream-100 px-2.5 py-1 rounded-full">
                      {tier.duration}
                    </span>
                  </div>
                  <div className="mt-4 mb-3">
                    <span className="font-serif text-4xl font-bold text-forest-900">{tier.price}</span>
                    <span className="text-xs text-ink-500 ml-1">/ interview</span>
                  </div>
                  <p className="text-xs text-ink-700 mb-6">{tier.description}</p>

                  <ul className="space-y-2.5 text-xs text-ink-950 border-t border-border pt-4">
                    {tier.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    href="/mentors"
                    className={`w-full text-center ${
                      tier.popular ? "btn-primary" : "btn-secondary"
                    }`}
                  >
                    Book Mock Interview
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Guarantee note */}
        <div className="mt-16 p-6 rounded-2xl bg-sage-50 border border-sage-200 flex flex-col sm:flex-row items-center gap-4 text-xs text-forest-900">
          <ShieldCheck className="w-8 h-8 text-forest-800 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-bold text-sm text-forest-950">Escrow-Protected Marketplace</h4>
            <p className="text-ink-700 mt-0.5">
              Your payment is securely held until the session is successfully conducted. If the mentor does not attend, your booking is automatically refunded or rescheduled at no extra charge.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

