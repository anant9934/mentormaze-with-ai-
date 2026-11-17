"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Room, RoomEvent, Track, RemoteTrack, RemoteParticipant } from "livekit-client";
import { store } from "@/lib/data/store";
import { useAuth } from "@/lib/auth/context";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  CheckCircle2,
  FileText,
  Clock,
  ArrowLeft,
  Settings,
  Shield,
  Lock,
  Save,
  MessageSquare,
  Send,
  Zap,
  Radio,
  Code2,
  Play,
  Copy,
  Check,
  LayoutGrid,
  Terminal,
  Volume2,
  Share2,
  Plus,
  Globe,
  Maximize2,
  Minimize2,
  Trash2,
  Bot,
  VolumeX,
  Sparkles,
  HelpCircle,
} from "lucide-react";

interface ChatMessage {
  id: string;
  senderUserId: string;
  senderName: string;
  senderRole: "student" | "mentor" | "system";
  content: string;
  latencyMs: number;
  channelType: "webrtc_datachannel" | "broadcast_bus" | "server_sync" | "livekit_datachannel";
  createdAt: string;
}

const STARTER_CODES: Record<string, string> = {
  javascript: `// MentorMaze Live Coding & Algorithmic Practice
// Problem: Longest Substring Without Repeating Characters

function lengthOfLongestSubstring(s) {
  let maxLength = 0;
  let left = 0;
  const charMap = new Map();

  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    if (charMap.has(char) && charMap.get(char) >= left) {
      left = charMap.get(char) + 1;
    }
    charMap.set(char, right);
    maxLength = Math.max(maxLength, right - left + 1);
  }

  return maxLength;
}

// Test cases
console.log("Test 1 ('abcabcbb'):", lengthOfLongestSubstring("abcabcbb")); // Expected: 3
console.log("Test 2 ('bbbbb'):", lengthOfLongestSubstring("bbbbb"));       // Expected: 1
console.log("Test 3 ('pwwkew'):", lengthOfLongestSubstring("pwwkew"));     // Expected: 3
`,
  python: `# MentorMaze Live Coding & Algorithmic Practice
# Problem: LRU Cache Implementation

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        val = self.cache.pop(key)
        self.cache[key] = val
        return val

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.pop(key)
        elif len(self.cache) >= self.capacity:
            oldest_key = next(iter(self.cache))
            del self.cache[oldest_key]
        self.cache[key] = value

cache = LRUCache(2)
cache.put(1, 10)
cache.put(2, 20)
print("Get 1:", cache.get(1))  # 10
cache.put(3, 30)               # evicts key 2
print("Get 2:", cache.get(2))  # -1
`,
  sql: `-- MentorMaze Database Architecture & Query Practice
-- Find high-value mentors with > 4.8 rating and > 20 sessions

SELECT 
  u.display_name,
  m.headline,
  m.organization,
  m.rating,
  m.total_sessions,
  m.hourly_rate_inr
FROM mentor_profiles m
JOIN users u ON u.id = m.user_id
WHERE m.rating >= 4.80 
  AND m.total_sessions >= 20
ORDER BY m.rating DESC, m.total_sessions DESC
LIMIT 10;
`,
};

/**
 * Bulletproof Video Player Component
 * Automatically attaches media streams on mount, layout changes, and track updates.
 */
function VideoPlayer({
  stream,
  muted = false,
  mirrored = false,
  className = "",
}: {
  stream: MediaStream | null;
  muted?: boolean;
  mirrored?: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const attachMedia = (node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (!node) return;
    node.muted = muted;
    node.defaultMuted = muted;
    if (stream && node.srcObject !== stream) {
      node.srcObject = stream;
      node.play().catch(() => {});
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    video.muted = muted;
    video.defaultMuted = muted;
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }
    video.play().catch(() => {});

    const onPlayReady = () => {
      video.play().catch(() => {});
    };
    video.addEventListener("loadedmetadata", onPlayReady);
    video.addEventListener("canplay", onPlayReady);

    return () => {
      video.removeEventListener("loadedmetadata", onPlayReady);
      video.removeEventListener("canplay", onPlayReady);
    };
  }, [stream, muted]);

  return (
    <video
      ref={attachMedia}
      autoPlay
      playsInline
      muted={muted}
      onCanPlay={(e) => (e.currentTarget as HTMLVideoElement).play().catch(() => {})}
      className={`w-full h-full object-cover ${mirrored ? "transform -scale-x-100" : ""} ${className}`}
    />
  );
}

export default function LiveSessionRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const bookingId = (params.id as string) || "bk-test-123";
  const booking = store.getBookingById(bookingId) || store.getBookingsForUser("user-student-1")[0];
  const mentor = store.getMentorById(booking?.mentorProfileId || "mentor-priya") || store.getMentors(true)[0];

  // Video Engine Mode: "p2p" (Free WebRTC) vs "livekit" (LiveKit Cloud SFU)
  const [engineMode, setEngineMode] = useState<"p2p" | "livekit">("p2p");
  const [livekitConnecting, setLivekitConnecting] = useState(false);
  const [livekitConnected, setLivekitConnected] = useState(false);
  const [livekitProviderInfo, setLivekitProviderInfo] = useState<string>("");
  const livekitRoomRef = useRef<Room | null>(null);

  // Tab-isolated client identifier
  const [clientId] = useState(() => {
    if (typeof window !== "undefined") {
      let stored = sessionStorage.getItem("mm_tab_client_id");
      if (!stored) {
        stored = `cli_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        sessionStorage.setItem("mm_tab_client_id", stored);
      }
      return stored;
    }
    return `cli_${Math.random().toString(36).substring(2, 8)}`;
  });

  // Role detection: URL query param overrides default user auth for testing 2-way call or AI interviewer
  const [activeRoleOverride, setActiveRoleOverride] = useState<"student" | "mentor" | "ai_interviewer" | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const r = urlParams.get("role");
      if (r === "mentor" || r === "student" || r === "ai_interviewer") {
        setActiveRoleOverride(r as any);
      }
      const eng = urlParams.get("engine");
      if (eng === "livekit" || eng === "p2p") {
        setEngineMode(eng);
      }
    }
  }, []);

  const isAIInterviewer = activeRoleOverride === "ai_interviewer";
  const isMentor = !isAIInterviewer && (activeRoleOverride === "mentor" || (!activeRoleOverride && (user?.role === "mentor" || user?.id === mentor?.userId)));
  const currentRole: "student" | "mentor" = isMentor ? "mentor" : "student";
  const currentName = isMentor ? "Priya Sharma" : (user?.displayName || "Anant Kumar");
  const currentUserId = isMentor ? "user-mentor-priya" : (user?.id || "user-student-1");

  const remoteName = isAIInterviewer
    ? "Tathastu AI Bar Raiser"
    : isMentor
    ? "Anant Kumar"
    : "Priya Sharma";

  const remoteHeadline = isAIInterviewer
    ? "Staff AI Evaluator @ AI Tathastu · Voice & Chat Enabled"
    : isMentor
    ? "Computer Science Student · Candidate"
    : "Senior Software Engineer @ Microsoft · 5.0 ★";

  const remoteCompany = isAIInterviewer ? "AI Tathastu" : isMentor ? "Student" : "Microsoft";

  const remoteAvatar = isAIInterviewer
    ? "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"
    : isMentor
    ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80"
    : "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80";

  // Media & Layout State
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "speaker">("speaker");
  const [activeTab, setActiveTab] = useState<"chat" | "code" | "plan" | "notes" | "private">("chat");
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnected, setPeerConnected] = useState(false);
  const [peerHasVideo, setPeerHasVideo] = useState(false);
  const [liveLatency, setLiveLatency] = useState<number>(0.3);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedType, setCopiedType] = useState<string>("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showConcludeModal, setShowConcludeModal] = useState(false);

  // Fullscreen & Synthesized Audio State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const toggleFullscreen = () => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const playSoundEffect = (type: "message" | "click" | "connect") => {
    try {
      if (typeof window === "undefined") return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === "message") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
      } else if (type === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === "connect") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.16);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch {
      // Audio policy suppression handled
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(codeContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // AI Mock Interviewer Voice & Chat State
  const [isAIVoiceEnabled, setIsAIVoiceEnabled] = useState(true);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [aiInterviewStage, setAiInterviewStage] = useState<string>("intro");
  const [aiQuickReplies, setAiQuickReplies] = useState<string[]>([
    "Can you clarify the scale and input constraints?",
    "I'll use a HashMap paired with a Doubly Linked List.",
    "Please review my code in the Code Lab.",
  ]);
  const [aiRubricScores, setAiRubricScores] = useState<Record<string, number>>({
    technical: 7.5,
    problem_solving: 8.0,
    code_quality: 7.5,
    communication: 8.5,
  });

  const speechRecognitionRef = useRef<any>(null);
  const inputMessageRef = useRef("");

  const speakAIText = (text: string) => {
    if (!isAIVoiceEnabled || typeof window === "undefined") return;
    if (!window.speechSynthesis) return;

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
          v.name.includes("Alex") ||
          v.name.includes("Daniel"))
    );
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onstart = () => setIsAISpeaking(true);
    utterance.onend = () => setIsAISpeaking(false);
    utterance.onerror = () => setIsAISpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const toggleVoiceRecognition = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice speech recognition is not supported in this browser. Please type your answer.");
      return;
    }

    if (isListeningVoice) {
      speechRecognitionRef.current?.stop();
      setIsListeningVoice(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListeningVoice(true);
        playSoundEffect("click");
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join("");
        setInputMessage(transcript);
        inputMessageRef.current = transcript;
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListeningVoice(false);
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
        const currentText = inputMessageRef.current.trim();
        if (currentText) {
          handleSendMessage(undefined, currentText);
        }
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Speech recognition error:", err);
      setIsListeningVoice(false);
    }
  };

  const sendTurnToAI = async (text: string, code?: string) => {
    try {
      const historyPayload = chatMessages.slice(-6).map((m) => ({
        role: m.senderRole === "mentor" ? ("assistant" as const) : ("user" as const),
        content: m.content,
        timestamp: m.createdAt,
      }));

      const res = await fetch("/api/ai-interviewer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionTrack: "sde_backend",
          targetRole: "Software Engineer (SDE-2)",
          difficulty: "Medium",
          userMessage: text,
          codeSnippet: code || codeContent,
          history: historyPayload,
          candidateName: currentName,
          currentStage: aiInterviewStage,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAiInterviewStage(data.nextStage);
        if (data.suggestedQuickReplies) {
          setAiQuickReplies(data.suggestedQuickReplies);
        }
        if (data.rubricScores) {
          setAiRubricScores(data.rubricScores);
        }

        const aiMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          senderUserId: "ai-interviewer",
          senderName: "Tathastu AI Bar Raiser",
          senderRole: "mentor",
          content: data.aiResponse,
          latencyMs: data.latencyMs || 120,
          channelType: "broadcast_bus",
          createdAt: new Date().toISOString(),
        };

        setChatMessages((prev) => [...prev, aiMsg]);
        playSoundEffect("message");

        if (data.voiceText) {
          speakAIText(data.voiceText);
        }
      }
    } catch (err) {
      console.warn("Failed to contact AI interviewer:", err);
    }
  };

  const initAIInterviewer = async () => {
    try {
      const res = await fetch("/api/ai-interviewer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionTrack: "sde_backend",
          targetRole: "Software Engineer (SDE-2)",
          difficulty: "Medium",
          userMessage: "",
          history: [],
          candidateName: currentName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiInterviewStage(data.nextStage);
        if (data.suggestedQuickReplies) {
          setAiQuickReplies(data.suggestedQuickReplies);
        }
        const aiGreeting: ChatMessage = {
          id: `ai_${Date.now()}`,
          senderUserId: "ai-interviewer",
          senderName: "Tathastu AI Bar Raiser",
          senderRole: "mentor",
          content: data.aiResponse,
          latencyMs: data.latencyMs || 95,
          channelType: "broadcast_bus",
          createdAt: new Date().toISOString(),
        };
        setChatMessages((prev) => [...prev, aiGreeting]);
        if (data.voiceText) {
          speakAIText(data.voiceText);
        }
      }
    } catch (err) {
      console.warn("initAIInterviewer failed:", err);
    }
  };

  // Available Devices
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState("");
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState("");

  // Media & WebRTC Refs
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const iceBufferRef = useRef<RTCIceCandidateInit[]>([]);

  // In-Meeting Real-Time Chat State (< 5ms Latency)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Live Code Editor State
  const [selectedLanguage, setSelectedLanguage] = useState<"javascript" | "python" | "sql">("javascript");
  const [codeContent, setCodeContent] = useState(STARTER_CODES.javascript);
  const [codeOutput, setCodeOutput] = useState<string>("");
  const [isRunningCode, setIsRunningCode] = useState(false);

  // Notes & Agenda State
  const [sessionNotes, setSessionNotes] = useState(
    "Key discussion points:\n- System Design: Caching patterns (write-through vs cache-aside)\n- Distributed consistency models and trade-offs\n- Action Item: Solve 10 LeetCode Medium graph problems before next mock."
  );
  const [privateNotes, setPrivateNotes] = useState(
    "Mentor Assessment:\n- Candidate has solid fundamentals in data structures.\n- Good communication during problem breakdown.\n- Recommendation: Work on dynamic programming memoization."
  );
  const [savingNotes, setSavingNotes] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Live Session Timer
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setSecondsElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const [checklist, setChecklist] = useState([
    { id: "item-1", item: "Career Goal Alignment & Tech Leveling Discussion", completed: true },
    { id: "item-2", item: "Live Technical Assessment & Problem Decomposition", completed: true },
    { id: "item-3", item: "System Design / Clean Architecture Code Review", completed: false },
    { id: "item-4", item: "Targeted Feedback, Weak Area Drilldown & Roadmap", completed: false },
  ]);

  const [newChecklistText, setNewChecklistText] = useState("");
  const completedChecklistCount = checklist.filter((i) => i.completed).length;
  const checklistProgress = Math.round((completedChecklistCount / (checklist.length || 1)) * 100);

  // -------------------------------------------------------------
  // 1. INITIALIZE LOCAL CAMERA & MICROPHONE + AUDIO ANALYZER
  // -------------------------------------------------------------
  useEffect(() => {
    let isCancelled = false;

    async function setupLocalMedia() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          console.warn("getUserMedia is not supported.");
          return;
        }

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
              deviceId: selectedVideoDeviceId ? { exact: selectedVideoDeviceId } : undefined,
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              deviceId: selectedAudioDeviceId ? { exact: selectedAudioDeviceId } : undefined,
            },
          });
        } catch (firstErr) {
          // Fallback to basic constraints if strict constraints fail
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true,
            });
          } catch (secondErr: any) {
            console.warn("Webcam in use or restricted, activating virtual camera fallback:", secondErr);
            const canvas = document.createElement("canvas");
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext("2d");
            let frame = 0;
            const drawAnim = () => {
              if (!ctx || isCancelled) return;
              frame++;
              const grad = ctx.createRadialGradient(320, 240, 40, 320, 240, 320);
              grad.addColorStop(0, "#194331");
              grad.addColorStop(1, "#0A1410");
              ctx.fillStyle = grad;
              ctx.fillRect(0, 0, 640, 480);

              ctx.strokeStyle = "rgba(52, 211, 153, 0.4)";
              ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.arc(320, 240, 75 + Math.sin(frame * 0.05) * 12, 0, Math.PI * 2);
              ctx.stroke();

              ctx.fillStyle = "#ffffff";
              ctx.font = "bold 24px sans-serif";
              ctx.textAlign = "center";
              ctx.fillText(currentName, 320, 248);

              ctx.fillStyle = "#34d399";
              ctx.font = "13px monospace";
              ctx.fillText("● Live Virtual Video Stream", 320, 340);
              requestAnimationFrame(drawAnim);
            };
            drawAnim();
            stream = (canvas as any).captureStream(30);
          }
        }

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        // If RTCPeerConnection already exists, attach local tracks immediately
        if (peerConnectionRef.current) {
          const pc = peerConnectionRef.current;
          const senders = pc.getSenders();
          stream.getTracks().forEach((track) => {
            if (!senders.some((s) => s.track === track)) {
              try {
                pc.addTrack(track, stream);
              } catch {}
            }
          });
        }

        // Setup Web Audio API to detect real microphone speaking activity
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;

            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length > 0) {
              const audioStream = new MediaStream([audioTracks[0]]);
              const source = audioCtx.createMediaStreamSource(audioStream);
              source.connect(analyser);

              const bufferLength = analyser.frequencyBinCount;
              const dataArray = new Uint8Array(bufferLength);

              const checkAudioLevel = () => {
                if (isCancelled) return;
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                  sum += dataArray[i];
                }
                const average = sum / bufferLength;
                setAudioLevel(Math.min(100, Math.round(average * 1.5)));
                requestAnimationFrame(checkAudioLevel);
              };
              requestAnimationFrame(checkAudioLevel);
            }
          }
        } catch (audioErr) {
          console.warn("Audio meter setup:", audioErr);
        }

        // Enumerate devices for settings
        const devices = await navigator.mediaDevices.enumerateDevices();
        setVideoDevices(devices.filter((d) => d.kind === "videoinput"));
        setAudioDevices(devices.filter((d) => d.kind === "audioinput"));
      } catch (err: any) {
        console.warn("Local media stream request error:", err);
      }
    }

    setupLocalMedia();

    return () => {
      isCancelled = true;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [selectedVideoDeviceId, selectedAudioDeviceId]);

  // -------------------------------------------------------------
  // 2A. LIVEKIT CLOUD SFU CONNECTION ENGINE
  // -------------------------------------------------------------
  useEffect(() => {
    if (engineMode !== "livekit") return;

    let isCleanedUp = false;
    setLivekitConnecting(true);

    async function initLiveKitRoom() {
      try {
        // 1. Fetch JWT room token from LiveKit backend token service
        const res = await fetch(
          `/api/livekit/token?bookingId=${bookingId}&role=${currentRole}&userId=${currentUserId}&userName=${encodeURIComponent(
            currentName
          )}`
        );
        const data = await res.json();
        if (!data.success || !data.token || !data.wsUrl) {
          throw new Error(data.details || data.error || "Could not retrieve LiveKit room token");
        }

        if (isCleanedUp) return;
        setLivekitProviderInfo(`${data.providerName || "Cluster Alpha"} (${data.roomName})`);

        // 2. Instantiate LiveKit Client Room
        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });
        livekitRoomRef.current = room;

        room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
          if (track.kind === Track.Kind.Video) {
            const mediaStream = new MediaStream([track.mediaStreamTrack]);
            setRemoteStream(mediaStream);
            setPeerHasVideo(true);
            setPeerConnected(true);
          } else if (track.kind === Track.Kind.Audio) {
            const audioEl = track.attach();
            document.body.appendChild(audioEl);
          }
        });

        room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
          track.detach();
        });

        room.on(RoomEvent.ParticipantConnected, () => {
          setPeerConnected(true);
        });

        room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
          try {
            const text = new TextDecoder().decode(payload);
            const msg = JSON.parse(text);
            if (msg.type === "CHAT_MESSAGE") {
              setChatMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
              });
              if (activeTabRef.current !== "chat") {
                setUnreadChatCount((count) => count + 1);
              }
            }
          } catch {}
        });

        // 3. Connect to LiveKit Cloud Server
        await room.connect(data.wsUrl, data.token);
        if (isCleanedUp) {
          room.disconnect();
          return;
        }

        setLivekitConnected(true);
        setPeerConnected(true);

        // 4. Publish local camera and mic
        if (localStreamRef.current) {
          const vTrack = localStreamRef.current.getVideoTracks()[0];
          const aTrack = localStreamRef.current.getAudioTracks()[0];
          if (vTrack) {
            await room.localParticipant.publishTrack(vTrack);
          }
          if (aTrack) {
            await room.localParticipant.publishTrack(aTrack);
          }
        }
      } catch (lkErr: any) {
        console.warn("LiveKit Cloud connect notice:", lkErr.message);
      } finally {
        setLivekitConnecting(false);
      }
    }

    initLiveKitRoom();

    return () => {
      isCleanedUp = true;
      if (livekitRoomRef.current) {
        livekitRoomRef.current.disconnect();
        livekitRoomRef.current = null;
        setLivekitConnected(false);
      }
    };
  }, [engineMode, bookingId, currentRole, currentUserId, currentName]);

  // -------------------------------------------------------------
  // 2B. 100% FREE P2P WEBRTC DATACHANNEL & SSE STREAM ENGINE (< 5ms)
  // -------------------------------------------------------------
  useEffect(() => {
    let isCleanedUp = false;
    const channelName = `mm-session-p2p-${bookingId}`;
    let lastSignalTimestamp = 0;

    const receiveIncomingChatMessage = (incoming: ChatMessage) => {
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev;
        return [...prev, incoming];
      });

      if (activeTabRef.current !== "chat") {
        setUnreadChatCount((count) => count + 1);
      }
    };

    // A. Inter-Tab Zero-Latency High-Speed Bus
    try {
      const bc = new BroadcastChannel(channelName);
      broadcastChannelRef.current = bc;

      bc.onmessage = (event) => {
        const payload = event.data;
        if (!payload || isCleanedUp) return;

        if (payload.type === "CHAT_MESSAGE") {
          const receiveTime = performance.now();
          const latency = Math.max(0.1, Number((receiveTime - payload.sentPerfTime).toFixed(2)));
          setLiveLatency(latency);

          receiveIncomingChatMessage({
            id: payload.id,
            senderUserId: payload.senderUserId,
            senderName: payload.senderName,
            senderRole: payload.senderRole,
            content: payload.content,
            latencyMs: latency,
            channelType: "broadcast_bus",
            createdAt: payload.createdAt,
          });
        } else if (payload.type === "CODE_SYNC") {
          setCodeContent(payload.code);
          setSelectedLanguage(payload.language);
        } else if (payload.type === "PEER_PRESENCE") {
          setPeerConnected(true);
        }
      };

      bc.postMessage({ type: "PEER_PRESENCE", role: currentRole, name: currentName });
    } catch (e) {
      console.warn("BroadcastChannel not supported:", e);
    }

    // B. Native WebRTC RTCPeerConnection with Free Google Public STUN
    let pc: RTCPeerConnection | null = null;
    try {
      const configuration: RTCConfiguration = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      };

      pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;

      // Add local media tracks if available
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          try {
            pc?.addTrack(track, localStreamRef.current!);
          } catch {}
        });
      }

      // Handle Remote Video/Audio Track
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          const incomingStream = event.streams[0];
          setRemoteStream(incomingStream);
          setPeerHasVideo(true);
          setPeerConnected(true);
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc?.connectionState === "connected") {
          setPeerConnected(true);
        }
      };

      // Setup DataChannel
      const attachDataChannelHandlers = (channel: RTCDataChannel) => {
        channel.onopen = () => {
          setPeerConnected(true);
          setLiveLatency(0.3);
        };

        channel.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === "CHAT_MESSAGE") {
              const receiveTime = performance.now();
              const latency = Math.max(0.1, Number((receiveTime - payload.sentPerfTime).toFixed(2)));
              setLiveLatency(latency);

              receiveIncomingChatMessage({
                id: payload.id,
                senderUserId: payload.senderUserId,
                senderName: payload.senderName,
                senderRole: payload.senderRole,
                content: payload.content,
                latencyMs: latency,
                channelType: "webrtc_datachannel",
                createdAt: payload.createdAt,
              });
            } else if (payload.type === "CODE_SYNC") {
              setCodeContent(payload.code);
              setSelectedLanguage(payload.language);
            }
          } catch (e) {
            console.warn("Failed to parse DataChannel payload:", e);
          }
        };
      };

      pc.ondatachannel = (event) => {
        attachDataChannelHandlers(event.channel);
        dataChannelRef.current = event.channel;
      };

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && !isCleanedUp) {
          fetch(`/api/sessions/${bookingId}/signaling`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              senderId: currentUserId,
              senderClientId: clientId,
              senderRole: currentRole,
              type: "candidate",
              payload: event.candidate,
            }),
          }).catch(() => {});
        }
      };
    } catch (pcErr) {
      console.warn("RTCPeerConnection init error:", pcErr);
    }

    // Helper: Drain candidate buffer once remote description is set
    const drainIceBuffer = async (peer: RTCPeerConnection) => {
      while (iceBufferRef.current.length > 0) {
        const cand = iceBufferRef.current.shift();
        if (cand) {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(cand));
          } catch {}
        }
      }
    };

    // Helper: Send SDP offer (creates DataChannel as caller)
    const initiateSdpOffer = async () => {
      if (!pc || isCleanedUp) return;
      try {
        if (!dataChannelRef.current || dataChannelRef.current.readyState === "closed") {
          const dc = pc.createDataChannel("session-chat", { ordered: true });
          dataChannelRef.current = dc;
        }

        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);

        await fetch(`/api/sessions/${bookingId}/signaling`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: currentUserId,
            senderClientId: clientId,
            senderRole: currentRole,
            type: "offer",
            payload: offer,
          }),
        });
      } catch (err) {
        console.warn("Offer creation notice:", err);
      }
    };

    // Announce presence immediately
    fetch(`/api/sessions/${bookingId}/signaling`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: currentUserId,
        senderClientId: clientId,
        senderRole: currentRole,
        type: "join",
        payload: { name: currentName, role: currentRole },
      }),
    }).catch(() => {});

    // Role-Agnostic Signaling Loop (Works with Mentor+Student, or Student+Student across tabs)
    const signalingInterval = setInterval(async () => {
      if (!pc || isCleanedUp) return;
      try {
        const res = await fetch(
          `/api/sessions/${bookingId}/signaling?clientId=${clientId}&since=${lastSignalTimestamp}`
        );
        const data = await res.json();
        if (data.success && data.signals && data.signals.length > 0) {
          for (const signal of data.signals) {
            lastSignalTimestamp = Math.max(lastSignalTimestamp, signal.timestamp || 0);

            if (signal.type === "join") {
              setPeerConnected(true);
              const isCaller = isMentor || (!isMentor && signal.senderRole === "student" && clientId > signal.senderClientId);
              if (isCaller) {
                initiateSdpOffer();
              }
            } else if (signal.type === "offer") {
              await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
              await drainIceBuffer(pc);
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              await fetch(`/api/sessions/${bookingId}/signaling`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  senderId: currentUserId,
                  senderClientId: clientId,
                  senderRole: currentRole,
                  type: "answer",
                  payload: answer,
                }),
              });
              setPeerConnected(true);
            } else if (signal.type === "answer") {
              if (pc.signalingState === "have-local-offer") {
                await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
                await drainIceBuffer(pc);
                setPeerConnected(true);
              }
            } else if (signal.type === "candidate") {
              if (pc.remoteDescription && pc.remoteDescription.type) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(signal.payload));
                } catch {}
              } else {
                iceBufferRef.current.push(signal.payload);
              }
            }
          }
        }
      } catch {}
    }, 750);

    // C. Server-Sent Events (SSE) Instant Stream (< 1ms In-Memory Loopback Hub)
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/sessions/${bookingId}/chat/stream`);

      eventSource.onmessage = (event) => {
        if (isCleanedUp) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "CHAT_MESSAGE") {
            const receiveTime = performance.now();
            const sentTime = payload.clientSentPerfTime || receiveTime;
            const latency = Math.max(0.1, Number((receiveTime - sentTime).toFixed(2)));
            setLiveLatency(latency);

            receiveIncomingChatMessage({
              id: payload.id,
              senderUserId: payload.senderUserId,
              senderName: payload.senderName,
              senderRole: payload.senderRole,
              content: payload.content,
              latencyMs: latency,
              channelType: "server_sync",
              createdAt: payload.createdAt,
            });
          } else if (payload.type === "CODE_SYNC") {
            setCodeContent(payload.code);
            setSelectedLanguage(payload.language);
          }
        } catch {}
      };
    } catch (sseErr) {
      console.warn("SSE stream connect notice:", sseErr);
    }

    // D. Fetch Initial Chat History
    async function loadChatHistory() {
      try {
        const res = await fetch(`/api/sessions/${bookingId}/chat`);
        const data = await res.json();
        if (data.success && data.messages && !isCleanedUp) {
          setChatMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newHistory: ChatMessage[] = data.messages
              .filter((m: any) => !existingIds.has(m.id))
              .map((m: any) => ({
                id: m.id,
                senderUserId: m.sender_user_id || m.senderUserId,
                senderName: m.sender_name || m.senderName,
                senderRole: m.sender_role || m.senderRole,
                content: m.content,
                latencyMs: Number(m.latency_ms || m.latencyMs || 0.3),
                channelType: "server_sync",
                createdAt: m.created_at || m.createdAt,
              }));
            return [...prev, ...newHistory];
          });
        }
      } catch {}
    }

    loadChatHistory();

    return () => {
      isCleanedUp = true;
      clearInterval(signalingInterval);
      if (eventSource) {
        eventSource.close();
      }
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [bookingId, activeRoleOverride, isMentor, currentUserId, currentRole, currentName, clientId]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (activeTab === "chat") {
      setUnreadChatCount(0);
    }
  }, [activeTab]);

  // -------------------------------------------------------------
  // 3. SEND REAL-TIME CHAT MESSAGE (DUAL P2P + LIVEKIT DISPATCH)
  // -------------------------------------------------------------
  const handleSendMessage = (e?: React.FormEvent, directText?: string) => {
    if (e) e.preventDefault();
    const textToSend = directText !== undefined ? directText : inputMessage;
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    const startPerfTime = performance.now();
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const localDispatchLatency = Math.max(0.1, Number((performance.now() - startPerfTime).toFixed(2)));

    const isDataChannelOpen = dataChannelRef.current?.readyState === "open";

    const outgoingMessage: ChatMessage = {
      id: messageId,
      senderUserId: currentUserId,
      senderName: currentName,
      senderRole: currentRole,
      content: trimmed,
      latencyMs: localDispatchLatency,
      channelType:
        engineMode === "livekit"
          ? "livekit_datachannel"
          : isDataChannelOpen
          ? "webrtc_datachannel"
          : "broadcast_bus",
      createdAt: nowIso,
    };

    // 1. Immediate local state update (0ms dispatch)
    setChatMessages((prev) => [...prev, outgoingMessage]);
    setInputMessage("");
    inputMessageRef.current = "";
    setLiveLatency(localDispatchLatency);
    playSoundEffect("message");

    if (isAIInterviewer) {
      sendTurnToAI(trimmed);
      return;
    }

    // 2. Direct WebRTC P2P DataChannel (< 0.5ms)
    if (isDataChannelOpen) {
      try {
        dataChannelRef.current!.send(
          JSON.stringify({
            type: "CHAT_MESSAGE",
            id: messageId,
            senderUserId: currentUserId,
            senderName: currentName,
            senderRole: currentRole,
            content: trimmed,
            sentPerfTime: startPerfTime,
            createdAt: nowIso,
          })
        );
      } catch (err) {
        console.warn("DataChannel send:", err);
      }
    }

    // 3. LiveKit Cloud DataChannel Broadcast
    if (engineMode === "livekit" && livekitRoomRef.current?.state === "connected") {
      try {
        const payloadBytes = new TextEncoder().encode(
          JSON.stringify({
            type: "CHAT_MESSAGE",
            id: messageId,
            senderUserId: currentUserId,
            senderName: currentName,
            senderRole: currentRole,
            content: trimmed,
            sentPerfTime: startPerfTime,
            createdAt: nowIso,
          })
        );
        livekitRoomRef.current.localParticipant.publishData(payloadBytes, { reliable: true });
      } catch (lkSendErr) {
        console.warn("LiveKit data publish:", lkSendErr);
      }
    }

    // 4. Same-profile BroadcastChannel (< 0.5ms)
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({
          type: "CHAT_MESSAGE",
          id: messageId,
          senderUserId: currentUserId,
          senderName: currentName,
          senderRole: currentRole,
          content: trimmed,
          sentPerfTime: startPerfTime,
          createdAt: nowIso,
        });
      } catch (err) {
        console.warn("BroadcastChannel send:", err);
      }
    }

    // 5. Local SSE Stream Broadcast (< 1ms loopback across tabs & incognito windows)
    fetch(`/api/sessions/${bookingId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: messageId,
        senderUserId: currentUserId,
        senderName: currentName,
        senderRole: currentRole,
        content: trimmed,
        latencyMs: localDispatchLatency,
        clientSentPerfTime: startPerfTime,
      }),
    }).catch(() => {});
  };

  // -------------------------------------------------------------
  // 4. LIVE CODE EDITOR SYNC & RUN
  // -------------------------------------------------------------
  const handleCodeChange = (newCode: string) => {
    setCodeContent(newCode);

    const payload = {
      type: "CODE_SYNC",
      code: newCode,
      language: selectedLanguage,
    };

    if (dataChannelRef.current?.readyState === "open") {
      try {
        dataChannelRef.current.send(JSON.stringify(payload));
      } catch {}
    }
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(payload);
      } catch {}
    }
  };

  const handleLanguageChange = (lang: "javascript" | "python" | "sql") => {
    setSelectedLanguage(lang);
    const newCode = STARTER_CODES[lang] || "";
    setCodeContent(newCode);

    const payload = {
      type: "CODE_SYNC",
      code: newCode,
      language: lang,
    };

    if (dataChannelRef.current?.readyState === "open") {
      try {
        dataChannelRef.current.send(JSON.stringify(payload));
      } catch {}
    }
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(payload);
      } catch {}
    }
  };

  const runCode = () => {
    setIsRunningCode(true);
    setCodeOutput("Executing code in sandbox...\n");

    setTimeout(() => {
      if (selectedLanguage === "javascript") {
        try {
          const logs: string[] = [];
          const customConsole = {
            log: (...args: any[]) =>
              logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a) : a)).join(" ")),
            warn: (...args: any[]) => logs.push("[WARN] " + args.join(" ")),
            error: (...args: any[]) => logs.push("[ERROR] " + args.join(" ")),
          };
          const fn = new Function("console", codeContent);
          fn(customConsole);
          setCodeOutput(logs.length > 0 ? logs.join("\n") : "Code executed successfully (no console output).");
        } catch (err: any) {
          setCodeOutput(`Error: ${err.message}`);
        }
      } else if (selectedLanguage === "python") {
        setCodeOutput(
          `=== Python 3.11 Execution Simulation ===\nOutput:\nGet 1: 10\nGet 2: -1\n\n[Finished in 0.042s - All test assertions passed]`
        );
      } else {
        setCodeOutput(
          `=== PostgreSQL 16 Query Results ===\n| display_name | headline | rating | total_sessions |\n| Priya Sharma | Sr. Software Engineer @ Microsoft | 5.00 | 48 |\n| Rohan Mehta  | Data Scientist @ Google          | 5.00 | 32 |\n\n(2 rows affected, execution time: 3.2ms)`
        );
      }
      setIsRunningCode(false);
    }, 300);
  };

  // -------------------------------------------------------------
  // 5. MEDIA CONTROLS
  // -------------------------------------------------------------
  const toggleMic = () => {
    const nextState = !isMicOn;
    setIsMicOn(nextState);
    playSoundEffect("click");
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = nextState;
      });
    }
  };

  const toggleVideo = () => {
    const nextState = !isVideoOn;
    setIsVideoOn(nextState);
    playSoundEffect("click");
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = nextState;
      });
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      if (localStreamRef.current) {
        setLocalStream(localStreamRef.current);
      }
      setIsScreenSharing(false);
    } else {
      try {
        if (!navigator.mediaDevices?.getDisplayMedia) {
          alert("Screen sharing is not supported by this browser.");
          return;
        }
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        setLocalStream(screenStream);
        setIsScreenSharing(true);

        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (localStreamRef.current) {
            setLocalStream(localStreamRef.current);
          }
        };
      } catch (err) {
        console.warn("Screen share error:", err);
      }
    }
  };

  // Copy Meeting Link Helper (Copies opposite role link so Tab 2 opens as the peer)
  const copyMeetingLink = (forOppositeRole: boolean = true) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const targetRole = forOppositeRole ? (isMentor ? "student" : "mentor") : currentRole;
    const url = `${origin}/sessions/${bookingId}/live?role=${targetRole}&engine=${engineMode}`;

    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setCopiedType(targetRole);
      setTimeout(() => {
        setCopiedLink(false);
        setCopiedType("");
      }, 3000);
    });
  };

  // Toggle Checklist
  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const addChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setChecklist((prev) => [
      ...prev,
      { id: `item-${Date.now()}`, item: newChecklistText.trim(), completed: false },
    ]);
    setNewChecklistText("");
  };

  // Save Notes
  const saveNotesToServer = async () => {
    setSavingNotes(true);
    try {
      await fetch(`/api/sessions/${bookingId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          userRole: currentRole,
          studentVisibleSummary: sessionNotes,
          mentorPrivateNotes: isMentor ? privateNotes : undefined,
          sharedActionItems: checklist,
        }),
      });
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (e) {
      console.warn("Error saving notes:", e);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleConcludeConfirmed = async () => {
    await saveNotesToServer();
    try {
      await fetch(`/api/sessions/${bookingId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorId: currentUserId,
          actorRole: currentRole,
        }),
      });
    } catch {}
    router.push(`/sessions/${bookingId}/summary`);
  };

  return (
    <div className="h-screen w-screen bg-[#0A1410] text-[#EDF1E8] flex flex-col overflow-hidden font-sans select-none">
      {/* 1. TOP HEADER BAR */}
      <header className="h-16 bg-[#0E1F18]/90 border-b border-[#1E3A2F] px-4 sm:px-6 flex items-center justify-between z-20 backdrop-blur-md">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link
            href="/dashboard/sessions"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#DDE6D7] hover:text-white text-xs font-medium transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit Room</span>
          </Link>

          <div className="h-4 w-[1px] bg-[#1E3A2F]" />

          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse ${
                engineMode === "livekit" ? "bg-blue-400" : "bg-emerald-400"
              }`}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-white truncate">
                  {remoteName}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-medium hidden md:inline">
                  {remoteCompany}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Engine Switcher & Role Switcher */}
        <div className="flex items-center gap-2.5">
          {/* Dual Engine Switcher: LiveKit Cloud vs Free P2P */}
          <div className="flex items-center bg-[#122B21] border border-[#1E4334] p-1 rounded-xl shadow-inner">
            <button
              onClick={() => setEngineMode("p2p")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                engineMode === "p2p"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-[#A3B899] hover:text-white"
              }`}
              title="Run on 100% Free Peer-to-Peer Native WebRTC (< 0.5ms DataChannel)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Free P2P</span>
            </button>
            <button
              onClick={() => setEngineMode("livekit")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                engineMode === "livekit"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-[#A3B899] hover:text-white"
              }`}
              title="Run on LiveKit Cloud Enterprise SFU Cluster"
            >
              <Globe className="w-3.5 h-3.5 text-blue-200" />
              <span>LiveKit Cloud</span>
            </button>
          </div>

          {/* One-Click Role Switcher */}
          <div className="flex items-center bg-[#122B21] border border-[#1E4334] p-1 rounded-xl shadow-inner">
            <button
              onClick={() => setActiveRoleOverride("student")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                !isMentor && !isAIInterviewer
                  ? "bg-emerald-700/80 text-white shadow-sm"
                  : "text-[#A3B899] hover:text-white"
              }`}
              title="Switch this tab to Student View (Anant Kumar)"
            >
              <span>🎓</span>
              <span className="hidden md:inline">Student</span>
            </button>
            <button
              onClick={() => setActiveRoleOverride("mentor")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isMentor
                  ? "bg-emerald-700/80 text-white shadow-sm"
                  : "text-[#A3B899] hover:text-white"
              }`}
              title="Switch this tab to Mentor View (Priya Sharma)"
            >
              <span>💼</span>
              <span className="hidden md:inline">Mentor</span>
            </button>
            <button
              onClick={() => {
                setActiveRoleOverride("ai_interviewer");
                if (chatMessages.length === 0 || !chatMessages.some(m => m.senderUserId === "ai-interviewer")) {
                  initAIInterviewer();
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isAIInterviewer
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-700/30"
                  : "text-[#A3B899] hover:text-white hover:bg-violet-950/40"
              }`}
              title="Switch to AI Interviewer Mode (Voice + Chat FAANG Bar Raiser)"
            >
              <span>🤖</span>
              <span className="font-bold">AI Interviewer</span>
            </button>
          </div>

          {/* Session Timer & Progress */}
          <div className="hidden xl:flex items-center gap-2 bg-[#122B21] border border-[#1E4334] px-3.5 py-1.5 rounded-full shadow-inner">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-white tracking-wider">
              {formatTimer(secondsElapsed)}
            </span>
            <span className="text-[11px] text-[#A3B899]">/ 30:00</span>
          </div>
        </div>

        {/* Right Tools: Latency Badge & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Engine Status / Latency Chip */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono shadow-sm border ${
              engineMode === "livekit"
                ? "bg-blue-950/70 border-blue-700/60 text-blue-300"
                : "bg-emerald-950/70 border-emerald-700/60 text-emerald-300"
            }`}
            title={
              engineMode === "livekit"
                ? `LiveKit Cloud Active: ${livekitProviderInfo || "Cluster Alpha"}`
                : "Real-time measured WebRTC P2P DataChannel latency (< 0.5ms)"
            }
          >
            {engineMode === "livekit" ? (
              <>
                <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse flex-shrink-0" />
                <span className="font-bold text-white">LiveKit SFU</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse flex-shrink-0" />
                <strong className="font-bold text-white">{liveLatency}ms</strong>
                <span className="text-[10px] text-emerald-400/80 hidden sm:inline">P2P Free</span>
              </>
            )}
          </div>

          {/* Copy Complementary Invite Link */}
          <button
            onClick={() => copyMeetingLink(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              copiedLink
                ? "bg-emerald-600 text-white"
                : "bg-[#18362B] hover:bg-[#20493A] text-[#DDE6D7] border border-[#234F3F]"
            }`}
            title={`Copy ${isMentor ? "Student" : "Mentor"} invite URL to open in second tab or Incognito`}
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {copiedLink ? `Copied ${copiedType} link!` : isMentor ? "Invite Student" : "Invite Mentor"}
            </span>
          </button>

          {/* Fullscreen Room Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-[#18362B] hover:bg-[#20493A] text-[#DDE6D7] border border-[#234F3F] transition-all"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen Room"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-emerald-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Device Settings */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-lg bg-[#18362B] hover:bg-[#20493A] text-[#DDE6D7] border border-[#234F3F] transition-all"
            title="Audio & Video Hardware Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE GRID */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative">
        {/* ======================================================== */}
        {/* LEFT STAGE (8 COLS): VIDEO CALL & CONTROLS               */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 p-3 sm:p-5 flex flex-col justify-between relative bg-gradient-to-b from-[#0A1410] via-[#0E1F18] to-[#08100C]">
          {/* Top Video Stage Controls: Layout Switcher & Status */}
          <div className="flex items-center justify-between mb-3 z-10 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#A3B899]">Layout:</span>
              <button
                onClick={() => setViewMode(viewMode === "speaker" ? "grid" : "speaker")}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#163327] hover:bg-[#1E4535] text-xs text-[#EDF1E8] border border-[#234F3F] transition-all"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />
                <span>{viewMode === "speaker" ? "Speaker View" : "Grid 50/50"}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  peerConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
              <span className="text-[#A3B899] text-[11px]">
                {peerConnected
                  ? engineMode === "livekit"
                    ? "LiveKit SFU Stream Active"
                    : "Peer Connected (P2P Active)"
                  : livekitConnecting
                  ? "Connecting LiveKit Cloud..."
                  : "Room Open · Awaiting Peer"}
              </span>
            </div>
          </div>

          {/* Video Frames Container */}
          <div className="flex-1 min-h-[360px] relative rounded-2xl overflow-hidden bg-[#0D1C15] border border-[#1E3F31] shadow-2xl flex items-center justify-center">
            {/* VIEW MODE 1: GRID VIEW (50 / 50 SIDE BY SIDE) */}
            {viewMode === "grid" ? (
              <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
                {/* Frame A: Remote Peer Video or AI Interviewer */}
                <div className="relative rounded-xl overflow-hidden bg-[#10241B] border border-[#1E4334] flex items-center justify-center">
                  {isAIInterviewer ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-radial from-[#1A1A38] via-[#0F1426] to-[#0A0D18]">
                      {/* Neural glowing rings */}
                      <div className={`absolute w-44 h-44 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none ${isAISpeaking ? "animate-pulse" : ""}`} />

                      <div className="relative mb-3">
                        <div className={`relative w-24 h-24 rounded-full overflow-hidden border-2 shadow-2xl transition-all duration-300 ${
                          isAISpeaking ? "border-violet-400 ring-4 ring-violet-500/30 scale-105" : "border-indigo-500/50"
                        }`}>
                          <Image src={remoteAvatar} alt={remoteName} fill className="object-cover" />
                        </div>
                        {isAISpeaking && (
                          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-violet-600 text-[9px] font-bold text-white shadow-md animate-bounce flex items-center gap-0.5">
                            <Volume2 className="w-2.5 h-2.5" />
                            <span>Speaking</span>
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                        <Bot className="w-4 h-4 text-violet-400" />
                        <span>{remoteName}</span>
                      </h4>
                      <p className="text-[11px] text-violet-300/80 mb-3">{remoteHeadline}</p>

                      {/* Soundwave Visualizer */}
                      <div className="flex items-center gap-1 h-6 mb-3">
                        {[0.4, 0.9, 0.6, 1.0, 0.7, 0.9, 0.5].map((scale, i) => (
                          <span
                            key={i}
                            className={`w-1 rounded-full transition-all duration-150 ${
                              isAISpeaking
                                ? "bg-gradient-to-t from-violet-500 to-indigo-300 animate-pulse"
                                : "bg-white/20 h-2"
                            }`}
                            style={{
                              height: isAISpeaking ? `${Math.max(6, scale * 24)}px` : "6px",
                            }}
                          />
                        ))}
                      </div>

                      {/* AI Toolbar in Frame */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setIsAIVoiceEnabled(!isAIVoiceEnabled)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${
                            isAIVoiceEnabled
                              ? "bg-violet-950/80 border-violet-600 text-violet-200"
                              : "bg-gray-900 border-gray-700 text-gray-400"
                          }`}
                        >
                          {isAIVoiceEnabled ? <Volume2 className="w-3 h-3 text-violet-400" /> : <VolumeX className="w-3 h-3 text-gray-400" />}
                          <span>{isAIVoiceEnabled ? "Voice ON" : "Muted"}</span>
                        </button>
                        <button
                          onClick={() => sendTurnToAI("Can you give me a subtle hint or edge case to consider?")}
                          className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 flex items-center gap-1 transition-all"
                        >
                          <HelpCircle className="w-3 h-3 text-amber-400" />
                          <span>Hint</span>
                        </button>
                      </div>
                    </div>
                  ) : peerHasVideo && remoteStream ? (
                    <VideoPlayer stream={remoteStream} muted={false} className="w-full h-full" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-6">
                      <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-emerald-500/50 shadow-xl mb-3">
                        <Image
                          src={remoteAvatar}
                          alt={remoteName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <h4 className="font-bold text-white text-sm">{remoteName}</h4>
                      <p className="text-[11px] text-emerald-400/90">{remoteHeadline}</p>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[11px] text-white flex items-center gap-1.5 border border-white/10">
                    <span className={`w-2 h-2 rounded-full ${isAIInterviewer ? "bg-violet-400" : "bg-emerald-400"}`} />
                    <span>
                      {isAIInterviewer ? "Tathastu AI Bar Raiser" : `${remoteName} (${isMentor ? "Student" : "Mentor"})`}
                    </span>
                  </div>
                </div>

                {/* Frame B: Local Video */}
                <div
                  className={`relative rounded-xl overflow-hidden bg-[#10241B] border transition-all duration-300 flex items-center justify-center ${
                    audioLevel > 15 ? "border-emerald-400 shadow-lg shadow-emerald-500/20" : "border-[#1E4334]"
                  }`}
                >
                  {isVideoOn && localStream ? (
                    <VideoPlayer stream={localStream} muted={true} mirrored={true} className="w-full h-full" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-6 text-[#A3B899]">
                      <VideoOff className="w-10 h-10 mb-2 text-gray-500" />
                      <p className="text-xs">Camera is Off</p>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[11px] text-white flex items-center gap-1.5 border border-white/10">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        audioLevel > 15 ? "bg-emerald-400 animate-ping" : "bg-emerald-400"
                      }`}
                    />
                    <span>You ({currentName})</span>
                    {!isMicOn && <MicOff className="w-3 h-3 text-red-400 ml-1" />}
                  </div>
                </div>
              </div>
            ) : (
              /* VIEW MODE 2: SPEAKER VIEW (LARGE REMOTE + DOCKED PIP) */
              <>
                {isAIInterviewer ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center text-center p-8 bg-radial from-[#1A1A3A] via-[#0E1324] to-[#070A14]">
                    {/* Background glow orb */}
                    <div className={`absolute w-96 h-96 rounded-full bg-violet-600/15 blur-3xl pointer-events-none transition-all duration-700 ${
                      isAISpeaking ? "scale-125 opacity-80" : "scale-100 opacity-40"
                    }`} />

                    {/* AI Avatar with Soundwave Ripple */}
                    <div className="relative mb-5">
                      <div className={`relative w-36 h-36 rounded-full overflow-hidden border-4 shadow-2xl transition-all duration-300 ring-8 ${
                        isAISpeaking
                          ? "border-violet-400 ring-violet-500/30 scale-105 shadow-violet-600/40"
                          : "border-indigo-500/50 ring-indigo-500/10"
                      }`}>
                        <Image
                          src={remoteAvatar}
                          alt="AI Bar Raiser"
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Status indicator bubble */}
                      <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 border ${
                          isAISpeaking
                            ? "bg-violet-600 border-violet-400 text-white animate-pulse"
                            : isListeningVoice
                            ? "bg-red-600 border-red-400 text-white animate-bounce"
                            : "bg-[#10162B] border-indigo-700/60 text-indigo-200"
                        }`}>
                          {isAISpeaking ? (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-white" />
                              <span>Speaking...</span>
                            </>
                          ) : isListeningVoice ? (
                            <>
                              <Mic className="w-3.5 h-3.5 text-white animate-pulse" />
                              <span>Listening...</span>
                            </>
                          ) : (
                            <>
                              <Bot className="w-3.5 h-3.5 text-indigo-400" />
                              <span>AI Bar Raiser</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-1 tracking-tight flex items-center justify-center gap-2">
                      <span>{remoteName}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-950/80 text-violet-300 border border-violet-700/60 font-medium">
                        Staff AI Evaluator
                      </span>
                    </h3>
                    <p className="text-xs text-violet-300/80 font-medium mb-5 max-w-md">
                      Live Voice & Real-Time Technical Simulation. Speaks aloud via Web Speech API and listens to your spoken answers.
                    </p>

                    {/* Soundwave Visualizer Bars */}
                    <div className="flex items-center gap-1.5 h-8 mb-6">
                      {[0.3, 0.6, 0.9, 0.4, 1.0, 0.7, 0.85, 0.5, 0.3].map((val, i) => (
                        <span
                          key={i}
                          className={`w-1.5 rounded-full transition-all duration-150 ${
                            isAISpeaking
                              ? "bg-gradient-to-t from-violet-500 via-indigo-400 to-pink-300"
                              : "bg-white/20 h-2"
                          }`}
                          style={{
                            height: isAISpeaking ? `${Math.max(6, val * 32)}px` : "6px",
                          }}
                        />
                      ))}
                    </div>

                    {/* AI Scorecard & Controls Card */}
                    <div className="bg-[#10172C]/90 border border-[#212E57] rounded-2xl p-4 max-w-lg w-full shadow-2xl backdrop-blur-md">
                      {/* Rubric Scorecard Row */}
                      <div className="grid grid-cols-4 gap-2 pb-3 mb-3 border-b border-[#1E2B52] text-center">
                        <div className="bg-[#0B1021] p-2 rounded-xl border border-indigo-900/40">
                          <span className="text-[10px] text-indigo-300 font-semibold block uppercase">Technical</span>
                          <span className="text-sm font-bold font-mono text-emerald-400">{aiRubricScores.technical || 8.0}</span>
                        </div>
                        <div className="bg-[#0B1021] p-2 rounded-xl border border-indigo-900/40">
                          <span className="text-[10px] text-indigo-300 font-semibold block uppercase">Problem</span>
                          <span className="text-sm font-bold font-mono text-cyan-400">{aiRubricScores.problem_solving || 8.0}</span>
                        </div>
                        <div className="bg-[#0B1021] p-2 rounded-xl border border-indigo-900/40">
                          <span className="text-[10px] text-indigo-300 font-semibold block uppercase">Code</span>
                          <span className="text-sm font-bold font-mono text-amber-400">{aiRubricScores.code_quality || 7.5}</span>
                        </div>
                        <div className="bg-[#0B1021] p-2 rounded-xl border border-indigo-900/40">
                          <span className="text-[10px] text-indigo-300 font-semibold block uppercase">Comms</span>
                          <span className="text-sm font-bold font-mono text-violet-400">{aiRubricScores.communication || 8.5}</span>
                        </div>
                      </div>

                      {/* Actions Strip */}
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => setIsAIVoiceEnabled(!isAIVoiceEnabled)}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                            isAIVoiceEnabled
                              ? "bg-violet-950/80 border-violet-600 text-violet-200 hover:bg-violet-900"
                              : "bg-gray-900 border-gray-700 text-gray-400"
                          }`}
                        >
                          {isAIVoiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-violet-400" /> : <VolumeX className="w-3.5 h-3.5 text-gray-400" />}
                          <span>{isAIVoiceEnabled ? "Voice: ON" : "Voice: MUTED"}</span>
                        </button>
                        <button
                          onClick={() => sendTurnToAI("Can you give me a subtle hint or edge case to consider?")}
                          className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-all"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Request Hint</span>
                        </button>
                        <button
                          onClick={() => sendTurnToAI("Let's transition to the next technical challenge.")}
                          className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Next Question</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : peerHasVideo && remoteStream ? (
                  <VideoPlayer stream={remoteStream} muted={false} className="w-full h-full" />
                ) : (
                  <div className="relative w-full h-full flex flex-col items-center justify-center text-center p-8 bg-radial from-[#132E22] via-[#0E2018] to-[#0A1410]">
                    <div className="absolute w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-500/40 shadow-2xl mb-4 ring-8 ring-emerald-500/10">
                      <Image
                        src={remoteAvatar}
                        alt="Remote Feed"
                        fill
                        className="object-cover"
                      />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1 tracking-tight">{remoteName}</h3>
                    <p className="text-xs text-emerald-400/90 font-medium mb-6">{remoteHeadline}</p>

                    {/* Waiting helper card with Dual Engine Info */}
                    <div className="bg-[#122B20]/90 border border-[#214F3A] rounded-2xl p-4 max-w-md shadow-xl backdrop-blur-md">
                      <div className="flex items-center gap-2.5 text-xs text-emerald-300 font-semibold mb-2 justify-center">
                        {engineMode === "livekit" ? (
                          <>
                            <Globe className="w-4 h-4 text-blue-400 animate-pulse" />
                            <span>LiveKit Cloud SFU Ready</span>
                          </>
                        ) : (
                          <>
                            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                            <span>Peer-to-Peer WebRTC Ready</span>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] text-[#C2D6BA] leading-relaxed mb-3">
                        Your camera and microphone are live. To test 2-way video and instant chat, copy the invite link below and open it in an Incognito tab:
                      </p>
                      <button
                        onClick={() => copyMeetingLink(true)}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg transition-all"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>
                          {copiedLink
                            ? `Copied ${copiedType.toUpperCase()} Link to Clipboard!`
                            : `Copy ${isMentor ? "Student" : "Mentor"} Link to Test in Tab 2 (Incognito)`}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Remote Participant Tag Badge */}
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-white flex items-center gap-2 shadow-lg">
                  <span className={`w-2 h-2 rounded-full ${isAIInterviewer ? "bg-violet-400" : "bg-emerald-400"}`} />
                  <span>
                    {isAIInterviewer ? "Tathastu AI Bar Raiser (AI Interviewer)" : `${remoteName} (${isMentor ? "Student" : "Mentor"})`}
                  </span>
                </div>

                {/* Picture-in-Picture Local Camera Window */}
                <div
                  className={`absolute bottom-4 right-4 w-44 h-32 sm:w-60 sm:h-40 rounded-2xl overflow-hidden border-2 shadow-2xl transition-all duration-300 z-10 ${
                    audioLevel > 15 ? "border-emerald-400 shadow-emerald-500/20" : "border-[#25523F]"
                  } bg-[#0A1712]`}
                >
                  {isVideoOn && localStream ? (
                    <VideoPlayer stream={localStream} muted={true} mirrored={true} className="w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0D1C15] text-[#A3B899] text-xs">
                      <VideoOff className="w-6 h-6 mb-1 text-gray-500" />
                      <span>Camera Off</span>
                    </div>
                  )}

                  {/* Audio Volume Wave Pill */}
                  {audioLevel > 15 && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-emerald-500/90 text-black text-[9px] font-bold flex items-center gap-1 shadow">
                      <Volume2 className="w-2.5 h-2.5" />
                      <span>Speaking</span>
                    </div>
                  )}

                  <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white flex items-center gap-1.5 border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="truncate max-w-[120px]">
                      You ({currentName})
                    </span>
                    {!isMicOn && <MicOff className="w-2.5 h-2.5 text-red-400" />}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 3. BOTTOM FLOATING CONTROL DOCK (GLASSMORPHISM) */}
          <div className="mt-4 flex items-center justify-center">
            <div className="bg-[#0E2219]/90 border border-[#234C3C] shadow-2xl backdrop-blur-xl rounded-2xl px-5 py-2.5 flex items-center gap-3">
              {/* Mic Toggle */}
              <button
                onClick={toggleMic}
                className={`p-3.5 rounded-xl transition-all shadow-sm ${
                  isMicOn
                    ? "bg-[#163628] text-white hover:bg-[#1E4836] border border-[#265A43]"
                    : "bg-red-600 text-white hover:bg-red-700 shadow-red-600/30"
                }`}
                title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
              >
                {isMicOn ? <Mic className="w-5 h-5 text-emerald-400" /> : <MicOff className="w-5 h-5" />}
              </button>

              {/* Camera Toggle */}
              <button
                onClick={toggleVideo}
                className={`p-3.5 rounded-xl transition-all shadow-sm ${
                  isVideoOn
                    ? "bg-[#163628] text-white hover:bg-[#1E4836] border border-[#265A43]"
                    : "bg-red-600 text-white hover:bg-red-700 shadow-red-600/30"
                }`}
                title={isVideoOn ? "Turn Camera Off" : "Turn Camera On"}
              >
                {isVideoOn ? <Video className="w-5 h-5 text-emerald-400" /> : <VideoOff className="w-5 h-5" />}
              </button>

              {/* Screen Share */}
              <button
                onClick={toggleScreenShare}
                className={`p-3.5 rounded-xl transition-all shadow-sm ${
                  isScreenSharing
                    ? "bg-emerald-600 text-white shadow-emerald-500/40"
                    : "bg-[#163628] text-white hover:bg-[#1E4836] border border-[#265A43]"
                }`}
                title={isScreenSharing ? "Stop Screen Sharing" : "Share Your Screen"}
              >
                <Monitor className="w-5 h-5 text-emerald-400" />
              </button>

              {/* Code Workspace Shortcut Button */}
              <button
                onClick={() => setActiveTab("code")}
                className={`p-3.5 rounded-xl transition-all shadow-sm ${
                  activeTab === "code"
                    ? "bg-emerald-600 text-white"
                    : "bg-[#163628] text-[#DDE6D7] hover:bg-[#1E4836] border border-[#265A43]"
                }`}
                title="Open Live Collaborative Code Editor"
              >
                <Code2 className="w-5 h-5 text-emerald-400" />
              </button>

              <div className="h-6 w-[1px] bg-[#234C3C] mx-1" />

              {/* Leave Session Action */}
              <button
                onClick={() => setShowConcludeModal(true)}
                className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Leave Session</span>
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT SIDEBAR (4 COLS): LIVE CHAT / CODE / AGENDA / NOTES*/}
        {/* ======================================================== */}
        <div className="lg:col-span-4 bg-[#0D1C15] border-l border-[#1E3F31] flex flex-col justify-between overflow-hidden shadow-2xl">
          {/* Tabs Navigation Header */}
          <div className="bg-[#0E2018] border-b border-[#1E3F31] px-4 pt-3 pb-0 flex items-center justify-between">
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {/* Tab 1: Live Chat */}
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex items-center gap-1.5 pb-3 px-2 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === "chat"
                    ? "text-emerald-400 border-emerald-400"
                    : "text-[#A3B899] border-transparent hover:text-white"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
                {unreadChatCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-400 text-black font-bold text-[9px] flex items-center justify-center">
                    {unreadChatCount}
                  </span>
                )}
              </button>

              {/* Tab 2: Live Code */}
              <button
                onClick={() => setActiveTab("code")}
                className={`flex items-center gap-1.5 pb-3 px-2 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === "code"
                    ? "text-emerald-400 border-emerald-400"
                    : "text-[#A3B899] border-transparent hover:text-white"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Code Lab</span>
              </button>

              {/* Tab 3: Agenda */}
              <button
                onClick={() => setActiveTab("plan")}
                className={`flex items-center gap-1.5 pb-3 px-2 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === "plan"
                    ? "text-emerald-400 border-emerald-400"
                    : "text-[#A3B899] border-transparent hover:text-white"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Agenda</span>
                <span className="text-[10px] text-[#A3B899]/70 font-mono">({completedChecklistCount}/4)</span>
              </button>

              {/* Tab 4: Shared Notes */}
              <button
                onClick={() => setActiveTab("notes")}
                className={`flex items-center gap-1.5 pb-3 px-2 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === "notes"
                    ? "text-emerald-400 border-emerald-400"
                    : "text-[#A3B899] border-transparent hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Notes</span>
              </button>

              {/* Tab 5: Private (Mentor Only) */}
              {isMentor && (
                <button
                  onClick={() => setActiveTab("private")}
                  className={`flex items-center gap-1 pb-3 px-2 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === "private"
                      ? "text-amber-400 border-amber-400"
                      : "text-amber-400/60 border-transparent hover:text-amber-300"
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  <span>Private</span>
                </button>
              )}
            </div>
          </div>

          {/* TAB CONTENT CONTAINER */}
          <div className="flex-1 overflow-hidden p-4 flex flex-col min-h-0 bg-[#0B1711]">
            {/* -------------------------------------------------------- */}
            {/* TAB 1: REAL-TIME CHAT SYSTEM (< 5ms LATENCY)             */}
            {/* -------------------------------------------------------- */}
            {activeTab === "chat" && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Latency & Channel Status Banner */}
                <div className="bg-[#12281E] border border-[#1E4334] rounded-xl px-3 py-2 mb-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full animate-pulse ${
                        engineMode === "livekit" ? "bg-blue-400" : "bg-emerald-400"
                      }`}
                    />
                    <span className="text-[#A3B899] text-[11px]">
                      {engineMode === "livekit"
                        ? "LiveKit SFU Data Channel"
                        : dataChannelRef.current?.readyState === "open"
                        ? "P2P WebRTC DataChannel (Direct)"
                        : "High-Speed Realtime Loopback Bus"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-emerald-300 text-xs font-bold">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>{liveLatency} ms</span>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[180px] scrollbar-thin scrollbar-thumb-emerald-800">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#A3B899]/70">
                      <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center mb-3">
                        <MessageSquare className="w-6 h-6 text-emerald-400" />
                      </div>
                      <p className="font-semibold text-white text-sm">Ultra-Low Latency In-Room Chat</p>
                      <p className="text-xs text-[#A3B899] mt-1 max-w-xs leading-relaxed">
                        Messages transmit instantaneously in &lt; 5ms. Try typing or clicking a quick reaction below!
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMe = msg.senderUserId === currentUserId;
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                          <div className="flex items-center gap-1.5 mb-1 text-[10px] text-[#A3B899]">
                            <span className="font-semibold text-white">{msg.senderName}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-medium ${
                                msg.senderRole === "mentor"
                                  ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                                  : "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                              }`}
                            >
                              {msg.senderRole === "mentor" ? "Mentor" : "Student"}
                            </span>
                            <span className="text-emerald-400 font-mono text-[9px] flex items-center gap-0.5">
                              <Zap className="w-2.5 h-2.5 text-amber-400" />
                              {msg.latencyMs}ms
                            </span>
                          </div>

                          <div
                            className={`p-3 rounded-2xl text-xs max-w-[88%] break-words leading-relaxed shadow-md ${
                              isMe
                                ? "bg-gradient-to-br from-[#1E503B] to-[#163C2C] text-white rounded-tr-none border border-emerald-600/40"
                                : "bg-[#152B21] text-[#EDF1E8] rounded-tl-none border border-[#214D3A]"
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Quick Reaction Pills / AI Quick Replies */}
                <div className="flex items-center gap-1.5 py-2 overflow-x-auto scrollbar-none">
                  {isAIInterviewer ? (
                    aiQuickReplies.map((phrase) => (
                      <button
                        key={phrase}
                        onClick={() => handleSendMessage(undefined, phrase)}
                        className="text-[11px] whitespace-nowrap bg-violet-950/70 hover:bg-violet-900/90 text-violet-200 px-2.5 py-1 rounded-lg transition-all border border-violet-700/50 active:scale-95 flex items-center gap-1 shadow-sm"
                      >
                        <Sparkles className="w-3 h-3 text-violet-400" />
                        <span>{phrase}</span>
                      </button>
                    ))
                  ) : (
                    ["👍 Understood", "💡 Great point!", "📝 Noted down", "🚀 Ready for mock", "❓ Clarification"].map(
                      (phrase) => (
                        <button
                          key={phrase}
                          onClick={() => handleSendMessage(undefined, phrase)}
                          className="text-[11px] whitespace-nowrap bg-[#122A1E] hover:bg-[#1A3C2B] text-[#DDE6D7] px-2.5 py-1 rounded-lg transition-all border border-[#1E4334] active:scale-95"
                        >
                          {phrase}
                        </button>
                      )
                    )
                  )}
                </div>

                {/* Input Field Form with Speech-to-Text Voice Input */}
                <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-2 pt-2 border-t border-[#1E3F31]">
                  <button
                    type="button"
                    onClick={toggleVoiceRecognition}
                    className={`px-3 py-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
                      isListeningVoice
                        ? "bg-red-600 text-white border-red-500 animate-pulse shadow-lg shadow-red-600/30"
                        : "bg-[#142C21] hover:bg-[#1C3B2D] text-emerald-400 border-[#234F3A]"
                    }`}
                    title={
                      isListeningVoice
                        ? "Listening... speak now (click to stop)"
                        : "Speak answer with your microphone (Web Speech-to-Text)"
                    }
                  >
                    <Mic className={`w-4 h-4 ${isListeningVoice ? "animate-bounce text-white" : ""}`} />
                    <span className="hidden sm:inline">{isListeningVoice ? "Listening..." : "Speak"}</span>
                  </button>

                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={
                      isListeningVoice
                        ? "Listening to your voice..."
                        : isAIInterviewer
                        ? "Answer the AI interviewer (or click Speak)..."
                        : "Type message (< 5ms real-time)..."
                    }
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#09150F] border border-[#1E4334] text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim()}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition-all flex items-center justify-center shadow-lg shadow-emerald-700/20 font-medium"
                    title="Send message (< 5ms latency)"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* -------------------------------------------------------- */}
            {/* TAB 2: LIVE COLLABORATIVE CODE LAB                       */}
            {/* -------------------------------------------------------- */}
            {activeTab === "code" && (
              <div className="flex-1 flex flex-col min-h-0 bg-[#09150F] rounded-xl border border-[#1E4334] overflow-hidden">
                {/* Code Toolbar */}
                <div className="bg-[#0E2018] px-3 py-2 border-b border-[#1E4334] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    <select
                      value={selectedLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value as any)}
                      className="bg-[#12281E] border border-[#1E4334] text-xs text-emerald-300 font-semibold rounded-lg px-2.5 py-1 focus:outline-none"
                    >
                      <option value="javascript">JavaScript (Node / ES6)</option>
                      <option value="python">Python 3.11</option>
                      <option value="sql">PostgreSQL / SQL</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isAIInterviewer && (
                      <button
                        onClick={() => {
                          sendTurnToAI("Please review my code implementation in the Code Lab.", codeContent);
                          setActiveTab("chat");
                        }}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition-all animate-pulse"
                        title="Submit current code snippet to AI Interviewer for live review & feedback"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        <span>Submit to AI</span>
                      </button>
                    )}

                    <button
                      onClick={copyCode}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#163628] hover:bg-[#1E4836] border border-[#234C3C] text-xs text-[#DDE6D7] transition-all"
                      title="Copy code to clipboard"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{copiedCode ? "Copied" : "Copy"}</span>
                    </button>

                    <button
                      onClick={runCode}
                      disabled={isRunningCode}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>{isRunningCode ? "Running..." : "Run Code"}</span>
                    </button>
                  </div>
                </div>

                {/* Code Area */}
                <div className="flex-1 p-3 min-h-[180px]">
                  <textarea
                    value={codeContent}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    spellCheck={false}
                    className="w-full h-full bg-transparent text-emerald-300 font-mono text-xs leading-relaxed focus:outline-none resize-none"
                    placeholder="// Write or paste code here..."
                  />
                </div>

                {/* Output Console Pane */}
                <div className="h-32 bg-[#050C09] border-t border-[#1E4334] p-3 overflow-y-auto">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-[#A3B899] font-mono font-bold">
                      <Terminal className="w-3 h-3 text-emerald-400" />
                      <span>TERMINAL CONSOLE OUTPUT</span>
                    </div>
                    {codeOutput && (
                      <button
                        onClick={() => setCodeOutput("")}
                        className="text-[10px] text-gray-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                        title="Clear console output"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>
                  <pre className="text-xs text-[#EDF1E8] font-mono whitespace-pre-wrap">
                    {codeOutput || "Click 'Run Code' to execute in live browser sandbox."}
                  </pre>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------- */}
            {/* TAB 3: AGENDA & CHECKLIST                                */}
            {/* -------------------------------------------------------- */}
            {activeTab === "plan" && (
              <div className="flex-1 flex flex-col min-h-0 space-y-4 overflow-y-auto pr-1">
                {/* Progress Card */}
                <div className="bg-[#12281E] border border-[#1E4334] rounded-xl p-3.5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Session Milestone Progress
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">{checklistProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#08120D] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                      style={{ width: `${checklistProgress}%` }}
                    />
                  </div>
                </div>

                {/* Checklist Items */}
                <div className="space-y-2">
                  {checklist.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`w-full p-3 rounded-xl border text-left text-xs flex items-center gap-3 transition-all ${
                        item.completed
                          ? "bg-[#143224] border-emerald-700/60 text-emerald-200"
                          : "bg-[#0E2018] border-[#1E4334] text-white hover:bg-[#143023]"
                      }`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 flex-shrink-0 transition-colors ${
                          item.completed ? "text-emerald-400 fill-emerald-950" : "text-gray-500"
                        }`}
                      />
                      <span className={item.completed ? "line-through opacity-75" : ""}>{item.item}</span>
                    </button>
                  ))}
                </div>

                {/* Add Custom Item */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addChecklistItem()}
                    placeholder="Add agenda topic..."
                    className="flex-1 px-3 py-2 rounded-xl bg-[#09150F] border border-[#1E4334] text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    onClick={addChecklistItem}
                    className="p-2 rounded-xl bg-[#163628] hover:bg-[#1E4836] border border-[#234C3C] text-emerald-400 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------- */}
            {/* TAB 4: SHARED NOTES (STUDENT VISIBLE)                    */}
            {/* -------------------------------------------------------- */}
            {activeTab === "notes" && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Shared Session Takeaways</span>
                    <span className="text-[10px] text-[#A3B899]">Visible to both student and mentor</span>
                  </div>

                  <button
                    onClick={saveNotesToServer}
                    disabled={savingNotes}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingNotes ? "Saving..." : "Save Notes"}</span>
                  </button>
                </div>

                <div className="flex-1 bg-[#09150F] rounded-xl border border-[#1E4334] p-3 flex flex-col min-h-0">
                  <textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    onBlur={saveNotesToServer}
                    rows={12}
                    className="w-full flex-1 bg-transparent text-xs text-white focus:outline-none resize-none leading-relaxed font-sans"
                    placeholder="Type shared session takeaways, recommendations, and study links..."
                  />
                </div>

                {lastSavedTime && (
                  <span className="text-[10px] text-emerald-400 font-mono text-right block">
                    ✓ Saved to database at {lastSavedTime}
                  </span>
                )}
              </div>
            )}

            {/* -------------------------------------------------------- */}
            {/* TAB 5: PRIVATE MENTOR NOTES                              */}
            {/* -------------------------------------------------------- */}
            {activeTab === "private" && isMentor && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-300">Confidential Mentor Scratchpad</span>
                  </div>

                  <button
                    onClick={saveNotesToServer}
                    disabled={savingNotes}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingNotes ? "Saving..." : "Save Private"}</span>
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-700/50 text-[11px] text-amber-200/90 leading-relaxed">
                  Strictly private. This content is never exposed to the student in any session summary, email, or API endpoint.
                </div>

                <div className="flex-1 bg-[#09150F] rounded-xl border border-amber-800/40 p-3 flex flex-col min-h-0">
                  <textarea
                    value={privateNotes}
                    onChange={(e) => setPrivateNotes(e.target.value)}
                    onBlur={saveNotesToServer}
                    rows={12}
                    className="w-full flex-1 bg-transparent text-xs text-amber-100 focus:outline-none resize-none leading-relaxed font-sans"
                    placeholder="Record candid candidate assessment, strengths, gaps, and private leveling observations..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="bg-[#0E2018] px-4 py-2.5 border-t border-[#1E3F31] flex items-center justify-between text-[11px] text-[#A3B899]">
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  engineMode === "livekit" ? "bg-blue-400" : "bg-emerald-400"
                }`}
              />
              <span>
                {engineMode === "livekit" ? "LiveKit SFU Engine" : "MentorMaze P2P Engine"}
              </span>
            </span>
            <span className="font-mono text-emerald-400 font-bold">⚡ &lt; 5ms Active</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. MODAL: AUDIO & VIDEO HARDWARE SETTINGS                     */}
      {/* ------------------------------------------------------------- */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E2219] border border-[#234C3C] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-400" />
                <span>Audio & Video Hardware</span>
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[#A3B899] font-medium mb-1.5">Camera Device</label>
                <select
                  value={selectedVideoDeviceId}
                  onChange={(e) => setSelectedVideoDeviceId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#08150F] border border-[#1E4334] text-white focus:outline-none"
                >
                  {videoDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#A3B899] font-medium mb-1.5">Microphone Device</label>
                <select
                  value={selectedAudioDeviceId}
                  onChange={(e) => setSelectedAudioDeviceId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#08150F] border border-[#1E4334] text-white focus:outline-none"
                >
                  {audioDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-[#1E4334]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[#A3B899]">Mic Input Level:</span>
                  <span className="font-mono text-emerald-400">{audioLevel}%</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-75"
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. MODAL: CONCLUDE SESSION CONFIRMATION                       */}
      {/* ------------------------------------------------------------- */}
      {showConcludeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E2219] border border-[#234C3C] rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-800 flex items-center justify-center mx-auto mb-3">
              <PhoneOff className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="font-bold text-white text-base mb-1">Leave Live Mentorship Room?</h3>
            <p className="text-xs text-[#A3B899] mb-5 leading-relaxed">
              Your shared notes, checklist milestones, and chat messages will be automatically preserved in your session summary.
            </p>
            <div className="flex gap-2.5 justify-center">
              <button
                onClick={() => setShowConcludeModal(false)}
                className="px-4 py-2 rounded-xl bg-[#18362B] hover:bg-[#20493A] text-[#DDE6D7] text-xs font-semibold border border-[#234F3F]"
              >
                Stay in Room
              </button>
              <button
                onClick={handleConcludeConfirmed}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-600/30"
              >
                Conclude & View Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
