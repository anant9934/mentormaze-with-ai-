import React from "react";
import Link from "next/link";

export function Logo({
  className = "",
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  const isLight = variant === "light";

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 font-bold tracking-tight select-none group ${className}`}
    >
      {/* MentorMaze geometric interconnected 'M' brand mark */}
      <svg
        width="26"
        height="26"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform group-hover:scale-105"
      >
        <path
          d="M5 21V8.5L10 14L14 9.5L18 14L23 8.5V21M5 21H8.5M19.5 21H23"
          stroke={isLight ? "#34D399" : "#123B2E"}
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={`font-sans font-extrabold text-[1.35rem] tracking-tight leading-none ${
          isLight ? "text-white" : "text-[#111827]"
        }`}
      >
        MentorMaze
      </span>
    </Link>
  );
}
