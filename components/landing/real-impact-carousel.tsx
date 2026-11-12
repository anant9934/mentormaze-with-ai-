"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

export interface ImpactCardData {
  id: string;
  name: string;
  role: string;
  category: "Student" | "Mentor";
  image: string;
  quote: string;
  rating?: number; // Optional: only shown when verified rating exists
  heightClass: string; // Alternating capsule heights
  defaultBg: string; // Background color class for default state
  defaultTextColor: string;
  defaultRoleColor: string;
}

const IMPACT_CARDS: ImpactCardData[] = [
  // --- STUDENTS (8) ---
  {
    id: "impact-1",
    name: "Mandeep Kumar",
    role: "AI/ML Student",
    category: "Student",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80",
    quote: "Having the right guidance makes a big difference when you're learning AI and machine learning. I believe mentorship can help students understand what skills to focus on, explore career opportunities and build a clearer direction for their future.",
    heightClass: "h-[340px] sm:h-[365px]",
    defaultBg: "bg-[#F7EBE1]", // Warm cream/peach
    defaultTextColor: "text-[#111827]",
    defaultRoleColor: "text-gray-600",
  },
  {
    id: "impact-2",
    name: "Dama Sri Ram",
    role: "LPU Student · Hackathon Winner",
    category: "Student",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
    quote: "Practical experience is one of the most important parts of a student's journey. Learning from people who have industry experience and understanding how to approach real-world challenges can make a huge difference.",
    heightClass: "h-[305px] sm:h-[325px]",
    defaultBg: "bg-[#DFE9E0]", // Soft sage green
    defaultTextColor: "text-[#111827]",
    defaultRoleColor: "text-gray-600",
  },
  {
    id: "impact-3",
    name: "Abhay Pratap Singh",
    role: "B.Tech CSE (AI & ML)",
    category: "Student",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    quote: "A strong learning journey is not just about completing courses. It's about developing practical skills, understanding your strengths and continuously improving. Having access to the right mentors can make that journey more structured.",
    heightClass: "h-[370px] sm:h-[395px]",
    defaultBg: "bg-[#F7EBE1]", // Warm cream/peach
    defaultTextColor: "text-[#111827]",
    defaultRoleColor: "text-gray-600",
  },
  {
    id: "impact-4",
    name: "Rudra Ojha",
    role: "LPU Student · BBA",
    category: "Student",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    quote: "Exploring different career opportunities can sometimes be confusing. Guidance from experienced people can help students understand their options, identify their interests and make more informed decisions.",
    heightClass: "h-[315px] sm:h-[335px]",
    defaultBg: "bg-[#DFE9E0]", // Soft sage green
    defaultTextColor: "text-[#111827]",
    defaultRoleColor: "text-gray-600",
  },
  {
    id: "impact-5",
    name: "Tejas Singh",
    role: "AI/ML Student",
    category: "Student",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80",
    quote: "Technology keeps evolving, and students need to keep learning beyond their classroom syllabus. Connecting with experienced professionals can provide a better understanding of practical skills and industry expectations.",
    heightClass: "h-[355px] sm:h-[380px]",
    defaultBg: "bg-[#F7EBE1]", // Warm cream/peach
    defaultTextColor: "text-[#111827]",
    defaultRoleColor: "text-gray-600",
  },
  {
    id: "impact-6",
    name: "Souyma Singh",
    role: "Newton School of Technology",
    category: "Student",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    quote: "The transition from academic learning to professional growth requires more than technical knowledge. Mentorship can help students develop confidence, explore opportunities and understand what they should work towards.",
    heightClass: "h-[320px] sm:h-[340px]",
    defaultBg: "bg-[#DFE9E0]", // Soft sage green
    defaultTextColor: "text-[#111827]",
    defaultRoleColor: "text-gray-600",
  },
  {
    id: "impact-7",
    name: "Prakrati Singh",
    role: "Student",
    category: "Student",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
    quote: "Structured learning, consistent guidance and the right direction can help students stay focused on their academic and professional goals. Having someone to guide your progress can make the learning journey more meaningful.",
    heightClass: "h-[365px] sm:h-[390px]",
    defaultBg: "bg-[#0D382B]", // Dark forest green default
    defaultTextColor: "text-white",
    defaultRoleColor: "text-emerald-300",
  },
  {
    id: "impact-8",
    name: "Shyna Thakur",
    role: "Student",
    category: "Student",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
    quote: "Career development is a continuous process. Having access to people who can share their experiences, provide useful perspectives and help you think about your next steps can be extremely valuable.",
    heightClass: "h-[310px] sm:h-[330px]",
    defaultBg: "bg-[#F7EBE1]", // Warm peach
    defaultTextColor: "text-[#111827]",
    defaultRoleColor: "text-gray-600",
  },

  // --- MENTORS (4) ---
  {
    id: "impact-9",
    name: "Dr. Mohit Arora",
    role: "HOD, Machine Learning, LPU",
    category: "Mentor",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80",
    quote: "Mentorship plays an important role in connecting academic learning with practical understanding. Students benefit when they receive guidance that encourages critical thinking, continuous learning and the application of knowledge to real-world challenges.",
    heightClass: "h-[385px] sm:h-[415px]", // Primary featured card
    defaultBg: "bg-[#0D382B]", // Dark forest green
    defaultTextColor: "text-white",
    defaultRoleColor: "text-emerald-300",
  },
  {
    id: "impact-10",
    name: "Dr. Neeta Rana",
    role: "Academic Professional",
    category: "Mentor",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
    quote: "Every student has different strengths, interests and aspirations. Effective mentorship is about understanding those individual needs and helping students develop the confidence and clarity to move forward.",
    heightClass: "h-[350px] sm:h-[375px]",
    defaultBg: "bg-[#DBE7DC]", // Soft sage green
    defaultTextColor: "text-[#111827]",
    defaultRoleColor: "text-gray-600",
  },
  {
    id: "impact-11",
    name: "Akansha Pandey",
    role: "Cybersecurity Expert",
    category: "Mentor",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80",
    quote: "In a rapidly changing technology landscape, students need to understand more than theoretical concepts. Exposure to practical perspectives, industry expectations and continuous learning is essential for building a strong foundation in cybersecurity.",
    heightClass: "h-[370px] sm:h-[395px]",
    defaultBg: "bg-[#F7EBE1]", // Warm cream/peach
    defaultTextColor: "text-[#111827]",
    defaultRoleColor: "text-gray-600",
  },
  {
    id: "impact-12",
    name: "Komal Gupta",
    role: "Mentor",
    category: "Mentor",
    image: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=600&q=80",
    quote: "Mentorship is a two-way learning experience. It gives mentors an opportunity to share their knowledge, understand students' challenges and contribute to someone else's growth through meaningful guidance.",
    heightClass: "h-[325px] sm:h-[345px]",
    defaultBg: "bg-[#DFE9E0]", // Soft sage green
    defaultTextColor: "text-[#111827]",
    defaultRoleColor: "text-gray-600",
  },
];

export function RealImpactCarousel() {
  const [activeCardId, setActiveCardId] = useState<string | null>("impact-9"); // Dr. Mohit Arora active initially to demonstrate the hover experience
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
    const scrollAmount = 280;
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
          className="w-full flex items-end justify-start gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth px-8 sm:px-12 py-8"
          style={{ minHeight: "450px" }}
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
                  relative flex-shrink-0 w-[145px] sm:w-[160px] md:w-[172px]
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
                      className={`text-[10px] sm:text-[11px] font-medium mt-0.5 sm:mt-1 transition-colors duration-300 line-clamp-1 ${
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
                    <p className="text-[11px] sm:text-[11.5px] italic leading-snug text-white/95 line-clamp-5 font-normal">
                      &ldquo;{card.quote}&rdquo;
                    </p>

                    {/* Optional Verified Rating: only rendered if actual rating was submitted */}
                    {card.rating ? (
                      <div className="mt-2 flex items-center gap-0.5" aria-label={`${card.rating} stars rating`}>
                        {[...Array(card.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-[#FBBF24] text-[#FBBF24]"
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                    ) : null}
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
