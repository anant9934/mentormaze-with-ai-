"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { store } from "@/lib/data/store";
import { useAuth } from "@/lib/auth/context";
import {
  Mic,
  Video,
  Monitor,
  PhoneOff,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Settings,
  ChevronDown,
} from "lucide-react";

export default function MockInterviewPracticePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [selectedTrack, setSelectedTrack] = useState<"Technical" | "HR" | "System Design" | "Behavioral" | "Mixed">("Technical");
  const [targetRole, setTargetRole] = useState("SDE (Software Engineer)");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [mode, setMode] = useState<"live" | "ai">("live");

  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);

  const handleStartInterview = () => {
    // Navigate to live session room for mock interview
    router.push("/sessions/booking-2/live");
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-ink-700 hover:text-forest-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-100 text-forest-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-forest-700" />
            <span>Human-Led Simulation</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-ink-950">Mock Interview Practice</h1>
          <p className="text-xs text-ink-700 mt-1">
            Experience real interview rounds with verified tech leads, receive rubric scoring, and improve systematically.
          </p>
        </div>

        {/* Interview Type Selector Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {(["Technical", "HR", "System Design", "Behavioral", "Mixed"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedTrack(type)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                selectedTrack === type
                  ? "bg-forest-900 text-white shadow-sm"
                  : "bg-white text-ink-700 border border-border hover:bg-cream-100"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Main Stage Grid: Video Simulation (Left) + Settings (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* VIDEO INTERACTION PREVIEW (8 COLS) */}
          <div className="lg:col-span-8 card-warm bg-forest-950 rounded-3xl p-4 text-white shadow-elevated">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-forest-900 flex items-center justify-center">
              <Image
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80"
                alt="Interviewer Video"
                fill
                className="object-cover opacity-90"
              />

              {/* Live Badge */}
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-forest-950/80 backdrop-blur-md border border-forest-800 text-xs font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span>Technical Interview - SDE</span>
                <span className="text-[10px] text-forest-300 font-mono">Live · 24:16</span>
              </div>

              {/* Student PIP */}
              <div className="absolute bottom-4 right-4 w-36 h-24 sm:w-44 sm:h-30 rounded-xl overflow-hidden border-2 border-forest-700 bg-forest-900 shadow-md">
                <Image
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80"
                  alt="Student"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Overlay Controls */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <button
                  onClick={() => setIsMicOn(!isMicOn)}
                  className="p-2.5 rounded-full bg-forest-900/80 hover:bg-forest-800 text-white"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  className="p-2.5 rounded-full bg-forest-900/80 hover:bg-forest-800 text-white"
                >
                  <Video className="w-4 h-4" />
                </button>
                <button
                  onClick={() => alert("Screen share toggled.")}
                  className="p-2.5 rounded-full bg-forest-900/80 hover:bg-forest-800 text-white"
                >
                  <Monitor className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* SETTINGS PANEL (4 COLS) */}
          <div className="lg:col-span-4 card-warm bg-white p-6 rounded-3xl shadow-card space-y-6">
            <h3 className="font-bold text-sm text-ink-950 pb-3 border-b border-border flex items-center gap-2">
              <Settings className="w-4 h-4 text-forest-800" />
              <span>Interview Settings</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                Target Role
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border text-xs text-ink-950 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
              >
                <option value="SDE (Software Engineer)">SDE (Software Engineer)</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="Product Manager">Product Manager</option>
                <option value="Frontend Engineer">Frontend Engineer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-border text-xs text-ink-950 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
              >
                <option value="Easy">Easy (Intern / Early Career)</option>
                <option value="Medium">Medium (Mid-Level SDE)</option>
                <option value="Hard">Hard (Senior / FAANG Bar)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-2">
                Interview Delivery Mode
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-3 rounded-xl border border-forest-900 bg-sage-50 text-xs font-semibold text-forest-950 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "live"}
                    onChange={() => setMode("live")}
                    className="text-forest-900"
                  />
                  <span>Live with Verified Mentor</span>
                </label>
                <label className="flex items-center gap-2 p-3 rounded-xl border border-border bg-cream-50 text-xs font-medium text-ink-500 cursor-not-allowed opacity-60">
                  <input
                    type="radio"
                    name="mode"
                    disabled
                    checked={mode === "ai"}
                    onChange={() => setMode("ai")}
                    className="text-forest-900"
                  />
                  <span>AI Interviewer (Phase 2 Beta)</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleStartInterview}
              className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Start Interview</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
