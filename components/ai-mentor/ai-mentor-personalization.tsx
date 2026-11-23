"use client";

import React, { useState } from "react";
import {
  User,
  Compass,
  Sliders,
  Check,
  Save,
  Sparkles,
} from "lucide-react";

interface AIMentorPersonalizationProps {
  section: "learning_profile" | "career_goals" | "preferences";
}

export function AIMentorPersonalization({ section }: AIMentorPersonalizationProps) {
  const [targetRole, setTargetRole] = useState("Software Engineer (Backend / Distributed Systems)");
  const [experienceLevel, setExperienceLevel] = useState("Junior / Mid-Level (1-3 yrs)");
  const [targetTimeline, setTargetTimeline] = useState("3 Months (Active Preparation)");
  const [preferredLang, setPreferredLang] = useState("Python & TypeScript");
  const [pedagogicalPace, setPedagogicalPace] = useState("Socratic Scaffolding (Hints first, then explanation)");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#DCE5D5]">
        <div className="flex items-center gap-2">
          {section === "learning_profile" && <User className="w-6 h-6 text-[#174B39]" />}
          {section === "career_goals" && <Compass className="w-6 h-6 text-[#174B39]" />}
          {section === "preferences" && <Sliders className="w-6 h-6 text-[#174B39]" />}
          <h1 className="text-2xl sm:text-3xl font-serif text-[#17211E]">
            {section === "learning_profile" && "Student Learning Profile"}
            {section === "career_goals" && "Target Career Objectives"}
            {section === "preferences" && "Mentorship Preferences & Tone"}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#69756B] mt-1">
          Customize how ASTRION structures explanations, selects practice problems, and calibrates difficulty.
        </p>
      </div>

      {/* Form Fields */}
      <div className="bg-white/90 rounded-3xl border border-[#DCE5D5] p-5 sm:p-6 shadow-sm space-y-5 text-xs sm:text-sm">
        {section === "learning_profile" && (
          <>
            <div>
              <label className="font-semibold text-[#17211E] block mb-1.5">
                Current Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#DCE5D5] rounded-xl text-xs sm:text-sm text-[#17211E] bg-[#FAFAF2] focus:outline-none focus:ring-1 focus:ring-[#27875E]"
              >
                <option value="Final-Year CS Undergraduate">Final-Year CS Undergraduate</option>
                <option value="Junior / Mid-Level (1-3 yrs)">Junior / Mid-Level (1-3 yrs)</option>
                <option value="Senior Engineer (4+ yrs)">Senior Engineer (4+ yrs)</option>
                <option value="Career Switcher / Self-Taught">Career Switcher / Self-Taught</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-[#17211E] block mb-1.5">
                Pedagogical Approach & Scaffolding
              </label>
              <select
                value={pedagogicalPace}
                onChange={(e) => setPedagogicalPace(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#DCE5D5] rounded-xl text-xs sm:text-sm text-[#17211E] bg-[#FAFAF2] focus:outline-none focus:ring-1 focus:ring-[#27875E]"
              >
                <option value="Socratic Scaffolding (Hints first, then explanation)">
                  Socratic Scaffolding (Hints first, no code dumps)
                </option>
                <option value="Direct First-Principles Breakdown">
                  Direct First-Principles Breakdown (Clear explanations first)
                </option>
                <option value="Fast Code Review & Edge Cases Only">
                  Fast Code Review & Edge Cases Only (Speed oriented)
                </option>
              </select>
            </div>
          </>
        )}

        {section === "career_goals" && (
          <>
            <div>
              <label className="font-semibold text-[#17211E] block mb-1.5">Target Engineering Role</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#DCE5D5] rounded-xl text-xs sm:text-sm text-[#17211E] bg-[#FAFAF2] focus:outline-none focus:ring-1 focus:ring-[#27875E]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#17211E] block mb-1.5">Preparation Timeline</label>
              <select
                value={targetTimeline}
                onChange={(e) => setTargetTimeline(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#DCE5D5] rounded-xl text-xs sm:text-sm text-[#17211E] bg-[#FAFAF2] focus:outline-none focus:ring-1 focus:ring-[#27875E]"
              >
                <option value="1 Month (Sprint / Immediate Interviews)">1 Month (Sprint / Immediate Interviews)</option>
                <option value="3 Months (Active Preparation)">3 Months (Active Preparation)</option>
                <option value="6 Months (Long-Term Mastery)">6 Months (Long-Term Mastery)</option>
              </select>
            </div>
          </>
        )}

        {section === "preferences" && (
          <>
            <div>
              <label className="font-semibold text-[#17211E] block mb-1.5">
                Primary Programming Languages
              </label>
              <input
                type="text"
                value={preferredLang}
                onChange={(e) => setPreferredLang(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#DCE5D5] rounded-xl text-xs sm:text-sm text-[#17211E] bg-[#FAFAF2] focus:outline-none focus:ring-1 focus:ring-[#27875E]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#17211E] block mb-1.5">Feedback Style</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="tone" defaultChecked className="text-[#174B39] focus:ring-0" />
                  <span className="text-xs text-[#17211E]">Rigorous & Calibrated (FAANG bar)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="tone" className="text-[#174B39] focus:ring-0" />
                  <span className="text-xs text-[#17211E]">Supportive & Step-by-Step</span>
                </label>
              </div>
            </div>
          </>
        )}

        <div className="pt-3 border-t border-[#EDF3E8] flex items-center justify-between">
          <span className="text-xs text-[#69756B]">
            Preferences are preserved across sessions and encrypted at rest.
          </span>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#174B39] hover:bg-[#123B2E] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Saved Successfully</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

