"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { store } from "@/lib/data/store";
import { ArrowLeft, Clock, Calendar, CheckCircle2, Save } from "lucide-react";

export default function MentorAvailabilityPage() {
  const [scheduleType, setScheduleType] = useState<"weekly" | "dates">("weekly");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [days, setDays] = useState([
    { name: "Mon", dayIndex: 1, startTime: "18:00", endTime: "21:00", active: true },
    { name: "Tue", dayIndex: 2, startTime: "17:00", endTime: "21:00", active: true },
    { name: "Wed", dayIndex: 3, startTime: "18:00", endTime: "20:00", active: true },
    { name: "Thu", dayIndex: 4, startTime: "17:00", endTime: "20:00", active: false },
    { name: "Fri", dayIndex: 5, startTime: "18:00", endTime: "21:00", active: true },
    { name: "Sat", dayIndex: 6, startTime: "10:00", endTime: "14:00", active: false },
    { name: "Sun", dayIndex: 0, startTime: "10:00", endTime: "14:00", active: false },
  ]);

  const toggleDay = (index: number) => {
    const updated = [...days];
    updated[index].active = !updated[index].active;
    setDays(updated);
  };

  const updateTime = (index: number, field: "startTime" | "endTime", value: string) => {
    const updated = [...days];
    updated[index][field] = value;
    setDays(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto px-4 py-10 w-full space-y-6">
        <div className="mb-4">
          <Link
            href="/mentor/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-ink-700 hover:text-forest-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Mentor Space</span>
          </Link>
        </div>

        <div className="card-warm bg-white p-8 rounded-3xl shadow-card">
          <div className="flex items-center gap-3 pb-6 border-b border-border">
            <div className="w-10 h-10 rounded-2xl bg-sage-100 flex items-center justify-center text-forest-900">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-ink-950">Set Your Availability</h1>
              <p className="text-xs text-ink-700">
                Choose the recurring time slots when you are available for student bookings.
              </p>
            </div>
          </div>

          {saveSuccess && (
            <div className="my-4 p-3.5 rounded-2xl bg-sage-100 text-forest-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Availability schedule saved and published to calendar.</span>
            </div>
          )}

          {/* Schedule Type Toggle */}
          <div className="my-6 grid grid-cols-2 gap-2 p-1 bg-cream-100 rounded-xl">
            <button
              onClick={() => setScheduleType("weekly")}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                scheduleType === "weekly" ? "bg-white text-forest-900 shadow-sm" : "text-ink-700"
              }`}
            >
              Weekly Schedule
            </button>
            <button
              onClick={() => setScheduleType("dates")}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                scheduleType === "dates" ? "bg-white text-forest-900 shadow-sm" : "text-ink-700"
              }`}
            >
              Specific Dates
            </button>
          </div>

          {/* Days List */}
          <div className="space-y-3 mb-8">
            {days.map((d, index) => (
              <div
                key={d.name}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  d.active ? "bg-cream-50 border-border" : "bg-white border-border/60 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3 w-20">
                  <span className="font-bold text-sm text-ink-950">{d.name}</span>
                </div>

                <div className="flex items-center gap-2 flex-1 justify-center">
                  {d.active ? (
                    <>
                      <input
                        type="time"
                        value={d.startTime}
                        onChange={(e) => updateTime(index, "startTime", e.target.value)}
                        className="p-1.5 rounded-lg border border-border text-xs text-ink-950 bg-white"
                      />
                      <span className="text-xs text-ink-400">–</span>
                      <input
                        type="time"
                        value={d.endTime}
                        onChange={(e) => updateTime(index, "endTime", e.target.value)}
                        className="p-1.5 rounded-lg border border-border text-xs text-ink-950 bg-white"
                      />
                    </>
                  ) : (
                    <span className="text-xs text-ink-400 italic">Not Available</span>
                  )}
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={d.active}
                    onChange={() => toggleDay(index)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-sand-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-forest-900"></div>
                </label>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <button
              onClick={handleSave}
              className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Availability</span>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
