"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown, Sparkles, BookOpen, MessageSquare, ShieldCheck, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export function AIMentorHelp() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const FAQS = [
    {
      q: "Who is Dr. Aarav Mehta?",
      a: "Dr. Aarav Mehta is your unified Principal Mentor at MentorMaze by AI Tathastu. Rather than eight disjoint chatbots, Dr. Aarav Mehta is a single continuous intelligence that dynamically engages specialized analytical capabilities across conceptual learning, coding & DSA, system architecture, resume transformation, and technical interviews.",
    },
    {
      q: "How does Socratic scaffolding work?",
      a: "Instead of immediately dumping full solutions or code answers, Dr. Aarav Mehta provides tiered hints and invariant questions designed to build deep mental models and problem-solving stamina. You can request direct answers at any time by asking for a complete worked example.",
    },
    {
      q: "Are my conversations and code kept private?",
      a: "Yes. All student conversations, code snippets, and memories are encrypted at rest and isolated to your authenticated account with direct object ID manipulation protection. We never train public foundation models on private student data.",
    },
    {
      q: "How does the hybrid model routing work?",
      a: "MentorMaze uses a hybrid architecture: latency-critical classification and structured prompts can run on our fine-tuned MentorMaze-2B model, while complex generative reasoning is handled by Gemini 2.5 Flash, backed by an offline deterministic pedagogical engine.",
    },
    {
      q: "How can I escalate to a verified human mentor?",
      a: "When a concept requires personalized 1:1 human evaluation or placement strategy, Dr. Aarav Mehta suggests a Human Mentor Escalation link. You can also visit the Mentor Marketplace at https://mentormaze.aitathastu.com/mentors at any time.",
    },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#DCE5D5]">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-[#174B39]" />
          <h1 className="text-2xl sm:text-3xl font-serif text-[#17211E]">Help & Documentation</h1>
        </div>
        <p className="text-xs sm:text-sm text-[#69756B] mt-1">
          Everything you need to know about navigating the AI Mentor workspace, Socratic learning, and our academic integrity standards.
        </p>
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-3">
        {FAQS.map((faq, idx) => (
          <div
            key={idx}
            className="p-4 bg-white/90 rounded-2xl border border-[#DCE5D5] shadow-xs cursor-pointer transition-all"
            onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs sm:text-sm font-semibold text-[#17211E]">{faq.q}</h3>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-[#69756B] transition-transform shrink-0",
                  openFaq === idx && "rotate-180"
                )}
              />
            </div>
            {openFaq === idx && (
              <p className="text-xs text-[#69756B] mt-3 pt-3 border-t border-[#EDF3E8] leading-relaxed">
                {faq.a}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Contact Support */}
      <div className="p-5 bg-[#FAFAF2] rounded-3xl border border-[#DCE5D5] flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-[#17211E]">Need dedicated assistance?</h3>
          <p className="text-xs text-[#69756B] mt-0.5">
            Our support and mentoring team at AI Tathastu is here to help.
          </p>
        </div>
        <a
          href="mailto:support@aitathastu.com"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#174B39] text-white text-xs font-semibold shadow-xs hover:bg-[#123B2E] transition-colors shrink-0"
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Contact Team</span>
        </a>
      </div>
    </div>
  );
}

