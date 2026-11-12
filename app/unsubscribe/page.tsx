"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CheckCircle2, AlertCircle, Mail, ArrowLeft } from "lucide-react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleUnsubscribe = async () => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No unsubscribe token found in URL.");
      return;
    }

    setStatus("processing");
    try {
      const res = await fetch("/api/email/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unsubscribeToken: token }),
      }).then((r) => r.json());

      if (res.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(res.error || "Invalid or expired unsubscribe token.");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Failed to process unsubscribe request.");
    }
  };

  useEffect(() => {
    if (token) {
      handleUnsubscribe();
    }
  }, [token]);

  return (
    <div className="bg-white p-8 rounded-3xl border border-[#DED2BF] max-w-md w-full text-center shadow-sm space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-[#EDF1E8] text-[#123B2E] flex items-center justify-center mx-auto">
        <Mail className="w-6 h-6 text-[#21634A]" />
      </div>

      <h2 className="font-serif text-2xl font-bold text-[#17211E]">
        {status === "success" ? "Unsubscribed Successfully" : "Email Unsubscribe"}
      </h2>

      {status === "processing" && (
        <p className="text-xs text-[#46514B]">Processing your unsubscribe request...</p>
      )}

      {status === "success" && (
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Preferences Updated</span>
          </div>
          <p className="text-xs text-[#46514B] leading-relaxed">
            You have been unsubscribed from MentorMaze marketing updates, newsletters, and promotional announcements.
          </p>
          <p className="text-[11px] text-[#46514B]">
            Note: You will still receive transactional emails regarding your active bookings and account security.
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-200 font-medium">
            <AlertCircle className="w-4 h-4" />
            <span>Unable to Unsubscribe</span>
          </div>
          <p className="text-xs text-red-600">{errorMessage}</p>
          <Link
            href="/settings/email-preferences"
            className="text-xs font-bold text-[#123B2E] underline block"
          >
            Manage Preferences Manually
          </Link>
        </div>
      )}

      {status === "idle" && !token && (
        <div className="space-y-3">
          <p className="text-xs text-[#46514B]">
            To manage your email notification preferences, please visit your account settings.
          </p>
          <Link
            href="/settings/email-preferences"
            className="btn-primary text-xs py-2.5 px-5 inline-block"
          >
            Go to Email Preferences
          </Link>
        </div>
      )}

      <div className="pt-4 border-t border-[#DED2BF]">
        <Link
          href="/"
          className="text-xs font-semibold text-[#123B2E] hover:underline flex items-center justify-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to MentorMaze Home</span>
        </Link>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FBF8F1]">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <Suspense fallback={<div className="text-xs text-[#46514B]">Loading unsubscribe preferences...</div>}>
          <UnsubscribeContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
