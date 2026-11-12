"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";

interface MentorItem {
  id: string;
  name: string;
  role: string;
  image: string;
  bgColor: string;
  shirtColor: string;
}

const MENTORS: MentorItem[] = [
  {
    id: "m1",
    name: "Elena Rostova",
    role: "Senior AI Engineer",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    bgColor: "from-[#F59E0B]/80 to-[#B45309]", // Warm mustard/amber
    shirtColor: "#D97706",
  },
  {
    id: "m2",
    name: "Devon Vance",
    role: "Full-Stack Architect",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80",
    bgColor: "from-[#6D28D9]/90 to-[#4C1D95]", // Rich purple
    shirtColor: "#581C87",
  },
  {
    id: "m3",
    name: "Marcus Cole",
    role: "Staff Infrastructure Lead",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
    bgColor: "from-[#374151] to-[#111827]", // Dark charcoal
    shirtColor: "#1F2937",
  },
  {
    id: "m4",
    name: "Aria Chen",
    role: "Director of Product",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
    bgColor: "from-[#0D9488]/90 to-[#115E59]", // Teal/marine
    shirtColor: "#0F766E",
  },
  {
    id: "m5",
    name: "Zayan Khan",
    role: "Engineering Manager",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    bgColor: "from-[#EC4899]/80 to-[#BE185D]", // Vibrant rose pink
    shirtColor: "#DB2777",
  },
  {
    id: "m6",
    name: "Maya Lin",
    role: "Principal ML Scientist",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
    bgColor: "from-[#A855F7]/80 to-[#7E22CE]", // Lavender purple
    shirtColor: "#9333EA",
  },
  {
    id: "m7",
    name: "Julian Harris",
    role: "VP of Engineering",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    bgColor: "from-[#F97316]/90 to-[#C2410C]", // Bright orange
    shirtColor: "#EA580C",
  },
  {
    id: "m8",
    name: "Rahul Verma",
    role: "Data Systems Architect",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80",
    bgColor: "from-[#F43F5E]/80 to-[#BE123C]", // Bright magenta
    shirtColor: "#E11D48",
  },
];

// Tripled to allow seamless infinite wrapping
const REPEATED_ITEMS = [...MENTORS, ...MENTORS, ...MENTORS];

export function CurvedHeroCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeDot, setActiveDot] = useState(0);

  // Animation & Drag state
  const offsetRef = useRef(0);
  const isPausedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const targetOffsetRef = useRef<number | null>(null);

  // Geometry constants (responsive)
  const getCardMetrics = useCallback(() => {
    if (typeof window === "undefined") {
      return { cardWidth: 175, gap: 14, cardSpacing: 189, perspective: 1000 };
    }
    const isMobile = window.innerWidth < 640;
    const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;
    
    if (isMobile) {
      return { cardWidth: 120, gap: 10, cardSpacing: 130, perspective: 700 };
    }
    if (isTablet) {
      return { cardWidth: 150, gap: 12, cardSpacing: 162, perspective: 850 };
    }
    return { cardWidth: 178, gap: 14, cardSpacing: 192, perspective: 1000 };
  }, []);

  // Update card positions in 3D space
  const updateCardTransforms = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const centerX = containerWidth / 2;
    const { cardSpacing, cardWidth, perspective } = getCardMetrics();
    const singleSetWidth = MENTORS.length * cardSpacing;

    // Normalize offset within [0, singleSetWidth)
    let currentOffset = offsetRef.current % singleSetWidth;
    if (currentOffset < 0) currentOffset += singleSetWidth;
    offsetRef.current = currentOffset;

    let closestIndex = 0;
    let minDistanceToCenter = Infinity;

    REPEATED_ITEMS.forEach((_, idx) => {
      const cardEl = cardRefs.current[idx];
      if (!cardEl) return;

      // Position relative to track
      const rawX = idx * cardSpacing - currentOffset;
      // Center the item
      const itemCenterX = rawX + cardWidth / 2;
      // Distance from center of container
      let distFromCenter = itemCenterX - centerX;

      // Wrap around for continuous loop
      const totalWidth = REPEATED_ITEMS.length * cardSpacing;
      if (distFromCenter < -totalWidth / 2) distFromCenter += totalWidth;
      if (distFromCenter > totalWidth / 2) distFromCenter -= totalWidth;

      // Normalized position: -1.0 is left half, +1.0 is right half
      const halfContainer = containerWidth / 2;
      const u = distFromCenter / (halfContainer * 0.95);

      // Track closest card to dead center for pagination dots
      const absDist = Math.abs(distFromCenter);
      if (absDist < minDistanceToCenter) {
        minDistanceToCenter = absDist;
        closestIndex = idx % 4; // 4 dots cycle
      }

      // Hide cards far outside viewport to save GPU
      if (Math.abs(u) > 1.8) {
        cardEl.style.display = "none";
        return;
      }
      cardEl.style.display = "block";

      // 3D CONCAVE CYLINDRICAL TRANSFORMS:
      // When u < 0 (left of center):
      // rotateY is positive (left side turns toward viewer, right side turns away)
      // This produces the trapezoid where left edge is taller and right edge is shorter!
      // When u > 0 (right of center):
      // rotateY is negative (right side turns toward viewer, left side turns away)
      const rotateY = -u * 22; // max ~28deg at edges
      
      // Outer cards curve forward toward the viewer (+Z in perspective)
      // and lift slightly along the concave arc
      const translateZ = Math.min(Math.abs(u) * 55, 80);
      const translateY = -Math.abs(u) * 6; // subtle arch curve
      const scale = 1 + Math.min(Math.abs(u) * 0.12, 0.2);

      // Z-index: center cards or extreme outer cards? In concave cylinder, outer cards come closer!
      const zIndex = Math.round(Math.abs(u) * 10);

      cardEl.style.transform = `perspective(${perspective}px) translate3d(${distFromCenter}px, ${translateY}px, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;
      cardEl.style.zIndex = `${zIndex}`;
      
      // Subtle depth darkening on inner side of outer cards
      const brightness = Math.max(0.88, 1 - Math.abs(u) * 0.08);
      cardEl.style.filter = `brightness(${brightness})`;
    });

    setActiveDot(closestIndex);
  }, [getCardMetrics]);

  // Main animation loop
  useEffect(() => {
    let animId: number;

    const tick = (time: number) => {
      if (lastTimeRef.current !== null) {
        const delta = Math.min((time - lastTimeRef.current) / 1000, 0.1);

        // Handle smooth glide to target (from dot clicks)
        if (targetOffsetRef.current !== null) {
          const diff = targetOffsetRef.current - offsetRef.current;
          if (Math.abs(diff) < 1) {
            offsetRef.current = targetOffsetRef.current;
            targetOffsetRef.current = null;
          } else {
            offsetRef.current += diff * 0.08;
          }
          updateCardTransforms();
        } else if (!isPausedRef.current && !isDraggingRef.current) {
          // Standard auto-scroll speed: ~38px per second
          const speed = 38;
          offsetRef.current += speed * delta;
          updateCardTransforms();
        }
      }
      lastTimeRef.current = time;
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [updateCardTransforms]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => updateCardTransforms();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateCardTransforms]);

  // Pointer Drag Handlers (Mouse & Touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartOffsetRef.current = offsetRef.current;
    targetOffsetRef.current = null;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - dragStartXRef.current;
    offsetRef.current = dragStartOffsetRef.current - deltaX;
    updateCardTransforms();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Dot Click Navigation
  const handleDotClick = (dotIndex: number) => {
    const { cardSpacing } = getCardMetrics();
    // Glide to next alignment of that dot
    const currentBase = Math.floor(offsetRef.current / (cardSpacing * 4)) * (cardSpacing * 4);
    let target = currentBase + dotIndex * cardSpacing;
    if (target < offsetRef.current - cardSpacing) {
      target += cardSpacing * 4;
    }
    targetOffsetRef.current = target;
  };

  return (
    <div className="relative w-full overflow-hidden select-none py-6">
      {/* ======================================================== */}
      {/* 1. SOFT CURVED AMPHITHEATER BACKGROUND GRAPHIC           */}
      {/* Matches the curved sage backdrop in the reference mockup */}
      {/* ======================================================== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Left framing curved wing */}
        <div 
          className="absolute -left-20 top-0 w-80 sm:w-96 h-full bg-[#E5ECE2]/70 rounded-tr-[160px] rounded-br-[80px] blur-sm transform -rotate-3"
          aria-hidden="true"
        />
        {/* Right framing curved wing */}
        <div 
          className="absolute -right-20 top-0 w-80 sm:w-96 h-full bg-[#E5ECE2]/70 rounded-tl-[160px] rounded-bl-[80px] blur-sm transform rotate-3"
          aria-hidden="true"
        />
        {/* Subtle center warm glow */}
        <div 
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-44 bg-gradient-to-r from-transparent via-[#E8EFE5]/50 to-transparent blur-xl"
          aria-hidden="true"
        />
      </div>

      {/* ======================================================== */}
      {/* 2. 3D CYLINDRICAL AUTO-SCROLLING CAROUSEL TRACK          */}
      {/* ======================================================== */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseEnter={() => {
          isPausedRef.current = true;
        }}
        onMouseLeave={() => {
          isPausedRef.current = false;
        }}
        className="relative h-[240px] sm:h-[280px] md:h-[320px] w-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-pan-y"
        style={{
          perspective: "1000px",
          perspectiveOrigin: "50% 50%",
          transformStyle: "preserve-3d",
        }}
      >
        {REPEATED_ITEMS.map((mentor, index) => {
          const { cardWidth } = getCardMetrics();
          return (
            <div
              key={`${mentor.id}-${index}`}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              className="absolute top-1/2 left-1/2 will-change-transform transition-[filter] duration-200"
              style={{
                width: `${cardWidth}px`,
                height: `${Math.round(cardWidth * 1.34)}px`,
                marginLeft: `-${cardWidth / 2}px`,
                marginTop: `-${Math.round((cardWidth * 1.34) / 2)}px`,
                transformStyle: "preserve-3d",
              }}
            >
              {/* Card Container with Rounded Corners & Subtle Border */}
              <div 
                className="w-full h-full rounded-[22px] sm:rounded-[28px] overflow-hidden shadow-md transition-shadow hover:shadow-2xl relative bg-white"
                style={{
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                }}
              >
                {/* Vibrant Background Gradient matching mockup card color */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-b ${mentor.bgColor} opacity-90`}
                />

                {/* Mentor Portrait Headshot */}
                <Image
                  src={mentor.image}
                  alt={mentor.name}
                  fill
                  sizes="(max-width: 640px) 140px, (max-width: 1024px) 170px, 200px"
                  className="object-cover object-top mix-blend-multiply opacity-95 pointer-events-none"
                  priority={index >= 8 && index <= 12}
                />

                {/* Secondary natural overlay to keep skin tones vivid while having colored backdrop */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
                
                {/* Smooth border outline */}
                <div className="absolute inset-0 rounded-[22px] sm:rounded-[28px] ring-1 ring-inset ring-white/20 pointer-events-none" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 3. 4 PAGINATION INDICATOR DOTS                           */}
      {/* Matches the 4 dots in the reference mockup               */}
      {/* ======================================================== */}
      <div className="mt-4 sm:mt-6 flex items-center justify-center gap-2.5 relative z-20">
        {[0, 1, 2, 3].map((dot) => (
          <button
            key={dot}
            type="button"
            onClick={() => handleDotClick(dot)}
            aria-label={`Navigate to slide ${dot + 1}`}
            className={`transition-all duration-300 rounded-full ${
              activeDot === dot
                ? "w-2.5 h-2.5 bg-[#123B2E] ring-4 ring-[#123B2E]/15"
                : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

