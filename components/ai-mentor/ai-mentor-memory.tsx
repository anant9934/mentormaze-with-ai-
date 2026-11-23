"use client";

import React, { useState, useEffect } from "react";
import {
  Bookmark,
  Plus,
  Trash2,
  Check,
  RotateCw,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  HelpCircle,
  Sliders,
} from "lucide-react";
import { StudentMemoryItem } from "./ai-mentor-types";
import { cn } from "@/lib/utils";

interface AIMentorMemoryProps {
  userId?: string;
}

export function AIMentorMemory({ userId }: AIMentorMemoryProps) {
  const [memories, setMemories] = useState<StudentMemoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState("learning_goal");
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const loadMemories = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/ai-mentor/memory");
      const data = await res.json();
      if (data.success) {
        setMemories(data.memories || []);
      }
    } catch (err) {
      console.error("Failed to load memory:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, []);

  const handleConfirm = async (memoryId: string) => {
    try {
      const res = await fetch("/api/ai-mentor/memory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memoryId }),
      });
      const data = await res.json();
      if (data.success) {
        setMemories((prev) =>
          prev.map((m) => (m.id === memoryId ? { ...m, studentConfirmed: true } : m))
        );
      }
    } catch (err) {
      console.error("Failed to confirm memory:", err);
    }
  };

  const handleDelete = async (memoryId: string) => {
    if (!confirm("Are you sure you want ASTRION to forget this detail?")) return;
    try {
      const res = await fetch(`/api/ai-mentor/memory?memoryId=${memoryId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setMemories((prev) => prev.filter((m) => m.id !== memoryId));
      }
    } catch (err) {
      console.error("Failed to delete memory:", err);
    }
  };

  const handleAddMemory = async () => {
    if (!newKey.trim() || !newValue.trim()) return;
    try {
      const res = await fetch("/api/ai-mentor/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newCategory,
          key: newKey.trim(),
          value: newValue.trim(),
          provenance: "student_reported",
          confidence: 1.0,
          studentConfirmed: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewKey("");
        setNewValue("");
        loadMemories();
      }
    } catch (err) {
      console.error("Failed to add memory:", err);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE5D5]">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-[#174B39]" />
            <h1 className="text-2xl sm:text-3xl font-serif text-[#17211E]">Student Memory & Consent</h1>
          </div>
          <p className="text-xs sm:text-sm text-[#69756B] mt-1">
            ASTRION preserves verified context about your learning goals, background, and misconceptions. You have complete transparency and delete authority over your profile.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#174B39] hover:bg-[#123B2E] text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Fact</span>
        </button>
      </div>

      {/* Memory List */}
      {isLoading ? (
        <div className="p-12 text-center">
          <RotateCw className="w-6 h-6 text-[#27875E] animate-spin mx-auto mb-2" />
          <p className="text-xs text-[#69756B]">Loading student memory profile...</p>
        </div>
      ) : memories.length === 0 ? (
        <div className="p-10 text-center bg-white/60 border border-dashed border-[#DCE5D5] rounded-3xl">
          <ShieldCheck className="w-8 h-8 text-[#69756B] mx-auto mb-2 opacity-50" />
          <h3 className="text-sm font-semibold text-[#17211E]">No memory items stored</h3>
          <p className="text-xs text-[#69756B] mt-1 max-w-sm mx-auto">
            As you learn, ASTRION will note your target roles, strong concepts, and preferred pacing. You can also explicitly add learning preferences.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {memories.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-white/90 hover:bg-white rounded-2xl border border-[#DCE5D5] hover:border-[#174B39]/30 shadow-xs hover:shadow-md transition-all flex items-start justify-between gap-4 group"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#174B39] bg-[#E7F2DA] px-2 py-0.5 rounded-md">
                    {item.category.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs font-semibold text-[#17211E]">{item.key}</span>
                  {item.studentConfirmed ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                      <UserCheck className="w-3 h-3 text-emerald-600" />
                      <span>Confirmed by You</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md">
                      AI Inferred
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-[#17211E] leading-relaxed pt-1">
                  {item.value}
                </p>

                {item.confidence !== undefined && (
                  <div className="text-[10px] text-[#69756B] pt-0.5">
                    Confidence: {(item.confidence * 100).toFixed(0)}%
                  </div>
                )}
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {!item.studentConfirmed && (
                  <button
                    type="button"
                    onClick={() => handleConfirm(item.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#EDF3E8] hover:bg-[#E7F2DA] text-[#174B39] text-xs font-semibold transition-colors"
                    title="Confirm this fact is accurate"
                  >
                    <Check className="w-3 h-3 text-[#27875E]" />
                    <span>Confirm</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-xl text-[#69756B] hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Forget this memory"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#DCE5D5] space-y-4">
            <h2 className="text-lg font-serif font-bold text-[#17211E]">Add Memory Fact</h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#17211E] block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DCE5D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#27875E]"
                >
                  <option value="learning_goal">Learning Goal</option>
                  <option value="target_role">Target Role</option>
                  <option value="preferred_language">Preferred Language</option>
                  <option value="demonstrated_strength">Demonstrated Strength</option>
                  <option value="known_weakness">Known Weakness</option>
                  <option value="timeline">Timeline / Deadline</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#17211E] block mb-1">Key / Topic</label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="e.g. Target Company, LeetCode Goal"
                  className="w-full px-3 py-2 border border-[#DCE5D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#27875E]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#17211E] block mb-1">Details / Value</label>
                <textarea
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  rows={3}
                  placeholder="e.g. Preparing for Google L4 backend interview by July 2026..."
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
                onClick={handleAddMemory}
                disabled={!newKey.trim() || !newValue.trim()}
                className="px-4 py-1.5 rounded-xl bg-[#174B39] hover:bg-[#123B2E] text-white text-xs font-semibold disabled:opacity-50"
              >
                Save Fact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

