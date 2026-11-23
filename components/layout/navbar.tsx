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

  const leftNavLinks: { label: string; href: string; isAi?: boolean }[] = [
    { label: "Find a Mentor", href: "/mentors" },
    { label: "AI Mentor", href: "/ai-mentor", isAi: true },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Pricing", href: "/pricing" },
  ];

  const rightNavLinks: { label: string; href: string; isAi?: boolean }[] = [];

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
                  className={`transition-colors hover:text-[#123B2E] flex items-center gap-1.5 ${isActive ? "text-[#123B2E] font-bold" : "text-[#1F2937]"
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

        {/* Mobile menu trigger & notifications */}
        <div className="flex md:hidden items-center gap-2">
          {user && <NotificationBell />}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-[#1F2937] hover:bg-[#F3EFE6] hover:text-[#123B2E] transition-colors focus:outline-none focus:ring-2 focus:ring-[#123B2E]/20"
            aria-label="Toggle Navigation"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu backdrop & drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 top-20 bg-ink-950/40 backdrop-blur-xs z-30 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-40 md:hidden border-b border-border bg-[#FBF8F1] px-5 pt-3 pb-6 shadow-xl max-h-[calc(100vh-5rem)] overflow-y-auto">
            {/* User header if logged in */}
            {user && (
              <div className="mb-4 p-3 rounded-2xl bg-cream-100/80 border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-forest-900 text-white flex items-center justify-center text-xs font-bold">
                    {(user.displayName || user.email || "U").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-ink-950 block truncate max-w-[180px]">
                      {user.displayName || "My Account"}
                    </span>
                    <span className="text-[10px] text-forest-800 font-semibold uppercase tracking-wider block">
                      {role === "admin" ? "Platform Admin" : role === "mentor" ? "Verified Mentor" : "Student"}
                    </span>
                  </div>
                </div>
                <Link
                  href={getDashboardHref()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-bold text-forest-900 hover:underline"
                >
                  Dashboard →
                </Link>
              </div>
            )}

            <div className="space-y-1">
              {[...leftNavLinks, ...rightNavLinks].map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isActive
                      ? "bg-forest-900 text-white"
                      : "text-[#1F2937] hover:bg-cream-100 hover:text-[#123B2E]"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{link.label}</span>
                      {link.isAi && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${isActive
                          ? "bg-emerald-500 text-forest-950"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          }`}>
                          24/7
                        </span>
                      )}
                    </div>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                  </Link>
                );
              })}
            </div>

            <div className="pt-4 mt-3 border-t border-gray-200">
              <Link
                href={user ? getDashboardHref() : "/login"}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold text-white bg-[#123B2E] hover:bg-[#0E2E24] shadow-sm transition-all"
              >
                <span>{user ? "Go to Dashboard" : "Get Started"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
