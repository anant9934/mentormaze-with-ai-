"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { Logo } from "@/components/shared/logo";
import { store } from "@/lib/data/store";
import {
  Home,
  Search,
  Award,
  Calendar,
  TrendingUp,
  BookOpen,
  MessageSquare,
  Bell,
  Menu,
  X,
  Sparkles,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notifications = store.getNotifications(user?.id || "user-student-1");
  const unreadNotifs = notifications.filter((n) => !n.isRead);

  const navItems = [
    { label: "Home", href: "/dashboard", icon: Home },
    { label: "Find Mentors", href: "/mentors", icon: Search },
    { label: "Mock Interviews", href: "/dashboard/mock-interviews", icon: Award },
    { label: "My Sessions", href: "/dashboard/sessions", icon: Calendar },
    { label: "My Progress", href: "/dashboard/progress", icon: TrendingUp },
    { label: "Resources", href: "/dashboard/resources", icon: BookOpen },
    { label: "Messages", href: "/dashboard/messages", icon: MessageSquare, badge: 3 },
  ];

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col md:flex-row">
      {/* LEFT SIDEBAR (Desktop) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-border flex-col justify-between p-6 flex-shrink-0 sticky top-0 h-screen">
        <div>
          {/* Logo */}
          <div className="pb-8">
            <Logo />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-forest-900 text-white shadow-sm"
                      : "text-ink-700 hover:bg-cream-100 hover:text-ink-950"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-forest-700"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                        isActive ? "bg-emerald-500 text-forest-950" : "bg-forest-900 text-white"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Help Card */}
        <div className="p-4 rounded-2xl bg-cream-50 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-4 h-4 text-forest-800" />
            <h4 className="text-xs font-bold text-ink-950">Need Help?</h4>
          </div>
          <p className="text-[11px] text-ink-500 mb-3">Questions about bookings or mock rubrics?</p>
          <a
            href="mailto:support@mentormaze.com"
            className="text-xs font-bold text-forest-900 hover:underline flex items-center gap-1"
          >
            <span>Contact Support</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top App Header */}
        <header className="h-16 bg-white border-b border-border px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-2 text-ink-700"
            >
              {mobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Global Search Bar */}
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream-50 border border-border w-72 text-xs text-ink-500">
              <Search className="w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search mentors, interviews, topics..."
                className="bg-transparent w-full text-xs text-ink-950 focus:outline-none"
              />
              <kbd className="px-1.5 py-0.5 rounded bg-cream-200 text-[10px] text-ink-700 font-mono">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right Icons: Notifications & User Avatar */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-full hover:bg-cream-100 text-ink-700 relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white"></span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-border shadow-elevated p-4 z-40 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="font-bold text-xs text-ink-950">Notifications</span>
                    <span className="text-[10px] text-ink-500">{unreadNotifs.length} new</span>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-2.5 rounded-xl bg-cream-50 border border-border text-xs">
                        <span className="font-bold text-ink-950 block">{n.title}</span>
                        <p className="text-[11px] text-ink-700 mt-0.5">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-border">
              <div className="relative w-9 h-9 rounded-full overflow-hidden bg-cream-200 flex-shrink-0">
                <Image
                  src={
                    user?.avatarUrl ||
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
                  }
                  alt={user?.displayName || "User"}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-bold text-ink-950 block leading-tight">
                  {user?.displayName || "Anant Kumar"}
                </span>
                <span className="text-[10px] text-ink-500 uppercase tracking-wider">
                  {user?.role || "Student"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

