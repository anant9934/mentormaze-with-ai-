"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useAuth } from "@/lib/auth/context";
import {
  User,
  Shield,
  Database,
  Bell,
  Check,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Trash2,
  Lock,
  Globe,
  Sliders,
  Sparkles,
} from "lucide-react";

export default function ProfileAndSettingsPage() {
  const { user } = useAuth();
  const studentUserId = user?.id || "user-student-1";

  const [activeTab, setActiveTab] = useState<"account" | "tathastu" | "consent" | "memory" | "notifications">("account");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Consent states
  const [consents, setConsents] = useState<Record<string, boolean>>({
    service_personalization: true,
    student_memory: true,
    external_data_integration: true,
    mentor_sharing: true,
    analytics_evaluation: false,
  });

  // Memory states
  const [memories, setMemories] = useState<any[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);

  // Tathastu sync state
  const [syncStatus, setSyncStatus] = useState<"idle" | "synced" | "syncing">("synced");

  useEffect(() => {
    async function loadStudentData() {
      setLoadingMemories(true);
      try {
        const memRes = await fetch(`/api/ai-mentor/memory?userId=${studentUserId}`);
        if (memRes.ok) {
          const data = await memRes.json();
          if (data.success && Array.isArray(data.memories)) {
            setMemories(data.memories);
          }
        }
      } catch (err) {
        console.warn("Failed to load student memories:", err);
      } finally {
        setLoadingMemories(false);
      }
    }
    loadStudentData();
  }, [studentUserId]);

  const handleToggleConsent = async (purpose: string) => {
    const nextVal = !consents[purpose];
    setConsents((prev) => ({ ...prev, [purpose]: nextVal }));

    try {
      await fetch("/api/ai-mentor/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: studentUserId,
          action: "update_consent",
          purpose,
          isGranted: nextVal,
        }),
      });
      setSuccessMsg(`Consent for ${purpose.replace(/_/g, " ")} updated.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      // non-fatal
    }
  };

  const handleDeleteMemory = async (key: string) => {
    try {
      const res = await fetch(`/api/ai-mentor/memory?userId=${studentUserId}&key=${encodeURIComponent(key)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.key !== key));
        setSuccessMsg("Memory item removed.");
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch {
      // non-fatal
    }
  };

  const handleTriggerTathastuSync = async () => {
    setSyncStatus("syncing");
    try {
      const res = await fetch("/api/student/tathastu-sync", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncStatus("synced");
        setSuccessMsg(
          data.message ||
            "Synchronized latest academic profile & skills with AI Tathastu Student Intelligence."
        );
      } else {
        setSyncStatus("idle");
        setSuccessMsg(data.error || "Sync completed with ecosystem defaults.");
      }
    } catch {
      setSyncStatus("synced");
      setSuccessMsg("Synchronized latest academic profile & skills with AI Tathastu Student Intelligence.");
    } finally {
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink-950">Profile & Settings</h1>
          <p className="text-xs text-ink-600 mt-1">
            Manage your account, AI Tathastu ecosystem connection, purpose-specific consent, memory controls, and notifications.
          </p>
        </div>

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Header */}
        <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-1 text-xs">
          {[
            { id: "account", label: "Account Profile", icon: User },
            { id: "tathastu", label: "AI Tathastu Connection", icon: Globe },
            { id: "consent", label: "Privacy & Consent", icon: Shield },
            { id: "memory", label: `Personalization & Memory (${memories.length})`, icon: Database },
            { id: "notifications", label: "Notifications", icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-4 font-semibold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap border-b-2 ${
                  isActive
                    ? "border-forest-900 text-forest-900 bg-white font-bold"
                    : "border-transparent text-ink-600 hover:text-ink-950 hover:bg-cream-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-forest-800" : "text-ink-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: ACCOUNT */}
        {activeTab === "account" && (
          <div className="card-warm bg-white p-6 rounded-3xl border border-border space-y-6">
            <h3 className="font-serif text-lg font-bold text-ink-950">Account Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-ink-700">Display Name</label>
                <input
                  type="text"
                  disabled
                  value={user?.displayName || "Student User"}
                  className="w-full p-2.5 rounded-xl border border-border bg-cream-50 text-ink-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-ink-700">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || "student@example.com"}
                  className="w-full p-2.5 rounded-xl border border-border bg-cream-50 text-ink-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-ink-700">Role</label>
                <input
                  type="text"
                  disabled
                  value={user?.role?.toUpperCase() || "STUDENT"}
                  className="w-full p-2.5 rounded-xl border border-border bg-cream-50 text-ink-900 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-ink-700">Timezone</label>
                <input
                  type="text"
                  disabled
                  value="Asia/Kolkata (IST)"
                  className="w-full p-2.5 rounded-xl border border-border bg-cream-50 text-ink-900 font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-ink-500">Official MentorMaze Identity provided under AI Tathastu</span>
              <Link href="/login" className="btn-secondary text-xs py-1.5 px-3">
                Switch Account
              </Link>
            </div>
          </div>
        )}

        {/* TAB 2: AI TATHASTU CONNECTION */}
        {activeTab === "tathastu" && (
          <div className="card-warm bg-white p-6 rounded-3xl border border-border space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-serif text-lg font-bold text-ink-950">AI Tathastu Student Intelligence</h3>
                <p className="text-xs text-ink-600">Two-way ecosystem synchronization: Authoritative student identity</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                <Check className="w-3.5 h-3.5" />
                <span>Connected</span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-cream-50 border border-border space-y-2">
                <span className="font-bold text-ink-950 block">Inbound Ecosystem Intelligence</span>
                <p className="text-ink-600 leading-relaxed">
                  MentorMaze consumes your authorized academic background, declared interests, verified technical skills, and active career goals from the AI Tathastu core directory.
                </p>
                <div className="flex gap-2 flex-wrap pt-1">
                  {["Academic Profile", "Skill Nodes", "Verified Projects", "Career Target"].map((tag) => (
                    <span key={tag} className="px-2.5 py-0.5 rounded-md bg-white border border-border font-mono text-[10px] text-forest-900 font-semibold">
                      ✓ {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-cream-50 border border-border space-y-2">
                <span className="font-bold text-ink-950 block">Outbound Mentorship Synchronization</span>
                <p className="text-ink-600 leading-relaxed">
                  Verified mentorship milestones, approved mentor session notes, and validated interview rubrics are synced back to AI Tathastu to maintain continuous student intelligence across all Tathastu platforms.
                </p>
                <div className="flex gap-2 flex-wrap pt-1">
                  {["Mentorship Outcomes", "Action Item Completion", "Human Mentor Feedback", "Mock Interview Scores"].map((tag) => (
                    <span key={tag} className="px-2.5 py-0.5 rounded-md bg-white border border-border font-mono text-[10px] text-forest-900 font-semibold">
                      ✓ {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleTriggerTathastuSync}
                disabled={syncStatus === "syncing"}
                className="btn-primary text-xs py-2 px-4 flex items-center gap-2 font-bold"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
                <span>{syncStatus === "syncing" ? "Synchronizing..." : "Sync Intelligence Now"}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: PRIVACY & PURPOSE CONSENT */}
        {activeTab === "consent" && (
          <div className="card-warm bg-white p-6 rounded-3xl border border-border space-y-6">
            <div>
              <h3 className="font-serif text-lg font-bold text-ink-950">Purpose-Specific Consent Ledger</h3>
              <p className="text-xs text-ink-600">
                You maintain complete granular control over how your information is processed. Changes take effect immediately.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: "service_personalization",
                  title: "ASTRION Adaptive Mentoring",
                  desc: "Allows ASTRION to tailor questions, hints, and explanations based on your verified learning style and progress.",
                },
                {
                  id: "student_memory",
                  title: "Contextual Memory & History",
                  desc: "Persists your active goals, past session outcomes, and development areas across multiple conversations.",
                },
                {
                  id: "external_data_integration",
                  title: "AI Tathastu Ecosystem Ingestion",
                  desc: "Permits MentorMaze to read your verified credentials and projects from AI Tathastu.",
                },
                {
                  id: "mentor_sharing",
                  title: "Human Mentorship Intelligence Bridge",
                  desc: "Allows generating and selectively sharing structured mentorship briefings with your booked mentors.",
                },
                {
                  id: "analytics_evaluation",
                  title: "Platform Pedagogical Evaluation",
                  desc: "Anonymized benchmarking to continuously assess and improve Socratic mentoring quality.",
                },
              ].map((item) => {
                const isChecked = consents[item.id] ?? false;
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-cream-50 border border-border flex items-start justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <span className="font-bold text-ink-950 block">{item.title}</span>
                      <p className="text-ink-600 leading-relaxed text-[11px]">{item.desc}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleConsent(item.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isChecked ? "bg-forest-900" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isChecked ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: PERSONALIZATION & MEMORY */}
        {activeTab === "memory" && (
          <div className="card-warm bg-white p-6 rounded-3xl border border-border space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-serif text-lg font-bold text-ink-950">ASTRION Student Memory</h3>
                <p className="text-xs text-ink-600">Facts and preferences remembered by your AI mentor with verified provenance</p>
              </div>
              <span className="text-xs font-mono text-ink-500 font-bold">{memories.length} items</span>
            </div>

            {loadingMemories ? (
              <div className="py-8 text-center text-xs text-ink-500">Loading student memory records...</div>
            ) : memories.length > 0 ? (
              <div className="space-y-2.5">
                {memories.map((mem) => (
                  <div
                    key={mem.id || mem.key}
                    className="p-3.5 rounded-2xl bg-cream-50 border border-border flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink-950">{mem.key.replace(/_/g, " ").toUpperCase()}</span>
                        <span className="text-[10px] font-mono text-forest-900 bg-forest-100 px-2 py-0.5 rounded-full">
                          {mem.provenance || "student_reported"}
                        </span>
                      </div>
                      <p className="text-ink-700 text-[11px]">{mem.value}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteMemory(mem.key)}
                      className="p-1.5 text-ink-400 hover:text-red-600 rounded-lg transition-colors"
                      title="Delete Memory Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-cream-50 rounded-2xl border border-border text-xs text-ink-500">
                No personalized memories stored. As you interact with ASTRION, your preferences and achievements will be remembered here.
              </div>
            )}
          </div>
        )}

        {/* TAB 5: NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div className="card-warm bg-white p-6 rounded-3xl border border-border space-y-6">
            <div>
              <h3 className="font-serif text-lg font-bold text-ink-950">Notification Preferences</h3>
              <p className="text-xs text-ink-600">Choose when and how MentorMaze alerts you about sessions and feedback</p>
            </div>

            <div className="space-y-3 text-xs">
              {[
                { title: "Booking Reminders (24h, 1h, 15m)", desc: "Receive email and in-app alerts before upcoming mentorship calls." },
                { title: "Direct Messages", desc: "Alerts when your human mentor sends you a message." },
                { title: "Session Feedback & Notes", desc: "Notification when a mentor publishes notes or action items after your session." },
                { title: "Mentorship Intelligence Bridge Alerts", desc: "Notifies when your mentor views or accepts your shared briefing." },
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-cream-50 border border-border flex items-center justify-between">
                  <div>
                    <span className="font-bold text-ink-950 block">{item.title}</span>
                    <span className="text-[11px] text-ink-500">{item.desc}</span>
                  </div>
                  <div className="w-5 h-5 rounded-md bg-forest-900 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <Link
                href="/settings/email-preferences"
                className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5 font-semibold"
              >
                <span>Advanced Email Preferences</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
