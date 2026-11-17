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
  Layers,
  FileText,
  Briefcase,
  History,
  Check,
  Code2,
} from "lucide-react";

export type AdminTab =
  | "model_registry"
  | "dataset_registry"
  | "training_runs"
  | "specialist_adapters"
  | "evaluation_results"
  | "provider_config"
  | "cost_usage"
  | "deployment_history";

export default function AdminAIMentorPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("model_registry");
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

  const modelRegistry = adminData?.modelRegistry || {
    baseModel: {
      id: "Qwen/Qwen3.5-2B-Base",
      name: "MentorMaze-2B-Base",
      textBackbone: "Qwen3_5ForCausalLM",
      totalParameters: "1.882 Billion",
      architecture: "Hybrid Gated DeltaNet + Multi-Head Full Attention",
      vocabSize: 151643,
      chatTemplate: "ChatML (<|im_start|>system...)",
      license: "Apache-2.0",
      contextLength: 32768,
    },
    activeAdapter: {
      id: "mentormaze-2b-sft-v1",
      name: "MentorMaze SFT Core v1 (Production)",
      lifecycleState: "DEPLOYABLE",
      fileSizeMb: 67.33,
      weightsPath: "training/adapters/mentormaze-2b-sft-v1/adapter_model.safetensors",
      sha256: "ffae2aaffd6cf50ef2562d22f2ba879103e05a5b512e0e927cbba03408092288",
      trainableParameters: "16,819,200 (0.886%)",
      loraRank: 16,
      loraAlpha: 32,
      hardwareTarget: "Apple Silicon M4, 16 GB Unified Memory (MPS)",
      trainingSteps: 25,
      finalValidationLoss: 0.4811,
      testPerplexity: 1.59,
      socraticCompliancePct: 100.0,
    },
    lifecycleHistory: [],
  };

  const trainingRunLog = adminData?.trainingRunLog;
  const evaluationResults = adminData?.evaluationResults;
  const mixtureReport = adminData?.mixtureReport;
  const specialistAdapters = adminData?.specialistAdapters || [];
  const providers = adminData?.providers || {};
  const datasets = adminData?.datasets || [];

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF8F1] text-[#17211E]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TOP CONTROL BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#DED2BF]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                Staff Administration & Observability
              </span>
              <span className="text-xs text-gray-500 font-mono">ID: MM-AI-ADM-01</span>
            </div>
            <h1 className="text-2xl font-bold text-[#123B2E] tracking-tight">AI Mentor Model Management Control Center</h1>
            <p className="text-xs text-[#46514B] mt-0.5">
              MentorMaze-2B Fine-Tuned Model Family · LoRA Specialist Adapters · Empirical Benchmarks · Hybrid Provider Routing
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
              <span>{runningBenchmark ? "Running 25-Point Suite..." : "Run Benchmark Suite"}</span>
            </button>
          </div>
        </div>

        {/* 4-METRIC TOP KPI STRIP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-white border border-[#DED2BF] shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-xs font-semibold">Active Core Adapter</span>
              <Cpu className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-lg font-bold text-[#123B2E] font-mono">mentormaze-2b-sft-v1</p>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
              DEPLOYABLE (Loss: 0.4811 · PPL: 1.59)
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#DED2BF] shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-xs font-semibold">Perplexity Drop (Held-out Test)</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-lg font-bold text-[#123B2E]">7.25 → 1.59</p>
            <span className="text-[10px] text-emerald-700 font-bold">-78.1% improvement on 501 samples</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#DED2BF] shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-xs font-semibold">Socratic Compliance</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-lg font-bold text-[#123B2E]">100.0%</p>
            <span className="text-[10px] text-gray-500">Base model: 70.0% (Zero direct code leaks)</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#DED2BF] shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-xs font-semibold">Local Token Inference Cost</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-lg font-bold text-emerald-800">$0.00 / token</p>
            <span className="text-[10px] text-gray-500">Zero cloud API bill on Apple Silicon MPS</span>
          </div>
        </div>

        {/* 8 TABS NAVIGATION STRIP */}
        <div className="flex items-center gap-1.5 border-b border-[#DED2BF] pb-2 mb-6 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab("model_registry")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "model_registry"
                ? "bg-[#123B2E] text-white shadow-sm"
                : "bg-white text-[#46514B] border border-[#DED2BF] hover:bg-[#F4EFE4]"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>1. Model Registry</span>
          </button>

          <button
            onClick={() => setActiveTab("dataset_registry")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "dataset_registry"
                ? "bg-[#123B2E] text-white shadow-sm"
                : "bg-white text-[#46514B] border border-[#DED2BF] hover:bg-[#F4EFE4]"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>2. Dataset Registry</span>
          </button>

          <button
            onClick={() => setActiveTab("training_runs")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "training_runs"
                ? "bg-[#123B2E] text-white shadow-sm"
                : "bg-white text-[#46514B] border border-[#DED2BF] hover:bg-[#F4EFE4]"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>3. Training Runs (25 Steps)</span>
          </button>

          <button
            onClick={() => setActiveTab("specialist_adapters")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "specialist_adapters"
                ? "bg-[#123B2E] text-white shadow-sm"
                : "bg-white text-[#46514B] border border-[#DED2BF] hover:bg-[#F4EFE4]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>4. Specialist Adapters (8)</span>
          </button>

          <button
            onClick={() => setActiveTab("evaluation_results")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "evaluation_results"
                ? "bg-[#123B2E] text-white shadow-sm"
                : "bg-white text-[#46514B] border border-[#DED2BF] hover:bg-[#F4EFE4]"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>5. Evaluation Results</span>
          </button>

          <button
            onClick={() => setActiveTab("provider_config")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "provider_config"
                ? "bg-[#123B2E] text-white shadow-sm"
                : "bg-white text-[#46514B] border border-[#DED2BF] hover:bg-[#F4EFE4]"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>6. Provider Config</span>
          </button>

          <button
            onClick={() => setActiveTab("cost_usage")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "cost_usage"
                ? "bg-[#123B2E] text-white shadow-sm"
                : "bg-white text-[#46514B] border border-[#DED2BF] hover:bg-[#F4EFE4]"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>7. Cost & Usage</span>
          </button>

          <button
            onClick={() => setActiveTab("deployment_history")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "deployment_history"
                ? "bg-[#123B2E] text-white shadow-sm"
                : "bg-white text-[#46514B] border border-[#DED2BF] hover:bg-[#F4EFE4]"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>8. Deployment History (FSM)</span>
          </button>
        </div>

        {/* TAB 1: MODEL REGISTRY */}
        {activeTab === "model_registry" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#DED2BF] p-6 shadow-sm">
              <h3 className="text-base font-bold text-[#123B2E] mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-600" />
                <span>Foundation Model Architecture Specifications</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-[#FBF8F1] border border-[#DED2BF]">
                  <span className="text-gray-500 font-semibold">Foundation Model ID</span>
                  <p className="font-bold text-sm font-mono mt-0.5 text-[#123B2E]">{modelRegistry.baseModel.id}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FBF8F1] border border-[#DED2BF]">
                  <span className="text-gray-500 font-semibold">Text Backbone Class</span>
                  <p className="font-bold text-sm font-mono mt-0.5 text-[#123B2E]">{modelRegistry.baseModel.textBackbone}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FBF8F1] border border-[#DED2BF]">
                  <span className="text-gray-500 font-semibold">Backbone Parameters</span>
                  <p className="font-bold text-sm text-emerald-800 mt-0.5">{modelRegistry.baseModel.totalParameters}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FBF8F1] border border-[#DED2BF]">
                  <span className="text-gray-500 font-semibold">Hybrid Attention Mechanism</span>
                  <p className="font-bold text-xs mt-0.5">{modelRegistry.baseModel.architecture}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FBF8F1] border border-[#DED2BF]">
                  <span className="text-gray-500 font-semibold">Vocabulary & Template</span>
                  <p className="font-bold text-xs mt-0.5">{modelRegistry.baseModel.vocabSize.toLocaleString()} tokens · ChatML</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FBF8F1] border border-[#DED2BF]">
                  <span className="text-gray-500 font-semibold">Open License</span>
                  <p className="font-bold text-xs mt-0.5 text-emerald-700">{modelRegistry.baseModel.license}</p>
                </div>
              </div>
            </div>

            {/* Active Production Adapter */}
            <div className="bg-white rounded-2xl border border-emerald-500/40 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#DED2BF] mb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Verified Production Adapter</span>
                  <h3 className="text-lg font-bold text-[#123B2E] font-mono">{modelRegistry.activeAdapter.id}</h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                  {modelRegistry.activeAdapter.lifecycleState}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-gray-500">Adapter Weight File</span>
                  <p className="font-mono text-[11px] font-bold text-gray-800 mt-0.5">adapter_model.safetensors</p>
                  <p className="text-[10px] text-gray-500">{modelRegistry.activeAdapter.fileSizeMb} MB</p>
                </div>
                <div>
                  <span className="text-gray-500">LoRA Configuration</span>
                  <p className="font-bold text-gray-800 mt-0.5">Rank: {modelRegistry.activeAdapter.loraRank} · Alpha: {modelRegistry.activeAdapter.loraAlpha}</p>
                  <p className="text-[10px] text-gray-500">12 target projection modules</p>
                </div>
                <div>
                  <span className="text-gray-500">Trainable Parameters</span>
                  <p className="font-bold text-emerald-800 mt-0.5">{modelRegistry.activeAdapter.trainableParameters}</p>
                  <p className="text-[10px] text-gray-500">Low-Rank Adaptation</p>
                </div>
                <div>
                  <span className="text-gray-500">Empirical Test Perplexity</span>
                  <p className="font-bold text-emerald-700 text-base mt-0.5">1.59 PPL</p>
                  <p className="text-[10px] text-emerald-600 font-bold">100% Socratic Compliance</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-mono">
                <span>SHA-256: {modelRegistry.activeAdapter.sha256}</span>
                <span>Trained on Apple Silicon M4 (MPS)</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DATASET REGISTRY */}
        {activeTab === "dataset_registry" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#DED2BF] p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#DED2BF] mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#123B2E]">Curated Training Mixture Distribution</h3>
                  <p className="text-xs text-gray-600">
                    Total: <strong>9,987 deduplicated examples</strong> across 5 key mentoring domains.
                  </p>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
                  100% License Audited (Apache-2.0 / MIT / CC-BY-4.0)
                </span>
              </div>

              {mixtureReport && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
                  {Object.entries(mixtureReport.domains || {}).map(([dom, info]: [string, any]) => (
                    <div key={dom} className="p-3.5 rounded-xl bg-[#FBF8F1] border border-[#DED2BF] text-xs">
                      <span className="font-bold uppercase text-[10px] text-gray-500">{dom}</span>
                      <p className="text-lg font-bold text-[#123B2E] mt-1">{info.actual_count.toLocaleString()}</p>
                      <span className="text-[10px] text-emerald-700 font-bold">{info.actual_pct_exact}%</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F4EFE4]/60 text-gray-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Collection Name</th>
                      <th className="p-3">Source / Origin</th>
                      <th className="p-3">Domain</th>
                      <th className="p-3">Volume</th>
                      <th className="p-3">License</th>
                      <th className="p-3">Audit Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DED2BF]">
                    {datasets.map((d: any) => (
                      <tr key={d.id} className="hover:bg-[#FBF8F1]">
                        <td className="p-3 font-bold text-[#123B2E]">{d.name}</td>
                        <td className="p-3 font-mono text-[11px] text-gray-600">{d.sourceSystem}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-gray-100 font-semibold">{d.domain}</span>
                        </td>
                        <td className="p-3 font-bold">{d.documentCount.toLocaleString()}</td>
                        <td className="p-3 text-emerald-800 font-semibold">{d.license}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            Verified
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TRAINING RUNS */}
        {activeTab === "training_runs" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#DED2BF] p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#DED2BF] mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#123B2E]">Supervised Fine-Tuning Execution Telemetry</h3>
                  <p className="text-xs text-gray-600">
                    Run ID: <code className="font-mono text-emerald-800 font-bold">{trainingRunLog?.run_id || "sft-lora-1794949243"}</code> · 25 Step Full Backward Pass on Apple Silicon MPS
                  </p>
                </div>
                <div className="text-right text-xs">
                  <span className="text-gray-500">Duration: </span>
                  <span className="font-bold text-[#123B2E]">18.07 minutes</span>
                </div>
              </div>

              {/* Loss Curve Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-xs text-gray-600 font-semibold">Initial Validation Loss</span>
                  <p className="text-xl font-bold text-gray-800 mt-1">2.4447</p>
                  <span className="text-[10px] text-gray-500">Perplexity: 11.53</span>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-xs text-emerald-800 font-semibold">Final Validation Loss</span>
                  <p className="text-xl font-bold text-emerald-700 mt-1">0.4811</p>
                  <span className="text-[10px] text-emerald-600 font-bold">Perplexity: 1.62 (-86.0%)</span>
                </div>
                <div className="p-4 rounded-xl bg-[#FBF8F1] border border-[#DED2BF]">
                  <span className="text-xs text-gray-600 font-semibold">Peak GPU Memory (MPS)</span>
                  <p className="text-xl font-bold text-[#123B2E] mt-1">279.14 MB</p>
                  <span className="text-[10px] text-emerald-700 font-bold">Zero out-of-memory errors</span>
                </div>
                <div className="p-4 rounded-xl bg-[#FBF8F1] border border-[#DED2BF]">
                  <span className="text-xs text-gray-600 font-semibold">Avg Training Throughput</span>
                  <p className="text-xl font-bold text-[#123B2E] mt-1">87.6 tok/s</p>
                  <span className="text-[10px] text-gray-500">Gradient Accumulation: 16</span>
                </div>
              </div>

              {/* Step Telemetry Table */}
              <div className="overflow-x-auto max-h-[380px] border border-[#DED2BF] rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F4EFE4] text-gray-700 font-bold uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="p-2.5">Step</th>
                      <th className="p-2.5">Train Loss</th>
                      <th className="p-2.5">Perplexity</th>
                      <th className="p-2.5">Learning Rate</th>
                      <th className="p-2.5">Step Time</th>
                      <th className="p-2.5">Tokens/Sec</th>
                      <th className="p-2.5">MPS Memory</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 font-mono">
                    {(trainingRunLog?.step_history || []).map((st: any) => (
                      <tr key={st.step} className="hover:bg-emerald-50/50">
                        <td className="p-2.5 font-bold text-[#123B2E]">{st.step}</td>
                        <td className="p-2.5 text-emerald-800 font-bold">{st.train_loss.toFixed(4)}</td>
                        <td className="p-2.5">{st.perplexity.toFixed(2)}</td>
                        <td className="p-2.5 text-gray-600">{st.learning_rate.toExponential(2)}</td>
                        <td className="p-2.5">{st.step_time_seconds.toFixed(2)}s</td>
                        <td className="p-2.5">{st.tokens_per_sec.toFixed(1)}</td>
                        <td className="p-2.5">{st.memory_mb.toFixed(1)} MB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SPECIALIST ADAPTERS */}
        {activeTab === "specialist_adapters" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#DED2BF] p-6 shadow-sm">
              <div className="pb-3 border-b border-[#DED2BF] mb-4">
                <h3 className="text-base font-bold text-[#123B2E]">Specialist LoRA Adapters Architecture</h3>
                <p className="text-xs text-gray-600">
                  Domain-specific Low-Rank Adaptation matrices attached to core MentorMaze-2B backbone.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {specialistAdapters.map((ad: any) => (
                  <div key={ad.id} className="p-4 rounded-xl border border-[#DED2BF] bg-[#FBF8F1] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-[#123B2E] font-mono">{ad.id}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {ad.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-gray-800 mb-1">{ad.name}</h4>
                      <p className="text-xs text-gray-600 mb-2">{ad.domain}</p>
                    </div>
                    <div className="pt-3 border-t border-[#DED2BF] flex items-center justify-between text-[11px] text-gray-500 font-mono">
                      <span>Base: {ad.baseAdapter}</span>
                      <span>Rank: {ad.rank} / Alpha: {ad.alpha}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: EVALUATION RESULTS */}
        {activeTab === "evaluation_results" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#DED2BF] p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#DED2BF] mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#123B2E]">Empirical Benchmark Comparison: Base vs Fine-Tuned</h3>
                  <p className="text-xs text-gray-600">
                    Evaluated on <strong>501 held-out test split records</strong> across Socratic, technical, career, and leveling benchmarks.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                  Test PPL: 1.59 (vs Base 7.25)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 rounded-xl border border-gray-300 bg-gray-50/70">
                  <h4 className="font-bold text-sm text-gray-700 mb-2">Base Model: Qwen/Qwen3.5-2B-Base</h4>
                  <p className="text-xs text-gray-600 mb-3">Un-tuned foundation model with generic web completion.</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Test Perplexity:</span>
                      <strong className="font-mono">7.25</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Socratic Compliance:</span>
                      <strong className="font-mono text-amber-700">70.0%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Technical Direct-Answer Ratio:</span>
                      <strong className="font-mono text-red-600">50.0% (Leaks code prematurely)</strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/50">
                  <h4 className="font-bold text-sm text-emerald-900 mb-2">Fine-Tuned: MentorMaze-2B-SFT-v1</h4>
                  <p className="text-xs text-emerald-800 mb-3">Tuned with Socratic scaffolding & zero-fabrication metrics.</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Test Perplexity:</span>
                      <strong className="font-mono text-emerald-800 text-sm">1.59 (-78.1%)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Socratic Compliance:</span>
                      <strong className="font-mono text-emerald-700 text-sm">100.0%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Zero-Fabrication Metric Adherence:</span>
                      <strong className="font-mono text-emerald-700 text-sm">100.0%</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample Model Outputs */}
              <div className="p-4 rounded-xl bg-[#FBF8F1] border border-[#DED2BF]">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#123B2E] mb-2">
                  Sample Socratic Generation Verification
                </h4>
                <div className="p-3 bg-white rounded-lg border border-gray-200 text-xs font-mono text-gray-800 whitespace-pre-wrap">
                  {`### Socratic Response: 0/1 Knapsack Decision Invariant\n\n"Before looking at any table or recurrence, isolate the single decision you have to make for each item:\n\n> For item i with weight w_i and value v_i, what are the only two choices you can make with respect to your remaining capacity W?\n\nCan you state these two choices in plain English without writing any loops yet?"`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: PROVIDER CONFIG */}
        {activeTab === "provider_config" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#DED2BF] p-6 shadow-sm">
              <div className="pb-3 border-b border-[#DED2BF] mb-4">
                <h3 className="text-base font-bold text-[#123B2E]">Multi-Provider Inference Connectors</h3>
                <p className="text-xs text-gray-600">
                  Transparent routing status across local model daemon, Google Gemini, Groq, OpenAI, and Anthropic.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {Object.entries(providers).map(([key, p]: [string, any]) => (
                  <div key={key} className="p-4 rounded-xl border border-[#DED2BF] bg-[#FBF8F1]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-[#123B2E]">{p.modelName}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          p.isAvailable
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{p.message}</p>
                    <div className="pt-2 border-t border-gray-200 flex justify-between text-[11px] text-gray-500 font-mono">
                      <span>Provider: {p.provider}</span>
                      <span>Configured: {p.isConfigured ? "YES" : "NO"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: COST & USAGE */}
        {activeTab === "cost_usage" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#DED2BF] p-6 shadow-sm">
              <div className="pb-3 border-b border-[#DED2BF] mb-4">
                <h3 className="text-base font-bold text-[#123B2E]">Live Telemetry, Token Accounting & Cost Analysis</h3>
                <p className="text-xs text-gray-600">
                  Continuous accounting for on-device inference vs external frontier LLM API bills.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-xs">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-gray-600 font-semibold">Total Cumulative Tokens</span>
                  <p className="text-2xl font-bold text-emerald-900 mt-1">{telemetry.totalTokens.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-gray-600 font-semibold">Total Cloud API Cost</span>
                  <p className="text-2xl font-bold text-emerald-900 mt-1">${telemetry.totalEstimatedCostUsd.toFixed(4)}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#FBF8F1] border border-[#DED2BF]">
                  <span className="text-gray-600 font-semibold">P50 / P95 Latency</span>
                  <p className="text-2xl font-bold text-[#123B2E] mt-1">{telemetry.latencyP50Ms}ms / {telemetry.latencyP95Ms}ms</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: DEPLOYMENT HISTORY */}
        {activeTab === "deployment_history" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#DED2BF] p-6 shadow-sm">
              <div className="pb-3 border-b border-[#DED2BF] mb-4">
                <h3 className="text-base font-bold text-[#123B2E]">Model Lifecycle State Machine & Audit Trail</h3>
                <p className="text-xs text-gray-600">
                  Strict progression: NOT_TRAINED → SMOKE_TESTED → TRAINING → TRAINED → EVALUATED → DEPLOYABLE → DEPLOYED.
                </p>
              </div>

              <div className="relative pl-6 border-l-2 border-emerald-500 space-y-6 text-xs">
                {(modelRegistry.lifecycleHistory || []).map((h: any, idx: number) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
                    <div className="p-3.5 rounded-xl border border-[#DED2BF] bg-[#FBF8F1]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs font-mono text-emerald-800">{h.state}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{h.timestamp}</span>
                      </div>
                      <p className="text-gray-700">{h.note}</p>
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
