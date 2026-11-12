"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Edit3,
  RotateCcw,
  Smartphone,
  Monitor,
  Server,
  Shield,
  LifeBuoy,
  XCircle,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";

export default function AdminEmailManagementPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "templates" | "automations" | "logs" | "failed" | "smtp">("overview");
  
  // Data state
  const [stats, setStats] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [automations, setAutomations] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [failedEmails, setFailedEmails] = useState<any[]>([]);
  const [smtpStatus, setSmtpStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Template Viewer / Editor Modal state
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile" | "text">("desktop");
  const [renderedPreview, setRenderedPreview] = useState<any | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editPreviewText, setEditPreviewText] = useState("");
  const [editHtmlBody, setEditHtmlBody] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Test Email Modal
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState("hellomentormaze@gmail.com");
  const [testTemplateId, setTestTemplateId] = useState("auth.welcome_student");

  // Filters
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateCategory, setTemplateCategory] = useState("all");
  const [logStatusFilter, setLogStatusFilter] = useState("all");
  const [logSearch, setLogSearch] = useState("");

  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [resStats, resTemplates, resAuto, resLogs, resFailed, resSmtp] = await Promise.all([
        fetch("/api/admin/communications/stats").then((r) => r.json()),
        fetch("/api/admin/communications/templates").then((r) => r.json()),
        fetch("/api/admin/communications/automations").then((r) => r.json()),
        fetch("/api/admin/communications/logs").then((r) => r.json()),
        fetch("/api/admin/communications/failed").then((r) => r.json()),
        fetch("/api/admin/communications/smtp").then((r) => r.json()),
      ]);

      if (resStats.success) setStats(resStats.stats);
      if (resTemplates.success) setTemplates(resTemplates.templates);
      if (resAuto.success) setAutomations(resAuto.automations);
      if (resLogs.success) setLogs(resLogs.logs);
      if (resFailed.success) setFailedEmails(resFailed.failed);
      if (resSmtp.success) setSmtpStatus(resSmtp.status);
    } catch (err: any) {
      showToast("error", err.message || "Failed to load communication state");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Preview a template
  const handlePreviewTemplate = async (template: any) => {
    setSelectedTemplate(template);
    setEditSubject(template.subject);
    setEditPreviewText(template.previewText || "");
    setEditHtmlBody(template.htmlBody || "");
    setIsEditing(false);

    try {
      const res = await fetch("/api/admin/communications/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview", id: template.id }),
      }).then((r) => r.json());

      if (res.success) {
        setRenderedPreview(res.rendered);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save template edit
  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/communications/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedTemplate.id,
          subject: editSubject,
          previewText: editPreviewText,
          htmlBody: editHtmlBody,
        }),
      }).then((r) => r.json());

      if (res.success) {
        showToast("success", `Template '${selectedTemplate.name}' saved successfully.`);
        setIsEditing(false);
        loadAllData();
      } else {
        showToast("error", res.error || "Failed to save template");
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to update template");
    } finally {
      setActionLoading(false);
    }
  };

  // Reset template
  const handleResetTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to restore this template to the master default version?")) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/communications/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", id }),
      }).then((r) => r.json());

      if (res.success) {
        showToast("success", "Template restored to master code default.");
        setSelectedTemplate(null);
        loadAllData();
      } else {
        showToast("error", res.error);
      }
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle automation
  const handleToggleAutomation = async (id: string, current: boolean) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/communications/automations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isEnabled: !current }),
      }).then((r) => r.json());

      if (res.success) {
        showToast("success", `Automation ${!current ? "enabled" : "disabled"}.`);
        loadAllData();
      } else {
        showToast("error", res.error);
      }
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Test live SMTP connection
  const handleTestSmtpConnection = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/communications/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test-connection" }),
      }).then((r) => r.json());

      if (res.success) {
        setSmtpStatus(res.status);
        if (res.status.isConnected) {
          showToast("success", "SMTP Connection verified successfully with Gmail!");
        } else {
          showToast("error", `SMTP Connection failed: ${res.status.lastError}`);
        }
      } else {
        showToast("error", res.error);
      }
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Send live test email
  const handleSendTestEmail = async () => {
    if (!testRecipient) {
      showToast("error", "Please provide a recipient email address.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/communications/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-test",
          recipientEmail: testRecipient,
          templateId: testTemplateId,
        }),
      }).then((r) => r.json());

      if (res.success) {
        showToast("success", `Test email dispatched to ${testRecipient}! Message ID: ${res.messageId}`);
        setTestEmailOpen(false);
        loadAllData();
      } else {
        showToast("error", `Dispatch failed: ${res.error}`);
      }
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Retry failed email
  const handleRetryEmail = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/communications/failed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "retry" }),
      }).then((r) => r.json());

      if (res.success) {
        showToast("success", "Email requeued for transmission.");
        loadAllData();
      }
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel queued email
  const handleCancelEmail = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/communications/failed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "cancel" }),
      }).then((r) => r.json());

      if (res.success) {
        showToast("success", "Email delivery cancelled.");
        loadAllData();
      }
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTemplates = templates.filter((t) => {
    const matchesCat = templateCategory === "all" || t.category === templateCategory;
    const matchesSearch =
      templateSearch === "" ||
      t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.id.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.subject.toLowerCase().includes(templateSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const filteredLogs = logs.filter((l) => {
    const matchesStatus = logStatusFilter === "all" || l.status === logStatusFilter;
    const matchesSearch =
      logSearch === "" ||
      l.recipientEmail.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.subject.toLowerCase().includes(logSearch.toLowerCase()) ||
      (l.templateId && l.templateId.toLowerCase().includes(logSearch.toLowerCase()));
    return matchesStatus && matchesSearch;
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
          <span className="font-semibold text-[#17211E]">Email Management Center</span>
        </div>

        {/* Top Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#DED2BF]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDF1E8] text-[#123B2E] text-xs font-bold uppercase tracking-wider mb-2">
              <Mail className="w-3.5 h-3.5 text-[#21634A]" />
              <span>Production SMTP &amp; Workflows</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#17211E]">
              Email Communication Management
            </h1>
            <p className="text-xs text-[#46514B] mt-1">
              Configure 20+ responsive brand templates, manage automated triggers, inspect delivery logs, and test SMTP transport.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setTestEmailOpen(true)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#123B2E] text-white hover:bg-[#174B39] transition-all flex items-center gap-2 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Test Email</span>
            </button>
            <button
              onClick={handleTestSmtpConnection}
              disabled={actionLoading}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-[#DED2BF] text-[#17211E] hover:bg-[#F4EFE4] transition-all flex items-center gap-2"
            >
              <Server className="w-3.5 h-3.5 text-[#21634A]" />
              <span>Verify SMTP</span>
            </button>
            <button
              onClick={loadAllData}
              disabled={loading}
              className="p-2 text-xs font-semibold rounded-xl bg-white border border-[#DED2BF] text-[#46514B] hover:bg-[#F4EFE4]"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#21634A]" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#DED2BF] overflow-x-auto pb-1 text-sm font-medium">
          {[
            { id: "overview", label: "Overview", icon: Info },
            { id: "templates", label: `Templates (${templates.length})`, icon: Mail },
            { id: "automations", label: `Automated Workflows (${automations.length})`, icon: CheckCircle2 },
            { id: "logs", label: `Delivery Logs (${logs.length})`, icon: Clock },
            { id: "failed", label: `Failed Queue (${failedEmails.length})`, icon: AlertTriangle },
            { id: "smtp", label: "SMTP Diagnostics", icon: Server },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-white text-[#123B2E] font-bold border-t border-l border-r border-[#DED2BF] -mb-[1px]"
                    : "text-[#46514B] hover:text-[#17211E] hover:bg-[#F4EFE4]"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#123B2E]" : "text-[#46514B]"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW */}
        {/* ========================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-[#DED2BF] shadow-sm">
                <span className="text-xs font-semibold text-[#46514B] block">Total Queued</span>
                <span className="font-serif text-3xl font-bold text-[#123B2E] mt-1 block">
                  {stats?.totalQueued ?? 0}
                </span>
                <span className="text-[11px] text-amber-700 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" /> Ready for dispatch
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#DED2BF] shadow-sm">
                <span className="text-xs font-semibold text-[#46514B] block">Sent &amp; Accepted</span>
                <span className="font-serif text-3xl font-bold text-[#123B2E] mt-1 block">
                  {stats?.totalSent ?? 0}
                </span>
                <span className="text-[11px] text-emerald-700 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" /> SMTP Accepted
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#DED2BF] shadow-sm">
                <span className="text-xs font-semibold text-[#46514B] block">Last 24 Hours</span>
                <span className="font-serif text-3xl font-bold text-[#17211E] mt-1 block">
                  {stats?.last24Hours ?? 0}
                </span>
                <span className="text-[11px] text-[#46514B] mt-1 block">Processed today</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#DED2BF] shadow-sm">
                <span className="text-xs font-semibold text-[#46514B] block">Failed / Bounced</span>
                <span className="font-serif text-3xl font-bold text-red-700 mt-1 block">
                  {stats?.totalFailed ?? 0}
                </span>
                <span className="text-[11px] text-red-600 flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3" /> Requires inspection
                </span>
              </div>
            </div>

            {/* Quick Status Banners */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SMTP Status Overview */}
              <div className="bg-white p-6 rounded-2xl border border-[#DED2BF] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-[#21634A]" />
                    <h3 className="font-serif text-lg font-bold text-[#17211E]">SMTP Transport Gateway</h3>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      smtpStatus?.isConnected
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-red-100 text-red-800 border border-red-300"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        smtpStatus?.isConnected ? "bg-emerald-600 animate-pulse" : "bg-red-600"
                      }`}
                    />
                    {smtpStatus?.isConnected ? "Online & Verified" : "Needs Verification"}
                  </span>
                </div>
                <div className="text-xs text-[#46514B] space-y-1.5 font-mono bg-[#FBF8F1] p-3.5 rounded-xl border border-[#DED2BF]">
                  <div>Host: <strong className="text-[#17211E]">{smtpStatus?.host || "smtp.gmail.com"}</strong></div>
                  <div>Port: <strong className="text-[#17211E]">{smtpStatus?.port || "465"} (SSL/TLS)</strong></div>
                  <div>Sender: <strong className="text-[#17211E]">{smtpStatus?.from || "MentorMaze"}</strong></div>
                  <div>User: <strong className="text-[#17211E]">{smtpStatus?.user || "hellomentormaze@gmail.com"}</strong></div>
                </div>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={handleTestSmtpConnection}
                    disabled={actionLoading}
                    className="text-xs font-bold text-[#123B2E] hover:underline flex items-center gap-1"
                  >
                    <span>Run Live Diagnostic Test</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Workflows & Template Summary */}
              <div className="bg-white p-6 rounded-2xl border border-[#DED2BF] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#21634A]" />
                    <h3 className="font-serif text-lg font-bold text-[#17211E]">Platform Policy &amp; Security</h3>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EDF1E8] text-[#123B2E] font-semibold">
                    Indian SPAM &amp; Privacy Compliant
                  </span>
                </div>
                <ul className="text-xs text-[#46514B] space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#21634A] shrink-0 mt-0.5" />
                    <span><strong>Transactional Non-Suppression:</strong> Critical verification, password reset, and session links are never blocked by promotional unsubscribes.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#21634A] shrink-0 mt-0.5" />
                    <span><strong>1-Click Unsubscribe:</strong> Promotional digests and newsletters embed cryptographic HMAC tokens for instant opt-out.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#21634A] shrink-0 mt-0.5" />
                    <span><strong>XSS &amp; HTML Sanitization:</strong> Dynamic variables are escaped and script tags are stripped before rendering.</span>
                  </li>
                </ul>
                <div className="pt-2 flex items-center gap-3">
                  <Link
                    href="/admin/support"
                    className="text-xs font-bold text-[#123B2E] hover:underline flex items-center gap-1"
                  >
                    <span>Go to Support Ticket Center</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: TEMPLATES MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === "templates" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#DED2BF] flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-[#46514B] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search templates by name, id or subject..."
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#DED2BF] bg-[#FBF8F1] focus:outline-none focus:ring-1 focus:ring-[#123B2E]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                {["all", "auth", "student", "mentor", "payment", "support", "system"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setTemplateCategory(cat)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                      templateCategory === cat
                        ? "bg-[#123B2E] text-white"
                        : "bg-[#F4EFE4] text-[#46514B] hover:bg-[#DDE6D7]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((t) => (
                <div
                  key={t.id}
                  className="bg-white p-5 rounded-2xl border border-[#DED2BF] shadow-sm flex flex-col justify-between hover:border-[#123B2E] transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EDF1E8] text-[#123B2E]">
                        {t.category}
                      </span>
                      {t.isSystemCritical ? (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          System Critical
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <h4 className="font-serif text-base font-bold text-[#17211E]">{t.name}</h4>
                    <span className="text-[11px] font-mono text-[#46514B] block mt-0.5">{t.id}</span>
                    <p className="text-xs text-[#46514B] mt-2 line-clamp-2">
                      <strong>Subject:</strong> {t.subject}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#DED2BF] mt-4 flex items-center justify-between">
                    <button
                      onClick={() => handlePreviewTemplate(t)}
                      className="text-xs font-bold text-[#123B2E] hover:underline flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview &amp; Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        setTestTemplateId(t.id);
                        setTestEmailOpen(true);
                      }}
                      className="text-xs text-[#46514B] hover:text-[#123B2E] flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Test Send</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: AUTOMATIONS MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === "automations" && (
          <div className="bg-white rounded-2xl border border-[#DED2BF] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#DED2BF] bg-[#FBF8F1] flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-[#17211E]">Event Automation Workflows</h3>
                <p className="text-xs text-[#46514B]">
                  Manage triggers that bridge platform lifecycle events to email dispatch jobs.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4EFE4] text-[#17211E] uppercase text-[10px] font-bold tracking-wider border-b border-[#DED2BF]">
                  <tr>
                    <th className="py-3 px-4">Workflow Name</th>
                    <th className="py-3 px-4">Trigger Event</th>
                    <th className="py-3 px-4">Target Template</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Executions</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DED2BF]">
                  {automations.map((a) => (
                    <tr key={a.id} className="hover:bg-[#FBF8F1]">
                      <td className="py-3 px-4 font-semibold text-[#17211E]">{a.name}</td>
                      <td className="py-3 px-4 font-mono text-[#21634A]">{a.eventType}</td>
                      <td className="py-3 px-4 font-mono text-[#46514B]">{a.templateId}</td>
                      <td className="py-3 px-4 capitalize">{a.recipientType}</td>
                      <td className="py-3 px-4 font-mono">{a.executionCount}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleAutomation(a.id, a.isEnabled)}
                          disabled={actionLoading}
                          className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                            a.isEnabled
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {a.isEnabled ? "Enabled" : "Paused"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: DELIVERY LOGS */}
        {/* ========================================================= */}
        {activeTab === "logs" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-[#DED2BF] flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-[#46514B] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter logs by recipient or subject..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#DED2BF] bg-[#FBF8F1] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                {["all", "queued", "sent", "failed", "bounced"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setLogStatusFilter(st)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize ${
                      logStatusFilter === st
                        ? "bg-[#123B2E] text-white"
                        : "bg-[#F4EFE4] text-[#46514B] hover:bg-[#DDE6D7]"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#DED2BF] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F4EFE4] text-[#17211E] uppercase text-[10px] font-bold tracking-wider border-b border-[#DED2BF]">
                    <tr>
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4">Template</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Attempts</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Queued At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DED2BF]">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#46514B]">
                          No delivery logs matching the current filter.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((l) => (
                        <tr key={l.id} className="hover:bg-[#FBF8F1]">
                          <td className="py-3 px-4 font-mono font-medium text-[#17211E]">
                            {l.recipientEmail}
                          </td>
                          <td className="py-3 px-4 font-mono text-[#46514B]">{l.templateId}</td>
                          <td className="py-3 px-4 font-medium text-[#17211E] max-w-xs truncate">
                            {l.subject}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {l.attemptCount}/{l.maxAttempts}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                l.status === "sent" || l.status === "delivered"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : l.status === "queued"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {l.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#46514B]">
                            {new Date(l.queuedAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: FAILED EMAILS */}
        {/* ========================================================= */}
        {activeTab === "failed" && (
          <div className="bg-white rounded-2xl border border-[#DED2BF] shadow-sm overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-[#DED2BF] pb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#17211E]">Failed Email Jobs</h3>
                <p className="text-xs text-[#46514B]">
                  Inspect transient delivery exceptions, view sanitized error messages, and trigger manual retries.
                </p>
              </div>
            </div>

            {failedEmails.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-serif text-base font-bold text-[#17211E]">No Failed Delivery Jobs</h4>
                <p className="text-xs text-[#46514B]">All email dispatch jobs completed with positive SMTP acceptance.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {failedEmails.map((f) => (
                  <div
                    key={f.id}
                    className="p-4 rounded-xl border border-red-200 bg-red-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-red-900">{f.recipientEmail}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-100 text-red-800">
                          {f.templateId}
                        </span>
                      </div>
                      <p className="text-xs text-[#17211E] font-medium mt-1">{f.subject}</p>
                      <p className="text-xs font-mono text-red-700 mt-1 bg-white/80 p-2 rounded border border-red-200">
                        Error: {f.errorMessage || "Unknown transmission failure"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRetryEmail(f.id)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 rounded-lg bg-[#123B2E] text-white text-xs font-semibold hover:bg-[#174B39]"
                      >
                        Retry Now
                      </button>
                      <button
                        onClick={() => handleCancelEmail(f.id)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#DED2BF] text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: SMTP DIAGNOSTICS */}
        {/* ========================================================= */}
        {activeTab === "smtp" && (
          <div className="bg-white p-6 rounded-2xl border border-[#DED2BF] space-y-6">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#17211E]">Live SMTP Transport Health</h3>
              <p className="text-xs text-[#46514B] mt-1">
                Real-time connection verification against configured Gmail SMTP gateway credentials.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 bg-[#FBF8F1] p-5 rounded-2xl border border-[#DED2BF]">
                <h4 className="font-serif text-sm font-bold text-[#17211E]">Connection Parameters</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#DED2BF]">
                    <span className="text-[#46514B]">Host:</span>
                    <span className="font-mono font-semibold">{smtpStatus?.host}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#DED2BF]">
                    <span className="text-[#46514B]">Port:</span>
                    <span className="font-mono font-semibold">{smtpStatus?.port}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#DED2BF]">
                    <span className="text-[#46514B]">Security Mode:</span>
                    <span className="font-mono font-semibold">SSL / TLS (Direct)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#DED2BF]">
                    <span className="text-[#46514B]">Authenticated User:</span>
                    <span className="font-mono font-semibold">{smtpStatus?.user}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#DED2BF]">
                    <span className="text-[#46514B]">Sender Identity:</span>
                    <span className="font-mono font-semibold">{smtpStatus?.from}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleTestSmtpConnection}
                    disabled={actionLoading}
                    className="w-full py-2.5 rounded-xl bg-[#123B2E] text-white text-xs font-bold hover:bg-[#174B39] transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? "animate-spin" : ""}`} />
                    <span>Run Connection Test</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4 bg-[#FBF8F1] p-5 rounded-2xl border border-[#DED2BF] flex flex-col justify-between">
                <div>
                  <h4 className="font-serif text-sm font-bold text-[#17211E]">Diagnostic Status</h4>
                  <div className="mt-4 p-4 rounded-xl bg-white border border-[#DED2BF] space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          smtpStatus?.isConnected ? "bg-emerald-600" : "bg-red-600"
                        }`}
                      />
                      <span className="text-xs font-bold text-[#17211E]">
                        {smtpStatus?.isConnected ? "Authenticated & Active" : "Connection Failure"}
                      </span>
                    </div>
                    {smtpStatus?.lastError ? (
                      <p className="text-xs font-mono text-red-600 mt-2 bg-red-50 p-2 rounded">
                        {smtpStatus.lastError}
                      </p>
                    ) : (
                      <p className="text-xs text-[#46514B]">
                        Transporter pool successfully verified with Gmail SMTP gateway.
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#DED2BF]">
                  <button
                    onClick={() => setTestEmailOpen(true)}
                    className="w-full py-2.5 rounded-xl bg-white border border-[#DED2BF] text-[#17211E] text-xs font-bold hover:bg-[#F4EFE4] flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5 text-[#21634A]" />
                    <span>Send Real Test Email</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* TEMPLATE PREVIEW / EDIT MODAL */}
      {/* ========================================================= */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-[#DED2BF]">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#DED2BF] bg-[#FBF8F1] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#123B2E] bg-[#EDF1E8] px-2 py-0.5 rounded">
                  {selectedTemplate.category}
                </span>
                <h3 className="font-serif text-xl font-bold text-[#17211E] mt-1">
                  {selectedTemplate.name}
                </h3>
                <span className="text-xs font-mono text-[#46514B]">{selectedTemplate.id}</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-[#F4EFE4] p-1 rounded-xl flex items-center gap-1 border border-[#DED2BF]">
                  <button
                    onClick={() => setPreviewMode("desktop")}
                    className={`p-1.5 rounded-lg ${
                      previewMode === "desktop" ? "bg-white shadow-sm text-[#123B2E]" : "text-[#46514B]"
                    }`}
                    title="Desktop Preview"
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewMode("mobile")}
                    className={`p-1.5 rounded-lg ${
                      previewMode === "mobile" ? "bg-white shadow-sm text-[#123B2E]" : "text-[#46514B]"
                    }`}
                    title="Mobile Preview (375px)"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewMode("text")}
                    className={`px-2 py-1 text-xs font-semibold rounded-lg ${
                      previewMode === "text" ? "bg-white shadow-sm text-[#123B2E]" : "text-[#46514B]"
                    }`}
                  >
                    Plain Text
                  </button>
                </div>

                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 ${
                    isEditing
                      ? "bg-[#123B2E] text-white border-[#123B2E]"
                      : "bg-white text-[#17211E] border-[#DED2BF] hover:bg-[#F4EFE4]"
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? "View Preview" : "Edit Template"}</span>
                </button>

                <button
                  onClick={() => handleResetTemplate(selectedTemplate.id)}
                  className="p-2 text-xs rounded-xl bg-white border border-[#DED2BF] text-amber-800 hover:bg-amber-50"
                  title="Restore Defaults"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="p-2 rounded-xl text-[#46514B] hover:text-[#17211E]"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#F4EFE4] flex justify-center">
              {isEditing ? (
                <div className="w-full max-w-2xl bg-white p-6 rounded-2xl border border-[#DED2BF] space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[#17211E] block mb-1">Email Subject Line</label>
                    <input
                      type="text"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED2BF] bg-[#FBF8F1] font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#17211E] block mb-1">Preview / Preheader Text</label>
                    <input
                      type="text"
                      value={editPreviewText}
                      onChange={(e) => setEditPreviewText(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED2BF] bg-[#FBF8F1] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#17211E] block mb-1">
                      Available Template Variables
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-[#FBF8F1] border border-[#DED2BF]">
                      {selectedTemplate.variables?.map((v: any) => (
                        <span
                          key={v.key}
                          className="px-2 py-0.5 rounded bg-white text-[11px] font-mono border border-[#DED2BF] text-[#21634A]"
                          title={`${v.description} (e.g. ${v.sampleValue})`}
                        >
                          &#123;&#123;{v.key}&#125;&#125;
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-[#DED2BF]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveTemplate}
                      disabled={actionLoading}
                      className="px-5 py-2 text-xs font-bold rounded-xl bg-[#123B2E] text-white hover:bg-[#174B39]"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : previewMode === "text" ? (
                <div className="w-full max-w-2xl bg-white p-6 rounded-2xl border border-[#DED2BF] shadow font-mono text-xs text-[#17211E] whitespace-pre-wrap leading-relaxed">
                  {renderedPreview?.text || "Generating plain text..."}
                </div>
              ) : (
                <div
                  className={`bg-white rounded-2xl shadow-xl overflow-hidden transition-all border border-[#DED2BF] ${
                    previewMode === "mobile" ? "w-[375px]" : "w-[620px]"
                  }`}
                >
                  <iframe
                    title="Email Render Preview"
                    srcDoc={renderedPreview?.html || "<p>Loading preview...</p>"}
                    className="w-full h-[650px] border-0"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TEST EMAIL MODAL */}
      {/* ========================================================= */}
      {testEmailOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#DED2BF] space-y-4">
            <div className="flex items-center justify-between border-b border-[#DED2BF] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#17211E]">Send Test Email</h3>
              <button onClick={() => setTestEmailOpen(false)} className="text-[#46514B] hover:text-[#17211E]">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-[#17211E] block mb-1">Target Template</label>
              <select
                value={testTemplateId}
                onChange={(e) => setTestTemplateId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED2BF] bg-[#FBF8F1] focus:outline-none"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#17211E] block mb-1">Recipient Email Address</label>
              <input
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="you@domain.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED2BF] bg-[#FBF8F1] focus:outline-none"
              />
              <span className="text-[11px] text-[#46514B] mt-1 block">
                Dispatches a live email via Gmail SMTP using real sample variables.
              </span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setTestEmailOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-[#DED2BF]"
              >
                Cancel
              </button>
              <button
                onClick={handleSendTestEmail}
                disabled={actionLoading}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-[#123B2E] text-white hover:bg-[#174B39] flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{actionLoading ? "Sending..." : "Dispatch Test"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

