"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  Users,
  Compass,
  TrendingUp,
  Video,
  Calendar,
  Sparkles,
  ArrowRight,
  Play,
  Star,
  CheckCircle2,
  ShieldCheck,
  Award,
} from "lucide-react";

export default function HomePage() {
  const mentorAvatars = [
    {
      name: "Rohan Mehta",
      role: "Data Scientist @ Google",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    },
    {
      name: "Priya Sharma",
      role: "Software Engineer @ Microsoft",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
    },
    {
      name: "Aditya Singh",
      role: "Product Manager @ Adobe",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    },
    {
      name: "Simran Kaur",
      role: "Backend Lead @ Razorpay",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80",
    },
    {
      name: "Karan Verma",
      role: "AI Engineer @ DeepMind",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-cream-50 via-cream-100 to-cream-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sage-100 border border-sage-200 text-forest-800 text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-forest-700" />
              <span>Real People. Real Guidance.</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-ink-950 max-w-4xl mx-auto leading-[1.15]">
              Find the Right Mentor.{" "}
              <span className="text-forest-900 underline decoration-emerald-500/30 underline-offset-8">
                Grow Faster.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-lg sm:text-xl text-ink-700 max-w-2xl mx-auto leading-relaxed">
              Connect 1-on-1 with verified engineers, data scientists, and product leaders for personalized mentorship and human-led mock interviews.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/mentors"
                className="btn-primary text-base px-8 py-3.5 shadow-md flex items-center gap-2 group w-full sm:w-auto"
              >
                <span>Explore Mentors</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/how-it-works"
                className="btn-secondary text-base px-7 py-3.5 flex items-center gap-2 w-full sm:w-auto"
              >
                <Play className="w-4 h-4 fill-ink-950 text-ink-950" />
                <span>Watch Demo</span>
              </Link>
            </div>

            {/* Mentor Portrait Carousel Card Strip */}
            <div className="mt-14 relative max-w-5xl mx-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 items-center justify-center">
                {mentorAvatars.map((mentor, idx) => (
                  <div
                    key={idx}
                    className={`group relative rounded-2xl overflow-hidden border border-border bg-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-elevated ${
                      idx === 1 ? "ring-2 ring-forest-700 scale-105 z-10" : ""
                    }`}
                  >
                    <div className="aspect-[4/5] relative w-full overflow-hidden bg-cream-100">
                      <Image
                        src={mentor.image}
                        alt={mentor.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-2.5 text-left bg-white">
                      <div className="flex items-center gap-1 font-semibold text-xs text-ink-950 truncate">
                        <span>{mentor.name}</span>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                      </div>
                      <p className="text-[10px] text-ink-500 truncate">{mentor.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Three Value Props Under Hero */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto pt-8 border-t border-border">
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center text-forest-800">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-sm text-ink-950">Expert Mentors</h3>
                  <p className="text-xs text-ink-500">Verified industry professionals</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center text-forest-800">
                  <Compass className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-sm text-ink-950">Smart Match</h3>
                  <p className="text-xs text-ink-500">Explainable goal-to-expertise fit</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center text-forest-800">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-sm text-ink-950">Track Growth</h3>
                  <p className="text-xs text-ink-500">Rubric scores & actionable milestones</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BENTO GRID FEATURE SHOWCASE */}
        <section className="py-20 bg-cream-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-ink-950">
                A Structured Way to Prepare & Accelerate
              </h2>
              <p className="mt-4 text-ink-700 text-base">
                Everything you need from initial career orientation to live coding practice and measurable milestones.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Feature 1: Large Forest Card - Live Mentorship */}
              <div className="lg:col-span-2 rounded-3xl bg-forest-900 text-white p-8 sm:p-10 relative overflow-hidden flex flex-col justify-between shadow-card">
                <div className="relative z-10 max-w-md">
                  <div className="w-10 h-10 rounded-full bg-forest-800 flex items-center justify-center text-emerald-400 mb-6">
                    <Video className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
                    Live 1-on-1 Mentorship
                  </h3>
                  <p className="mt-3 text-forest-200 text-sm leading-relaxed">
                    Face-to-face WebRTC sessions with personalized agenda checklists, live note taking, screen sharing, and post-session action items.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/mentors"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 text-forest-950 font-bold text-sm hover:bg-emerald-400 transition-colors"
                    >
                      <span>Find a Mentor</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Visual Video Session Graphic */}
                <div className="mt-8 lg:mt-0 lg:absolute lg:right-6 lg:bottom-6 w-full lg:w-72 rounded-2xl bg-forest-800/80 p-3 border border-forest-700/60 backdrop-blur-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-forest-700 text-xs text-forest-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      LiveKit Session: 24:16
                    </span>
                    <span className="font-mono text-[10px] bg-forest-900 px-2 py-0.5 rounded">1:1</span>
                  </div>
                  <div className="mt-2 aspect-video bg-forest-950 rounded-xl flex items-center justify-center text-forest-400 text-xs relative overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"
                      alt="Priya Sharma"
                      fill
                      className="object-cover opacity-80"
                    />
                    <div className="absolute bottom-2 left-2 bg-forest-950/80 px-2 py-0.5 rounded text-[10px] text-white">
                      Priya Sharma (Microsoft)
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 2: Flexible Schedule */}
              <div className="rounded-3xl bg-cream-100 border border-border p-8 flex flex-col justify-between shadow-card">
                <div>
                  <div className="w-10 h-10 rounded-full bg-sage-200 flex items-center justify-center text-forest-900 mb-6">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-ink-950">
                    Flexible Schedule
                  </h3>
                  <p className="mt-2 text-ink-700 text-sm leading-relaxed">
                    Book slots that work with your college timetable. Instant calendar invites and zero timezone confusion.
                  </p>
                </div>
                <div className="mt-8 p-4 rounded-2xl bg-white border border-border">
                  <div className="text-xs font-semibold text-forest-900 mb-2 flex items-center justify-between">
                    <span>Upcoming Slots</span>
                    <span className="text-[10px] text-ink-500">IST (GMT+5:30)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-sage-100 text-forest-900 font-medium text-center border border-sage-200">
                      Today, 7:30 PM
                    </div>
                    <div className="p-2 rounded-lg bg-cream-50 text-ink-700 text-center border border-border">
                      Tomorrow, 6:00 PM
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 3: Mock Interview Practice */}
              <div className="rounded-3xl bg-cream-100 border border-border p-8 flex flex-col justify-between shadow-card">
                <div>
                  <div className="w-10 h-10 rounded-full bg-sage-200 flex items-center justify-center text-forest-900 mb-6">
                    <Award className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-ink-950">
                    Human Mock Interviews
                  </h3>
                  <p className="mt-2 text-ink-700 text-sm leading-relaxed">
                    Practice with senior engineers in real Technical, HR, and System Design rounds. Get a transparent 1-10 rubric evaluation.
                  </p>
                </div>
                <div className="mt-8 p-4 rounded-2xl bg-white border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-ink-700">Overall Performance</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">8.2 / 10</span>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <div className="w-full bg-cream-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-forest-700 h-1.5 rounded-full" style={{ width: "85%" }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-ink-500">
                      <span>Technical Accuracy</span>
                      <span>8.5 / 10</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 4: Large Progress & Goals Card */}
              <div className="lg:col-span-2 rounded-3xl bg-white border border-border p-8 sm:p-10 flex flex-col justify-between shadow-card">
                <div>
                  <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center text-forest-900 mb-6">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-ink-950">
                    See Real Measurable Progress
                  </h3>
                  <p className="mt-2 text-ink-700 text-sm max-w-xl">
                    Every session generates student-approved summaries, learning milestones, and follow-up action items. Never wonder what to practice next.
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-cream-50 border border-border">
                    <div className="flex items-center justify-between text-xs font-semibold text-ink-950 mb-1">
                      <span>Crack SDE Interview</span>
                      <span className="text-forest-800">60%</span>
                    </div>
                    <div className="w-full bg-sand-200 rounded-full h-2 mb-2">
                      <div className="bg-forest-900 h-2 rounded-full" style={{ width: "60%" }}></div>
                    </div>
                    <p className="text-[11px] text-ink-500">Next: Practice Dynamic Programming & Graph traversal</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-cream-50 border border-border">
                    <div className="flex items-center justify-between text-xs font-semibold text-ink-950 mb-1">
                      <span>Build Portfolio Project</span>
                      <span className="text-forest-800">40%</span>
                    </div>
                    <div className="w-full bg-sand-200 rounded-full h-2 mb-2">
                      <div className="bg-forest-900 h-2 rounded-full" style={{ width: "40%" }}></div>
                    </div>
                    <p className="text-[11px] text-ink-500">Next: Implement WebSocket realtime sync</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section className="py-20 bg-cream-100/60 border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-1.5 text-forest-800 text-sm font-semibold mb-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>Real Impact.</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink-950">
              Trusted by Ambitious Students
            </h2>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="card-warm flex flex-col justify-between">
                <div>
                  <div className="flex text-amber-400 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-ink-700 italic leading-relaxed">
                    &ldquo;Priya helped me structure my learning and crack my summer internship at a product company. Her system design tips were spot on!&rdquo;
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-3 pt-4 border-t border-border">
                  <div className="w-9 h-9 rounded-full bg-forest-900 text-white flex items-center justify-center font-bold text-xs">
                    AV
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink-950">Ankit Verma</h4>
                    <p className="text-[10px] text-ink-500">CS Student @ Delhi</p>
                  </div>
                </div>
              </div>

              <div className="card-warm flex flex-col justify-between">
                <div>
                  <div className="flex text-amber-400 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-ink-700 italic leading-relaxed">
                    &ldquo;Incredible feedback on my resume and portfolio project. She gave me specific action items that elevated my interviews immediately.&rdquo;
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-3 pt-4 border-t border-border">
                  <div className="w-9 h-9 rounded-full bg-forest-900 text-white flex items-center justify-center font-bold text-xs">
                    NG
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink-950">Neha Gupta</h4>
                    <p className="text-[10px] text-ink-500">B.Tech Final Year @ LPU</p>
                  </div>
                </div>
              </div>

              <div className="card-warm flex flex-col justify-between">
                <div>
                  <div className="flex text-amber-400 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-ink-700 italic leading-relaxed">
                    &ldquo;The mock interview with Rohan felt like a real tier-1 tech round. The rubric breakdown showed me exactly where I was losing points.&rdquo;
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-3 pt-4 border-t border-border">
                  <div className="w-9 h-9 rounded-full bg-forest-900 text-white flex items-center justify-center font-bold text-xs">
                    RK
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink-950">Ravi Kumar</h4>
                    <p className="text-[10px] text-ink-500">Aspiring ML Engineer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA BANNER */}
        <section className="py-20 bg-cream-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl bg-forest-900 text-white p-10 sm:p-14 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-elevated">
              <div className="relative z-10 max-w-xl">
                <span className="text-emerald-400 text-xs font-bold tracking-widest uppercase">
                  Start Your Journey
                </span>
                <h2 className="font-serif text-3xl sm:text-5xl font-bold mt-2 text-white">
                  Get Guidance From Mentors Who’ve Walked the Path.
                </h2>
                <p className="mt-4 text-forest-200 text-sm sm:text-base leading-relaxed">
                  Join hundreds of students mastering interviews, building verified projects, and receiving structured feedback.
                </p>
              </div>
              <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Link
                  href="/login"
                  className="btn-primary bg-emerald-500 text-forest-950 hover:bg-emerald-400 font-bold px-8 py-4 text-base"
                >
                  Get Started Now
                </Link>
                <Link
                  href="/mentor/apply"
                  className="btn-secondary bg-transparent text-white border-forest-700 hover:bg-forest-800 px-6 py-4 text-base text-center"
                >
                  Apply as Mentor
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

