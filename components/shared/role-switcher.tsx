"use client";

import React from "react";
import { useAuth } from "@/lib/auth/context";
import { ShieldCheck, GraduationCap, Briefcase, Sparkles } from "lucide-react";

export function RoleSwitcher() {
  const { role, switchRole, user } = useAuth();

  return (
    <div className="bg-forest-950 text-white text-xs py-1.5 px-4 flex flex-wrap items-center justify-between border-b border-forest-800 z-50">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 font-semibold text-emerald-400">
          <Sparkles className="w-3.5 h-3.5" />
          MentorMaze Demo Control
        </span>
        <span className="text-forest-300 hidden sm:inline">|</span>
        <span className="text-forest-200 hidden sm:inline">
          Active: <strong className="text-white">{user?.displayName || "Guest"}</strong> ({role.toUpperCase()})
        </span>
      </div>

      <div className="flex items-center gap-1.5 mt-1 sm:mt-0">
        <span className="text-forest-400 mr-1 hidden md:inline">Switch Persona:</span>
        <button
          onClick={() => switchRole("student")}
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
          onClick={() => switchRole("mentor")}
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
          onClick={() => switchRole("admin")}
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
