"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import {
  ArrowRight,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  Github,
  Mail,
  ArrowUpRight,
  Globe,
  ChevronDown,
} from "lucide-react";

export function Footer() {
  return (
    <footer id="contact" className="w-full relative bg-[#0E3B2E] text-white overflow-hidden">
      {/* Top Organic Wave Transition from Cream background to Forest Green */}
      <div className="w-full overflow-hidden leading-none bg-[#FBF8F1]">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative block w-full h-14 sm:h-20 text-[#0E3B2E] preserve-3d"
        >
          <path
            d="M0 0C240 70 480 90 720 50C960 10 1200 40 1440 80V120H0V0Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-12 pb-10">
        {/* Main 5-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-14 border-b border-[#1C4E3D]">
          {/* Column 1: Brand & Socials (span 4) */}
          <div className="lg:col-span-4 space-y-4">
            <Logo variant="light" />
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xs leading-relaxed">
              A mentorship platform to learn, grow, and achieve your goals.
            </p>
            {/* Social Icons in rounded square/pill outline buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg border border-[#1F5443] bg-[#0E3B2E] flex items-center justify-center text-emerald-100 hover:text-white hover:border-emerald-400 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg border border-[#1F5443] bg-[#0E3B2E] flex items-center justify-center text-emerald-100 hover:text-white hover:border-emerald-400 transition-colors"
                aria-label="X"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg border border-[#1F5443] bg-[#0E3B2E] flex items-center justify-center text-emerald-100 hover:text-white hover:border-emerald-400 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg border border-[#1F5443] bg-[#0E3B2E] flex items-center justify-center text-emerald-100 hover:text-white hover:border-emerald-400 transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg border border-[#1F5443] bg-[#0E3B2E] flex items-center justify-center text-emerald-100 hover:text-white hover:border-emerald-400 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Product (span 2) */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-bold text-white mb-4">Product</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-emerald-100/80">
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Platform
                </Link>
              </li>
              <li>
                <Link href="/programs" className="hover:text-white transition-colors">
                  Programs
                </Link>
              </li>
              <li>
                <Link href="/mentors" className="hover:text-white transition-colors">
                  Mentors
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources (span 2) */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-bold text-white mb-4">Resources</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-emerald-100/80">
              <li>
                <Link href="/how-it-works" className="hover:text-white transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-white transition-colors">
                  Guides
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Company (span 2) */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-bold text-white mb-4">Company</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-emerald-100/80 mb-4">
              <li>
                <Link href="/how-it-works" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-[#0E3B2E] font-semibold text-xs hover:bg-emerald-50 transition-colors shadow-sm"
            >
              <span>Support</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Column 5: Stay in the Loop (span 2) */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm mb-3">
              <Mail className="w-4 h-4 text-emerald-300" />
              <span>Stay in the Loop</span>
            </div>
            <p className="text-xs text-emerald-100/80 mb-3 leading-relaxed">
              Get updates on mentors, programs, and new features.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="relative flex items-center">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-white rounded-full py-2.5 pl-4 pr-11 text-xs text-[#111827] placeholder-gray-400 focus:outline-none shadow-sm"
              />
              <button
                type="submit"
                className="absolute right-1 w-8 h-8 rounded-full bg-[#82BE9F] hover:bg-[#68A987] flex items-center justify-center text-[#0E3B2E] transition-colors"
                aria-label="Subscribe"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Legal */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-100/70 gap-4">
          <p>© 2026 MentorMaze. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span className="text-[#1F5443]">|</span>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <span className="text-[#1F5443]">|</span>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Cookie Policy
            </Link>
            <span className="text-[#1F5443]">|</span>
            <div className="flex items-center gap-1 hover:text-white cursor-pointer transition-colors">
              <Globe className="w-3.5 h-3.5" />
              <span>English</span>
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
