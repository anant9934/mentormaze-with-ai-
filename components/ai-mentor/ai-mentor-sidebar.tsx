"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MessageSquare,
  Plus,
  Search,
  Clock,
  Code2,
  Compass,
  Layers,
  Award,
  Database,
  TrendingUp,
  UserCheck,
  Briefcase,
  Sliders,
  Cpu,
  Bell,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  Bot,
  Trash2,
  Edit2,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { NavSection, ModelProviderInfo, ConversationSummary } from "./ai-mentor-types";
import { UNIFIED_MENTOR_IDENTITY } from "@/lib/ai-mentor/types";
import { cn } from "@/lib/utils";

interface AIMentorSidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  providerInfo?: ModelProviderInfo;
  onOpenModelPanel: () => void;
  conversations?: ConversationSummary[];
  activeConversationId?: string | null;
  onOpenConversation?: (id: string) => void;
  onNewSession?: () => void;
  onRenameConversation?: (id: string, newTitle: string) => Promise<void>;
  onDeleteConversation?: (id: string) => Promise<void>;
}

export function AIMentorSidebar({
  activeSection,
  onSelectSection,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  providerInfo,
  onOpenModelPanel,
  conversations = [],
  activeConversationId,
  onOpenConversation,
  onNewSession,
  onRenameConversation,
  onDeleteConversation,
}: AIMentorSidebarProps) {
  const [chatSearch, setChatSearch] = useState("");
  const [showToolsGroup, setShowToolsGroup] = useState(true);
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Group conversations by date (ChatGPT style)
  const groupedConversations = useMemo(() => {
    const query = chatSearch.toLowerCase().trim();
    const filtered = query
      ? conversations.filter(
          (c) =>
            c.title.toLowerCase().includes(query) ||
            String(c.mode).toLowerCase().includes(query)
        )
      : conversations;

    const today: ConversationSummary[] = [];
    const yesterday: ConversationSummary[] = [];
    const pastWeek: ConversationSummary[] = [];
    const older: ConversationSummary[] = [];

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    filtered.forEach((c) => {
      const time = new Date(c.updatedAt || c.createdAt).getTime();
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
  }, [conversations, chatSearch]);

  const handleStartRename = (conv: ConversationSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = async (convId: string, e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (editTitle.trim() && onRenameConversation) {
      await onRenameConversation(convId, editTitle.trim());
    }
    setEditingConvId(null);
  };

  const handleDelete = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this chat session permanently?")) {
      await onDeleteConversation?.(convId);
    }
  };

  const workspaceTools = [
    { id: "progress" as NavSection, label: "Roadmap & Plan", icon: TrendingUp },
    { id: "career_goals" as NavSection, label: "Mentorship Goals", icon: Briefcase },
    { id: "learning_profile" as NavSection, label: "Assessment", icon: UserCheck },
    { id: "skills" as NavSection, label: "Skills & Evidence", icon: Award },
    { id: "memory" as NavSection, label: "Student Memory", icon: Database },
    { id: "settings" as NavSection, label: "Settings & Consent", icon: Settings },
  ];

  const isConnected = providerInfo?.isAvailable ?? true;
  const activeModelDisplay = providerInfo?.modelName || "Gemini 2.5 Flash / Local 2B";
  const modelMode: "Local" | "API" | "Hybrid" =
    providerInfo?.provider === "mentormaze_2b" && providerInfo?.isAvailable
      ? "Local"
      : providerInfo?.provider === "local_pedagogical"
      ? "Local"
      : providerInfo?.provider === "gemini" || providerInfo?.provider === "groq" || providerInfo?.provider === "openrouter"
      ? "API"
      : "Hybrid";

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed lg:static top-0 bottom-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out select-none",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-[72px]" : "lg:w-[280px]",
          "w-[280px] h-full p-2.5 sm:p-3"
        )}
      >
        <div className="flex-1 flex flex-col bg-white/85 backdrop-blur-xl border border-[#DCE5D5] rounded-3xl shadow-sm overflow-hidden">
          {/* 1. SIDEBAR HEADER: Logo & Collapse Button */}
          <div className="p-3.5 border-b border-[#DCE5D5]/80 flex items-center justify-between gap-2">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-2.5 transition-opacity min-w-0",
                isCollapsed && "lg:hidden"
              )}
            >
              <div className="w-8 h-8 rounded-xl bg-[#123B2E] flex items-center justify-center text-white font-bold text-sm shadow-xs overflow-hidden shrink-0">
                <Image
                  src="/brand/astrion-icon.svg"
                  alt="ASTRION"
                  width={22}
                  height={22}
                  className="w-5.5 h-5.5 object-contain"
                />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight text-[#123B2E] font-serif">ASTRION</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-[#E7F2DA] text-[#123B2E] text-[10px] font-bold uppercase tracking-wider border border-[#DCE5D5]">
                    AI
                  </span>
                </div>
                <p className="text-[10px] text-[#69756B] truncate">Unified AI Mentorship</p>
              </div>
            </Link>

            {/* Collapsed Logo */}
            {isCollapsed && (
              <div className="hidden lg:flex w-8 h-8 rounded-xl bg-[#123B2E] items-center justify-center text-white font-bold text-sm mx-auto shadow-xs shrink-0">
                <Image
                  src="/brand/astrion-icon.svg"
                  alt="ASTRION"
                  width={20}
                  height={20}
                  className="w-5 h-5 object-contain"
                />
              </div>
            )}

            {/* Collapse & Mobile Close Toggles */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 rounded-xl text-[#69756B] hover:text-[#123B2E] hover:bg-[#EDF3E8] transition-colors"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-xl text-[#69756B] hover:text-[#123B2E] hover:bg-[#EDF3E8] transition-colors"
                title="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. CHATGPT-STYLE "+ NEW CHAT" PRIMARY BUTTON */}
          <div className="p-2.5 pb-1.5">
            <button
              type="button"
              onClick={() => {
                onNewSession?.();
                if (isMobileOpen) onCloseMobile();
              }}
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-2xl bg-[#174B39] hover:bg-[#123B2E] text-white font-semibold text-xs shadow-xs hover:shadow transition-all group",
                isCollapsed ? "p-2.5" : "px-3.5 py-2.5"
              )}
              title="Start a new chat session"
            >
              <Plus className="w-4 h-4 stroke-[2.5] group-hover:rotate-90 transition-transform" />
              {!isCollapsed && <span className="tracking-tight">New Chat</span>}
            </button>
          </div>

          {/* 3. SEARCH CHATS FILTER (Expanded mode only) */}
          {!isCollapsed && conversations.length > 3 && (
            <div className="px-2.5 py-1">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#69756B] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full pl-8 pr-2.5 py-1.5 bg-[#FAFAF2] border border-[#DCE5D5] rounded-xl text-xs text-[#17211E] placeholder:text-[#69756B]/60 focus:outline-none focus:ring-1 focus:ring-[#27875E] transition-all"
                />
                {chatSearch && (
                  <button
                    type="button"
                    onClick={() => setChatSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#69756B] hover:text-[#17211E]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 4. CHAT HISTORY LIST (ChatGPT layout with date grouping) */}
          <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-3 scrollbar-thin">
            {!isCollapsed ? (
              <>
                {groupedConversations.length === 0 ? (
                  <div className="text-center py-6 px-2">
                    <p className="text-xs text-[#69756B]">
                      {chatSearch ? "No matching chats found." : "No previous chats yet."}
                    </p>
                  </div>
                ) : (
                  groupedConversations.map((group) => (
                    <div key={group.label} className="space-y-0.5">
                      <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#69756B]/80 font-sans">
                        {group.label}
                      </p>
                      <div className="space-y-0.5">
                        {group.items.map((conv) => {
                          const isActive =
                            activeSection === "chat" && activeConversationId === conv.id;
                          const isEditing = editingConvId === conv.id;

                          return (
                            <div
                              key={conv.id}
                              onClick={() => {
                                onOpenConversation?.(conv.id);
                                if (isMobileOpen) onCloseMobile();
                              }}
                              className={cn(
                                "group relative w-full flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-all",
                                isActive
                                  ? "bg-[#E7F2DA] text-[#123B2E] font-medium border border-[#DCE5D5] shadow-2xs"
                                  : "text-[#17211E] hover:bg-[#EDF3E8]/70"
                              )}
                              title={conv.title}
                            >
                              {/* Left icon & Title or Edit Input */}
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <MessageSquare
                                  className={cn(
                                    "w-3.5 h-3.5 shrink-0",
                                    isActive ? "text-[#174B39]" : "text-[#69756B]"
                                  )}
                                />
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSaveRename(conv.id, e);
                                      if (e.key === "Escape") setEditingConvId(null);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                    className="bg-white border border-[#27875E] rounded px-1.5 py-0.5 text-xs text-[#17211E] w-full focus:outline-none"
                                  />
                                ) : (
                                  <span className="truncate text-xs leading-normal">
                                    {conv.title || "Mentorship Session"}
                                  </span>
                                )}
                              </div>

                              {/* Action buttons (Rename & Delete) on hover */}
                              <div
                                className={cn(
                                  "flex items-center gap-0.5 shrink-0",
                                  isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"
                                )}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {isEditing ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => handleSaveRename(conv.id, e)}
                                      className="p-1 hover:text-emerald-700 text-[#27875E]"
                                      title="Save title"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingConvId(null)}
                                      className="p-1 hover:text-red-600 text-[#69756B]"
                                      title="Cancel"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => handleStartRename(conv, e)}
                                      className="p-1 text-[#69756B] hover:text-[#17211E] hover:bg-white rounded transition-colors"
                                      title="Rename chat"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleDelete(conv.id, e)}
                                      className="p-1 text-[#69756B] hover:text-red-600 hover:bg-white rounded transition-colors"
                                      title="Delete chat"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </>
            ) : (
              /* Collapsed state chat icon button */
              <div className="flex flex-col items-center space-y-1.5 py-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelectSection("chat");
                    onNewSession?.();
                  }}
                  className={cn(
                    "p-2.5 rounded-xl transition-all",
                    activeSection === "chat"
                      ? "bg-[#E7F2DA] text-[#174B39]"
                      : "text-[#69756B] hover:bg-[#EDF3E8]"
                  )}
                  title="Chats"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* 5. WORKSPACE & MENTORSHIP TOOLS ACCORDION */}
          <div className="border-t border-[#DCE5D5]/80 bg-[#FAFAF2]/60 p-2">
            {!isCollapsed ? (
              <div>
                <button
                  type="button"
                  onClick={() => setShowToolsGroup(!showToolsGroup)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider text-[#69756B] hover:text-[#17211E] hover:bg-[#EDF3E8]/60 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#27875E]" />
                    <span>Workspace Tools</span>
                  </span>
                  {showToolsGroup ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                </button>

                {showToolsGroup && (
                  <div className="mt-1 space-y-0.5 animate-in fade-in duration-150">
                    {workspaceTools.map((tool) => {
                      const Icon = tool.icon;
                      const isActive = activeSection === tool.id;
                      return (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => {
                            onSelectSection(tool.id);
                            if (isMobileOpen) onCloseMobile();
                          }}
                          className={cn(
                            "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs transition-colors",
                            isActive
                              ? "bg-[#E7F2DA] text-[#174B39] font-semibold border border-[#DCE5D5]"
                              : "text-[#69756B] hover:text-[#17211E] hover:bg-[#EDF3E8]/60"
                          )}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{tool.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-1">
                {workspaceTools.slice(0, 3).map((tool) => {
                  const Icon = tool.icon;
                  const isActive = activeSection === tool.id;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => onSelectSection(tool.id)}
                      className={cn(
                        "p-2 rounded-xl transition-colors",
                        isActive ? "bg-[#E7F2DA] text-[#174B39]" : "text-[#69756B] hover:bg-[#EDF3E8]"
                      )}
                      title={tool.label}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 6. SIDEBAR FOOTER: UNIFIED MENTOR IDENTITY */}
          <div className="p-2.5 border-t border-[#DCE5D5]/80 bg-white/60">
            {!isCollapsed ? (
              <div className="w-full p-2.5 rounded-2xl bg-[#FAFAF2] border border-[#DCE5D5] shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-forest-900 flex items-center gap-1.5 font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-[#27875E]" />
                    <span>ASTRION Mentoring</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold bg-[#E7F2DA] text-[#174B39] border border-[#DCE5D5]">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-[#69756B] leading-tight">
                  Continuous AI & Human Ecosystem
                </p>
              </div>
            ) : (
              <div
                className="w-full flex justify-center p-2 rounded-xl text-[#174B39]"
                title="ASTRION Active"
              >
                <Sparkles className="w-4 h-4 text-[#27875E]" />
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
