"use client";

import React, { useState, useMemo } from "react";
import {
  Sparkles,
  BookOpen,
  Code2,
  Layers,
  FileText,
  Target,
  Compass,
  Cpu,
  Calendar,
  MessageSquare,
  ArrowRight,
  Clock,
  MoreVertical,
  Trash2,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { FocusArea, LanguageCode } from "@/lib/ai-mentor/types";
import { FOCUS_AREAS_CONFIG, ConversationSummary } from "./ai-mentor-types";
import { AIMentorComposer } from "./ai-mentor-composer";
import { cn } from "@/lib/utils";

interface AIMentorHomeProps {
  onStartSession: (initialPrompt: string, focusArea?: FocusArea) => void;
  onOpenConversation: (conversationId: string) => void;
  onViewAllHistory: () => void;
  conversations: ConversationSummary[];
  onRenameConversation?: (conversationId: string, newTitle: string) => Promise<void>;
  onDeleteConversation?: (conversationId: string) => Promise<void>;
  studentName?: string;
  isStreaming?: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen,
  Code2,
  Layers,
  FileText,
  Target,
  Compass,
  Cpu,
  Calendar,
};

export function AIMentorHome({
  onStartSession,
  onOpenConversation,
  onViewAllHistory,
  conversations,
  onRenameConversation,
  onDeleteConversation,
  studentName = "Student",
  isStreaming = false,
}: AIMentorHomeProps) {
  const [selectedFocus, setSelectedFocus] = useState<FocusArea>("learn");
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>("en");
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Time-of-day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const handleChipClick = (focus: (typeof FOCUS_AREAS_CONFIG)[0]) => {
    setSelectedFocus(focus.id);
    onStartSession(focus.suggestionPrompt, focus.id);
  };

  const handleStartRename = (conv: ConversationSummary) => {
    setEditingConvId(conv.id);
    setEditTitle(conv.title);
    setMenuOpenId(null);
  };

  const handleSaveRename = async (convId: string) => {
    if (!editTitle.trim() || !onRenameConversation) {
      setEditingConvId(null);
      return;
    }
    await onRenameConversation(convId, editTitle.trim());
    setEditingConvId(null);
  };

  const handleDelete = async (convId: string) => {
    setMenuOpenId(null);
    if (confirm("Are you sure you want to delete this session?")) {
      await onDeleteConversation?.(convId);
    }
  };

  // Format relative timestamp
  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "Recent";
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col items-center">
      {/* 1. Centered Welcome Composition */}
      <div className="w-full text-center space-y-3 mb-6 sm:mb-8 animate-in fade-in duration-500">
        {/* Subdued Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E7F2DA] border border-[#DCE5D5] text-[#174B39] text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-[#27875E]" />
          <span>YOUR PERSONAL AI MENTOR</span>
        </div>

        {/* Serif Editorial Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#17211E] tracking-tight leading-tight">
          What should we build or learn today?
        </h1>

        {/* Supporting text */}
        <p className="text-sm sm:text-base text-[#69756B] max-w-xl mx-auto font-sans leading-relaxed">
          One clear ask is enough to begin.
        </p>
      </div>

      {/* 2. Central Prompt Composer */}
      <div className="w-full mb-8">
        <AIMentorComposer
          onSendMessage={(content, options) => {
            onStartSession(content, options?.focusArea || selectedFocus);
          }}
          isStreaming={isStreaming}
          currentFocusArea={selectedFocus}
          onFocusAreaChange={setSelectedFocus}
          currentLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          variant="floating"
        />
      </div>

      {/* 3. Compact Suggestion Chips */}
      <div className="w-full mb-10">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#69756B]">
            Recommended Specialist Workflows
          </span>
          <span className="text-xs text-[#27875E] font-medium hidden sm:inline">
            Click to launch instantly
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {FOCUS_AREAS_CONFIG.map((item) => {
            const Icon = ICON_MAP[item.iconName] || BookOpen;
            const isSelected = selectedFocus === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleChipClick(item)}
                className={cn(
                  "p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 group hover:-translate-y-0.5",
                  isSelected
                    ? "bg-[#E7F2DA] border-[#27875E] shadow-sm"
                    : "bg-white/80 hover:bg-white border-[#DCE5D5] hover:border-[#27875E]/40 shadow-xs hover:shadow-md"
                )}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="w-7 h-7 rounded-xl bg-[#EDF3E8] group-hover:bg-[#E7F2DA] flex items-center justify-center text-[#174B39] transition-colors">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#69756B] bg-[#FAFAF2] px-1.5 py-0.5 rounded-md border border-[#EDF3E8]">
                    {item.badge.split(" ")[0]}
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[#17211E] group-hover:text-[#174B39] line-clamp-1">
                    {item.label}
                  </h3>
                  <p className="text-[11px] text-[#69756B] line-clamp-1 mt-0.5">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Recent Conversations */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#69756B]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#69756B]">
              Recent Mentorship Sessions
            </h2>
          </div>
          {conversations.length > 0 && (
            <button
              type="button"
              onClick={onViewAllHistory}
              className="text-xs font-semibold text-[#174B39] hover:text-[#27875E] flex items-center gap-1 transition-colors"
            >
              <span>View all ({conversations.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {conversations.length === 0 ? (
          <div className="w-full p-6 sm:p-8 bg-white/70 backdrop-blur-sm rounded-2xl border border-dashed border-[#DCE5D5] text-center">
            <div className="w-10 h-10 rounded-2xl bg-[#EDF3E8] text-[#174B39] flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#17211E]">No active sessions yet</h3>
            <p className="text-xs text-[#69756B] max-w-sm mx-auto mt-1">
              Start your first conversation with Dr. Aarav Mehta using the prompt composer above or choose a suggested workflow.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.slice(0, 4).map((conv) => (
              <div
                key={conv.id}
                className="w-full p-3 sm:p-3.5 bg-white/80 hover:bg-white rounded-2xl border border-[#DCE5D5] hover:border-[#174B39]/30 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-3 group"
              >
                {/* Left: Clickable Conversation Info */}
                <div
                  onClick={() => onOpenConversation(conv.id)}
                  className="flex-1 min-w-0 cursor-pointer"
                >
                  {editingConvId === conv.id ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRename(conv.id);
                          if (e.key === "Escape") setEditingConvId(null);
                        }}
                        autoFocus
                        className="text-sm font-medium text-[#17211E] bg-white border border-[#27875E] rounded-lg px-2 py-1 w-full max-w-md focus:outline-none focus:ring-1 focus:ring-[#27875E]"
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
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#EDF3E8] group-hover:bg-[#E7F2DA] flex items-center justify-center text-[#174B39] shrink-0 transition-colors">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-[#17211E] group-hover:text-[#174B39] truncate transition-colors">
                          {conv.title || "Untitled Mentorship Session"}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-[#69756B] mt-0.5">
                          <span className="capitalize">{conv.mode ? String(conv.mode).replace(/_/g, " ") : "General"}</span>
                          <span>•</span>
                          <span>{formatRelativeTime(conv.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 shrink-0 relative">
                  <button
                    type="button"
                    onClick={() => onOpenConversation(conv.id)}
                    className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EDF3E8] group-hover:bg-[#E7F2DA] text-[#174B39] text-xs font-semibold transition-colors"
                  >
                    <span>Resume</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  {/* Options Menu Trigger */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMenuOpenId(menuOpenId === conv.id ? null : conv.id)}
                      className="p-1.5 rounded-lg text-[#69756B] hover:text-[#17211E] hover:bg-[#EDF3E8] transition-colors"
                      title="Session options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {menuOpenId === conv.id && (
                      <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-xl border border-[#DCE5D5] py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                        <button
                          type="button"
                          onClick={() => handleStartRename(conv)}
                          className="w-full text-left px-3 py-1.5 text-xs text-[#17211E] hover:bg-[#EDF3E8] flex items-center gap-2"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#69756B]" />
                          <span>Rename</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(conv.id)}
                          className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

