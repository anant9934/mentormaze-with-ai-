"use client";

import React, { useState } from "react";
import {
  Cpu,
  Plus,
  ArrowRight,
  Sparkles,
  GitBranch,
  Layers,
  ShieldCheck,
  ExternalLink,
  Code2,
} from "lucide-react";
import { FocusArea } from "@/lib/ai-mentor/types";

interface ProjectItem {
  id: string;
  title: string;
  techStack: string[];
  description: string;
  architecturalHighlights: string[];
  standoutScore: number; // 0 - 100
  reviewStatus: "Reviewed" | "Needs Architecture Review" | "Ready for Resume";
}

const DEFAULT_PROJECTS: ProjectItem[] = [
  {
    id: "proj-1",
    title: "Real-Time Collaborative Code Editor",
    techStack: ["Next.js", "WebSockets", "CRDTs (Yjs)", "Go Backend", "Redis"],
    description: "Peer-to-peer and client-server collaborative document editing with conflict-free replicated data types and operational transformation.",
    architecturalHighlights: [
      "Sub-50ms peer cursor syncing with WebSockets",
      "Eventual consistency with state-based CRDTs",
      "Redis pub/sub for cross-node message broadcast",
    ],
    standoutScore: 92,
    reviewStatus: "Ready for Resume",
  },
  {
    id: "proj-2",
    title: "High-Throughput Distributed Rate Limiter",
    techStack: ["Go", "Redis Lua", "Docker", "gRPC", "Prometheus"],
    description: "Token bucket & sliding window rate limiter microservice handling 80,000 requests/sec with atomic Lua evaluation.",
    architecturalHighlights: [
      "Atomic Lua script execution preventing race conditions",
      "gRPC unary & streaming APIs with p99 latency < 2ms",
      "Prometheus metrics & Grafana latency monitoring",
    ],
    standoutScore: 88,
    reviewStatus: "Reviewed",
  },
  {
    id: "proj-3",
    title: "E-Commerce Payment Settlement Gateway",
    techStack: ["Node.js", "PostgreSQL", "Kafka", "Docker"],
    description: "Distributed transaction settlement engine using the Saga orchestrator pattern and idempotency keys to ensure exactly-once charge semantics.",
    architecturalHighlights: [
      "Idempotency key layer with Postgres unique constraints",
      "Kafka event log for asynchronous compensation rollbacks",
      "Dead-letter queues for unprocessable transactions",
    ],
    standoutScore: 78,
    reviewStatus: "Needs Architecture Review",
  },
];

interface AIMentorProjectsProps {
  onReviewProject: (prompt: string, focusArea: FocusArea) => void;
}

export function AIMentorProjects({ onReviewProject }: AIMentorProjectsProps) {
  const [projects, setProjects] = useState<ProjectItem[]>(DEFAULT_PROJECTS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTech, setNewTech] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleAddProject = () => {
    if (!newTitle.trim()) return;
    const newProj: ProjectItem = {
      id: `proj-${Date.now()}`,
      title: newTitle.trim(),
      techStack: newTech.split(",").map((s) => s.trim()).filter(Boolean),
      description: newDesc.trim() || "Full-stack software engineering project.",
      architecturalHighlights: ["Initial architecture drafted"],
      standoutScore: 70,
      reviewStatus: "Needs Architecture Review",
    };
    setProjects([newProj, ...projects]);
    setShowAddModal(false);
    setNewTitle("");
    setNewTech("");
    setNewDesc("");
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE5D5]">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-6 h-6 text-[#174B39]" />
            <h1 className="text-2xl sm:text-3xl font-serif text-[#17211E]">Project Portfolio</h1>
          </div>
          <p className="text-xs sm:text-sm text-[#69756B] mt-1">
            Track portfolio projects, audit system architecture with ASTRION FORGE, and extract standout bullet points for top engineering recruiters.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#174B39] hover:bg-[#123B2E] text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Project</span>
        </button>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="p-5 bg-white/90 hover:bg-white rounded-3xl border border-[#DCE5D5] hover:border-[#174B39]/30 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h3 className="text-base font-semibold text-[#17211E]">{proj.title}</h3>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    proj.reviewStatus === "Ready for Resume"
                      ? "bg-[#E7F2DA] text-[#174B39] border border-[#27875E]/30"
                      : proj.reviewStatus === "Reviewed"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                >
                  {proj.reviewStatus}
                </span>
              </div>

              <p className="text-xs text-[#69756B] leading-relaxed mb-3">{proj.description}</p>

              {/* Tech Badges */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {proj.techStack.map((tech, tIdx) => (
                  <span
                    key={tIdx}
                    className="text-[11px] font-medium bg-[#FAFAF2] text-[#174B39] border border-[#EDF3E8] px-2 py-0.5 rounded-lg font-mono"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Highlights */}
              <div className="space-y-1 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#69756B]">
                  Architectural Highlights:
                </span>
                <ul className="text-xs text-[#17211E] space-y-1 pl-2">
                  {proj.architecturalHighlights.map((hl, hIdx) => (
                    <li key={hIdx} className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#27875E] mt-1.5 shrink-0" />
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-[#EDF3E8] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#69756B]">Recruiter Standout Score:</span>
                <span className="font-bold text-[#174B39]">{proj.standoutScore} / 100</span>
              </div>

              <button
                type="button"
                onClick={() =>
                  onReviewProject(
                    `Audit my portfolio project '${proj.title}'. Built with: ${proj.techStack.join(
                      ", "
                    )}. Description: ${proj.description}. How can I make this architecture standout in senior engineering interviews?`,
                    "projects"
                  )
                }
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#EDF3E8] hover:bg-[#E7F2DA] text-[#174B39] text-xs font-semibold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#27875E]" />
                <span>Deep Architecture Review</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#DCE5D5] space-y-4">
            <h2 className="text-lg font-serif font-bold text-[#17211E]">Add Portfolio Project</h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#17211E] block mb-1">Project Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Distributed KV Store"
                  className="w-full px-3 py-2 border border-[#DCE5D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#27875E]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#17211E] block mb-1">Technologies (comma separated)</label>
                <input
                  type="text"
                  value={newTech}
                  onChange={(e) => setNewTech(e.target.value)}
                  placeholder="e.g. Go, Raft, gRPC, BadgerDB"
                  className="w-full px-3 py-2 border border-[#DCE5D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#27875E]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#17211E] block mb-1">Architecture Summary</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  placeholder="Describe the system problem, concurrency, or scale..."
                  className="w-full px-3 py-2 border border-[#DCE5D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#27875E] resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs text-[#69756B] hover:text-[#17211E]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddProject}
                disabled={!newTitle.trim()}
                className="px-4 py-1.5 rounded-xl bg-[#174B39] hover:bg-[#123B2E] text-white text-xs font-semibold disabled:opacity-50"
              >
                Save Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

