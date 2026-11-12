"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Globe,
  Timer,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export interface BookingSlot {
  startTimeUtc: string;
  endTimeUtc: string;
  startTimeLocal: string;
  endTimeLocal: string;
  durationMinutes: number;
  available: boolean;
  reason?: string;
}

interface BookingCalendarProps {
  mentorId: string;
  mentorName: string;
  onSlotSelected: (slot: {
    slot: BookingSlot;
    holdId?: string;
    expiresAt?: string;
  }) => void;
  selectedDuration: number;
  onDurationChange: (duration: number) => void;
}

const COMMON_TIMEZONES = [
  { value: "Asia/Kolkata", label: "India Standard Time (IST, GMT+5:30)" },
  { value: "America/New_York", label: "US Eastern Time (EST/EDT)" },
  { value: "America/Los_Angeles", label: "US Pacific Time (PST/PDT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT/BST)" },
  { value: "Asia/Dubai", label: "Gulf Standard Time (GST, GMT+4)" },
  { value: "Asia/Singapore", label: "Singapore Time (SGT, GMT+8)" },
  { value: "UTC", label: "Coordinated Universal Time (UTC)" },
];

export function BookingCalendar({
  mentorId,
  mentorName,
  onSlotSelected,
  selectedDuration,
  onDurationChange,
}: BookingCalendarProps) {
  // Viewer Timezone (autodetect or default to IST)
  const [timezone, setTimezone] = useState<string>("Asia/Kolkata");
  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) setTimezone(detected);
    } catch {
      // Default to IST
    }
  }, []);

  const [dateOffset, setDateOffset] = useState(0); // in weeks
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);

  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Hold State
  const [holding, setHolding] = useState<boolean>(false);
  const [activeHold, setActiveHold] = useState<{
    id: string;
    expiresAt: string;
  } | null>(null);
  const [holdSecondsRemaining, setHoldSecondsRemaining] = useState<number>(0);

  // Compute 7-day window from current offset
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + dateOffset * 7);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const startDateStr = startDate.toISOString().slice(0, 10);
  const endDateStr = endDate.toISOString().slice(0, 10);

  // Set default selected date if none
  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(startDateStr);
    }
  }, [startDateStr, selectedDate]);

  // Fetch slots from API
  useEffect(() => {
    let isCancelled = false;
    async function loadSlots() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/mentors/${mentorId}/availability?startDate=${startDateStr}&endDate=${endDateStr}&duration=${selectedDuration}&timezone=${encodeURIComponent(
            timezone
          )}`
        );
        const data = await res.json();
        if (!isCancelled) {
          if (data.success && Array.isArray(data.slots)) {
            setSlots(data.slots);
          } else {
            setError(data.error || "Failed to load availability");
          }
        }
      } catch (err: any) {
        if (!isCancelled) setError(err.message || "Failed to load schedule");
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadSlots();
    return () => {
      isCancelled = true;
    };
  }, [mentorId, startDateStr, endDateStr, selectedDuration, timezone]);

  // Countdown timer for active hold
  useEffect(() => {
    if (!activeHold) return;

    const interval = setInterval(() => {
      const diffMs = new Date(activeHold.expiresAt).getTime() - Date.now();
      const secs = Math.max(0, Math.floor(diffMs / 1000));
      setHoldSecondsRemaining(secs);

      if (secs <= 0) {
        setActiveHold(null);
        setSelectedSlot(null);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeHold]);

  // Group slots by local date string
  const daysInView: { dateStr: string; dateObj: Date; dayName: string; dayNum: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    daysInView.push({
      dateStr: d.toISOString().slice(0, 10),
      dateObj: d,
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.getDate(),
    });
  }

  // Filter slots for the currently selected date
  const slotsForSelectedDate = slots.filter((slot) => {
    try {
      const slotLocal = new Date(slot.startTimeUtc);
      const localDateStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(slotLocal);
      return localDateStr === selectedDate;
    } catch {
      return slot.startTimeUtc.startsWith(selectedDate);
    }
  });

  // Handle slot reservation / hold
  const handleSelectSlot = async (slot: BookingSlot) => {
    if (!slot.available) return;
    setHolding(true);
    setSelectedSlot(slot);

    try {
      const idempotencyKey = `hold-${mentorId.slice(0, 8)}-${Date.parse(slot.startTimeUtc)}`;
      const res = await fetch("/api/calendar/holds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorProfileId: mentorId,
          startTimeUtc: slot.startTimeUtc,
          endTimeUtc: slot.endTimeUtc,
          sessionDurationMinutes: selectedDuration,
          idempotencyKey,
          holdDurationMinutes: 10,
        }),
      });

      const data = await res.json();
      if (data.success && data.hold) {
        setActiveHold({
          id: data.hold.id,
          expiresAt: data.expiresAt || data.hold.expires_at,
        });
        const remaining = Math.max(
          0,
          Math.floor((new Date(data.expiresAt || data.hold.expires_at).getTime() - Date.now()) / 1000)
        );
        setHoldSecondsRemaining(remaining);
        onSlotSelected({
          slot,
          holdId: data.hold.id,
          expiresAt: data.expiresAt || data.hold.expires_at,
        });
      } else {
        // Fallback: slot is selected locally
        onSlotSelected({ slot });
      }
    } catch {
      onSlotSelected({ slot });
    } finally {
      setHolding(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-border/80 space-y-6">
      {/* Header with Title & Timezone Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink-950 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-forest-700" />
            <span>Select Date & Time</span>
          </h2>
          <p className="text-xs text-ink-700 mt-0.5">
            Real-time availability for {mentorName}. Times convert automatically to your local clock.
          </p>
        </div>

        {/* Timezone Picker */}
        <div className="flex items-center gap-2 bg-cream-50 px-3 py-1.5 rounded-2xl border border-border">
          <Globe className="w-3.5 h-3.5 text-forest-700 flex-shrink-0" />
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="text-xs font-semibold bg-transparent text-ink-950 focus:outline-none cursor-pointer"
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Duration Pills */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-2">
          Session Duration
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[15, 30, 45, 60].map((dur) => (
            <button
              key={dur}
              type="button"
              onClick={() => onDurationChange(dur)}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                selectedDuration === dur
                  ? "bg-forest-900 text-white shadow-sm"
                  : "bg-cream-100/70 text-ink-700 hover:bg-cream-100 border border-border/40"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{dur} min</span>
            </button>
          ))}
        </div>
      </div>

      {/* Date Navigation & Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-ink-950">
            {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
            {endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setDateOffset((prev) => Math.max(0, prev - 1))}
              disabled={dateOffset === 0}
              className="p-1.5 rounded-lg border border-border bg-white text-ink-700 hover:bg-cream-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDateOffset((prev) => prev + 1)}
              className="p-1.5 rounded-lg border border-border bg-white text-ink-700 hover:bg-cream-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 7-Day Buttons */}
        <div className="grid grid-cols-7 gap-1.5">
          {daysInView.map((d) => {
            const isSelected = selectedDate === d.dateStr;
            const isPast = d.dateObj < new Date(today.setHours(0, 0, 0, 0));
            return (
              <button
                key={d.dateStr}
                type="button"
                disabled={isPast}
                onClick={() => setSelectedDate(d.dateStr)}
                className={`py-3 px-1 rounded-2xl text-center transition-all flex flex-col items-center justify-center ${
                  isSelected
                    ? "bg-forest-900 text-white shadow-sm ring-2 ring-forest-700"
                    : isPast
                    ? "opacity-30 bg-cream-50/50 cursor-not-allowed text-ink-700"
                    : "bg-cream-50 hover:bg-cream-100 text-ink-950 border border-border/50"
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider">{d.dayName}</span>
                <span className="text-base font-extrabold mt-0.5">{d.dayNum}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-ink-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-forest-700" />
            <span>Available Slots ({slotsForSelectedDate.filter((s) => s.available).length})</span>
          </label>

          {/* Active Hold Countdown Badge */}
          {activeHold && holdSecondsRemaining > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-bold animate-pulse">
              <Timer className="w-3.5 h-3.5 text-amber-700" />
              <span>Held for {formatCountdown(holdSecondsRemaining)}</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-ink-700 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-forest-700" />
            <span className="text-xs font-semibold">Calculating real-time slots...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : slotsForSelectedDate.length === 0 ? (
          <div className="p-8 text-center bg-cream-50/60 rounded-2xl border border-dashed border-border">
            <CalendarIcon className="w-8 h-8 text-ink-700/40 mx-auto mb-2" />
            <p className="text-xs font-bold text-ink-950">No bookable slots on this date</p>
            <p className="text-[11px] text-ink-700 mt-1">
              Please select another date in the week strip above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
            {slotsForSelectedDate.map((slot) => {
              const isSelected =
                selectedSlot?.startTimeUtc === slot.startTimeUtc;
              return (
                <button
                  key={slot.startTimeUtc}
                  type="button"
                  disabled={!slot.available || holding}
                  onClick={() => handleSelectSlot(slot)}
                  className={`p-3 rounded-2xl text-left border transition-all relative ${
                    isSelected
                      ? "bg-forest-900 text-white border-forest-900 shadow-md ring-2 ring-forest-700"
                      : slot.available
                      ? "bg-white hover:bg-sage-100/50 text-ink-950 border-border hover:border-forest-700"
                      : "bg-cream-100/40 text-ink-700/50 border-border/40 cursor-not-allowed line-through"
                  }`}
                >
                  <div className="text-xs font-bold">{slot.startTimeLocal}</div>
                  <div className="text-[10px] opacity-75 mt-0.5">
                    {slot.durationMinutes} min • {timezone.split("/")[1]?.replace(/_/g, " ") || timezone}
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute top-2.5 right-2.5" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Concurrency & Privacy Reassurance */}
      <div className="pt-2 border-t border-border/60 flex items-center gap-2 text-[11px] text-ink-700">
        <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span>
          <strong>Atomic Lock Guarantee:</strong> Your selected slot is held exclusively for 10 minutes while you confirm your details. Double bookings are strictly prevented.
        </span>
      </div>
    </div>
  );
}
