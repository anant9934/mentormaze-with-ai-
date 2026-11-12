"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { store } from "@/lib/data/store";
import { useAuth } from "@/lib/auth/context";
import {
  Calendar,
  Clock,
  Star,
  Users,
  Video,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Settings,
  Bell,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function MentorDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "requests" | "availability">("overview");

  // State for session requests
  const [requests, setRequests] = useState([
    {
      id: "req-1",
      studentName: "Ankit Verma",
      topic: "SDE Interview Prep",
      duration: "60 min",
      time: "Feb 12, 6:00 PM",
      status: "pending",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    },
    {
      id: "req-2",
      studentName: "Neha Gupta",
      topic: "Project Review: Distributed Cache",
      duration: "45 min",
      time: "Feb 13, 5:00 PM",
      status: "pending",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    },
    {
      id: "req-3",
      studentName: "Ravi Kumar",
      topic: "Career Path Guidance: Transition to ML",
      duration: "60 min",
      time: "Feb 14, 7:00 PM",
      status: "pending",
      avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80",
    },
  ]);

  const handleAcceptRequest = (id: string) => {
    setRequests(requests.map((r) => (r.id === id ? { ...r, status: "accepted" } : r)));
    alert("Session request accepted. Mentee notified.");
  };

  const handleDeclineRequest = (id: string) => {
    setRequests(requests.map((r) => (r.id === id ? { ...r, status: "declined" } : r)));
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Header Greeting */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-sage text-[10px] font-bold">Mentor Space</span>
              <span className="badge-match text-[10px]">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Verified Mentor</span>
              </span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-ink-950">
              Good Evening, Priya 👋
            </h1>
            <p className="text-xs text-ink-700">
              Here’s your mentor dashboard overview and upcoming student bookings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/mentors/mentor-priya"
              className="btn-secondary text-xs py-2 px-4"
            >
              View Public Profile
            </Link>
            <Link
              href="/mentor/availability"
              className="btn-primary text-xs py-2 px-4"
            >
              Manage Availability
            </Link>
          </div>
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="card-warm bg-white p-6 rounded-3xl border border-border text-center">
            <span className="font-serif text-4xl font-extrabold text-forest-900 block">12</span>
            <span className="text-xs font-semibold text-ink-700 mt-1 block">Upcoming Sessions</span>
            <span className="text-[10px] text-ink-500">Next 7 days</span>
          </div>

          <div className="card-warm bg-white p-6 rounded-3xl border border-border text-center">
            <span className="font-serif text-4xl font-extrabold text-forest-900 block">48</span>
            <span className="text-xs font-semibold text-ink-700 mt-1 block">Total Conducted</span>
            <span className="text-[10px] text-ink-500">100% attendance rate</span>
          </div>

          <div className="card-warm bg-white p-6 rounded-3xl border border-border text-center">
            <span className="font-serif text-4xl font-extrabold text-forest-900 block">★ 4.9</span>
            <span className="text-xs font-semibold text-ink-700 mt-1 block">Student Rating</span>
            <span className="text-[10px] text-ink-500">Based on 210 reviews</span>
          </div>
        </div>

        {/* TODAY'S SESSIONS SPOTLIGHT */}
        <div className="card-warm bg-white p-6 rounded-3xl border border-border shadow-card">
          <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
            <h3 className="font-bold text-sm text-ink-950 flex items-center gap-2">
              <Clock className="w-4 h-4 text-forest-800" />
              <span>Today&apos;s Sessions</span>
            </h3>
            <span className="badge-match text-xs font-semibold">Active Today</span>
          </div>

          <div className="p-4 rounded-2xl bg-cream-50 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-forest-900 text-white flex items-center justify-center font-bold text-sm">
                AK
              </div>
              <div>
                <h4 className="font-bold text-sm text-ink-950">Anant Kumar</h4>
                <p className="text-xs text-ink-500">Career Guidance & System Design Roadmap</p>
                <span className="text-[11px] font-semibold text-forest-800 block mt-0.5">
                  7:30 PM (IST) · 1:1 Call (30 mins)
                </span>
              </div>
            </div>

            <Link
              href="/sessions/booking-1/live"
              className="btn-primary text-xs py-2 px-5 flex items-center gap-2"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Join Live Room</span>
            </Link>
          </div>
        </div>

        {/* INCOMING SESSION REQUESTS */}
        <div className="card-warm bg-white p-6 rounded-3xl border border-border shadow-card">
          <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-forest-800" />
              <h3 className="font-bold text-sm text-ink-950">Student Booking Requests</h3>
            </div>
            <span className="badge-sage text-xs font-bold">
              {pendingCount} Pending
            </span>
          </div>

          <div className="space-y-3">
            {requests
              .filter((r) => r.status === "pending")
              .map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-cream-50 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-cream-200 flex-shrink-0">
                      <Image src={req.avatar} alt={req.studentName} fill className="object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-ink-950">{req.studentName}</h4>
                      <p className="text-[11px] text-ink-500">{req.topic}</p>
                      <span className="text-[10px] text-ink-400 block mt-0.5">
                        {req.duration} · {req.time}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleAcceptRequest(req.id)}
                      className="btn-primary text-xs py-1.5 px-4 flex-1 sm:flex-none"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(req.id)}
                      className="btn-secondary text-xs py-1.5 px-3 flex-1 sm:flex-none text-red-600 border-red-200"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}

            {pendingCount === 0 && (
              <div className="p-8 text-center text-xs text-ink-500">
                No pending requests. All student inquiries have been processed.
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

