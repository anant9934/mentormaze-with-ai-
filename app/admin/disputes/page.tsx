"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Scale,
  ShieldAlert,
  ArrowRight,
  MessageSquare,
} from "lucide-react";

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [resolutionType, setResolutionType] = useState<"refund" | "rejected">("refund");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadDisputes();
  }, [statusFilter]);

  const loadDisputes = async () => {
    setLoading(true);
    try {
      const url = statusFilter === "all" ? "/api/admin/disputes" : `/api/admin/disputes?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setDisputes(data.disputes || []);
      }
    } catch (e) {
      console.error("Error loading disputes:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resolve",
          disputeId: selectedDispute.id,
          resolutionType,
          resolutionNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage(`Dispute successfully resolved with action: ${resolutionType}.`);
        setSelectedDispute(null);
        setResolutionNotes("");
        await loadDisputes();
      } else {
        setMessage("Error: " + (data.error || "Resolution failed."));
      }
    } catch (err: any) {
      setMessage("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF8F1] text-[#17211E]">
      <header className="border-b border-[#DED2BF]/50 bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/admin" className="text-xs font-semibold text-[#46514B] hover:text-[#123B2E]">
              ← Admin Center
            </Link>
            <span className="text-[#DED2BF]">/</span>
            <span className="font-semibold text-sm text-[#123B2E]">Dispute Resolution Center</span>
          </div>
          <button
            onClick={loadDisputes}
            className="p-2 text-[#46514B] hover:text-[#123B2E] rounded-lg border border-[#DED2BF]/50 bg-white hover:bg-[#F4EFE4] transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#123B2E]">Dispute Resolution Center</h1>
            <p className="text-[#46514B] text-sm mt-1">
              Arbitrate session disputes, audit mentor & student claims, and authorize refunds or dismissals.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {["all", "opened", "resolved_refund", "resolved_rejected"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                  statusFilter === st
                    ? "bg-[#123B2E] text-white"
                    : "bg-white text-[#46514B] border border-[#DED2BF] hover:bg-[#F4EFE4]"
                }`}
              >
                {st.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-[#EDF1E8] border border-[#DDE6D7] text-sm text-[#123B2E] flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-[#21634A]" />
            {message}
          </div>
        )}

        {/* Disputes Table */}
        <div className="bg-white rounded-2xl border border-[#DED2BF]/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F4EFE4]/60 text-xs uppercase font-semibold text-[#46514B] border-b border-[#DED2BF]/40">
                <tr>
                  <th className="py-3 px-6">Dispute Reason</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Mentor</th>
                  <th className="py-3 px-4">Session Date</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DED2BF]/30">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#46514B]">
                      Loading disputes...
                    </td>
                  </tr>
                ) : disputes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#46514B]">
                      No disputes found matching filter.
                    </td>
                  </tr>
                ) : (
                  disputes.map((d) => (
                    <tr key={d.id} className="hover:bg-[#FBF8F1]/50 transition">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-xs text-[#123B2E] capitalize">{d.reason?.replace(/_/g, " ")}</div>
                        <div className="text-xs text-[#46514B] line-clamp-1">{d.student_explanation}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-[#17211E]">{d.student_name}</div>
                        <div className="text-[11px] text-[#46514B]">{d.student_email}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-[#17211E]">{d.mentor_name}</div>
                        <div className="text-[11px] text-[#46514B]">{d.mentor_email}</div>
                      </td>
                      <td className="py-4 px-4 text-xs text-[#46514B]">
                        {new Date(d.start_time_utc).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-[#17211E]">
                        ₹{d.price_inr}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            d.status === "opened"
                              ? "bg-amber-50 text-amber-800 border border-amber-300 animate-pulse"
                              : d.status === "resolved_refund"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                              : "bg-gray-100 text-gray-700 border border-gray-300"
                          }`}
                        >
                          {d.status?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {d.status === "opened" ? (
                          <button
                            onClick={() => {
                              setSelectedDispute(d);
                              setResolutionNotes("");
                              setResolutionType("refund");
                            }}
                            className="px-3 py-1 bg-[#123B2E] text-white rounded-lg text-xs font-semibold hover:bg-[#174B39] transition"
                          >
                            Arbitrate
                          </button>
                        ) : (
                          <span className="text-xs text-[#46514B] italic">
                            Resolved
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Dispute Arbitration */}
        {selectedDispute && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#DED2BF] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-[#123B2E] flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[#21634A]" />
                  <span>Arbitrate Dispute</span>
                </h3>
                <button onClick={() => setSelectedDispute(null)} className="text-gray-400 hover:text-gray-600 text-lg">
                  ×
                </button>
              </div>

              <div className="p-4 bg-[#FBF8F1] rounded-xl border border-[#DED2BF] text-xs space-y-2">
                <div><strong>Reason:</strong> <span className="capitalize">{selectedDispute.reason?.replace(/_/g, " ")}</span></div>
                <div><strong>Student Claim:</strong> "{selectedDispute.student_explanation}"</div>
                {selectedDispute.mentor_response && (
                  <div><strong>Mentor Statement:</strong> "{selectedDispute.mentor_response}"</div>
                )}
                <div><strong>Session Value:</strong> ₹{selectedDispute.price_inr}</div>
              </div>

              <form onSubmit={handleResolve} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#46514B] uppercase mb-1">
                    Arbitration Decision
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setResolutionType("refund")}
                      className={`p-3 rounded-xl border text-xs font-semibold text-center transition ${
                        resolutionType === "refund"
                          ? "border-[#123B2E] bg-[#EDF1E8] text-[#123B2E]"
                          : "border-[#DED2BF] bg-white text-[#46514B]"
                      }`}
                    >
                      Uphold Claim & Refund 100%
                    </button>
                    <button
                      type="button"
                      onClick={() => setResolutionType("rejected")}
                      className={`p-3 rounded-xl border text-xs font-semibold text-center transition ${
                        resolutionType === "rejected"
                          ? "border-red-600 bg-red-50 text-red-700"
                          : "border-[#DED2BF] bg-white text-[#46514B]"
                      }`}
                    >
                      Dismiss Claim (No Refund)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#46514B] uppercase mb-1">
                    Resolution Notes & Verdict Explanation
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Document evidence and reason for verdict..."
                    className="w-full px-3 py-2 border border-[#DED2BF] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#123B2E]"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDispute(null)}
                    className="px-4 py-2 border border-[#DED2BF] rounded-xl text-xs font-medium text-[#46514B] hover:bg-[#F4EFE4]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 bg-[#123B2E] text-white rounded-xl text-xs font-semibold hover:bg-[#174B39] transition disabled:opacity-50"
                  >
                    Finalize Verdict
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
