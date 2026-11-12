import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/context";
import { RoleSwitcher } from "@/components/shared/role-switcher";

export const metadata: Metadata = {
  title: "MentorMaze — Real People. Real Guidance. Grow Faster.",
  description: "Human mentorship, mock interview practice & intelligence-led matching platform under AI Tathastu.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-cream-50 text-ink-950 font-sans selection:bg-sage-200 selection:text-forest-900">
        <AuthProvider>
          <RoleSwitcher />
          <div className="flex-1 flex flex-col">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
