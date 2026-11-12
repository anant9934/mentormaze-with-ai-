"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { store } from "@/lib/data/store";
import { Logo } from "@/components/shared/logo";
import {
  Compass,
  Code2,
  FolderGit2,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [step, setStep] = useState(1);

  // Form State
  const [selectedGoal, setSelectedGoal] = useState("Career Guidance");
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [skills, setSkills] = useState<string[]>(["Data Structures & Algorithms", "TypeScript / Node.js"]);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [institution, setInstitution] = useState("Lovely Professional University (LPU)");
  const [graduationYear, setGraduationYear] = useState(2027);

  const goalOptions = [
    { title: "Career Guidance", icon: Compass, desc: "Direction, roadmaps, and career transition support." },
    { title: "Interview Prep", icon: Code2, desc: "Mock interviews, coding rounds, and system design." },
    { title: "Project Review", icon: FolderGit2, desc: "Code architecture, GitHub portfolio, and feedback." },
    { title: "Skill Development", icon: TrendingUp, desc: "Master new languages, frameworks, and tools." },
  ];

  const roleOptions = [
    "Software Engineer",
    "Data Scientist / ML Engineer",
    "Product Manager",
    "DevOps / Cloud Engineer",
    "Frontend Developer",
  ];

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Save profile
      const currentUserId = user?.id || "user-student-1";
      store.updateStudentProfile(currentUserId, {
        targetRole,
        institution,
        graduationYear,
        skills: skills.map((s) => ({ name: s, level: "intermediate", source: "self_reported" })),
      });
      // Redirect to recommendations
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col justify-between">
      <header className="px-6 py-6 max-w-4xl mx-auto w-full flex items-center justify-between">
        <Logo />
        <span className="text-xs font-semibold text-ink-500">Step {step} of 3</span>
      </header>

      <main className="max-w-xl mx-auto w-full px-4 py-8 flex-1">
        <div className="card-warm bg-white p-8 rounded-3xl shadow-card">
          {/* Progress Indicator Dots */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className={`w-2.5 h-2.5 rounded-full ${step >= 1 ? "bg-forest-900" : "bg-sand-200"}`}></span>
            <span className={`w-2.5 h-2.5 rounded-full ${step >= 2 ? "bg-forest-900" : "bg-sand-200"}`}></span>
            <span className={`w-2.5 h-2.5 rounded-full ${step >= 3 ? "bg-forest-900" : "bg-sand-200"}`}></span>
          </div>

          {/* STEP 1: CHOOSE GOAL */}
          {step === 1 && (
            <div>
              <div className="text-center mb-6">
                <h1 className="font-serif text-3xl font-bold text-ink-950">
                  Tell Us About You
                </h1>
                <p className="text-xs text-ink-700 mt-1">
                  Help us find the best verified mentors for your primary goal.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-2">
                  What is your primary goal?
                </label>
                {goalOptions.map((g) => {
                  const Icon = g.icon;
                  const isSelected = selectedGoal === g.title;
                  return (
                    <button
                      key={g.title}
                      type="button"
                      onClick={() => setSelectedGoal(g.title)}
                      className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? "border-forest-900 bg-sage-50 ring-2 ring-forest-900/10"
                          : "border-border hover:bg-cream-100"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isSelected ? "bg-forest-900 text-white" : "bg-cream-100 text-ink-700"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-ink-950">{g.title}</h4>
                          <p className="text-xs text-ink-500">{g.desc}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-forest-900 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: TARGET ROLE & EDUCATION */}
          {step === 2 && (
            <div>
              <div className="text-center mb-6">
                <h1 className="font-serif text-3xl font-bold text-ink-950">
                  Target Role & Background
                </h1>
                <p className="text-xs text-ink-700 mt-1">
                  We use your career path to calculate explainable match scores.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                    Target Role
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full p-3 rounded-xl border border-border text-sm text-ink-950 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
                  >
                    {roleOptions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                    Current College / University
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. LPU, IIT, BITS, etc."
                    className="w-full p-3 rounded-xl border border-border text-sm text-ink-950 focus:outline-none focus:ring-2 focus:ring-forest-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                    Expected Graduation Year
                  </label>
                  <input
                    type="number"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(parseInt(e.target.value))}
                    className="w-full p-3 rounded-xl border border-border text-sm text-ink-950 focus:outline-none focus:ring-2 focus:ring-forest-700"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SKILLS & CONFIRMATION */}
          {step === 3 && (
            <div>
              <div className="text-center mb-6">
                <h1 className="font-serif text-3xl font-bold text-ink-950">
                  Key Skills & Stack
                </h1>
                <p className="text-xs text-ink-700 mt-1">
                  Add the technical domains you want to be mentored on.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newSkillInput.trim()) {
                        e.preventDefault();
                        if (!skills.includes(newSkillInput.trim())) {
                          setSkills([...skills, newSkillInput.trim()]);
                        }
                        setNewSkillInput("");
                      }
                    }}
                    placeholder="Type skill (e.g. System Design, Python) and press Enter"
                    className="flex-1 p-3 rounded-xl border border-border text-sm text-ink-950 focus:outline-none focus:ring-2 focus:ring-forest-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSkillInput.trim() && !skills.includes(newSkillInput.trim())) {
                        setSkills([...skills, newSkillInput.trim()]);
                        setNewSkillInput("");
                      }
                    }}
                    className="btn-secondary px-4 text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-sage-100 text-forest-900 border border-sage-200"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => setSkills(skills.filter((x) => x !== s))}
                        className="text-forest-700 hover:text-red-600 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-cream-50 border border-border mt-4 text-xs text-ink-700">
                  <span className="font-bold text-ink-950 block mb-1">Explainable Matching:</span>
                  MentorMaze will instantly calculate compatibility scores and match reasons based on your target role (<strong className="text-forest-900">{targetRole}</strong>) and skills.
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 pt-4 border-t border-border flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="btn-secondary text-xs px-4 py-2 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div></div>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2"
            >
              <span>{step === 3 ? "See Recommended Mentors" : "Continue"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-ink-500">
        You can update your skills and goals anytime in your profile settings.
      </footer>
    </div>
  );
}

