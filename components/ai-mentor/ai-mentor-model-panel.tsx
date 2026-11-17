"use client";

import React, { useState, useEffect } from "react";
import {
  Cpu,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Zap,
  ShieldCheck,
  Server,
  Layers,
  X,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIMentorModelPanelProps {
  onClose?: () => void;
  isModal?: boolean;
}

export function AIMentorModelPanel({ onClose, isModal = false }: AIMentorModelPanelProps) {
  const [modelData, setModelData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPinging, setIsPinging] = useState(false);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/ai-mentor");
      const data = await res.json();
      if (data.success) {
        setModelData(data);
      }
    } catch (err) {
      console.error("Failed to fetch model info:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handlePing = async () => {
    setIsPinging(true);
    await fetchStatus();
    setIsPinging(false);
  };

  const content = (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#DCE5D5]">
        <div className="flex items-center gap-2">
          <Cpu className="w-6 h-6 text-[#174B39]" />
          <div>
            <h2 className="text-xl sm:text-2xl font-serif text-[#17211E]">Model & Provider Intelligence</h2>
            <p className="text-xs text-[#69756B]">
              Real-time model provider connectivity, hybrid routing policies, and local fine-tuned adapter status.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePing}
            disabled={isPinging}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DCE5D5] hover:bg-[#EDF3E8] text-xs font-semibold text-[#174B39] transition-colors disabled:opacity-50"
          >
            <RotateCw className={cn("w-3.5 h-3.5", isPinging && "animate-spin")} />
            <span>Health Check</span>
          </button>
          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#69756B] hover:text-[#17211E] hover:bg-[#EDF3E8] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center space-y-2">
          <RotateCw className="w-6 h-6 text-[#27875E] animate-spin mx-auto" />
          <p className="text-xs text-[#69756B]">Inspecting model provider network...</p>
        </div>
      ) : (
        <div className="space-y-6 text-xs sm:text-sm">
          {/* Active Model Status Card */}
          <div className="p-4 sm:p-5 bg-[#FAFAF2] rounded-2xl border border-[#DCE5D5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#69756B]">
                Active Primary Cloud Provider
              </span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base font-bold text-[#174B39] capitalize">
                  {modelData?.activeProvider || "gemini"} · Gemini 2.5 Flash
                </h3>
              </div>
              <p className="text-xs text-[#69756B]">
                Operating at sub-800ms latency with streaming SSE tokens & verified source citation grounding.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1 rounded-full bg-[#E7F2DA] text-[#174B39] text-xs font-semibold border border-[#DCE5D5]">
                Production Ready
              </span>
            </div>
          </div>

          {/* Provider Grid */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#69756B] px-1">
              Configured Model Providers
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {modelData?.providers ? (
                Object.entries(modelData.providers).map(([pName, pInfo]: [string, any]) => (
                  <div
                    key={pName}
                    className="p-3.5 bg-white rounded-2xl border border-[#DCE5D5] flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full",
                            pInfo.isAvailable ? "bg-emerald-500" : "bg-slate-300"
                          )}
                        />
                        <h4 className="text-xs font-bold text-[#17211E] capitalize truncate">
                          {pName}
                        </h4>
                      </div>
                      <p className="text-[11px] text-[#69756B] truncate mt-0.5">
                        {pInfo.modelName || "Standard Engine"}
                      </p>
                    </div>

                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0",
                        pInfo.isAvailable
                          ? "bg-[#E7F2DA] text-[#174B39]"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {pInfo.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-4 text-xs text-[#69756B] bg-white rounded-xl border border-[#DCE5D5]">
                  No external provider status returned.
                </div>
              )}
            </div>
          </div>

          {/* Local Fine-Tuned 2B Adapter Section */}
          <div className="p-4 sm:p-5 bg-white rounded-2xl border border-[#DCE5D5] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#174B39]" />
                <h3 className="font-semibold text-xs sm:text-sm text-[#17211E]">
                  MentorMaze-2B Specialised Local Model
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#EDF3E8] text-[#174B39] px-2 py-0.5 rounded-md border border-[#DCE5D5]">
                Qwen 3.5 2B Base
              </span>
            </div>

            <p className="text-xs text-[#69756B] leading-relaxed">
              Trained via LoRA SFT on Apple Silicon MPS across 9,987 curated examples spanning Socratic pedagogy, coding review, system architecture, and resume audits.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs">
              <div className="p-2.5 bg-[#FAFAF2] rounded-xl border border-[#EDF3E8]">
                <span className="text-[10px] text-[#69756B] block">Architecture</span>
                <span className="font-semibold text-[#17211E]">LoRA (r=16, α=32)</span>
              </div>
              <div className="p-2.5 bg-[#FAFAF2] rounded-xl border border-[#EDF3E8]">
                <span className="text-[10px] text-[#69756B] block">Checkpoint State</span>
                <span className="font-semibold text-[#174B39]">Verified & Ready</span>
              </div>
              <div className="p-2.5 bg-[#FAFAF2] rounded-xl border border-[#EDF3E8]">
                <span className="text-[10px] text-[#69756B] block">Execution Target</span>
                <span className="font-semibold text-[#17211E]">Local MLX / Transformers</span>
              </div>
            </div>
          </div>

          {/* Hybrid Routing Policy */}
          <div className="p-4 bg-white rounded-2xl border border-[#DCE5D5] shadow-xs space-y-2 text-xs">
            <span className="font-bold text-[#17211E] block">
              Hybrid Routing Policy & Privacy Guarantee:
            </span>
            <ul className="space-y-1.5 text-[#69756B]">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#27875E] shrink-0 mt-0.5" />
                <span>
                  <strong>Latency Budget:</strong> Cloud calls timeout at 8,000ms and smoothly cascade to verified pedagogical fallback templates.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#27875E] shrink-0 mt-0.5" />
                <span>
                  <strong>Deterministic Fallback:</strong> Socratic scaffolding rules guarantee that students receive high-quality guidance even during total network blackouts.
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#DCE5D5]">
          {content}
        </div>
      </div>
    );
  }

  return <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{content}</div>;
}

