"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Menu,
  X,
  Sparkles,
  Bot,
  User,
  RotateCw,
  AlertTriangle,
} from "lucide-react";
import {
  FocusArea,
  LanguageCode,
  TeachingMode,
  SkillUpdate,
} from "@/lib/ai-mentor/types";
import {
  NavSection,
  ChatMessage,
  ConversationSummary,
  ModelProviderInfo,
} from "./ai-mentor-types";
import { AIMentorSidebar } from "./ai-mentor-sidebar";
import { AIMentorHome } from "./ai-mentor-home";
import { AIMentorConversation } from "./ai-mentor-conversation";
import { AIMentorHistory } from "./ai-mentor-history";
import { AIMentorCodework } from "./ai-mentor-codework";
import { AIMentorDiscover } from "./ai-mentor-discover";
import { AIMentorProjects } from "./ai-mentor-projects";
import { AIMentorSkills } from "./ai-mentor-skills";
import { AIMentorMemory } from "./ai-mentor-memory";
import { AIMentorProgress } from "./ai-mentor-progress";
import { AIMentorAgents } from "./ai-mentor-agents";
import { AIMentorPersonalization } from "./ai-mentor-personalization";
import { AIMentorModelPanel } from "./ai-mentor-model-panel";
import { AIMentorSettings } from "./ai-mentor-settings";
import { AIMentorHelp } from "./ai-mentor-help";
import { cn } from "@/lib/utils";

interface AIMentorShellProps {
  initialUserId?: string;
  studentName?: string;
}

export function AIMentorShell({
  initialUserId = "usr-student-1",
  studentName = "Student",
}: AIMentorShellProps) {
  // Navigation & UI State
  const [activeSection, setActiveSection] = useState<NavSection>("chat");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);

  // Conversation & Chat State
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversationTitle, setActiveConversationTitle] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentFocusArea, setCurrentFocusArea] = useState<FocusArea>("learn");
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>("en");
  const [isStreaming, setIsStreaming] = useState(false);

  // Model & Network State
  const [modelInfo, setModelInfo] = useState<ModelProviderInfo>({
    provider: "gemini",
    modelName: "Gemini 2.5 Flash",
    isAvailable: true,
    isConfigured: true,
    status: "active",
    lifecycleState: "production",
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // 1. Fetch Conversations on Mount
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(`/api/ai-mentor/conversations?userId=${initialUserId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.conversations)) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.warn("Failed to load conversations:", err);
    }
  }, [initialUserId]);

  // 2. Fetch Model Provider Status on Mount
  const loadModelStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-mentor");
      const data = await res.json();
      if (data.success && data.activeProvider) {
        const active = data.providers?.[data.activeProvider];
        setModelInfo({
          provider: data.activeProvider,
          modelName: active?.modelName || (data.activeProvider === "gemini" ? "Gemini 2.5 Flash" : "Local Engine"),
          isAvailable: active?.isAvailable ?? true,
          isConfigured: active?.isConfigured ?? true,
          status: active?.status || "active",
          lifecycleState: "production",
        });
      }
    } catch (err) {
      console.warn("Failed to load model status:", err);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    loadModelStatus();
  }, [loadConversations, loadModelStatus]);

  // Switch to specific conversation
  const openConversation = useCallback(
    async (convId: string) => {
      setActiveConversationId(convId);
      setActiveSection("chat");
      setMobileSidebarOpen(false);

      try {
        const res = await fetch(`/api/ai-mentor/conversations/${convId}?userId=${initialUserId}`);
        const data = await res.json();
        if (data.success && data.conversation) {
          setActiveConversationTitle(data.conversation.title || "Mentorship Session");
          if (data.conversation.mode) {
            setCurrentFocusArea(data.conversation.mode as FocusArea);
          }
          if (Array.isArray(data.messages)) {
            const mapped: ChatMessage[] = data.messages.map((m: any) => ({
              id: m.id,
              sender: m.sender || (m.role === "user" ? "user" : "mentor"),
              content: m.content || "",
              timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now",
              teachingStrategy: m.teachingStrategy,
              specialistCapability: m.specialistCapability,
              sources: m.sources,
              recommendedActions: m.recommendedActions,
              skillUpdates: m.skillUpdates,
              escalation: m.escalation,
              latencyMs: m.latencyMs,
              modelProvider: m.modelProvider,
              inferenceMode: m.inferenceMode,
              postInteractionCheck: m.postInteractionCheck,
            }));
            setMessages(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to load conversation details:", err);
      }
    },
    [initialUserId]
  );

  // Return to workspace home screen
  const handleBackToHome = () => {
    setActiveConversationId(null);
    setMessages([]);
    setActiveSection("chat");
  };

  // Start fresh conversation session
  const handleStartSession = async (initialPrompt: string, focusArea?: FocusArea) => {
    const focusToUse = focusArea || currentFocusArea;
    try {
      const res = await fetch("/api/ai-mentor/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: initialUserId,
          title: initialPrompt.slice(0, 48) || `Mentorship on ${focusToUse.toUpperCase()}`,
          mode: focusToUse,
          language: currentLanguage,
        }),
      });
      const data = await res.json();
      if (data.success && data.conversation) {
        const newConv = data.conversation;
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
        setActiveConversationTitle(newConv.title);
        setCurrentFocusArea(focusToUse);
        setActiveSection("chat");

        // Immediately send initial message
        handleSendMessage(initialPrompt, { focusArea: focusToUse });
      }
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  };

  // Send message with SSE streaming
  const handleSendMessage = async (
    content: string,
    options?: { focusArea?: FocusArea; language?: LanguageCode; attachments?: string[] }
  ) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const focusToUse = options?.focusArea || currentFocusArea;
    const langToUse = options?.language || currentLanguage;

    // Create user message in UI
    const userMsgId = `usr-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Placeholder mentor message
    const mentorTempId = `mnt-${Date.now()}`;
    const placeholderMentorMsg: ChatMessage = {
      id: mentorTempId,
      sender: "mentor",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      modelProvider: modelInfo.modelName,
      inferenceMode: "generative",
    };

    setMessages((prev) => [...prev, userMsg, placeholderMentorMsg]);
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const res = await fetch("/api/ai-mentor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          studentUserId: initialUserId,
          conversationId: activeConversationId,
          userMessage: trimmed,
          focusArea: focusToUse,
          mode: focusToUse,
          languagePreference: langToUse,
          conversationHistory: messages.slice(-6).map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.content,
          })),
          stream: true,
        }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) {
        throw new Error("ReadableStream not supported by browser");
      }

      let accumulatedContent = "";
      let metadataReceived: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split("\n\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.replace("data: ", "").trim();
          if (!jsonStr) continue;

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.chunk) {
              accumulatedContent += parsed.chunk;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === mentorTempId ? { ...msg, content: accumulatedContent } : msg
                )
              );
            }
            if (parsed.done && parsed.metadata) {
              metadataReceived = parsed.metadata;
            }
          } catch {
            // Buffer parse guard
          }
        }
      }

      setIsStreaming(false);
      abortControllerRef.current = null;

      if (metadataReceived) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === mentorTempId
              ? {
                  ...msg,
                  content: accumulatedContent,
                  teachingStrategy: metadataReceived.teachingStrategy,
                  specialistCapability: metadataReceived.specialistCapability,
                  sources: metadataReceived.sources,
                  recommendedActions: metadataReceived.recommendedActions,
                  skillUpdates: metadataReceived.skillUpdates,
                  escalation: metadataReceived.escalationRecommendation,
                  latencyMs: metadataReceived.latencyMs,
                  modelProvider: metadataReceived.modelProvider || modelInfo.modelName,
                  inferenceMode: metadataReceived.inferenceMode || "generative",
                  requestId: metadataReceived.requestId,
                  tokenUsage: metadataReceived.tokenUsage,
                  estimatedCostUsd: metadataReceived.estimatedCostUsd,
                  fallbackReason: metadataReceived.fallbackReason,
                  postInteractionCheck: metadataReceived.postInteractionCheck,
                }
              : msg
          )
        );
      }

      // Refresh conversations list
      loadConversations();
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Generation stopped by student.");
      } else {
        console.error("AI Mentor Turn error:", err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === mentorTempId
              ? {
                  ...msg,
                  content:
                    "I encountered an unexpected network disruption while processing this response. Please verify connection or retry.",
                }
              : msg
          )
        );
      }
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Stop generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  };

  // Rename conversation
  const handleRenameConversation = async (convId: string, newTitle: string) => {
    try {
      const res = await fetch(`/api/ai-mentor/conversations/${convId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      const data = await res.json();
      if (data.success) {
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, title: newTitle } : c))
        );
        if (activeConversationId === convId) {
          setActiveConversationTitle(newTitle);
        }
      }
    } catch (err) {
      console.error("Failed to rename conversation:", err);
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (convId: string) => {
    try {
      const res = await fetch(`/api/ai-mentor/conversations/${convId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setConversations((prev) => prev.filter((c) => c.id !== convId));
        if (activeConversationId === convId) {
          handleBackToHome();
        }
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  // Clear messages in current conversation
  const handleClearConversation = async () => {
    setMessages([]);
  };

  // Save note to student memory
  const handleSaveNote = async (msgId: string, content: string) => {
    try {
      await fetch("/api/ai-mentor/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "learning_notes",
          key: `Session Note (${new Date().toLocaleDateString()})`,
          value: content.slice(0, 300),
          provenance: "student_reported",
          confidence: 1.0,
          studentConfirmed: true,
        }),
      });
      alert("Saved key takeaway to your Student Memory!");
    } catch (err) {
      console.error("Failed to save note:", err);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-gradient-to-br from-[#EDF3E8] via-[#FAFAF2] to-[#DDEFEA] text-[#17211E] p-2 sm:p-3 gap-2 sm:gap-3">
      {/* 1. SIDEBAR (Desktop / Tablet / Mobile Drawer) */}
      <AIMentorSidebar
        activeSection={activeSection}
        onSelectSection={(sec) => {
          setActiveSection(sec);
          if (sec === "model_info") {
            setShowModelModal(true);
          }
        }}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        providerInfo={modelInfo}
        onOpenModelPanel={() => setShowModelModal(true)}
      />

      {/* 3. MAIN WORKSPACE CONTAINER */}
      <main className="flex-1 h-full rounded-3xl bg-white/70 backdrop-blur-md border border-[#DCE5D5] shadow-xs flex flex-col overflow-hidden relative">
        {/* Mobile Top Header (Visible only on < md) */}
        <div className="md:hidden shrink-0 px-4 py-2.5 border-b border-[#DCE5D5] bg-white/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 rounded-xl hover:bg-[#EDF3E8] text-[#174B39] transition-colors"
            title="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-serif font-bold text-sm text-[#174B39]">MentorMaze AI</span>
          </div>

          <div className="w-5" />
        </div>

        {/* Dynamic Section Router */}
        <div className="flex-1 h-full overflow-y-auto">
          {activeSection === "chat" && (
            activeConversationId ? (
              <AIMentorConversation
                conversationId={activeConversationId}
                conversationTitle={activeConversationTitle}
                messages={messages}
                onSendMessage={handleSendMessage}
                isStreaming={isStreaming}
                onStopGeneration={handleStopGeneration}
                onBackToHome={handleBackToHome}
                onNewSession={() => handleBackToHome()}
                onRenameConversation={(newTitle) =>
                  handleRenameConversation(activeConversationId, newTitle)
                }
                onClearConversation={handleClearConversation}
                onSaveNote={handleSaveNote}
                currentFocusArea={currentFocusArea}
                onFocusAreaChange={setCurrentFocusArea}
                currentLanguage={currentLanguage}
                onLanguageChange={setCurrentLanguage}
                activeModelInfo={modelInfo}
              />
            ) : (
              <AIMentorHome
                onStartSession={handleStartSession}
                onOpenConversation={openConversation}
                onViewAllHistory={() => setActiveSection("history")}
                conversations={conversations}
                onRenameConversation={handleRenameConversation}
                onDeleteConversation={handleDeleteConversation}
                studentName={studentName}
                isStreaming={isStreaming}
              />
            )
          )}

          {activeSection === "history" && (
            <AIMentorHistory
              conversations={conversations}
              onOpenConversation={openConversation}
              onRenameConversation={handleRenameConversation}
              onDeleteConversation={handleDeleteConversation}
              onNewSession={() => handleBackToHome()}
            />
          )}

          {activeSection === "codework" && (
            <AIMentorCodework
              onSendToMentor={(prompt, code, language) => {
                setActiveSection("chat");
                handleStartSession(`${prompt}\n\nLanguage: ${language}\n\`\`\`${language}\n${code}\n\`\`\``, "coding_dsa");
              }}
            />
          )}

          {activeSection === "discover" && (
            <AIMentorDiscover
              onSelectPrompt={(prompt, focusArea) => {
                setActiveSection("chat");
                handleStartSession(prompt, focusArea);
              }}
            />
          )}

          {activeSection === "projects" && (
            <AIMentorProjects
              onReviewProject={(prompt, focusArea) => {
                setActiveSection("chat");
                handleStartSession(prompt, focusArea);
              }}
            />
          )}

          {activeSection === "agents" && (
            <AIMentorAgents
              onSelectCapability={(prompt, focusArea) => {
                setActiveSection("chat");
                handleStartSession(prompt, focusArea);
              }}
            />
          )}

          {activeSection === "skills" && (
            <AIMentorSkills
              userId={initialUserId}
              onVerifySkill={(prompt, focusArea) => {
                setActiveSection("chat");
                handleStartSession(prompt, focusArea);
              }}
            />
          )}

          {activeSection === "memory" && <AIMentorMemory userId={initialUserId} />}

          {activeSection === "progress" && (
            <AIMentorProgress
              onContinueLearning={(topic, focusArea) => {
                setActiveSection("chat");
                handleStartSession(topic, focusArea);
              }}
            />
          )}

          {(activeSection === "learning_profile" ||
            activeSection === "career_goals" ||
            activeSection === "preferences") && (
            <AIMentorPersonalization section={activeSection} />
          )}

          {activeSection === "model_info" && <AIMentorModelPanel />}

          {(activeSection === "settings" || activeSection === "notifications") && (
            <AIMentorSettings />
          )}

          {(activeSection === "help" || activeSection === "report_issue") && <AIMentorHelp />}
        </div>
      </main>

      {/* 4. MODEL INFO MODAL (if triggered) */}
      {showModelModal && (
        <AIMentorModelPanel onClose={() => setShowModelModal(false)} isModal={true} />
      )}
    </div>
  );
}
