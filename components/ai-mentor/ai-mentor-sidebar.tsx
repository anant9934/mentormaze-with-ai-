"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MessageSquare,
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
  Shield,
  Activity,
  X,
  Bot,
} from "lucide-react";
import { NavSection, ModelProviderInfo } from "./ai-mentor-types";
import { UNIFIED_MENTOR_IDENTITY } from "@/lib/ai-mentor/types";

interface AIMentorSidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  providerInfo?: ModelProviderInfo;
  onOpenModelPanel: () => void;
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
}: AIMentorSidebarProps) {
  const mainNavItems = [
    { id: "chat" as NavSection, label: "Chat", icon: MessageSquare },
    { id: "history" as NavSection, label: "History", icon: Clock },
    { id: "codework" as NavSection, label: "Codework", icon: Code2 },
    { id: "discover" as NavSection, label: "Discover", icon: Compass },
    { id: "projects" as NavSection, label: "Projects", icon: Layers },
    { id: "agents" as NavSection, label: "Agents", icon: Bot },
    { id: "memory" as NavSection, label: "Memory", icon: Database },
    { id: "skills" as NavSection, label: "Skills", icon: Award },
    { id: "progress" as NavSection, label: "Progress", icon: TrendingUp },
  ];

  const personalizationNavItems = [
    { id: "learning_profile" as NavSection, label: "Learning Profile", icon: UserCheck },
    { id: "career_goals" as NavSection, label: "Career Goals", icon: Briefcase },
    { id: "preferences" as NavSection, label: "Preferences", icon: Sliders },
  ];

  const toolsNavItems = [
    { id: "notifications" as NavSection, label: "Notifications", icon: Bell },
    { id: "settings" as NavSection, label: "Settings", icon: Settings },
    { id: "model_info" as NavSection, label: "Model Information", icon: Cpu },
    { id: "report_issue" as NavSection, label: "Report Issue", icon: HelpCircle },
  ];

  const isConnected = providerInfo?.isAvailable ?? true;
  const activeModelDisplay = providerInfo?.modelName || "Hybrid Qwen/Gemini";
  const activeProviderDisplay = providerInfo?.provider || "Hybrid Cloud / Local";
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
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${
          isCollapsed ? "lg:w-[76px]" : "lg:w-[280px]"
        } w-[280px] h-full p-3 lg:p-4 select-none`}
      >
        <div className="flex-1 flex flex-col bg-white/80 backdrop-blur-md border border-[#DCE5D5] rounded-3xl shadow-sm overflow-hidden">
          {/* SIDEBAR HEADER */}
          <div className="p-4 border-b border-[#DCE5D5]/80 flex items-center justify-between">
            <Link
              href="/"
              className={`flex items-center gap-2.5 transition-opacity ${
                isCollapsed ? "lg:hidden" : "flex"
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-[#123B2E] flex items-center justify-center text-white font-bold text-sm shadow-xs">
                M
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight text-[#123B2E]">MentorMaze</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-[#E7F2DA] text-[#123B2E] text-[10px] font-bold uppercase tracking-wider border border-[#DCE5D5]">
                    AI
                  </span>
                </div>
                <p className="text-[10px] text-[#69756B] leading-none mt-0.5">Workspace v2.4</p>
              </div>
            </Link>

            {/* Icon only for collapsed desktop */}
            {isCollapsed && (
              <div className="hidden lg:flex w-8 h-8 rounded-xl bg-[#123B2E] items-center justify-center text-white font-bold text-sm mx-auto shadow-xs">
                M
              </div>
            )}

            {/* Collapse / Close Toggle */}
            <div className="flex items-center gap-1">
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 rounded-lg text-[#69756B] hover:text-[#123B2E] hover:bg-[#EDF3E8] transition-colors"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-lg text-[#69756B] hover:text-[#123B2E] hover:bg-[#EDF3E8] transition-colors"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* MENTOR PROFILE BAR */}
          <div
            className={`p-3.5 border-b border-[#DCE5D5]/60 bg-[#FAFAF2]/60 flex items-center gap-3 ${
              isCollapsed ? "lg:justify-center lg:p-2.5" : ""
            }`}
          >
            <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-[#27875E]/30 flex-shrink-0 shadow-2xs">
              <Image
                src={UNIFIED_MENTOR_IDENTITY.avatarUrl}
                alt={UNIFIED_MENTOR_IDENTITY.name}
                fill
                className="object-cover"
              />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-xs text-[#123B2E] truncate">{UNIFIED_MENTOR_IDENTITY.name}</p>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isConnected ? "bg-[#27875E] animate-pulse" : "bg-[#D99B45]"
                    }`}
                  />
                  <span className="text-[10px] text-[#69756B] font-medium truncate">
                    {isConnected ? "Active Intelligence" : "Local Standby"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SCROLLABLE NAVIGATION LIST */}
          <nav className="flex-1 overflow-y-auto p-2.5 space-y-4 text-xs">
            {/* GROUP 1: MAIN */}
            <div>
              {!isCollapsed && (
                <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#69756B]">
                  Main
                </p>
              )}
              <div className="space-y-0.5">
                {mainNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectSection(item.id);
                        if (isMobileOpen) onCloseMobile();
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all ${
                        isActive
                          ? "bg-[#E7F2DA] text-[#123B2E] font-semibold border border-[#DCE5D5] shadow-2xs"
                          : "text-[#69756B] hover:text-[#123B2E] hover:bg-[#EDF3E8]/70"
                      } ${isCollapsed ? "lg:justify-center lg:px-2" : ""}`}
                      title={item.label}
                    >
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 ${
                          isActive ? "text-[#123B2E]" : "text-[#69756B]"
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GROUP 2: PERSONALIZATION */}
            <div>
              {!isCollapsed && (
                <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#69756B]">
                  Personalization
                </p>
              )}
              <div className="space-y-0.5">
                {personalizationNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectSection(item.id);
                        if (isMobileOpen) onCloseMobile();
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all ${
                        isActive
                          ? "bg-[#E7F2DA] text-[#123B2E] font-semibold border border-[#DCE5D5] shadow-2xs"
                          : "text-[#69756B] hover:text-[#123B2E] hover:bg-[#EDF3E8]/70"
                      } ${isCollapsed ? "lg:justify-center lg:px-2" : ""}`}
                      title={item.label}
                    >
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 ${
                          isActive ? "text-[#123B2E]" : "text-[#69756B]"
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GROUP 3: TOOLS */}
            <div>
              {!isCollapsed && (
                <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#69756B]">
                  Tools
                </p>
              )}
              <div className="space-y-0.5">
                {toolsNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === "model_info") {
                          onOpenModelPanel();
                        } else {
                          onSelectSection(item.id);
                        }
                        if (isMobileOpen) onCloseMobile();
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all ${
                        isActive
                          ? "bg-[#E7F2DA] text-[#123B2E] font-semibold border border-[#DCE5D5] shadow-2xs"
                          : "text-[#69756B] hover:text-[#123B2E] hover:bg-[#EDF3E8]/70"
                      } ${isCollapsed ? "lg:justify-center lg:px-2" : ""}`}
                      title={item.label}
                    >
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 ${
                          isActive ? "text-[#123B2E]" : "text-[#69756B]"
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* SIDEBAR FOOTER CARD */}
          <div className="p-3 border-t border-[#DCE5D5]/80 bg-[#FAFAF2]/80">
            {!isCollapsed ? (
              <button
                onClick={onOpenModelPanel}
                className="w-full text-left p-2.5 rounded-2xl bg-white border border-[#DCE5D5] hover:border-[#123B2E]/30 transition-all shadow-2xs group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#69756B] flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-[#27875E]" />
                    <span>Model Engine</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#E7F2DA] text-[#123B2E] border border-[#DCE5D5]">
                    {modelMode}
                  </span>
                </div>
                <p className="text-xs font-bold text-[#123B2E] truncate font-mono">
                  {activeModelDisplay}
                </p>
                <p className="text-[10px] text-[#69756B] truncate mt-0.5">
                  {activeProviderDisplay} · mentormaze-2b
                </p>
              </button>
            ) : (
              <button
                onClick={onOpenModelPanel}
                className="w-full flex justify-center p-2 rounded-xl text-[#69756B] hover:text-[#123B2E] hover:bg-[#EDF3E8]"
                title="Model status & details"
              >
                <Cpu className="w-4 h-4 text-[#27875E]" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

