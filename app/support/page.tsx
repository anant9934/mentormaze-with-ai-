"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/lib/auth/context";
import {
  LifeBuoy,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Search,
  ExternalLink,
} from "lucide-react";

export default function SupportPortalPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // New Ticket Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    userEmail: user?.email || "",
    userName: user?.displayName || "",
    category: "mentor_booking",
    priority: "medium",
    subject: "",
    description: "",
    bookingId: "",
    paymentReference: "",
  });

  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/support/tickets").then((r) => r.json());
      if (res.success) {
        setTickets(res.tickets);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [user]);

  const handleSelectTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    try {
      const res = await fetch(`/api/support/tickets/${ticket.id}`).then((r) => r.json());
      if (res.success) {
        setTicketMessages(res.messages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.description) {
      showToast("error", "Please provide a subject and detailed description.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userEmail: user?.email || formData.userEmail,
          userName: user?.displayName || formData.userName,
        }),
      }).then((r) => r.json());

      if (res.success) {
        showToast("success", `Support ticket ${res.ticket.ticketNumber} created! An email confirmation was sent.`);
        setShowCreateModal(false);
        setFormData({
          userEmail: user?.email || "",
          userName: user?.displayName || "",
          category: "mentor_booking",
          priority: "medium",
          subject: "",
          description: "",
          bookingId: "",
          paymentReference: "",
        });
        loadTickets();
        handleSelectTicket(res.ticket);
      } else {
        showToast("error", res.error || "Failed to submit support ticket");
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: replyText,
          isInternalNote: false,
        }),
      }).then((r) => r.json());

      if (res.success) {
        setReplyText("");
        handleSelectTicket(selectedTicket);
        showToast("success", "Reply posted successfully.");
      } else {
        showToast("error", res.error || "Failed to post reply");
      }
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

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
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-[#DED2BF]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDF1E8] text-[#123B2E] text-xs font-bold uppercase tracking-wider mb-2">
              <LifeBuoy className="w-3.5 h-3.5 text-[#21634A]" />
              <span>MentorMaze Help &amp; Care</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#17211E]">
              Support &amp; Inquiries Center
            </h1>
            <p className="text-xs text-[#46514B] mt-1">
              Have questions about your booking, mock interviews, payments, or mentor profile? Our team responds within 6 hours.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-xl bg-[#123B2E] text-white text-xs font-bold hover:bg-[#174B39] transition-all flex items-center gap-2 shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span>Submit New Ticket</span>
          </button>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: My Tickets */}
          <div className="bg-white rounded-2xl border border-[#DED2BF] shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-[#DED2BF] bg-[#FBF8F1] flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-[#17211E]">Support Inquiries</h3>
              <span className="text-xs font-mono font-bold text-[#21634A]">
                {tickets.length} total
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#DED2BF]">
              {tickets.length === 0 ? (
                <div className="text-center py-12 px-4 text-[#46514B] text-xs">
                  <LifeBuoy className="w-8 h-8 text-[#21634A] mx-auto mb-2 opacity-50" />
                  <p>You have no open support tickets.</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="text-[#123B2E] font-bold underline mt-2 block mx-auto"
                  >
                    Open a support ticket
                  </button>
                </div>
              ) : (
                tickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTicket(t)}
                    className={`w-full text-left p-4 hover:bg-[#FBF8F1] transition-all flex flex-col justify-between ${
                      selectedTicket?.id === t.id ? "bg-[#EDF1E8] border-l-4 border-[#123B2E]" : ""
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold text-[#21634A]">
                          {t.ticketNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            t.status === "resolved" || t.status === "closed"
                              ? "bg-emerald-100 text-emerald-800"
                              : t.status === "waiting_on_user"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {t.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#17211E] line-clamp-1">{t.subject}</h4>
                      <p className="text-[11px] text-[#46514B] line-clamp-1 mt-0.5">{t.description}</p>
                    </div>
                    <span className="text-[10px] text-[#46514B] mt-2 block">
                      Updated {new Date(t.updatedAt).toLocaleDateString()}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Ticket Thread Viewer */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#DED2BF] shadow-sm overflow-hidden flex flex-col h-[600px]">
            {selectedTicket ? (
              <>
                {/* Thread Header */}
                <div className="p-5 border-b border-[#DED2BF] bg-[#FBF8F1] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#21634A]">
                        {selectedTicket.ticketNumber}
                      </span>
                      <span className="text-xs text-[#46514B] capitalize">
                        &bull; {selectedTicket.category.replace(/_/g, " ")}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-[#17211E] mt-0.5">
                      {selectedTicket.subject}
                    </h3>
                  </div>

                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                      selectedTicket.status === "resolved"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {selectedTicket.status.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#FBF8F1]/50">
                  {ticketMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                        msg.senderRole === "user"
                          ? "bg-white border-[#DED2BF] ml-6"
                          : "bg-[#EDF1E8] border-[#DDE6D7] mr-6"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#17211E] flex items-center gap-1.5">
                          {msg.senderName}
                          {msg.senderRole !== "user" && (
                            <span className="text-[10px] bg-[#123B2E] text-white px-1.5 py-0.5 rounded font-mono font-normal">
                              Staff
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-[#46514B]">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-[#17211E] whitespace-pre-wrap leading-relaxed">
                        {msg.message}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Reply Box */}
                {selectedTicket.status !== "resolved" && selectedTicket.status !== "closed" ? (
                  <div className="p-4 border-t border-[#DED2BF] bg-white flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Type your response to the support team..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                      className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-[#DED2BF] bg-[#FBF8F1] focus:outline-none"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={submitting || !replyText.trim()}
                      className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#123B2E] text-white hover:bg-[#174B39] disabled:opacity-50 transition-all flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 text-emerald-800 text-xs text-center border-t border-emerald-200">
                    This ticket has been marked as resolved. To reopen, submit a new message.
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#46514B]">
                <MessageSquare className="w-12 h-12 text-[#21634A] mb-3 opacity-40" />
                <h4 className="font-serif text-lg font-bold text-[#17211E]">Select an Inquiry</h4>
                <p className="text-xs max-w-sm mt-1">
                  Choose a support ticket on the left to view the communication thread or open a new request.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* NEW TICKET MODAL */}
      {/* ========================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#DED2BF] space-y-4">
            <div className="flex items-center justify-between border-b border-[#DED2BF] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#17211E]">Create Support Ticket</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[#46514B] hover:text-[#17211E]">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              {!user && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[#17211E] block mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.userName}
                      onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#DED2BF] bg-[#FBF8F1] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[#17211E] block mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.userEmail}
                      onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#DED2BF] bg-[#FBF8F1] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#17211E] block mb-1">Issue Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#DED2BF] bg-[#FBF8F1] focus:outline-none"
                  >
                    <option value="account_login">Account and Login</option>
                    <option value="mentor_booking">Mentor Booking</option>
                    <option value="mock_interview">Mock Interview</option>
                    <option value="payment_refund">Payment and Refund</option>
                    <option value="mentor_application">Mentor Application</option>
                    <option value="technical_problem">Technical Problem</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#17211E] block mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#DED2BF] bg-[#FBF8F1] focus:outline-none"
                  >
                    <option value="low">Low &mdash; General Query</option>
                    <option value="medium">Medium &mdash; Standard</option>
                    <option value="high">High &mdash; Upcoming Session</option>
                    <option value="urgent">Urgent &mdash; Active Problem</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#17211E] block mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Need help joining today's LiveKit room"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#DED2BF] bg-[#FBF8F1] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#17211E] block mb-1">Detailed Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Please describe what you are experiencing..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#DED2BF] bg-[#FBF8F1] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#17211E] block mb-1">Booking ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. booking-173143"
                    value={formData.bookingId}
                    onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#DED2BF] bg-[#FBF8F1] font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#17211E] block mb-1">Payment Ref (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. ORDER_92817"
                    value={formData.paymentReference}
                    onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#DED2BF] bg-[#FBF8F1] font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#DED2BF] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#123B2E] text-white font-bold hover:bg-[#174B39] flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? "Submitting..." : "Submit Ticket"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
