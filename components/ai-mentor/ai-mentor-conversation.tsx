"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Copy,
  Bookmark,
  Volume2,
  VolumeX,
  RotateCw,
  Sparkles,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  Lightbulb,
  FileCode,
  ShieldCheck,
  Bot,
  User,
  ArrowRight,
} from "lucide-react";
import {
  FocusArea,
  LanguageCode,
  SourceCitation,
  RecommendedAction,
} from "@/lib/ai-mentor/types";
import {
  ChatMessage,
  FOCUS_AREAS_CONFIG,
  ConversationSummary,
  ModelProviderInfo,
} from "./ai-mentor-types";
import { AIMentorComposer } from "./ai-mentor-composer";
import { cn } from "@/lib/utils";

interface AIMentorConversationProps {
  conversationId: string;
  conversationTitle: string;
  messages: ChatMessage[];
  onSendMessage: (content: string, options?: { focusArea?: FocusArea; language?: LanguageCode; attachments?: string[] }) => void;
  isStreaming: boolean;
  onStopGeneration: () => void;
  onBackToHome: () => void;
  onNewSession: () => void;
  onRenameConversation: (newTitle: string) => Promise<void>;
  onClearConversation: () => Promise<void>;
  onRegenerateResponse?: (lastUserMessageIndex: number) => void;
  onSaveNote?: (messageId: string, content: string) => void;
  currentFocusArea: FocusArea;
  onFocusAreaChange: (focusArea: FocusArea) => void;
  currentLanguage: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  activeModelInfo?: ModelProviderInfo;
}

// Lightweight syntax and markdown renderer
function FormattedContent({ content }: { content: string }) {
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);

  // Split content by code blocks ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let blockIndex = 0;

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textPart = content.slice(lastIndex, match.index);
      parts.push(<span key={`text-${lastIndex}`}>{renderText(textPart)}</span>);
    }

    const lang = match[1] || "code";
    const code = match[2];
    const currentIdx = blockIndex++;

    parts.push(
      <div
        key={`code-${match.index}`}
        className="my-3 rounded-2xl overflow-hidden border border-[#DCE5D5] bg-[#17211E] text-slate-100 shadow-md font-mono text-xs"
      >
        <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#121A18] border-b border-[#2A3834] text-[11px] text-slate-400">
          <span className="font-semibold uppercase tracking-wider text-emerald-400">{lang}</span>
          <button
            type="button"
            onClick={() => handleCopyCode(code, currentIdx)}
            className="flex items-center gap-1 hover:text-white transition-colors py-0.5 px-1.5 rounded"
          >
            {copiedCodeIdx === currentIdx ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-3.5 overflow-x-auto text-[12px] leading-relaxed font-mono">
          <code>{code}</code>
        </pre>
      </div>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(<span key={`text-${lastIndex}`}>{renderText(content.slice(lastIndex))}</span>);
  }

  return <div className="space-y-1 text-sm leading-relaxed">{parts}</div>;
}

// Inline formatting (bold, italic, inline code, list items)
function renderText(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((line, lIdx) => {
    // Heading 3
    if (line.startsWith("### ")) {
      return (
        <h4 key={lIdx} className="font-bold text-[#174B39] text-sm mt-3 mb-1">
          {line.replace("### ", "")}
        </h4>
      );
    }
    // Heading 2
    if (line.startsWith("## ")) {
      return (
        <h3 key={lIdx} className="font-serif font-bold text-[#17211E] text-base mt-4 mb-1.5">
          {line.replace("## ", "")}
        </h3>
      );
    }
    // Heading 1
    if (line.startsWith("# ")) {
      return (
        <h2 key={lIdx} className="font-serif font-bold text-[#17211E] text-lg mt-4 mb-2">
          {line.replace("# ", "")}
        </h2>
      );
    }
    // Bullet item
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const bulletText = line.trim().replace(/^[-*]\s+/, "");
      return (
        <div key={lIdx} className="flex items-start gap-2 ml-2 my-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#27875E] mt-2 shrink-0" />
          <span>{parseInlineFormatting(bulletText)}</span>
        </div>
      );
    }
    // Empty line
    if (!line.trim()) {
      return <div key={lIdx} className="h-2" />;
    }
    return (
      <p key={lIdx} className="my-0.5">
        {parseInlineFormatting(line)}
      </p>
    );
  });
}

function parseInlineFormatting(str: string): React.ReactNode {
  // Bold & inline code
  const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, pIdx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={pIdx} className="font-bold text-[#17211E]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={pIdx}
          className="px-1.5 py-0.5 rounded-md bg-[#E7F2DA] text-[#174B39] font-mono text-[12px] border border-[#DCE5D5]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export function AIMentorConversation({
  conversationId,
  conversationTitle,
  messages,
  onSendMessage,
  isStreaming,
  onStopGeneration,
  onBackToHome,
  onNewSession,
  onRenameConversation,
  onClearConversation,
  onRegenerateResponse,
  onSaveNote,
  currentFocusArea,
  onFocusAreaChange,
  currentLanguage,
  onLanguageChange,
  activeModelInfo,
}: AIMentorConversationProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(conversationTitle);
  const [copiedMsgIdx, setCopiedMsgIdx] = useState<number | null>(null);
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState<number | null>(null);
  const [answeredChecks, setAnsweredChecks] = useState<Record<string, number>>({});
  const [openSourcesMsgId, setOpenSourcesMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync title when prop changes
  useEffect(() => {
    setTempTitle(conversationTitle);
  }, [conversationTitle]);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSaveTitle = async () => {
    if (tempTitle.trim() && tempTitle !== conversationTitle) {
      await onRenameConversation(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleCopyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgIdx(idx);
    setTimeout(() => setCopiedMsgIdx(null), 2000);
  };

  const handleToggleSpeak = (text: string, idx: number) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }
    if (speakingMsgIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingMsgIdx(null);
    } else {
      window.speechSynthesis.cancel();
      // Clean markdown tags before speaking
      const plainText = text.replace(/```[\s\S]*?```/g, "Code block omitted.").replace(/[#*`_]/g, "");
      const utterance = new SpeechSynthesisUtterance(plainText);
      utterance.onend = () => setSpeakingMsgIdx(null);
      utterance.onerror = () => setSpeakingMsgIdx(null);
      setSpeakingMsgIdx(idx);
      window.speechSynthesis.speak(utterance);
    }
  };

  const activeFocusDef = FOCUS_AREAS_CONFIG.find((f) => f.id === currentFocusArea) || FOCUS_AREAS_CONFIG[0];

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto overflow-hidden">
      {/* 1. TOP CONVERSATION HEADER */}
      <header className="shrink-0 px-4 sm:px-6 py-3 border-b border-[#DCE5D5] bg-white/70 backdrop-blur-md flex items-center justify-between gap-3">
        {/* Left: Back button & Title edit */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBackToHome}
            className="p-1.5 rounded-xl hover:bg-[#EDF3E8] text-[#174B39] transition-colors"
            title="Back to Workspace Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {isEditingTitle ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") {
                    setTempTitle(conversationTitle);
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
                className="text-sm font-semibold text-[#17211E] bg-white border border-[#27875E] rounded-lg px-2 py-0.5 max-w-[220px] sm:max-w-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveTitle}
                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setTempTitle(conversationTitle);
                  setIsEditingTitle(false);
                }}
                className="p-1 text-slate-400 hover:bg-slate-100 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0 group cursor-pointer" onClick={() => setIsEditingTitle(true)}>
              <h2 className="text-sm font-semibold text-[#17211E] truncate max-w-[180px] sm:max-w-xs">
                {conversationTitle || "Mentorship Session"}
              </h2>
              <Edit2 className="w-3 h-3 text-[#69756B] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          )}
        </div>

        {/* Right: Focus Area Switcher & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Active Specialist Pill */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-[#E7F2DA] border border-[#DCE5D5] rounded-full text-[11px] font-semibold text-[#174B39]">
            <Sparkles className="w-3 h-3 text-[#27875E]" />
            <span>{activeFocusDef.badge}</span>
          </div>

          {/* New Session Button */}
          <button
            type="button"
            onClick={onNewSession}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#EDF3E8] hover:bg-[#E7F2DA] text-[#174B39] text-xs font-semibold transition-colors"
            title="Start fresh session"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Session</span>
          </button>

          {/* Clear Session */}
          <button
            type="button"
            onClick={() => {
              if (confirm("Clear all messages in this conversation?")) {
                onClearConversation();
              }
            }}
            className="p-1.5 rounded-xl text-[#69756B] hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Clear messages"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. SCROLLABLE MESSAGES STREAM */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#E7F2DA] text-[#174B39] flex items-center justify-center mx-auto mb-3">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg text-[#17211E]">Session started with Dr. Aarav Mehta</h3>
            <p className="text-xs text-[#69756B] max-w-md mx-auto">
              Type your first question below. Dr. Aarav Mehta will adapt pedagogical depth, cite verified knowledge, and verify your understanding.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id || idx}
              className={cn("flex flex-col animate-in fade-in duration-300", isUser ? "items-end" : "items-start")}
            >
              {/* Message Meta Header */}
              <div className="flex items-center gap-2 mb-1.5 px-1 flex-wrap text-xs">
                {!isUser ? (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-[#174B39]">Dr. Aarav Mehta</span>
                    <span className="text-[10px] text-[#69756B]">· Principal Mentor</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#69756B]" />
                    <span className="font-semibold text-[#17211E]">You</span>
                  </div>
                )}

                {msg.specialistCapability && (
                  <span className="text-[10px] font-semibold bg-[#E7F2DA] text-[#174B39] border border-[#DCE5D5] px-2 py-0.5 rounded-full">
                    {msg.specialistCapability.badge}
                  </span>
                )}

                {msg.inferenceMode && (
                  <span className="text-[9px] font-mono uppercase tracking-wider text-[#69756B] bg-[#EDF3E8] px-1.5 py-0.5 rounded">
                    {msg.inferenceMode}
                  </span>
                )}

                {msg.latencyMs && (
                  <span className="text-[10px] font-mono text-[#27875E]">
                    {msg.latencyMs}ms
                  </span>
                )}

                <span className="text-[10px] text-[#69756B]">{msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={cn(
                  "relative max-w-2xl sm:max-w-3xl rounded-3xl p-4 sm:p-5 shadow-sm text-sm",
                  isUser
                    ? "bg-[#174B39] text-white rounded-tr-sm"
                    : "bg-white/90 border border-[#DCE5D5] text-[#17211E] rounded-tl-sm shadow-md"
                )}
              >
                {/* Content Rendering */}
                {isUser ? (
                  <div className="whitespace-pre-wrap font-sans leading-relaxed">{msg.content}</div>
                ) : (
                  <FormattedContent content={msg.content} />
                )}

                {/* POST-INTERACTION LEARNING CHECK */}
                {msg.postInteractionCheck && (
                  <div className="mt-4 p-4 rounded-2xl bg-[#FAFAF2] border-2 border-[#27875E]/30 shadow-xs text-xs text-[#17211E]">
                    <div className="flex items-center gap-2 text-[#174B39] font-bold mb-2">
                      <Lightbulb className="w-4 h-4 text-[#27875E]" />
                      <span>Concept Verification Check</span>
                    </div>
                    <p className="font-semibold mb-3 text-sm">{msg.postInteractionCheck.question}</p>
                    <div className="space-y-1.5">
                      {msg.postInteractionCheck.options.map((opt, oIdx) => {
                        const checkKey = `${msg.id || idx}-check`;
                        const selected = answeredChecks[checkKey];
                        const isAnswered = selected !== undefined;
                        const isCorrect = oIdx === msg.postInteractionCheck!.correctOptionIndex;
                        const isChosen = selected === oIdx;

                        let btnStyle = "bg-white hover:bg-[#EDF3E8] text-[#17211E] border-[#DCE5D5]";
                        if (isAnswered) {
                          if (isCorrect) {
                            btnStyle = "bg-[#E7F2DA] border-[#27875E] text-[#174B39] font-bold";
                          } else if (isChosen && !isCorrect) {
                            btnStyle = "bg-red-50 border-red-300 text-red-800 line-through";
                          } else {
                            btnStyle = "opacity-50 border-[#DCE5D5] bg-slate-50";
                          }
                        }

                        return (
                          <button
                            key={oIdx}
                            disabled={isAnswered}
                            onClick={() =>
                              setAnsweredChecks((prev) => ({ ...prev, [checkKey]: oIdx }))
                            }
                            className={cn(
                              "w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between",
                              btnStyle
                            )}
                          >
                            <span>{opt}</span>
                            {isAnswered && isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-[#27875E] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {answeredChecks[`${msg.id || idx}-check`] !== undefined && (
                      <div className="mt-3 pt-2.5 border-t border-[#EDF3E8] text-xs text-[#69756B]">
                        <p className="font-bold text-[#174B39] mb-0.5">Pedagogical Explanation:</p>
                        <p>{msg.postInteractionCheck.explanation}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* RECOMMENDED ACTIONS */}
                {msg.recommendedActions && msg.recommendedActions.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#EDF3E8]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#69756B] block mb-2">
                      Suggested Next Steps
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {msg.recommendedActions.map((action, aIdx) => (
                        <button
                          key={action.id || aIdx}
                          type="button"
                          onClick={() => onSendMessage(action.title)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EDF3E8] hover:bg-[#E7F2DA] border border-[#DCE5D5] rounded-xl text-xs font-semibold text-[#174B39] transition-all"
                        >
                          <span>{action.title}</span>
                          <ArrowRight className="w-3 h-3 text-[#27875E]" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* CITATIONS ACCORDION */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#EDF3E8]">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenSourcesMsgId(openSourcesMsgId === msg.id ? null : msg.id)
                      }
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#27875E] hover:text-[#174B39] transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{msg.sources.length} Verified Sources Cited</span>
                      <ChevronDown
                        className={cn("w-3 h-3 transition-transform", openSourcesMsgId === msg.id && "rotate-180")}
                      />
                    </button>

                    {openSourcesMsgId === msg.id && (
                      <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-[#27875E]">
                        {msg.sources.map((src, sIdx) => (
                          <div key={sIdx} className="text-[11px] text-[#69756B]">
                            <span className="font-semibold text-[#17211E]">{src.sourceTitle}</span>
                            <span className="mx-1">•</span>
                            <span>{src.publisher}</span>
                            {src.urlOrId && (
                              <span className="ml-1 text-[#27875E] font-mono text-[10px]">
                                ({src.urlOrId})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* MENTOR TOOLBAR (Copy, Read Aloud, Save Note, Regenerate) */}
                {!isUser && (
                  <div className="mt-3 pt-2 border-t border-[#EDF3E8] flex items-center justify-between text-xs text-[#69756B]">
                    <div className="flex items-center gap-3">
                      {/* Copy */}
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.content, idx)}
                        className="hover:text-[#174B39] flex items-center gap-1 transition-colors"
                        title="Copy message"
                      >
                        {copiedMsgIdx === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#27875E]" />
                            <span className="text-[#27875E]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {/* Text-to-Speech */}
                      <button
                        type="button"
                        onClick={() => handleToggleSpeak(msg.content, idx)}
                        className="hover:text-[#174B39] flex items-center gap-1 transition-colors"
                        title="Read aloud"
                      >
                        {speakingMsgIdx === idx ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-[#27875E] animate-pulse" />
                            <span className="text-[#27875E]">Mute</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Speak</span>
                          </>
                        )}
                      </button>

                      {/* Save Note */}
                      <button
                        type="button"
                        onClick={() => onSaveNote?.(msg.id || String(idx), msg.content)}
                        className="hover:text-[#174B39] flex items-center gap-1 transition-colors"
                        title="Save to student memory"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>Save Note</span>
                      </button>
                    </div>

                    {/* Regenerate if last message */}
                    {idx === messages.length - 1 && onRegenerateResponse && (
                      <button
                        type="button"
                        onClick={() => onRegenerateResponse(idx - 1)}
                        className="hover:text-[#174B39] flex items-center gap-1 text-[11px] transition-colors"
                        title="Regenerate mentor response"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Regenerate</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Streaming In-Progress Indicator */}
        {isStreaming && (
          <div className="flex items-start gap-2 animate-in fade-in duration-200">
            <div className="w-6 h-6 rounded-full bg-[#E7F2DA] text-[#174B39] flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl bg-white/80 border border-[#DCE5D5] shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#27875E] animate-ping" />
              <span className="text-xs text-[#69756B] font-medium">
                Dr. Aarav Mehta is formulating response...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. DOCKED BOTTOM COMPOSER */}
      <footer className="shrink-0 p-3 sm:p-4 bg-transparent">
        <AIMentorComposer
          onSendMessage={onSendMessage}
          isStreaming={isStreaming}
          onStopGeneration={onStopGeneration}
          currentFocusArea={currentFocusArea}
          onFocusAreaChange={onFocusAreaChange}
          currentLanguage={currentLanguage}
          onLanguageChange={onLanguageChange}
          variant="docked"
        />
      </footer>
    </div>
  );
}

