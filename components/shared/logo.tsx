import React from "react";
import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 font-bold tracking-tight ${className}`}>
      {/* MentorMaze geometric 'M' brand mark */}
      <div className="w-8 h-8 rounded-lg bg-forest-900 flex items-center justify-center text-white shadow-sm ring-1 ring-forest-800">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 text-emerald-400"
        >
          <path d="M4 19V5l8 7 8-7v14" />
        </svg>
      </div>
      <span className="font-serif text-2xl tracking-normal text-forest-900">
        Mentor<span className="text-emerald-700 font-sans font-extrabold">Maze</span>
      </span>
    </Link>
  );
}

