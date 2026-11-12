"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  Moon,
  Clock,
  Globe,
  Shield,
  Smartphone,
  Mail,
  Calendar,
  MessageSquare,
  CreditCard,
  Users,
  Video,
  Megaphone,
  Sparkles,
  ArrowLeft,
  Send,
  AlertCircle,
} from "lucide-react";

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "India Standard Time (IST) — Asia/Kolkata (UTC+05:30)" },
  { value: "UTC", label: "Coordinated Universal Time (UTC) — UTC+00:00" },
  { value: "America/New_York", label: "Eastern Time (ET) — America/New_York" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT) — America/Los_Angeles" },
  { value: "America/Chicago", label: "Central Time (CT) — America/Chicago" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT/BST) — Europe/London" },
  { value: "Europe/Berlin", label: "Central European Time (CET) — Europe/Berlin" },
  { value: "Asia/Dubai", label: "Gulf Standard Time (GST) — Asia/Dubai (UTC+04:00)" },
  { value: "Asia/Singapore", label: "Singapore Time (SGT) — Asia/Singapore (UTC+08:00)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET) — Australia/Sydney" },
];

export default function NotificationPreferencesPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [testingPush, setTestingPush] = useState<boolean>(false);
  const [pushStatusMessage, setPushStatusMessage] = useState<string>("");

  const [pushPermission, setPushPermission] = useState<string>("default");
  const [pushSupported, setPushSupported] = useState<boolean>(false);

  // Preference fields
  const [inAppEnabled, setInAppEnabled] = useState<boolean>(true);
  const [pushEnabled, setPushEnabled] = useState<boolean>(true);
  const [emailEnabled, setEmailEnabled] = useState<boolean>(true);

  const [bookingReminders, setBookingReminders] = useState<boolean>(true);
  const [chatMessages, setChatMessages] = useState<boolean>(true);
  const [mentorshipUpdates, setMentorshipUpdates] = useState<boolean>(true);
  const [mockInterviewAlerts, setMockInterviewAlerts] = useState<boolean>(true);
  const [paymentReceipts, setPaymentReceipts] = useState<boolean>(true);
  const [marketingAnnouncements, setMarketingAnnouncements] = useState<boolean>(false);

  const [quietHoursEnabled, setQuietHoursEnabled] = useState<boolean>(false);
  const [quietHoursStart, setQuietHoursStart] = useState<string>("22:00");
  const [quietHoursEnd, setQuietHoursEnd] = useState<string>("08:00");
  const [timezone, setTimezone] = useState<string>("Asia/Kolkata");

  useEffect(() => {
    loadPreferences();

    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setPushSupported(true);
      setPushPermission(Notification.permission);
    }
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/preferences");
      if (res.ok) {
        const data = await res.json();
        const p = data.preferences || {};
        if (p.inAppEnabled !== undefined) setInAppEnabled(p.inAppEnabled);
        if (p.pushEnabled !== undefined) setPushEnabled(p.pushEnabled);
        if (p.emailEnabled !== undefined) setEmailEnabled(p.emailEnabled);

        if (p.bookingReminders !== undefined) setBookingReminders(p.bookingReminders);
        if (p.chatMessages !== undefined) setChatMessages(p.chatMessages);
        if (p.mentorshipUpdates !== undefined) setMentorshipUpdates(p.mentorshipUpdates);
        if (p.mockInterviewAlerts !== undefined) setMockInterviewAlerts(p.mockInterviewAlerts);
        if (p.paymentReceipts !== undefined) setPaymentReceipts(p.paymentReceipts);
        if (p.marketingAnnouncements !== undefined) setMarketingAnnouncements(p.marketingAnnouncements);

        if (p.quietHoursEnabled !== undefined) setQuietHoursEnabled(p.quietHoursEnabled);
        if (p.quietHoursStart) setQuietHoursStart(p.quietHoursStart);
        if (p.quietHoursEnd) setQuietHoursEnd(p.quietHoursEnd);
        if (p.timezone) setTimezone(p.timezone);
      }
    } catch (err) {
      console.error("Error loading preferences:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inAppEnabled,
          pushEnabled,
          emailEnabled,
          bookingReminders,
          chatMessages,
          mentorshipUpdates,
          mockInterviewAlerts,
          paymentReceipts,
          marketingAnnouncements,
          quietHoursEnabled,
          quietHoursStart,
          quietHoursEnd,
          timezone,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error("Error updating preferences:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleEnablePush = async () => {
    if (!pushSupported) return;
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

        setPushStatusMessage("Browser push subscribed successfully!");
        setPushEnabled(true);
      } else {
        setPushStatusMessage("Browser permission was denied. Please allow notifications in site settings.");
      }
    } catch (err: any) {
      setPushStatusMessage(`Error: ${err.message}`);
    }
  };

  const handleTestPush = async () => {
    setTestingPush(true);
    setPushStatusMessage("");
    try {
      const res = await fetch("/api/notifications/push/test", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setPushStatusMessage("Test push alert dispatched! Check your device notifications.");
      } else {
        setPushStatusMessage(data.error || "Failed to dispatch test alert.");
      }
    } catch (err: any) {
      setPushStatusMessage(`Error: ${err.message}`);
    } finally {
      setTestingPush(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/notifications"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-800 hover:text-forest-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Notification Center</span>
          </Link>
          <h1 className="font-serif text-3xl font-bold text-ink-950 mt-2">
            Notification Settings
          </h1>
          <p className="text-xs text-ink-700 mt-1">
            Choose what you receive, configure browser alerts, and set quiet hours.
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-sand-200">
            <div className="w-8 h-8 border-2 border-forest-800 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-ink-700 mt-2">Loading preferences...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success Banner */}
            {saveSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center gap-3 text-xs font-semibold animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-700" />
                <span>Notification preferences saved successfully.</span>
              </div>
            )}

            {/* SECTION 1: DELIVERY CHANNELS */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sand-200 shadow-sm space-y-6">
              <div>
                <h2 className="font-serif text-lg font-bold text-ink-950">Delivery Channels</h2>
                <p className="text-xs text-ink-700">Choose where alerts are sent.</p>
              </div>

              <div className="space-y-4 divide-y divide-gray-100">
                {/* In-App Notifications */}
                <div className="flex items-center justify-between pt-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-sage-100 text-forest-800 shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink-950">In-App Notifications</p>
                      <p className="text-[11px] text-ink-700">
                        Display badges, live bell alerts, and real-time popups inside MentorMaze.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={inAppEnabled}
                    onChange={(e) => setInAppEnabled(e.target.checked)}
                    className="w-4 h-4 text-forest-800 rounded border-sand-200 focus:ring-forest-800 cursor-pointer"
                  />
                </div>

                {/* Browser Web Push */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-sage-100 text-forest-800 shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink-950">Browser Push Notifications</p>
                      <p className="text-[11px] text-ink-700">
                        Receive desktop and mobile notifications even when the browser tab is closed.
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            pushPermission === "granted"
                              ? "bg-emerald-100 text-emerald-800"
                              : pushPermission === "denied"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          Permission: {pushPermission}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-10 sm:pl-0">
                    {pushPermission !== "granted" ? (
                      <button
                        onClick={handleEnablePush}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-forest-900 text-white hover:bg-forest-800 transition-colors"
                      >
                        Request Permission
                      </button>
                    ) : (
                      <button
                        onClick={handleTestPush}
                        disabled={testingPush}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-sand-200 text-forest-800 hover:bg-sage-100 transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>{testingPush ? "Sending..." : "Test Push"}</span>
                      </button>
                    )}
                    <input
                      type="checkbox"
                      checked={pushEnabled}
                      onChange={(e) => setPushEnabled(e.target.checked)}
                      className="w-4 h-4 text-forest-800 rounded border-sand-200 focus:ring-forest-800 cursor-pointer"
                    />
                  </div>
                </div>

                {pushStatusMessage && (
                  <p className="text-[11px] font-medium text-forest-800 bg-sage-100/60 p-2.5 rounded-xl">
                    {pushStatusMessage}
                  </p>
                )}

                {/* Email Notifications */}
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-sage-100 text-forest-800 shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink-950">Email Notifications</p>
                      <p className="text-[11px] text-ink-700">
                        Receive email summaries for calendar bookings, receipts, and important platform updates.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={(e) => setEmailEnabled(e.target.checked)}
                    className="w-4 h-4 text-forest-800 rounded border-sand-200 focus:ring-forest-800 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: CATEGORY PREFERENCES */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sand-200 shadow-sm space-y-6">
              <div>
                <h2 className="font-serif text-lg font-bold text-ink-950">Activity Alerts</h2>
                <p className="text-xs text-ink-700">
                  Select which events trigger alerts. Security alerts are always active.
                </p>
              </div>

              <div className="space-y-4 divide-y divide-gray-100">
                {/* Booking Reminders */}
                <div className="flex items-center justify-between pt-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink-950">Session Reminders</p>
                      <p className="text-[11px] text-ink-700">
                        24-hour, 1-hour, and 15-minute countdown reminders before scheduled sessions.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={bookingReminders}
                    onChange={(e) => setBookingReminders(e.target.checked)}
                    className="w-4 h-4 text-forest-800 rounded border-sand-200 focus:ring-forest-800 cursor-pointer"
                  />
                </div>

                {/* Chat Messages */}
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-800 shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink-950">Direct Messages</p>
                      <p className="text-[11px] text-ink-700">
                        New chat messages and replies from your mentor or mentee.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={chatMessages}
                    onChange={(e) => setChatMessages(e.target.checked)}
                    className="w-4 h-4 text-forest-800 rounded border-sand-200 focus:ring-forest-800 cursor-pointer"
                  />
                </div>

                {/* Mentorship Updates */}
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-purple-100 text-purple-800 shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink-950">Mentorship Status</p>
                      <p className="text-[11px] text-ink-700">
                        Applications, booking acceptances, reschedules, and feedback reviews.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={mentorshipUpdates}
                    onChange={(e) => setMentorshipUpdates(e.target.checked)}
                    className="w-4 h-4 text-forest-800 rounded border-sand-200 focus:ring-forest-800 cursor-pointer"
                  />
                </div>

                {/* Mock Interviews */}
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-teal-100 text-teal-800 shrink-0">
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink-950">Mock Interview Practice</p>
                      <p className="text-[11px] text-ink-700">
                        Room availability, AI transcriptions, scorecards, and performance feedback.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={mockInterviewAlerts}
                    onChange={(e) => setMockInterviewAlerts(e.target.checked)}
                    className="w-4 h-4 text-forest-800 rounded border-sand-200 focus:ring-forest-800 cursor-pointer"
                  />
                </div>

                {/* Payment Receipts */}
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink-950">Payments & Invoicing</p>
                      <p className="text-[11px] text-ink-700">
                        Payment confirmations, tax invoices, and mentor payout settlements.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={paymentReceipts}
                    onChange={(e) => setPaymentReceipts(e.target.checked)}
                    className="w-4 h-4 text-forest-800 rounded border-sand-200 focus:ring-forest-800 cursor-pointer"
                  />
                </div>

                {/* Platform Announcements */}
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-orange-100 text-orange-800 shrink-0">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink-950">Platform Announcements</p>
                      <p className="text-[11px] text-ink-700">
                        Feature updates, community events, and career mentorship tips.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={marketingAnnouncements}
                    onChange={(e) => setMarketingAnnouncements(e.target.checked)}
                    className="w-4 h-4 text-forest-800 rounded border-sand-200 focus:ring-forest-800 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: QUIET HOURS & TIMEZONE */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sand-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-lg font-bold text-ink-950 flex items-center gap-2">
                    <Moon className="w-5 h-5 text-purple-700" />
                    <span>Quiet Hours & Schedule</span>
                  </h2>
                  <p className="text-xs text-ink-700">
                    Mute sound and push notifications during your sleep or rest hours.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={quietHoursEnabled}
                  onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                  className="w-4 h-4 text-forest-800 rounded border-sand-200 focus:ring-forest-800 cursor-pointer"
                />
              </div>

              {quietHoursEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-ink-950 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      <span>Quiet Hours Start</span>
                    </label>
                    <input
                      type="time"
                      value={quietHoursStart}
                      onChange={(e) => setQuietHoursStart(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-sand-200 text-xs text-ink-950 focus:outline-none focus:ring-2 focus:ring-forest-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-ink-950 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      <span>Quiet Hours End</span>
                    </label>
                    <input
                      type="time"
                      value={quietHoursEnd}
                      onChange={(e) => setQuietHoursEnd(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-sand-200 text-xs text-ink-950 focus:outline-none focus:ring-2 focus:ring-forest-800"
                    />
                  </div>
                </div>
              )}

              {/* Timezone Selector */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-ink-950 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-gray-500" />
                  <span>Your Timezone</span>
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-sand-200 text-xs text-ink-950 bg-white focus:outline-none focus:ring-2 focus:ring-forest-800"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mandatory Security Delivery Notice */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
                <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  <strong>Mandatory Security Delivery:</strong> Critical security alerts (e.g. password resets, unauthorized login attempts, session cancellations) bypass quiet hours and suppression rules to ensure account integrity.
                </p>
              </div>
            </div>

            {/* Save Button Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/notifications"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-ink-700 bg-white border border-sand-200 hover:bg-sage-100 transition-colors"
              >
                Cancel
              </Link>
              <button
                onClick={handleSavePreferences}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-forest-900 hover:bg-forest-800 transition-colors shadow-sm flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Preferences</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
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

