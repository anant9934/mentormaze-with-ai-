"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  IndianRupee,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

export default function AdminPaymentsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundPercent, setRefundPercent] = useState(100);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, [statusFilter]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const url = statusFilter === "all" ? "/api/admin/payments" : `/api/admin/payments?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions || []);
        setTotals(data.totals || {});
      }
    } catch (e) {
      console.error("Error loading transactions:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/payments/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedTx.booking_id,
          reason: refundReason,
          refundPercent: Number(refundPercent),
          actorRole: "admin",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage(`Refund of ₹${data.refundInr} issued successfully (Ref: ${data.refundId}).`);
        setSelectedTx(null);
        setRefundReason("");
        await loadTransactions();
      } else {
        setMessage("Error issuing refund: " + (data.error || "Unknown"));
      }
    } catch (err: any) {
      setMessage("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.student_name?.toLowerCase().includes(q) ||
      t.mentor_name?.toLowerCase().includes(q) ||
      t.provider_order_id?.toLowerCase().includes(q) ||
      t.booking_id.toLowerCase().includes(q)
    );
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
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
            <span className="font-semibold text-sm text-[#123B2E]">Financial Ledger & Payments</span>
          </div>
          <button
            onClick={loadTransactions}
            className="p-2 text-[#46514B] hover:text-[#123B2E] rounded-lg border border-[#DED2BF]/50 bg-white hover:bg-[#F4EFE4] transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#123B2E]">Financial Ledger & Payment Gateway</h1>
            <p className="text-[#46514B] text-sm mt-1">
              Double-entry accounting, Cashfree gateway reconciliation, platform take-rate (15%), and dispute refunds.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {["all", "settled", "pending", "refunded"].map((st) => (
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

        {/* Aggregate KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#DED2BF]/60 shadow-sm">
            <span className="text-[11px] uppercase font-bold text-[#46514B]">Settled GMV</span>
            <div className="text-2xl font-bold text-[#123B2E] mt-1">{formatCurrency(totals.totalGrossInr)}</div>
            <span className="text-[10px] text-[#46514B]">Total booking volume</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#DED2BF]/60 shadow-sm">
            <span className="text-[11px] uppercase font-bold text-[#46514B]">Platform Revenue (15%)</span>
            <div className="text-2xl font-bold text-[#21634A] mt-1">{formatCurrency(totals.totalPlatformFeeInr)}</div>
            <span className="text-[10px] text-[#21634A]">Marketplace commission earned</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#DED2BF]/60 shadow-sm">
            <span className="text-[11px] uppercase font-bold text-[#46514B]">Mentor Payable</span>
            <div className="text-2xl font-bold text-[#17211E] mt-1">{formatCurrency(totals.totalMentorPayableInr)}</div>
            <span className="text-[10px] text-[#46514B]">Net owed to mentors</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#DED2BF]/60 shadow-sm">
            <span className="text-[11px] uppercase font-bold text-[#46514B]">Disbursed Refunds</span>
            <div className="text-2xl font-bold text-red-700 mt-1">{formatCurrency(totals.totalRefundsInr)}</div>
            <span className="text-[10px] text-[#46514B]">Total cancelled / refunded</span>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#46514B] absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions by student, mentor, order ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DED2BF] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#123B2E]"
          />
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl border border-[#DED2BF]/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F4EFE4]/60 text-xs uppercase font-semibold text-[#46514B] border-b border-[#DED2BF]/40">
                <tr>
                  <th className="py-3 px-6">Gateway Order</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Mentor</th>
                  <th className="py-3 px-4 text-right">Gross</th>
                  <th className="py-3 px-4 text-right">Fee (15%)</th>
                  <th className="py-3 px-4 text-right">Mentor Net</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DED2BF]/30">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#46514B]">
                      Loading ledger transactions...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#46514B]">
                      No transactions recorded.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#FBF8F1]/50 transition">
                      <td className="py-4 px-6">
                        <div className="font-mono text-xs font-semibold text-[#123B2E]">
                          {tx.provider_order_id || `order_${tx.booking_id.slice(0, 8)}`}
                        </div>
                        <div className="text-[11px] text-[#46514B]">
                          {new Date(tx.created_at).toLocaleDateString("en-IN")}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-[#17211E]">{tx.student_name}</div>
                        <div className="text-[11px] text-[#46514B]">{tx.student_email}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-[#17211E]">{tx.mentor_name}</div>
                        <div className="text-[11px] text-[#46514B]">{tx.mentor_email}</div>
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-[#17211E]">
                        {formatCurrency(tx.gross_amount_inr)}
                      </td>
                      <td className="py-4 px-4 text-right text-xs text-[#21634A]">
                        {formatCurrency(tx.platform_fee_inr)}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-[#123B2E]">
                        {formatCurrency(tx.mentor_payable_inr)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            tx.status === "settled"
                              ? "bg-[#EDF1E8] text-[#123B2E] border border-[#DDE6D7]"
                              : tx.status === "refunded"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {tx.status === "settled" && (
                          <button
                            onClick={() => {
                              setSelectedTx(tx);
                              setRefundReason("Admin resolution refund");
                            }}
                            className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition"
                          >
                            Refund
                          </button>
                        )}
                        {tx.status === "refunded" && (
                          <span className="text-xs text-[#46514B] italic">
                            Refunded ₹{tx.refund_amount_inr}
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

        {/* Modal: Process Refund */}
        {selectedTx && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#DED2BF] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-red-700">Issue Payment Refund</h3>
                <button onClick={() => setSelectedTx(null)} className="text-gray-400 hover:text-gray-600 text-lg">
                  ×
                </button>
              </div>

              <div className="text-xs text-[#46514B] space-y-1">
                <div>Booking: <span className="font-mono text-[#123B2E]">{selectedTx.booking_id}</span></div>
                <div>Student: <strong className="text-[#123B2E]">{selectedTx.student_name}</strong></div>
                <div>Gross Amount: <strong>₹{selectedTx.gross_amount_inr}</strong></div>
              </div>

              <form onSubmit={handleIssueRefund} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-[#46514B] uppercase mb-1">
                    Refund Percentage
                  </label>
                  <select
                    value={refundPercent}
                    onChange={(e) => setRefundPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#DED2BF] rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#123B2E]"
                  >
                    <option value={100}>100% Full Refund (₹{selectedTx.gross_amount_inr})</option>
                    <option value={50}>50% Partial Refund (₹{Math.round(selectedTx.gross_amount_inr * 0.5)})</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#46514B] uppercase mb-1">
                    Refund Reason
                  </label>
                  <input
                    type="text"
                    required
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="e.g. Mentor did not attend / technical outage"
                    className="w-full px-3 py-2 border border-[#DED2BF] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#123B2E]"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTx(null)}
                    className="px-4 py-2 border border-[#DED2BF] rounded-xl text-xs font-medium text-[#46514B] hover:bg-[#F4EFE4]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition disabled:opacity-50"
                  >
                    Confirm Refund
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
