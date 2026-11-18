import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Mentor Workspace — Dr. Aarav Mehta",
  description:
    "Personalized, adaptive, evidence-driven AI mentoring workspace inside MentorMaze by AI Tathastu. Dedicated AI studio shell for engineering students.",
};

export default function AIMentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
