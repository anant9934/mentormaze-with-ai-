"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  LifeBuoy,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Send,
  User,
  Clock,
  ChevronRight,
  ShieldAlert,
  Search,
  Filter,
} from "lucide-react";

export default function AdminSupportCenterPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/support/tickets").then((r) => r.json());
      if (res.success) {
        setTickets(res.tickets);
        if (res.tickets.length > 0 && !selectedTicket) {
          handleSelectTicket(res.tickets[0]);
        }
      }
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSelectTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    try {
      const res = await fetch(`/api/support/tickets/${ticket.id}`).then((r) => r.json());
      if (res.success) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: replyText,
          isInternalNote,
        }),
      }).then((r) => r.json());

      if (res.success) {
        setReplyText("");
        setIsInternalNote(false);
        showToast(
          "success",
          isInternalNote ? "Internal staff note recorded." : "Customer reply dispatched and emailed."
        );
        handleSelectTicket(selectedTicket);
        loadTickets();
      } else {
        showToast("error", res.error);
      }
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedTicket) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      }).then((r) => r.json());

      if (res.success) {
        showToast("success", `Ticket status changed to ${newStatus}.`);
        setSelectedTicket(res.ticket);
        loadTickets();
      }
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === "all") return true;
    return t.status === filterStatus;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF8F1]">
      <Navbar />

      {/* Toast Alert */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-3 transition-all ${
            notification.type === "success"
              ? "bg-[#EDF1E8] text-[#123B2E] border-[#DDE6D7]"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#46514B]">
          <Link href="/admin" className="hover:underline">
            Admin Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>Communications</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-[#17211E]">Support Ticket Center</span>
        </div>

        {/* Top Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#DED2BF]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDF1E8] text-[#123B2E] text-xs font-bold uppercase tracking-wider mb-2">
              <LifeBuoy className="w-3.5 h-3.5 text-[#21634A]" />
              <span>Customer Care Operations</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#17211E]">
              Support Tickets &amp; Customer Care
            </h1>
            <p className="text-xs text-[#46514B] mt-1">
              Manage incoming support inquiries, post internal staff notes, and trigger automated customer emails.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/communications/email"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-[#DED2BF] text-[#17211E] hover:bg-[#F4EFE4]"
            >
              Email Management
            </Link>
          </div>
        </div>

        {/* Main Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ticket Queue Column */}
          <div className="bg-white rounded-2xl border border-[#DED2BF] shadow-sm overflow-hidden flex flex-col h-[650px]">
            <div className="p-4 border-b border-[#DED2BF] bg-[#FBF8F1] space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-bold text-[#17211E]">Ticket Queue</h3>
                <span className="text-xs font-mono font-bold text-[#21634A]">{tickets.length} total</span>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto text-xs">
                {["all", "open", "in_progress", "waiting_on_user", "resolved"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-2.5 py-1 rounded-lg capitalize whitespace-nowrap ${
                      filterStatus === st
                        ? "bg-[#123B2E] text-white font-bold"
                        : "bg-[#F4EFE4] text-[#46514B] hover:bg-[#DDE6D7]"
                    }`}
                  >
                    {st.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#DED2BF]">
              {filteredTickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTicket(t)}
                  className={`w-full text-left p-4 hover:bg-[#FBF8F1] transition-all flex flex-col justify-between ${
                    selectedTicket?.id === t.id ? "bg-[#EDF1E8] border-l-4 border-[#123B2E]" : ""
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold text-[#21634A]">{t.ticketNumber}</span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          t.status === "resolved"
                            ? "bg-emerald-100 text-emerald-800"
                            : t.priority === "urgent" || t.priority === "high"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {t.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-[#17211E] line-clamp-1">{t.subject}</h4>
                    <p className="text-[11px] text-[#46514B] line-clamp-1 mt-0.5">
                      {t.userName} &bull; {t.userEmail}
                    </p>
                  </div>
                  <span className="text-[10px] text-[#46514B] mt-2 block">
                    Updated {new Date(t.updatedAt).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Ticket Detail & Thread Column */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#DED2BF] shadow-sm overflow-hidden flex flex-col h-[650px]">
            {selectedTicket ? (
              <>
                {/* Header */}
                <div className="p-5 border-b border-[#DED2BF] bg-[#FBF8F1] flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-[#21634A]">{selectedTicket.ticketNumber}</span>
                      <span className="text-[#46514B] capitalize">
                        &bull; {selectedTicket.category.replace(/_/g, " ")}
                      </span>
                      <span className="text-[#46514B]">&bull; Priority: <strong>{selectedTicket.priority}</strong></span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-[#17211E] mt-0.5">
                      {selectedTicket.subject}
                    </h3>
                    <p className="text-xs text-[#46514B]">
                      User: <strong>{selectedTicket.userName}</strong> ({selectedTicket.userEmail})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#DED2BF] bg-white focus:outline-none"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="waiting_on_user">Waiting on User</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                {/* Message Stream */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#FBF8F1]/40">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                        m.isInternalNote
                          ? "bg-amber-50 border-amber-300 text-amber-950 ml-6"
                          : m.senderRole === "user"
                          ? "bg-white border-[#DED2BF] mr-6"
                          : "bg-[#EDF1E8] border-[#DDE6D7] ml-6"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-2">
                          {m.isInternalNote && <Lock className="w-3.5 h-3.5 text-amber-700" />}
                          <span>{m.senderName}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                              m.isInternalNote
                                ? "bg-amber-200 text-amber-900"
                                : m.senderRole === "user"
                                ? "bg-[#F4EFE4] text-[#46514B]"
                                : "bg-[#123B2E] text-white"
                            }`}
                          >
                            {m.isInternalNote ? "Staff Note Only" : m.senderRole}
                          </span>
                        </span>
                        <span className="text-[10px] text-[#46514B]">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
                    </div>
                  ))}
                </div>

                {/* Staff Reply Bar */}
                <div className="p-4 border-t border-[#DED2BF] bg-white space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="noteType"
                          checked={!isInternalNote}
                          onChange={() => setIsInternalNote(false)}
                          className="text-[#123B2E]"
                        />
                        <span className="font-bold text-[#123B2E]">Customer Reply (Sends Email)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="noteType"
                          checked={isInternalNote}
                          onChange={() => setIsInternalNote(true)}
                          className="text-amber-700"
                        />
                        <span className="font-bold text-amber-800 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Internal Staff Note (Never Emailed)
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <textarea
                      rows={2}
                      placeholder={
                        isInternalNote
                          ? "Write an internal note visible only to administrators..."
                          : `Reply to ${selectedTicket.userName} (will trigger automated email)...`
                      }
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className={`flex-1 px-3 py-2 text-xs rounded-xl border focus:outline-none ${
                        isInternalNote
                          ? "bg-amber-50/50 border-amber-200 focus:ring-1 focus:ring-amber-500"
                          : "bg-[#FBF8F1] border-[#DED2BF] focus:ring-1 focus:ring-[#123B2E]"
                      }`}
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={actionLoading || !replyText.trim()}
                      className={`px-5 py-3 text-xs font-bold rounded-xl text-white transition-all flex items-center gap-1.5 ${
                        isInternalNote
                          ? "bg-amber-700 hover:bg-amber-800"
                          : "bg-[#123B2E] hover:bg-[#174B39]"
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isInternalNote ? "Post Note" : "Send Reply"}</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8 text-[#46514B]">
                Select a ticket on the left to review communication history.
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

