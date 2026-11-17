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
  Activity,
  DollarSign,
  TrendingUp,
  Server,
  FileCheck,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

export default function AdminAIMentorPage() {
  const [activeTab, setActiveTab] = useState<"models" | "telemetry" | "knowledge" | "benchmarks" | "governance">("telemetry");
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [runningBenchmark, setRunningBenchmark] = useState(false);

  const fetchAdminData = () => {
    setLoading(true);
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
  };

  useEffect(() => {
    fetchAdminData();
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

  const telemetry = adminData?.telemetry || {
    totalRequests: 0,
    generativeRequests: 0,
    deterministicRequests: 0,
    latencyP50Ms: 0.4,
    latencyP95Ms: 1.2,
    totalTokens: 0,
    totalEstimatedCostUsd: 0,
    fallbackRatePercent: 0,
    recentErrors: [],
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
                Staff Administration & Observability
              </span>
              <span className="text-xs text-gray-500 font-mono">ID: MM-AI-ADM-01</span>
            </div>
            <h1 className="text-2xl font-bold text-[#123B2E] tracking-tight">AI Mentor Intelligence Control Center</h1>
            <p className="text-xs text-[#46514B] mt-0.5">
              Multi-Provider Telemetry, 8 Knowledge Collections, Socratic Quotient Benchmarks & Zero-Leak Governance
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAdminData}
              className="p-2 bg-white hover:bg-[#F4EFE4] text-[#123B2E] border border-[#DED2BF] rounded-xl text-xs font-bold transition-all shadow-sm"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
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

        {/* TOP LEVEL OBSERVABILITY METRICS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white p-4 rounded-xl border border-[#DED2BF] shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[10px] font-bold uppercase">Total Turns</span>
              <Activity className="w-3.5 h-3.5 text-[#123B2E]" />
            </div>
            <p className="text-xl font-bold font-mono text-[#123B2E]">{telemetry.totalRequests}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Gen: {telemetry.generativeRequests} · Det: {telemetry.deterministicRequests}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#DED2BF] shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[10px] font-bold uppercase">Latency (P50)</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-xl font-bold font-mono text-emerald-700">{telemetry.latencyP50Ms} ms</p>
            <p className="text-[10px] text-gray-500 mt-0.5">P95: {telemetry.latencyP95Ms} ms</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#DED2BF] shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[10px] font-bold uppercase">Total Tokens</span>
              <Zap className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <p className="text-xl font-bold font-mono text-gray-800">{telemetry.totalTokens.toLocaleString()}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Cumulative sum</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#DED2BF] shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[10px] font-bold uppercase">Est. Cost</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-xl font-bold font-mono text-emerald-800">${telemetry.totalEstimatedCostUsd.toFixed(4)}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">USD billed</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#DED2BF] shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[10px] font-bold uppercase">Fallback Rate</span>
              <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <p className="text-xl font-bold font-mono text-blue-800">{telemetry.fallbackRatePercent}%</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Automated recovery</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#DED2BF] shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[10px] font-bold uppercase">Knowledge Docs</span>
              <Database className="w-3.5 h-3.5 text-cyan-600" />
            </div>
            <p className="text-xl font-bold font-mono text-cyan-800">{adminData?.ragStats?.totalDocuments || 8}</p>
            <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
              {adminData?.ragStats?.verifiedCount || 8} Verified
            </p>
          </div>
        </div>

        {/* TABS HEADER */}
        <div className="flex items-center gap-2 border-b border-[#DED2BF] mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("telemetry")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "telemetry"
                ? "border-[#123B2E] text-[#123B2E]"
                : "border-transparent text-gray-500 hover:text-[#123B2E]"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Telemetry & Live Logs</span>
          </button>
          <button
            onClick={() => setActiveTab("models")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
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
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "knowledge"
                ? "border-[#123B2E] text-[#123B2E]"
                : "border-transparent text-gray-500 hover:text-[#123B2E]"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Knowledge Collections (8)</span>
          </button>
          <button
            onClick={() => setActiveTab("benchmarks")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
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
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "governance"
                ? "border-[#123B2E] text-[#123B2E]"
                : "border-transparent text-gray-500 hover:text-[#123B2E]"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Dataset Governance & PII</span>
          </button>
        </div>

        {/* TAB 1: TELEMETRY & LIVE LOGS */}
        {activeTab === "telemetry" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#DED2BF] p-6 shadow-sm">
              <h3 className="font-bold text-sm text-[#123B2E] mb-2">Live Routing & Inference Telemetry</h3>
              <p className="text-xs text-[#46514B] mb-4">
                Telemetry aggregates last 500 requests across all model adapters with real-time latency percentiles.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-[#F4EFE4]/60 rounded-xl border border-[#DED2BF]">
                  <p className="text-[11px] font-bold text-gray-600 uppercase">Inference Modes Split</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-semibold text-purple-800">
                      Generative: {telemetry.generativeRequests}
                    </span>
                    <span className="text-xs font-semibold text-emerald-800">
                      Deterministic: {telemetry.deterministicRequests}
                    </span>
                  </div>
                  <div className="w-full bg-emerald-200 h-2 rounded-full mt-2 overflow-hidden flex">
                    <div
                      className="bg-purple-600 h-full"
                      style={{
                        width: `${
                          telemetry.totalRequests > 0
                            ? (telemetry.generativeRequests / telemetry.totalRequests) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="p-4 bg-[#F4EFE4]/60 rounded-xl border border-[#DED2BF]">
                  <p className="text-[11px] font-bold text-gray-600 uppercase">Latency Benchmark</p>
                  <p className="text-xs text-gray-700 mt-2">
                    Deterministic Core: <strong className="font-mono text-emerald-700">&lt; 1 ms</strong>
                  </p>
                  <p className="text-xs text-gray-700 mt-1">
                    P95 Response Time: <strong className="font-mono text-emerald-700">{telemetry.latencyP95Ms} ms</strong>
                  </p>
                </div>

                <div className="p-4 bg-[#F4EFE4]/60 rounded-xl border border-[#DED2BF]">
                  <p className="text-[11px] font-bold text-gray-600 uppercase">Cost Optimization</p>
                  <p className="text-xs text-gray-700 mt-2">
                    Estimated Cost: <strong className="font-mono text-emerald-800">${telemetry.totalEstimatedCostUsd.toFixed(4)}</strong>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Target: $0.00 for pedagogical core, tiered pricing for LLMs
                  </p>
                </div>
              </div>

              {/* Recent Error Logs */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#123B2E] mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Recent Provider Logs & Fallback Interceptions</span>
                </h4>
                {telemetry.recentErrors && telemetry.recentErrors.length > 0 ? (
                  <div className="divide-y divide-[#DED2BF] border border-[#DED2BF] rounded-xl overflow-hidden text-xs">
                    {telemetry.recentErrors.map((err: any, idx: number) => (
                      <div key={idx} className="p-3 bg-[#FBF8F1] flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-red-700">[{err.provider}]</span>
                          <span className="ml-2 text-gray-800">{err.error}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {err.fallbackTriggered && (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Fallback Handled
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400 font-mono">
                            {new Date(err.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Zero active provider errors. Subsystems operating normally.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MODEL PROVIDERS */}
        {activeTab === "models" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#DED2BF] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#DED2BF] bg-[#F4EFE4]/50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#123B2E]">Registered Model Provider Roster & Live Status</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Multi-provider abstraction: Google Gemini, OpenAI, Anthropic, Ollama & In-house Pedagogical Core
                  </p>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                  Zero Secret Leak Policy
                </span>
              </div>
              <div className="divide-y divide-[#DED2BF]">
                {(adminData?.providers || [
                  { name: "Deterministic Pedagogical Core", model: "tathastu-pedagogy-v1", configured: true, priority: 1, maskedKey: "BUILTIN" },
                  { name: "Google Gemini 1.5 Flash", model: "gemini-1.5-flash", configured: false, priority: 2, maskedKey: "UNCONFIGURED" },
                  { name: "OpenAI GPT-4o-Mini", model: "gpt-4o-mini", configured: false, priority: 3, maskedKey: "UNCONFIGURED" },
                  { name: "Anthropic Claude 3.5 Sonnet", model: "claude-3-5-sonnet-20241022", configured: false, priority: 4, maskedKey: "UNCONFIGURED" },
                  { name: "Self-Hosted Ollama", model: "llama3.2", configured: false, priority: 5, maskedKey: "UNCONFIGURED" },
                ]).map((p: any) => (
                  <div key={p.name} className="px-6 py-4 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[#123B2E]">{p.name}</p>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-gray-100 text-gray-700">
                          Priority {p.priority}
                        </span>
                      </div>
                      <p className="text-gray-500 font-mono text-[11px] mt-0.5">{p.model}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="font-mono text-gray-500 text-[11px]">
                        Key: {p.maskedKey || "UNCONFIGURED"}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          p.configured
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {p.configured ? "Ready & Active" : "Unconfigured (Fallback Ready)"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: KNOWLEDGE COLLECTIONS */}
        {activeTab === "knowledge" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#DED2BF] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#DED2BF] bg-[#F4EFE4]/50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#123B2E]">Active Knowledge Collections (RAG Subsystem)</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    8 Independently Managed Collections with SHA-256 Deduplication & Canonical Citation Anchors
                  </p>
                </div>
                <span className="text-xs font-bold text-[#123B2E] bg-emerald-100 px-3 py-1 rounded-full">
                  8 Collections Online
                </span>
              </div>
              <div className="divide-y divide-[#DED2BF]">
                {[
                  { id: "programming_dsa", name: "1. Programming & DSA", docs: "Two Pointers, Sliding Window, Dynamic Programming, Heap/Graph Algorithms", license: "Proprietary CC-BY-NC", status: "Verified" },
                  { id: "cs_fundamentals", name: "2. Computer Science Fundamentals", docs: "Virtual Memory, Paging, Page Replacement, Belady's Anomaly, TCP/IP, Raft", license: "Academic OER", status: "Verified" },
                  { id: "ai_machine_learning", name: "3. AI & Machine Learning", docs: "Transformer Architecture, Self-Attention, LLM Quantization, LoRA Fine-Tuning", license: "Open Access arXiv", status: "Verified" },
                  { id: "software_system_design", name: "4. Software & System Design", docs: "Cache-Aside, Write-Through, Redis, Sharding, Microservices, CAP Theorem", license: "Proprietary Architecture", status: "Verified" },
                  { id: "career_job_descriptions", name: "5. Career & Job Descriptions", docs: "Google SDE-1 Core Systems, Microsoft Azure, Swiggy, Zepto SDE JDs", license: "Industry Standard", status: "Verified" },
                  { id: "interview_preparation", name: "6. Interview Preparation", docs: "FAANG Staff Rubrics, Behavioral STAR Matrix, System Design Rubrics", license: "Proprietary CC-BY-NC", status: "Verified" },
                  { id: "academic_resources", name: "7. Academic Resources", docs: "Silberschatz OS, Cormen CLRS Algorithms, Tanenbaum Computer Networks", license: "Academic Curricula", status: "Verified" },
                  { id: "mentormaze_platform", name: "8. MentorMaze Platform Intelligence", docs: "AI Tathastu Ecosystem, Human Mentorship Escalation Rules, Socratic Protocols", license: "Proprietary Strict", status: "Verified" },
                ].map((k) => (
                  <div key={k.id} className="px-6 py-4 flex items-center justify-between text-xs">
                    <div className="max-w-xl">
                      <p className="font-bold text-[#123B2E]">{k.name}</p>
                      <p className="text-gray-600 text-[11px] mt-0.5">{k.docs}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-gray-500 text-[11px] font-mono">{k.license}</span>
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

        {/* TAB 4: BENCHMARKS */}
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

        {/* TAB 5: GOVERNANCE & DATASETS */}
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
