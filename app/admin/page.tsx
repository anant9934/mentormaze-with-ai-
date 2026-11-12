"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { store } from "@/lib/data/store";
import {
  ShieldCheck,
  Users,
  Video,
  Star,
  TrendingUp,
  FileCheck2,
  Sliders,
  DollarSign,
  AlertCircle,
  ArrowRight,
  Settings,
  Mail,
  LifeBuoy,
} from "lucide-react";

export default function AdminPortalPage() {
  const analytics = store.getAnalytics();
  const applications = store.getApplications();
  const pendingApps = applications.filter((a) => a.status === "submitted");

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-100 text-forest-800 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
              <span>Platform Operations & Audit</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-ink-950">
              Admin Dashboard & Control Center
            </h1>
            <p className="text-xs text-ink-700 mt-1">
              Welcome back! Here&apos;s the live platform health, mentor verification queue, and matching operations.
            </p>
            {analytics.isDemonstrationData && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Demonstration Mode Active — Seeded Database Records</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/communications/email"
              className="btn-secondary text-xs py-2 px-4 flex items-center gap-2"
            >
              <Mail className="w-3.5 h-3.5 text-forest-700" />
              <span>Email System</span>
            </Link>
            <Link
              href="/admin/video"
              className="btn-secondary text-xs py-2 px-4 flex items-center gap-2"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video Infrastructure</span>
            </Link>
            <Link
              href="/admin/verification"
              className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Review Verification ({pendingApps.length})</span>
            </Link>
            <Link
              href="/admin/matching"
              className="btn-secondary text-xs py-2 px-4 flex items-center gap-2"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Matching Logic</span>
            </Link>
          </div>
        </div>

        {/* 4 STATS OVERVIEW CARDS (Matching Mockup Screen 2) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="card-warm bg-white p-6 rounded-3xl border border-border text-center">
            <div className="w-10 h-10 rounded-2xl bg-sage-100 flex items-center justify-center text-forest-900 mx-auto mb-2">
              <Users className="w-5 h-5" />
            </div>
            <span className="font-serif text-3xl font-extrabold text-forest-900 block">
              {analytics.totalUsers.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-ink-700 mt-0.5 block">Total Users</span>
            <span className="text-[10px] text-emerald-700 font-bold mt-1 inline-block">+18% this month</span>
          </div>

          <div className="card-warm bg-white p-6 rounded-3xl border border-border text-center">
            <div className="w-10 h-10 rounded-2xl bg-sage-100 flex items-center justify-center text-forest-900 mx-auto mb-2">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-serif text-3xl font-extrabold text-forest-900 block">
              {analytics.totalMentors.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-ink-700 mt-0.5 block">Approved Mentors</span>
            <span className="text-[10px] text-emerald-700 font-bold mt-1 inline-block">+12% this month</span>
          </div>

          <div className="card-warm bg-white p-6 rounded-3xl border border-border text-center">
            <div className="w-10 h-10 rounded-2xl bg-sage-100 flex items-center justify-center text-forest-900 mx-auto mb-2">
              <Video className="w-5 h-5" />
            </div>
            <span className="font-serif text-3xl font-extrabold text-forest-900 block">
              {analytics.totalSessions.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-ink-700 mt-0.5 block">Total Sessions</span>
            <span className="text-[10px] text-emerald-700 font-bold mt-1 inline-block">+24% this month</span>
          </div>

          <div className="card-warm bg-white p-6 rounded-3xl border border-border text-center">
            <div className="w-10 h-10 rounded-2xl bg-sage-100 flex items-center justify-center text-forest-900 mx-auto mb-2">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <span className="font-serif text-3xl font-extrabold text-forest-900 block">
              {analytics.averageRating}
            </span>
            <span className="text-xs font-semibold text-ink-700 mt-0.5 block">Average Rating</span>
            <span className="text-[10px] text-forest-800 font-bold mt-1 inline-block">96% Completion</span>
          </div>
        </div>

        {/* ADMIN OPERATION MODULES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Module 1: Mentor Verification Queue */}
          <div className="card-warm bg-white p-6 rounded-3xl border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-sage-100 flex items-center justify-center text-forest-900">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <span className="badge-sage text-[10px] font-bold">
                  {pendingApps.length} In Review
                </span>
              </div>
              <h3 className="font-serif text-xl font-bold text-ink-950">Mentor Verification</h3>
              <p className="text-xs text-ink-700 mt-1 leading-relaxed">
                Inspect identity proofs, employment badges, and CVs. Approve or reject applicants with audit logs.
              </p>
            </div>
            <div className="pt-6 border-t border-border mt-6">
              <Link
                href="/admin/verification"
                className="text-xs font-bold text-forest-900 hover:underline flex items-center gap-1"
              >
                <span>Open Verification Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Module 2: Matching Parameters */}
          <div className="card-warm bg-white p-6 rounded-3xl border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-sage-100 flex items-center justify-center text-forest-900">
                  <Sliders className="w-5 h-5" />
                </div>
                <span className="badge-match text-[10px] font-bold">Deterministic</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-ink-950">Matching & Weights</h3>
              <p className="text-xs text-ink-700 mt-1 leading-relaxed">
                Tune explainable scoring weights: Career Goal (30%), Skill Gap (25%), Domain (20%), Availability (10%).
              </p>
            </div>
            <div className="pt-6 border-t border-border mt-6">
              <Link
                href="/admin/matching"
                className="text-xs font-bold text-forest-900 hover:underline flex items-center gap-1"
              >
                <span>Configure Matching Logic</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Module 3: Video Infrastructure & Multi-Cluster LiveKit */}
          <div className="card-warm bg-white p-6 rounded-3xl border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-sage-100 flex items-center justify-center text-forest-900">
                  <Video className="w-5 h-5" />
                </div>
                <span className="badge-match text-[10px] font-bold">80/20 Weighted</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-ink-950">Video Infrastructure</h3>
              <p className="text-xs text-ink-700 mt-1 leading-relaxed">
                Multi-provider LiveKit routing, circuit breakers, 12 cloud clusters, traffic weights, and room pinning.
              </p>
            </div>
            <div className="pt-6 border-t border-border mt-6">
              <Link
                href="/admin/video"
                className="text-xs font-bold text-forest-900 hover:underline flex items-center gap-1"
              >
                <span>Manage LiveKit Clusters</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Module 4: Platform Settings */}
          <div className="card-warm bg-white p-6 rounded-3xl border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-sage-100 flex items-center justify-center text-forest-900">
                  <Settings className="w-5 h-5" />
                </div>
                <span className="badge-sage text-[10px] font-bold">Config</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-ink-950">Platform Settings</h3>
              <p className="text-xs text-ink-700 mt-1 leading-relaxed">
                Manage pilot pricing tiers, Cashfree marketplace commission (15%), and AI Tathastu SSO contracts.
              </p>
            </div>
            <div className="pt-6 border-t border-border mt-6">
              <Link
                href="/admin/settings"
                className="text-xs font-bold text-forest-900 hover:underline flex items-center gap-1"
              >
                <span>Edit Platform Settings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Module 5: Email Communication System */}
          <div className="card-warm bg-white p-6 rounded-3xl border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-sage-100 flex items-center justify-center text-forest-900">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="badge-match text-[10px] font-bold">20+ Templates</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-ink-950">Email Communications</h3>
              <p className="text-xs text-ink-700 mt-1 leading-relaxed">
                Production SMTP gateway, responsive email shells, automated event triggers, delivery logs, and template editor.
              </p>
            </div>
            <div className="pt-6 border-t border-border mt-6">
              <Link
                href="/admin/communications/email"
                className="text-xs font-bold text-forest-900 hover:underline flex items-center gap-1"
              >
                <span>Manage Email System</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Module 6: Support Tickets & Inquiries */}
          <div className="card-warm bg-white p-6 rounded-3xl border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-sage-100 flex items-center justify-center text-forest-900">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <span className="badge-sage text-[10px] font-bold">Customer Care</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-ink-950">Support Tickets</h3>
              <p className="text-xs text-ink-700 mt-1 leading-relaxed">
                Customer support thread management, staff internal notes, automated email notifications, and resolution tracking.
              </p>
            </div>
            <div className="pt-6 border-t border-border mt-6">
              <Link
                href="/admin/support"
                className="text-xs font-bold text-forest-900 hover:underline flex items-center gap-1"
              >
                <span>View Support Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

