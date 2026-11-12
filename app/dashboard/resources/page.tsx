"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { FileText, Download, Bookmark, Sparkles } from "lucide-react";

export default function StudentResourcesPage() {
  const [tab, setTab] = useState<"recommended" | "programs" | "guides">("recommended");
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});

  const resources = [
    {
      id: "res-1",
      title: "SDE Interview Preparation Guide",
      size: "2.4 MB",
      desc: "Complete technical roadmap covering arrays, trees, dynamic programming, and mock checklists.",
      type: "PDF Document",
    },
    {
      id: "res-2",
      title: "System Design Roadmap & Cheatsheet",
      size: "3.1 MB",
      desc: "Architectural cheat sheet: Sharding, CAP theorem, caching strategies, and message queues.",
      type: "PDF Document",
    },
    {
      id: "res-3",
      title: "Top DSA Practice Patterns",
      size: "1.8 MB",
      desc: "75 essential patterns for LeetCode Medium/Hard problems with code templates.",
      type: "PDF Document",
    },
  ];

  const toggleBookmark = (id: string) => {
    setBookmarked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink-950">Resources for You</h1>
          <p className="text-xs text-ink-700 mt-1">
            Curated preparation guides, blueprints, and mentor-authored cheat sheets.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border pb-2 gap-4 text-xs font-bold">
          {(["recommended", "programs", "guides"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2 px-4 rounded-full capitalize transition-all ${
                tab === t ? "bg-forest-900 text-white" : "bg-white text-ink-700 border border-border"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Resource Cards */}
        <div className="space-y-4">
          {resources.map((res) => (
            <div
              key={res.id}
              className="card-warm bg-white p-5 rounded-2xl border border-border flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-sage-100 flex items-center justify-center text-forest-900 flex-shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-ink-950">{res.title}</h3>
                  <p className="text-xs text-ink-500 mt-0.5">{res.desc}</p>
                  <span className="text-[10px] text-ink-400 mt-1 block">
                    {res.type} · {res.size}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleBookmark(res.id)}
                  className={`p-2 rounded-xl border border-border transition-colors ${
                    bookmarked[res.id] ? "bg-cream-200 text-forest-900" : "hover:bg-cream-100 text-ink-500"
                  }`}
                  aria-label="Bookmark"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
                <button
                  onClick={() => alert(`Downloading ${res.title}...`)}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

