"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/lib/auth/context";
import {
  FocusArea,
  TeachingMode,
  LanguageCode,
  SourceCitation,
  RecommendedAction,
  SkillUpdate,
  EscalationRecommendation,
  SpecialistCapabilityInfo,
  UNIFIED_MENTOR_IDENTITY,
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
  Activity,
  Cpu,
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
  specialistCapability?: SpecialistCapabilityInfo;
  sources?: SourceCitation[];
  recommendedActions?: RecommendedAction[];
  skillUpdates?: SkillUpdate[];
  escalation?: EscalationRecommendation;
  latencyMs?: number;
  modelProvider?: string;
  inferenceMode?: "generative" | "deterministic" | "fine-tuned-2b";
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
  mode: TeachingMode | FocusArea;
  updatedAt: string;
  createdAt: string;
}

interface FocusAreaDef {
  id: FocusArea;
  label: string;
  icon: any;
  specialistTitle: string;
  badge: string;
  description: string;
  placeholder: string;
}

const FOCUS_AREAS: FocusAreaDef[] = [
  {
    id: "learn",
    label: "Learn",
    icon: BookOpen,
    specialistTitle: "Concept Pedagogy",
    badge: "Using Conceptual Pedagogy",
    description: "Master CS concepts from first principles with invariants and trade-offs",
    placeholder: "Ask Dr. Aarav to explain any CS concept, algorithmic invariant, or architectural pattern...",
  },
  {
    id: "practice",
    label: "Practice",
    icon: Zap,
    specialistTitle: "Socratic Practice",
    badge: "Using Socratic Scaffolding",
    description: "3-tier progressive hints & active recall without premature code dumps",
    placeholder: "Share an algorithmic problem you're stuck on to receive progressive Socratic hints...",
  },
  {
    id: "coding_dsa",
    label: "Coding & DSA",
    icon: Code2,
    specialistTitle: "Algorithmic Review",
    badge: "Using Coding & DSA Expertise",
    description: "Line-by-line review, asymptotic proofs, edge cases & bug detection",
    placeholder: "Paste your code snippet or LeetCode solution for algorithmic complexity review...",
  },
  {
    id: "system_design",
    label: "System Design",
    icon: Layers,
    specialistTitle: "Distributed Systems",
    badge: "Using System Design Expertise",
    description: "Distributed architectures, caching topologies, CAP trade-offs & scaling",
    placeholder: "Ask to design a rate limiter, cache-aside layer, Kafka pipeline, or URL shortener...",
  },
  {
    id: "career",
    label: "Career",
    icon: Compass,
    specialistTitle: "Job Market & Calibration",
    badge: "Using Career Intelligence",
    description: "Naukri JD analysis, SDE-1 vs SDE-2 expectations & compensation bands",
    placeholder: "Paste a job description or ask about tier-1 CTC compensation benchmarks...",
  },
  {
    id: "resume",
    label: "Resume",
    icon: FileText,
    specialistTitle: "Google XYZ Resume",
    badge: "Using Resume Engineering",
    description: "Google XYZ formula rewriting with zero-fabrication metric guardrails",
    placeholder: "Paste your resume experience bullets for Google XYZ formula restructuring...",
  },
  {
    id: "interview",
    label: "Interview",
    icon: Briefcase,
    specialistTitle: "Mock Simulation & Rubric",
    badge: "Using Interview Coaching",
    description: "FAANG 4-tier evaluation rubrics & STAR behavioral mock simulations",
    placeholder: "Ask for a simulated technical coding round or behavioral STAR question...",
  },
  {
    id: "projects",
    label: "Projects",
    icon: BrainCircuit,
    specialistTitle: "Portfolio Engineering",
    badge: "Using Project Architecture",
    description: "Production fullstack portfolio architectures with real distributed scale",
    placeholder: "Ask how to architect a high-signal distributed portfolio project with schemas...",
  },
  {
    id: "study_planning",
    label: "Study Planning",
    icon: Calendar,
    specialistTitle: "24-Week Roadmaps",
    badge: "Using Study Architecture",
    description: "Personalized milestone calendars, spaced retrieval & placement pacing",
    placeholder: "Request a personalized 24-week engineering study schedule and milestone plan...",
  },
];

export default function AIMentorPage() {
  const { user } = useAuth();
  const studentUserId = user?.id || "usr-student-1";
  const studentName = user?.displayName || "Anant Kumar";

  const [activeFocus, setActiveFocus] = useState<FocusArea>("learn");
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
  const [scratchCode, setScratchCode] = useState(
    `// Scratch Code Lab: Paste snippet to debug or review\nfunction twoSum(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (seen.has(complement)) {\n      return [seen.get(complement), i];\n    }\n    seen.set(nums[i], i);\n  }\n  return [];\n}`
  );
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [resumeText, setResumeText] = useState(
    "Software Engineer Intern | Built real-time WebRTC collaboration tool and Redis cache for 10k users. Worked on optimizing database queries."
  );
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
        if (!activeConversationId) {
          switchConversation(data.conversations[0].id);
        }
      } else {
        handleCreateNewConversation("Initial Mentorship Session", activeFocus);
      }
    } catch (err) {
      console.warn("Failed to load conversations from server:", err);
      setupDefaultWelcome();
    }
  };

  const setupDefaultWelcome = () => {
    setMessages([
      {
        id: "msg-welcome-0",
        sender: "mentor",
        content: `### 👋 Namaste ${studentName}! I am Dr. Aarav Mehta.\n\nI am your unified AI engineering mentor inside MentorMaze by AI Tathastu. Whether you need to master Dynamic Programming from first principles, review your code complexity, design a distributed system, rewrite your resume bullets using Google XYZ, or calibrate your placement readiness, I apply specialized internal capabilities across our continuous conversation.\n\n**Select a focus area above or ask any technical question:**\n- 📚 **Learn**: Conceptual derivations, invariants, and foundational deep-dives.\n- 💡 **Practice**: Socratic scaffolding with 3-tier progressive hints.\n- 🔍 **Coding & DSA**: Line-by-line review, asymptotic proofs, and $O(N^2)$ trap elimination.\n- 🏗️ **System Design**: Distributed caching, consensus, and CAP theorem trade-offs.\n- 📄 **Resume & Career**: Factual Google XYZ rewrites with strict zero-fabrication metrics.\n\n*Where would you like to begin today?*`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        teachingStrategy: "conceptual_explanation",
        specialistCapability: {
          id: "learn",
          name: "Concept Learning Specialist",
          badge: "Using Conceptual Pedagogy",
          domain: "Computer Science Fundamentals & Pedagogy",
          description: "Explains core concepts from first principles with verified analogies and invariants.",
        },
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
        if (data.conversation.mode) {
          const matched = FOCUS_AREAS.find((f) => f.id === data.conversation.mode);
          if (matched) setActiveFocus(matched.id);
        }
        if (data.messages && data.messages.length > 0) {
          const loaded: ChatMessage[] = data.messages.map((m: any) => ({
            id: m.id,
            sender: m.role === "user" ? "user" : "mentor",
            content: m.content,
            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            teachingStrategy: m.metadata?.teachingStrategy,
            specialistCapability: m.metadata?.specialistCapability,
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

  const handleCreateNewConversation = async (title?: string, focus?: FocusArea) => {
    try {
      const res = await fetch("/api/ai-mentor/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: studentUserId,
          title: title || `Mentorship on ${activeFocus.toUpperCase()}`,
          mode: focus || activeFocus,
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
            handleCreateNewConversation("New Mentorship Session", activeFocus);
          }
        }
      }
    } catch (e) {
      console.warn("Failed to delete conversation", e);
    }
  };

  // Scroll to bottom on new messages
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
      dispatchTurn(transcript, activeFocus);
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
  const dispatchTurn = async (userMsg: string, focusToUse: FocusArea, codeToAttach?: string) => {
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
          focusArea: focusToUse,
          mode: focusToUse,
          languagePreference: language,
          codeSnippet: codeToAttach || (activeFocus === "coding_dsa" ? scratchCode : undefined),
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
            // Buffer parse guard
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
                  specialistCapability: metadataReceived.specialistCapability,
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

      // Refresh conversations list
      fetch(`/api/ai-mentor/conversations?userId=${studentUserId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.conversations) setConversations(d.conversations);
        })
        .catch(() => {});
    } catch (err: any) {
      setIsGenerating(false);
      abortControllerRef.current = null;

      if (err.name !== "AbortError") {
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

  const currentFocusDef = FOCUS_AREAS.find((f) => f.id === activeFocus) || FOCUS_AREAS[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF8F1] text-[#17211E] font-sans">
      <Navbar />

      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* UNIFIED MENTOR HEADER CARD */}
        <div className="bg-[#123B2E] text-white rounded-2xl p-5 mb-3 shadow-xl border border-[#174B39] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-400/80 shadow-md flex-shrink-0 bg-[#0d2a21]">
              <Image
                src={UNIFIED_MENTOR_IDENTITY.avatarUrl}
                alt="Dr. Aarav Mehta"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-[#EDF1E8]">Dr. Aarav Mehta</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Principal Mentor · AI Intelligence
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Continuous Persona & Context</span>
                </span>
              </div>
              <p className="text-xs text-[#DDE6D7]/80 mt-1">
                Staff Software Architect & Placement Strategist · MentorMaze by AI Tathastu
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap text-[10px]">
                <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-700/50 flex items-center gap-1 font-mono">
                  <Cpu className="w-3 h-3 text-emerald-400" />
                  <span>Adapter: mentormaze-2b-sft-v1 (DEPLOYABLE)</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-[#174B39] text-[#DDE6D7] border border-[#21634A] flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  <span>Active Focus: <strong>{currentFocusDef.specialistTitle}</strong></span>
                </span>
              </div>
            </div>
          </div>

          {/* Controls: Sessions Drawer, Language, Voice */}
          <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="px-3 py-1.5 rounded-xl bg-[#174B39] hover:bg-[#21634A] border border-[#21634A] text-xs font-semibold text-[#DDE6D7] hover:text-white flex items-center gap-1.5 transition-all shadow-sm"
              title="Toggle Saved Sessions Drawer"
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

            {/* Voice Toggle */}
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

        {/* INFERENCE TRANSPARENCY NOTICE */}
        <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-xl px-4 py-2 mb-3 text-xs text-emerald-950 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>
              <strong>Unified Architecture:</strong> Interacting with ONE mentor (Dr. Aarav Mehta). Switching Focus Areas updates internal specialist analysis without wiping conversation history. Fine-tuned core model adapter <code className="bg-emerald-100/90 px-1 py-0.5 rounded text-[11px] font-mono font-bold">mentormaze-2b-sft-v1</code> is verified & deployable (Test PPL 1.59, Socratic 100%).
            </span>
          </div>
          <Link
            href="/admin/ai-mentor"
            className="text-[11px] font-bold text-emerald-900 hover:text-emerald-950 underline flex-shrink-0"
          >
            Admin Model Registry →
          </Link>
        </div>

        {/* 9 FOCUS AREAS COMPACT SELECTOR STRIP */}
        <div className="bg-white rounded-2xl border border-[#DED2BF] p-2 mb-4 shadow-sm">
          <div className="flex items-center justify-between px-2 pb-1.5 border-b border-[#EAE3D2] mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#46514B] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Select Focus Area (Maintains Continuous Memory)</span>
            </span>
            <span className="text-[10px] text-gray-500 hidden sm:inline">
              Active Capability: <strong className="text-[#123B2E]">{currentFocusDef.description}</strong>
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1.5">
            {FOCUS_AREAS.map((f) => {
              const Icon = f.icon;
              const isSelected = activeFocus === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    setActiveFocus(f.id);
                    if (activeTab !== "chat") setActiveTab("chat");
                  }}
                  className={`p-2 rounded-xl text-left transition-all border flex flex-col justify-between ${
                    isSelected
                      ? "bg-[#123B2E] text-white border-[#123B2E] shadow-sm"
                      : "bg-[#FBF8F1] text-[#46514B] border-[#DED2BF] hover:border-[#123B2E]/40 hover:bg-[#F4EFE4]"
                  }`}
                  title={f.description}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-400" : "text-[#123B2E]"}`} />
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </div>
                  <div>
                    <p className="font-bold text-[11px] leading-tight truncate">{f.label}</p>
                    <p className={`text-[9px] truncate ${isSelected ? "text-emerald-200" : "text-gray-500"}`}>
                      {f.specialistTitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN WORKSPACE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
          {/* CONVERSATION DRAWER (IF OPEN) */}
          {isSidebarOpen && (
            <div className="lg:col-span-1 bg-white rounded-2xl border border-[#DED2BF] p-4 shadow-sm flex flex-col max-h-[720px]">
              <div className="flex items-center justify-between pb-3 border-b border-[#DED2BF] mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#123B2E]" />
                  <span className="font-bold text-xs text-[#123B2E]">Saved Sessions</span>
                </div>
                <button
                  onClick={() => handleCreateNewConversation("New Mentorship Session", activeFocus)}
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

          {/* WORKSPACE CENTRAL COLUMN */}
          <div
            className={`${
              isSidebarOpen ? "lg:col-span-2" : "lg:col-span-3"
            } bg-white rounded-2xl border border-[#DED2BF] shadow-sm flex flex-col overflow-hidden`}
          >
            {/* WORKSPACE TABS */}
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
                  Student Memory ({memories.length})
                </button>
              </div>

              {/* Focus Badge Indicator */}
              <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>{currentFocusDef.badge}</span>
              </div>
            </div>

            {/* TAB 1: CHAT CONVERSATION */}
            {activeTab === "chat" && (
              <div className="flex-1 flex flex-col min-h-[500px]">
                {/* MESSAGES SCROLL AREA */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[640px]">
                  {messages.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                    >
                      {/* Sender Tag & Badges */}
                      <div className="flex items-center gap-2 mb-1 px-1 flex-wrap">
                        {m.sender === "mentor" && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="font-bold text-xs text-[#123B2E]">Dr. Aarav Mehta</span>
                          </div>
                        )}
                        {m.specialistCapability && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300/80 px-2 py-0.5 rounded-md font-semibold">
                            {m.specialistCapability.badge}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-500">{m.timestamp}</span>
                        {m.modelProvider && (
                          <span className="text-[9px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded">
                            {m.modelProvider}
                          </span>
                        )}
                        {m.latencyMs && (
                          <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                            {m.latencyMs}ms
                          </span>
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={`relative max-w-2xl rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                          m.sender === "user"
                            ? "bg-[#123B2E] text-white rounded-tr-none"
                            : "bg-[#F4EFE4] text-[#17211E] border border-[#DED2BF] rounded-tl-none"
                        }`}
                      >
                        <div className="whitespace-pre-wrap font-sans">{m.content}</div>

                        {/* POST-INTERACTION LEARNING CHECK */}
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

                        {/* Toolbar: Copy, Save Note */}
                        {m.sender === "mentor" && (
                          <div className="mt-3 pt-2 border-t border-[#DED2BF] flex items-center justify-between text-[11px] flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCopyMessage(m.content, idx)}
                                className="text-[#46514B] hover:text-[#123B2E] flex items-center gap-1"
                                title="Copy response"
                              >
                                {copiedIndex === idx ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
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
                            </div>

                            {/* Citations Accordion (if any) */}
                            {m.sources && m.sources.length > 0 && (
                              <span className="text-[10px] text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                                {m.sources.length} Verified Sources
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Recommended Actions Pills */}
                      {m.recommendedActions && m.recommendedActions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5 max-w-2xl">
                          {m.recommendedActions.map((act) => (
                            <button
                              key={act.id}
                              onClick={() => {
                                setInputText(act.title);
                                dispatchTurn(act.title, activeFocus);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white border border-[#DED2BF] hover:border-[#123B2E] text-[11px] text-[#123B2E] hover:bg-[#F4EFE4] transition-all flex items-center gap-1 shadow-2xs"
                            >
                              <ArrowRight className="w-3 h-3 text-emerald-600" />
                              <span>{act.title}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* PROMPT INPUT BAR */}
                <div className="p-4 border-t border-[#DED2BF] bg-[#F4EFE4]/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase text-[#46514B]">Suggestion Chips:</span>
                    <button
                      onClick={() => setInputText("How do I implement Cache-Aside in Redis?")}
                      className="text-[11px] text-[#123B2E] hover:underline bg-white px-2 py-0.5 rounded border border-[#DED2BF]"
                    >
                      Cache-Aside Invalidation
                    </button>
                    <button
                      onClick={() => setInputText("Teach me 0/1 Knapsack recurrence relation.")}
                      className="text-[11px] text-[#123B2E] hover:underline bg-white px-2 py-0.5 rounded border border-[#DED2BF]"
                    >
                      0/1 Knapsack Recurrence
                    </button>
                    <button
                      onClick={() => setInputText("Review my twoSum function in the Code Lab.")}
                      className="text-[11px] text-[#123B2E] hover:underline bg-white px-2 py-0.5 rounded border border-[#DED2BF]"
                    >
                      Review twoSum
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      dispatchTurn(inputText, activeFocus);
                    }}
                    className="flex items-end gap-2"
                  >
                    <div className="relative flex-1">
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            dispatchTurn(inputText, activeFocus);
                          }
                        }}
                        placeholder={currentFocusDef.placeholder}
                        rows={2}
                        className="w-full p-3 rounded-xl border border-[#DED2BF] focus:outline-none focus:ring-2 focus:ring-[#123B2E] bg-white text-xs resize-none"
                      />
                    </div>

                    {/* Microphone Dictation */}
                    <button
                      type="button"
                      onClick={toggleVoiceRecognition}
                      className={`p-3 rounded-xl border transition-all ${
                        isListening
                          ? "bg-red-600 border-red-500 text-white animate-pulse"
                          : "bg-white border-[#DED2BF] text-gray-600 hover:text-[#123B2E]"
                      }`}
                      title={isListening ? "Listening... (Click to stop)" : "Dictate via microphone"}
                    >
                      <Mic className="w-4 h-4" />
                    </button>

                    {/* Send / Stop Button */}
                    {isGenerating ? (
                      <button
                        type="button"
                        onClick={handleStopGeneration}
                        className="px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                        title="Cancel streaming"
                      >
                        <Square className="w-4 h-4" />
                        <span>Stop</span>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={!inputText.trim()}
                        className="px-5 py-3 rounded-xl bg-[#123B2E] hover:bg-[#174B39] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                      >
                        <span>Send</span>
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                  </form>
                </div>
              </div>
            )}

            {/* TAB 2: SKILL GRAPH */}
            {activeTab === "skills" && (
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#DED2BF]">
                  <div>
                    <h3 className="font-bold text-base text-[#123B2E]">Student Skill Graph</h3>
                    <p className="text-xs text-gray-600">
                      Grounded competencies verified through automated test evidence and mentor assessments.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    {skills.length} Tracked Nodes
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {skills.map((s) => (
                    <div key={s.skillId} className="p-4 rounded-xl border border-[#DED2BF] bg-[#FBF8F1]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-[#123B2E]">{s.skillName}</span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            s.masteryState === "demonstrated" || s.masteryState === "consistently_demonstrated"
                              ? "bg-emerald-200 text-emerald-900"
                              : "bg-amber-200 text-amber-900"
                          }`}
                        >
                          {s.masteryState.replace("_", " ")}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                        <div
                          className="bg-[#123B2E] h-2 rounded-full"
                          style={{ width: `${Math.min(100, (s.masteryScore / 10) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500">Score: {s.masteryScore}/10</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: CODE LAB */}
            {activeTab === "code_lab" && (
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center justify-between pb-3 border-b border-[#DED2BF] mb-4">
                  <div>
                    <h3 className="font-bold text-base text-[#123B2E]">Scratch Code Lab</h3>
                    <p className="text-xs text-gray-600">
                      Paste or draft code here. Dr. Aarav Mehta will review asymptotic complexity, hidden $O(N^2)$ traps, and edge cases.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveFocus("coding_dsa");
                      setActiveTab("chat");
                      dispatchTurn("Please review this code snippet for complexity and bugs.", "coding_dsa", scratchCode);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#123B2E] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#174B39]"
                  >
                    <Code2 className="w-4 h-4" />
                    <span>Send to Dr. Aarav</span>
                  </button>
                </div>
                <textarea
                  value={scratchCode}
                  onChange={(e) => setScratchCode(e.target.value)}
                  rows={14}
                  className="w-full p-4 font-mono text-xs bg-[#17211E] text-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* TAB 4: RESUME & JD MATCHER */}
            {activeTab === "resume_jd" && (
              <div className="p-6 flex flex-col flex-1 space-y-4">
                <div className="pb-3 border-b border-[#DED2BF]">
                  <h3 className="font-bold text-base text-[#123B2E]">Resume & Google XYZ Bullet Alignment</h3>
                  <p className="text-xs text-gray-600">
                    Transform vague bullets into metric-driven statements (&quot;Accomplished [X] as measured by [Y], by doing [Z]&quot;) with strict zero-fabrication guardrails.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#123B2E] mb-1">
                    Your Current Resume Bullet / Experience:
                  </label>
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    rows={4}
                    className="w-full p-3 text-xs rounded-xl border border-[#DED2BF] focus:outline-none focus:ring-2 focus:ring-[#123B2E]"
                  />
                </div>
                <button
                  onClick={() => {
                    setActiveFocus("resume");
                    setActiveTab("chat");
                    dispatchTurn(
                      `Please evaluate and rewrite this resume experience using the Google XYZ formula: "${resumeText}"`,
                      "resume"
                    );
                  }}
                  className="self-start px-4 py-2.5 rounded-xl bg-[#123B2E] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#174B39]"
                >
                  <FileText className="w-4 h-4" />
                  <span>Analyze with Resume Specialist</span>
                </button>
              </div>
            )}

            {/* TAB 5: STUDENT MEMORY */}
            {activeTab === "memory" && (
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="pb-3 border-b border-[#DED2BF] flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-[#123B2E]">Persistent Student Memory</h3>
                    <p className="text-xs text-gray-600">
                      Facts, learning preferences, and confirmed goals retained across sessions with strict student privacy consent.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    {memories.length} Retained Facts
                  </span>
                </div>

                {/* Add Memory Form */}
                <form onSubmit={handleAddMemory} className="p-4 rounded-xl border border-[#DED2BF] bg-[#FBF8F1] flex gap-2 flex-wrap items-end">
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Key</label>
                    <input
                      type="text"
                      placeholder="e.g. target_role"
                      value={newMemoryKey}
                      onChange={(e) => setNewMemoryKey(e.target.value)}
                      className="w-full p-2 bg-white border border-[#DED2BF] rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex-2 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Value</label>
                    <input
                      type="text"
                      placeholder="e.g. Distributed Systems Engineer"
                      value={newMemoryVal}
                      onChange={(e) => setNewMemoryVal(e.target.value)}
                      className="w-full p-2 bg-white border border-[#DED2BF] rounded-lg text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-2 bg-[#123B2E] text-white text-xs font-bold rounded-lg hover:bg-[#174B39]"
                  >
                    + Add Memory
                  </button>
                </form>

                <div className="space-y-2">
                  {memories.map((m) => (
                    <div key={m.id} className="p-3 rounded-xl border border-[#DED2BF] bg-white flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-[#123B2E]">{m.key}</span>
                        <p className="text-xs text-gray-700 mt-0.5">{m.value}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.studentConfirmed ? (
                          <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                            Confirmed
                          </span>
                        ) : (
                          <button
                            onClick={() => handleConfirmMemory(m.id)}
                            className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded hover:bg-amber-200"
                          >
                            Confirm
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMemory(m.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete memory item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR: CONTEXT & ESCALATION */}
          <div className="lg:col-span-1 space-y-4">
            {/* Student Profile Card */}
            <div className="bg-white rounded-2xl border border-[#DED2BF] p-4 shadow-sm">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#123B2E] mb-3 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Student Intelligence Context</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-gray-500 text-[11px]">Student:</span>
                  <p className="font-semibold">{studentName}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-[11px]">Target Role:</span>
                  <p className="font-semibold text-emerald-800">Software Development Engineer (SDE-1)</p>
                </div>
                <div>
                  <span className="text-gray-500 text-[11px]">Known Skill Invariants:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono">
                      Two Pointers: Monotonic Invariant
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono">
                      Redis: Cache-Aside Pattern
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-mono">
                      0/1 Knapsack: 1D Space Recurrence
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Human Mentor Escalation Card */}
            {escalationData?.shouldEscalate && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Human Mentor Escalation Recommended</span>
                </div>
                <p className="text-[11px] text-amber-950 mb-3">{escalationData.reason}</p>
                {escalationData.recommendedMentors.map((m) => (
                  <div key={m.mentorId} className="p-2.5 rounded-xl bg-white border border-amber-200 text-xs mb-2">
                    <p className="font-bold text-[#123B2E]">{m.name}</p>
                    <p className="text-[11px] text-gray-600">{m.role} at {m.company}</p>
                    <p className="text-[10px] text-emerald-700 font-bold mt-1">₹{(m.hourlyRatePaise / 100).toFixed(0)}/hr</p>
                  </div>
                ))}
                <Link
                  href="/mentors"
                  className="block text-center mt-2 w-full py-2 bg-[#123B2E] text-white rounded-xl text-xs font-bold hover:bg-[#174B39]"
                >
                  Book 1:1 Human Mentor Session →
                </Link>
              </div>
            )}

            {/* Model Architecture Transparency */}
            <div className="bg-white rounded-2xl border border-[#DED2BF] p-4 text-xs text-gray-600 space-y-2 shadow-sm">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#123B2E] flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-600" />
                <span>Model Verification</span>
              </h4>
              <p className="text-[11px]">
                Trained on <strong>9,987 curated examples</strong> across Socratic, technical, career, and leveling domains on Apple Silicon MPS.
              </p>
              <div className="pt-2 border-t border-[#DED2BF] flex items-center justify-between text-[11px]">
                <span className="font-mono text-emerald-800 font-bold">Base PPL: 7.25 → SFT: 1.59</span>
                <span className="font-bold text-emerald-700">-78.1%</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
