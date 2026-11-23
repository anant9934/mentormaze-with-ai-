import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ASTRION — Adaptive AI Mentorship Intelligence | MentorMaze by AI Tathastu",
  description:
    "ASTRION: Adaptive Strategic Intelligence & Reasoning Network. Unified AI Mentorship Intelligence across computer science, distributed systems, code review, resumes, and technical interviews.",
};

export default function AIMentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
