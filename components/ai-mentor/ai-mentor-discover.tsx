"use client";

import React, { useState } from "react";
import {
  Sparkles,
  BookOpen,
  Code2,
  Layers,
  FileText,
  Target,
  ArrowRight,
  CheckCircle2,
  Compass,
} from "lucide-react";
import { FocusArea } from "@/lib/ai-mentor/types";
import { cn } from "@/lib/utils";

interface AIMentorDiscoverProps {
  onSelectPrompt: (prompt: string, focusArea: FocusArea) => void;
}

export function AIMentorDiscover({ onSelectPrompt }: AIMentorDiscoverProps) {
  const [activeCategory, setActiveCategory] = useState<"dsa" | "system_design" | "resume" | "behavioral">("dsa");

  const BLUEPRINTS = {
    dsa: [
      {
        title: "Sliding Window Pattern",
        subtitle: "Dynamic & Fixed Size Subarray Problems",
        description: "Optimal O(N) strategy for longest substring without repeating characters, minimum window substring, and max sum subarray.",
        prompt: "Teach me the Sliding Window pattern from first principles. Show both fixed-window and variable-window invariant templates with Python code.",
        badge: "DSA",
      },
      {
        title: "Monotonic Stack Pattern",
        subtitle: "Next Greater / Smaller Element in O(N)",
        description: "Eliminates quadratic O(N^2) inner loops for problems like Daily Temperatures, Largest Rectangle in Histogram, and Trapping Rain Water.",
        prompt: "Walk me through the Monotonic Stack pattern with invariants for finding the Next Greater Element, and explain how the stack remains sorted.",
        badge: "DSA",
      },
      {
        title: "Two Pointers & Fast-Slow Tortoise",
        subtitle: "Cycle Detection & In-Place Array Transformations",
        description: "Floyd's Cycle-Finding algorithm, 3Sum two-pointer sandwich, and palindrome verification with O(1) auxiliary space.",
        prompt: "Explain Floyd's Cycle Detection (Tortoise and Hare) algorithm and mathematically prove why fast and slow pointers must collide within a cycle.",
        badge: "DSA",
      },
      {
        title: "Dynamic Programming: Knapsack & Subsets",
        subtitle: "State Definition, Transitions & Space Compression",
        description: "0/1 Knapsack, Unbounded Knapsack, Partition Equal Subset Sum, and rolling 1D array space optimization.",
        prompt: "Teach me the 0/1 Knapsack DP pattern. Show the 2D matrix recurrence relation and how to compress it to a single 1D array by iterating backwards.",
        badge: "DSA",
      },
    ],
    system_design: [
      {
        title: "Distributed Idempotency Layer",
        subtitle: "Payment Processing & Exactly-Once Semantics",
        description: "Guarantee safe retries using unique idempotency keys, Redis atomic SETNX with TTL, and database unique constraints.",
        prompt: "How do I design a robust idempotency key layer for distributed payment APIs to prevent duplicate charges upon network retries?",
        badge: "Architecture",
      },
      {
        title: "Distributed Rate Limiter (Token Bucket)",
        subtitle: "Redis Lua Scripts & Concurrency Control",
        description: "Implement high-throughput API throttling across multiple server instances using Redis token buckets and sliding window counters.",
        prompt: "Design a distributed rate limiter supporting 100k requests/sec. Compare Token Bucket vs Sliding Window Log and show the Redis Lua script.",
        badge: "Architecture",
      },
      {
        title: "Event-Driven CQRS & Event Sourcing",
        subtitle: "Decoupling Read & Write Workloads",
        description: "Command Query Responsibility Segregation with Apache Kafka, Postgres write model, and Elasticsearch read materialized views.",
        prompt: "Explain the architectural trade-offs of CQRS with Event Sourcing. When does eventual consistency introduce dangerous race conditions?",
        badge: "Architecture",
      },
      {
        title: "Distributed Cache-Aside & Stampede Prevention",
        subtitle: "Write-Around, Cache Warmup & Probabilistic Early Expiration",
        description: "Prevent thundering herd problems on cache expiration using XFetch / probabilistic early recomputation and mutex locks.",
        prompt: "How can we design a high-throughput cache layer that avoids cache stampedes when hot keys expire? Explain the XFetch algorithm.",
        badge: "Architecture",
      },
    ],
    resume: [
      {
        title: "Google XYZ Formula Transformation",
        subtitle: "Accomplished [X] measured by [Y] by doing [Z]",
        description: "Transform weak, generic task descriptions into quantified, metric-driven accomplishments that pass senior engineering ATS screening.",
        prompt: "Transform these generic resume bullet points using the Google XYZ formula: 'Worked on payment microservice to improve response times.'",
        badge: "Resume",
      },
      {
        title: "Full-Stack Project Bullet Audit",
        subtitle: "Highlighting Architectural Depth & Scale",
        description: "Frame personal and capstone projects with concrete system parameters: RPS, database indexing, caching layer, latency reduction.",
        prompt: "Audit my full-stack web project resume description. Help me highlight scale, concurrency, and database optimizations.",
        badge: "Resume",
      },
      {
        title: "Internship & Junior Experience Optimization",
        subtitle: "Demonstrating High Ownership & Velocity",
        description: "Emphasize code velocity, peer code reviews, CI/CD pipelines, and cross-functional collaboration even for short tenures.",
        prompt: "Help me write high-impact resume bullets for a 3-month software engineering internship where I contributed to a React & Node microservice.",
        badge: "Resume",
      },
    ],
    behavioral: [
      {
        title: "FAANG STAR Behavioral Framework",
        subtitle: "Situation, Task, Action, Result Structure",
        description: "Structure complex interpersonal, delivery, and leadership stories with crisp focus on individual actions and quantified outcomes.",
        prompt: "Conduct a mock behavioral interview question for: 'Tell me about a time you had a technical disagreement with a teammate.' Evaluate using STAR.",
        badge: "Interview",
      },
      {
        title: "Failure & Incident Post-Mortem Storytelling",
        subtitle: "Demonstrating Blameless Accountability",
        description: "Explain production bugs, outages, or missed deadlines with extreme ownership, root cause analysis, and permanent preventative safeguards.",
        prompt: "Coach me on answering: 'Tell me about a time you introduced a bug into production.' What rubric do senior interviewers use?",
        badge: "Interview",
      },
      {
        title: "Ambiguity & Scope Management",
        subtitle: "Senior & Staff Engineer Behavioral Dimension",
        description: "Demonstrate how you drove clarity from incomplete product requirements, aligned stakeholders, and made progressive technical decisions.",
        prompt: "How should I structure my answer for 'Tell me about a time you had to deliver a project under ambiguous requirements and tight deadlines'?",
        badge: "Interview",
      },
    ],
  };

  const getFocusAreaForCategory = (cat: typeof activeCategory): FocusArea => {
    switch (cat) {
      case "dsa":
        return "coding_dsa";
      case "system_design":
        return "system_design";
      case "resume":
        return "resume";
      case "behavioral":
        return "interview";
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#DCE5D5]">
        <div className="flex items-center gap-2">
          <Compass className="w-6 h-6 text-[#174B39]" />
          <h1 className="text-2xl sm:text-3xl font-serif text-[#17211E]">Curated Blueprints & Patterns</h1>
        </div>
        <p className="text-xs sm:text-sm text-[#69756B] mt-1">
          Explore battle-tested frameworks for algorithmic mastery, system architecture, resume transformation, and behavioral interviews.
        </p>
      </div>

      {/* Domain Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => setActiveCategory("dsa")}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-colors",
            activeCategory === "dsa"
              ? "bg-[#174B39] text-white shadow-sm"
              : "bg-white border border-[#DCE5D5] text-[#69756B] hover:text-[#17211E]"
          )}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>DSA Patterns</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory("system_design")}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-colors",
            activeCategory === "system_design"
              ? "bg-[#174B39] text-white shadow-sm"
              : "bg-white border border-[#DCE5D5] text-[#69756B] hover:text-[#17211E]"
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>System Design Blueprints</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory("resume")}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-colors",
            activeCategory === "resume"
              ? "bg-[#174B39] text-white shadow-sm"
              : "bg-white border border-[#DCE5D5] text-[#69756B] hover:text-[#17211E]"
          )}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Resume Transformers</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory("behavioral")}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-colors",
            activeCategory === "behavioral"
              ? "bg-[#174B39] text-white shadow-sm"
              : "bg-white border border-[#DCE5D5] text-[#69756B] hover:text-[#17211E]"
          )}
        >
          <Target className="w-3.5 h-3.5" />
          <span>STAR Behavioral Coaching</span>
        </button>
      </div>

      {/* Blueprint Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BLUEPRINTS[activeCategory].map((card, idx) => (
          <div
            key={idx}
            className="p-5 bg-white/90 hover:bg-white rounded-3xl border border-[#DCE5D5] hover:border-[#174B39]/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#174B39] bg-[#E7F2DA] px-2 py-0.5 rounded-full border border-[#DCE5D5]">
                  {card.badge}
                </span>
                <span className="text-xs text-[#69756B]">Click to explore</span>
              </div>
              <h3 className="text-base font-semibold text-[#17211E] group-hover:text-[#174B39] transition-colors">
                {card.title}
              </h3>
              <p className="text-xs font-medium text-[#27875E] mt-0.5">{card.subtitle}</p>
              <p className="text-xs text-[#69756B] mt-2 leading-relaxed">{card.description}</p>
            </div>

            <button
              type="button"
              onClick={() => onSelectPrompt(card.prompt, getFocusAreaForCategory(activeCategory))}
              className="mt-4 flex items-center justify-between w-full pt-3 border-t border-[#EDF3E8] text-xs font-semibold text-[#174B39] group-hover:text-[#27875E] transition-colors"
            >
              <span>Launch session with Dr. Aarav</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

