import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Code, Server, Users2, Brain, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

export default function MockInterviewsInfoPage() {
  const tracks = [
    {
      title: "Technical SDE Coding",
      icon: Code,
      description: "Data Structures & Algorithms, recursion, dynamic programming, heaps, and graph problems evaluated in real time.",
      rubrics: ["Problem Understanding", "Algorithm Correctness", "Code Modularity", "Complexity Analysis"],
    },
    {
      title: "System Design & Architecture",
      icon: Server,
      description: "Scalability, microservices, databases, caching, load balancers, and distributed data pipelines.",
      rubrics: ["High-Level Design", "Trade-Off Analysis", "Component Deep-Dive", "Bottleneck Identification"],
    },
    {
      title: "Behavioral & Leadership",
      icon: Users2,
      description: "STAR method formulation, leadership principles, conflict resolution, and career storytelling.",
      rubrics: ["Structured Communication", "Impact Clarity", "Culture Alignment", "Executive Presence"],
    },
    {
      title: "Product Management (PM)",
      icon: Brain,
      description: "Product design case interviews, root cause analysis, North Star metrics, and prioritization trade-offs.",
      rubrics: ["Problem Framing", "User Empathy", "Metrics Definition", "Strategic Vision"],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-100 text-forest-800 text-xs font-semibold uppercase tracking-wider mb-3">
            Real Interview Simulation
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold text-ink-950">
            Practice Human Mock Interviews
          </h1>
          <p className="mt-4 text-base sm:text-lg text-ink-700">
            Simulate real hiring rounds with verified engineers and hiring managers from Microsoft, Google, Adobe, and top startups.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {tracks.map((track) => {
            const Icon = track.icon;
            return (
              <div key={track.title} className="card-warm bg-white p-8 rounded-3xl">
                <div className="w-12 h-12 rounded-2xl bg-sage-100 flex items-center justify-center text-forest-900 mb-6">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-ink-950 mb-2">{track.title}</h3>
                <p className="text-sm text-ink-700 leading-relaxed mb-6">{track.description}</p>
                <div className="border-t border-border pt-4">
                  <span className="text-xs font-bold text-ink-950 block mb-2">Evaluation Rubric:</span>
                  <div className="grid grid-cols-2 gap-2 text-xs text-ink-700">
                    {track.rubrics.map((r) => (
                      <div key={r} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Link href="/mentors" className="btn-primary text-base px-8 py-3.5 inline-flex items-center gap-2">
            <span>Find an Interviewer</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
