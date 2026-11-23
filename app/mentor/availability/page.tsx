"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  ArrowLeft,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  Sliders,
  ShieldCheck,
  CalendarCheck,
  AlertTriangle,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface TimeWindow {
  startTime: string;
  endTime: string;
}

interface DayRule {
  dayOfWeek: number;
  dayName: string;
  isActive: boolean;
  windows: TimeWindow[];
}

interface Settings {
  bufferTimeMinutes: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
  dailySessionLimit: number;
  weeklySessionLimit: number;
  timezone: string;
}

interface ExceptionItem {
  id: string;
  exceptionDate: string;
  isBlocked: boolean;
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
}

const DAYS_OF_WEEK = [
  { index: 1, name: "Monday" },
  { index: 2, name: "Tuesday" },
  { index: 3, name: "Wednesday" },
  { index: 4, name: "Thursday" },
  { index: 5, name: "Friday" },
  { index: 6, name: "Saturday" },
  { index: 0, name: "Sunday" },
];

export default function MentorAvailabilityPage() {
  const [activeTab, setActiveTab] = useState<"weekly" | "exceptions" | "settings">("weekly");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Weekly Schedule State
  const [days, setDays] = useState<DayRule[]>(
    DAYS_OF_WEEK.map((d) => ({
      dayOfWeek: d.index,
      dayName: d.name,
      isActive: d.index >= 1 && d.index <= 5,
      windows:
        d.index >= 1 && d.index <= 5
          ? [{ startTime: "10:00", endTime: "18:00" }]
          : [{ startTime: "10:00", endTime: "14:00" }],
    }))
  );

  // Settings State
  const [settings, setSettings] = useState<Settings>({
    bufferTimeMinutes: 15,
    minNoticeHours: 2,
    maxAdvanceDays: 30,
    dailySessionLimit: 4,
    weeklySessionLimit: 20,
    timezone: "Asia/Kolkata",
  });

  // Exceptions State
  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);
  const [newExDate, setNewExDate] = useState("");
  const [newExType, setNewExType] = useState<"block" | "custom">("block");
  const [newExStart, setNewExStart] = useState("10:00");
  const [newExEnd, setNewExEnd] = useState("14:00");
  const [newExReason, setNewExReason] = useState("");
  const [addingException, setAddingException] = useState(false);

  // Google Calendar Connection State
  const [calendarConnection, setCalendarConnection] = useState<any>(null);
  const [syncingCalendar, setSyncingCalendar] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Pre-save Conflict Dialog State
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictData, setConflictData] = useState<any[]>([]);

  // Load schedule on mount
  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/mentor/availability");
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.rules) && data.rules.length > 0) {
          const mergedDays = DAYS_OF_WEEK.map((d) => {
            const found = data.rules.find((r: any) => r.dayOfWeek === d.index);
            return {
              dayOfWeek: d.index,
              dayName: d.name,
              isActive: found ? found.isActive : false,
              windows:
                found && found.windows && found.windows.length > 0
                  ? found.windows
                  : [{ startTime: "10:00", endTime: "18:00" }],
            };
          });
          setDays(mergedDays);
        }

        if (data.settings) {
          setSettings({
            bufferTimeMinutes: data.settings.bufferTimeMinutes ?? 15,
            minNoticeHours: data.settings.minNoticeHours ?? 2,
            maxAdvanceDays: data.settings.maxAdvanceDays ?? 30,
            dailySessionLimit: data.settings.dailySessionLimit ?? 4,
            weeklySessionLimit: data.settings.weeklySessionLimit ?? 20,
            timezone: data.settings.timezone || "Asia/Kolkata",
          });
        }

        if (Array.isArray(data.exceptions)) {
          setExceptions(data.exceptions);
        }

        if (data.calendarConnection) {
          setCalendarConnection(data.calendarConnection);
        }
      } else {
        setErrorMessage(data.error || "Failed to load schedule");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  };

  // Toggle Day Active
  const toggleDay = (dayOfWeek: number) => {
    setDays((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, isActive: !d.isActive } : d))
    );
  };

  // Add Time Window to a Day
  const addWindow = (dayOfWeek: number) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        return {
          ...d,
          windows: [...d.windows, { startTime: "18:00", endTime: "21:00" }],
        };
      })
    );
  };

  // Remove Time Window from a Day
  const removeWindow = (dayOfWeek: number, windowIndex: number) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        const newWins = d.windows.filter((_, idx) => idx !== windowIndex);
        return {
          ...d,
          windows: newWins.length > 0 ? newWins : [{ startTime: "09:00", endTime: "17:00" }],
          isActive: newWins.length > 0 ? d.isActive : false,
        };
      })
    );
  };

  // Update Window Times
  const updateWindow = (
    dayOfWeek: number,
    windowIndex: number,
    field: "startTime" | "endTime",
    val: string
  ) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        const updated = [...d.windows];
        updated[windowIndex] = { ...updated[windowIndex], [field]: val };
        return { ...d, windows: updated };
      })
    );
  };

  // Save Weekly Schedule & Settings
  const handleSaveSchedule = async (forceOverride = false) => {
    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(null);

    try {
      const payload = {
        settings,
        rules: days.map((d) => ({
          dayOfWeek: d.dayOfWeek,
          isActive: d.isActive,
          windows: d.windows,
        })),
        forceOverrideConflicts: forceOverride,
      };

      const res = await fetch("/api/mentor/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.status === 409 && data.conflict) {
        setConflictData(data.conflictingBookings || []);
        setConflictModalOpen(true);
        return;
      }

      if (data.success) {
        setConflictModalOpen(false);
        setSaveSuccess("Weekly schedule and settings successfully updated & published!");
        setTimeout(() => setSaveSuccess(null), 4000);
      } else {
        setErrorMessage(data.error || "Failed to update schedule");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update schedule");
    } finally {
      setSaving(false);
    }
  };

  // Add Date Exception
  const handleAddException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExDate) return;
    setAddingException(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/mentor/availability/exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exceptionDate: newExDate,
          isBlocked: newExType === "block",
          startTime: newExType === "custom" ? newExStart : undefined,
          endTime: newExType === "custom" ? newExEnd : undefined,
          reason: newExReason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setExceptions((prev) => [...prev, data.exception]);
        setNewExDate("");
        setNewExReason("");
        setSaveSuccess("Date exception successfully created.");
        setTimeout(() => setSaveSuccess(null), 3000);
      } else {
        setErrorMessage(data.error || "Failed to add date exception");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to add date exception");
    } finally {
      setAddingException(false);
    }
  };

  // Delete Date Exception
  const handleDeleteException = async (id: string) => {
    try {
      const res = await fetch(`/api/mentor/availability/exceptions/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setExceptions((prev) => prev.filter((ex) => ex.id !== id));
      } else {
        setErrorMessage(data.error || "Failed to delete exception");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete exception");
    }
  };

  // Sync Google Calendar
  const handleSyncGoogleCalendar = async () => {
    setSyncingCalendar(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/calendar/google/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        setSyncResult(data.message || "Sync completed successfully");
      } else {
        setSyncResult(`Sync failed: ${data.error}`);
      }
    } catch (err: any) {
      setSyncResult(`Sync failed: ${err.message}`);
    } finally {
      setSyncingCalendar(false);
      setTimeout(() => setSyncResult(null), 5000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/mentor/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-ink-700 hover:text-forest-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Mentor Space</span>
          </Link>

          <span className="text-xs font-semibold text-ink-700">
            Official Domain: mentormaze.aitathastu.com
          </span>
        </div>

        {/* Page Title & Google Calendar Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-white p-6 rounded-3xl shadow-card border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sage-100 flex items-center justify-center text-forest-900 flex-shrink-0">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold text-ink-950">Availability & Calendar</h1>
                <p className="text-xs text-ink-700 mt-0.5">
                  Configure your weekly recurring hours, custom date exceptions, buffer times, and calendar sync.
                </p>
              </div>
            </div>
          </div>

          {/* Google Calendar Card */}
          <div className="bg-white p-6 rounded-3xl shadow-card border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-xs font-bold text-ink-950">Google Calendar</span>
              </div>
              {calendarConnection?.status === "connected" ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  Connected
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-medium">
                  Not Linked
                </span>
              )}
            </div>

            <p className="text-[11px] text-ink-700 my-2">
              {calendarConnection?.status === "connected"
                ? `Syncing busy periods for ${calendarConnection.accountEmail || "your Google account"}.`
                : "Import external busy periods to avoid double bookings automatically."}
            </p>

            {calendarConnection?.status === "connected" ? (
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={handleSyncGoogleCalendar}
                  disabled={syncingCalendar}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-sage-100 hover:bg-sage-200 text-forest-900 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingCalendar ? "animate-spin" : ""}`} />
                  <span>{syncingCalendar ? "Syncing..." : "Sync Now"}</span>
                </button>
              </div>
            ) : (
              <a
                href="/api/calendar/google/auth"
                className="py-1.5 px-3 rounded-xl bg-forest-900 hover:bg-forest-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-center mt-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Connect Google</span>
              </a>
            )}

            {syncResult && (
              <p className="text-[10px] text-forest-700 mt-1 font-semibold">{syncResult}</p>
            )}
          </div>
        </div>

        {/* Global Notifications */}
        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-sm animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2 shadow-sm">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Navigation Tabs (scrollable on mobile) */}
        <div className="flex overflow-x-auto no-scrollbar whitespace-nowrap border-b border-border gap-1.5 sm:gap-2 pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("weekly")}
            className={`py-2.5 px-3.5 sm:px-4 min-h-[44px] rounded-t-2xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 flex-shrink-0 ${
              activeTab === "weekly"
                ? "bg-white text-forest-900 border-forest-900 shadow-sm"
                : "text-ink-700 border-transparent hover:text-ink-950"
            }`}
          >
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Weekly Recurring Schedule</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("exceptions")}
            className={`py-2.5 px-3.5 sm:px-4 min-h-[44px] rounded-t-2xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 flex-shrink-0 ${
              activeTab === "exceptions"
                ? "bg-white text-forest-900 border-forest-900 shadow-sm"
                : "text-ink-700 border-transparent hover:text-ink-950"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Date Exceptions ({exceptions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`py-2.5 px-3.5 sm:px-4 min-h-[44px] rounded-t-2xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 flex-shrink-0 ${
              activeTab === "settings"
                ? "bg-white text-forest-900 border-forest-900 shadow-sm"
                : "text-ink-700 border-transparent hover:text-ink-950"
            }`}
          >
            <Sliders className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Scheduling Rules</span>
          </button>
        </div>

        {/* TAB 1: WEEKLY RECURRING SCHEDULE */}
        {activeTab === "weekly" && (
          <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-card border border-border space-y-5 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-ink-950">Set Weekly Availability Windows</h3>
                <p className="text-xs text-ink-700 mt-0.5">
                  Define when you are regularly open for student mentorship sessions. You can add multiple shifts per day.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSaveSchedule(false)}
                disabled={saving}
                className="py-2.5 px-5 min-h-[44px] rounded-2xl bg-forest-900 hover:bg-forest-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 w-full sm:w-auto"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save Schedule</span>
              </button>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center items-center text-ink-700 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-forest-700" />
                <span className="text-xs font-medium">Loading schedule...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {days.map((day) => (
                  <div
                    key={day.dayOfWeek}
                    className={`p-4 rounded-2xl border transition-all ${
                      day.isActive
                        ? "bg-cream-50/50 border-border/80"
                        : "bg-cream-100/30 border-border/40 opacity-60"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`day-${day.dayOfWeek}`}
                          checked={day.isActive}
                          onChange={() => toggleDay(day.dayOfWeek)}
                          className="w-4 h-4 text-forest-900 rounded focus:ring-forest-700 cursor-pointer"
                        />
                        <label
                          htmlFor={`day-${day.dayOfWeek}`}
                          className="text-xs font-bold text-ink-950 w-24 cursor-pointer"
                        >
                          {day.dayName}
                        </label>
                      </div>

                      {/* Windows */}
                      {day.isActive ? (
                        <div className="flex-1 space-y-2">
                          {day.windows.map((win, winIdx) => (
                            <div key={winIdx} className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                              <input
                                type="time"
                                value={win.startTime}
                                onChange={(e) =>
                                  updateWindow(day.dayOfWeek, winIdx, "startTime", e.target.value)
                                }
                                className="px-2.5 sm:px-3 py-2 sm:py-1.5 min-h-[40px] rounded-xl border border-border bg-white text-sm sm:text-xs font-semibold text-ink-950 focus:outline-none focus:ring-1 focus:ring-forest-700 flex-1 sm:flex-none"
                              />
                              <span className="text-xs text-ink-700 font-bold px-1">to</span>
                              <input
                                type="time"
                                value={win.endTime}
                                onChange={(e) =>
                                  updateWindow(day.dayOfWeek, winIdx, "endTime", e.target.value)
                                }
                                className="px-2.5 sm:px-3 py-2 sm:py-1.5 min-h-[40px] rounded-xl border border-border bg-white text-sm sm:text-xs font-semibold text-ink-950 focus:outline-none focus:ring-1 focus:ring-forest-700 flex-1 sm:flex-none"
                              />

                              {/* Remove Window Button */}
                              {day.windows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeWindow(day.dayOfWeek, winIdx)}
                                  className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Remove window"
                                  aria-label="Remove window"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex-1 text-xs text-ink-700 font-medium">Unavailable</div>
                      )}

                      {/* Add Window Button */}
                      {day.isActive && (
                        <button
                          type="button"
                          onClick={() => addWindow(day.dayOfWeek)}
                          className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-forest-700 hover:text-forest-900 bg-sage-100/60 hover:bg-sage-100 px-3 py-1.5 min-h-[38px] rounded-xl transition-all self-start sm:self-auto"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Shift</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DATE EXCEPTIONS */}
        {activeTab === "exceptions" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-border space-y-6">
            <div>
              <h3 className="text-sm font-bold text-ink-950">Holidays, Vacations & Custom Hours</h3>
              <p className="text-xs text-ink-700 mt-0.5">
                Block specific calendar dates when taking time off, or add extra hours on specific days without modifying your recurring schedule.
              </p>
            </div>

            {/* Add Exception Form */}
            <form
              onSubmit={handleAddException}
              className="p-4 rounded-2xl bg-cream-50 border border-border space-y-4"
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-700">
                Add Date Override
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-ink-950 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newExDate}
                    onChange={(e) => setNewExDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-border bg-white text-xs font-semibold text-ink-950 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-ink-950 mb-1">Type</label>
                  <select
                    value={newExType}
                    onChange={(e: any) => setNewExType(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-border bg-white text-xs font-semibold text-ink-950 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  >
                    <option value="block">Block Whole Day (Unavailable)</option>
                    <option value="custom">Custom Extra Hours</option>
                  </select>
                </div>

                {newExType === "custom" && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-ink-950 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={newExStart}
                        onChange={(e) => setNewExStart(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-border bg-white text-xs font-semibold text-ink-950 focus:outline-none focus:ring-1 focus:ring-forest-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-ink-950 mb-1">End Time</label>
                      <input
                        type="time"
                        value={newExEnd}
                        onChange={(e) => setNewExEnd(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-border bg-white text-xs font-semibold text-ink-950 focus:outline-none focus:ring-1 focus:ring-forest-700"
                      />
                    </div>
                  </>
                )}

                <div className={newExType === "block" ? "sm:col-span-2" : "sm:col-span-4"}>
                  <label className="block text-[11px] font-bold text-ink-950 mb-1">
                    Reason (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vacation, Holiday, Hackathon"
                    value={newExReason}
                    onChange={(e) => setNewExReason(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-border bg-white text-xs font-semibold text-ink-950 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={addingException}
                  className="py-2 px-4 rounded-xl bg-forest-900 hover:bg-forest-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{addingException ? "Adding..." : "Add Exception"}</span>
                </button>
              </div>
            </form>

            {/* Exceptions List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-700">
                Scheduled Exceptions
              </h4>

              {exceptions.length === 0 ? (
                <div className="p-6 text-center text-xs text-ink-700 bg-cream-50/50 rounded-2xl border border-dashed border-border">
                  No date exceptions scheduled. Your recurring weekly hours apply every week.
                </div>
              ) : (
                <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden">
                  {exceptions.map((ex) => (
                    <div
                      key={ex.id}
                      className="p-3.5 bg-white flex items-center justify-between gap-4 hover:bg-cream-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            ex.isBlocked ? "bg-rose-500" : "bg-emerald-500"
                          }`}
                        />
                        <div>
                          <div className="text-xs font-bold text-ink-950">
                            {new Date(ex.exceptionDate).toLocaleDateString("en-US", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          <div className="text-[11px] text-ink-700">
                            {ex.isBlocked
                              ? "Entire Day Blocked"
                              : `Custom Hours: ${ex.startTime} – ${ex.endTime}`}{" "}
                            {ex.reason && `• ${ex.reason}`}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteException(ex.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete exception"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SCHEDULING RULES & SETTINGS */}
        {activeTab === "settings" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-border space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-ink-950">Booking Rules & Constraints</h3>
                <p className="text-xs text-ink-700 mt-0.5">
                  Protect your time with automated buffer windows, advance notice, and daily session caps.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSaveSchedule(false)}
                disabled={saving}
                className="py-2 px-5 rounded-2xl bg-forest-900 hover:bg-forest-800 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save Settings</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Buffer Time */}
              <div className="p-4 rounded-2xl border border-border bg-cream-50/50">
                <label className="block text-xs font-bold text-ink-950 mb-1">
                  Buffer Time Between Sessions
                </label>
                <p className="text-[11px] text-ink-700 mb-3">
                  Automatic breathing room inserted after every booking to prevent back-to-back fatigue.
                </p>
                <select
                  value={settings.bufferTimeMinutes}
                  onChange={(e) =>
                    setSettings({ ...settings, bufferTimeMinutes: parseInt(e.target.value, 10) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-semibold text-ink-950 focus:outline-none focus:ring-1 focus:ring-forest-700"
                >
                  <option value={0}>0 minutes (No buffer)</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes (Recommended)</option>
                  <option value={30}>30 minutes</option>
                </select>
              </div>

              {/* Minimum Notice */}
              <div className="p-4 rounded-2xl border border-border bg-cream-50/50">
                <label className="block text-xs font-bold text-ink-950 mb-1">
                  Minimum Advance Notice
                </label>
                <p className="text-[11px] text-ink-700 mb-3">
                  Hours in advance a student must book. Prevents unexpected last-minute surprises.
                </p>
                <select
                  value={settings.minNoticeHours}
                  onChange={(e) =>
                    setSettings({ ...settings, minNoticeHours: parseInt(e.target.value, 10) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-semibold text-ink-950 focus:outline-none focus:ring-1 focus:ring-forest-700"
                >
                  <option value={1}>1 hour</option>
                  <option value={2}>2 hours (Default)</option>
                  <option value={4}>4 hours</option>
                  <option value={12}>12 hours</option>
                  <option value={24}>24 hours</option>
                </select>
              </div>

              {/* Max Advance Booking */}
              <div className="p-4 rounded-2xl border border-border bg-cream-50/50">
                <label className="block text-xs font-bold text-ink-950 mb-1">
                  Maximum Future Booking Window
                </label>
                <p className="text-[11px] text-ink-700 mb-3">
                  How far into the future students can schedule sessions with you.
                </p>
                <select
                  value={settings.maxAdvanceDays}
                  onChange={(e) =>
                    setSettings({ ...settings, maxAdvanceDays: parseInt(e.target.value, 10) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-semibold text-ink-950 focus:outline-none focus:ring-1 focus:ring-forest-700"
                >
                  <option value={14}>14 days</option>
                  <option value={30}>30 days (Recommended)</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                </select>
              </div>

              {/* Daily Session Limit */}
              <div className="p-4 rounded-2xl border border-border bg-cream-50/50">
                <label className="block text-xs font-bold text-ink-950 mb-1">
                  Daily Session Limit
                </label>
                <p className="text-[11px] text-ink-700 mb-3">
                  Maximum number of mentorship sessions you are willing to conduct per day.
                </p>
                <select
                  value={settings.dailySessionLimit}
                  onChange={(e) =>
                    setSettings({ ...settings, dailySessionLimit: parseInt(e.target.value, 10) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-semibold text-ink-950 focus:outline-none focus:ring-1 focus:ring-forest-700"
                >
                  <option value={2}>2 sessions / day</option>
                  <option value={4}>4 sessions / day (Default)</option>
                  <option value={6}>6 sessions / day</option>
                  <option value={8}>8 sessions / day</option>
                </select>
              </div>

              {/* Primary Timezone */}
              <div className="sm:col-span-2 p-4 rounded-2xl border border-border bg-cream-50/50">
                <label className="block text-xs font-bold text-ink-950 mb-1">
                  Primary Mentor Timezone
                </label>
                <p className="text-[11px] text-ink-700 mb-3">
                  All your recurring hours and exceptions are interpreted using this IANA timezone.
                </p>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-semibold text-ink-950 focus:outline-none focus:ring-1 focus:ring-forest-700"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST, GMT+5:30)</option>
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST, GMT+4)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT, GMT+8)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Pre-Save Conflict Warning Modal */}
        {conflictModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink-950">Confirmed Booking Conflict</h3>
                  <p className="text-xs text-ink-700">
                    Existing confirmed student sessions overlap with your updated schedule.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900">
                <p className="font-semibold mb-1">
                  You have {conflictData.length} upcoming session(s) booked during times you are removing:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  {conflictData.map((c: any, i: number) => (
                    <li key={i}>
                      Session ID {c.id?.slice(0, 8)} at{" "}
                      {new Date(c.startTimeUtc).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-ink-700">
                To prevent student disappointment, please contact or reschedule with the affected students first, or force override if you intend to cancel these sessions.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConflictModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-ink-700 hover:bg-cream-100"
                >
                  Cancel & Review
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSchedule(true)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                >
                  Force Override & Save
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
