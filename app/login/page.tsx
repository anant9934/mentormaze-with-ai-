"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { Logo } from "@/components/shared/logo";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
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
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
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

  const handleTabSwitch = (mode: "aitathastu" | "other") => {
    setAuthMode(mode);
    setTurnstileToken(null);
    setLoginError(null);
  };

  const handleAITathastuLogin = async () => {
    setLoginError(null);
    const success = await login("anant@example.com", "password123", "student", turnstileToken || undefined);
    if (success) {
      switchRole("student");
      router.push("/dashboard");
    } else {
      setLoginError("Sign in failed. Please verify credentials or security challenge.");
    }
  };

  const handleOtherLogin = async (role: "student" | "mentor" | "admin" = "student") => {
    setLoginError(null);
    const success = await login(emailInput || "user@example.com", "password123", role, turnstileToken || undefined);
    if (success) {
      switchRole(role);
      if (role === "admin") router.push("/admin");
      else if (role === "mentor") router.push("/mentor/dashboard");
      else router.push("/dashboard");
    } else {
      setLoginError("Sign in failed. Please verify credentials or security challenge.");
    }
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
            <div className="grid grid-cols-2 gap-2 p-1 bg-cream-100 rounded-xl mb-4">
              <button
                onClick={() => handleTabSwitch("aitathastu")}
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
                onClick={() => handleTabSwitch("other")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  authMode === "other"
                    ? "bg-white text-forest-900 shadow-sm"
                    : "text-ink-700 hover:text-ink-950"
                }`}
              >
                Other Sign In
              </button>
            </div>

            {/* Error Banner */}
            {loginError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 text-center font-medium">
                {loginError}
              </div>
            )}

            {/* TAB 1: AI TATHASTU CONTEXT LOGIN */}
            {authMode === "aitathastu" ? (
              <div className="space-y-4">
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

                {/* Cloudflare Turnstile Challenge Widget */}
                <div className="flex flex-col items-center justify-center my-2 w-full">
                  <TurnstileWidget
                    key="turnstile-aitathastu"
                    theme="light"
                    size="normal"
                    onVerify={(token) => setTurnstileToken(token)}
                    onExpire={() => setTurnstileToken(null)}
                  />
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

                {/* Cloudflare Turnstile Challenge Widget */}
                <div className="flex flex-col items-center justify-center my-2 w-full">
                  <TurnstileWidget
                    key="turnstile-other"
                    theme="light"
                    size="normal"
                    onVerify={(token) => setTurnstileToken(token)}
                    onExpire={() => setTurnstileToken(null)}
                  />
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
                    onClick={() => {
                      window.location.href = "/api/auth/google";
                    }}
                    className="btn-secondary py-2.5 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-98 transition-all"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Google</span>
                  </button>
                  <button
                    onClick={() => handleOtherLogin("student")}
                    className="btn-secondary py-2.5 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-98 transition-all"
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

