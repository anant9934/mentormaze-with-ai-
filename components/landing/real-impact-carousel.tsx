"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

export interface ImpactCardData {
  id: string;
  name: string;
  role: string;
  category: "Student" | "Alumni" | "Industry Mentor" | "Career Coach" | "Mock Interview Expert" | "Faculty Mentor";
  image: string;
  quote: string;
  rating: number;
  heightClass: string; // Alternating capsule heights
  defaultBg: string; // Background color class for default state
  defaultTextColor: string;
  defaultRoleColor: string;
}

const IMPACT_CARDS: ImpactCardData[] = [
  {
    id: "impact-1",
    name: "Aditi Sharma",
    role: "Student",
    category: "Student",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    quote: "The mock interviews gave me the exact technical confidence I needed to clear my dream SDE internship.",
    rating: 5,
    heightClass: "h-[330px] sm:h-[350px]",
    defaultBg: "bg-[#F7EBE1]", // Warm cream/peach
    defaultTextColor: "text-[#111827]",
    defaultRoleColor: "text-gray-600",
  },
  {
    id: "impact-2",
    name: "Rohan Verma",
    role: "Alumni",
    category: "Alumni",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80",
    quote: "Mentoring junior students helped me give back to the university community in the most impactful way.",
    rating: 5,
    heightClass: "h-[295px] sm:h-[315px]",
    defaultBg: "bg-[#DFE9E0]", // Soft sage green
    defaultTextColor: "text-[#111827]",
    defaultRoleColor: "text-gray-600",
  },
  {
    id: "impact-3",
    name: "Priya Mehta",
    role: "Industry Mentor",
    category: "Industry Mentor",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
    quote: "Great, curious learners and a very structured mentorship experience.",
    rating: 5,
    heightClass: "h-[380px] sm:h-[410px]", // Tallest, primary highlighted card
    defaultBg: "bg-[#0D382B]", // Dark forest green default to match reference showcase
    defaultTextColor: "text-white",
    defaultRoleColor: "text-emerald-300",
  },
  {
    id: "impact-4",
    name: "Arjun Sinha",
    role: "Career Coach",
    category: "Career Coach",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    quote: "Actionable career milestones and honest resume feedback transform student readiness.",
    rating: 5,
    heightClass: "h-[310px] sm:h-[330px]",
    defaultBg: "bg-[#F7EBE1]", // Warm cream/peach
    defaultTextColor: "text-[#111827]",
    defaultRoleColor: "text-gray-600",
  },
  {
    id: "impact-5",
    name: "Neha Kapoor",
    role: "Mock Interview Expert",
    category: "Mock Interview Expert",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80",
    quote: "The structured rubrics make identifying and fixing problem-solving gaps seamless.",
    rating: 5,
    heightClass: "h-[365px] sm:h-[390px]",
    defaultBg: "bg-[#DBE7DC]", // Soft sage green
    defaultTextColor: "text-[#111827]",
    defaultRoleColor: "text-gray-600",
  },
  {
    id: "impact-6",
    name: "Prof. A. Iyer",
    role: "Faculty Mentor",
    category: "Faculty Mentor",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80",
    quote: "Connecting academia with industry expectations bridges the crucial gap for students.",
    rating: 5,
    heightClass: "h-[310px] sm:h-[330px]",
    defaultBg: "bg-[#F7EBE1]", // Warm cream/peach
    defaultTextColor: "text-[#111827]",
    defaultRoleColor: "text-gray-600",
  },
  {
    id: "impact-7",
    name: "Kavya Nair",
    role: "Student",
    category: "Student",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
    quote: "My mentor helped me transition from raw coding to high-level distributed systems design.",
    rating: 5,
    heightClass: "h-[370px] sm:h-[395px]",
    defaultBg: "bg-[#0D382B]", // Dark forest green
    defaultTextColor: "text-white",
    defaultRoleColor: "text-emerald-300",
  },
  {
    id: "impact-8",
    name: "Rahul Desai",
    role: "Industry Mentor",
    category: "Industry Mentor",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    quote: "Honest feedback and motivated mentees make every session productive and energizing.",
    rating: 5,
    heightClass: "h-[320px] sm:h-[340px]",
    defaultBg: "bg-[#F7EBE1]", // Warm peach
    defaultTextColor: "text-[#111827]",
    defaultRoleColor: "text-gray-600",
  },
];

export function RealImpactCarousel() {
  const [activeCardId, setActiveCardId] = useState<string | null>("impact-3"); // Priya Mehta active by default as shown in mockup
  const [isHovered, setIsHovered] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Check prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  // Smooth scroll handler for chevrons
  const scroll = useCallback((direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 260;
    scrollContainerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [reducedMotion]);

  // Gentle auto-scroll ticker when not paused/hovered
  useEffect(() => {
    if (reducedMotion || isHovered || activeCardId !== null) return;

    const interval = setInterval(() => {
      if (!scrollContainerRef.current) return;
      const container = scrollContainerRef.current;
      if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
        container.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        container.scrollBy({ left: 1, behavior: "auto" });
      }
    }, 40);

    return () => clearInterval(interval);
  }, [reducedMotion, isHovered, activeCardId]);

  // Card click / tap-to-toggle
  const handleCardToggle = (id: string) => {
    setActiveCardId((prev) => (prev === id ? null : id));
  };

  // Card mouse enter
  const handleCardMouseEnter = (id: string) => {
    setActiveCardId(id);
  };

  // Card mouse leave
  const handleCardMouseLeave = () => {
    setActiveCardId(null);
  };

  return (
    <div
      className="relative w-full overflow-hidden py-4 sm:py-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
    >
      {/* ======================================================== */}
      {/* 1. SOFT CURVED FRAMING BACKDROP                          */}
      {/* Soft sage/cream curved stage matching the mockup         */}
      {/* ======================================================== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Left framing curved wing */}
        <div
          className="absolute -left-16 top-1/2 -translate-y-1/2 w-72 h-[380px] bg-[#E2ECE1]/60 rounded-tr-[160px] rounded-br-[160px] blur-sm transform -rotate-2"
          aria-hidden="true"
        />
        {/* Right framing curved wing */}
        <div
          className="absolute -right-16 top-1/2 -translate-y-1/2 w-72 h-[380px] bg-[#E2ECE1]/60 rounded-tl-[160px] rounded-bl-[160px] blur-sm transform rotate-2"
          aria-hidden="true"
        />
      </div>

      {/* ======================================================== */}
      {/* 2. CAROUSEL WRAPPER WITH NAVIGATION BUTTONS              */}
      {/* ======================================================== */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 flex items-center">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute left-2 sm:left-4 z-30 w-11 h-11 rounded-full bg-white/95 hover:bg-white border border-gray-200/80 shadow-md hover:shadow-lg flex items-center justify-center text-gray-700 hover:text-black transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#123B2E]"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Scrollable Row of Vertical Capsule Cards */}
        <div
          ref={scrollContainerRef}
          className="w-full flex items-end justify-start lg:justify-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth px-8 sm:px-12 py-8"
          style={{ minHeight: "440px" }}
          tabIndex={0}
          aria-label="Real Impact Testimonials Carousel"
        >
          {IMPACT_CARDS.map((card) => {
            const isCardActive = activeCardId === card.id;

            return (
              <div
                key={card.id}
                role="button"
                tabIndex={0}
                aria-expanded={isCardActive}
                onClick={() => handleCardToggle(card.id)}
                onMouseEnter={() => handleCardMouseEnter(card.id)}
                onMouseLeave={handleCardMouseLeave}
                onFocus={() => handleCardMouseEnter(card.id)}
                onBlur={handleCardMouseLeave}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCardToggle(card.id);
                  }
                }}
                className={`
                  relative flex-shrink-0 w-[140px] sm:w-[155px] md:w-[168px]
                  ${card.heightClass}
                  rounded-[100px] overflow-hidden
                  cursor-pointer select-none
                  transition-all duration-300 ease-out
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[#123B2E]
                  ${
                    isCardActive
                      ? "bg-[#0D382B] text-white scale-[1.03] z-20 shadow-2xl shadow-[#0D382B]/25 ring-2 ring-white/40 -translate-y-1"
                      : `${card.defaultBg} ${card.defaultTextColor} hover:scale-[1.015] shadow-sm hover:shadow-md`
                  }
                `}
              >
                {/* -------------------------------------------------- */}
                {/* CAPSULE CONTENT: Name, Role, Quote, Image          */}
                {/* -------------------------------------------------- */}
                <div className="w-full h-full flex flex-col justify-between items-center text-center p-3.5 sm:p-4 relative z-10">
                  {/* Top: Name & Role (Always visible) */}
                  <div className="pt-2 sm:pt-3 w-full">
                    <h4
                      className={`text-xs sm:text-sm font-bold tracking-tight leading-tight line-clamp-1 transition-colors duration-300 ${
                        isCardActive ? "text-white" : card.defaultTextColor
                      }`}
                    >
                      {card.name}
                    </h4>
                    <p
                      className={`text-[10px] sm:text-[11px] font-medium mt-0.5 sm:mt-1 transition-colors duration-300 ${
                        isCardActive ? "text-emerald-300" : card.defaultRoleColor
                      }`}
                    >
                      {card.role}
                    </p>
                  </div>

                  {/* Middle: Testimonial & Rating (Smooth reveal on hover/active) */}
                  <div
                    className={`
                      flex-1 flex flex-col justify-center items-start text-left w-full px-1.5 sm:px-2 py-1
                      transition-all duration-300 ease-out
                      ${
                        isCardActive
                          ? "opacity-100 translate-y-0 scale-100"
                          : "opacity-0 -translate-y-2 pointer-events-none h-0 overflow-hidden"
                      }
                    `}
                  >
                    {/* Opening Quote Mark */}
                    <span
                      className="font-serif text-2xl sm:text-3xl font-extrabold text-emerald-300/80 leading-none select-none mb-1"
                      aria-hidden="true"
                    >
                      “
                    </span>

                    {/* Testimonial Text */}
                    <p className="text-[11px] sm:text-xs italic leading-snug text-white/95 line-clamp-4 font-normal">
                      &ldquo;{card.quote}&rdquo;
                    </p>

                    {/* Verified 5-Star Rating */}
                    <div className="mt-2 flex items-center gap-0.5" aria-label={`${card.rating} stars rating`}>
                      {[...Array(card.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-[#FBBF24] text-[#FBBF24]"
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Bottom: Portrait Image (Circular/clipped inside bottom capsule curve) */}
                  <div className="w-full flex justify-center pb-1 sm:pb-2">
                    <div
                      className={`
                        relative w-20 h-20 sm:w-24 sm:h-24 md:w-26 md:h-26
                        rounded-full overflow-hidden
                        transition-all duration-300 ease-out
                        ${
                          isCardActive
                            ? "ring-2 ring-white/30 scale-105 shadow-md"
                            : "opacity-95"
                        }
                      `}
                    >
                      <Image
                        src={card.image}
                        alt={`${card.name} - ${card.role}`}
                        fill
                        sizes="(max-width: 640px) 80px, 100px"
                        className={`object-cover object-top transition-all duration-300 ${
                          isCardActive
                            ? "grayscale-0 contrast-105"
                            : "grayscale contrast-95"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute right-2 sm:right-4 z-30 w-11 h-11 rounded-full bg-white/95 hover:bg-white border border-gray-200/80 shadow-md hover:shadow-lg flex items-center justify-center text-gray-700 hover:text-black transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#123B2E]"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
