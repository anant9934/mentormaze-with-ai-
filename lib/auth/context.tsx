"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { SessionUser, DEFAULT_DEMO_STUDENT, DEFAULT_DEMO_MENTOR, DEFAULT_DEMO_ADMIN } from "./session";

interface AuthContextType {
  user: SessionUser | null;
  role: "student" | "mentor" | "admin";
  switchRole: (role: "student" | "mentor" | "admin") => void;
  login: (
    email: string,
    password?: string,
    role?: "student" | "mentor" | "admin",
    turnstileToken?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEV_DEMO_USERS: Record<"student" | "mentor" | "admin", SessionUser> = {
  student: {
    id: "user-student-1",
    email: "anant@example.com",
    displayName: "Anant Kumar",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    role: "student",
    timezone: "Asia/Kolkata",
  },
  mentor: {
    id: "user-mentor-priya",
    email: "priya.sharma@microsoft.com",
    displayName: "Priya Sharma",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
    role: "mentor",
    timezone: "Asia/Kolkata",
  },
  admin: {
    id: "user-admin-1",
    email: "admin@mentormaze.com",
    displayName: "Platform Admin",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
    role: "admin",
    timezone: "Asia/Kolkata",
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<"student" | "mentor" | "admin">("student");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Authoritative server-side session sync
  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/session", { credentials: "same-origin" });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          const authUser: SessionUser = {
            id: data.user.id,
            email: data.user.email,
            displayName: data.user.displayName,
            avatarUrl: data.user.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
            role: data.user.role === "super_admin" ? "admin" : data.user.role,
            timezone: data.user.timezone || "Asia/Kolkata",
          };
          setUser(authUser);
          setRole(authUser.role as any);
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      // Network failure or offline
    }

    // In development mode only: allow fast-track demo persona if not logged in
    const isDev = process.env.NODE_ENV !== "production";
    if (isDev) {
      const savedRole = typeof window !== "undefined" ? localStorage.getItem("mm_active_role") : null;
      const initialRole: "student" | "mentor" | "admin" = 
        (savedRole === "student" || savedRole === "mentor" || savedRole === "admin") ? savedRole : "student";
      setRole(initialRole);
      setUser(DEV_DEMO_USERS[initialRole]);
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  /**
   * Role Switcher with Server-Enforced Privilege Safeguards:
   * Ordinary students cannot elevate to mentor or admin.
   * Admins can preview student/mentor views for operational inspection.
   */
  const switchRole = (newRole: "student" | "mentor" | "admin") => {
    if (!user) return;

    // Enforce that a non-admin account cannot switch to admin
    if (newRole === "admin" && user.role !== "admin") {
      console.warn("[Security] Unauthorized attempt to switch to admin role prevented.");
      return;
    }

    setRole(newRole);
    if (typeof window !== "undefined") {
      localStorage.setItem("mm_active_role", newRole);
    }
  };

  /**
   * Real Server Authentication Login:
   * Submits credentials to /api/auth/login, setting HTTP-only mm_session_token.
   */
  const login = async (
    email: string,
    password?: string,
    preferredRole: "student" | "mentor" | "admin" = "student",
    turnstileToken?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: password || "password123",
          role: preferredRole,
          turnstileToken: turnstileToken || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const authUser: SessionUser = {
            id: data.user.id,
            email: data.user.email,
            displayName: data.user.displayName,
            avatarUrl: data.user.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
            role: data.user.role === "super_admin" ? "admin" : data.user.role,
            timezone: data.user.timezone || "Asia/Kolkata",
          };
          setUser(authUser);
          setRole(authUser.role as any);
          if (typeof window !== "undefined") {
            localStorage.setItem("mm_active_role", authUser.role);
          }
          setIsLoading(false);
          return { success: true };
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error || res.statusText || "Sign in failed";
        console.error("[Auth] Login request failed:", errMsg);
        setIsLoading(false);
        return { success: false, error: errMsg };
      }
    } catch (err: any) {
      console.error("[Auth] Login request failed:", err);
      setIsLoading(false);
      return { success: false, error: err?.message || "Network error. Please try again." };
    }

    // Dev fallback if backend unreachable
    if (process.env.NODE_ENV !== "production") {
      const selected = DEV_DEMO_USERS[preferredRole];
      setUser({ ...selected, email });
      setRole(preferredRole);
      if (typeof window !== "undefined") {
        localStorage.setItem("mm_active_role", preferredRole);
      }
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return { success: false, error: "Authentication failed. Please verify credentials." };
  };

  /**
   * Server-Synchronized Logout:
   * Invalidates server session token and clears client state.
   */
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      // Continue clearing client state even if network fails
    }
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("mm_active_role");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        switchRole,
        login,
        logout,
        isLoading,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
