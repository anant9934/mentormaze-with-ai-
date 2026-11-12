"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Download,
  IndianRupee,
  TrendingUp,
  Receipt,
  Building2,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

export default function MentorEarningsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"transactions" | "settlements">("transactions");
  const [isRequestingSettlement, setIsRequestingSettlement] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mentor/earnings");
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
      }
    } catch (e) {
      console.error("Failed to load earnings:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSettlement = async () => {
    setIsRequestingSettlement(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_settlement",
          mentorProfileId: summary?.mentorProfileId || "mentor-1",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Settlement request generated successfully! Our finance team reviews on Mondays.");
        await fetchEarnings();
      } else {
        setMessage(data.error || "Failed to create settlement request.");
      }
    } catch (err: any) {
      setMessage("Error requesting payout: " + err.message);
    } finally {
      setIsRequestingSettlement(false);
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
      {/* Top Navigation Bar */}
      <header className="border-b border-[#DED2BF]/50 bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/mentor/dashboard" className="text-sm font-medium text-[#46514B] hover:text-[#123B2E] flex items-center">
              ← Mentor Dashboard
            </Link>
            <span className="text-[#DED2BF]">/</span>
            <span className="font-semibold text-[#123B2E]">Earnings & Settlements</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchEarnings}
              className="p-2 text-[#46514B] hover:text-[#123B2E] rounded-lg border border-[#DED2BF]/50 bg-white hover:bg-[#F4EFE4] transition"
              title="Refresh Balance"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="text-xs bg-[#EDF1E8] text-[#123B2E] px-3 py-1.5 rounded-full font-medium flex items-center border border-[#DDE6D7]">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#21634A]" />
              Double-Entry Ledger Verified
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Title and Payout CTA */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#123B2E]">Earnings & Financial Ledger</h1>
            <p className="text-[#46514B] text-sm mt-1">
              Authoritative revenue accounting, verified platform commission (15%), and automated settlement batches.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRequestSettlement}
              disabled={isRequestingSettlement || (summary?.pendingPayoutPaise || 0) <= 0}
              className="px-5 py-2.5 bg-[#123B2E] text-white rounded-xl font-medium text-sm hover:bg-[#174B39] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Wallet className="w-4 h-4 mr-2" />
              {isRequestingSettlement ? "Generating..." : "Request Settlement Payout"}
            </button>
          </div>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-[#EDF1E8] border border-[#DDE6D7] text-sm text-[#123B2E] flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-[#21634A] flex-shrink-0" />
            {message}
          </div>
        )}

        {/* Financial Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Net Earnings */}
          <div className="bg-white p-6 rounded-2xl border border-[#DED2BF]/60 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-semibold text-[#46514B] uppercase tracking-wider mb-2">
              <span>Total Net Earnings</span>
              <div className="p-2 rounded-lg bg-[#EDF1E8] text-[#123B2E]">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#123B2E]">
              {loading ? "..." : formatPaise(summary?.netPayablePaise)}
            </div>
            <div className="mt-2 text-xs text-[#46514B] flex items-center">
              <TrendingUp className="w-3.5 h-3.5 text-[#21634A] mr-1" />
              After 15% platform fee deduction
            </div>
          </div>

          {/* Card 2: Pending Payout */}
          <div className="bg-white p-6 rounded-2xl border border-[#DED2BF]/60 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-semibold text-[#46514B] uppercase tracking-wider mb-2">
              <span>Pending Settlement</span>
              <div className="p-2 rounded-lg bg-[#FBF8F1] text-[#21634A]">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#21634A]">
              {loading ? "..." : formatPaise(summary?.pendingPayoutPaise)}
            </div>
            <div className="mt-2 text-xs text-[#46514B]">
              Ready for weekly bank transfer
            </div>
          </div>

          {/* Card 3: Settled Payouts */}
          <div className="bg-white p-6 rounded-2xl border border-[#DED2BF]/60 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-semibold text-[#46514B] uppercase tracking-wider mb-2">
              <span>Disbursed Payouts</span>
              <div className="p-2 rounded-lg bg-[#EDF1E8] text-[#123B2E]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#123B2E]">
              {loading ? "..." : formatPaise(summary?.settledPayoutPaise)}
            </div>
            <div className="mt-2 text-xs text-[#46514B]">
              Successfully credited to bank account
            </div>
          </div>

          {/* Card 4: Gross Session Volume */}
          <div className="bg-white p-6 rounded-2xl border border-[#DED2BF]/60 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-semibold text-[#46514B] uppercase tracking-wider mb-2">
              <span>Gross Session Volume</span>
              <div className="p-2 rounded-lg bg-[#F4EFE4] text-[#46514B]">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#17211E]">
              {loading ? "..." : formatPaise(summary?.grossAmountPaise)}
            </div>
            <div className="mt-2 text-xs text-[#46514B]">
              Across {summary?.totalSessions || 0} completed session(s)
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="border-b border-[#DED2BF]">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("transactions")}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition ${
                activeTab === "transactions"
                  ? "border-[#123B2E] text-[#123B2E]"
                  : "border-transparent text-[#46514B] hover:text-[#123B2E]"
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Session Ledger Transactions ({summary?.transactions?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab("settlements")}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition ${
                activeTab === "settlements"
                  ? "border-[#123B2E] text-[#123B2E]"
                  : "border-transparent text-[#46514B] hover:text-[#123B2E]"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Disbursement Batches ({summary?.settlements?.length || 0})</span>
            </button>
          </nav>
        </div>

        {/* Tab 1: Transactions Table */}
        {activeTab === "transactions" && (
          <div className="bg-white rounded-2xl border border-[#DED2BF]/60 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#DED2BF]/40 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#123B2E]">Double-Entry Transaction History</h3>
                <p className="text-xs text-[#46514B] mt-0.5">Calculated in integer paise (1 INR = 100 paise) to ensure exact balance integrity.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F4EFE4]/60 text-xs uppercase font-semibold text-[#46514B] border-b border-[#DED2BF]/40">
                  <tr>
                    <th className="py-3 px-6">Date & Student</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4 text-right">Gross Price</th>
                    <th className="py-3 px-4 text-right">Fee (15%)</th>
                    <th className="py-3 px-4 text-right">Net Payable</th>
                    <th className="py-3 px-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DED2BF]/30">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#46514B]">
                        Loading ledger transactions...
                      </td>
                    </tr>
                  ) : (summary?.transactions?.length || 0) === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#46514B]">
                        No completed session transactions found yet.
                      </td>
                    </tr>
                  ) : (
                    summary.transactions.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-[#FBF8F1]/50 transition">
                        <td className="py-4 px-6">
                          <div className="font-medium text-[#123B2E]">{tx.studentName}</div>
                          <div className="text-xs text-[#46514B]">
                            {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-[#46514B] capitalize">
                          {tx.serviceType?.replace(/_/g, " ") || "Mentorship"}
                        </td>
                        <td className="py-4 px-4 text-right font-medium text-[#17211E]">
                          {formatPaise(tx.grossPaise)}
                        </td>
                        <td className="py-4 px-4 text-right text-xs text-[#46514B]">
                          -{formatPaise(tx.platformFeePaise)}
                        </td>
                        <td className="py-4 px-4 text-right font-semibold text-[#21634A]">
                          {formatPaise(tx.mentorPayablePaise)}
                        </td>
                        <td className="py-4 px-6 text-center">
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Settlements Table */}
        {activeTab === "settlements" && (
          <div className="bg-white rounded-2xl border border-[#DED2BF]/60 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#DED2BF]/40">
              <h3 className="font-semibold text-[#123B2E]">Settlement Payout Batches</h3>
              <p className="text-xs text-[#46514B] mt-0.5">Formal disbursement invoices processed by MentorMaze finance team.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F4EFE4]/60 text-xs uppercase font-semibold text-[#46514B] border-b border-[#DED2BF]/40">
                  <tr>
                    <th className="py-3 px-6">Period</th>
                    <th className="py-3 px-4 text-center">Sessions</th>
                    <th className="py-3 px-4 text-right">Net Payout</th>
                    <th className="py-3 px-4">Payout Method</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DED2BF]/30">
                  {(summary?.settlements?.length || 0) === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#46514B]">
                        No formal settlement batches generated yet. Request a payout above to create your first batch!
                      </td>
                    </tr>
                  ) : (
                    summary.settlements.map((s: any) => (
                      <tr key={s.id} className="hover:bg-[#FBF8F1]/50 transition">
                        <td className="py-4 px-6 text-xs text-[#123B2E]">
                          {new Date(s.period_start).toLocaleDateString("en-IN")} — {new Date(s.period_end).toLocaleDateString("en-IN")}
                        </td>
                        <td className="py-4 px-4 text-center text-[#46514B]">
                          {s.session_count}
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-[#123B2E]">
                          {formatPaise(s.net_payable_paise)}
                        </td>
                        <td className="py-4 px-4 text-xs text-[#46514B] capitalize">
                          {s.payout_method?.replace(/_/g, " ")}
                        </td>
                        <td className="py-4 px-4 text-xs font-mono text-[#46514B]">
                          {s.payout_reference || "—"}
                        </td>
                        <td className="py-4 px-6 text-center">
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

