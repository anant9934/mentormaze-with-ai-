"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/lib/auth/context";
import {
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  Bell,
  Save,
} from "lucide-react";

export default function EmailPreferencesPage() {
  const { user } = useAuth();
  const [emailInput, setEmailInput] = useState(user?.email || "");
  const [preferences, setPreferences] = useState({
    marketingConsent: false,
    recommendationsConsent: true,
    newsletterConsent: false,
    bookingRemindersConsent: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadPreferences = async (emailToFetch: string) => {
    if (!emailToFetch) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/email/preferences?email=${encodeURIComponent(emailToFetch)}`).then((r) =>
        r.json()
      );
      if (res.success) {
        setPreferences({
          marketingConsent: res.preferences.marketingConsent,
          recommendationsConsent: res.preferences.recommendationsConsent,
          newsletterConsent: res.preferences.newsletterConsent,
          bookingRemindersConsent: res.preferences.bookingRemindersConsent,
        });
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      setEmailInput(user.email);
      loadPreferences(user.email);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) {
      showToast("error", "Please provide a valid email address.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/email/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput,
          preferences,
        }),
      }).then((r) => r.json());

      if (res.success) {
        showToast("success", "Your email preferences have been successfully updated.");
      } else {
        showToast("error", res.error || "Failed to update preferences");
      }
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF8F1]">
      <Navbar />

      {/* Toast Alert */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-3 transition-all ${
            notification.type === "success"
              ? "bg-[#EDF1E8] text-[#123B2E] border-[#DDE6D7]"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-12 w-full space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDF1E8] text-[#123B2E] text-xs font-bold uppercase tracking-wider mb-2">
            <Mail className="w-3.5 h-3.5 text-[#21634A]" />
            <span>Consent &amp; Privacy</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#17211E]">
            Email Communication Preferences
          </h1>
          <p className="text-xs text-[#46514B] mt-1 leading-relaxed">
            Manage how and when MentorMaze communicates with you. We respect your attention and never sell your personal data.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Email Identifier Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#DED2BF] shadow-sm space-y-3">
            <label className="text-xs font-bold text-[#17211E] block">Your Email Address</label>
            <div className="flex gap-3">
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-[#DED2BF] bg-[#FBF8F1] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => loadPreferences(emailInput)}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-[#DED2BF] text-[#17211E] hover:bg-[#F4EFE4]"
              >
                Load Preferences
              </button>
            </div>
          </div>

          {/* Section 1: Transactional (Mandatory) */}
          <div className="bg-white p-6 rounded-2xl border border-[#DED2BF] shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#21634A]" />
              <h3 className="font-serif text-lg font-bold text-[#17211E]">Transactional &amp; Security (Mandatory)</h3>
            </div>
            <p className="text-xs text-[#46514B] leading-relaxed">
              These messages are necessary for the operation of your account and confirmed bookings. In accordance with applicable regulations, these cannot be disabled while your account is active.
            </p>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-start justify-between p-3 rounded-xl bg-[#FBF8F1] border border-[#DED2BF]">
                <div>
                  <span className="font-bold text-[#17211E] block">Account Verification &amp; Password Resets</span>
                  <span className="text-[11px] text-[#46514B]">Critical single-use security links and sign-in verification.</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Always Active
                </span>
              </div>

              <div className="flex items-start justify-between p-3 rounded-xl bg-[#FBF8F1] border border-[#DED2BF]">
                <div>
                  <span className="font-bold text-[#17211E] block">Booking Confirmations &amp; Live Meeting Links</span>
                  <span className="text-[11px] text-[#46514B]">Scheduled 1:1 mentorship rooms, reschedules, and payment receipts.</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Always Active
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Marketing & Growth (Opt-In / Opt-Out) */}
          <div className="bg-white p-6 rounded-2xl border border-[#DED2BF] shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#21634A]" />
              <h3 className="font-serif text-lg font-bold text-[#17211E]">Recommendations &amp; Community (Optional)</h3>
            </div>
            <p className="text-xs text-[#46514B] leading-relaxed">
              Tailor the updates and recommendations you receive based on your career interests.
            </p>

            <div className="space-y-4 pt-2 text-xs">
              <label className="flex items-start justify-between p-3.5 rounded-xl border border-[#DED2BF] hover:bg-[#FBF8F1] cursor-pointer transition-all">
                <div className="pr-4">
                  <span className="font-bold text-[#17211E] block">Personalized Mentor Recommendations</span>
                  <span className="text-[11px] text-[#46514B]">
                    Receive suggestions when mentors in your target company or domain become available.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.recommendationsConsent}
                  onChange={(e) => setPreferences({ ...preferences, recommendationsConsent: e.target.checked })}
                  className="w-4 h-4 text-[#123B2E] rounded border-[#DED2BF] mt-1"
                />
              </label>

              <label className="flex items-start justify-between p-3.5 rounded-xl border border-[#DED2BF] hover:bg-[#FBF8F1] cursor-pointer transition-all">
                <div className="pr-4">
                  <span className="font-bold text-[#17211E] block">MentorMaze Monthly Newsletter</span>
                  <span className="text-[11px] text-[#46514B]">
                    Monthly roundup of new interview prep guides, industry trends, and platform features.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.newsletterConsent}
                  onChange={(e) => setPreferences({ ...preferences, newsletterConsent: e.target.checked })}
                  className="w-4 h-4 text-[#123B2E] rounded border-[#DED2BF] mt-1"
                />
              </label>

              <label className="flex items-start justify-between p-3.5 rounded-xl border border-[#DED2BF] hover:bg-[#FBF8F1] cursor-pointer transition-all">
                <div className="pr-4">
                  <span className="font-bold text-[#17211E] block">Workshops &amp; Special Announcements</span>
                  <span className="text-[11px] text-[#46514B]">
                    Occasional invitations to live webinars, group mock interview events, and platform updates.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.marketingConsent}
                  onChange={(e) => setPreferences({ ...preferences, marketingConsent: e.target.checked })}
                  className="w-4 h-4 text-[#123B2E] rounded border-[#DED2BF] mt-1"
                />
              </label>
            </div>
          </div>

          {/* Save Action */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href="/privacy"
              className="text-xs font-semibold text-[#123B2E] hover:underline"
            >
              Read our Privacy Policy &rarr;
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-[#123B2E] text-white text-xs font-bold hover:bg-[#174B39] transition-all flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving Changes..." : "Save Preferences"}</span>
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
