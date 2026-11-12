import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Compass, CalendarCheck, Video, Award, ArrowRight } from "lucide-react";

export default function HowItWorksPage() {
  const steps = [
    {
      num: "01",
      title: "Define Goals & Get Matched",
      desc: "Connect your AI Tathastu account or set your career goals manually. Our deterministic matching engine evaluates skills, target roles, and availability to recommend your top 3 verified mentors with explainable reasons.",
      icon: Compass,
    },
    {
      num: "02",
      title: "Schedule Without Friction",
      desc: "Browse your mentor's real-time calendar slots. Choose a time that works for your timetable in your local timezone, and specify your discussion topics or mock interview type.",
      icon: CalendarCheck,
    },
    {
      num: "03",
      title: "Attend Live 1-on-1 Sessions",
      desc: "Join high-fidelity audio/video rooms powered by LiveKit directly in your browser. Work through structured agendas, live code reviews, and mock questions with zero plugin downloads required.",
      icon: Video,
    },
    {
      num: "04",
      title: "Track Progress & Milestones",
      desc: "After each session, receive actionable next steps, study resources, and transparent rubric ratings. Watch your career progress bars rise as you accomplish milestones.",
      icon: Award,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-100 text-forest-800 text-xs font-semibold uppercase tracking-wider mb-3">
            The MentorMaze Workflow
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold text-ink-950">
            How MentorMaze Works
          </h1>
          <p className="mt-4 text-base sm:text-lg text-ink-700">
            From discovering your ideal guide to conducting live mock sessions and tracking your growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="card-warm bg-white p-8 relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-serif text-3xl font-bold text-sand-300">{step.num}</span>
                    <div className="w-12 h-12 rounded-2xl bg-sage-100 flex items-center justify-center text-forest-900">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-ink-950 mb-3">{step.title}</h3>
                  <p className="text-sm text-ink-700 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <Link href="/mentors" className="btn-primary text-base px-8 py-3.5 inline-flex items-center gap-2">
            <span>Explore Mentors Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
