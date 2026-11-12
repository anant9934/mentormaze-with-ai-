"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Linkedin, Twitter, Instagram, Youtube, Github, Send } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-forest-900 text-cream-50 pt-16 pb-12 border-t border-forest-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-forest-800/80">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                  <path d="M4 19V5l8 7 8-7v14" />
                </svg>
              </div>
              <span className="font-serif text-2xl text-white font-bold">MentorMaze</span>
            </div>
            <p className="text-sm text-forest-200 max-w-sm leading-relaxed">
              A student-first human mentorship and mock interview platform under AI Tathastu. Real people. Real guidance. Measurable growth.
            </p>
            <div className="flex items-center gap-3 pt-2 text-forest-300">
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-forest-800 flex items-center justify-center hover:bg-emerald-700 hover:text-white transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://x.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-forest-800 flex items-center justify-center hover:bg-emerald-700 hover:text-white transition-colors" aria-label="X">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-forest-800 flex items-center justify-center hover:bg-emerald-700 hover:text-white transition-colors" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-forest-800 flex items-center justify-center hover:bg-emerald-700 hover:text-white transition-colors" aria-label="YouTube">
                <Youtube className="w-4 h-4" />
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-forest-800 flex items-center justify-center hover:bg-emerald-700 hover:text-white transition-colors" aria-label="GitHub">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-forest-400 font-semibold mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm text-forest-200">
              <li><Link href="/mentors" className="hover:text-white transition-colors">Explore Mentors</Link></li>
              <li><Link href="/mock-interviews" className="hover:text-white transition-colors">Mock Interviews</Link></li>
              <li><Link href="/programs" className="hover:text-white transition-colors">Mentorship Programs</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pilot Pricing</Link></li>
              <li><Link href="/mentor/apply" className="hover:text-white transition-colors">Become a Mentor</Link></li>
            </ul>
          </div>

          {/* Resources links */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-forest-400 font-semibold mb-4">Resources</h4>
            <ul className="space-y-2.5 text-sm text-forest-200">
              <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ & Support</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Data & Consent</Link></li>
            </ul>
          </div>

          {/* Stay in the Loop */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-forest-400 font-semibold mb-4">Stay in the Loop</h4>
            <p className="text-xs text-forest-200 mb-3">Get updates on mentors, verified programs, and upcoming sessions.</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center rounded-full bg-forest-800/80 p-1 border border-forest-700">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-transparent px-3 py-1.5 text-xs text-white placeholder-forest-400 focus:outline-none"
              />
              <button
                type="submit"
                className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white transition-colors flex-shrink-0"
                aria-label="Subscribe"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-forest-400 gap-4">
          <p>© 2026 MentorMaze (AI Tathastu Ecosystem). All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link href="/ethics" className="hover:text-white transition-colors">Ethics & Safety</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
