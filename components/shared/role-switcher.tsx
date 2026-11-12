"use client";

import React from "react";
import { useAuth } from "@/lib/auth/context";
import { ShieldCheck, GraduationCap, Briefcase, Sparkles } from "lucide-react";

export function RoleSwitcher() {
  const { role, switchRole, user } = useAuth();

  // Strict Production Boundary: Persona Switcher must NEVER render in production
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const handleRoleSwitch = async (newRole: "student" | "mentor" | "admin") => {
    switchRole(newRole);
    // Sync with server-side session API
    const credentials = {
      student: { email: "anant@example.com", password: "student123" },
      mentor: { email: "priya.sharma@microsoft.com", password: "mentor123" },
      admin: { email: "admin@mentormaze.com", password: "admin123" },
    };
    try {
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...credentials[newRole], role: newRole }),
      });
    } catch {
      // In-memory fallback if fetch unavailable
    }
  };

  return (
    <div className="bg-forest-950 text-white text-xs py-1.5 px-4 flex flex-wrap items-center justify-between border-b border-forest-800 z-50">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 font-semibold text-emerald-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider border border-amber-500/30">
            Dev/Demo Only
          </span>
          MentorMaze Simulator
        </span>
        <span className="text-forest-300 hidden sm:inline">|</span>
        <span className="text-forest-200 hidden sm:inline">
          Active: <strong className="text-white">{user?.displayName || "Guest"}</strong> ({role.toUpperCase()})
        </span>
      </div>

      <div className="flex items-center gap-1.5 mt-1 sm:mt-0">
        <span className="text-forest-400 mr-1 hidden md:inline">Switch Persona:</span>
        <button
          onClick={() => handleRoleSwitch("student")}
          className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full transition-all ${
            role === "student"
              ? "bg-forest-700 text-white font-bold ring-1 ring-white/30"
              : "bg-forest-900 text-forest-300 hover:text-white"
          }`}
        >
          <GraduationCap className="w-3 h-3" />
          Student (Anant)
        </button>
        <button
          onClick={() => handleRoleSwitch("mentor")}
          className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full transition-all ${
            role === "mentor"
              ? "bg-forest-700 text-white font-bold ring-1 ring-white/30"
              : "bg-forest-900 text-forest-300 hover:text-white"
          }`}
        >
          <Briefcase className="w-3 h-3" />
          Mentor (Priya)
        </button>
        <button
          onClick={() => handleRoleSwitch("admin")}
          className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full transition-all ${
            role === "admin"
              ? "bg-forest-700 text-white font-bold ring-1 ring-white/30"
              : "bg-forest-900 text-forest-300 hover:text-white"
          }`}
        >
          <ShieldCheck className="w-3 h-3" />
          Admin
        </button>
      </div>
    </div>
  );
}

