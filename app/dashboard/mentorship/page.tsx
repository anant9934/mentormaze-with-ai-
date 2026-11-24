"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useAuth } from "@/lib/auth/context";
import { MentorshipBridgeModal } from "@/components/mentorship/mentorship-bridge-modal";
import { MentorshipBridgeSummaryData } from "@/lib/mentorship/mentorship-bridge-service";
import { store } from "@/lib/data/store";
import {
  Calendar,
  Video,
  UserCheck,
  Target,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Share2,
  ShieldCheck,
  ShieldAlert,
  Plus,
  MessageSquare,
  AlertCircle,
  Loader2,
  FileText,
  Trash2,
  RefreshCw,
} from "lucide-react";

function MyMentorshipContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";

  const currentUserId = user?.id || "user-student-1";
  const [activeTab, setActiveTab] = useState<"overview" | "sessions" | "goals" | "actions" | "bridge">(
    initialTab as any
  );

  // Data states
  const [sessions, setSessions] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [bridgeShares, setBridgeShares] = useState<MentorshipBridgeSummaryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Bridge modal state
  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState(false);
  const [selectedBookingForBridge, setSelectedBookingForBridge] = useState<any | null>(null);

  // New Goal modal/form state
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState("career");
  const [newGoalTargetDate, setNewGoalTargetDate] = useState("2026-12-31");

  const loadMentorshipData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch dashboard data (sessions & goals)
      const res = await fetch("/api/student/dashboard", {
        credentials: "same-origin",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setGoals(data.goals || []);
          if (data.upcomingBooking) {
            setSessions([data.upcomingBooking]);
          }
        }
      }

      // Load local store bookings for complete calendar history
      const storeBookings = store.getBookingsForUser(currentUserId);
      if (storeBookings && storeBookings.length > 0) {
        const mapped = storeBookings.map((b) => {
          const mentor = store.getMentorById(b.mentorProfileId);
          return {
            id: b.id,
            mentorProfileId: b.mentorProfileId,
            mentorName: mentor?.headline?.split(" ")[0] || "Mentor",
            mentorHeadline: mentor?.headline || "Senior Engineering Mentor",
            mentorAvatarUrl: (mentor as any)?.avatarUrl || (mentor as any)?.user?.avatarUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
            serviceType: b.serviceType,
            status: b.status,
            startTimeUtc: b.startTimeUtc,
            endTimeUtc: b.endTimeUtc,
            studentDiscussionPoints: b.studentDiscussionPoints,
          };
        });
        setSessions(mapped);
      }

      // Load action items from store
      const profile = store.getStudentProfile(currentUserId);
      if (profile?.actionItems) {
        setActionItems(profile.actionItems);
      } else {
        setActionItems([
          { id: "act-1", title: "Practice 3 System Design decomposition problems", completed: false, dueDate: "2026-11-28" },
          { id: "act-2", title: "Refactor concurrency transaction lock in booking service", completed: true, dueDate: "2026-11-20" },
        ]);
      }

      // 2. Fetch Bridge Shares
      const bridgeRes = await fetch(`/api/mentorship-bridge/shares?studentUserId=${currentUserId}`);
      if (bridgeRes.ok) {
        const bridgeData = await bridgeRes.json();
        if (bridgeData.success && Array.isArray(bridgeData.shares)) {
          setBridgeShares(bridgeData.shares);
        }
      }
    } catch (err) {
      console.warn("Failed to load mentorship hub data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMentorshipData();
  }, [currentUserId]);

  const handleToggleAction = (id: string) => {
    setActionItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
    store.toggleActionItem(currentUserId, id);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    const newGoal = {
      id: `goal-${Date.now()}`,
      title: newGoalTitle.trim(),
      description: "Custom tracked mentorship goal",
      category: newGoalCategory,
      progressPercentage: 10,
      targetDate: newGoalTargetDate,
      status: "in_progress",
    };

    setGoals((prev) => [newGoal, ...prev]);
    store.addStudentGoal(currentUserId, {
      title: newGoalTitle.trim(),
      description: "Custom goal defined by student.",
      category: newGoalCategory,
      targetDate: newGoalTargetDate,
    });

    setNewGoalTitle("");
    setShowAddGoal(false);
  };

  const handleRevokeShare = async (summaryId: string) => {
    if (!confirm("Revoke your mentor's access to this mentorship summary?")) return;
    try {
      const res = await fetch(`/api/mentorship-bridge/shares?summaryId=${summaryId}&studentUserId=${currentUserId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBridgeShares((prev) =>
          prev.map((s) => (s.id === summaryId ? { ...s, status: "revoked", revokedAt: new Date().toISOString() } : s))
        );
      } else {
        alert(data.error || "Failed to revoke share");
      }
    } catch (err: any) {
      alert("Error revoking summary: " + err.message);
    }
  };

  const upcomingSessions = sessions.filter((s) => s.status === "confirmed" || s.status === "held" || s.status === "pending");
  const pastSessions = sessions.filter((s) => s.status === "completed" || s.status === "cancelled");
  const assignedMentor = sessions[0] ? {
    id: sessions[0].mentorProfileId,
    name: sessions[0].mentorName,
    headline: sessions[0].mentorHeadline,
    avatarUrl: sessions[0].mentorAvatarUrl,
  } : null;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hub Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-900 text-xs font-semibold mb-2">
              <UserCheck className="w-3.5 h-3.5 text-forest-800" />
              <span>Continuous Human Mentorship</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink-950">My Mentorship</h1>
            <p className="text-xs text-ink-600 mt-1">
              Your 1:1 human mentorship workspace, scheduled calls, agreed goals, and Mentorship Intelligence Bridge.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSelectedBookingForBridge(upcomingSessions[0] || null);
                setIsBridgeModalOpen(true);
              }}
              className="btn-primary text-xs py-2.5 px-4 flex items-center gap-2 font-bold shadow-sm"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>Bridge to Mentor</span>
            </button>

            <Link
              href="/mentors"
              className="btn-secondary text-xs py-2.5 px-4 flex items-center gap-2 font-semibold"
            >
              <span>Find More Mentors</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-1 text-xs">
          {[
            { id: "overview", label: "Overview & Mentor", icon: UserCheck },
            { id: "sessions", label: `Sessions (${upcomingSessions.length})`, icon: Calendar },
            { id: "goals", label: `Goals (${goals.length})`, icon: Target },
            { id: "actions", label: `Action Items (${actionItems.length})`, icon: CheckCircle2 },
            { id: "bridge", label: `Intelligence Bridge (${bridgeShares.length})`, icon: Share2 },
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

        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW & MY MENTOR */}
        {/* ========================================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Assigned Mentor Card */}
            {assignedMentor ? (
              <div className="card-warm bg-white p-6 rounded-3xl border border-border shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-cream-200 border border-border shrink-0">
                    <Image
                      src={assignedMentor.avatarUrl}
                      alt={assignedMentor.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-forest-900 bg-forest-100 px-2 py-0.5 rounded-full inline-block mb-1">
                      Assigned Mentor
                    </span>
                    <h3 className="font-serif text-xl font-bold text-ink-950">{assignedMentor.name}</h3>
                    <p className="text-xs text-ink-600">{assignedMentor.headline}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto">
                  <Link
                    href="/dashboard/messages"
                    className="btn-secondary text-xs py-2.5 px-4 flex-1 md:flex-none flex items-center justify-center gap-2 font-semibold"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-forest-800" />
                    <span>Message</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBookingForBridge(upcomingSessions[0] || null);
                      setIsBridgeModalOpen(true);
                    }}
                    className="btn-primary text-xs py-2.5 px-4 flex-1 md:flex-none flex items-center justify-center gap-2 font-bold"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Prepare Bridge Briefing</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="card-warm bg-white p-8 rounded-3xl border border-border text-center space-y-3">
                <p className="text-xs text-ink-600">You do not have an active 1:1 mentorship booking yet.</p>
                <Link href="/mentors" className="btn-primary text-xs py-2 px-5 inline-flex items-center gap-2">
                  <span>Browse Approved Mentors</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Next Upcoming Session & Action Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upcoming Session */}
              <div className="card-warm bg-white p-6 rounded-3xl border border-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                    <h3 className="font-bold text-sm text-ink-950 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-forest-800" />
                      <span>Next Mentoring Session</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab("sessions")}
                      className="text-xs font-semibold text-forest-800 hover:underline"
                    >
                      View All →
                    </button>
                  </div>

                  {upcomingSessions.length > 0 ? (
                    <div className="space-y-3">
                      <div className="p-4 rounded-2xl bg-cream-50 border border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-ink-950">
                            1:1 Consultation with {upcomingSessions[0].mentorName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 capitalize">
                            {upcomingSessions[0].status}
                          </span>
                        </div>
                        <p className="text-xs text-ink-600">
                          {new Date(upcomingSessions[0].startTimeUtc).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                        {upcomingSessions[0].studentDiscussionPoints && (
                          <p className="text-[11px] text-ink-500 italic">
                            Focus: "{upcomingSessions[0].studentDiscussionPoints}"
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-ink-500 py-6 text-center">No upcoming sessions scheduled.</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-border flex justify-end">
                  {upcomingSessions[0] ? (
                    <Link
                      href={`/sessions/${upcomingSessions[0].id}/live`}
                      className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Enter Live Room</span>
                    </Link>
                  ) : (
                    <Link href="/mentors" className="btn-secondary text-xs py-2 px-4">
                      Book a Session
                    </Link>
                  )}
                </div>
              </div>

              {/* Priority Action Checklist */}
              <div className="card-warm bg-white p-6 rounded-3xl border border-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                    <h3 className="font-bold text-sm text-ink-950 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-forest-800" />
                      <span>Agreed Next Milestones</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab("actions")}
                      className="text-xs font-semibold text-forest-800 hover:underline"
                    >
                      All Actions →
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {actionItems.slice(0, 3).map((act) => (
                      <div
                        key={act.id}
                        onClick={() => handleToggleAction(act.id)}
                        className={`p-3 rounded-2xl border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                          act.completed
                            ? "bg-cream-50 border-border line-through text-ink-400"
                            : "bg-white border-border text-ink-950 hover:bg-cream-50"
                        }`}
                      >
                        <span className="font-medium pr-2">{act.title}</span>
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                            act.completed ? "bg-forest-900 border-forest-900 text-white" : "border-ink-300"
                          }`}
                        >
                          {act.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border text-[11px] text-ink-500 flex items-center justify-between">
                  <span>Tracked across ASTRION and Human Mentor calls</span>
                  <Link href="/ai-mentor" className="text-forest-900 font-bold hover:underline">
                    Ask ASTRION for Help →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SESSIONS & CALENDAR */}
        {/* ========================================================================= */}
        {activeTab === "sessions" && (
          <div className="space-y-6">
            <div className="card-warm bg-white p-6 rounded-3xl border border-border space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-serif text-lg font-bold text-ink-950">Scheduled Sessions</h3>
                <Link href="/mentors" className="btn-secondary text-xs py-1.5 px-3">
                  + Book Another Session
                </Link>
              </div>

              {sessions.length > 0 ? (
                <div className="space-y-3">
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      className="p-4 rounded-2xl bg-cream-50 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-forest-900 text-white flex items-center justify-center shrink-0">
                          <Calendar className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-ink-950">
                            Mentorship Consultation with {sess.mentorName}
                          </h4>
                          <p className="text-[11px] text-ink-600">
                            {new Date(sess.startTimeUtc).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBookingForBridge(sess);
                            setIsBridgeModalOpen(true);
                          }}
                          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 font-semibold"
                        >
                          <Share2 className="w-3.5 h-3.5 text-forest-800" />
                          <span>Share Briefing</span>
                        </button>

                        <Link
                          href={`/sessions/${sess.id}/live`}
                          className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Video</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-500 py-8 text-center">No session history found.</p>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: MENTORSHIP GOALS */}
        {/* ========================================================================= */}
        {activeTab === "goals" && (
          <div className="card-warm bg-white p-6 rounded-3xl border border-border space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-serif text-lg font-bold text-ink-950">Mentorship Goals</h3>
                <p className="text-xs text-ink-600">Tracked milestones agreed between you and your mentors</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddGoal(!showAddGoal)}
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Goal</span>
              </button>
            </div>

            {showAddGoal && (
              <form onSubmit={handleCreateGoal} className="p-4 rounded-2xl bg-cream-50 border border-border space-y-3">
                <h4 className="text-xs font-bold text-ink-950">Create New Mentorship Goal</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Goal Title (e.g. Master Production System Design)"
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    className="sm:col-span-2 p-2.5 rounded-xl border border-border text-xs text-ink-950"
                  />
                  <input
                    type="date"
                    value={newGoalTargetDate}
                    onChange={(e) => setNewGoalTargetDate(e.target.value)}
                    className="p-2.5 rounded-xl border border-border text-xs text-ink-950"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddGoal(false)}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary text-xs py-1.5 px-4 font-bold">
                    Save Goal
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((goal) => (
                <div key={goal.id} className="p-4 rounded-2xl bg-cream-50 border border-border space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink-950">{goal.title}</span>
                    <span className="text-forest-900 font-mono font-bold">{goal.progressPercentage || 0}%</span>
                  </div>
                  <div className="w-full bg-sand-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-forest-900 h-2 rounded-full transition-all"
                      style={{ width: `${goal.progressPercentage || 0}%` }}
                    />
                  </div>
                  {goal.description && <p className="text-[11px] text-ink-500">{goal.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ACTION ITEMS */}
        {/* ========================================================================= */}
        {activeTab === "actions" && (
          <div className="card-warm bg-white p-6 rounded-3xl border border-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-serif text-lg font-bold text-ink-950">Action Items & Deliverables</h3>
              <span className="text-xs text-ink-500">Click an item to toggle completion</span>
            </div>

            <div className="space-y-2">
              {actionItems.map((act) => (
                <div
                  key={act.id}
                  onClick={() => handleToggleAction(act.id)}
                  className={`p-3.5 rounded-2xl border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    act.completed
                      ? "bg-cream-50 border-border line-through text-ink-400"
                      : "bg-white border-border text-ink-950 hover:bg-cream-50 shadow-2xs"
                  }`}
                >
                  <div>
                    <span className="font-semibold block">{act.title}</span>
                    {act.dueDate && <span className="text-[10px] text-ink-500">Target Date: {act.dueDate}</span>}
                  </div>
                  <div
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                      act.completed ? "bg-forest-900 border-forest-900 text-white" : "border-ink-300"
                    }`}
                  >
                    {act.completed && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: MENTORSHIP INTELLIGENCE BRIDGE */}
        {/* ========================================================================= */}
        {activeTab === "bridge" && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-forest-900 to-[#174B39] text-white shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-200 font-bold">
                  Mentorship Intelligence Bridge
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-100 border border-emerald-600">
                  Consent-Governed
                </span>
              </div>
              <h3 className="font-serif text-2xl font-bold">Connect ASTRION to Your Human Mentor</h3>
              <p className="text-xs text-emerald-100/90 max-w-2xl leading-relaxed">
                Rather than forcing your mentor to read hundreds of raw chat logs, the Bridge synthesizes your goals, decisions, progress, and questions into a 2-minute actionable briefing. You preview, edit, and authorize every single item.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsBridgeModalOpen(true)}
                  className="btn-primary bg-white text-forest-900 hover:bg-cream-100 text-xs py-2.5 px-5 font-bold inline-flex items-center gap-2 shadow-sm"
                >
                  <Share2 className="w-4 h-4 text-forest-900" />
                  <span>Generate New Mentorship Summary</span>
                </button>
              </div>
            </div>

            {/* Existing Shared Briefings Table */}
            <div className="card-warm bg-white p-6 rounded-3xl border border-border space-y-4">
              <h4 className="font-serif text-base font-bold text-ink-950">Active & Historical Shared Briefings</h4>

              {bridgeShares.length > 0 ? (
                <div className="space-y-3">
                  {bridgeShares.map((share) => (
                    <div
                      key={share.id}
                      className="p-4 rounded-2xl bg-cream-50 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-ink-950">
                            Timeframe: {share.timeframe.replace("_", " ").toUpperCase()}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold capitalize ${
                              share.status === "shared"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : share.status === "revoked"
                                ? "bg-red-100 text-red-800 border border-red-300"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {share.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-600">
                          Created {new Date(share.createdAt).toLocaleDateString()} · {share.mentoringHistory?.length || 0} topics included
                        </p>
                        {share.studentNote && (
                          <p className="text-[11px] text-ink-500 italic line-clamp-1">"{share.studentNote}"</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {share.status === "shared" && (
                          <button
                            type="button"
                            onClick={() => handleRevokeShare(share.id)}
                            className="btn-secondary text-xs py-1.5 px-3 text-red-700 hover:text-red-900 flex items-center gap-1 font-semibold"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                            <span>Revoke Access</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-500 py-6 text-center">
                  No mentorship summaries shared yet. Click above to generate your first briefing.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Bridge Modal */}
        <MentorshipBridgeModal
          isOpen={isBridgeModalOpen}
          onClose={() => setIsBridgeModalOpen(false)}
          studentUserId={currentUserId}
          bookingId={selectedBookingForBridge?.id}
          mentorProfileId={selectedBookingForBridge?.mentorProfileId}
          mentorName={selectedBookingForBridge?.mentorName || "Your Verified Mentor"}
          onShareComplete={(newShare) => {
            setBridgeShares((prev) => [newShare, ...prev]);
            setActiveTab("bridge");
          }}
        />
      </div>
    </DashboardLayout>
  );
}

export default function MyMentorshipPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-forest-800 animate-spin mb-3" />
            <p className="text-xs text-ink-600 font-medium">Loading mentorship workspace...</p>
          </div>
        </DashboardLayout>
      }
    >
      <MyMentorshipContent />
    </Suspense>
  );
}
