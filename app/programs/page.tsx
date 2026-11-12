import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ProgramsPage() {
  const programs = [
    {
      title: "Tier-1 Software Engineering Fellowship",
      domain: "Engineering",
      duration: "8 Weeks",
      level: "Intermediate / Advanced",
      description: "Structured mentorship track tailored for college students targeting Amazon, Microsoft, Google, and high-growth product startups.",
      highlights: ["Weekly 1-on-1 calls", "System Design blueprint reviews", "2 Full-length Mock Interviews", "Direct resume referral assistance"],
    },
    {
      title: "Data Science & Applied ML Track",
      domain: "AI / ML",
      duration: "6 Weeks",
      level: "All Levels",
      description: "Hands-on guidance on production machine learning pipelines, Kaggle strategies, mathematical foundations, and LLM fine-tuning.",
      highlights: ["Portfolio project code walkthroughs", "ML interview round prep", "SQL & distributed data processing reviews"],
    },
    {
      title: "Product Management (APM) Accelerator",
      domain: "Product",
      duration: "4 Weeks",
      level: "Beginner / Intermediate",
      description: "Master product teardowns, metrics design, execution frameworks, and behavioral product management case interviews.",
      highlights: ["Product teardown deck reviews", "Live behavioral drills", "North Star metric prioritization"],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-100 text-forest-800 text-xs font-semibold uppercase tracking-wider mb-3">
            Structured Cohorts & Tracks
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold text-ink-950">
            Mentorship Programs
          </h1>
          <p className="mt-4 text-base sm:text-lg text-ink-700">
            Comprehensive roadmaps combining regular 1-on-1 guidance with structured weekly checkpoints.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {programs.map((prog) => (
            <div key={prog.title} className="card-warm bg-white p-8 rounded-3xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-ink-500 mb-3">
                  <span className="badge-sage">{prog.domain}</span>
                  <span>{prog.duration}</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-ink-950 mb-3">{prog.title}</h3>
                <p className="text-xs text-ink-700 leading-relaxed mb-6">{prog.description}</p>
                <div className="border-t border-border pt-4">
                  <span className="text-xs font-bold text-ink-950 block mb-2">Program Inclusions:</span>
                  <ul className="space-y-2 text-xs text-ink-700">
                    {prog.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-8 pt-4">
                <Link href="/mentors" className="btn-primary w-full text-center text-xs">
                  Join Program Waitlist
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

