"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/lib/auth/context";
import {
  Send,
  Paperclip,
  CheckCircle2,
  FileText,
  Search,
  ArrowLeft,
  Circle,
  AlertCircle,
  Loader2,
  LogIn,
  MessageSquare,
} from "lucide-react";

function MessagesDashboardContent() {
  const searchParams = useSearchParams();
  const mentorIdParam = searchParams.get("mentorId");
  const { user, isLoading: authLoading } = useAuth();

  const [contacts, setContacts] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">(mentorIdParam ? "chat" : "list");
  const [messages, setMessages] = useState<any[]>([]);
  const [inputContent, setInputContent] = useState("");
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch conversations or initialize with mentor
  useEffect(() => {
    let isMounted = true;

    async function loadConversations() {
      if (authLoading) return;
      if (!user) {
        setIsLoadingContacts(false);
        return;
      }

      try {
        setIsLoadingContacts(true);
        setError(null);

        // If mentorIdParam is provided, initialize or load that conversation
        if (mentorIdParam) {
          const res = await fetch(`/api/messages?mentorId=${encodeURIComponent(mentorIdParam)}`);
          if (res.ok) {
            const data = await res.json();
            if (isMounted && data.success && data.conversationId) {
              setActiveConversationId(data.conversationId);
              setMessages(data.messages || []);
            }
          }
        }

        // Load all conversations for this user
        const listRes = await fetch("/api/messages");
        if (!listRes.ok) {
          throw new Error(`Failed to load conversations (HTTP ${listRes.status})`);
        }
        const listData = await listRes.json();
        if (isMounted && listData.success) {
          const convList = listData.conversations || [];
          setContacts(convList);

          // If no activeConversationId yet, default to first conversation
          if (!mentorIdParam && convList.length > 0) {
            setActiveConversationId(convList[0].id);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Messages load error:", err);
          setError(err.message || "Failed to load conversations.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingContacts(false);
        }
      }
    }

    loadConversations();
    return () => {
      isMounted = false;
    };
  }, [user, authLoading, mentorIdParam]);

  // 2. Fetch messages whenever activeConversationId changes
  useEffect(() => {
    let isMounted = true;

    async function loadActiveMessages() {
      if (!activeConversationId) return;

      try {
        setIsLoadingMessages(true);
        const res = await fetch(`/api/messages?conversationId=${encodeURIComponent(activeConversationId)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success) {
            setMessages(data.messages || []);
          }
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        if (isMounted) {
          setIsLoadingMessages(false);
        }
      }
    }

    loadActiveMessages();
    return () => {
      isMounted = false;
    };
  }, [activeConversationId]);

  const activeContact = contacts.find((c) => c.id === activeConversationId) || (contacts.length > 0 ? contacts[0] : null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() || !activeConversationId || isSending) return;

    const outgoingText = inputContent.trim();
    setInputContent("");

    try {
      setIsSending(true);
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId,
          content: outgoingText,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send message");
      }

      // Append persisted message to thread
      setMessages((prev) => [...prev, data.message]);

      // Update contact preview
      setContacts((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, lastMessage: outgoingText, time: "Just now" }
            : c
        )
      );
    } catch (err: any) {
      alert("Error sending message: " + err.message);
      setInputContent(outgoingText); // restore
    } finally {
      setIsSending(false);
    }
  };

  const handleSendAttachment = async () => {
    if (!activeConversationId || isSending) return;
    const fileName = prompt("Attach document name (PDF):", "Resume_Draft_v2.pdf");
    if (!fileName) return;

    try {
      setIsSending(true);
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId,
          content: "Attached document for your review:",
          attachmentName: fileName,
          attachmentUrl: `/documents/${fileName}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessages((prev) => [...prev, data.message]);
      } else {
        alert(data.error || "Failed to send attachment");
      }
    } catch (err: any) {
      alert("Error sending attachment: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  if (authLoading || isLoadingContacts) {
    return (
      <div className="min-h-screen flex flex-col bg-cream-50">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-forest-800 animate-spin mb-4" />
          <p className="text-xs text-ink-600 font-medium">Loading direct messages...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-cream-50">
        <Navbar />
        <main className="flex-1 max-w-md mx-auto px-4 py-20 text-center">
          <div className="card-warm bg-white p-8 rounded-3xl shadow-card">
            <div className="w-12 h-12 rounded-full bg-forest-100 text-forest-900 mx-auto flex items-center justify-center mb-4">
              <LogIn className="w-6 h-6" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-ink-950 mb-2">Sign In Required</h1>
            <p className="text-xs text-ink-600 mb-6">
              Please sign in to access your direct mentor and student message threads.
            </p>
            <Link
              href="/login?redirect=/dashboard/messages"
              className="btn-primary text-xs py-2.5 px-6 inline-flex items-center gap-2"
            >
              <span>Sign In to Continue</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-ink-700 hover:text-forest-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Messaging Container */}
        <div className="card-warm bg-white rounded-3xl p-0 overflow-hidden shadow-card grid grid-cols-1 md:grid-cols-12 flex-1 min-h-[600px] border border-border">
          {/* CONVERSATION LIST (4 COLS) */}
          <div className={`md:col-span-4 border-r border-border p-4 flex-col justify-between bg-cream-50/50 ${mobileView === "chat" ? "hidden md:flex" : "flex"}`}>
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                <h2 className="font-serif text-lg font-bold text-ink-950">Messages</h2>
                <span className="badge-sage text-[10px]">Durable Chat</span>
              </div>

              {/* Contacts */}
              <div className="space-y-2">
                {contacts.map((c) => {
                  const isSelected = activeConversationId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveConversationId(c.id);
                        setMobileView("chat");
                      }}
                      className={`w-full min-h-[56px] p-3 rounded-2xl text-left transition-all flex items-start gap-3 ${
                        isSelected
                          ? "bg-white border border-forest-900 shadow-sm"
                          : "hover:bg-cream-100 border border-transparent"
                      }`}
                    >
                      <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-cream-200">
                        <Image src={c.avatar} alt={c.mentorName || "User"} fill className="object-cover" />
                        {c.online && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-ink-950 truncate">
                            {c.mentorName}
                          </span>
                          <span className="text-[10px] text-ink-400">{c.time}</span>
                        </div>
                        <p className="text-[11px] text-ink-500 truncate">{c.mentorRole}</p>
                        <p className="text-[11px] text-ink-700 truncate mt-0.5">{c.lastMessage}</p>
                      </div>
                      {c.unreadCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-forest-900 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                          {c.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}

                {contacts.length === 0 && (
                  <div className="p-8 text-center text-xs text-ink-500">
                    <MessageSquare className="w-8 h-8 text-ink-300 mx-auto mb-2" />
                    <p className="font-semibold text-ink-800">No active conversations yet.</p>
                    <p className="mt-1">Browse approved mentors and click &quot;Message&quot; to initiate a thread.</p>
                    <Link href="/mentors" className="btn-secondary text-xs mt-4 inline-block py-1.5 px-3 min-h-[40px]">
                      Find Mentors
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="text-[10px] text-ink-500 pt-3 border-t border-border text-center">
              Messages persist reliably across network reconnections.
            </div>
          </div>

          {/* ACTIVE CHAT STREAM (8 COLS) */}
          <div className={`md:col-span-8 flex-col justify-between bg-white ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
            {activeContact ? (
              <>
                {/* Chat Header */}
                <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between bg-cream-50/40">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setMobileView("list")}
                      className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-ink-700 hover:text-ink-950 hover:bg-cream-100 transition-colors"
                      aria-label="Back to conversations list"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-cream-200 flex-shrink-0">
                      <Image src={activeContact.avatar} alt={activeContact.mentorName} fill className="object-cover" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-ink-950">
                        <span>{activeContact.mentorName}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      </div>
                      <p className="text-[10px] text-ink-500 truncate max-w-[150px] sm:max-w-none">{activeContact.mentorRole}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/sessions/demo-live/live"
                      className="btn-primary min-h-[36px] text-[11px] py-1.5 px-3 flex items-center justify-center"
                    >
                      Join Room
                    </Link>
                  </div>
                </div>

                {/* Message History */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[500px]">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 text-forest-800 animate-spin" />
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((msg) => {
                      const isMe = msg.senderUserId === user.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed ${
                              isMe
                                ? "bg-forest-900 text-white rounded-br-xs"
                                : "bg-cream-100 text-ink-950 border border-border rounded-bl-xs"
                            }`}
                          >
                            <p>{msg.content}</p>

                            {/* Attachment if present */}
                            {msg.attachmentName && (
                              <div
                                className={`mt-2 p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs ${
                                  isMe ? "bg-forest-800 text-emerald-300" : "bg-white text-forest-900 border border-border"
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <FileText className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate font-semibold">{msg.attachmentName}</span>
                                </div>
                                <span className="text-[10px] opacity-75">PDF</span>
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] text-ink-400 mt-1 px-1">
                            {msg.createdAt
                              ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                              : "Now"}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-xs text-ink-500">
                      No messages yet in this conversation. Send a greeting to start chatting!
                    </div>
                  )}
                </div>

                {/* Message Input Form */}
                <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-border flex items-center gap-2 bg-cream-50/30">
                  <button
                    type="button"
                    onClick={handleSendAttachment}
                    disabled={isSending}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-full hover:bg-cream-100 text-ink-500 hover:text-ink-950 transition-colors"
                    title="Attach Document"
                    aria-label="Attach Document"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={inputContent}
                    onChange={(e) => setInputContent(e.target.value)}
                    placeholder={`Message ${activeContact.mentorName}...`}
                    disabled={isSending}
                    className="flex-1 min-h-[44px] p-2.5 px-4 rounded-full border border-border text-sm sm:text-xs text-ink-950 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
                  />

                  <button
                    type="submit"
                    disabled={!inputContent.trim() || isSending}
                    className="btn-primary min-h-[44px] min-w-[44px] p-2.5 rounded-full flex-shrink-0 flex items-center justify-center disabled:opacity-40"
                    title="Send Message"
                    aria-label="Send Message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-ink-500 text-xs">
                <MessageSquare className="w-12 h-12 text-ink-300 mb-3" />
                <h3 className="font-serif text-lg font-bold text-ink-950 mb-1">Select a Conversation</h3>
                <p>Choose a contact from the left pane or explore mentors to start a new chat.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function MessagesDashboardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-cream-50">
          <Navbar />
          <main className="flex-1 max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-forest-800 animate-spin mb-4" />
            <p className="text-xs text-ink-600 font-medium">Loading direct messages...</p>
          </main>
          <Footer />
        </div>
      }
    >
      <MessagesDashboardContent />
    </React.Suspense>
  );
}
