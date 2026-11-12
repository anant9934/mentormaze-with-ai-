"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { store } from "@/lib/data/store";
import { useAuth } from "@/lib/auth/context";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  User,
  Users,
  Video,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

export default function BookSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const mentorId = params.id as string;
  const mentor = store.getMentorById(mentorId) || store.getMentorById("mentor-priya")!;

  // Booking Flow States
  const [sessionType, setSessionType] = useState<"1:1" | "group">("1:1");
  const [selectedDateIndex, setSelectedDateIndex] = useState(1); // Default Tuesday Feb 11
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("7:30 PM");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [discussionPoints, setDiscussionPoints] = useState(
    "Career path in Software Engineering, Interview preparation strategy, Project review and feedback"
  );
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dates = [
    { day: "Mon", date: "Feb 10", fullDate: "2026-11-10" },
    { day: "Tue", date: "Feb 11", fullDate: "2026-11-11" },
    { day: "Wed", date: "Feb 12", fullDate: "2026-11-12" },
    { day: "Thu", date: "Feb 13", fullDate: "2026-11-13" },
    { day: "Fri", date: "Feb 14", fullDate: "2026-11-14" },
  ];

  const timeSlots = ["4:00 PM", "5:00 PM", "7:30 PM", "8:30 PM"];

  const calculatePrice = () => {
    if (durationMinutes === 15) return mentor.price15MinInr;
    if (durationMinutes === 60) return mentor.price60MinInr;
    return mentor.price30MinInr;
  };

  const handleConfirmBooking = () => {
    setIsSubmitting(true);
    setBookingError(null);

    const chosenDate = dates[selectedDateIndex].fullDate;
    // Map time slot string to UTC timestamp
    const hourMap: Record<string, string> = {
      "4:00 PM": "10:30:00Z", // 4:00 PM IST is 10:30 UTC
      "5:00 PM": "11:30:00Z",
      "7:30 PM": "14:00:00Z",
      "8:30 PM": "15:00:00Z",
    };
    const startUtc = `${chosenDate}T${hourMap[selectedTimeSlot] || "14:00:00Z"}`;
    const endDate = new Date(new Date(startUtc).getTime() + durationMinutes * 60000);
    const endUtc = endDate.toISOString();

    const currentStudentId = user?.id || "user-student-1";

    const result = store.createBooking({
      studentUserId: currentStudentId,
      mentorProfileId: mentor.id,
      serviceType: sessionType === "1:1" ? "1on1_mentorship" : "group_mentorship",
      sessionDurationMinutes: durationMinutes,
      startTimeUtc: startUtc,
      endTimeUtc: endUtc,
      userTimezone: "Asia/Kolkata",
      priceInr: calculatePrice(),
      studentDiscussionPoints: discussionPoints,
    });

    if (result.success && result.booking) {
      router.push(`/sessions/${result.booking.id}/confirmation`);
    } else {
      setBookingError(result.error || "Failed to complete booking. Please try another slot.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href={`/mentors/${mentor.id}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-ink-700 hover:text-forest-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Profile</span>
          </Link>
        </div>

        {/* Booking Card */}
        <div className="card-warm bg-white p-8 rounded-3xl shadow-elevated">
          {/* Header */}
          <div className="flex items-center gap-3 pb-6 border-b border-border">
            <div className="w-10 h-10 rounded-2xl bg-sage-100 flex items-center justify-center text-forest-900">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-ink-950">Book a Session</h1>
              <p className="text-xs text-ink-700">
                Schedule a mentorship session with {mentor.headline}.
              </p>
            </div>
          </div>

          {/* Mentor Preview Mini Card */}
          <div className="my-6 p-4 rounded-2xl bg-cream-50 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-cream-100">
                <Image
                  src={
                    mentor.userId === "user-mentor-priya"
                      ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80"
                      : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                  }
                  alt={mentor.headline}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-sm text-ink-950">
                  <span>{mentor.userId === "user-mentor-priya" ? "Priya Sharma" : "Rohan Mehta"}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-xs text-ink-500">{mentor.headline}</p>
              </div>
            </div>
            <span className="badge-match text-xs font-semibold">
              <Sparkles className="w-3 h-3 text-emerald-700" />
              <span>96% Match</span>
            </span>
          </div>

          {/* Error Banner */}
          {bookingError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{bookingError}</span>
            </div>
          )}

          {/* STEP 1: CHOOSE SESSION TYPE */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-forest-900 text-white text-[11px] font-bold flex items-center justify-center">
                1
              </span>
              <h2 className="text-xs font-bold text-ink-950 uppercase tracking-wider">
                Choose Session Type
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSessionType("1:1")}
                className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  sessionType === "1:1"
                    ? "border-forest-900 bg-sage-50 ring-2 ring-forest-900/10"
                    : "border-border hover:bg-cream-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-forest-900">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink-950">1:1 Session</h4>
                    <p className="text-[11px] text-ink-500">Personal, focused guidance</p>
                  </div>
                </div>
                {sessionType === "1:1" && (
                  <CheckCircle2 className="w-4 h-4 text-forest-900 flex-shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setSessionType("group")}
                className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  sessionType === "group"
                    ? "border-forest-900 bg-sage-50 ring-2 ring-forest-900/10"
                    : "border-border hover:bg-cream-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-forest-900">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink-950">Group Session</h4>
                    <p className="text-[11px] text-ink-500">Learn and discuss together</p>
                  </div>
                </div>
                {sessionType === "group" && (
                  <CheckCircle2 className="w-4 h-4 text-forest-900 flex-shrink-0" />
                )}
              </button>
            </div>

            {/* Duration Selector */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-ink-500">Duration:</span>
              {[15, 30, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    durationMinutes === mins
                      ? "bg-forest-900 text-white"
                      : "bg-cream-100 text-ink-700 border border-border hover:bg-cream-200"
                  }`}
                >
                  {mins} Mins
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: SELECT DATE & TIME */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-forest-900 text-white text-[11px] font-bold flex items-center justify-center">
                  2
                </span>
                <h2 className="text-xs font-bold text-ink-950 uppercase tracking-wider">
                  Select a Date & Time
                </h2>
              </div>
              <span className="text-xs font-semibold text-ink-500">IST (GMT+5:30)</span>
            </div>

            {/* Date Picker Carousel */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {dates.map((d, index) => {
                const isSelected = selectedDateIndex === index;
                return (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => setSelectedDateIndex(index)}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? "bg-forest-900 text-white border-forest-900 shadow-sm"
                        : "bg-white text-ink-950 border-border hover:bg-cream-100"
                    }`}
                  >
                    <span className="block text-[11px] opacity-80">{d.day}</span>
                    <span className="block text-xs font-bold mt-0.5">{d.date}</span>
                  </button>
                );
              })}
            </div>

            {/* Time Slot Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {timeSlots.map((slot) => {
                const isSelected = selectedTimeSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTimeSlot(slot)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                      isSelected
                        ? "bg-forest-900 text-white border-forest-900"
                        : "bg-white text-ink-700 border-border hover:bg-cream-100"
                    }`}
                  >
                    <span>{slot}</span>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 3: ADD SESSION DETAILS */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-forest-900 text-white text-[11px] font-bold flex items-center justify-center">
                3
              </span>
              <h2 className="text-xs font-bold text-ink-950 uppercase tracking-wider">
                Add Session Details
              </h2>
            </div>

            <textarea
              rows={4}
              value={discussionPoints}
              onChange={(e) => setDiscussionPoints(e.target.value)}
              placeholder="What would you like to discuss? (e.g., career path, interview prep, project review)"
              className="w-full p-4 rounded-2xl border border-border text-xs text-ink-950 focus:outline-none focus:ring-2 focus:ring-forest-700"
              maxLength={300}
            />
            <div className="text-right text-[10px] text-ink-500 mt-1">
              {discussionPoints.length} / 300
            </div>
          </div>

          {/* Bottom Confirmation Bar */}
          <div className="p-4 rounded-2xl bg-cream-50 border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-forest-900">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-ink-500 block">Selected Slot</span>
                <span className="font-bold text-xs text-ink-950">
                  {dates[selectedDateIndex].day}, {dates[selectedDateIndex].date} · {selectedTimeSlot} (IST)
                </span>
                <span className="text-[10px] text-ink-500 block">
                  {sessionType === "1:1" ? "1:1 Session" : "Group Session"} ({durationMinutes} mins) · ₹{calculatePrice()}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmBooking}
              disabled={isSubmitting}
              className="btn-primary w-full sm:w-auto text-xs py-3 px-6 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <span>{isSubmitting ? "Locking Slot..." : "Confirm Booking"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

