"use client";

import React from "react";
import { useAuth } from "@/lib/auth/context";
import { AIMentorShell } from "@/components/ai-mentor/ai-mentor-shell";

/**
 * MentorMaze AI Mentor — Standalone AI Workspace
 * Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 * Unified Mentor: ASTRION (Adaptive Strategic Intelligence & Reasoning Network)
 * Core Engine: ASTRION CORE (`astrion-core`)
 *
 * Dedicated full-viewport AI desktop workspace inspired by modern AI studio interfaces.
 * Strictly no public header (<Navbar />) or footer (<Footer />) rendered on this route.
 */
export default function AIMentorPage() {
  const { user } = useAuth();
  const studentUserId = user?.id || "usr-student-1";
  const studentName = user?.displayName || "Student";

  return <AIMentorShell initialUserId={studentUserId} studentName={studentName} />;
}
