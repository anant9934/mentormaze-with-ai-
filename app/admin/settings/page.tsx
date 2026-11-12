"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { store } from "@/lib/data/store";
import {
  Settings,
  ShieldCheck,
  CreditCard,
  Bell,
  Globe2,
  Lock,
  Save,
  CheckCircle2,
  ArrowLeft,
  DollarSign,
  Sparkles,
} from "lucide-react";

export default function PlatformSettingsPage() {
  const currentSettings = store.getSettings();

  const [platformName, setPlatformName] = useState(currentSettings.platformName);
  const [supportEmail, setSupportEmail] = useState(currentSettings.supportEmail);
  const [commissionPercent, setCommissionPercent] = useState(currentSettings.commissionPercent);
  const [defaultDuration, setDefaultDuration] = useState(currentSettings.defaultSessionMinutes);
  const [cashfreeEnv, setCashfreeEnv] = useState("TEST");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateSettings({
      platformName,
      supportEmail,
      commissionPercent,
      defaultSessionMinutes: defaultDuration,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        <div className="mb-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold text-ink-700 hover:text-forest-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Portal</span>
          </Link>
        </div>

        <div>
          <h1 className="font-serif text-3xl font-bold text-ink-950">Platform Settings</h1>
          <p className="text-xs text-ink-700 mt-1">
            Configure marketplace commission rates, payment sandbox credentials, and AI Tathastu SSO integration boundaries.
          </p>
        </div>

        {savedSuccess && (
          <div className="p-3.5 rounded-2xl bg-sage-100 text-forest-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Platform settings saved and applied successfully.</span>
          </div>
        )}

        <div className="card-warm bg-white p-8 rounded-3xl shadow-card space-y-8">
          {/* Section 1: General Platform Information */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-ink-950 pb-2 border-b border-border flex items-center gap-2">
              <Settings className="w-4 h-4 text-forest-800" />
              <span>General Platform Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border text-xs text-ink-950 focus:outline-none focus:ring-2 focus:ring-forest-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1">
                  Support Email
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border text-xs text-ink-950 focus:outline-none focus:ring-2 focus:ring-forest-700"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Marketplace Payments & Commission */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-ink-950 pb-2 border-b border-border flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-forest-800" />
              <span>Marketplace Economics & Payments</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1">
                  Platform Commission (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={commissionPercent}
                    onChange={(e) => setCommissionPercent(parseFloat(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-border text-xs text-ink-950 focus:outline-none focus:ring-2 focus:ring-forest-700"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-ink-500 font-bold">%</span>
                </div>
                <span className="text-[10px] text-ink-500 mt-1 block">
                  Configurable marketplace fee deducted from gross booking amount.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1">
                  Cashfree Environment
                </label>
                <select
                  value={cashfreeEnv}
                  onChange={(e) => setCashfreeEnv(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border text-xs text-ink-950 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
                >
                  <option value="TEST">TEST / SANDBOX (Mock Settlement)</option>
                  <option value="PRODUCTION">PRODUCTION (Live KYC Required)</option>
                </select>
                <span className="text-[10px] text-amber-700 mt-1 block font-medium">
                  Never enable real payments until merchant onboarding is verified.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: AI Tathastu SSO & Scoped Context Gateway */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-ink-950 pb-2 border-b border-border flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>AI Tathastu Ecosystem Integration Contract</span>
            </h3>

            <div className="p-4 rounded-2xl bg-cream-50 border border-border space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-500">Identity Provider (IdP) URL:</span>
                <span className="font-mono text-ink-950 font-bold">https://auth.aitathastu.com</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-500">OIDC Client ID:</span>
                <span className="font-mono text-ink-950">mentormaze_client_prod_id</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-500">Granular Context Scopes:</span>
                <span className="font-semibold text-forest-900">
                  academic, skills, projects, goals, learning_activity
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-500">Consent Revocation:</span>
                <span className="badge-match text-[10px]">Instant De-synchronization Enabled</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <button
              onClick={handleSave}
              className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Platform Settings</span>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
