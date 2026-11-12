"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { store } from "@/lib/data/store";
import { useAuth } from "@/lib/auth/context";
import {
  Send,
  Paperclip,
  CheckCircle2,
  FileText,
  Search,
  ArrowLeft,
  Circle,
} from "lucide-react";

export default function MessagesDashboardPage() {
  const { user } = useAuth();
  const currentUserId = user?.id || "user-student-1";

  const [activeConversationId, setActiveConversationId] = useState("conv-priya-anant");
  const [messages, setMessages] = useState(store.getMessages("conv-priya-anant"));
  const [inputContent, setInputContent] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const contacts = [
    {
      id: "conv-priya-anant",
      mentorName: "Priya Sharma",
      mentorRole: "Software Engineer @ Microsoft",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
      unreadCount: 1,
      lastMessage: "Please make sure to upload your latest resume...",
      time: "12:30 PM",
      online: true,
    },
    {
      id: "conv-rohan-anant",
      mentorName: "Rohan Mehta",
      mentorRole: "Data Scientist @ Google",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      unreadCount: 0,
      lastMessage: "Ready for our technical interview round on Tuesday.",
      time: "Yesterday",
      online: false,
    },
  ];

  const activeContact = contacts.find((c) => c.id === activeConversationId) || contacts[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim()) return;

    const newMsg = store.sendMessage(
      activeConversationId,
      currentUserId,
      inputContent.trim()
    );

    setMessages([...store.getMessages(activeConversationId)]);
    setInputContent("");

    // Simulate mentor typing and reply after 1.5s
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        store.sendMessage(
          activeConversationId,
          "user-mentor-priya",
          "Got your message! I've noted down this discussion point for our live session."
        );
        setMessages([...store.getMessages(activeConversationId)]);
      }, 1500);
    }, 500);
  };

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

        {/* Messaging Container */}
        <div className="card-warm bg-white rounded-3xl p-0 overflow-hidden shadow-card grid grid-cols-1 md:grid-cols-12 flex-1 min-h-[600px] border border-border">
          {/* CONVERSATION LIST (4 COLS) */}
          <div className="md:col-span-4 border-r border-border p-4 flex flex-col justify-between bg-cream-50/50">
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
                        setMessages(store.getMessages(c.id));
                      }}
                      className={`w-full p-3 rounded-2xl text-left transition-all flex items-start gap-3 ${
                        isSelected
                          ? "bg-white border border-forest-900 shadow-sm"
                          : "hover:bg-cream-100 border border-transparent"
                      }`}
                    >
                      <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-cream-200">
                        <Image src={c.avatar} alt={c.mentorName} fill className="object-cover" />
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
              </div>
            </div>

            <div className="text-[10px] text-ink-500 pt-3 border-t border-border text-center">
              Messages persist reliably across network reconnections.
            </div>
          </div>

          {/* ACTIVE CHAT STREAM (8 COLS) */}
          <div className="md:col-span-8 flex flex-col justify-between bg-white">
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-cream-50/40">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-cream-200 flex-shrink-0">
                  <Image src={activeContact.avatar} alt={activeContact.mentorName} fill className="object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-sm text-ink-950">
                    <span>{activeContact.mentorName}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-[10px] text-ink-500">{activeContact.mentorRole}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/sessions/booking-1/live"
                  className="btn-primary text-[11px] py-1.5 px-3"
                >
                  Join Video Room
                </Link>
              </div>
            </div>

            {/* Message History */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.map((msg) => {
                const isMe = msg.senderUserId === currentUserId;
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
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-1.5 text-xs text-ink-500 italic">
                  <span className="w-2 h-2 rounded-full bg-forest-700 animate-ping"></span>
                  <span>{activeContact.mentorName} is typing...</span>
                </div>
              )}
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border flex items-center gap-2 bg-cream-50/30">
              <button
                type="button"
                onClick={() => {
                  const fileName = prompt("Attach document name (PDF):", "Resume_Draft_v2.pdf");
                  if (fileName) {
                    store.sendMessage(
                      activeConversationId,
                      currentUserId,
                      "Attached updated document for review:",
                      fileName,
                      `/documents/${fileName}`
                    );
                    setMessages([...store.getMessages(activeConversationId)]);
                  }
                }}
                className="p-2.5 rounded-full hover:bg-cream-100 text-ink-500 hover:text-ink-950 transition-colors"
                title="Attach Document"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                placeholder={`Message ${activeContact.mentorName}...`}
                className="flex-1 p-2.5 px-4 rounded-full border border-border text-xs text-ink-950 bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
              />

              <button
                type="submit"
                disabled={!inputContent.trim()}
                className="btn-primary p-2.5 rounded-full flex-shrink-0 disabled:opacity-40"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
