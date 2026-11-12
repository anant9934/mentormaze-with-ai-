"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink,
  Shield,
  Layers,
} from "lucide-react";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [overrideStatus, setOverrideStatus] = useState("confirmed");
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const url = filter === "all" ? "/api/admin/bookings" : `/api/admin/bookings?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (e) {
      console.error("Error fetching bookings:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "override_status",
          bookingId: selectedBooking.id,
          targetStatus: overrideStatus,
          reason: "Manual admin override",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage(`Booking status overridden to ${overrideStatus}.`);
        setSelectedBooking(null);
        await loadBookings();
      } else {
        setMessage("Error: " + (data.error || "Override failed."));
      }
    } catch (err: any) {
      setMessage("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.student_name?.toLowerCase().includes(q) ||
      b.mentor_name?.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      b.meeting_room_id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#FBF8F1] text-[#17211E]">
      <header className="border-b border-[#DED2BF]/50 bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/admin" className="text-xs font-semibold text-[#46514B] hover:text-[#123B2E]">
              ← Admin Center
            </Link>
            <span className="text-[#DED2BF]">/</span>
            <span className="font-semibold text-sm text-[#123B2E]">Bookings Operations</span>
          </div>
          <button
            onClick={loadBookings}
            className="p-2 text-[#46514B] hover:text-[#123B2E] rounded-lg border border-[#DED2BF]/50 bg-white hover:bg-[#F4EFE4] transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#123B2E]">Bookings Operations Center</h1>
            <p className="text-[#46514B] text-sm mt-1">
              Authoritative state monitoring across the 10-state lifecycle, meeting room inspection, and manual override.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {["all", "confirmed", "in_progress", "completed", "cancelled", "disputed"].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                  filter === st
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

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#46514B] absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, mentor name, or booking ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DED2BF] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#123B2E]"
          />
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-2xl border border-[#DED2BF]/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F4EFE4]/60 text-xs uppercase font-semibold text-[#46514B] border-b border-[#DED2BF]/40">
                <tr>
                  <th className="py-3 px-6">Booking Details</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Mentor</th>
                  <th className="py-3 px-4">Schedule (IST)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Payment</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DED2BF]/30">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#46514B]">
                      Loading bookings...
                    </td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#46514B]">
                      No bookings found.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-[#FBF8F1]/50 transition">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-xs text-[#123B2E] font-mono">{b.id.slice(0, 13)}...</div>
                        <div className="text-xs text-[#46514B] capitalize">{b.service_type?.replace(/_/g, " ")} ({b.session_duration_minutes}m)</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-[#17211E]">{b.student_name}</div>
                        <div className="text-[11px] text-[#46514B]">{b.student_email}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-[#17211E]">{b.mentor_name}</div>
                        <div className="text-[11px] text-[#46514B]">{b.mentor_email}</div>
                      </td>
                      <td className="py-4 px-4 text-xs text-[#46514B]">
                        {new Date(b.start_time_utc).toLocaleString("en-IN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            b.status === "confirmed"
                              ? "bg-[#EDF1E8] text-[#123B2E] border border-[#DDE6D7]"
                              : b.status === "in_progress"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse"
                              : b.status === "completed"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : b.status === "cancelled"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-xs font-semibold text-[#123B2E]">
                          ₹{b.price_inr}
                        </span>
                        <div className="text-[10px] text-[#46514B] uppercase font-bold">
                          {b.payment_status}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedBooking(b);
                            setOverrideStatus(b.status);
                          }}
                          className="px-3 py-1 bg-[#123B2E] text-white rounded-lg text-xs font-semibold hover:bg-[#174B39] transition"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Status Override */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#DED2BF] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-[#123B2E]">Manage Booking</h3>
                <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-gray-600 text-lg">
                  ×
                </button>
              </div>

              <div className="text-xs text-[#46514B] space-y-1">
                <div>Booking: <span className="font-mono text-[#123B2E]">{selectedBooking.id}</span></div>
                <div>Student: <strong className="text-[#123B2E]">{selectedBooking.student_name}</strong></div>
                <div>Mentor: <strong className="text-[#123B2E]">{selectedBooking.mentor_name}</strong></div>
                <div>Meeting Room: <span className="font-mono text-[#21634A]">{selectedBooking.meeting_room_id || "Unassigned"}</span></div>
              </div>

              <form onSubmit={handleStatusOverride} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-[#46514B] uppercase mb-1">
                    State Machine Transition Override
                  </label>
                  <select
                    value={overrideStatus}
                    onChange={(e) => setOverrideStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DED2BF] rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#123B2E]"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No Show</option>
                    <option value="disputed">Disputed</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBooking(null)}
                    className="px-4 py-2 border border-[#DED2BF] rounded-xl text-xs font-medium text-[#46514B] hover:bg-[#F4EFE4]"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-[#123B2E] text-white rounded-xl text-xs font-semibold hover:bg-[#174B39] transition disabled:opacity-50"
                  >
                    Apply Transition
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

