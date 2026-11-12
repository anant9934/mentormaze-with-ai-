import { UserRecord } from "@/lib/data/mock-data";
import { store } from "@/lib/data/store";

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  role: "student" | "mentor" | "admin" | "super_admin";
  timezone: string;
}

// Default demo session fallback if none selected: Anant Kumar (Student)
export const DEFAULT_DEMO_STUDENT = "user-student-1";
export const DEFAULT_DEMO_MENTOR = "user-mentor-priya";
export const DEFAULT_DEMO_ADMIN = "user-admin-1";

export function getSessionUser(userId?: string): SessionUser | null {
  const targetId = userId || DEFAULT_DEMO_STUDENT;
  const user = store.getUser(targetId);
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    timezone: user.timezone,
  };
}

export function checkRole(user: SessionUser | null, allowedRoles: ("student" | "mentor" | "admin" | "super_admin")[]): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

