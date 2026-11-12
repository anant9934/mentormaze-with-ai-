"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { Logo } from "@/components/shared/logo";
import {
  GraduationCap,
  Code2,
  FolderGit2,
  Compass,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Zap,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, switchRole } = useAuth();
  const [authMode, setAuthMode] = useState<"aitathastu" | "other">("aitathastu");
  const [selectedScopes, setSelectedScopes] = useState<Record<string, boolean>>({
    academic: true,
    skills: true,
    projects: true,
    goals: true,
    learning: true,
  });
  const [emailInput, setEmailInput] = useState("");

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) => ({ ...prev, [scope]: !prev[scope] }));
  };

  const handleAITathastuLogin = () => {
    // Authenticate with AI Tathastu context
    login("anant@example.com", "student");
    switchRole("student");
    router.push("/dashboard");
  };

  const handleOtherLogin = (role: "student" | "mentor" | "admin" = "student") => {
    login(emailInput || "user@example.com", role);
    switchRole(role);
    if (role === "admin") router.push("/admin");
    else if (role === "mentor") router.push("/mentor/dashboard");
    else router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col justify-between">
      {/* Top Header */}
      <header className="px-6 py-6 max-w-7xl mx-auto w-full flex items-center justify-between">
        <Logo />
        <Link
          href="/"
          className="text-xs font-semibold text-ink-700 hover:text-forest-900 transition-colors"
        >
          ← Back to Website
        </Link>
      </header>

      {/* Main Split Grid */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1">
        {/* LEFT COLUMN: Context Narrative & Mockup Showcase */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sage-100 text-forest-800 text-xs font-semibold">
            <span>Mentorship</span>
            <span>•</span>
            <span>Mock Interviews</span>
            <span>•</span>
            <span>Career Growth</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-ink-950 leading-[1.15]">
            One Account,
            <br />
            <span className="text-forest-900">More Personal Guidance.</span>
          </h1>

          <p className="text-ink-700 text-base max-w-lg leading-relaxed">
            Log in with AI Tathastu for a smarter, permissioned mentorship and interview experience. Your existing academic skills and career interests help us find the perfect mentors instantly.
          </p>

          {/* Context Exchange Feature Preview Card */}
          <div className="p-6 rounded-2xl bg-white border border-border shadow-card max-w-lg">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                  AI
                </div>
                <span className="font-bold text-xs text-ink-950">AI Tathastu Gateway</span>
              </div>
              <span className="badge-match text-[10px]">Connected & Verified</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-2 p-3 rounded-xl bg-cream-50 border border-border">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                  Your Profile Context
                </span>
                <div className="flex items-center gap-1.5 text-ink-700">
                  <GraduationCap className="w-3.5 h-3.5 text-forest-700" />
                  <span>Academic Profile</span>
                </div>
                <div className="flex items-center gap-1.5 text-ink-700">
                  <Code2 className="w-3.5 h-3.5 text-forest-700" />
                  <span>Skills & Projects</span>
                </div>
                <div className="flex items-center gap-1.5 text-ink-700">
                  <Compass className="w-3.5 h-3.5 text-forest-700" />
                  <span>Career Interests</span>
                </div>
                <div className="flex items-center gap-1.5 text-ink-700">
                  <TrendingUp className="w-3.5 h-3.5 text-forest-700" />
                  <span>Learning Progress</span>
                </div>
              </div>

              <div className="space-y-2 p-3 rounded-xl bg-sage-50 border border-sage-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-forest-800">
                  Tailored For You
                </span>
                <div className="flex items-center gap-1.5 text-forest-900 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Personalized mentors</span>
                </div>
                <div className="flex items-center gap-1.5 text-forest-900 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Relevant mock interviews</span>
                </div>
                <div className="flex items-center gap-1.5 text-forest-900 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Skill gap analysis</span>
                </div>
                <div className="flex items-center gap-1.5 text-forest-900 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Career roadmap</span>
                </div>
              </div>
            </div>
          </div>

          {/* Value Props Row */}
          <div className="grid grid-cols-3 gap-4 max-w-lg pt-2">
            <div>
              <Zap className="w-4 h-4 text-forest-700 mb-1" />
              <h4 className="text-xs font-bold text-ink-950">Relevant Matches</h4>
              <p className="text-[10px] text-ink-500">Based on verified facts</p>
            </div>
            <div>
              <Sparkles className="w-4 h-4 text-forest-700 mb-1" />
              <h4 className="text-xs font-bold text-ink-950">Faster Onboarding</h4>
              <p className="text-[10px] text-ink-500">Zero manual form filling</p>
            </div>
            <div>
              <ShieldCheck className="w-4 h-4 text-forest-700 mb-1" />
              <h4 className="text-xs font-bold text-ink-950">Full Control</h4>
              <p className="text-[10px] text-ink-500">Revoke consent anytime</p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Login Card */}
        <div className="lg:col-span-6 max-w-md w-full mx-auto">
          <div className="card-warm bg-white p-8 rounded-3xl shadow-elevated border-border">
            <div className="text-center mb-6">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-950">
                Welcome to MentorMaze
              </h2>
              <p className="text-xs text-ink-700 mt-1">
                Sign in to get human mentorship, mock interviews and career guidance.
              </p>
            </div>

            {/* Login Mode Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-cream-100 rounded-xl mb-6">
              <button
                onClick={() => setAuthMode("aitathastu")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  authMode === "aitathastu"
                    ? "bg-white text-forest-900 shadow-sm"
                    : "text-ink-700 hover:text-ink-950"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>AI Tathastu</span>
                <span className="text-[9px] bg-sage-200 text-forest-900 px-1.5 py-0.2 rounded-full">Rec</span>
              </button>
              <button
                onClick={() => setAuthMode("other")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  authMode === "other"
                    ? "bg-white text-forest-900 shadow-sm"
                    : "text-ink-700 hover:text-ink-950"
                }`}
              >
                Other Sign In
              </button>
            </div>

            {/* TAB 1: AI TATHASTU CONTEXT LOGIN */}
            {authMode === "aitathastu" ? (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-sage-50 border border-sage-200">
                  <div className="flex items-center gap-2 font-bold text-xs text-forest-900 mb-1">
                    <ShieldCheck className="w-4 h-4 text-forest-700" />
                    <span>Context-Aware Login Scopes</span>
                  </div>
                  <p className="text-[11px] text-ink-700 mb-3">
                    Select the data points you permit MentorMaze to access for smart mentor matching:
                  </p>

                  <div className="space-y-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-ink-950">
                      <input
                        type="checkbox"
                        checked={selectedScopes.academic}
                        onChange={() => toggleScope("academic")}
                        className="rounded text-forest-900 focus:ring-forest-700"
                      />
                      <span>Academic details (Degree, institution, year)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-ink-950">
                      <input
                        type="checkbox"
                        checked={selectedScopes.skills}
                        onChange={() => toggleScope("skills")}
                        className="rounded text-forest-900 focus:ring-forest-700"
                      />
                      <span>Skills & technical proficiencies</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-ink-950">
                      <input
                        type="checkbox"
                        checked={selectedScopes.projects}
                        onChange={() => toggleScope("projects")}
                        className="rounded text-forest-900 focus:ring-forest-700"
                      />
                      <span>Projects & repository links</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-ink-950">
                      <input
                        type="checkbox"
                        checked={selectedScopes.goals}
                        onChange={() => toggleScope("goals")}
                        className="rounded text-forest-900 focus:ring-forest-700"
                      />
                      <span>Career goals & target roles</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleAITathastuLogin}
                  className="btn-primary w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:bg-forest-800"
                >
                  <span>Continue with AI Tathastu</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* TAB 2: INDEPENDENT EMAIL / OAUTH SIGN IN */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-ink-400" />
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border text-sm text-ink-950 focus:outline-none focus:ring-2 focus:ring-forest-700"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleOtherLogin("student")}
                  className="btn-primary w-full py-3 text-sm font-semibold"
                >
                  Continue with Email
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-ink-500">or sign in with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleOtherLogin("student")}
                    className="btn-secondary py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <span>Google</span>
                  </button>
                  <button
                    onClick={() => handleOtherLogin("student")}
                    className="btn-secondary py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <span>GitHub</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Demo Access Bar */}
            <div className="mt-6 pt-4 border-t border-border text-center">
              <span className="text-[10px] text-ink-500 block mb-2 font-medium">
                Fast-Track Demo Personas (1-Click Login):
              </span>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => handleOtherLogin("student")}
                  className="px-2.5 py-1 rounded bg-cream-100 hover:bg-cream-200 text-ink-950 text-[11px] font-semibold border border-border"
                >
                  Student (Anant)
                </button>
                <button
                  onClick={() => handleOtherLogin("mentor")}
                  className="px-2.5 py-1 rounded bg-cream-100 hover:bg-cream-200 text-ink-950 text-[11px] font-semibold border border-border"
                >
                  Mentor (Priya)
                </button>
                <button
                  onClick={() => handleOtherLogin("admin")}
                  className="px-2.5 py-1 rounded bg-cream-100 hover:bg-cream-200 text-ink-950 text-[11px] font-semibold border border-border"
                >
                  Admin
                </button>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-ink-500">
                New to MentorMaze?{" "}
                <Link href="/onboarding" className="text-forest-800 font-semibold hover:underline">
                  Create an Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-ink-500 border-t border-border">
        MentorMaze is committed to transparent, permissioned data exchange.
      </footer>
    </div>
  );
}
