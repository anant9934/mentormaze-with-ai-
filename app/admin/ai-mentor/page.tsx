"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  BrainCircuit,
  Database,
  Cpu,
  ShieldCheck,
  Award,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Settings,
  BookOpen,
  Zap,
  BarChart3,
  Lock,
} from "lucide-react";

export default function AdminAIMentorPage() {
  const [activeTab, setActiveTab] = useState<"models" | "knowledge" | "benchmarks" | "governance">("models");
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [runningBenchmark, setRunningBenchmark] = useState(false);

  useEffect(() => {
    fetch("/api/admin/ai-mentor")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setAdminData(d.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleRunBenchmark = async () => {
    setRunningBenchmark(true);
    try {
      const res = await fetch("/api/ai-mentor/eval", { method: "POST" });
      const data = await res.json();
      if (data.success && data.benchmark) {
        setAdminData((prev: any) => ({
          ...prev,
          benchmark: data.benchmark,
        }));
      }
    } catch (err) {
      console.error(err);
    }
    setRunningBenchmark(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF8F1] text-[#17211E]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#DED2BF]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                Staff Administration
              </span>
              <span className="text-xs text-gray-500 font-mono">ID: MM-AI-ADM-01</span>
            </div>
            <h1 className="text-2xl font-bold text-[#123B2E] tracking-tight">AI Mentor Intelligence Control Center</h1>
            <p className="text-xs text-[#46514B] mt-0.5">
              Multi-Provider Routing, Knowledge Collections, Socratic Quotient Benchmarks, and Dataset Governance
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunBenchmark}
              disabled={runningBenchmark}
              className="px-4 py-2 bg-[#123B2E] hover:bg-[#174B39] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <Play className={`w-3.5 h-3.5 text-emerald-400 ${runningBenchmark ? "animate-spin" : ""}`} />
              <span>{runningBenchmark ? "Evaluating Holdout Set..." : "Run Benchmark Suite"}</span>
            </button>
            <Link
              href="/ai-mentor"
              className="px-4 py-2 bg-white hover:bg-[#F4EFE4] text-[#123B2E] border border-[#DED2BF] rounded-xl text-xs font-bold transition-all"
            >
              View Student Workspace
            </Link>
          </div>
        </div>

        {/* TABS HEADER */}
        <div className="flex items-center gap-2 border-b border-[#DED2BF] mb-6">
          <button
            onClick={() => setActiveTab("models")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "models"
                ? "border-[#123B2E] text-[#123B2E]"
                : "border-transparent text-gray-500 hover:text-[#123B2E]"
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Model Providers</span>
          </button>
          <button
            onClick={() => setActiveTab("knowledge")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "knowledge"
                ? "border-[#123B2E] text-[#123B2E]"
                : "border-transparent text-gray-500 hover:text-[#123B2E]"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Knowledge Collections</span>
          </button>
          <button
            onClick={() => setActiveTab("benchmarks")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "benchmarks"
                ? "border-[#123B2E] text-[#123B2E]"
                : "border-transparent text-gray-500 hover:text-[#123B2E]"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Evaluation & Socratic Quotient</span>
          </button>
          <button
            onClick={() => setActiveTab("governance")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "governance"
                ? "border-[#123B2E] text-[#123B2E]"
                : "border-transparent text-gray-500 hover:text-[#123B2E]"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Dataset Governance & PII</span>
          </button>
        </div>

        {/* TAB 1: MODEL PROVIDERS */}
        {activeTab === "models" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-[#DED2BF] shadow-sm">
                <p className="text-[11px] text-gray-500 font-bold uppercase">Primary In-House Model</p>
                <p className="text-xl font-bold text-[#123B2E] mt-1">tathastu-pedagogy-v1</p>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Sub-1ms Latency · Guaranteed 100% Uptime</span>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-[#DED2BF] shadow-sm">
                <p className="text-[11px] text-gray-500 font-bold uppercase">External Fallbacks</p>
                <p className="text-xl font-bold text-[#123B2E] mt-1">Gemini & OpenAI Adapters</p>
                <p className="text-xs text-gray-600 mt-2">
                  Configured via server-side secrets · Zero data leak policy
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-[#DED2BF] shadow-sm">
                <p className="text-[11px] text-gray-500 font-bold uppercase">Privacy Boundary</p>
                <p className="text-xl font-bold text-emerald-700 mt-1">Enforced</p>
                <p className="text-xs text-gray-600 mt-2">
                  No student chats used for external provider training
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#DED2BF] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#DED2BF] bg-[#F4EFE4]/50">
                <h3 className="font-bold text-sm text-[#123B2E]">Registered Model Provider Roster</h3>
              </div>
              <div className="divide-y divide-[#DED2BF]">
                {[
                  { name: "Local Deterministic Pedagogical Core", model: "tathastu-pedagogy-v1", status: "Active (Primary)", latency: "< 1ms", priority: 1 },
                  { name: "Google Gemini 1.5 Flash Adapter", model: "gemini-1.5-flash", status: "Ready (Key Dependent)", latency: "~450ms", priority: 2 },
                  { name: "OpenAI GPT-4o-Mini Adapter", model: "gpt-4o-mini", status: "Ready (Key Dependent)", latency: "~600ms", priority: 3 },
                  { name: "Anthropic Claude 3.5 Sonnet Adapter", model: "claude-3-5-sonnet", status: "Ready (Key Dependent)", latency: "~800ms", priority: 4 },
                  { name: "Self-Hosted Ollama Cluster", model: "llama3.2:latest", status: "Standby (Local Docker)", latency: "~120ms", priority: 5 },
                ].map((p) => (
                  <div key={p.name} className="px-6 py-4 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#123B2E]">{p.name}</p>
                      <p className="text-gray-500 font-mono text-[11px]">{p.model}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="font-mono text-gray-600">{p.latency}</span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KNOWLEDGE COLLECTIONS */}
        {activeTab === "knowledge" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#DED2BF] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#DED2BF] bg-[#F4EFE4]/50">
                <h3 className="font-bold text-sm text-[#123B2E]">Active Knowledge Collections (RAG Subsystem)</h3>
              </div>
              <div className="divide-y divide-[#DED2BF]">
                {[
                  { name: "Collection 1: Technical Knowledge", docs: "Two Pointers, Cache-Aside, Redis, System Design", license: "Proprietary CC-BY-NC", status: "Verified" },
                  { name: "Collection 2: Academic Knowledge", docs: "Operating Systems, Virtual Memory, Belady's Anomaly", license: "Open Academic OER", status: "Verified" },
                  { name: "Collection 3: Career Intelligence", docs: "SDE-1 Hiring Competencies, Tier-1 Tech JDs", license: "Proprietary Tathastu", status: "Verified" },
                  { name: "Collection 4: Interview Preparation", docs: "Behavioral STAR, Two-Sum, LRU Cache Rubrics", license: "Proprietary CC-BY-NC", status: "Verified" },
                  { name: "Collection 5: MentorMaze Proprietary", docs: "Socratic Quotient Scaffolding & Productive Struggle", license: "Proprietary Strict", status: "Verified" },
                ].map((k) => (
                  <div key={k.name} className="px-6 py-4 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#123B2E]">{k.name}</p>
                      <p className="text-gray-600 text-[11px]">{k.docs}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-gray-500 text-[11px]">{k.license}</span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {k.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BENCHMARKS */}
        {activeTab === "benchmarks" && adminData?.benchmark && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-[#DED2BF] shadow-sm text-center">
                <p className="text-[11px] text-gray-500 font-bold uppercase">Technical Accuracy</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{adminData.benchmark.technicalAccuracyScore}%</p>
                <p className="text-[10px] text-gray-500 mt-1">Holdout verification</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-[#DED2BF] shadow-sm text-center">
                <p className="text-[11px] text-gray-500 font-bold uppercase">Socratic Quotient</p>
                <p className="text-2xl font-bold text-[#123B2E] mt-1">{adminData.benchmark.socraticQuotientScore}%</p>
                <p className="text-[10px] text-gray-500 mt-1">Productive struggle index</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-[#DED2BF] shadow-sm text-center">
                <p className="text-[11px] text-gray-500 font-bold uppercase">RAG Groundedness</p>
                <p className="text-2xl font-bold text-cyan-700 mt-1">{adminData.benchmark.groundednessScore}%</p>
                <p className="text-[10px] text-gray-500 mt-1">Source attributed</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-[#DED2BF] shadow-sm text-center">
                <p className="text-[11px] text-gray-500 font-bold uppercase">Hallucination Rate</p>
                <p className="text-2xl font-bold text-emerald-800 mt-1">{adminData.benchmark.hallucinationRate}%</p>
                <p className="text-[10px] text-gray-500 mt-1">Strict zero-fabrication</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#DED2BF] shadow-sm">
              <h3 className="font-bold text-sm text-[#123B2E] mb-3">Baseline Comparison Proofs</h3>
              <div className="space-y-3">
                {adminData.benchmark.baselineComparison.map((b: any) => (
                  <div key={b.baselineName} className="p-4 bg-[#F4EFE4] rounded-xl border border-[#DED2BF] flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#123B2E]">{b.baselineName}</p>
                      <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">{b.accuracyDelta}</p>
                    </div>
                    <span className="font-mono text-emerald-800 font-bold">{b.socraticQuotientDelta}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GOVERNANCE & DATASETS */}
        {activeTab === "governance" && adminData?.datasets && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#DED2BF] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#DED2BF] bg-[#F4EFE4]/50">
                <h3 className="font-bold text-sm text-[#123B2E]">Dataset Licensing & Governance Registry</h3>
              </div>
              <div className="divide-y divide-[#DED2BF]">
                {adminData.datasets.map((d: any) => (
                  <div key={d.id} className="px-6 py-4 flex items-center justify-between text-xs">
                    <div className="max-w-xl">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[#123B2E]">{d.name}</p>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                          {d.license}
                        </span>
                      </div>
                      <p className="text-gray-600 text-[11px] mt-1">{d.reasoning}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        d.approvalStatus === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : d.approvalStatus === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {d.approvalStatus.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
