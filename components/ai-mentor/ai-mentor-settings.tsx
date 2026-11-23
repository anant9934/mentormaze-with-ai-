"use client";

import React, { useState } from "react";
import { Settings, Volume2, Shield, Bell, Moon, Sun, Check } from "lucide-react";

export function AIMentorSettings() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [codeHighlighting, setCodeHighlighting] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#DCE5D5]">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#174B39]" />
          <h1 className="text-2xl sm:text-3xl font-serif text-[#17211E]">Workspace Settings</h1>
        </div>
        <p className="text-xs sm:text-sm text-[#69756B] mt-1">
          Configure editor preferences, accessibility settings, and session defaults.
        </p>
      </div>

      <div className="bg-white/90 rounded-3xl border border-[#DCE5D5] p-5 sm:p-6 shadow-sm space-y-6 text-xs sm:text-sm">
        {/* Toggle 1 */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EDF3E8]">
          <div>
            <h3 className="font-semibold text-[#17211E]">Text-to-Speech Output</h3>
            <p className="text-xs text-[#69756B]">Allow speech synthesis playback for ASTRION responses.</p>
          </div>
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(e) => setSoundEnabled(e.target.checked)}
            className="w-4 h-4 text-[#174B39] rounded border-gray-300 focus:ring-0 cursor-pointer"
          />
        </div>

        {/* Toggle 2 */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EDF3E8]">
          <div>
            <h3 className="font-semibold text-[#17211E]">Auto-Scroll Messages</h3>
            <p className="text-xs text-[#69756B]">Automatically scroll to the latest token during response streaming.</p>
          </div>
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="w-4 h-4 text-[#174B39] rounded border-gray-300 focus:ring-0 cursor-pointer"
          />
        </div>

        {/* Toggle 3 */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EDF3E8]">
          <div>
            <h3 className="font-semibold text-[#17211E]">Code Syntax Highlighting</h3>
            <p className="text-xs text-[#69756B]">Format fenced code blocks with language-specific styling.</p>
          </div>
          <input
            type="checkbox"
            checked={codeHighlighting}
            onChange={(e) => setCodeHighlighting(e.target.checked)}
            className="w-4 h-4 text-[#174B39] rounded border-gray-300 focus:ring-0 cursor-pointer"
          />
        </div>

        {/* Toggle 4 */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[#17211E]">Milestone Notifications</h3>
            <p className="text-xs text-[#69756B]">Receive browser alerts when curriculum goals and review intervals are ready.</p>
          </div>
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => setNotificationsEnabled(e.target.checked)}
            className="w-4 h-4 text-[#174B39] rounded border-gray-300 focus:ring-0 cursor-pointer"
          />
        </div>

        <div className="pt-4 border-t border-[#EDF3E8] flex items-center justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#174B39] hover:bg-[#123B2E] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            {saved ? <Check className="w-3.5 h-3.5" /> : null}
            <span>{saved ? "Saved" : "Save Preferences"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

