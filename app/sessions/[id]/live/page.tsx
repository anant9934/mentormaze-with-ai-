"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { store } from "@/lib/data/store";
import { useAuth } from "@/lib/auth/context";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  MessageSquare,
  CheckCircle2,
  Download,
  FileText,
  Clock,
  Sparkles,
  ArrowLeft,
  Settings,
  MoreVertical,
} from "lucide-react";

export default function LiveSessionRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const bookingId = params.id as string;
  const booking = store.getBookingById(bookingId) || store.getBookingsForUser("user-student-1")[0];
  const session = store.getSessionByBookingId(booking?.id || "booking-1");
  const mentor = store.getMentorById(booking?.mentorProfileId || "mentor-priya") || store.getMentors(true)[0];

  // RTC Media Controls State
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeTab, setActiveTab] = useState<"plan" | "notes">("plan");
  const [sessionNotes, setSessionNotes] = useState(
    "Discussed distributed cache invalidation strategies and time complexity optimizations."
  );

  // Live Timer Simulation
  const [secondsElapsed, setSecondsElapsed] = useState(1928); // 32:08
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
    { item: "Career path in Software Engineering", completed: true },
    { item: "Project review & architectural feedback", completed: true },
    { item: "Interview preparation tips & problem selection", completed: false },
    { item: "Next steps & weekly action items", completed: false },
  ]);

  const toggleChecklistItem = (index: number) => {
    const updated = [...checklist];
    updated[index].completed = !updated[index].completed;
    setChecklist(updated);
  };

  const handleEndCall = () => {
    if (confirm("Are you sure you want to end this mentorship session?")) {
      store.updateSessionNotes(booking.id, {
        sharedSummary: sessionNotes,
        checklist,
      });
      router.push(`/sessions/${booking.id}/summary`);
    }
  };

  return (
    <div className="h-screen w-screen bg-forest-950 text-white flex flex-col overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-16 bg-forest-900 border-b border-forest-800 px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <Link
            href={`/sessions/${booking.id}/confirmation`}
            className="text-xs text-forest-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Leave Room</span>
          </Link>
          <div className="h-4 w-[1px] bg-forest-700"></div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-sm text-white">
              Mentorship with {mentor.userId === "user-mentor-priya" ? "Priya Sharma" : "Rohan Mehta"}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-forest-800 text-forest-200 font-mono">
              {formatTimer(secondsElapsed)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="badge-match text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800">
            LiveKit WebRTC · Encrypted
          </span>
          <button
            onClick={() => alert("Device settings: Default Microphone, FaceTime HD Camera")}
            className="p-2 rounded-full hover:bg-forest-800 text-forest-300 hover:text-white"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Grid: Video Stage (Left) + Collaborative Notes/Agenda (Right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* VIDEO STAGE (8 COLS) */}
        <div className="lg:col-span-8 p-4 flex flex-col justify-between relative bg-black/40">
          {/* Main Mentor Feed */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-forest-900/60 border border-forest-800 flex items-center justify-center">
            <Image
              src={
                mentor.userId === "user-mentor-priya"
                  ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80"
                  : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80"
              }
              alt="Mentor Video Feed"
              fill
              className="object-cover"
            />

            {/* Mentor Label */}
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-forest-950/80 backdrop-blur-md border border-forest-800 text-xs font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{mentor.userId === "user-mentor-priya" ? "Priya Sharma (Microsoft)" : "Rohan Mehta (Google)"}</span>
            </div>

            {/* Picture-in-Picture Student Camera */}
            <div className="absolute bottom-4 right-4 w-40 h-28 sm:w-52 sm:h-36 rounded-xl overflow-hidden border-2 border-forest-700 bg-forest-900 shadow-elevated">
              {isVideoOn ? (
                <Image
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80"
                  alt="Student Video"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-forest-950 text-forest-400 text-xs">
                  <VideoOff className="w-6 h-6 mb-1 text-forest-500" />
                  <span>Camera Off</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-forest-950/80 px-2 py-0.5 rounded text-[10px] text-white">
                You (Anant Kumar)
              </div>
            </div>
          </div>

          {/* Bottom Floating RTC Control Bar */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setIsMicOn(!isMicOn)}
              className={`p-3.5 rounded-full shadow-md transition-all ${
                isMicOn ? "bg-forest-800 text-white hover:bg-forest-700" : "bg-red-600 text-white hover:bg-red-700"
              }`}
              title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`p-3.5 rounded-full shadow-md transition-all ${
                isVideoOn ? "bg-forest-800 text-white hover:bg-forest-700" : "bg-red-600 text-white hover:bg-red-700"
              }`}
              title={isVideoOn ? "Turn Camera Off" : "Turn Camera On"}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button
              onClick={() => {
                setIsScreenSharing(!isScreenSharing);
                alert(isScreenSharing ? "Screen sharing stopped." : "Screen share active: Displaying your window to mentor.");
              }}
              className={`p-3.5 rounded-full shadow-md transition-all ${
                isScreenSharing ? "bg-emerald-600 text-white" : "bg-forest-800 text-white hover:bg-forest-700"
              }`}
              title="Share Screen"
            >
              <Monitor className="w-5 h-5" />
            </button>

            <button
              onClick={handleEndCall}
              className="p-3.5 px-6 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <PhoneOff className="w-5 h-5" />
              <span>Leave Session</span>
            </button>
          </div>
        </div>

        {/* COLLABORATIVE SIDEBAR (4 COLS) */}
        <div className="lg:col-span-4 bg-forest-900 border-l border-forest-800 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Tabs Header */}
            <div className="flex border-b border-forest-800 pb-3 mb-6 gap-6 text-xs font-bold">
              <button
                onClick={() => setActiveTab("plan")}
                className={`transition-colors ${
                  activeTab === "plan" ? "text-emerald-400 border-b-2 border-emerald-400 pb-1" : "text-forest-400"
                }`}
              >
                Session Plan
              </button>
              <button
                onClick={() => setActiveTab("notes")}
                className={`transition-colors ${
                  activeTab === "notes" ? "text-emerald-400 border-b-2 border-emerald-400 pb-1" : "text-forest-400"
                }`}
              >
                Collaborative Notes
              </button>
            </div>

            {/* TAB 1: SESSION PLAN CHECKLIST */}
            {activeTab === "plan" ? (
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-forest-400 uppercase tracking-wider block">
                  Agenda Checklist (Click to Toggle)
                </span>
                <div className="space-y-2.5">
                  {checklist.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleChecklistItem(idx)}
                      className={`w-full p-3 rounded-xl border text-left text-xs flex items-center gap-3 transition-colors ${
                        item.completed
                          ? "bg-forest-950/80 border-emerald-800/60 text-emerald-300"
                          : "bg-forest-800/40 border-forest-700 text-forest-200 hover:bg-forest-800"
                      }`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 flex-shrink-0 ${
                          item.completed ? "text-emerald-400" : "text-forest-600"
                        }`}
                      />
                      <span className={item.completed ? "line-through opacity-80" : ""}>
                        {item.item}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* TAB 2: LIVE NOTES */
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-forest-400 uppercase tracking-wider block">
                  Shared Live Notes & Takeaways
                </span>
                <textarea
                  rows={8}
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="w-full p-3 rounded-xl bg-forest-950 border border-forest-800 text-xs text-forest-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* RESOURCES SHARED SECTION */}
            <div className="mt-8 pt-6 border-t border-forest-800">
              <span className="text-[10px] font-bold text-forest-400 uppercase tracking-wider block mb-3">
                Resources Shared by Mentor
              </span>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-forest-950 border border-forest-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="font-semibold block text-white">SDE_Roadmap.pdf</span>
                      <span className="text-[10px] text-forest-400">2.4 MB</span>
                    </div>
                  </div>
                  <button
                    onClick={() => alert("Downloading SDE_Roadmap.pdf...")}
                    className="p-1.5 rounded-lg bg-forest-800 hover:bg-forest-700 text-emerald-400"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-forest-950 border border-forest-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="font-semibold block text-white">Project_Review_Notes.pdf</span>
                      <span className="text-[10px] text-forest-400">1.8 MB</span>
                    </div>
                  </div>
                  <button
                    onClick={() => alert("Downloading Project_Review_Notes.pdf...")}
                    className="p-1.5 rounded-lg bg-forest-800 hover:bg-forest-700 text-emerald-400"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-forest-800 text-center">
            <span className="text-[10px] text-forest-400 block">
              Mentor notes are auto-saved to your Progress history.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
