"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  Calendar,
  MessageSquare,
  CreditCard,
  Users,
  Video,
  Shield,
  Megaphone,
  Settings,
  ArrowRight,
  ExternalLink,
  Wifi,
} from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  actionUrl?: string | null;
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pushSupported, setPushSupported] = useState<boolean>(false);
  const [pushPermission, setPushPermission] = useState<string>("default");
  const [subscribingPush, setSubscribingPush] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. Initial Load & Check Push Support
  useEffect(() => {
    fetchRecentNotifications();

    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setPushSupported(true);
      setPushPermission(Notification.permission);
    }
  }, []);

  // 2. Real-Time Server-Sent Events (SSE) Stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource("/api/notifications/stream");

        eventSource.onopen = () => {
          setIsConnected(true);
        };

        // Listen for new incoming notification
        eventSource.addEventListener("notification", (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.notification) {
              setNotifications((prev) => [data.notification, ...prev.slice(0, 4)]);
            }
            if (typeof data.unreadCount === "number") {
              setUnreadCount(data.unreadCount);
            }
          } catch (e) {
            console.error("Failed to parse SSE notification:", e);
          }
        });

        // Listen for unread count updates
        eventSource.addEventListener("unread_count", (event) => {
          try {
            const data = JSON.parse(event.data);
            if (typeof data.unreadCount === "number") {
              setUnreadCount(data.unreadCount);
            }
          } catch (e) {
            console.error("Failed to parse unread count:", e);
          }
        });

        // Listen for multi-tab read status sync
        eventSource.addEventListener("read_status", (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.notificationId) {
              setNotifications((prev) =>
                prev.map((item) =>
                  item.id === data.notificationId ? { ...item, isRead: true } : item
                )
              );
            }
            if (typeof data.unreadCount === "number") {
              setUnreadCount(data.unreadCount);
            }
          } catch (e) {
            console.error("Failed to parse read status:", e);
          }
        });

        // Listen for multi-tab mark all read
        eventSource.addEventListener("read_all", () => {
          setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
          setUnreadCount(0);
        });

        eventSource.onerror = () => {
          setIsConnected(false);
          if (eventSource) {
            eventSource.close();
          }
          // Retry connection after 5 seconds
          reconnectTimeout = setTimeout(connectSSE, 5000);
        };
      } catch (err) {
        setIsConnected(false);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // 3. Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchRecentNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=5");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications/mark-all-read", { method: "POST" });
      if (res.ok) {
        setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        await fetch(`/api/notifications/${item.id}/read`, { method: "PATCH" });
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error("Error marking notification read:", err);
      }
    }

    setIsOpen(false);
    const targetUrl = item.actionUrl || item.linkUrl || "/notifications";
    router.push(targetUrl);
  };

  const handleEnablePush = async () => {
    if (!pushSupported || subscribingPush) return;
    setSubscribingPush(true);
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
      setSubscribingPush(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "bookings":
        return <Calendar className="w-4 h-4 text-emerald-600" />;
      case "messages":
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case "payments":
        return <CreditCard className="w-4 h-4 text-amber-600" />;
      case "mentorship":
        return <Users className="w-4 h-4 text-purple-600" />;
      case "mock_interviews":
        return <Video className="w-4 h-4 text-teal-600" />;
      case "account_security":
        return <Shield className="w-4 h-4 text-rose-600" />;
      case "announcements":
        return <Megaphone className="w-4 h-4 text-orange-600" />;
      default:
        return <Bell className="w-4 h-4 text-emerald-700" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return "Just now";
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchRecentNotifications();
        }}
        className="relative min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-full text-ink-950 hover:bg-sage-100/70 transition-colors focus:outline-none focus:ring-2 focus:ring-forest-800/20"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5 text-[#123B2E]" />

        {/* Live SSE Pulse Dot */}
        {isConnected && (
          <span
            className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-white"
            title="Real-time connected"
          />
        )}

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full shadow-sm ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-white rounded-2xl shadow-2xl border border-sand-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-[#FBF8F1] border-b border-sand-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-ink-950 text-sm">Notifications</span>
              {isConnected ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  Reconnecting
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-forest-800 hover:text-forest-900 transition-colors flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Web Push Prompt (if not granted) */}
          {pushSupported && pushPermission === "default" && (
            <div className="p-3 bg-forest-900 text-white flex items-center justify-between text-xs border-b border-forest-800">
              <div className="pr-2">
                <p className="font-semibold">Enable Browser Alerts</p>
                <p className="text-[11px] text-sage-200">Get instant session reminders on device</p>
              </div>
              <button
                onClick={handleEnablePush}
                disabled={subscribingPush}
                className="px-2.5 py-1 text-[11px] font-bold bg-emerald-400 text-forest-950 rounded-lg hover:bg-emerald-300 transition-colors shrink-0"
              >
                {subscribingPush ? "Enabling..." : "Turn On"}
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100">
            {isLoading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-ink-700">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-sage-100 text-forest-800 flex items-center justify-center mx-auto">
                  <Bell className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-xs font-semibold text-ink-950">You're all caught up!</p>
                <p className="text-[11px] text-ink-700">No new alerts at this time.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-[#FBF8F1] cursor-pointer transition-colors ${
                    !item.isRead ? "bg-emerald-50/40" : ""
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white border border-gray-200 shadow-xs shrink-0 mt-0.5">
                    {getCategoryIcon(item.category)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`text-xs truncate ${
                          !item.isRead
                            ? "font-bold text-ink-950"
                            : "font-medium text-ink-700"
                        }`}
                      >
                        {item.title}
                      </p>
                      <span className="text-[10px] text-gray-600 shrink-0">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-ink-700 line-clamp-2 mt-0.5 leading-relaxed">
                      {item.message}
                    </p>

                    {item.priority === "urgent" && (
                      <span className="inline-block mt-1 text-[9px] uppercase font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                        Urgent
                      </span>
                    )}
                  </div>

                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-[#FBF8F1] border-t border-sand-200 flex items-center justify-between text-xs">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="font-bold text-forest-800 hover:text-forest-900 transition-colors flex items-center gap-1"
            >
              <span>View all notifications</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/settings/notifications"
              onClick={() => setIsOpen(false)}
              className="text-ink-700 hover:text-ink-950 transition-colors p-1 rounded-md"
              title="Notification Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
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

