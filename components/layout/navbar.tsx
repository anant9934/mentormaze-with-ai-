"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { useAuth } from "@/lib/auth/context";
import { Menu, X, ArrowRight, LayoutDashboard } from "lucide-react";
import { NotificationBell } from "@/components/layout/notification-bell";

export function Navbar() {
  const pathname = usePathname();
  const { user, role } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const leftNavLinks = [
    { label: "Programs", href: "/programs" },
    { label: "Mentors", href: "/mentors" },
    { label: "AI Mentor", href: "/ai-mentor", isAi: true },
    { label: "Mock Practice", href: "/mock-interviews/practice" },
  ];

  const rightNavLinks = [
    { label: "Resources", href: "/how-it-works" },
    { label: "About", href: "/how-it-works" },
  ];

  const getDashboardHref = () => {
    if (role === "admin") return "/admin";
    if (role === "mentor") return "/mentor/dashboard";
    return "/dashboard";
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FBF8F1]/95 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <Logo />

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-9 text-sm font-semibold text-[#1F2937]">
          <div className="flex items-center gap-7">
            {leftNavLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`transition-colors hover:text-[#123B2E] flex items-center gap-1.5 ${
                    isActive ? "text-[#123B2E] font-bold" : "text-[#1F2937]"
                  }`}
                >
                  <span>{link.label}</span>
                  {link.isAi && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm animate-pulse">
                      24/7
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="w-8" />

          <div className="flex items-center gap-8">
            {rightNavLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="transition-colors hover:text-[#123B2E] text-[#1F2937]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Right CTA Button: "Get Started →" */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <NotificationBell />
              <Link
                href={getDashboardHref()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-[#123B2E] hover:bg-[#0E2E24] transition-all shadow-sm"
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                <span>{role === "admin" ? "Admin Portal" : role === "mentor" ? "Mentor Space" : "Dashboard"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-[#123B2E] hover:bg-[#0E2E24] transition-all shadow-sm"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#1F2937] hover:text-[#123B2E] focus:outline-none"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-[#FBF8F1] px-6 pt-3 pb-6 space-y-3 shadow-lg">
          {[...leftNavLinks, ...rightNavLinks].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#1F2937] hover:text-[#123B2E]"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-gray-200">
            <Link
              href={user ? getDashboardHref() : "/login"}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-[#123B2E]"
            >
              <span>{user ? "Go to Dashboard" : "Get Started"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
