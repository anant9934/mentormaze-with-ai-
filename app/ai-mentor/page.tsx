"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/lib/auth/context";
import { store } from "@/lib/data/store";
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
  MapPin,
  Calendar,
  Zap,
  Play,
  RotateCcw,
  Check,
  Copy,
  Lightbulb,
} from "lucide-react";
import { MentorTopic } from "@/lib/mentor/ai-mentor-service";

interface ChatMessage {
  id: string;
  sender: "user" | "mentor";
  content: string;
  timestamp: string;
  latencyMs?: number;
}

interface ActionItem {
  id: string;
  title: string;
  category: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
}

export default function AIMentorPage() {
  const { user } = useAuth();
  const studentName = user?.displayName || "Anant Kumar";

  const [activeTopic, setActiveTopic] = useState<MentorTopic>("career_roadmap");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [encouragement, setEncouragement] = useState("Consistent daily effort compounds into life-changing results!");
  const [actionItems, setActionItems] = useState<ActionItem[]>([
    { id: "act-1", title: "Outline target company list (Tier-1 vs High-Growth Startups)", category: "Career", priority: "high", completed: false },
    { id: "act-2", title: "Master the 14 core LeetCode DSA patterns", category: "DSA", priority: "high", completed: false },
  ]);

  const [scratchCode, setScratchCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const speechRecognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize or switch topic
  useEffect(() => {
    fetchTopicTurn(activeTopic, "");
  }, [activeTopic]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        (v.name.includes("Natural") ||
          v.name.includes("Google") ||
          v.name.includes("Samantha") ||
          v.name.includes("Daniel") ||
          v.name.includes("Alex"))
    );
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const toggleSpeechRecognition = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice speech recognition is not supported in this browser. Please type your message.");
      return;
    }

    if (isListening) {
      speechRecognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e: any) => {
        const transcript = Array.from(e.results)
          .map((res: any) => res[0].transcript)
          .join("");
        setInputText(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => {
        setIsListening(false);
        if (inputText.trim()) {
          handleSendMessage(inputText);
        }
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const fetchTopicTurn = async (topic: MentorTopic, userMsg: string, code?: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/ai-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          userMessage: userMsg,
          codeSnippet: code || scratchCode,
          studentName,
          history: messages.slice(-4).map((m) => ({
            role: m.sender === "mentor" ? "assistant" : "user",
            content: m.content,
            timestamp: m.timestamp,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        const mentorMsg: ChatMessage = {
          id: `mentor_${Date.now()}`,
          sender: "mentor",
          content: data.aiResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          latencyMs: data.latencyMs,
        };

        if (userMsg || code) {
          setMessages((prev) => [...prev, mentorMsg]);
        } else {
          setMessages([mentorMsg]);
        }

        if (data.suggestedQuestions) {
          setSuggestedQuestions(data.suggestedQuestions);
        }
        if (data.encouragementPill) {
          setEncouragement(data.encouragementPill);
        }
        if (data.actionItems && data.actionItems.length > 0) {
          setActionItems((prev) => [
            ...prev,
            ...data.actionItems.map((a: any) => ({ ...a, completed: false })),
          ]);
        }

        if (data.voiceText) {
          speakText(data.voiceText);
        }
      }
    } catch (e) {
      console.warn("AI Mentor call failed:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text && !scratchCode.trim()) return;

    if (text) {
      const userMsg: ChatMessage = {
        id: `user_${Date.now()}`,
        sender: "user",
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputText("");
    }

    fetchTopicTurn(activeTopic, text, scratchCode);
  };

  const toggleActionItem = (id: string) => {
    setActionItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const TOPIC_TABS: { id: MentorTopic; label: string; icon: string; desc: string }[] = [
    { id: "career_roadmap", label: "Career Roadmap", icon: "🗺️", desc: "Phased 6-month milestones & prep targets" },
    { id: "resume_review", label: "Resume Polish", icon: "📄", desc: "Google XYZ formula & ATS optimization" },
    { id: "architecture_coaching", label: "Architecture", icon: "🏛️", desc: "Distributed caching, Kafka & system tradeoffs" },
    { id: "code_review_debugging", label: "Code Review", icon: "💻", desc: "Pair-programming & asymptotic optimizations" },
    { id: "guidance_qna", label: "Career Q&A", icon: "💡", desc: "Offers, cold emails & interview psychology" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header Hero Banner */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Bot className="w-3.5 h-3.5 text-emerald-700" />
              <span>24/7 AI Principal Mentor · Voice & Chat Enabled</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-ink-950">
              Personalized AI Career & Architecture Mentorship
            </h1>
            <p className="text-xs text-ink-700 mt-1 max-w-2xl leading-relaxed">
              Dr. Aarav Mehta (Tathastu AI Principal Mentor). Ask for tailored 6-month placement roadmaps, resume ATS rewrites, distributed system design deep dives, or live pair-programming code analysis.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/sessions/bk-test-123/live?role=ai_mentor"
              className="px-4 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <span>Launch Live Audio Room</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Mentorship Topic Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-6">
          {TOPIC_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTopic(t.id)}
              className={`p-3 rounded-2xl border text-left transition-all ${
                activeTopic === t.id
                  ? "bg-forest-900 text-white border-forest-900 shadow-md ring-2 ring-emerald-500/30"
                  : "bg-white text-ink-800 border-border hover:bg-cream-100"
              }`}
            >
              <div className="text-lg mb-1">{t.icon}</div>
              <div className="font-bold text-xs">{t.label}</div>
              <div className={`text-[10px] mt-0.5 line-clamp-1 ${activeTopic === t.id ? "text-emerald-300" : "text-ink-500"}`}>
                {t.desc}
              </div>
            </button>
          ))}
        </div>

        {/* Main Interactive Stage Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN (8 COLS): VOICE STAGE + INTERACTIVE CHAT */}
          <div className="lg:col-span-8 space-y-4">
            {/* Top Neural Mentor Avatar Banner */}
            <div className="bg-[#0E2018] border border-[#1E4334] rounded-3xl p-5 text-white shadow-card relative overflow-hidden flex flex-col sm:flex-row items-center gap-5">
              <div className={`absolute w-44 h-44 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none ${isSpeaking ? "animate-pulse" : ""}`} />

              <div className="relative flex-shrink-0">
                <div className={`relative w-24 h-24 rounded-full overflow-hidden border-2 shadow-xl ring-4 ${
                  isSpeaking ? "border-emerald-400 ring-emerald-500/30 scale-105" : "border-emerald-600/40 ring-emerald-900/20"
                }`}>
                  <Image
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                    alt="AI Mentor Avatar"
                    fill
                    className="object-cover"
                  />
                </div>
                {isSpeaking && (
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-600 text-[9px] font-bold text-white shadow-md animate-bounce flex items-center gap-0.5">
                    <Volume2 className="w-2.5 h-2.5" />
                    <span>Speaking</span>
                  </span>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Tathastu AI Principal Mentor
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-semibold">
                    Always Live · 0ms Wait
                  </span>
                </div>
                <p className="text-xs text-emerald-300/80 mb-2">
                  12+ yrs engineering leadership at Google & Microsoft · Mentored 2,800+ students to tier-1 roles
                </p>

                {/* Animated Soundwave Bars */}
                <div className="flex items-center justify-center sm:justify-start gap-1 h-5 mb-2">
                  {[0.3, 0.8, 0.5, 1.0, 0.7, 0.9, 0.4, 0.6].map((scale, i) => (
                    <span
                      key={i}
                      className={`w-1 rounded-full transition-all duration-150 ${
                        isSpeaking
                          ? "bg-gradient-to-t from-emerald-500 to-teal-300 animate-pulse"
                          : "bg-white/20 h-1.5"
                      }`}
                      style={{
                        height: isSpeaking ? `${Math.max(4, scale * 20)}px` : "4px",
                        animationDelay: `${i * 100}ms`,
                      }}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button
                    onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${
                      isVoiceEnabled
                        ? "bg-emerald-950/80 border-emerald-600 text-emerald-200"
                        : "bg-gray-900 border-gray-700 text-gray-400"
                    }`}
                  >
                    {isVoiceEnabled ? <Volume2 className="w-3 h-3 text-emerald-400" /> : <VolumeX className="w-3 h-3 text-gray-400" />}
                    <span>{isVoiceEnabled ? "Voice ON" : "Voice Muted"}</span>
                  </button>

                  <span className="text-[10px] text-[#A3B899] italic">
                    💡 {encouragement}
                  </span>
                </div>
              </div>
            </div>

            {/* Conversation Log Card */}
            <div className="bg-white border border-border rounded-3xl p-5 shadow-card min-h-[440px] flex flex-col justify-between">
              {/* Message History */}
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-ink-500">
                      <span className="font-semibold">{m.sender === "mentor" ? "Tathastu AI Mentor" : studentName}</span>
                      <span>·</span>
                      <span>{m.timestamp}</span>
                      {m.latencyMs && (
                        <span className="text-emerald-600 font-mono flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5 text-amber-500" />
                          {m.latencyMs}ms
                        </span>
                      )}
                    </div>
                    <div
                      className={`p-4 rounded-2xl text-xs max-w-[92%] leading-relaxed shadow-sm ${
                        m.sender === "user"
                          ? "bg-forest-900 text-white rounded-tr-none"
                          : "bg-cream-50 text-ink-950 border border-border rounded-tl-none font-sans"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Contextual Question Pills */}
              <div className="pt-3 border-t border-border mt-3">
                <div className="flex items-center gap-1.5 pb-2 overflow-x-auto scrollbar-none">
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSendMessage(q)}
                      className="text-[11px] whitespace-nowrap bg-sage-50 hover:bg-sage-100 text-forest-950 px-2.5 py-1 rounded-lg border border-sage-200 transition-all active:scale-95 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-forest-700" />
                      <span>{q}</span>
                    </button>
                  ))}
                </div>

                {/* Input Form with Voice Button */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2 pt-2"
                >
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={`px-3 py-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
                      isListening
                        ? "bg-red-600 text-white border-red-500 animate-pulse shadow-md"
                        : "bg-cream-100 hover:bg-cream-200 text-forest-900 border-border"
                    }`}
                    title={isListening ? "Listening... click to stop" : "Speak to AI Mentor via microphone"}
                  >
                    <Mic className={`w-4 h-4 ${isListening ? "animate-bounce text-white" : ""}`} />
                    <span className="hidden sm:inline">{isListening ? "Listening..." : "Speak"}</span>
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      isListening
                        ? "Listening to your voice..."
                        : `Ask your AI Mentor about ${activeTopic.replace(/_/g, " ")}...`
                    }
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border text-xs text-ink-950 bg-white placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-forest-800"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() && !scratchCode.trim()}
                    className="px-5 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-800 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (4 COLS): ACTION ITEMS & CODE SCRATCHPAD */}
          <div className="lg:col-span-4 space-y-4">
            {/* Action Items Checklist */}
            <div className="card-warm bg-white p-5 rounded-3xl shadow-card border border-border">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-ink-950">
                    Mentorship Action Items
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {actionItems.filter((a) => a.completed).length} / {actionItems.length} Done
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {actionItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleActionItem(item.id)}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs flex items-start gap-2.5 transition-all ${
                      item.completed
                        ? "bg-sage-50/60 border-sage-200 text-ink-500"
                        : "bg-white border-border text-ink-900 hover:bg-cream-50"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 transition-colors ${
                        item.completed ? "text-emerald-600 fill-emerald-100" : "text-gray-300"
                      }`}
                    />
                    <div className="flex-1">
                      <span className={item.completed ? "line-through" : "font-medium"}>
                        {item.title}
                      </span>
                      <span className="block text-[10px] text-ink-400 mt-0.5">
                        {item.category} · Priority: {item.priority.toUpperCase()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Code / Resume Scratchpad */}
            <div className="card-warm bg-white p-5 rounded-3xl shadow-card border border-border">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                <div className="flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-forest-800" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-ink-950">
                    Code / Resume Scratchpad
                  </h3>
                </div>
                {scratchCode && (
                  <button
                    onClick={() => setScratchCode("")}
                    className="text-[10px] text-ink-500 hover:text-red-600 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              <textarea
                value={scratchCode}
                onChange={(e) => setScratchCode(e.target.value)}
                placeholder="// Paste code snippet or resume bullet here..."
                rows={5}
                className="w-full p-3 rounded-xl bg-cream-50 border border-border font-mono text-xs text-ink-950 focus:outline-none focus:ring-1 focus:ring-forest-800 resize-none leading-relaxed"
              />

              <button
                onClick={() => fetchTopicTurn("code_review_debugging", "Please review and optimize this code snippet.", scratchCode)}
                disabled={!scratchCode.trim() || isSubmitting}
                className="w-full mt-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Analyzing..." : "Submit to Mentor for Analysis"}</span>
              </button>
            </div>

            {/* 1-on-1 Human Mentor Pairing */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-forest-950 to-forest-900 text-white shadow-elevated">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block mb-1">
                Verified 1:1 Human Follow-Up
              </span>
              <h4 className="font-serif text-sm font-bold mb-1">Pair with a Senior Microsoft Tech Lead</h4>
              <p className="text-[11px] text-emerald-200/80 mb-3 leading-relaxed">
                Connect your AI roadmap with Priya Sharma for live portfolio reviews and mock rounds.
              </p>
              <Link
                href="/mentors/mentor-priya"
                className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-forest-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow"
              >
                <span>Book Priya Sharma (1:1 Session)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

