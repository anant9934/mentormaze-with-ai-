"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { useAuth } from "@/lib/auth/context";
import { Menu, X, ArrowRight, LayoutDashboard } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { user, role } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Programs", href: "/programs" },
    { label: "Mentors", href: "/mentors" },
    { label: "Mock Interviews", href: "/mock-interviews" },
    { label: "Pricing", href: "/pricing" },
    { label: "How It Works", href: "/how-it-works" },
  ];

  const getDashboardHref = () => {
    if (role === "admin") return "/admin";
    if (role === "mentor") return "/mentor/dashboard";
    return "/dashboard";
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-cream-50/95 backdrop-blur-md border-b border-border transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <Logo />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-ink-700">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors hover:text-forest-900 ${
                  isActive ? "text-forest-900 font-semibold" : ""
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <Link
              href={getDashboardHref()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white bg-forest-900 hover:bg-forest-800 transition-all shadow-sm"
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-400" />
              <span>{role === "admin" ? "Admin Portal" : role === "mentor" ? "Mentor Space" : "My Dashboard"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-ink-700 hover:text-forest-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="btn-primary text-sm inline-flex items-center gap-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-ink-700 hover:text-forest-900 focus:outline-none"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-cream-50 px-4 pt-2 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-ink-700 hover:bg-cream-100 hover:text-forest-900"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-border flex flex-col gap-2">
            {user ? (
              <Link
                href={getDashboardHref()}
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary w-full text-center"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-secondary w-full text-center"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary w-full text-center"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
