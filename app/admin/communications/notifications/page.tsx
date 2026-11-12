"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Megaphone,
  Send,
  Users,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Radio,
  FileText,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Layers,
  ArrowRight,
} from "lucide-react";

interface AdminStats {
  totalDispatched: number;
  totalDeliveries: number;
  activePushSubscriptions: number;
  announcementsCount: number;
  connectedUsers: number;
  connectedTabs: number;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  audience: string;
  priority: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
  channels: string[];
  recipientCount: number;
  publishedAt: string;
}

interface DeliveryLog {
  id: string;
  notificationId: string;
  channel: string;
  status: string;
  errorMessage?: string | null;
  deliveredAt: string;
  title: string;
  category: string;
  priority: string;
  userId: string;
}

export default function AdminNotificationCenterPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalDispatched: 0,
    totalDeliveries: 0,
    activePushSubscriptions: 0,
    announcementsCount: 0,
    connectedUsers: 0,
    connectedTabs: 0,
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [searchLogQuery, setSearchLogQuery] = useState<string>("");
  const [channelFilter, setChannelFilter] = useState<string>("all");

  // New Announcement Form State
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [audience, setAudience] = useState<"all" | "students" | "mentors" | "admins">("all");
  const [priority, setPriority] = useState<"normal" | "high" | "urgent">("normal");
  const [actionUrl, setActionUrl] = useState<string>("");
  const [actionLabel, setActionLabel] = useState<string>("");
  const [channels, setChannels] = useState<string[]>(["in_app", "push"]);

  const [formSuccess, setFormSuccess] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mainRes, logsRes] = await Promise.all([
        fetch("/api/admin/communications/notifications"),
        fetch("/api/admin/communications/notifications/logs?limit=50"),
      ]);

      if (mainRes.ok) {
        const data = await mainRes.json();
        setStats(data.stats || stats);
        setAnnouncements(data.announcements || []);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }
    } catch (err) {
      console.error("Error loading admin notification data:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleChannel = (ch: string) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handleBroadcast = async () => {
    setIsPublishing(true);
    setFormSuccess("");
    setFormError("");
    try {
      const res = await fetch("/api/admin/communications/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          audience,
          priority,
          actionUrl: actionUrl || undefined,
          actionLabel: actionLabel || undefined,
          channels,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFormSuccess(`Announcement published successfully to ${data.announcement?.recipientCount || 0} users!`);
        setShowConfirmModal(false);
        setTitle("");
        setContent("");
        setActionUrl("");
        setActionLabel("");
        loadData();
      } else {
        setFormError(data.error || "Failed to broadcast announcement");
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to broadcast announcement");
    } finally {
      setIsPublishing(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesChannel = channelFilter === "all" || log.channel === channelFilter;
    const matchesSearch =
      searchLogQuery === "" ||
      log.title?.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
      log.status?.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
      log.userId?.toLowerCase().includes(searchLogQuery.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-cream-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-sand-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-forest-800 uppercase tracking-widest">
              <span>Admin Communications</span>
              <span>•</span>
              <span>MentorMaze by AI Tathastu</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-ink-950 mt-1">
              Notification Operations Center
            </h1>
            <p className="text-xs text-ink-700 mt-1">
              Real-time delivery management, platform announcements, and cross-channel logs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/communications/email"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-700 bg-white border border-sand-200 hover:bg-sage-100 transition-colors shadow-xs"
            >
              Email Center
            </Link>
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl bg-white border border-sand-200 hover:bg-sage-100 text-ink-700 transition-colors shadow-xs"
              title="Refresh Stats"
            >
              <RefreshCw className="w-4 h-4 text-forest-800" />
            </button>
          </div>
        </div>

        {/* METRICS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-sand-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
              <span>Dispatched</span>
              <Bell className="w-4 h-4 text-forest-700" />
            </div>
            <p className="font-serif text-2xl font-bold text-ink-950">{stats.totalDispatched}</p>
            <p className="text-[10px] text-gray-400">Total in-app notifications</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-sand-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
              <span>Channel Deliveries</span>
              <Layers className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="font-serif text-2xl font-bold text-ink-950">{stats.totalDeliveries}</p>
            <p className="text-[10px] text-gray-400">In-app, SSE, Push & Email</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-sand-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
              <span>Push Subscriptions</span>
              <Smartphone className="w-4 h-4 text-blue-600" />
            </div>
            <p className="font-serif text-2xl font-bold text-ink-950">
              {stats.activePushSubscriptions}
            </p>
            <p className="text-[10px] text-gray-400">Active browser endpoints</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-sand-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
              <span>Live Connections</span>
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            </div>
            <p className="font-serif text-2xl font-bold text-ink-950">
              {stats.connectedUsers}{" "}
              <span className="text-xs font-normal text-gray-500">
                ({stats.connectedTabs} tabs)
              </span>
            </p>
            <p className="text-[10px] text-emerald-700 font-medium">Real-time SSE connected</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-sand-200 shadow-xs space-y-1 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
              <span>Announcements</span>
              <Megaphone className="w-4 h-4 text-orange-600" />
            </div>
            <p className="font-serif text-2xl font-bold text-ink-950">
              {stats.announcementsCount}
            </p>
            <p className="text-[10px] text-gray-400">Platform-wide campaigns</p>
          </div>
        </div>

        {/* ANNOUNCEMENT BROADCASTER */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sand-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-orange-100 text-orange-800">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-ink-950">
                  Broadcast Platform Announcement
                </h2>
                <p className="text-xs text-ink-700">
                  Publish notices across In-App, Browser Push, and Email to targeted roles.
                </p>
              </div>
            </div>
          </div>

          {formSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>{formSuccess}</span>
            </div>
          )}

          {formError && (
            <div className="p-4 rounded-2xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-700" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink-950">Announcement Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. New Live Video Mentorship Tools Now Live!"
                  className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs text-ink-950 focus:outline-none focus:ring-2 focus:ring-forest-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink-950">Announcement Message</label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Detailed update description, release notes, or instructions for users..."
                  className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs text-ink-950 focus:outline-none focus:ring-2 focus:ring-forest-800"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink-950">Target Audience</label>
                  <select
                    value={audience}
                    onChange={(e: any) => setAudience(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-sand-200 text-xs text-ink-950 bg-white focus:outline-none focus:ring-2 focus:ring-forest-800"
                  >
                    <option value="all">All Registered Users</option>
                    <option value="students">Students Only</option>
                    <option value="mentors">Mentors Only</option>
                    <option value="admins">Platform Admins</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink-950">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-sand-200 text-xs text-ink-950 bg-white focus:outline-none focus:ring-2 focus:ring-forest-800"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink-950">Action Button Label</label>
                  <input
                    type="text"
                    value={actionLabel}
                    onChange={(e) => setActionLabel(e.target.value)}
                    placeholder="e.g. Explore Features"
                    className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs text-ink-950 focus:outline-none focus:ring-2 focus:ring-forest-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink-950">Action Destination URL</label>
                  <input
                    type="text"
                    value={actionUrl}
                    onChange={(e) => setActionUrl(e.target.value)}
                    placeholder="e.g. /programs or /mentors"
                    className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs text-ink-950 focus:outline-none focus:ring-2 focus:ring-forest-800"
                  />
                </div>
              </div>

              {/* Delivery Channels */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink-950">Active Channels</label>
                <div className="flex items-center gap-3 pt-1">
                  {["in_app", "push", "email"].map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => toggleChannel(ch)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                        channels.includes(ch)
                          ? "bg-forest-900 text-white shadow-xs"
                          : "bg-sage-100 text-ink-700 hover:bg-sage-200"
                      }`}
                    >
                      {ch.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={!title || !content || channels.length === 0}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-forest-900 hover:bg-forest-800 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Review & Broadcast</span>
            </button>
          </div>
        </div>

        {/* CONFIRMATION MODAL */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-sand-200 space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-orange-100 text-orange-800">
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-ink-950">Confirm Broadcast</h3>
                  <p className="text-xs text-ink-700">Please review before sending.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-cream-50 border border-sand-200 space-y-2 text-xs">
                <p>
                  <strong>Title:</strong> {title}
                </p>
                <p>
                  <strong>Audience:</strong> {audience.toUpperCase()}
                </p>
                <p>
                  <strong>Channels:</strong> {channels.join(", ")}
                </p>
                <p>
                  <strong>Priority:</strong> {priority.toUpperCase()}
                </p>
              </div>

              <p className="text-xs text-gray-500">
                This will create immediate in-app notifications and trigger push/email deliveries based on recipient preferences.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-700 bg-white border border-sand-200 hover:bg-sage-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBroadcast}
                  disabled={isPublishing}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-forest-900 hover:bg-forest-800 transition-colors flex items-center gap-2"
                >
                  {isPublishing ? "Publishing..." : "Confirm & Send"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELIVERY AUDIT LOGS */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sand-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-ink-950">
                Multi-Channel Delivery Audit Logs
              </h2>
              <p className="text-xs text-ink-700">
                Detailed delivery confirmation and error tracking across all dispatch channels.
              </p>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchLogQuery}
                  onChange={(e) => setSearchLogQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-sand-200 text-xs text-ink-950 focus:outline-none focus:ring-2 focus:ring-forest-800"
                />
              </div>

              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-sand-200 text-xs text-ink-950 bg-white focus:outline-none focus:ring-2 focus:ring-forest-800"
              >
                <option value="all">All Channels</option>
                <option value="in_app">In-App</option>
                <option value="sse">Real-Time SSE</option>
                <option value="push">Browser Push</option>
                <option value="email">Email</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FBF8F1] border-b border-sand-200 text-gray-500 font-semibold">
                <tr>
                  <th className="p-3">Title / Message</th>
                  <th className="p-3">Channel</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Recipient ID</th>
                  <th className="p-3">Delivered At</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      No delivery logs match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-cream-50/50">
                      <td className="p-3 font-medium text-ink-950 max-w-xs truncate">
                        {log.title || "Untitled Notification"}
                      </td>
                      <td className="p-3 uppercase font-bold text-[10px] text-gray-600">
                        <span className="px-2 py-0.5 rounded-full bg-sage-100">
                          {log.channel}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status === "delivered"
                              ? "bg-emerald-100 text-emerald-800"
                              : log.status === "suppressed"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[10px] text-gray-500">
                        {log.userId?.substring(0, 8)}...
                      </td>
                      <td className="p-3 text-gray-500">
                        {new Date(log.deliveredAt).toLocaleTimeString()}
                      </td>
                      <td className="p-3 text-gray-400 text-[10px] max-w-xs truncate">
                        {log.errorMessage || "Delivered successfully"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

