"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { LiveKitRoutingSummary, LiveKitProviderPublic } from "@/lib/livekit/types";
import {
  Video,
  ShieldCheck,
  Server,
  Activity,
  Sliders,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  ArrowLeft,
  Users,
  HardDrive,
  BarChart3,
  Layers,
  Sparkles,
} from "lucide-react";

export default function AdminVideoInfrastructurePage() {
  const [summary, setSummary] = useState<LiveKitRoutingSummary | null>(null);
  const [weights, setWeights] = useState<{ [id: string]: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isProbing, setIsProbing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Fetch summary
  const fetchSummary = async () => {
    try {
      const res = await fetch("/api/admin/video");
      const data = await res.json();
      if (data.success && data.summary) {
        setSummary(data.summary);
        const initialWeights: { [id: string]: number } = {};
        for (const p of data.summary.providers) {
          initialWeights[p.providerId] = p.trafficWeight;
        }
        setWeights(initialWeights);
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to load video infrastructure data." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Update Weight locally
  const handleWeightChange = (providerId: string, val: number) => {
    setWeights((prev) => ({
      ...prev,
      [providerId]: Math.max(0, Math.min(100, val)),
    }));
  };

  // Save Weights to Server
  const handleSaveWeights = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_weights",
          weights,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setFeedback({ type: "success", message: "Traffic weights updated and normalized successfully!" });
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to update weights." });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error saving weights." });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Provider
  const handleToggleProvider = async (providerId: string, currentEnabled: boolean) => {
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_provider",
          providerId,
          enabled: !currentEnabled,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setFeedback({
          type: "success",
          message: `Provider ${providerId} ${!currentEnabled ? "enabled" : "disabled"}.`,
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to toggle provider." });
    }
  };

  // Probe Provider Health
  const handleProbeHealth = async (providerId?: string) => {
    setIsProbing(providerId || "all");
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check_health",
          providerId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setFeedback({
          type: "success",
          message: providerId
            ? `Health probe passed for ${providerId} (${data.result?.latencyMs}ms)`
            : "All active providers probed successfully.",
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Health probe failed." });
    } finally {
      setIsProbing(null);
    }
  };

  // Reset Circuit Breaker
  const handleResetCircuit = async (providerId: string) => {
    try {
      const res = await fetch("/api/admin/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_circuit",
          providerId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setFeedback({ type: "success", message: `Circuit breaker reset to CLOSED for ${providerId}.` });
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to reset circuit breaker." });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-800 hover:text-forest-950 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Portal</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleProbeHealth()}
              disabled={isProbing !== null}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#EBE3D5] text-forest-900 text-xs font-semibold hover:bg-forest-50 transition-all shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProbing ? "animate-spin" : ""}`} />
              <span>Probe All Clusters</span>
            </button>
            <span className="badge-match text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300">
              LiveKit Multi-Cluster Active
            </span>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-medium border ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : "bg-rose-50 text-rose-900 border-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-gray-500 hover:text-black">
              ✕
            </button>
          </div>
        )}

        {/* Page Title & Routing Strategy Banner */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 border border-border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-100 text-forest-900 text-xs font-bold uppercase tracking-wider">
              <Video className="w-3.5 h-3.5 text-forest-700" />
              <span>Multi-Provider WebRTC Video Infrastructure</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-950">
              LiveKit Routing & Resiliency Engine
            </h1>
            <p className="text-xs sm:text-sm text-ink-700 max-w-2xl leading-relaxed">
              Weighted traffic distribution, quota-aware routing, circuit breaker failover, and
              session pinning across 12 independent LiveKit Cloud clusters.
            </p>
          </div>

          <div className="bg-[#0D382B] text-white p-4 rounded-2xl min-w-[240px] text-left space-y-2">
            <span className="text-[11px] text-emerald-300 uppercase tracking-wider font-semibold block">
              Active Routing Strategy
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-sm capitalize">
                {summary?.activeRoutingStrategy.replace(/_/g, " ") || "Weighted Multi-Provider"}
              </span>
            </div>
            <div className="text-[11px] text-emerald-200/80">
              Primary: <strong className="text-white">80%</strong> · Secondary:{" "}
              <strong className="text-white">20%</strong>
            </div>
          </div>
        </div>

        {/* KPI METRIC CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-border">
            <div className="flex items-center gap-2 text-forest-800 text-xs font-semibold mb-1">
              <Server className="w-4 h-4" />
              <span>Total Clusters</span>
            </div>
            <span className="font-serif text-2xl font-bold text-ink-950">
              {summary?.totalProviders || 12}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
              {summary?.enabledProvidersCount || 12} Enabled · {summary?.healthyProvidersCount || 12} Healthy
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-border">
            <div className="flex items-center gap-2 text-forest-800 text-xs font-semibold mb-1">
              <Activity className="w-4 h-4" />
              <span>Active Sessions</span>
            </div>
            <span className="font-serif text-2xl font-bold text-ink-950">
              {summary?.totalActiveSessions || 0}
            </span>
            <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">
              {summary?.totalActiveParticipants || 0} Connected WebRTC Peers
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-border">
            <div className="flex items-center gap-2 text-forest-800 text-xs font-semibold mb-1">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Average Latency</span>
            </div>
            <span className="font-serif text-2xl font-bold text-ink-950">
              {summary?.averageLatencyMs || 24} ms
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
              Optimal Global Mesh
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-border">
            <div className="flex items-center gap-2 text-forest-800 text-xs font-semibold mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Circuit Breakers</span>
            </div>
            <span className="font-serif text-2xl font-bold text-emerald-700">
              {summary?.trippedCircuitBreakersCount === 0 ? "All Closed" : `${summary?.trippedCircuitBreakersCount} Tripped`}
            </span>
            <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">
              Auto-Failover Active
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-border col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 text-forest-800 text-xs font-semibold mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Monthly Minutes</span>
            </div>
            <span className="font-serif text-2xl font-bold text-ink-950">
              {summary?.monthlyUsageTotalMinutes || 0}
            </span>
            <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">
              Aggregated across clusters
            </span>
          </div>
        </div>

        {/* CLUSTERS & WEIGHT TUNER TABLE / CARDS */}
        <div className="bg-white rounded-3xl border border-border overflow-hidden p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h2 className="font-serif text-xl font-bold text-ink-950">
                Configured LiveKit Deployments & Traffic Weights
              </h2>
              <p className="text-xs text-ink-700 mt-1">
                Adjust allocation percentages and manage individual cluster circuit breakers.
              </p>
            </div>

            <button
              onClick={handleSaveWeights}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0D382B] text-white text-xs font-semibold hover:bg-[#07241A] transition-all shadow-sm disabled:opacity-50"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Apply & Save Weights"}</span>
            </button>
          </div>

          {/* Grid of Providers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary?.providers.map((p) => {
              const currentWeight = weights[p.providerId] ?? p.trafficWeight;
              const isTripped = p.circuitBreaker.state === "open";
              const isHalfOpen = p.circuitBreaker.state === "half-open";

              return (
                <div
                  key={p.providerId}
                  className={`p-5 rounded-2xl border transition-all ${
                    !p.enabled
                      ? "bg-gray-50 border-gray-200 opacity-60"
                      : isTripped
                      ? "bg-rose-50/50 border-rose-300"
                      : currentWeight > 0
                      ? "bg-[#FCFBF8] border-[#D6DFDA] shadow-xs"
                      : "bg-white border-border"
                  }`}
                >
                  {/* Provider Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-ink-950">{p.displayName}</span>
                        {p.trafficWeight >= 80 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Primary
                          </span>
                        )}
                        {p.trafficWeight > 0 && p.trafficWeight < 80 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            Secondary
                          </span>
                        )}
                        {p.trafficWeight === 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            Standby
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-gray-500 block mt-0.5 truncate max-w-xs">
                        {p.serverUrl}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Circuit Breaker Pill */}
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isTripped
                            ? "bg-rose-100 text-rose-800"
                            : isHalfOpen
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {p.circuitBreaker.state}
                      </span>

                      {/* Enable/Disable Toggle */}
                      <button
                        onClick={() => handleToggleProvider(p.providerId, p.enabled)}
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold transition-colors ${
                          p.enabled
                            ? "bg-forest-900 text-white hover:bg-forest-950"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {p.enabled ? "Enabled" : "Disabled"}
                      </button>
                    </div>
                  </div>

                  {/* Weight Slider & Controls */}
                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 font-medium">Traffic Weight</span>
                      <span className="font-bold text-forest-900">{currentWeight}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={currentWeight}
                      disabled={!p.enabled}
                      onChange={(e) => handleWeightChange(p.providerId, parseInt(e.target.value, 10))}
                      className="w-full accent-[#0D382B] cursor-pointer"
                    />
                  </div>

                  {/* Usage & Latency Row */}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-gray-500 block">Latency</span>
                      <strong className="text-gray-800">{p.circuitBreaker.lastLatencyMs || 24} ms</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Routed Sessions</span>
                      <strong className="text-gray-800">{p.usageMetrics.totalSessionsRouted}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Errors</span>
                      <strong className={p.usageMetrics.apiErrors > 0 ? "text-rose-600" : "text-gray-800"}>
                        {p.usageMetrics.apiErrors}
                      </strong>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3 flex items-center justify-end gap-2">
                    {isTripped && (
                      <button
                        onClick={() => handleResetCircuit(p.providerId)}
                        className="text-[11px] text-rose-700 hover:underline font-semibold"
                      >
                        Reset Breaker
                      </button>
                    )}
                    <button
                      onClick={() => handleProbeHealth(p.providerId)}
                      disabled={isProbing === p.providerId}
                      className="inline-flex items-center gap-1 text-[11px] text-forest-800 hover:text-forest-950 font-semibold"
                    >
                      <RefreshCw className={`w-3 h-3 ${isProbing === p.providerId ? "animate-spin" : ""}`} />
                      <span>Probe</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTIVE SESSION ASSIGNMENTS INSPECTION */}
        <div className="bg-white rounded-3xl border border-border p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-ink-950">Recent Session Pinning</h3>
              <p className="text-xs text-ink-700">
                Inspect deterministic room assignments ensuring students and mentors join the same provider.
              </p>
            </div>
            <span className="text-xs font-semibold text-gray-500">
              {summary?.recentAssignments.length || 0} active assignments
            </span>
          </div>

          {summary?.recentAssignments && summary.recentAssignments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500">
                    <th className="py-2.5 font-semibold">Booking ID</th>
                    <th className="py-2.5 font-semibold">Room Name</th>
                    <th className="py-2.5 font-semibold">Assigned Cluster</th>
                    <th className="py-2.5 font-semibold">Active Peers</th>
                    <th className="py-2.5 font-semibold">Assigned At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summary.recentAssignments.map((a) => (
                    <tr key={a.bookingId} className="hover:bg-gray-50">
                      <td className="py-2.5 font-mono text-forest-900 font-bold">{a.bookingId}</td>
                      <td className="py-2.5 font-mono text-gray-700">{a.roomName}</td>
                      <td className="py-2.5 font-semibold text-ink-950">{a.providerId}</td>
                      <td className="py-2.5">{a.activeParticipantsCount} participants</td>
                      <td className="py-2.5 text-gray-500">{new Date(a.createdAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              No live sessions currently in progress. Start a session from the Mentorship confirmation page to observe real-time pinning.
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

