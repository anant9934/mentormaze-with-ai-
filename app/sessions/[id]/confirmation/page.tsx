"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { store } from "@/lib/data/store";
import {
  CheckCircle2,
  Calendar,
  Clock,
  Video,
  FileText,
  Code2,
  Edit3,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  X,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export default function SessionConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;
  const booking = store.getBookingById(bookingId) || store.getBookingsForUser("user-student-1")[0];
  const mentor = store.getMentorById(booking?.mentorProfileId || "mentor-priya") || store.getMentors(true)[0];

  const [calendarMenuOpen, setCalendarMenuOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  // ICS File Generator
  const downloadIcs = () => {
    const icsData = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//MentorMaze//Mentorship Session//EN",
      "BEGIN:VEVENT",
      `UID:mm-${booking.id}@mentormaze.com`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      `DTSTART:${new Date(booking.startTimeUtc).toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      `DTEND:${new Date(booking.endTimeUtc).toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      `SUMMARY:MentorMaze: 1-on-1 Mentorship with ${mentor.headline}`,
      `DESCRIPTION:Join your live mentorship room at http://localhost:3000/sessions/${booking.id}/live`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `MentorMaze_Session_${mentor.currentRole.replace(/\s+/g, "_")}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setCalendarMenuOpen(false);
  };

  const openGoogleCalendar = () => {
    const startIso = new Date(booking.startTimeUtc).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endIso = new Date(booking.endTimeUtc).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const title = encodeURIComponent(`MentorMaze: 1:1 Mentorship with ${mentor.headline}`);
    const details = encodeURIComponent(
      `Join LiveKit session: http://localhost:3000/sessions/${booking.id}/live\nAgenda: ${booking.studentDiscussionPoints || "Mentorship discussion"}`
    );
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=Online`;
    window.open(url, "_blank");
    setCalendarMenuOpen(false);
  };

  const handleCancelBooking = () => {
    store.cancelBooking(booking.id, "Student requested cancellation");
    alert("Booking cancelled and refunded successfully.");
    router.push("/dashboard/sessions");
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Top Confirmation Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-ink-950">Session Booked!</h1>
              <p className="text-xs text-ink-700 mt-0.5">
                Your mentorship session is confirmed and saved to your schedule.
              </p>
            </div>
          </div>

          {/* Add to Calendar Dropdown */}
          <div className="relative">
            <button
              onClick={() => setCalendarMenuOpen(!calendarMenuOpen)}
              className="btn-secondary text-xs py-2.5 px-4 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4 text-forest-800" />
              <span>Add to Calendar</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {calendarMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-border shadow-elevated p-1.5 z-20 space-y-1 text-xs">
                <button
                  onClick={openGoogleCalendar}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-cream-100 flex items-center justify-between font-medium text-ink-950"
                >
                  <span>Google Calendar</span>
                  <ExternalLink className="w-3.5 h-3.5 text-ink-400" />
                </button>
                <button
                  onClick={downloadIcs}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-cream-100 flex items-center justify-between font-medium text-ink-950"
                >
                  <span>Apple / Outlook (.ics)</span>
                  <Calendar className="w-3.5 h-3.5 text-ink-400" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PRIMARY BOOKING SUMMARY CARD */}
        <div className="card-warm bg-white p-8 rounded-3xl shadow-card mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-border">
            {/* Mentor Info */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-cream-100 shadow-sm flex-shrink-0">
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
                <div className="flex items-center gap-1.5 font-serif text-xl font-bold text-ink-950">
                  <span>{mentor.userId === "user-mentor-priya" ? "Priya Sharma" : "Rohan Mehta"}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs text-ink-700 font-medium">{mentor.headline}</p>
                <span className="badge-sage text-[10px] font-bold mt-1.5 inline-block">
                  1:1 Mentorship Session
                </span>
              </div>
            </div>

            {/* Time & Meeting Mode */}
            <div className="space-y-1.5 text-xs text-ink-700">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-forest-800" />
                <span className="font-semibold text-ink-950">Tue, Feb 11, 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-forest-800" />
                <span>7:30 PM – 8:30 PM (IST)</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-forest-800" />
                <span>Online (MentorMaze LiveKit RTC)</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto">
              <Link
                href={`/sessions/${booking.id}/live`}
                className="btn-primary text-xs py-2.5 px-6 flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Join Session</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <div className="flex gap-2">
                <button
                  onClick={() => alert("Rescheduling window is open. You may select another slot.")}
                  className="btn-secondary text-xs py-2 px-3 flex-1 flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reschedule</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to cancel this booking? A 100% refund will be issued.")) {
                      handleCancelBooking();
                    }
                  }}
                  className="btn-secondary text-xs py-2 px-3 flex-1 text-red-600 border-red-200 hover:bg-red-50 flex items-center justify-center gap-1"
                >
                  <X className="w-3 h-3" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Agenda & Preparation Bento Rows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            {/* Bento Card 1: Session Agenda */}
            <div className="p-6 rounded-2xl bg-cream-50 border border-border">
              <h3 className="font-bold text-xs uppercase tracking-wider text-ink-700 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-forest-800" />
                <span>Session Agenda</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-ink-950">
                <li className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Career path in Software Engineering</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Interview preparation strategy & roadmap</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Project review and technical feedback</span>
                </li>
              </ul>
            </div>

            {/* Bento Card 2: Prepare for the Session */}
            <div className="p-6 rounded-2xl bg-cream-50 border border-border">
              <h3 className="font-bold text-xs uppercase tracking-wider text-ink-700 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-forest-800" />
                <span>Prepare for the Session</span>
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <button
                  onClick={() => alert("Upload dialog opened. Supported formats: PDF, DOC.")}
                  className="p-3 rounded-xl bg-white border border-border hover:bg-cream-100 transition-colors flex flex-col items-center justify-center"
                >
                  <FileText className="w-5 h-5 text-forest-800 mb-1" />
                  <span className="font-bold text-[11px] text-ink-950">Share Resume</span>
                  <span className="text-[9px] text-ink-500">PDF / DOC</span>
                </button>

                <button
                  onClick={() => {
                    const link = prompt("Enter your GitHub repository or portfolio link:", "https://github.com/anant/project");
                    if (link) alert("Project link saved: " + link);
                  }}
                  className="p-3 rounded-xl bg-white border border-border hover:bg-cream-100 transition-colors flex flex-col items-center justify-center"
                >
                  <Code2 className="w-5 h-5 text-forest-800 mb-1" />
                  <span className="font-bold text-[11px] text-ink-950">Share Projects</span>
                  <span className="text-[9px] text-ink-500">GitHub Link</span>
                </button>

                <button
                  onClick={() => {
                    const pt = prompt("Add additional discussion point for Priya:", "How to explain distributed locks in system design?");
                    if (pt) alert("Discussion point saved.");
                  }}
                  className="p-3 rounded-xl bg-white border border-border hover:bg-cream-100 transition-colors flex flex-col items-center justify-center"
                >
                  <Edit3 className="w-5 h-5 text-forest-800 mb-1" />
                  <span className="font-bold text-[11px] text-ink-950">Add Points</span>
                  <span className="text-[9px] text-ink-500">Optional</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Row: Upcoming Sessions & Tips Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Upcoming Sessions List */}
          <div className="card-warm bg-white p-6 rounded-3xl">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <h3 className="font-bold text-sm text-ink-950 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-forest-800" />
                <span>Your Upcoming Sessions</span>
              </h3>
              <Link href="/dashboard/sessions" className="text-xs font-semibold text-forest-800 hover:underline">
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-cream-50 border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-forest-900 text-white flex items-center justify-center font-bold text-xs">
                    PS
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink-950">Priya Sharma</h4>
                    <p className="text-[11px] text-ink-500">1:1 Session · Feb 11, 7:30 PM</p>
                  </div>
                </div>
                <span className="badge-match text-[10px]">Upcoming</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-cream-50 border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-forest-900 text-white flex items-center justify-center font-bold text-xs">
                    RM
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink-950">Rohan Mehta</h4>
                    <p className="text-[11px] text-ink-500">Technical Mock · Feb 18, 6:00 PM</p>
                  </div>
                </div>
                <span className="badge-sage text-[10px]">Upcoming</span>
              </div>
            </div>
          </div>

          {/* Make the Most of Your Session Card */}
          <div className="rounded-3xl bg-gradient-to-br from-sage-100 to-cream-100 border border-sage-200 p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-forest-950 mb-3">
                Make the Most of Your Session
              </h3>
              <ul className="space-y-2 text-xs text-forest-900">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Share your goals and specific expectations upfront.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Be ready with specific questions or blockers you’re facing.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Bring relevant work (resume, project architecture diagram, code).</span>
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <Link href="/dashboard" className="text-xs font-bold text-forest-900 hover:underline">
                Return to Student Dashboard →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

