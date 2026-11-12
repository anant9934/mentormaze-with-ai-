"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/lib/auth/context";
import { store } from "@/lib/data/store";
import {
  Briefcase,
  ShieldCheck,
  FileCheck2,
  Upload,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Users,
  Award,
} from "lucide-react";

export default function MentorApplicationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);

  // Form Fields
  const [fullName, setFullName] = useState("Rahul Mehta");
  const [currentRole, setCurrentRole] = useState("Data Scientist");
  const [organization, setOrganization] = useState("Google");
  const [domain, setDomain] = useState("Data Science");
  const [yearsExperience, setYearsExperience] = useState(5);
  const [skills, setSkills] = useState(["Python", "Machine Learning", "System Design"]);
  const [linkedinUrl, setLinkedinUrl] = useState("https://linkedin.com/in/rahul-mehta-mock");
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    store.submitMentorApplication({
      mentorProfileId: "mentor-rahul",
      mentorName: fullName,
      currentRole,
      organization,
      identityProofType: "Aadhaar / Passport",
      identityProofVerified: true,
      professionalProofType: "Google Corporate Email / LinkedIn",
      professionalProofVerified: true,
      resumeUrl: "/documents/Rahul_Mehta_Resume.pdf",
      linkedinUrl,
    });
    setSubmittedSuccess(true);
  };

  if (submittedSuccess) {
    return (
      <div className="min-h-screen flex flex-col bg-cream-50">
        <Navbar />
        <main className="flex-1 max-w-xl mx-auto px-4 py-20 text-center">
          <div className="card-warm bg-white p-10 rounded-3xl shadow-card">
            <div className="w-16 h-16 rounded-full bg-sage-100 text-forest-900 mx-auto flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-ink-950 mb-2">
              Application Submitted!
            </h1>
            <p className="text-sm text-ink-700 leading-relaxed mb-6">
              Thank you, <strong>{fullName}</strong>. Your mentor application has entered the administrator verification queue. Our team reviews credentials within 24-48 hours.
            </p>
            <div className="p-4 rounded-2xl bg-cream-50 border border-border text-xs text-ink-700 mb-8 text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-ink-500">Status:</span>
                <span className="badge-sage font-bold">Submitted / Under Review</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Role & Org:</span>
                <span className="font-semibold text-ink-950">{currentRole} @ {organization}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Target Domain:</span>
                <span className="font-semibold text-ink-950">{domain}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/admin/verification" className="btn-secondary text-xs">
                Inspect in Admin Queue
              </Link>
              <Link href="/" className="btn-primary text-xs">
                Return to Home
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-12 w-full">
        {/* Step Indicator */}
        <div className="flex items-center justify-between text-xs font-semibold text-ink-500 mb-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-forest-800" />
            <span>Mentor Application</span>
          </div>
          <span>Step {step} of 3</span>
        </div>

        <div className="card-warm bg-white p-8 rounded-3xl shadow-card">
          {/* STEP 1: VALUE PROPOSITION */}
          {step === 1 && (
            <div>
              <div className="text-center mb-8">
                <span className="badge-sage text-xs uppercase font-bold tracking-wider mb-2">
                  Join the Community
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink-950">
                  Become a Mentor on MentorMaze
                </h1>
                <p className="text-xs text-ink-700 mt-2 max-w-md mx-auto">
                  Guide talented students, conduct rigorous mock interviews, share your industry experience, and earn predictable hourly payouts.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="p-4 rounded-2xl bg-cream-50 border border-border flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center text-forest-900 flex-shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink-950">Mentor Motivated Students</h4>
                    <p className="text-xs text-ink-500">
                      Connect with students who have clear goals and genuine curiosity to learn.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-cream-50 border border-border flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center text-forest-900 flex-shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink-950">Share Real-World Experience</h4>
                    <p className="text-xs text-ink-500">
                      Help freshers navigate production architecture, company culture, and hiring bars.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-cream-50 border border-border flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center text-forest-900 flex-shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink-950">Build Your Brand & Earn</h4>
                    <p className="text-xs text-ink-500">
                      Receive verified mentor status and direct marketplace payouts via Cashfree.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-primary w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2"
              >
                <span>Apply as a Mentor</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: PROFILE SETUP */}
          {step === 2 && (
            <div>
              <div className="mb-6">
                <h2 className="font-serif text-2xl font-bold text-ink-950">
                  Set Up Your Mentor Profile
                </h2>
                <p className="text-xs text-ink-700 mt-1">
                  Help students understand your background, seniority, and technical expertise.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-3 rounded-xl border border-border text-sm text-ink-950 focus:outline-none focus:ring-2 focus:ring-forest-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1">
                      Current Role / Title
                    </label>
                    <input
                      type="text"
                      value={currentRole}
                      onChange={(e) => setCurrentRole(e.target.value)}
                      placeholder="e.g. Software Engineer"
                      className="w-full p-3 rounded-xl border border-border text-sm text-ink-950 focus:outline-none focus:ring-2 focus:ring-forest-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1">
                      Company / Organization
                    </label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. Google, Microsoft"
                      className="w-full p-3 rounded-xl border border-border text-sm text-ink-950 focus:outline-none focus:ring-2 focus:ring-forest-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1">
                      Primary Domain
                    </label>
                    <select
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="w-full p-3 rounded-xl border border-border text-sm text-ink-950 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
                    >
                      <option value="Software Engineering">Software Engineering</option>
                      <option value="Data Science">Data Science</option>
                      <option value="Product Management">Product Management</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(parseInt(e.target.value))}
                      className="w-full p-3 rounded-xl border border-border text-sm text-ink-950 focus:outline-none focus:ring-2 focus:ring-forest-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full p-3 rounded-xl border border-border text-sm text-ink-950 focus:outline-none focus:ring-2 focus:ring-forest-700"
                  />
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary text-xs px-4 py-2 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn-primary text-xs px-6 py-2.5 flex items-center gap-2"
                >
                  <span>Next: Verification Evidence</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: EVIDENCE VERIFICATION */}
          {step === 3 && (
            <div>
              <div className="mb-6">
                <h2 className="font-serif text-2xl font-bold text-ink-950">
                  Evidence & Verification
                </h2>
                <p className="text-xs text-ink-700 mt-1">
                  Build trust with students through a verified mentor badge.
                </p>
              </div>

              <div className="space-y-4 mb-6">
                {/* Proof 1: Identity */}
                <div className="p-4 rounded-2xl bg-cream-50 border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-forest-800" />
                    <div>
                      <h4 className="text-xs font-bold text-ink-950">Identity Proof</h4>
                      <p className="text-[10px] text-ink-500">Government ID (Aadhaar / PAN / Passport)</p>
                    </div>
                  </div>
                  <span className="badge-match text-[10px]">Verified ✓</span>
                </div>

                {/* Proof 2: Professional Proof */}
                <div className="p-4 rounded-2xl bg-cream-50 border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-forest-800" />
                    <div>
                      <h4 className="text-xs font-bold text-ink-950">Professional Proof</h4>
                      <p className="text-[10px] text-ink-500">Work email (@google.com) + Employee ID</p>
                    </div>
                  </div>
                  <span className="badge-match text-[10px]">Verified ✓</span>
                </div>

                {/* Proof 3: Resume Upload */}
                <div className="p-4 rounded-2xl bg-cream-50 border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileCheck2 className="w-5 h-5 text-forest-800" />
                    <div>
                      <h4 className="text-xs font-bold text-ink-950">Resume / CV (PDF)</h4>
                      <p className="text-[10px] text-ink-500">Rahul_Mehta_Resume.pdf (1.4 MB)</p>
                    </div>
                  </div>
                  <span className="badge-sage text-[10px]">Attached</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-sage-50 border border-sage-200 text-xs text-forest-900 mb-8 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>Your profile will be reviewed by our compliance team within 24–48 hours.</span>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-secondary text-xs px-4 py-2 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="btn-primary text-xs px-6 py-2.5 flex items-center gap-2"
                >
                  <span>Submit for Review</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
