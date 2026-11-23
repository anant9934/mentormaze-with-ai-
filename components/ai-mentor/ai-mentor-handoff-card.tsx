"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  UserCheck,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Check,
  Info,
  ShieldAlert,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIMentorHandoffCardProps {
  userId?: string;
  mentorHandoff: {
    eligible: boolean;
    reason?: string;
    sanitizedBriefing?: string;
    domains?: string[];
  };
  onAuthorizeHandoff?: () => void;
}

export function AIMentorHandoffCard({
  userId,
  mentorHandoff,
  onAuthorizeHandoff,
}: AIMentorHandoffCardProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Check initial consent status
  useEffect(() => {
    async function checkConsent() {
      try {
        const studentParam = userId ? `?studentId=${encodeURIComponent(userId)}` : "";
        const res = await fetch(`/api/ai-mentor/handoff${studentParam}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.hasConsent) {
            setIsAuthorized(true);
          }
        }
      } catch (err) {
        // Fallback to local state
      }
    }
    if (mentorHandoff?.eligible) {
      checkConsent();
    }
  }, [userId, mentorHandoff?.eligible]);

  if (!mentorHandoff?.eligible) return null;

  const handleToggleAuthorization = async (checked: boolean) => {
    setIsAuthorized(checked);
    setIsProcessing(true);
    setStatusMessage(null);

    try {
      if (checked) {
        // Authorize handoff
        const res = await fetch("/api/ai-mentor/handoff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: userId,
            authorized: true,
            topic: mentorHandoff.domains?.[0] || "Advanced Engineering Practice",
          }),
        });
        const data = await res.json();
        if (data.success) {
          setStatusMessage("Consent granted. Verified mentors may review this sanitized briefing.");
          onAuthorizeHandoff?.();
        }
      } else {
        // Revoke consent
        const studentParam = userId ? `?studentId=${encodeURIComponent(userId)}` : "";
        const res = await fetch(`/api/ai-mentor/handoff${studentParam}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          setStatusMessage("Consent revoked. Mentors cannot access this briefing.");
        }
      }
    } catch (err) {
      console.error("Failed to toggle handoff authorization:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mt-4 p-5 rounded-3xl bg-gradient-to-br from-[#EDF3E8] via-white to-[#E7F2DA] border border-[#27875E]/30 text-xs text-[#17211E] shadow-sm space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#174B39] font-bold">
          <UserCheck className="w-5 h-5 text-[#27875E]" />
          <span className="text-sm font-serif">Human Mentor Consultation Recommended</span>
        </div>
        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#174B39] text-white">
          Eligible
        </span>
      </div>

      <p className="text-xs text-[#415349] leading-relaxed">
        {mentorHandoff.reason ||
          "ASTRION identified specialized areas where 1-on-1 human guidance from a verified industry professional will accelerate your progress."}
      </p>

      {/* Recommended Domains */}
      {mentorHandoff.domains && mentorHandoff.domains.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-[#174B39]">Recommended Focus:</span>
          {mentorHandoff.domains.map((dom, dIdx) => (
            <span
              key={dIdx}
              className="px-2 py-0.5 rounded-lg bg-white/90 border border-[#DCE5D5] text-[10px] font-mono text-[#174B39] font-semibold"
            >
              {dom}
            </span>
          ))}
        </div>
      )}

      {/* Transparent Pre-Handoff Briefing Preview */}
      <div className="p-3.5 rounded-2xl bg-white border border-[#DCE5D5] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-[#174B39] text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#27875E]" />
            <span>Pre-Handoff Context Preview (Consent-Governed)</span>
          </div>
          <span className="text-[10px] font-mono text-[#27875E] bg-[#E7F2DA] px-2 py-0.5 rounded-md font-semibold">
            Data Minimized
          </span>
        </div>

        <p className="text-[11px] text-[#415349] leading-relaxed bg-[#FAFAF2] p-2.5 rounded-xl border border-[#EDF3E8]">
          {mentorHandoff.sanitizedBriefing ||
            "Sanitized briefing includes your active goal, current milestone progress, and verified technical competencies."}
        </p>

        {/* Boundary explanation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] pt-1">
          <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100 text-[#174B39]">
            <span className="font-bold flex items-center gap-1">
              <Check className="w-3 h-3 text-[#27875E]" /> Included:
            </span>
            <p className="text-[#415349] mt-0.5">
              Active goal, current milestone progress, and verified competencies.
            </p>
          </div>
          <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-100 text-[#7C5016]">
            <span className="font-bold flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#A86414]" /> Never Included:
            </span>
            <p className="text-[#7C5016] mt-0.5">
              Raw chat transcripts, emotional reflections, and unverified assumptions.
            </p>
          </div>
        </div>
      </div>

      {statusMessage && (
        <p className="text-[11px] font-semibold text-[#174B39] bg-[#E7F2DA] p-2 rounded-xl border border-[#27875E]/30 animate-in fade-in">
          {statusMessage}
        </p>
      )}

      {/* Action Row */}
      <div className="pt-1 flex items-center justify-between gap-3 flex-wrap">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isAuthorized}
            disabled={isProcessing}
            onChange={(e) => handleToggleAuthorization(e.target.checked)}
            className="w-4 h-4 rounded text-[#174B39] accent-[#27875E]"
          />
          <span className="text-[11px] font-medium text-[#174B39]">
            I authorize sharing this sanitized briefing with my mentor
          </span>
        </label>

        <Link
          href="/mentors"
          onClick={() => {
            if (isAuthorized) onAuthorizeHandoff?.();
          }}
          className={cn(
            "px-4 py-2 rounded-2xl font-semibold text-xs transition-all inline-flex items-center gap-1.5 shadow-xs",
            isAuthorized
              ? "bg-[#174B39] hover:bg-[#123B2E] text-white"
              : "bg-slate-200 text-slate-500 cursor-not-allowed pointer-events-none"
          )}
        >
          <span>Browse Mentors & Book</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
