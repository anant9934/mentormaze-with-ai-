"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { store } from "@/lib/data/store";
import { useAuth } from "@/lib/auth/context";
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Calendar,
  Plus,
  ArrowRight,
  Target,
  Sparkles,
} from "lucide-react";

export default function ProgressDashboardPage() {
  const { user } = useAuth();
  const currentUserId = user?.id || "user-student-1";
  const [profile, setProfile] = useState(
    store.getStudentProfile(currentUserId) || store.getStudentProfile("user-student-1")!
  );

  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTargetDate, setNewGoalTargetDate] = useState("2026-12-31");
  const [showAddGoal, setShowAddGoal] = useState(false);

  const handleToggleAction = (id: string) => {
    store.toggleActionItem(currentUserId, id);
    setProfile(JSON.parse(JSON.stringify(store.getStudentProfile(currentUserId))));
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    store.addStudentGoal(currentUserId, {
      title: newGoalTitle.trim(),
      description: "Custom goal defined by student.",
      category: "career",
      targetDate: newGoalTargetDate,
    });

    setProfile(JSON.parse(JSON.stringify(store.getStudentProfile(currentUserId))));
    setNewGoalTitle("");
    setShowAddGoal(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink-950">My Progress & Goals</h1>
          <p className="text-xs text-ink-700 mt-1">
            Track your milestones, action items, and growth outcomes over time.
          </p>
        </div>

        {/* 3 Stats Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="card-warm bg-white p-6 rounded-3xl border border-border text-center">
            <span className="font-serif text-4xl font-extrabold text-forest-900 block">6</span>
            <span className="text-xs font-semibold text-ink-700 mt-1 block">Completed Sessions</span>
            <span className="text-[10px] text-ink-500">1:1 Mentorship & Mocks</span>
          </div>

          <div className="card-warm bg-white p-6 rounded-3xl border border-border text-center">
            <span className="font-serif text-4xl font-extrabold text-forest-900 block">
              {profile.goals.length}
            </span>
            <span className="text-xs font-semibold text-ink-700 mt-1 block">Active Goals</span>
            <span className="text-[10px] text-ink-500">Skill & Interview targets</span>
          </div>

          <div className="card-warm bg-white p-6 rounded-3xl border border-border text-center">
            <span className="font-serif text-4xl font-extrabold text-forest-900 block">75%</span>
            <span className="text-xs font-semibold text-ink-700 mt-1 block">Overall Readiness</span>
            <span className="text-[10px] text-ink-500">Targeting SDE Intern roles</span>
          </div>
        </div>

        {/* GOALS SECTION */}
        <div className="card-warm bg-white p-6 rounded-3xl border border-border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-forest-800" />
              <h2 className="font-serif text-xl font-bold text-ink-950">Learning Goals</h2>
            </div>
            <button
              onClick={() => setShowAddGoal(!showAddGoal)}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Goal</span>
            </button>
          </div>

          {/* Add Goal Form Dropdown */}
          {showAddGoal && (
            <form onSubmit={handleCreateGoal} className="p-4 rounded-2xl bg-cream-50 border border-border space-y-3">
              <h4 className="text-xs font-bold text-ink-950">Create New Goal</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Goal Title (e.g. Master System Design)"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="sm:col-span-2 p-2.5 rounded-xl border border-border text-xs text-ink-950 focus:outline-none focus:ring-2 focus:ring-forest-700"
                />
                <input
                  type="date"
                  value={newGoalTargetDate}
                  onChange={(e) => setNewGoalTargetDate(e.target.value)}
                  className="p-2.5 rounded-xl border border-border text-xs text-ink-950 focus:outline-none focus:ring-2 focus:ring-forest-700"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddGoal(false)}
                  className="px-3 py-1.5 text-xs text-ink-700 hover:text-ink-950"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs py-1.5 px-4">
                  Save Goal
                </button>
              </div>
            </form>
          )}

          {/* Goals List */}
          <div className="space-y-4 pt-2">
            {profile.goals.map((goal) => (
              <div key={goal.id} className="p-4 rounded-2xl bg-cream-50 border border-border">
                <div className="flex items-center justify-between text-xs font-bold text-ink-950 mb-1.5">
                  <span className="text-sm">{goal.title}</span>
                  <span className="text-forest-900">{goal.progressPercentage}% Complete</span>
                </div>
                <div className="w-full bg-sand-200 rounded-full h-2.5 mb-2 overflow-hidden">
                  <div
                    className="bg-forest-900 h-2.5 rounded-full transition-all"
                    style={{ width: `${goal.progressPercentage}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-ink-500">
                  <p>{goal.description}</p>
                  <span>Target: {goal.targetDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ACTION ITEMS SECTION */}
        <div className="card-warm bg-white p-6 rounded-3xl border border-border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-forest-800" />
              <h2 className="font-serif text-xl font-bold text-ink-950">Action Items</h2>
            </div>
            <span className="text-xs text-ink-500">Assigned by Mentors & Self</span>
          </div>

          <div className="space-y-2.5">
            {profile.actionItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleToggleAction(item.id)}
                className={`w-full p-4 rounded-2xl border text-left flex items-start justify-between transition-all ${
                  item.status === "completed"
                    ? "bg-sage-50/60 border-emerald-200 text-ink-400"
                    : "bg-cream-50 border-border hover:bg-cream-100 text-ink-950"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${
                      item.status === "completed"
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "border-sand-300 bg-white"
                    }`}
                  >
                    {item.status === "completed" && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <h4
                      className={`text-xs font-bold ${
                        item.status === "completed" ? "line-through text-ink-400" : "text-ink-950"
                      }`}
                    >
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-ink-500 mt-0.5">{item.description}</p>
                  </div>
                </div>
                <div className="text-right text-[10px] text-ink-500 flex-shrink-0 ml-4">
                  <span className="block font-semibold">Due {item.dueDate}</span>
                  <span className="badge-sage text-[9px] mt-1 capitalize">{item.createdByRole}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
