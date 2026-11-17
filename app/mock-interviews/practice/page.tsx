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
  Bot,
  Volume2,
} from "lucide-react";

const TRACKS = [
  { id: "sde_backend", label: "Backend & DSA", role: "SDE-2 (Backend Engineer)", desc: "Data structures, LRU cache, concurrency & asymptotic optimality" },
  { id: "sde_frontend", label: "Frontend & UI Systems", role: "Senior Frontend Engineer", desc: "React hooks, virtualized lists, typeahead & web performance" },
  { id: "system_design", label: "System Design", role: "Distributed Systems Architect", desc: "Global URL shorteners, Redis caching, CDN & high-scale QPS" },
  { id: "behavioral", label: "Behavioral (STAR)", role: "Engineering Leader / Bar Raiser", desc: "Leadership principles, ownership, conflict resolution & ambiguity" },
  { id: "data_science", label: "Data Science & ML", role: "Machine Learning Engineer", desc: "Statistical models, feature engineering, loss functions & A/B testing" },
  { id: "product_management", label: "Product Management", role: "Senior Product Manager", desc: "Product sense, North Star metrics, GTM strategy & roadmap trade-offs" },
];

export default function MockInterviewPracticePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [selectedTrackId, setSelectedTrackId] = useState<string>("sde_backend");
  const [targetRole, setTargetRole] = useState("SDE-2 (Backend Engineer)");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [mode, setMode] = useState<"live" | "ai">("ai");

  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);

  const activeTrackObj = TRACKS.find((t) => t.id === selectedTrackId) || TRACKS[0];

  const handleSelectTrack = (track: typeof TRACKS[0]) => {
    setSelectedTrackId(track.id);
    setTargetRole(track.role);
  };

  const handleStartInterview = () => {
    // Navigate to live session room for mock interview with selected settings
    if (mode === "ai") {
      router.push(`/sessions/bk-test-123/live?role=ai_interviewer&track=${selectedTrackId}&diff=${difficulty}`);
    } else {
      router.push("/sessions/booking-2/live");
    }
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
          {TRACKS.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelectTrack(t)}
              className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedTrackId === t.id
                  ? mode === "ai"
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/30 ring-2 ring-violet-400/40"
                    : "bg-forest-900 text-white shadow-sm"
                  : "bg-white text-ink-700 border border-border hover:bg-cream-100"
              }`}
            >
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Main Stage Grid: Video Simulation (Left) + Settings (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* VIDEO INTERACTION PREVIEW (8 COLS) */}
          <div className="lg:col-span-8 card-warm bg-forest-950 rounded-3xl p-4 text-white shadow-elevated">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-forest-900 flex items-center justify-center">
              {mode === "ai" ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-8 bg-radial from-[#1A1A38] via-[#0F1426] to-[#0A0D18]">
                  <div className="absolute w-64 h-64 rounded-full bg-violet-600/20 blur-3xl pointer-events-none animate-pulse" />

                  <div className="relative mb-4">
                    <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-violet-500 shadow-2xl ring-8 ring-violet-500/20">
                      <Image
                        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"
                        alt="Tathastu AI Bar Raiser"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-violet-600 text-[10px] font-bold text-white shadow-md flex items-center gap-1">
                      <Volume2 className="w-3 h-3" />
                      <span>Voice Ready</span>
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-1 tracking-tight flex items-center gap-2">
                    <Bot className="w-5 h-5 text-violet-400" />
                    <span>Tathastu AI Bar Raiser</span>
                  </h3>
                  <div className="px-3 py-1 rounded-full bg-violet-900/60 border border-violet-500/40 text-[11px] text-violet-200 font-semibold mb-2">
                    {activeTrackObj.label} · {activeTrackObj.role}
                  </div>
                  <p className="text-xs text-violet-300/80 mb-3 text-center max-w-md leading-relaxed">
                    {activeTrackObj.desc}
                  </p>

                  {/* Audio Wave Visualizer Simulation */}
                  <div className="flex items-center gap-1.5 h-6 mb-2">
                    {[0.3, 0.7, 0.5, 1.0, 0.8, 0.9, 0.4].map((v, i) => (
                      <span
                        key={i}
                        className="w-1.5 bg-gradient-to-t from-violet-500 to-indigo-300 rounded-full animate-pulse"
                        style={{
                          height: `${Math.max(6, v * 24)}px`,
                          animationDelay: `${i * 120}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <Image
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80"
                  alt="Interviewer Video"
                  fill
                  className="object-cover opacity-90"
                />
              )}

              {/* Live Badge */}
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-forest-950/80 backdrop-blur-md border border-forest-800 text-xs font-semibold flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${mode === "ai" ? "bg-violet-400" : "bg-red-500"} animate-pulse`}></span>
                <span>{mode === "ai" ? "AI Bar Raiser Simulation" : "Technical Interview - SDE"}</span>
                <span className="text-[10px] text-forest-300 font-mono">
                  {mode === "ai" ? "Voice + Chat Mode" : "Live · 24:16"}
                </span>
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
                  className={`p-2.5 rounded-full ${isMicOn ? "bg-forest-900/80 text-white" : "bg-red-600 text-white"} hover:bg-forest-800`}
                  title={isMicOn ? "Microphone ON" : "Microphone Muted"}
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  className={`p-2.5 rounded-full ${isVideoOn ? "bg-forest-900/80 text-white" : "bg-red-600 text-white"} hover:bg-forest-800`}
                  title={isVideoOn ? "Camera ON" : "Camera Off"}
                >
                  <Video className="w-4 h-4" />
                </button>
                <button
                  onClick={() => alert("Screen share preview ready.")}
                  className="p-2.5 rounded-full bg-forest-900/80 hover:bg-forest-800 text-white"
                  title="Screen Sharing"
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
                className="w-full p-2.5 rounded-xl border border-border text-xs text-ink-950 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700 font-medium"
              >
                {TRACKS.map((t) => (
                  <option key={t.id} value={t.role}>
                    {t.role} ({t.label})
                  </option>
                ))}
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
                <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  mode === "ai"
                    ? "border-violet-600 bg-violet-50/70 text-violet-950 ring-1 ring-violet-500/30"
                    : "border-border bg-white text-ink-800 hover:bg-cream-100"
                }`}>
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "ai"}
                    onChange={() => setMode("ai")}
                    className="text-violet-600 focus:ring-violet-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5 text-violet-600" />
                        <span>Tathastu AI Bar Raiser</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-600 text-white shadow-sm">
                        Voice + Chat Active
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-600 mt-0.5">
                      Instant simulation, speech recognition, live code analysis & FAANG rubric
                    </p>
                  </div>
                </label>

                <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  mode === "live"
                    ? "border-forest-900 bg-sage-50 text-forest-950 ring-1 ring-forest-800/30"
                    : "border-border bg-white text-ink-800 hover:bg-cream-100"
                }`}>
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "live"}
                    onChange={() => setMode("live")}
                    className="text-forest-900 focus:ring-forest-800"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs">Live with Verified Mentor</span>
                      <span className="text-[10px] font-medium text-forest-700 bg-forest-100 px-2 py-0.5 rounded-full">
                        1-on-1 Session
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-600 mt-0.5">
                      Pair with senior engineers from Microsoft, Google, Amazon
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <button
              onClick={handleStartInterview}
              className={`w-full py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-sm rounded-xl text-white transition-all ${
                mode === "ai"
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-600/30"
                  : "btn-primary"
              }`}
            >
              <span>{mode === "ai" ? "Launch AI Voice & Chat Interview" : "Start Live Interview"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

