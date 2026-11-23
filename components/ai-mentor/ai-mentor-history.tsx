"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  MessageSquare,
  Clock,
  ArrowRight,
  Trash2,
  Edit2,
  Check,
  X,
  Filter,
  Download,
  Calendar,
} from "lucide-react";
import { ConversationSummary, FOCUS_AREAS_CONFIG } from "./ai-mentor-types";
import { cn } from "@/lib/utils";

interface AIMentorHistoryProps {
  conversations: ConversationSummary[];
  onOpenConversation: (conversationId: string) => void;
  onRenameConversation: (conversationId: string, newTitle: string) => Promise<void>;
  onDeleteConversation: (conversationId: string) => Promise<void>;
  onNewSession: () => void;
}

export function AIMentorHistory({
  conversations,
  onOpenConversation,
  onRenameConversation,
  onDeleteConversation,
  onNewSession,
}: AIMentorHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(c.mode).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = selectedFilter === "all" || c.mode === selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }, [conversations, searchQuery, selectedFilter]);

  // Group by date
  const groupedConversations = useMemo(() => {
    const today: ConversationSummary[] = [];
    const yesterday: ConversationSummary[] = [];
    const pastWeek: ConversationSummary[] = [];
    const older: ConversationSummary[] = [];

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    filteredConversations.forEach((c) => {
      const time = new Date(c.updatedAt).getTime();
      const diff = now - time;
      if (diff < oneDay) {
        today.push(c);
      } else if (diff < 2 * oneDay) {
        yesterday.push(c);
      } else if (diff < 7 * oneDay) {
        pastWeek.push(c);
      } else {
        older.push(c);
      }
    });

    return [
      { label: "Today", items: today },
      { label: "Yesterday", items: yesterday },
      { label: "Previous 7 Days", items: pastWeek },
      { label: "Older", items: older },
    ].filter((g) => g.items.length > 0);
  }, [filteredConversations]);

  const handleStartRename = (conv: ConversationSummary) => {
    setEditingConvId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = async (convId: string) => {
    if (editTitle.trim()) {
      await onRenameConversation(convId, editTitle.trim());
    }
    setEditingConvId(null);
  };

  const handleExport = () => {
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(conversations, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mentormaze-sessions-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE5D5]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#17211E]">Session History</h1>
          <p className="text-xs sm:text-sm text-[#69756B] mt-1">
            Search, resume, or manage past mentorship conversations with ASTRION.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {conversations.length > 0 && (
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DCE5D5] hover:bg-[#EDF3E8] text-xs font-semibold text-[#174B39] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          )}
          <button
            type="button"
            onClick={onNewSession}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#174B39] hover:bg-[#123B2E] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>+ New Session</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#69756B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations by title or topic..."
            className="w-full pl-9 pr-3 py-2 bg-white/80 border border-[#DCE5D5] rounded-xl text-xs sm:text-sm text-[#17211E] placeholder:text-[#69756B]/70 focus:outline-none focus:ring-1 focus:ring-[#27875E]"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors",
              selectedFilter === "all"
                ? "bg-[#174B39] text-white"
                : "bg-white border border-[#DCE5D5] text-[#69756B] hover:text-[#17211E]"
            )}
          >
            All
          </button>
          {FOCUS_AREAS_CONFIG.slice(0, 4).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedFilter(f.id)}
              className={cn(
                "px-2.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors",
                selectedFilter === f.id
                  ? "bg-[#174B39] text-white"
                  : "bg-white border border-[#DCE5D5] text-[#69756B] hover:text-[#17211E]"
              )}
            >
              {f.label.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      {groupedConversations.length === 0 ? (
        <div className="p-12 text-center bg-white/60 border border-dashed border-[#DCE5D5] rounded-3xl">
          <Clock className="w-8 h-8 text-[#69756B] mx-auto mb-2 opacity-50" />
          <h3 className="text-sm font-semibold text-[#17211E]">No conversations found</h3>
          <p className="text-xs text-[#69756B] mt-1 max-w-sm mx-auto">
            {searchQuery
              ? "Try adjusting your search terms or filter."
              : "You haven't had any sessions yet. Click '+ New Session' to begin."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedConversations.map((group) => (
            <div key={group.label} className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#69756B] px-1">
                {group.label} ({group.items.length})
              </h2>

              <div className="space-y-2">
                {group.items.map((conv) => (
                  <div
                    key={conv.id}
                    className="p-3.5 bg-white/90 hover:bg-white rounded-2xl border border-[#DCE5D5] hover:border-[#174B39]/30 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-3 group"
                  >
                    <div
                      onClick={() => onOpenConversation(conv.id)}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      {editingConvId === conv.id ? (
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveRename(conv.id);
                              if (e.key === "Escape") setEditingConvId(null);
                            }}
                            autoFocus
                            className="text-xs sm:text-sm font-semibold text-[#17211E] bg-white border border-[#27875E] rounded-lg px-2 py-1 w-full max-w-md focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(conv.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingConvId(null)}
                            className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#EDF3E8] group-hover:bg-[#E7F2DA] flex items-center justify-center text-[#174B39] shrink-0 transition-colors">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-[#17211E] group-hover:text-[#174B39] truncate transition-colors">
                              {conv.title || "Untitled Session"}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-[#69756B] mt-0.5">
                              <span className="capitalize">{String(conv.mode).replace(/_/g, " ")}</span>
                              <span>•</span>
                              <span>{new Date(conv.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartRename(conv)}
                        className="p-1.5 rounded-lg text-[#69756B] hover:text-[#174B39] hover:bg-[#EDF3E8] transition-colors"
                        title="Rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Delete this conversation permanently?")) {
                            onDeleteConversation(conv.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-[#69756B] hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenConversation(conv.id)}
                        className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EDF3E8] group-hover:bg-[#E7F2DA] text-[#174B39] text-xs font-semibold transition-colors"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

