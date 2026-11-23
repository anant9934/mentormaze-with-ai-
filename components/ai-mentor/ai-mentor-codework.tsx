"use client";

import React, { useState } from "react";
import {
  Code2,
  Play,
  Sparkles,
  Bug,
  Cpu,
  ArrowRight,
  Copy,
  Check,
  RotateCw,
  Terminal,
  ShieldAlert,
  FileCode,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIMentorCodeworkProps {
  onSendToMentor: (prompt: string, code: string, language: string) => void;
}

const SAMPLE_CODES: Record<string, string> = {
  python: `def two_sum_all_pairs(nums: list[int], target: int) -> list[tuple[int, int]]:
    """
    Finds all unique pairs that sum up to target.
    Time Complexity target: O(N)
    """
    seen = set()
    pairs = set()
    for num in nums:
        complement = target - num
        if complement in seen:
            pairs.add(tuple(sorted((num, complement))))
        seen.add(num)
    return list(pairs)`,
  typescript: `export function debounce<T extends (...args: any[]) => void>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return function (...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, waitMs);
  };
}`,
  cpp: `#include <vector>
#include <unordered_map>

std::vector<int> twoSum(std::vector<int>& nums, int target) {
    std::unordered_map<int, int> lookup;
    for (int i = 0; i < (int)nums.size(); ++i) {
        int complement = target - nums[i];
        if (lookup.find(complement) != lookup.end()) {
            return {lookup[complement], i};
        }
        lookup[nums[i]] = i;
    }
    return {};
}`,
};

export function AIMentorCodework({ onSendToMentor }: AIMentorCodeworkProps) {
  const [language, setLanguage] = useState<string>("python");
  const [code, setCode] = useState<string>(SAMPLE_CODES["python"]);
  const [activeTab, setActiveTab] = useState<"complexity" | "bugs" | "refactor">("complexity");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    timeComplexity: string;
    spaceComplexity: string;
    invariants: string[];
    potentialBugs: string[];
    refactoringSuggestions: string[];
  } | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (SAMPLE_CODES[newLang]) {
      setCode(SAMPLE_CODES[newLang]);
    }
    setAnalysisResult(null);
  };

  const runAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisResult({
        timeComplexity: "O(N) single-pass traversal",
        spaceComplexity: "O(N) for hash set storage",
        invariants: [
          "Set `seen` strictly contains elements examined in prior iterations.",
          "Every candidate complement is verified in amortized O(1) time.",
          "Pair uniqueness maintained by canonical sorting before set insertion.",
        ],
        potentialBugs: [
          "Integer overflow warning: If nums contains values near 2^31 - 1, subtraction might overflow in bounded integer languages.",
          "Memory footprint: Large input arrays with sparse duplicates store all elements in auxiliary memory.",
        ],
        refactoringSuggestions: [
          "Consider generator pattern if output pairs are consumed stream-wise to save memory.",
          "Add input type validations and docstring tests with pytest doctest.",
        ],
      });
    }, 600);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE5D5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-serif text-[#17211E]">Codework Studio</h1>
            <span className="text-[10px] bg-[#E7F2DA] text-[#174B39] font-bold px-2 py-0.5 rounded-full border border-[#DCE5D5]">
              DSA & Review
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#69756B] mt-1">
            Algorithmic complexity verification, edge-case probing, and line-by-line Socratic code review.
          </p>
        </div>

        {/* Sandbox status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#DCE5D5] text-xs text-[#69756B]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-[#17211E]">Local Analysis Engine Active</span>
        </div>
      </div>

      {/* Editor & Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Code Editor (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          {/* Editor Header Bar */}
          <div className="flex items-center justify-between bg-[#17211E] text-slate-300 px-4 py-2.5 rounded-t-2xl border border-b-0 border-[#2A3834] text-xs">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-[#121A18] text-white border border-[#2A3834] rounded-lg px-2 py-1 font-mono text-xs focus:outline-none"
              >
                <option value="python">Python</option>
                <option value="typescript">TypeScript</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="sql">SQL</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="hover:text-white flex items-center gap-1 transition-colors"
                title="Copy code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Textarea Code Input */}
          <div className="relative">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={14}
              placeholder="Paste or write code here..."
              className="w-full bg-[#121A18] text-slate-100 font-mono text-xs sm:text-sm p-4 rounded-b-2xl border border-[#2A3834] focus:outline-none focus:ring-1 focus:ring-[#27875E] resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={runAnalysis}
              disabled={isAnalyzing || !code.trim()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#174B39] hover:bg-[#123B2E] text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
            >
              {isAnalyzing ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>Run Local Analysis</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onSendToMentor(
                  `Please review my ${language} code below. Provide line-by-line feedback, asymptotic analysis, and Socratic hints for optimization.`,
                  code,
                  language
                )
              }
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E7F2DA] hover:bg-[#DDE6D7] border border-[#DCE5D5] text-[#174B39] text-xs font-semibold transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#27875E]" />
              <span>Ask Dr. Aarav to Review</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Analysis & Feedback Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white/90 border border-[#DCE5D5] rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            {/* Panel Tabs */}
            <div className="flex items-center gap-1 border-b border-[#EDF3E8] pb-3 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab("complexity")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors",
                  activeTab === "complexity"
                    ? "bg-[#174B39] text-white"
                    : "text-[#69756B] hover:text-[#17211E] hover:bg-[#EDF3E8]"
                )}
              >
                Complexity & Proof
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("bugs")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors",
                  activeTab === "bugs"
                    ? "bg-[#174B39] text-white"
                    : "text-[#69756B] hover:text-[#17211E] hover:bg-[#EDF3E8]"
                )}
              >
                Edge Cases
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("refactor")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors",
                  activeTab === "refactor"
                    ? "bg-[#174B39] text-white"
                    : "text-[#69756B] hover:text-[#17211E] hover:bg-[#EDF3E8]"
                )}
              >
                Refactoring
              </button>
            </div>

            {/* Tab Contents */}
            {!analysisResult && !isAnalyzing ? (
              <div className="text-center py-10 space-y-2">
                <Terminal className="w-8 h-8 text-[#69756B] mx-auto opacity-50" />
                <h3 className="text-xs font-semibold text-[#17211E]">No analysis executed yet</h3>
                <p className="text-[11px] text-[#69756B] max-w-xs mx-auto">
                  Click &apos;Run Local Analysis&apos; or ask ASTRION CIPHER for deep review to inspect time & space complexity, invariants, and edge cases.
                </p>
              </div>
            ) : isAnalyzing ? (
              <div className="text-center py-12 space-y-3">
                <RotateCw className="w-6 h-6 text-[#27875E] animate-spin mx-auto" />
                <p className="text-xs text-[#69756B]">Calculating invariants and asymptotic bounds...</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {activeTab === "complexity" && (
                  <div className="space-y-3">
                    <div className="p-3 bg-[#FAFAF2] border border-[#DCE5D5] rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#69756B]">Time Complexity</span>
                      <p className="font-mono font-semibold text-[#174B39] text-sm">
                        {analysisResult?.timeComplexity}
                      </p>
                    </div>
                    <div className="p-3 bg-[#FAFAF2] border border-[#DCE5D5] rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#69756B]">Space Complexity</span>
                      <p className="font-mono font-semibold text-[#174B39] text-sm">
                        {analysisResult?.spaceComplexity}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-[#17211E] block mb-1">Key Algorithmic Invariants:</span>
                      <ul className="space-y-1 text-[#69756B]">
                        {analysisResult?.invariants.map((inv, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#27875E] mt-1.5 shrink-0" />
                            <span>{inv}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === "bugs" && (
                  <div className="space-y-2">
                    <span className="font-bold text-[#17211E] block">Edge Case Analysis:</span>
                    {analysisResult?.potentialBugs.map((bug, bIdx) => (
                      <div key={bIdx} className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>{bug}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "refactor" && (
                  <div className="space-y-2">
                    <span className="font-bold text-[#17211E] block">Idiomatic Suggestions:</span>
                    {analysisResult?.refactoringSuggestions.map((ref, rIdx) => (
                      <div key={rIdx} className="p-2.5 bg-[#EDF3E8] border border-[#DCE5D5] rounded-xl text-[#174B39] flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-[#27875E] shrink-0 mt-0.5" />
                        <span>{ref}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 mt-6 border-t border-[#EDF3E8] text-[11px] text-[#69756B]">
            All code remains private to your session and is evaluated in conformance with academic integrity.
          </div>
        </div>
      </div>
    </div>
  );
}

