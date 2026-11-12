"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  RefreshCw,
  Search,
  Check,
  CreditCard,
  ShieldAlert,
  IndianRupee,
} from "lucide-react";

export default function AdminSettlementsPage() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<any | null>(null);
  const [payoutRefInput, setPayoutRefInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSettlements();
  }, [statusFilter]);

  const loadSettlements = async () => {
    setLoading(true);
    try {
      const url = statusFilter === "all" ? "/api/admin/settlements" : `/api/admin/settlements?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setSettlements(data.settlements || []);
      }
    } catch (e) {
      console.error("Error loading settlements:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", settlementId: id }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Settlement batch approved for disbursement.");
        await loadSettlements();
      }
    } catch (e: any) {
      setMessage("Error approving settlement: " + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSettlement || !payoutRefInput) return;

    setActionLoading(selectedSettlement.id);
    try {
      const res = await fetch("/api/admin/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark_paid",
          settlementId: selectedSettlement.id,
          payoutReference: payoutRefInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Settlement marked as paid with reference ${payoutRefInput}`);
        setSelectedSettlement(null);
        setPayoutRefInput("");
        await loadSettlements();
      }
    } catch (e: any) {
      setMessage("Error marking settlement as paid: " + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatPaise = (paise: number) => {
    const rupees = (paise || 0) / 100;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(rupees);
  };

  return (
    <div className="min-h-screen bg-[#FBF8F1] text-[#17211E]">
      <header className="border-b border-[#DED2BF]/50 bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="text-sm font-medium text-[#46514B] hover:text-[#123B2E]">
              ← Admin Center
            </Link>
            <span className="text-[#DED2BF]">/</span>
            <span className="font-semibold text-[#123B2E]">Mentor Settlements</span>
          </div>
          <button
            onClick={loadSettlements}
            className="p-2 text-[#46514B] hover:text-[#123B2E] rounded-lg border border-[#DED2BF]/50 bg-white hover:bg-[#F4EFE4] transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#123B2E]">Mentor Settlements & Payouts</h1>
            <p className="text-[#46514B] text-sm mt-1">
              Review mentor earnings, authorize batch payouts, and record bank transfer references.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {["all", "pending", "approved", "settled"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                  statusFilter === st
                    ? "bg-[#123B2E] text-white"
                    : "bg-white text-[#46514B] border border-[#DED2BF] hover:bg-[#F4EFE4]"
                }`}
              >
                {st}
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

        {/* Settlements Table */}
        <div className="bg-white rounded-2xl border border-[#DED2BF]/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F4EFE4]/60 text-xs uppercase font-semibold text-[#46514B] border-b border-[#DED2BF]/40">
                <tr>
                  <th className="py-3 px-6">Mentor</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4 text-center">Sessions</th>
                  <th className="py-3 px-4 text-right">Gross</th>
                  <th className="py-3 px-4 text-right">Fee (15%)</th>
                  <th className="py-3 px-4 text-right">Net Payable</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DED2BF]/30">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#46514B]">
                      Loading settlements...
                    </td>
                  </tr>
                ) : settlements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#46514B]">
                      No settlements found matching the filter.
                    </td>
                  </tr>
                ) : (
                  settlements.map((s) => (
                    <tr key={s.id} className="hover:bg-[#FBF8F1]/50 transition">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-[#123B2E]">{s.mentor_name}</div>
                        <div className="text-xs text-[#46514B]">{s.mentor_email}</div>
                      </td>
                      <td className="py-4 px-4 text-xs text-[#46514B]">
                        {new Date(s.period_start).toLocaleDateString("en-IN")} — {new Date(s.period_end).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-4 px-4 text-center text-[#46514B]">
                        {s.session_count}
                      </td>
                      <td className="py-4 px-4 text-right text-xs text-[#46514B]">
                        {formatPaise(s.gross_amount_paise)}
                      </td>
                      <td className="py-4 px-4 text-right text-xs text-[#46514B]">
                        {formatPaise(s.platform_fee_paise)}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-[#123B2E]">
                        {formatPaise(s.net_payable_paise)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            s.status === "settled" || s.status === "manually_recorded"
                              ? "bg-[#EDF1E8] text-[#123B2E] border border-[#DDE6D7]"
                              : s.status === "approved"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {s.status === "manually_recorded" ? "Recorded (UTR)" : s.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {s.status === "pending" && (
                          <button
                            onClick={() => handleApprove(s.id)}
                            disabled={actionLoading === s.id}
                            className="px-3 py-1 bg-[#123B2E] text-white rounded-lg text-xs font-medium hover:bg-[#174B39] transition disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}
                        {(s.status === "approved" || s.status === "pending") && (
                          <button
                            onClick={() => {
                              setSelectedSettlement(s);
                              setPayoutRefInput(`UTR-${Date.now().toString().slice(-8)}`);
                            }}
                            className="px-3 py-1 bg-[#21634A] text-white rounded-lg text-xs font-medium hover:bg-[#174B39] transition"
                          >
                            Record Payout
                          </button>
                        )}
                        {(s.status === "settled" || s.status === "manually_recorded") && (
                          <span className="text-xs font-mono text-[#46514B]">
                            Ref: {s.payout_reference}
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

        {/* Modal: Record Payout Reference */}
        {selectedSettlement && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#DED2BF] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-[#123B2E]">Record Bank Disbursement</h3>
                <button
                  onClick={() => setSelectedSettlement(null)}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  ×
                </button>
              </div>

              <div className="text-sm text-[#46514B]">
                Mentor: <strong className="text-[#123B2E]">{selectedSettlement.mentor_name}</strong>
                <br />
                Net Amount: <strong className="text-[#21634A]">{formatPaise(selectedSettlement.net_payable_paise)}</strong>
              </div>

              <form onSubmit={handleMarkPaid} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#46514B] uppercase mb-1">
                    Bank UTR / Transaction Reference
                  </label>
                  <input
                    type="text"
                    required
                    value={payoutRefInput}
                    onChange={(e) => setPayoutRefInput(e.target.value)}
                    placeholder="e.g. UTR-98234821"
                    className="w-full px-3 py-2 border border-[#DED2BF] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#123B2E]"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSettlement(null)}
                    className="px-4 py-2 border border-[#DED2BF] rounded-xl text-xs font-medium text-[#46514B] hover:bg-[#F4EFE4]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === selectedSettlement.id}
                    className="px-4 py-2 bg-[#123B2E] text-white rounded-xl text-xs font-medium hover:bg-[#174B39] transition disabled:opacity-50"
                  >
                    Confirm Disbursement
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

