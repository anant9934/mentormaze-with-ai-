import React from "react";
import { getServerSession } from "@/lib/auth/server-auth";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getServerSession();

  // In production, enforce strict server-side role verification
  if (process.env.NODE_ENV === "production") {
    if (!sessionUser) {
      redirect("/login?error=unauthenticated&redirect=/admin");
    }
    if (sessionUser.role !== "admin" && sessionUser.role !== "super_admin") {
      return (
        <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
          <div className="card-warm bg-white p-8 max-w-md w-full text-center space-y-4 rounded-3xl border border-red-200 shadow-elevated">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-ink-950">Access Forbidden (403)</h2>
            <p className="text-xs text-ink-700">
              Your account ({sessionUser.email}) does not hold administrative clearance. Client-side role modifications are rejected at the database level.
            </p>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-cream-50">
      {sessionUser && sessionUser.role === "admin" && (
        <div className="bg-forest-900 text-forest-100 text-[11px] px-4 py-1 text-center font-mono">
          ✓ Verified Admin Session: {sessionUser.email} (Role: {sessionUser.role})
        </div>
      )}
      {children}
    </div>
  );
}
