"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/lib/auth/context";
import {
  TeachingMode,
  LanguageCode,
  SourceCitation,
  RecommendedAction,
  SkillUpdate,
  EscalationRecommendation,
} from "@/lib/ai-mentor/types";
import {
  Bot,
  Mic,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Code2,
  FileText,
  Calendar,
  Zap,
  Play,
  RotateCcw,
  Check,
  Copy,
  Lightbulb,
  BookOpen,
  BrainCircuit,
  Briefcase,
  Layers,
  HelpCircle,
  AlertTriangle,
  Award,
  ChevronRight,
  Compass,
  Square,
  Bookmark,
  Share2,
  ThumbsUp,
  ThumbsDown,
  UserCheck,
  Globe,
  Settings,
  Database,
  Search,
  ExternalLink,
  MessageSquare,
  Plus,
  Trash2,
  Info,
  CheckSquare,
  XSquare,
  Clock,
  Shield,
} from "lucide-react";

interface PostInteractionCheck {
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "mentor";
  content: string;
  timestamp: string;
  teachingStrategy?: string;
  sources?: SourceCitation[];
  recommendedActions?: RecommendedAction[];
  skillUpdates?: SkillUpdate[];
  escalation?: EscalationRecommendation;
  latencyMs?: number;
  modelProvider?: string;
  inferenceMode?: "generative" | "deterministic";
  requestId?: string;
  tokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  estimatedCostUsd?: number;
  fallbackReason?: string;
  postInteractionCheck?: PostInteractionCheck;
  savedNote?: boolean;
}

interface StudentMemoryItem {
  id: string;
  category: string;
  key: string;
  value: string;
  confidence?: number;
  studentConfirmed?: boolean;
  isTemporary?: boolean;
  source?: string;
}

interface StudentSkillItem {
  skillId: string;
  skillName: string;
  masteryState: string;
  masteryScore: number;
}

interface ConversationSummary {
  id: string;
  title: string;
  mode: TeachingMode;
  updatedAt: string;
  createdAt: string;
}

const TEACHING_MODES: { id: TeachingMode; label: string; icon: any; description: string }[] = [
  { id: "learn", label: "Learn", icon: BookOpen, description: "Master technical concepts from first principles" },
  { id: "practice", label: "Practice", icon: Zap, description: "Active recall, quizzes, and Socratic discovery" },
  { id: "code_mentor", label: "Code Mentor", icon: Code2, description: "Debug, review, explain, and optimize code" },
  { id: "career_mentor", label: "Career Mentor", icon: Compass, description: "Strategic career direction & 6-month roadmaps" },
  { id: "resume_mentor", label: "Resume Mentor", icon: FileText, description: "Google XYZ formula analysis against real JDs" },
  { id: "interview_coach", label: "Interview Coach", icon: Briefcase, description: "FAANG rubrics and behavioral STAR preparation" },
  { id: "project_mentor", label: "Project Mentor", icon: Layers, description: "Distributed architecture & system design" },
  { id: "study_planner", label: "Study Planner", icon: Calendar, description: "24-week personalized milestone schedule" },
];

export default function AIMentorPage() {
  const { user } = useAuth();
  const studentUserId = user?.id || "usr-student-1";
  const studentName = user?.displayName || "Anant Kumar";

  const [activeMode, setActiveMode] = useState<TeachingMode>("learn");
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "skills" | "memory" | "resume_jd" | "code_lab">("chat");

  // Server-side conversation list state
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auxiliary context state
  const [skills, setSkills] = useState<StudentSkillItem[]>([]);
  const [memories, setMemories] = useState<StudentMemoryItem[]>([]);
  const [weakSkills, setWeakSkills] = useState<string[]>(["Dynamic Programming", "Distributed Consensus (Raft)", "Kafka Partitions"]);
  const [scratchCode, setScratchCode] = useState(`// Scratch Code Lab: Paste snippet to debug or review\nfunction twoSum(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (seen.has(complement)) {\n      return [seen.get(complement), i];\n    }\n    seen.set(nums[i], i);\n  }\n  return [];\n}`);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [resumeText, setResumeText] = useState("Software Engineer Intern | Built real-time WebRTC collaboration tool and Redis cache for 10k users. Worked on optimizing database queries.");
  const [escalationData, setEscalationData] = useState<EscalationRecommendation | null>(null);
  const [answeredChecks, setAnsweredChecks] = useState<Record<string, number>>({});

  // New Memory Input
  const [newMemoryKey, setNewMemoryKey] = useState("");
  const [newMemoryVal, setNewMemoryVal] = useState("");
  const [newMemoryCat, setNewMemoryCat] = useState("learning_preferences");

  const speechRecognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 1. Fetch Conversations, Skills, and Memories on mount
  useEffect(() => {
    loadConversations();
    loadSkills();
    loadMemories();
  }, [studentUserId]);

  const loadSkills = async () => {
    try {
      const r = await fetch(`/api/ai-mentor/skills?userId=${studentUserId}`);
      const d = await r.json();
      if (d.success && d.skills) {
        setSkills(d.skills);
      }
    } catch (e) {
      console.warn("Failed to load skills", e);
    }
  };

  const loadMemories = async () => {
    try {
      const r = await fetch(`/api/ai-mentor/memory?userId=${studentUserId}`);
      const d = await r.json();
      if (d.success && d.memories) {
        setMemories(d.memories);
      }
    } catch (e) {
      console.warn("Failed to load memories", e);
    }
  };

  const loadConversations = async () => {
    try {
      const res = await fetch(`/api/ai-mentor/conversations?userId=${studentUserId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.conversations) && data.conversations.length > 0) {
        setConversations(data.conversations);
        // Load the first conversation if none active
        if (!activeConversationId) {
          switchConversation(data.conversations[0].id);
        }
      } else {
        // Create initial default conversation
        handleCreateNewConversation("Initial Mentorship Session", activeMode);
      }
    } catch (err) {
      console.warn("Failed to load conversations from server:", err);
      // Fallback welcome message
      setupDefaultWelcome();
    }
  };

  const setupDefaultWelcome = () => {
    setMessages([
      {
        id: "msg-welcome-0",
        sender: "mentor",
        content: `### 👋 Namaste ${studentName}! Welcome to MentorMaze AI Mentor\n\nI am your personalized AI engineering & placement mentor, backed by verified computer science curricula, real SDE job descriptions, and human mentorship insights.\n\n**Select a mode above or ask any question:**\n- 📚 **Learn**: Break down complex concepts with intuitive mental models.\n- 💡 **Practice**: Solve algorithmic problems with guided Socratic hints.\n- 🔍 **Code Mentor**: Optimize your code and discover hidden $O(N^2)$ traps.\n- 📄 **Resume Mentor**: Align your bullets with the Google XYZ formula.\n- 🎙️ **Interview Coach**: Timed mock interviews evaluated on FAANG staff rubrics.\n\n*What would you like to focus on today?*`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        teachingStrategy: "conceptual_explanation",
        sources: [],
        recommendedActions: [
          { id: "act-init-dsa", title: "Practice Two Pointers on LeetCode #1", category: "DSA", priority: "high" },
          { id: "act-init-roadmap", title: "Review 24-week engineering placement roadmap", category: "Career", priority: "medium" },
        ],
        modelProvider: "tathastu-pedagogy-v1",
        inferenceMode: "deterministic",
        requestId: `req-init-${Date.now()}`,
      },
    ]);
  };

  const switchConversation = async (convId: string) => {
    setActiveConversationId(convId);
    try {
      const res = await fetch(`/api/ai-mentor/conversations/${convId}?userId=${studentUserId}`);
      const data = await res.json();
      if (data.success && data.conversation) {
        setActiveMode(data.conversation.mode || "learn");
        if (data.messages && data.messages.length > 0) {
          const loaded: ChatMessage[] = data.messages.map((m: any) => ({
            id: m.id,
            sender: m.role === "user" ? "user" : "mentor",
            content: m.content,
            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            teachingStrategy: m.metadata?.teachingStrategy,
            sources: m.metadata?.sources,
            recommendedActions: m.metadata?.recommendedActions,
            skillUpdates: m.metadata?.skillUpdates,
            escalation: m.metadata?.escalationRecommendation,
            latencyMs: m.metadata?.latencyMs,
            modelProvider: m.metadata?.modelProvider || "tathastu-pedagogy-v1",
            inferenceMode: m.metadata?.inferenceMode || "deterministic",
            requestId: m.metadata?.requestId,
            tokenUsage: m.metadata?.tokenUsage,
            estimatedCostUsd: m.metadata?.estimatedCostUsd,
            fallbackReason: m.metadata?.fallbackReason,
            postInteractionCheck: m.metadata?.postInteractionCheck,
          }));
          setMessages(loaded);
        } else {
          setupDefaultWelcome();
        }
      }
    } catch (e) {
      console.warn("Error switching conversation", e);
    }
  };

  const handleCreateNewConversation = async (title?: string, mode?: TeachingMode) => {
    try {
      const res = await fetch("/api/ai-mentor/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: studentUserId,
          title: title || `Mentorship on ${activeMode.toUpperCase()}`,
          mode: mode || activeMode,
        }),
      });
      const data = await res.json();
      if (data.success && data.conversation) {
        setConversations((prev) => [data.conversation, ...prev]);
        setActiveConversationId(data.conversation.id);
        setupDefaultWelcome();
      }
    } catch (e) {
      console.warn("Failed to create conversation", e);
    }
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this conversation?")) return;
    try {
      const res = await fetch(`/api/ai-mentor/conversations/${convId}?userId=${studentUserId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setConversations((prev) => prev.filter((c) => c.id !== convId));
        if (activeConversationId === convId) {
          const remaining = conversations.filter((c) => c.id !== convId);
          if (remaining.length > 0) {
            switchConversation(remaining[0].id);
          } else {
            handleCreateNewConversation("New Mentorship Session", activeMode);
          }
        }
      }
    } catch (e) {
      console.warn("Failed to delete conversation", e);
    }
  };

  // Scroll to bottom on new messages or generation updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // Voice speech synthesis
  const speakText = (text: string) => {
    if (!isVoiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const cleanSpeech = text
      .replace(/[*#_`~\[\]]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanSpeech) return;

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 1.0;
    utterance.pitch = 1.02;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha"))
    );
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const toggleVoiceRecognition = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    if (isListening) {
      if (speechRecognitionRef.current) speechRecognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === "hi" ? "hi-IN" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsListening(false);
      dispatchTurn(transcript, activeMode);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    speechRecognitionRef.current = recognition;
    recognition.start();
  };

  // Stop Generation Handler
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Memory operations
  const handleConfirmMemory = async (id: string) => {
    try {
      const res = await fetch("/api/ai-mentor/memory", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-mentormaze-user-id": studentUserId,
        },
        body: JSON.stringify({ userId: studentUserId, memoryId: id }),
      });
      const d = await res.json();
      if (d.success) {
        setMemories((prev) =>
          prev.map((m) => (m.id === id ? { ...m, studentConfirmed: true } : m))
        );
      }
    } catch (e) {
      console.warn("Failed to confirm memory", e);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      const res = await fetch(`/api/ai-mentor/memory?userId=${studentUserId}&id=${id}`, {
        method: "DELETE",
        headers: { "x-mentormaze-user-id": studentUserId },
      });
      const d = await res.json();
      if (d.success) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (e) {
      console.warn("Failed to delete memory", e);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryKey.trim() || !newMemoryVal.trim()) return;
    try {
      const res = await fetch("/api/ai-mentor/memory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-mentormaze-user-id": studentUserId,
        },
        body: JSON.stringify({
          userId: studentUserId,
          category: newMemoryCat,
          key: newMemoryKey,
          value: newMemoryVal,
          source: "user_explicit",
          confidence: 1.0,
          studentConfirmed: true,
        }),
      });
      const d = await res.json();
      if (d.success && d.memory) {
        setMemories((prev) => [d.memory, ...prev]);
        setNewMemoryKey("");
        setNewMemoryVal("");
      }
    } catch (e) {
      console.warn("Failed to add memory", e);
    }
  };

  // Dispatch turn to backend orchestrator with SSE Streaming & AbortController
  const dispatchTurn = async (userMsg: string, modeToUse: TeachingMode, codeToAttach?: string) => {
    if (!userMsg.trim() || isGenerating) return;

    const userMessageObj: ChatMessage = {
      id: `msg-u-${Date.now()}`,
      sender: "user",
      content: userMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessageObj]);
    setInputText("");
    setIsGenerating(true);

    const mentorTempId = `msg-m-${Date.now()}`;
    const initialMentorMessage: ChatMessage = {
      id: mentorTempId,
      sender: "mentor",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      modelProvider: "tathastu-pedagogy-v1",
      inferenceMode: "deterministic",
    };

    setMessages((prev) => [...prev, initialMentorMessage]);

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
          studentUserId,
          conversationId: activeConversationId,
          userMessage: userMsg,
          mode: modeToUse,
          languagePreference: language,
          codeSnippet: codeToAttach || (activeMode === "code_mentor" ? scratchCode : undefined),
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
          } catch (e) {
            // Partial JSON buffer parse guard
          }
        }
      }

      setIsGenerating(false);
      abortControllerRef.current = null;

      if (metadataReceived) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === mentorTempId
              ? {
                  ...msg,
                  content: accumulatedContent,
                  teachingStrategy: metadataReceived.teachingStrategy,
                  sources: metadataReceived.sources,
                  recommendedActions: metadataReceived.recommendedActions,
                  skillUpdates: metadataReceived.skillUpdates,
                  escalation: metadataReceived.escalationRecommendation,
                  latencyMs: metadataReceived.latencyMs,
                  modelProvider: metadataReceived.modelProvider || "tathastu-pedagogy-v1",
                  inferenceMode: metadataReceived.inferenceMode || "deterministic",
                  requestId: metadataReceived.requestId,
                  tokenUsage: metadataReceived.tokenUsage,
                  estimatedCostUsd: metadataReceived.estimatedCostUsd,
                  fallbackReason: metadataReceived.fallbackReason,
                  postInteractionCheck: metadataReceived.postInteractionCheck,
                }
              : msg
          )
        );

        if (metadataReceived.escalationRecommendation?.shouldEscalate) {
          setEscalationData(metadataReceived.escalationRecommendation);
        }

        if (metadataReceived.skillUpdates && metadataReceived.skillUpdates.length > 0) {
          setSkills((prev) => {
            const updated = [...prev];
            metadataReceived.skillUpdates.forEach((u: SkillUpdate) => {
              const idx = updated.findIndex((s) => s.skillId === u.skillId);
              if (idx >= 0) {
                updated[idx].masteryState = u.newState;
                updated[idx].masteryScore = u.score;
              } else {
                updated.push({
                  skillId: u.skillId,
                  skillName: u.skillName,
                  masteryState: u.newState,
                  masteryScore: u.score,
                });
              }
            });
            return updated;
          });
        }

        speakText(metadataReceived.voiceText || accumulatedContent.slice(0, 200));
      }

      // Refresh conversation list to show updated timestamps
      fetch(`/api/ai-mentor/conversations?userId=${studentUserId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.conversations) setConversations(d.conversations);
        })
        .catch(() => {});
    } catch (err: any) {
      setIsGenerating(false);
      abortControllerRef.current = null;

      if (err.name === "AbortError") {
        // Preserved partially streamed text on stop
        console.log("Generation cleanly cancelled by user.");
      } else {
        console.error("AI Mentor stream error:", err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === mentorTempId
              ? {
                  ...msg,
                  content:
                    msg.content ||
                    "⚠️ Notice: The connection to the inference pipeline was interrupted. Please retry or check your network.",
                }
              : msg
          )
        );
      }
    }
  };

  const handleCopyMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSaveNote = (msgIndex: number) => {
    setMessages((prev) => {
      const updated = [...prev];
      updated[msgIndex].savedNote = !updated[msgIndex].savedNote;
      return updated;
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF8F1] text-[#17211E] font-sans">
      <Navbar />

      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TOP STATUS BAR */}
        <div className="bg-[#123B2E] text-white rounded-2xl p-5 mb-4 shadow-xl border border-[#174B39] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-400 shadow-md flex-shrink-0">
              <Image
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                alt="Dr. Aarav Mehta"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-[#EDF1E8]">Dr. Aarav Mehta</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Principal Mentor
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>24/7 AI Intelligence</span>
                </span>
              </div>
              <p className="text-xs text-[#DDE6D7]/80 mt-0.5">
                Staff Software Architect & Placement Strategist · MentorMaze by AI Tathastu
              </p>
            </div>
          </div>

          {/* Language & Voice Controls */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            {/* Conversation Drawer Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="px-3 py-1.5 rounded-xl bg-[#174B39] hover:bg-[#21634A] border border-[#21634A] text-xs font-semibold text-[#DDE6D7] hover:text-white flex items-center gap-1.5 transition-all shadow-sm"
              title="Toggle Saved Conversations"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
              <span>Sessions ({conversations.length})</span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center bg-[#174B39] rounded-xl p-1 border border-[#21634A]">
              <button
                onClick={() => setLanguage("en")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  language === "en" ? "bg-[#123B2E] text-white shadow" : "text-[#DDE6D7] hover:text-white"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage("hinglish")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  language === "hinglish" ? "bg-[#123B2E] text-white shadow" : "text-[#DDE6D7] hover:text-white"
                }`}
              >
                Hinglish
              </button>
              <button
                onClick={() => setLanguage("hi")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  language === "hi" ? "bg-[#123B2E] text-white shadow" : "text-[#DDE6D7] hover:text-white"
                }`}
              >
                हिन्दी
              </button>
            </div>

            {/* Voice Read-aloud Toggle */}
            <button
              onClick={() => {
                if (isVoiceEnabled && isSpeaking) window.speechSynthesis.cancel();
                setIsVoiceEnabled(!isVoiceEnabled);
              }}
              className={`p-2.5 rounded-xl border transition-all ${
                isVoiceEnabled
                  ? "bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-700/30"
                  : "bg-[#174B39] border-[#21634A] text-gray-400"
              }`}
              title={isVoiceEnabled ? "Voice Output Active (Click to mute)" : "Voice Muted"}
            >
              {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* INFERENCE TRANSPARENCY NOTICE BANNER */}
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl px-4 py-2.5 mb-4 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>System Status:</strong> Primary router running on{" "}
              <span className="font-mono font-bold">tathastu-pedagogy-v1 (Deterministic Core)</span>. Zero-hallucination guardrails active. For live generative inference, configure <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px]">GEMINI_API_KEY</code> or <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px]">OPENAI_API_KEY</code> in server settings.
            </span>
          </div>
          <Link
            href="/admin/ai-mentor"
            className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline flex-shrink-0 ml-3"
          >
            Admin Observability →
          </Link>
        </div>

        {/* 8 TEACHING MODES SELECTOR STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
          {TEACHING_MODES.map((m) => {
            const Icon = m.icon;
            const isSelected = activeMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setActiveMode(m.id);
                  if (activeTab !== "chat") setActiveTab("chat");
                }}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#123B2E] text-white border-[#123B2E] shadow-md shadow-[#123B2E]/10"
                    : "bg-white text-[#46514B] border-[#DED2BF] hover:border-[#123B2E]/40 hover:bg-[#F4EFE4]/30"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Icon className={`w-4 h-4 ${isSelected ? "text-emerald-400" : "text-[#123B2E]"}`} />
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </div>
                <div>
                  <p className="font-bold text-xs">{m.label}</p>
                  <p className={`text-[10px] truncate ${isSelected ? "text-[#DDE6D7]/80" : "text-gray-500"}`}>
                    {m.description.slice(0, 22)}...
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* MAIN WORKSPACE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
          {/* CONVERSATION DRAWER (IF OPEN) OR HIDDEN */}
          {isSidebarOpen && (
            <div className="lg:col-span-1 bg-white rounded-2xl border border-[#DED2BF] p-4 shadow-sm flex flex-col max-h-[720px]">
              <div className="flex items-center justify-between pb-3 border-b border-[#DED2BF] mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#123B2E]" />
                  <span className="font-bold text-xs text-[#123B2E]">Saved Sessions</span>
                </div>
                <button
                  onClick={() => handleCreateNewConversation("New Mentorship Session", activeMode)}
                  className="px-2 py-1 rounded bg-[#123B2E] text-white text-[10px] font-bold flex items-center gap-1 hover:bg-[#174B39]"
                  title="Create new conversation"
                >
                  <Plus className="w-3 h-3" />
                  <span>New</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5">
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => switchConversation(c.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      activeConversationId === c.id
                        ? "bg-[#123B2E] text-white border-[#123B2E]"
                        : "bg-[#FBF8F1] hover:bg-[#F4EFE4] text-[#17211E] border-[#DED2BF]"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <p className="font-semibold truncate text-[11px]">{c.title}</p>
                      <span
                        className={`text-[9px] uppercase font-mono px-1.5 py-0.2 rounded ${
                          activeConversationId === c.id ? "bg-emerald-800 text-emerald-200" : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {c.mode}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(c.id, e)}
                      className={`p-1 rounded hover:bg-red-500/20 text-red-500 transition-all ${
                        activeConversationId === c.id ? "hover:text-red-200 text-red-300" : ""
                      }`}
                      title="Delete session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LEFT 3 COLS (OR 2 IF SIDEBAR OPEN): WORKSPACE TABS */}
          <div className={`${isSidebarOpen ? "lg:col-span-2" : "lg:col-span-3"} bg-white rounded-2xl border border-[#DED2BF] shadow-sm flex flex-col overflow-hidden`}>
            {/* WORKSPACE SUB-NAVBAR */}
            <div className="px-5 py-3 border-b border-[#DED2BF] bg-[#F4EFE4]/40 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "chat" ? "bg-[#123B2E] text-white" : "text-[#46514B] hover:text-[#123B2E]"
                  }`}
                >
                  Conversation
                </button>
                <button
                  onClick={() => setActiveTab("skills")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "skills" ? "bg-[#123B2E] text-white" : "text-[#46514B] hover:text-[#123B2E]"
                  }`}
                >
                  Skill Graph ({skills.length})
                </button>
                <button
                  onClick={() => setActiveTab("code_lab")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "code_lab" ? "bg-[#123B2E] text-white" : "text-[#46514B] hover:text-[#123B2E]"
                  }`}
                >
                  Code Lab
                </button>
                <button
                  onClick={() => setActiveTab("resume_jd")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "resume_jd" ? "bg-[#123B2E] text-white" : "text-[#46514B] hover:text-[#123B2E]"
                  }`}
                >
                  Resume & JD Matcher
                </button>
                <button
                  onClick={() => setActiveTab("memory")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "memory" ? "bg-[#123B2E] text-white" : "text-[#46514B] hover:text-[#123B2E]"
                  }`}
                >
                  Memory & Privacy ({memories.length})
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-[#46514B] font-mono">
                  Mode: <span className="font-bold text-[#123B2E] uppercase">{activeMode}</span>
                </span>
                <button
                  onClick={() => handleCreateNewConversation("New Mentorship Session", activeMode)}
                  className="text-[11px] text-gray-500 hover:text-emerald-700 font-medium px-2 py-0.5 rounded border border-gray-300 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
                  title="Start a new clean session"
                >
                  + New Session
                </button>
              </div>
            </div>

            {/* TAB 1: CONVERSATION */}
            {activeTab === "chat" && (
              <div className="flex-1 flex flex-col p-5 overflow-y-auto max-h-[640px] space-y-4">
                {messages.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-[#46514B]">
                      <span className="font-semibold">{m.sender === "user" ? "You" : "Dr. Aarav Mehta"}</span>
                      <span>·</span>
                      <span>{m.timestamp}</span>
                      {m.teachingStrategy && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {m.teachingStrategy.replace(/_/g, " ")}
                        </span>
                      )}
                      {m.latencyMs && (
                        <span className="text-[10px] text-gray-400 font-mono">
                          {m.latencyMs}ms
                        </span>
                      )}
                      {m.inferenceMode && (
                        <span
                          className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold ${
                            m.inferenceMode === "generative"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {m.inferenceMode}
                        </span>
                      )}
                    </div>

                    <div
                      className={`relative max-w-2xl rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                        m.sender === "user"
                          ? "bg-[#123B2E] text-white rounded-tr-none"
                          : "bg-[#F4EFE4] text-[#17211E] border border-[#DED2BF] rounded-tl-none"
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans">{m.content}</div>

                      {/* POST-INTERACTION LEARNING CHECK (IF PRESENT) */}
                      {m.postInteractionCheck && (
                        <div className="mt-4 p-4 rounded-xl bg-white border-2 border-emerald-500/40 shadow-sm text-xs text-[#17211E]">
                          <div className="flex items-center gap-2 text-emerald-800 font-bold mb-2">
                            <Lightbulb className="w-4 h-4 text-emerald-600" />
                            <span>Concept Verification Check</span>
                          </div>
                          <p className="font-semibold mb-3">{m.postInteractionCheck.question}</p>
                          <div className="space-y-1.5">
                            {m.postInteractionCheck.options.map((opt, oIdx) => {
                              const checkKey = `${m.id}-check`;
                              const selected = answeredChecks[checkKey];
                              const isAnswered = selected !== undefined;
                              const isCorrect = oIdx === m.postInteractionCheck!.correctOptionIndex;
                              const isChosen = selected === oIdx;

                              let btnStyle = "bg-[#FBF8F1] hover:bg-[#F4EFE4] text-[#17211E] border-[#DED2BF]";
                              if (isAnswered) {
                                if (isCorrect) {
                                  btnStyle = "bg-emerald-100 border-emerald-500 text-emerald-900 font-bold";
                                } else if (isChosen && !isCorrect) {
                                  btnStyle = "bg-red-100 border-red-500 text-red-900 line-through";
                                } else {
                                  btnStyle = "opacity-50 border-[#DED2BF]";
                                }
                              }

                              return (
                                <button
                                  key={oIdx}
                                  disabled={isAnswered}
                                  onClick={() =>
                                    setAnsweredChecks((prev) => ({ ...prev, [checkKey]: oIdx }))
                                  }
                                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${btnStyle}`}
                                >
                                  <span>{opt}</span>
                                  {isAnswered && isCorrect && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {answeredChecks[`${m.id}-check`] !== undefined && (
                            <div className="mt-3 pt-2 border-t border-gray-200 text-[11px] text-gray-700">
                              <p className="font-bold text-emerald-800 mb-0.5">Explanation:</p>
                              <p>{m.postInteractionCheck.explanation}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Mentor Message Toolbar */}
                      {m.sender === "mentor" && (
                        <div className="mt-3 pt-2 border-t border-[#DED2BF] flex items-center justify-between text-[11px] flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyMessage(m.content, idx)}
                              className="text-[#46514B] hover:text-[#123B2E] flex items-center gap-1"
                              title="Copy response"
                            >
                              {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedIndex === idx ? "Copied" : "Copy"}</span>
                            </button>
                            <button
                              onClick={() => handleSaveNote(idx)}
                              className={`flex items-center gap-1 ${
                                m.savedNote ? "text-amber-600 font-bold" : "text-[#46514B] hover:text-[#123B2E]"
                              }`}
                              title="Save to learning notes"
                            >
                              <Bookmark className="w-3.5 h-3.5" />
                              <span>{m.savedNote ? "Saved" : "Save Note"}</span>
                            </button>
                            {m.modelProvider && (
                              <span className="text-[10px] text-gray-500 font-mono ml-1">
                                [{m.modelProvider}]
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button className="text-[#46514B] hover:text-emerald-700 p-1" title="Helpful">
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button className="text-[#46514B] hover:text-red-700 p-1" title="Unhelpful">
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Escalation Recommendation Card */}
                    {m.escalation?.shouldEscalate && (
                      <div className="mt-3 p-4 bg-amber-50 border border-amber-300 rounded-xl max-w-2xl text-xs shadow-sm">
                        <div className="flex items-center gap-2 text-amber-900 font-bold mb-1">
                          <UserCheck className="w-4 h-4 text-amber-600" />
                          <span>Recommended Next Step: Connect with a Senior Human Mentor</span>
                        </div>
                        <p className="text-amber-800 text-[11px] mb-3 leading-relaxed">
                          {m.escalation.reason}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {m.escalation.recommendedMentors.map((ment) => (
                            <div key={ment.mentorId} className="bg-white p-2.5 rounded-lg border border-amber-200 flex flex-col justify-between">
                              <div>
                                <p className="font-bold text-[#123B2E] text-xs">{ment.name}</p>
                                <p className="text-[10px] text-gray-600">{ment.role} @ {ment.company}</p>
                                <p className="text-[10px] text-emerald-700 font-semibold mt-1">₹{(ment.hourlyRatePaise / 100).toFixed(0)}/hr</p>
                              </div>
                              <Link
                                href={`/mentors/${ment.mentorId}/book`}
                                className="mt-2 w-full text-center py-1 bg-[#123B2E] text-white rounded text-[10px] font-bold hover:bg-[#174B39] transition-all"
                              >
                                Book Slot
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {isGenerating && (
                  <div className="flex items-center justify-between bg-emerald-50/80 border border-emerald-200 rounded-xl px-4 py-2.5 text-xs text-emerald-900">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
                      <span>Dr. Aarav Mehta is formulating adaptive pedagogical response...</span>
                    </div>
                    <button
                      onClick={handleStopGeneration}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold transition-all shadow flex items-center gap-1"
                    >
                      <Square className="w-3 h-3 fill-white" />
                      <span>Stop Generation</span>
                    </button>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* TAB 2: SKILL GRAPH */}
            {activeTab === "skills" && (
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-base text-[#123B2E]">Persistent Student Skill Graph</h3>
                    <p className="text-xs text-[#46514B]">
                      Evidence-based mastery calibrated across 6 instructional states
                    </p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold">
                    Active Skills: {skills.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {skills.map((s) => (
                    <div key={s.skillId} className="bg-[#F4EFE4] p-4 rounded-xl border border-[#DED2BF] flex items-center justify-between">
                      <div>
                        <p className="font-bold text-xs text-[#123B2E]">{s.skillName}</p>
                        <p className="text-[11px] text-[#46514B] capitalize mt-0.5">
                          Status: <span className="font-semibold">{s.masteryState.replace(/_/g, " ")}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold font-mono text-emerald-700">{s.masteryScore}/10</span>
                        <div className="w-20 bg-gray-200 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div className="bg-emerald-600 h-full" style={{ width: `${s.masteryScore * 10}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: CODE LAB */}
            {activeTab === "code_lab" && (
              <div className="flex-1 p-6 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-base text-[#123B2E]">Interactive Code Lab & Debugger</h3>
                    <p className="text-xs text-[#46514B]">
                      Analyze algorithms for hidden O(N²) traps and test edge cases
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab("chat");
                      dispatchTurn("Please review and optimize the code in my Code Lab.", "code_mentor", scratchCode);
                    }}
                    className="px-4 py-2 bg-[#123B2E] hover:bg-[#174B39] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Review with Dr. Mehta</span>
                  </button>
                </div>
                <textarea
                  value={scratchCode}
                  onChange={(e) => setScratchCode(e.target.value)}
                  className="flex-1 p-4 font-mono text-xs bg-[#0F1E17] text-[#EDF1E8] rounded-xl border border-[#1E3A2F] focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none min-h-[300px]"
                />
              </div>
            )}

            {/* TAB 4: RESUME & JD MATCHER */}
            {activeTab === "resume_jd" && (
              <div className="flex-1 p-6 overflow-y-auto">
                <h3 className="font-bold text-base text-[#123B2E] mb-1">Resume & JD Alignment Studio</h3>
                <p className="text-xs text-[#46514B] mb-4">
                  Audit your experience against Google and Microsoft Tier-1 engineering requirements
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#123B2E] mb-1">Target Job Description</label>
                    <select className="w-full p-2.5 rounded-xl border border-[#DED2BF] bg-white text-xs font-medium">
                      <option>Google — Software Engineer I (SDE-1), Core Systems</option>
                      <option>Microsoft — Software Engineer, Azure Core & Cloud</option>
                      <option>Swiggy — SDE-1 Backend Logistics</option>
                      <option>Zepto — Associate AI & Search Engineer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#123B2E] mb-1">Paste Your Resume Bullet Points</label>
                    <textarea
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      rows={4}
                      className="w-full p-3 rounded-xl border border-[#DED2BF] text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab("chat");
                      dispatchTurn(`Please analyze my resume against the Google SDE-1 JD:\n\n${resumeText}`, "resume_mentor");
                    }}
                    className="px-5 py-2.5 bg-[#123B2E] hover:bg-[#174B39] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Run Google XYZ Audit & ATS Match</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: MEMORY & PRIVACY */}
            {activeTab === "memory" && (
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-[#123B2E]">Structured Student Memory & Privacy</h3>
                    <p className="text-xs text-[#46514B]">
                      Verified preferences, active goals, and learning gaps remembered by your AI mentor
                    </p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold">
                    {memories.length} Items Saved
                  </span>
                </div>

                {/* Add Custom Fact/Goal */}
                <form onSubmit={handleAddMemory} className="p-4 bg-[#F4EFE4]/60 rounded-xl border border-[#DED2BF] text-xs space-y-3">
                  <p className="font-bold text-[#123B2E]">Add Confirmed Learning Goal or Preference</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <select
                      value={newMemoryCat}
                      onChange={(e) => setNewMemoryCat(e.target.value)}
                      className="p-2 rounded-lg border border-[#DED2BF] bg-white text-xs font-medium"
                    >
                      <option value="learning_preferences">Learning Preferences</option>
                      <option value="current_goals">Current Goals</option>
                      <option value="career_objectives">Career Objectives</option>
                      <option value="confirmed_strengths">Confirmed Strengths</option>
                      <option value="active_projects">Active Projects</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Title / Key (e.g. Target Company)"
                      value={newMemoryKey}
                      onChange={(e) => setNewMemoryKey(e.target.value)}
                      className="p-2 rounded-lg border border-[#DED2BF] text-xs bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. Google India SDE-1)"
                      value={newMemoryVal}
                      onChange={(e) => setNewMemoryVal(e.target.value)}
                      className="p-2 rounded-lg border border-[#DED2BF] text-xs bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#123B2E] hover:bg-[#174B39] text-white rounded-lg text-xs font-bold transition-all"
                  >
                    Save Memory Item
                  </button>
                </form>

                <div className="space-y-2.5">
                  {memories.map((m) => (
                    <div key={m.id} className="p-3.5 bg-[#F4EFE4] rounded-xl border border-[#DED2BF] flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#123B2E] text-white">
                            {m.category.replace(/_/g, " ")}
                          </span>
                          {m.studentConfirmed && (
                            <span className="flex items-center gap-0.5 text-[10px] text-emerald-700 font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Student Confirmed</span>
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-xs text-[#123B2E] mt-1">{m.key}</p>
                        <p className="text-[11px] text-[#46514B] mt-0.5">{m.value}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!m.studentConfirmed && (
                          <button
                            onClick={() => handleConfirmMemory(m.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-all"
                            title="Confirm this fact"
                          >
                            Confirm
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMemory(m.id)}
                          className="p-1.5 text-gray-400 hover:text-red-700 rounded transition-all"
                          title="Permanently erase memory item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* INPUT FORM CONTAINER */}
            <div className="p-4 bg-white border-t border-[#DED2BF]">
              {/* Quick Prompt Shortcuts */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                {[
                  "Explain Cache-Aside vs Write-Through directly",
                  "Review my twoSum function in the Code Lab",
                  "Give me progressive hint #1 for Knapsack",
                  "Quiz me on Operating System paging",
                  "Outline my 24-week SDE placement roadmap",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => dispatchTurn(prompt, activeMode)}
                    className="px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap bg-[#F4EFE4] hover:bg-[#DED2BF]/50 text-[#123B2E] font-medium border border-[#DED2BF] transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  dispatchTurn(inputText, activeMode);
                }}
                className="flex items-center gap-2 mt-2"
              >
                <button
                  type="button"
                  onClick={toggleVoiceRecognition}
                  className={`p-3 rounded-xl border transition-all ${
                    isListening
                      ? "bg-red-600 text-white border-red-500 animate-pulse shadow-md shadow-red-600/30"
                      : "bg-[#F4EFE4] hover:bg-[#DED2BF]/50 text-[#123B2E] border-[#DED2BF]"
                  }`}
                  title={isListening ? "Listening... click to stop" : "Speak your message"}
                >
                  <Mic className={`w-4 h-4 ${isListening ? "animate-bounce" : ""}`} />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Ask Dr. Aarav Mehta in ${language === "hi" ? "हिन्दी" : language === "hinglish" ? "Hinglish" : "English"}...`}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#DED2BF] text-xs text-[#17211E] bg-[#FBF8F1] focus:outline-none focus:ring-1 focus:ring-[#123B2E]"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || isGenerating}
                  className="px-5 py-2.5 rounded-xl bg-[#123B2E] hover:bg-[#174B39] disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md shadow-[#123B2E]/20 flex items-center gap-1.5"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT 1 COL: STUDENT INTELLIGENCE PROFILE SIDEBAR */}
          <div className="space-y-5">
            {/* Context Card */}
            <div className="bg-white p-5 rounded-2xl border border-[#DED2BF] shadow-sm">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#123B2E] mb-3 flex items-center gap-1.5">
                <BrainCircuit className="w-4 h-4 text-emerald-600" />
                <span>Student Intelligence Profile</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase">Target Role</p>
                  <p className="font-bold text-[#123B2E]">SDE-1 (Google / Microsoft)</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase">Target Timeline</p>
                  <p className="font-semibold text-gray-800">2026 Campus Placement</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase">Teaching Mode</p>
                  <p className="font-bold text-emerald-700 capitalize">{activeMode.replace(/_/g, " ")}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#DED2BF]/70">
                <p className="text-[10px] text-gray-500 font-semibold uppercase mb-1.5">Identified Knowledge Gaps</p>
                <div className="flex flex-wrap gap-1">
                  {weakSkills.map((w) => (
                    <span key={w} className="px-2 py-0.5 rounded text-[10px] bg-red-100 text-red-800 font-medium">
                      {w}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#DED2BF]/70">
                <p className="text-[10px] text-gray-500 font-semibold uppercase mb-1.5">Demonstrated Strengths</p>
                <div className="flex flex-wrap gap-1">
                  {["TypeScript", "PostgreSQL", "Arrays & Strings"].map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Human Mentorship Card */}
            <div className="bg-gradient-to-br from-[#123B2E] to-[#174B39] text-white p-5 rounded-2xl shadow-md border border-[#21634A]">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-sm">Need a 1:1 Human Mock?</h4>
              </div>
              <p className="text-[11px] text-[#DDE6D7] leading-relaxed mb-4">
                Test your skills in a live WebRTC simulation with Senior Engineers from Google, Microsoft, and Amazon.
              </p>
              <Link
                href="/mentors"
                className="block w-full text-center py-2 bg-emerald-500 hover:bg-emerald-400 text-[#123B2E] font-bold rounded-xl text-xs shadow transition-all"
              >
                Browse Verified Mentors
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
