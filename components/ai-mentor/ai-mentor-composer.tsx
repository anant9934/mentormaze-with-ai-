"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowUp,
  Square,
  Paperclip,
  Mic,
  MicOff,
  ChevronDown,
  Sparkles,
  X,
  FileCode,
  Globe,
  SlidersHorizontal,
} from "lucide-react";
import { FocusArea, LanguageCode } from "@/lib/ai-mentor/types";
import { FOCUS_AREAS_CONFIG, FocusAreaDef } from "./ai-mentor-types";
import { cn } from "@/lib/utils";

interface AIMentorComposerProps {
  onSendMessage: (content: string, options?: { focusArea?: FocusArea; language?: LanguageCode; attachments?: string[] }) => void;
  isStreaming?: boolean;
  onStopGeneration?: () => void;
  currentFocusArea?: FocusArea;
  onFocusAreaChange?: (focusArea: FocusArea) => void;
  currentLanguage?: LanguageCode;
  onLanguageChange?: (language: LanguageCode) => void;
  placeholder?: string;
  className?: string;
  initialValue?: string;
  variant?: "floating" | "docked";
}

export function AIMentorComposer({
  onSendMessage,
  isStreaming = false,
  onStopGeneration,
  currentFocusArea = "learn",
  onFocusAreaChange,
  currentLanguage = "en",
  onLanguageChange,
  placeholder,
  className,
  initialValue = "",
  variant = "floating",
}: AIMentorComposerProps) {
  const [text, setText] = useState(initialValue);
  const [isListening, setIsListening] = useState(false);
  const [showFocusDropdown, setShowFocusDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [attachedSnippet, setAttachedSnippet] = useState<string | null>(null);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Web Speech recognition ref
  const recognitionRef = useRef<any>(null);

  // Sync initialValue when changed externally (e.g. from suggestion chip)
  useEffect(() => {
    if (initialValue) {
      setText(initialValue);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [initialValue]);

  // Auto-resize textarea height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxHeight = variant === "docked" ? 180 : 220;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [text, variant]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFocusDropdown(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Web Speech API initialization
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = currentLanguage === "hi" ? "hi-IN" : "en-US";

        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [currentLanguage]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
  }, [isListening]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && !attachedSnippet) return;
    if (isStreaming) {
      onStopGeneration?.();
      return;
    }

    let finalMessage = trimmed;
    if (attachedSnippet) {
      finalMessage = `${trimmed ? `${trimmed}\n\n` : ""}Attached Context (${attachedFileName || "code/document"}):\n\`\`\`\n${attachedSnippet}\n\`\`\``;
    }

    onSendMessage(finalMessage, {
      focusArea: currentFocusArea,
      language: currentLanguage,
      attachments: attachedSnippet ? [attachedSnippet] : undefined,
    });

    setText("");
    setAttachedSnippet(null);
    setAttachedFileName(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [text, attachedSnippet, attachedFileName, isStreaming, onStopGeneration, onSendMessage, currentFocusArea, currentLanguage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File size exceeds 2MB limit for prompt context.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setAttachedSnippet(content);
      setAttachedFileName(file.name);
    };
    reader.readAsText(file);
    // Reset file input value so same file can be selected again
    e.target.value = "";
  };

  const selectedFocusDef = FOCUS_AREAS_CONFIG.find((f) => f.id === currentFocusArea) || FOCUS_AREAS_CONFIG[0];
  const dynamicPlaceholder =
    placeholder ||
    selectedFocusDef?.placeholder ||
    "Ask Dr. Aarav Mehta anything — conceptual questions, code review, system design, or career roadmap...";

  return (
    <div
      className={cn(
        "relative w-full transition-all duration-300",
        variant === "floating"
          ? "bg-white/90 backdrop-blur-xl border border-[#DCE5D5] shadow-xl hover:shadow-2xl rounded-3xl p-3 sm:p-4 ring-1 ring-[#174B39]/5"
          : "bg-white/95 backdrop-blur-xl border border-[#DCE5D5] shadow-lg rounded-2xl p-2.5 sm:p-3",
        className
      )}
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".txt,.md,.js,.ts,.tsx,.jsx,.py,.java,.cpp,.c,.go,.rs,.sql,.json,.yaml,.html,.css"
      />

      {/* Attachment Tag Preview */}
      {attachedSnippet && (
        <div className="mb-2 flex items-center justify-between px-3 py-1.5 bg-[#EDF3E8] border border-[#DCE5D5] rounded-xl text-xs text-[#174B39]">
          <div className="flex items-center gap-1.5 truncate">
            <FileCode className="w-3.5 h-3.5 text-[#27875E] shrink-0" />
            <span className="font-semibold truncate">{attachedFileName || "Context snippet"}</span>
            <span className="text-[#69756B]">({(attachedSnippet.length / 1024).toFixed(1)} KB)</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setAttachedSnippet(null);
              setAttachedFileName(null);
            }}
            className="p-1 hover:bg-white rounded-lg text-[#69756B] hover:text-red-600 transition-colors"
            title="Remove attachment"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Textarea Input */}
      <div className="relative w-full">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={dynamicPlaceholder}
          rows={variant === "floating" ? 3 : 2}
          className="w-full bg-transparent resize-none border-0 text-[#17211E] placeholder:text-[#69756B]/70 focus:outline-none focus:ring-0 text-sm sm:text-base leading-relaxed px-2 py-1 max-h-[220px]"
          disabled={isStreaming}
        />
      </div>

      {/* Bottom Controls Bar */}
      <div className="mt-2 pt-2 border-t border-[#EDF3E8] flex flex-wrap items-center justify-between gap-2 px-1">
        {/* Left Controls: Focus Area & Language */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Focus Area Pill */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowFocusDropdown(!showFocusDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#EDF3E8] hover:bg-[#E7F2DA] border border-[#DCE5D5] text-xs font-semibold text-[#174B39] transition-all"
              title="Select specialist focus capability"
            >
              <Sparkles className="w-3 h-3 text-[#27875E]" />
              <span className="max-w-[120px] sm:max-w-none truncate">{selectedFocusDef.label}</span>
              <ChevronDown className={cn("w-3 h-3 text-[#69756B] transition-transform", showFocusDropdown && "rotate-180")} />
            </button>

            {/* Dropdown Menu */}
            {showFocusDropdown && (
              <div className="absolute left-0 bottom-full mb-2 w-64 sm:w-72 bg-white rounded-2xl shadow-2xl border border-[#DCE5D5] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-[#EDF3E8] flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#69756B]">
                    Specialist Focus Area
                  </span>
                  <span className="text-[10px] text-[#27875E] bg-[#E7F2DA] px-1.5 py-0.5 rounded-full font-medium">
                    Dr. Aarav Mehta
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto p-1 space-y-0.5">
                  {FOCUS_AREAS_CONFIG.map((focus) => (
                    <button
                      key={focus.id}
                      type="button"
                      onClick={() => {
                        onFocusAreaChange?.(focus.id);
                        setShowFocusDropdown(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl text-xs flex flex-col gap-0.5 transition-colors",
                        currentFocusArea === focus.id
                          ? "bg-[#E7F2DA] text-[#174B39] font-semibold"
                          : "hover:bg-[#EDF3E8] text-[#17211E]"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span>{focus.label}</span>
                        <span className="text-[10px] text-[#69756B]">{focus.badge}</span>
                      </div>
                      <p className="text-[11px] text-[#69756B] line-clamp-1">{focus.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Language Selector */}
          <div className="relative" ref={langDropdownRef}>
            <button
              type="button"
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-transparent hover:bg-[#EDF3E8] text-xs text-[#69756B] hover:text-[#174B39] transition-all"
              title="Response language"
            >
              <Globe className="w-3 h-3" />
              <span className="uppercase font-semibold tracking-wider text-[11px]">
                {currentLanguage === "hi" ? "हिन्दी" : currentLanguage === "hinglish" ? "Hinglish" : "EN"}
              </span>
            </button>

            {showLanguageDropdown && (
              <div className="absolute left-0 bottom-full mb-2 w-36 bg-white rounded-xl shadow-xl border border-[#DCE5D5] py-1 z-50">
                <button
                  type="button"
                  onClick={() => {
                    onLanguageChange?.("en");
                    setShowLanguageDropdown(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-xs transition-colors",
                    currentLanguage === "en" ? "bg-[#E7F2DA] font-semibold text-[#174B39]" : "hover:bg-[#EDF3E8] text-[#17211E]"
                  )}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLanguageChange?.("hi");
                    setShowLanguageDropdown(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-xs transition-colors",
                    currentLanguage === "hi" ? "bg-[#E7F2DA] font-semibold text-[#174B39]" : "hover:bg-[#EDF3E8] text-[#17211E]"
                  )}
                >
                  हिन्दी (Hindi)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLanguageChange?.("hinglish");
                    setShowLanguageDropdown(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-xs transition-colors",
                    currentLanguage === "hinglish" ? "bg-[#E7F2DA] font-semibold text-[#174B39]" : "hover:bg-[#EDF3E8] text-[#17211E]"
                  )}
                >
                  Hinglish (Mix)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Controls: Attach, Mic, Send */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Attach Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl text-[#69756B] hover:text-[#174B39] hover:bg-[#EDF3E8] transition-all"
            title="Attach code snippet or text file (max 2MB)"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Dictation Mic */}
          <button
            type="button"
            onClick={toggleListening}
            className={cn(
              "p-2 rounded-xl transition-all",
              isListening
                ? "bg-red-50 text-red-600 animate-pulse ring-2 ring-red-400"
                : "text-[#69756B] hover:text-[#174B39] hover:bg-[#EDF3E8]"
            )}
            title={isListening ? "Listening... click to stop" : "Voice dictation"}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Send or Stop Generation Button */}
          {isStreaming ? (
            <button
              type="button"
              onClick={onStopGeneration}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all animate-pulse"
              title="Stop generating"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!text.trim() && !attachedSnippet}
              className={cn(
                "p-2.5 rounded-xl flex items-center justify-center transition-all shadow-md",
                text.trim() || attachedSnippet
                  ? "bg-[#174B39] hover:bg-[#123B2E] text-white hover:scale-105 active:scale-95"
                  : "bg-[#DCE5D5] text-[#69756B] cursor-not-allowed opacity-60"
              )}
              title="Send message (Enter)"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

