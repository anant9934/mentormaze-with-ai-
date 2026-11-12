"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  MessageSquare,
  CreditCard,
  Users,
  Video,
  Shield,
  Megaphone,
  Settings,
  ExternalLink,
  Filter,
  RefreshCw,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  priority: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

const CATEGORIES = [
  { id: "all", label: "All Alerts", icon: Bell },
  { id: "unread", label: "Unread", icon: Filter },
  { id: "bookings", label: "Bookings", icon: Calendar },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "mentorship", label: "Mentorship", icon: Users },
  { id: "mock_interviews", label: "Mock Interviews", icon: Video },
  { id: "account_security", label: "Security", icon: Shield },
  { id: "announcements", label: "Announcements", icon: Megaphone },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [offset, setOffset] = useState<number>(0);
  const [pushSupported, setPushSupported] = useState<boolean>(false);
  const [pushPermission, setPushPermission] = useState<string>("default");
  const [isEnablingPush, setIsEnablingPush] = useState<boolean>(false);

  useEffect(() => {
    loadNotifications(true);

    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setPushSupported(true);
      setPushPermission(Notification.permission);
    }
  }, [activeTab]);

  // Real-Time SSE Listener
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/notifications/stream");

      eventSource.addEventListener("notification", (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.notification) {
            setNotifications((prev) => [data.notification, ...prev]);
          }
          if (typeof data.unreadCount === "number") {
            setUnreadCount(data.unreadCount);
          }
        } catch (e) {
          console.error("SSE parse error", e);
        }
      });

      eventSource.addEventListener("unread_count", (event) => {
        try {
          const data = JSON.parse(event.data);
          if (typeof data.unreadCount === "number") {
            setUnreadCount(data.unreadCount);
          }
        } catch (e) {}
      });

      eventSource.addEventListener("read_status", (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.notificationId) {
            setNotifications((prev) =>
              prev.map((n) => (n.id === data.notificationId ? { ...n, isRead: true } : n))
            );
          }
          if (typeof data.unreadCount === "number") {
            setUnreadCount(data.unreadCount);
          }
        } catch (e) {}
      });

      eventSource.addEventListener("read_all", () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      });
    } catch (err) {}

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const loadNotifications = async (reset = false) => {
    if (reset) {
      setIsLoading(true);
      setOffset(0);
    } else {
      setIsRefreshing(true);
    }

    const currentOffset = reset ? 0 : offset;
    const isUnreadFilter = activeTab === "unread";
    const categoryQuery =
      activeTab !== "all" && activeTab !== "unread" ? `&category=${activeTab}` : "";
    const unreadQuery = isUnreadFilter ? "&unreadOnly=true" : "";

    try {
      const res = await fetch(
        `/api/notifications?limit=20&offset=${currentOffset}${categoryQuery}${unreadQuery}`
      );
      if (res.ok) {
        const data = await res.json();
        if (reset) {
          setNotifications(data.notifications || []);
        } else {
          setNotifications((prev) => [...prev, ...(data.notifications || [])]);
        }
        setUnreadCount(data.unreadCount || 0);
        setHasMore(data.hasMore || false);
        setOffset(currentOffset + (data.notifications?.length || 0));
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications/mark-all-read", { method: "POST" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const handleEnablePush = async () => {
    if (!pushSupported || isEnablingPush) return;
    setIsEnablingPush(true);
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === "granted") {
        const keyRes = await fetch("/api/notifications/push/key");
        const { publicKey } = await keyRes.json();

        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(publicKey),
        });

        await fetch("/api/notifications/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription }),
        });
      }
    } catch (err) {
      console.error("Push registration error:", err);
    } finally {
      setIsEnablingPush(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "bookings":
        return <Calendar className="w-5 h-5 text-emerald-600" />;
      case "messages":
        return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case "payments":
        return <CreditCard className="w-5 h-5 text-amber-600" />;
      case "mentorship":
        return <Users className="w-5 h-5 text-purple-600" />;
      case "mock_interviews":
        return <Video className="w-5 h-5 text-teal-600" />;
      case "account_security":
        return <Shield className="w-5 h-5 text-rose-600" />;
      case "announcements":
        return <Megaphone className="w-5 h-5 text-orange-600" />;
      default:
        return <Bell className="w-5 h-5 text-emerald-700" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === "urgent") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
          Urgent
        </span>
      );
    }
    if (priority === "high") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
          High
        </span>
      );
    }
    return null;
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("en-IN", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-sand-200">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink-950">
                Notification Center
              </h1>
              {unreadCount > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-sm">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-sm text-ink-700 mt-1">
              Real-time activity, session alerts, payments, and platform announcements.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-forest-800 bg-white border border-sand-200 hover:bg-sage-100 transition-colors shadow-xs"
              >
                <CheckCheck className="w-4 h-4 text-forest-700" />
                <span>Mark all as read</span>
              </button>
            )}

            <button
              onClick={() => loadNotifications(true)}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-white border border-sand-200 hover:bg-sage-100 text-ink-700 transition-colors shadow-xs"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-forest-800" : ""}`} />
            </button>

            <Link
              href="/settings/notifications"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-forest-900 hover:bg-forest-800 transition-colors shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Preferences</span>
            </Link>
          </div>
        </div>

        {/* Web Push Prompt Banner */}
        {pushSupported && pushPermission === "default" && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-forest-900 to-forest-800 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-3 rounded-xl bg-forest-700/60 text-emerald-300 shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base">Never miss a mentorship session</h3>
                <p className="text-xs text-sage-200 mt-0.5">
                  Enable device push notifications for 15-minute countdowns, direct mentor messages, and booking updates.
                </p>
              </div>
            </div>
            <button
              onClick={handleEnablePush}
              disabled={isEnablingPush}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-400 text-forest-950 hover:bg-emerald-300 transition-colors shrink-0 shadow-sm"
            >
              {isEnablingPush ? "Enabling..." : "Enable Push Notifications"}
            </button>
          </div>
        )}

        {/* Categories Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-forest-900 text-white shadow-sm"
                    : "bg-white text-ink-700 border border-sand-200 hover:bg-sage-100"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-300" : "text-gray-500"}`} />
                <span>{cat.label}</span>
                {cat.id === "unread" && unreadCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? "bg-emerald-400 text-forest-950" : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notifications List Card */}
        <div className="bg-white rounded-3xl border border-sand-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-forest-800 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-medium text-ink-700">Loading alerts...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-sage-100 text-forest-800 flex items-center justify-center mx-auto shadow-inner">
                <Bell className="w-8 h-8 text-forest-700" />
              </div>
              <div className="max-w-sm mx-auto space-y-1">
                <h3 className="font-serif font-bold text-lg text-ink-950">No notifications found</h3>
                <p className="text-xs text-ink-700">
                  {activeTab === "unread"
                    ? "You have no unread notifications! All caught up."
                    : `No activity recorded under the ${activeTab.replace("_", " ")} category yet.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((item) => {
                const targetUrl = item.actionUrl || item.linkUrl;
                return (
                  <div
                    key={item.id}
                    className={`p-5 sm:p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-colors ${
                      !item.isRead ? "bg-emerald-50/30 hover:bg-emerald-50/50" : "hover:bg-cream-50/60"
                    }`}
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 rounded-2xl bg-white border border-sand-200 shadow-xs shrink-0 mt-0.5">
                        {getCategoryIcon(item.category)}
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4
                            className={`text-sm ${
                              !item.isRead ? "font-bold text-ink-950" : "font-semibold text-ink-700"
                            }`}
                          >
                            {item.title}
                          </h4>
                          {getPriorityBadge(item.priority)}
                          <span className="text-[11px] text-gray-600 font-medium capitalize">
                            • {item.category.replace("_", " ")}
                          </span>
                        </div>

                        <p className="text-xs text-ink-700 leading-relaxed max-w-2xl">
                          {item.message}
                        </p>

                        <div className="pt-1 flex items-center gap-4 text-[11px] text-gray-600">
                          <span>{formatTimestamp(item.createdAt)}</span>
                          {targetUrl && (
                            <Link
                              href={targetUrl}
                              className="font-semibold text-forest-800 hover:text-forest-900 inline-flex items-center gap-1 hover:underline"
                            >
                              <span>{item.actionLabel || "View Details"}</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {!item.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(item.id, e)}
                          className="p-2 rounded-xl text-ink-700 hover:text-forest-800 hover:bg-sage-100 transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4 text-emerald-600" />
                        </button>
                      )}

                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-2 rounded-xl text-ink-700 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="p-4 bg-cream-50/50 border-t border-sand-200 text-center">
              <button
                onClick={() => loadNotifications(false)}
                disabled={isRefreshing}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-forest-800 bg-white border border-sand-200 hover:bg-sage-100 transition-colors shadow-xs"
              >
                {isRefreshing ? "Loading..." : "Load more alerts"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function urlB64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

