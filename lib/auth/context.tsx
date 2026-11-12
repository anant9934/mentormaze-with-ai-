"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { SessionUser, DEFAULT_DEMO_STUDENT, DEFAULT_DEMO_MENTOR, DEFAULT_DEMO_ADMIN } from "./session";

interface AuthContextType {
  user: SessionUser | null;
  role: "student" | "mentor" | "admin";
  switchRole: (role: "student" | "mentor" | "admin") => void;
  login: (email: string, role?: "student" | "mentor" | "admin") => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<"student" | "mentor" | "admin", SessionUser> = {
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
  const [user, setUser] = useState<SessionUser | null>(DEMO_USERS.student);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Persist active role in localStorage if available
    const savedRole = typeof window !== "undefined" ? localStorage.getItem("mm_active_role") : null;
    if (savedRole && (savedRole === "student" || savedRole === "mentor" || savedRole === "admin")) {
      setRole(savedRole);
      setUser(DEMO_USERS[savedRole]);
    }
  }, []);

  const switchRole = (newRole: "student" | "mentor" | "admin") => {
    setRole(newRole);
    setUser(DEMO_USERS[newRole]);
    if (typeof window !== "undefined") {
      localStorage.setItem("mm_active_role", newRole);
    }
  };

  const login = (email: string, preferredRole: "student" | "mentor" | "admin" = "student") => {
    setIsLoading(true);
    setTimeout(() => {
      const selected = DEMO_USERS[preferredRole];
      setUser({ ...selected, email });
      setRole(preferredRole);
      if (typeof window !== "undefined") {
        localStorage.setItem("mm_active_role", preferredRole);
      }
      setIsLoading(false);
    }, 200);
  };

  const logout = () => {
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
