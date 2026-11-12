"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { store } from "@/lib/data/store";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  Briefcase,
  Users,
} from "lucide-react";

export default function AdminVerificationQueuePage() {
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [selectedAppId, setSelectedAppId] = useState<string | null>("app-rahul");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const applications = store.getApplications();
  const pendingApps = applications.filter((a) => a.status === "submitted" || a.status === "under_review");
  const approvedApps = applications.filter((a) => a.status === "approved");
  const rejectedApps = applications.filter((a) => a.status === "rejected");

  const currentList =
    activeTab === "pending" ? pendingApps : activeTab === "approved" ? approvedApps : rejectedApps;

  const selectedApp = applications.find((a) => a.id === selectedAppId) || currentList[0];

  const handleApprove = (appId: string) => {
    store.verifyMentorApplication(appId, "approve", "Approved by Administrator after manual credential review.");
    setActionMessage("Mentor approved successfully! Profile is now active and discoverable.");
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleReject = (appId: string) => {
    store.verifyMentorApplication(appId, "reject", "Rejected due to insufficient employment verification proof.", "Documentation incomplete");
    setActionMessage("Mentor application rejected.");
    setTimeout(() => setActionMessage(null), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Breadcrumb / Back Link */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold text-ink-700 hover:text-forest-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Admin Portal</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="badge-match text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Compliance & Verification</span>
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold text-ink-950">Mentor Verification</h1>
          <p className="text-xs text-ink-700 mt-1">
            Review and audit submitted identity documents, corporate email proofs, and professional resumes before public activation.
          </p>
        </div>

        {/* Action Toast */}
        {actionMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-sage-100 border border-sage-200 text-forest-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Status Tabs */}
        <div className="flex border-b border-border mb-6 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab("pending");
              setSelectedAppId(pendingApps[0]?.id || null);
            }}
            className={`py-3 px-5 transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === "pending"
                ? "border-forest-900 text-forest-900"
                : "border-transparent text-ink-500 hover:text-ink-950"
            }`}
          >
            <span>Pending</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">
              {pendingApps.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("approved");
              setSelectedAppId(approvedApps[0]?.id || null);
            }}
            className={`py-3 px-5 transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === "approved"
                ? "border-forest-900 text-forest-900"
                : "border-transparent text-ink-500 hover:text-ink-950"
            }`}
          >
            <span>Approved</span>
            <span className="px-1.5 py-0.5 rounded-full bg-sage-200 text-forest-900 text-[10px]">
              {approvedApps.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("rejected");
              setSelectedAppId(rejectedApps[0]?.id || null);
            }}
            className={`py-3 px-5 transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === "rejected"
                ? "border-forest-900 text-forest-900"
                : "border-transparent text-ink-500 hover:text-ink-950"
            }`}
          >
            <span>Rejected</span>
            <span className="px-1.5 py-0.5 rounded-full bg-sand-200 text-ink-700 text-[10px]">
              {rejectedApps.length}
            </span>
          </button>
        </div>

        {/* Split Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Master List Column */}
          <div className="lg:col-span-5 space-y-3">
            {currentList.length > 0 ? (
              currentList.map((app) => {
                const isSelected = selectedApp?.id === app.id;
                return (
                  <button
                    key={app.id}
                    onClick={() => setSelectedAppId(app.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-white border-forest-900 ring-2 ring-forest-900/10 shadow-sm"
                        : "bg-white border-border hover:bg-cream-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-forest-900 text-white flex items-center justify-center font-bold text-xs">
                        {app.mentorName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-ink-950">{app.mentorName}</h4>
                        <p className="text-[11px] text-ink-500">
                          {app.currentRole} @ {app.organization}
                        </p>
                        <span className="text-[10px] text-ink-400 block mt-0.5">
                          Applied: {app.appliedDate}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-ink-400" />
                  </button>
                );
              })
            ) : (
              <div className="p-8 rounded-2xl bg-white border border-border text-center text-xs text-ink-500">
                No applications in this category.
              </div>
            )}
          </div>

          {/* Detail View Column */}
          <div className="lg:col-span-7">
            {selectedApp ? (
              <div className="card-warm bg-white p-8 rounded-3xl shadow-card">
                {/* Header */}
                <div className="flex items-center justify-between pb-6 border-b border-border">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-forest-900 text-white flex items-center justify-center font-serif text-xl font-bold">
                      {selectedApp.mentorName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-serif text-xl font-bold text-ink-950">
                        <span>{selectedApp.mentorName}</span>
                        {selectedApp.status === "approved" && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                      <p className="text-xs text-ink-700 font-medium">
                        {selectedApp.currentRole} @ {selectedApp.organization}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      selectedApp.status === "approved"
                        ? "bg-sage-100 text-forest-800"
                        : selectedApp.status === "submitted"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-red-100 text-red-900"
                    }`}
                  >
                    {selectedApp.status.toUpperCase()}
                  </span>
                </div>

                {/* Evidence Checklist */}
                <div className="my-6 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-700">
                    Submitted Evidence & Verification
                  </h4>

                  <div className="p-4 rounded-2xl bg-cream-50 border border-border space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-ink-500">Identity Proof:</span>
                      <span className="font-semibold text-ink-950 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {selectedApp.identityProofType} (Validated)
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-ink-500">Professional Proof:</span>
                      <span className="font-semibold text-ink-950 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {selectedApp.professionalProofType}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-ink-500">Resume / CV:</span>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          alert("Opening resume preview: " + selectedApp.resumeUrl);
                        }}
                        className="text-forest-800 font-semibold flex items-center gap-1 hover:underline"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Document</span>
                      </a>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-ink-500">LinkedIn Profile:</span>
                      <a
                        href={selectedApp.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-forest-800 font-semibold flex items-center gap-1 hover:underline"
                      >
                        <span>Profile Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {selectedApp.adminNotes && (
                    <div className="p-4 rounded-2xl bg-sage-50 border border-sage-200 text-xs">
                      <span className="font-bold text-forest-900 block mb-1">Admin Audit Notes:</span>
                      <p className="text-ink-700">{selectedApp.adminNotes}</p>
                    </div>
                  )}
                </div>

                {/* Approve / Reject Controls */}
                {selectedApp.status === "submitted" && (
                  <div className="pt-6 border-t border-border flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => handleReject(selectedApp.id)}
                      className="px-4 py-2.5 rounded-full border border-red-300 text-red-700 text-xs font-bold hover:bg-red-50 flex items-center gap-1.5 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Application</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedApp.id)}
                      className="btn-primary text-xs py-2.5 px-6 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Activate Mentor</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-ink-500 bg-white rounded-3xl border border-border">
                Select an applicant from the list to inspect credentials.
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

