"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  ChevronLeft,
  RotateCcw,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  UserCheck,
  Send,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  FileText,
  Trash2,
  ExternalLink,
} from "lucide-react";

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface MessageTemplateItem {
  _id: string;
  name: string;
  channel: "EMAIL" | "WHATSAPP";
  subject?: string;
  body: string;
}

interface InquiryDetail {
  _id: string;
  referenceId: string;
  serviceSlug: string;
  projectType?: string;
  contact: {
    name: string;
    company?: string;
    email: string;
    whatsapp: string;
    country: string;
    preferredContact: "WHATSAPP" | "EMAIL" | "PHONE";
    preferredTime?: string;
    message?: string;
  };
  consent: { accepted: boolean; at: string };
  answers: Array<{
    questionId: string;
    key: string;
    label: string;
    type: string;
    value: any;
  }>;
  status: string;
  assignedTo?: { _id: string; name: string; email: string; role: string };
  statusHistory: Array<{
    from: string;
    to: string;
    userId?: { name: string };
    at: string;
  }>;
  notes: Array<{
    text: string;
    userId?: { name: string };
    createdAt: string;
  }>;
  communications: Array<{
    type: "EMAIL" | "WHATSAPP";
    outcome: string;
    note?: string;
    message: string;
    userId?: { name: string };
    at: string;
  }>;
  activity: Array<{
    type: string;
    detail: string;
    userId?: { name: string };
    at: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS = [
  "NEW",
  "CONTACTED",
  "IN_DISCUSSION",
  "PROPOSAL_SENT",
  "CONVERTED",
  "REJECTED",
];

export default function InquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const inquiryId = params.id as string;

  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [templates, setTemplates] = useState<MessageTemplateItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [conflictWarning, setConflictWarning] = useState<string>("");

  // Input States (Kept intact even when 409 conflict occurs!)
  const [newNoteText, setNewNoteText] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");

  // Communication Modal State
  const [commModalOpen, setCommModalOpen] = useState<boolean>(false);
  const [commType, setCommType] = useState<"EMAIL" | "WHATSAPP">("EMAIL");
  const [commSubject, setCommSubject] = useState<string>("");
  const [commBody, setCommBody] = useState<string>("");
  const [commOutcome, setCommOutcome] = useState<string>("REPLIED");
  const [commNote, setCommNote] = useState<string>("");
  const [commAdvanceStatus, setCommAdvanceStatus] = useState<boolean>(true);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setConflictWarning("");

      const res = await fetch(`/api/admin/inquiries/${inquiryId}`);
      if (!res.ok) {
        throw new Error("Failed to load inquiry record.");
      }
      const data = await res.json();
      setInquiry(data.inquiry);
      setSelectedStatus(data.inquiry.status);
      setSelectedAssignee(data.inquiry.assignedTo?._id || "UNASSIGNED");
      setTeamMembers(data.teamMembers || []);
      setTemplates(data.templates || []);
    } catch (err: any) {
      setError(err.message || "Failed to load inquiry details");
    } finally {
      setLoading(false);
    }
  }, [inquiryId]);

  // Initial fetch and refetch on window focus (Phase 3 addition)
  useEffect(() => {
    fetchDetail();

    const handleFocus = () => {
      fetchDetail();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchDetail]);

  // Status Change Handler with Optimistic Concurrency 409
  async function handleStatusChange(targetStatus: string) {
    if (!inquiry || targetStatus === inquiry.status) return;
    setActionLoading(true);
    setConflictWarning("");

    try {
      const res = await fetch(`/api/admin/inquiries/${inquiryId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          expectedUpdatedAt: inquiry.updatedAt,
        }),
      });

      const data = await res.json();

      if (res.status === 409 && data.conflict) {
        setConflictWarning(
          "This inquiry was modified by another user. Click 'Reload Latest' to update your view."
        );
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to update status.");
      }

      setInquiry(data.inquiry);
      setSelectedStatus(data.inquiry.status);
    } catch (err: any) {
      setError(err.message || "Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  }

  // Assignee Change Handler with Optimistic Concurrency 409
  async function handleAssigneeChange(assigneeId: string) {
    if (!inquiry) return;
    setActionLoading(true);
    setConflictWarning("");

    try {
      const res = await fetch(`/api/admin/inquiries/${inquiryId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedTo: assigneeId,
          expectedUpdatedAt: inquiry.updatedAt,
        }),
      });

      const data = await res.json();

      if (res.status === 409 && data.conflict) {
        setConflictWarning(
          "This inquiry was modified by another user. Click 'Reload Latest' to update your view."
        );
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to assign lead.");
      }

      setInquiry(data.inquiry);
      setSelectedAssignee(data.inquiry.assignedTo?._id || "UNASSIGNED");
    } catch (err: any) {
      setError(err.message || "Failed to assign lead.");
    } finally {
      setActionLoading(false);
    }
  }

  // Add Note Handler with Optimistic Concurrency 409 (Typed text preserved!)
  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNoteText.trim() || !inquiry) return;
    setActionLoading(true);
    setConflictWarning("");

    try {
      const res = await fetch(`/api/admin/inquiries/${inquiryId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newNoteText.trim(),
          expectedUpdatedAt: inquiry.updatedAt,
        }),
      });

      const data = await res.json();

      if (res.status === 409 && data.conflict) {
        setConflictWarning(
          "This inquiry was modified by another user. Your typed note has been preserved below. Click 'Reload Latest' to synchronize."
        );
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to append note.");
      }

      setInquiry(data.inquiry);
      setNewNoteText(""); // Clear note text only after successful save!
    } catch (err: any) {
      setError(err.message || "Failed to append note.");
    } finally {
      setActionLoading(false);
    }
  }

  // Open Communication Modal with Template Replacement
  function openCommunicationModal(type: "EMAIL" | "WHATSAPP") {
    if (!inquiry) return;
    setCommType(type);

    const template = templates.find((t) => t.channel === type);
    const clientName = inquiry.contact.name;
    const refId = inquiry.referenceId;
    const serviceName = inquiry.serviceSlug;

    if (type === "EMAIL") {
      const defaultSubject = `Cynbit Technologies – Inquiry Follow-Up [${refId}]`;
      const defaultBody = `Hello ${clientName},\n\nThank you for reaching out regarding your inquiry (${refId}) for ${serviceName}.\n\nOur engineering team would like to schedule a 15-minute technical discovery call to review your architecture scope.\n\nPlease let us know your availability.\n\nBest regards,\nCynbit Technologies\nhttps://cynbit.in`;

      setCommSubject(
        template?.subject
          ?.replace(/{{name}}/g, clientName)
          .replace(/{{referenceId}}/g, refId)
          .replace(/{{service}}/g, serviceName) || defaultSubject
      );

      setCommBody(
        template?.body
          ?.replace(/{{name}}/g, clientName)
          .replace(/{{referenceId}}/g, refId)
          .replace(/{{service}}/g, serviceName) || defaultBody
      );
    } else {
      const defaultWaBody = `Hi ${clientName}, this is Cynbit Technologies regarding your project inquiry (Ref: ${refId}) for ${serviceName}. We reviewed your specifications and would love to connect for a quick 15-minute discovery call. Does today or tomorrow suit you?`;

      setCommBody(
        template?.body
          ?.replace(/{{name}}/g, clientName)
          .replace(/{{referenceId}}/g, refId)
          .replace(/{{service}}/g, serviceName) || defaultWaBody
      );
    }

    setCommOutcome("REPLIED");
    setCommNote("");
    setCommModalOpen(true);
  }

  // Execute Follow-Up Action and Log Communication Entry (Honest Logging)
  async function handleLaunchAndLogCommunication() {
    if (!inquiry) return;
    setActionLoading(true);

    try {
      // 1. Open mailto: or wa.me URL
      if (commType === "EMAIL") {
        const mailtoUrl = `mailto:${encodeURIComponent(
          inquiry.contact.email
        )}?subject=${encodeURIComponent(commSubject)}&body=${encodeURIComponent(commBody)}`;
        window.open(mailtoUrl, "_blank");
      } else {
        const rawDigits = inquiry.contact.whatsapp.replace(/\D/g, "");
        const waUrl = `https://wa.me/${rawDigits}?text=${encodeURIComponent(commBody)}`;
        window.open(waUrl, "_blank");
      }

      // 2. Log communication in backend with outcome and note
      const res = await fetch(`/api/admin/inquiries/${inquiryId}/communications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: commType,
          outcome: commOutcome,
          note: commNote.trim() || undefined,
          message: commType === "EMAIL" ? `${commSubject}\n\n${commBody}` : commBody,
          advanceStatusToContacted: commAdvanceStatus && inquiry.status === "NEW",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record communication log.");
      }

      setInquiry(data.inquiry);
      setSelectedStatus(data.inquiry.status);
      setCommModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to log communication.");
    } finally {
      setActionLoading(false);
    }
  }

  // Delete Inquiry
  async function handleDelete() {
    if (
      !confirm(
        `Are you sure you want to permanently delete inquiry ${inquiry?.referenceId}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete inquiry.");
      }
      router.push("/admin/inquiries");
    } catch (err: any) {
      setError(err.message || "Failed to delete.");
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 p-10 flex items-center justify-center font-mono text-xs text-slate-500">
          Loading inquiry record...
        </main>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 p-10 font-mono text-xs text-rose-400">
          Inquiry not found or could not be retrieved.
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-10 max-w-6xl">
        {/* Navigation Breadcrumb & Refresh */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/admin/inquiries"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Inquiries</span>
          </Link>

          <button
            onClick={fetchDetail}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:text-white bg-surface-card border border-surface-border transition-all active:scale-95"
            title="Reload latest details from server"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${actionLoading ? "animate-spin" : ""}`} />
            <span>Reload Latest</span>
          </button>
        </div>

        {/* Optimistic Concurrency Conflict Alert Banner (Phase 3 addition) */}
        {conflictWarning && (
          <div className="mb-6 p-4 rounded-xl bg-amber-950/40 border border-amber-600 text-amber-200 text-xs font-mono flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{conflictWarning}</span>
            </div>
            <button
              onClick={fetchDetail}
              className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase text-[10px] transition-colors"
            >
              Reload Latest
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Inquiry Hero Header */}
        <div className="bg-surface-card rounded-2xl border border-surface-border p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl font-mono font-black text-cyan-400">
                {inquiry.referenceId}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-surface-elevated text-slate-300 border border-surface-border">
                {inquiry.status}
              </span>
              {inquiry.contact.preferredContact && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Prefers: {inquiry.contact.preferredContact}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-white">{inquiry.contact.name}</h1>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Discipline: <span className="text-white">{inquiry.serviceSlug}</span>
              {inquiry.projectType && ` • Title: ${inquiry.projectType}`}
            </p>
          </div>

          {/* Quick Communication Actions (Email & WhatsApp) */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => openCommunicationModal("EMAIL")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-surface-elevated hover:bg-slate-700 text-white border border-surface-border transition-all active:scale-95 shadow-sm"
            >
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>Email Client</span>
            </button>

            {inquiry.contact.whatsapp && (
              <button
                onClick={() => openCommunicationModal("WHATSAPP")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white transition-all active:scale-95 shadow-md shadow-emerald-900/30"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>WhatsApp Client</span>
              </button>
            )}

            <button
              onClick={handleDelete}
              className="p-2.5 rounded-xl bg-surface-card hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 border border-surface-border transition-colors"
              title="Delete inquiry record"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workflow & Assignment Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Status Progression Workflow */}
          <div className="bg-surface-card rounded-2xl border border-surface-border p-5 space-y-3">
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300">
              Pipeline Status Workflow
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((st) => (
                <button
                  key={st}
                  disabled={actionLoading}
                  onClick={() => handleStatusChange(st)}
                  className={`p-2 rounded-xl text-[11px] font-mono font-bold uppercase transition-all ${
                    inquiry.status === st
                      ? "bg-primary text-background ring-2 ring-primary/40 shadow-sm"
                      : "bg-surface-elevated border border-surface-border text-slate-400 hover:text-white"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              Changes are recorded atomically in the status history timeline with your user ID.
            </p>
          </div>

          {/* Lead Assignment */}
          <div className="bg-surface-card rounded-2xl border border-surface-border p-5 space-y-3">
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300">
              Assigned Team Member
            </label>
            <select
              value={selectedAssignee}
              disabled={actionLoading}
              onChange={(e) => handleAssigneeChange(e.target.value)}
              className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary font-mono transition-colors"
            >
              <option value="UNASSIGNED">Unassigned</option>
              {teamMembers.map((tm) => (
                <option key={tm._id} value={tm._id}>
                  {tm.name} ({tm.role})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 font-mono">
              Current Owner:{" "}
              <span className="text-cyan-400 font-semibold">
                {inquiry.assignedTo ? inquiry.assignedTo.name : "Unassigned"}
              </span>
            </p>
          </div>
        </div>

        {/* Content Tabs / Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column: Requirements Snapshot & Contact Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Details Card */}
            <div className="bg-surface-card rounded-2xl border border-surface-border p-6 space-y-4">
              <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                Client Contact Profile
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block">Full Name:</span>
                  <span className="text-white font-medium">{inquiry.contact.name}</span>
                </div>
                {inquiry.contact.company && (
                  <div>
                    <span className="text-slate-500 block">Company:</span>
                    <span className="text-white font-medium">{inquiry.contact.company}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block">Email Address:</span>
                  <span className="text-cyan-400 font-medium">{inquiry.contact.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">WhatsApp / Mobile (E.164):</span>
                  <span className="text-cyan-400 font-medium">{inquiry.contact.whatsapp}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Preferred Window:</span>
                  <span className="text-slate-300">
                    {inquiry.contact.preferredTime || "Anytime"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Submission Date:</span>
                  <span className="text-slate-300">
                    {new Date(inquiry.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {inquiry.contact.message && (
                <div className="pt-3 border-t border-surface-border">
                  <span className="text-slate-500 font-mono text-xs block mb-1">
                    Client Additional Message:
                  </span>
                  <p className="text-xs text-slate-300 whitespace-pre-wrap bg-surface-elevated p-3 rounded-xl border border-surface-border">
                    {inquiry.contact.message}
                  </p>
                </div>
              )}
            </div>

            {/* Embedded Snapshot of Dynamic Requirements */}
            <div className="bg-surface-card rounded-2xl border border-surface-border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                  Requirements Snapshot (Immutable)
                </h2>
                <span className="text-[10px] font-mono text-slate-500">
                  Versioned Form Capture
                </span>
              </div>

              <div className="space-y-4">
                {inquiry.answers && inquiry.answers.length > 0 ? (
                  inquiry.answers.map((ans, idx) => (
                    <div
                      key={ans.questionId || idx}
                      className="p-3.5 rounded-xl bg-surface-elevated border border-surface-border"
                    >
                      <p className="text-[11px] font-mono uppercase text-slate-400 mb-1">
                        {ans.label}
                      </p>
                      <p className="text-xs text-white font-medium whitespace-pre-wrap">
                        {Array.isArray(ans.value) ? ans.value.join(", ") : String(ans.value)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 font-mono">
                    No dynamic questions recorded for this inquiry.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Internal Notes & Communication Timeline */}
          <div className="space-y-6">
            {/* Append-Only Internal Notes */}
            <div className="bg-surface-card rounded-2xl border border-surface-border p-6 space-y-4">
              <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                Internal Notes (Append-Only)
              </h2>

              <form onSubmit={handleAddNote} className="space-y-3">
                <textarea
                  rows={3}
                  required
                  placeholder="Add internal engineering or call note..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="w-full bg-surface-elevated border border-surface-border rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="submit"
                  disabled={actionLoading || !newNoteText.trim()}
                  className="w-full py-2 rounded-xl bg-primary hover:bg-primary-hover text-background font-mono text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  Save Note
                </button>
              </form>

              <div className="space-y-3 pt-2 max-h-72 overflow-y-auto pr-1">
                {inquiry.notes && inquiry.notes.length > 0 ? (
                  inquiry.notes
                    .slice()
                    .reverse()
                    .map((n, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-surface-elevated border border-surface-border text-xs"
                      >
                        <p className="text-slate-200 whitespace-pre-wrap">{n.text}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-2">
                          By {n.userId?.name || "Staff"} •{" "}
                          {new Date(n.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    ))
                ) : (
                  <p className="text-xs text-slate-500 font-mono text-center py-4">
                    No internal notes logged yet.
                  </p>
                )}
              </div>
            </div>

            {/* Communication & Activity Timeline */}
            <div className="bg-surface-card rounded-2xl border border-surface-border p-6 space-y-4">
              <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                Follow-up & Activity History
              </h2>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {inquiry.communications && inquiry.communications.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-[10px] font-mono uppercase text-slate-500">Communications</p>
                    {inquiry.communications.map((c, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="font-bold text-cyan-400">{c.type}</span>
                          <span className="text-slate-400">Outcome: {c.outcome}</span>
                        </div>
                        {c.note && <p className="text-slate-300 text-[11px]">{c.note}</p>}
                        <p className="text-[10px] text-slate-500 font-mono pt-1">
                          By {c.userId?.name || "Staff"} • {new Date(c.at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[10px] font-mono uppercase text-slate-500">Activity Log</p>
                {inquiry.activity && inquiry.activity.length > 0 ? (
                  inquiry.activity
                    .slice()
                    .reverse()
                    .map((a, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-surface-elevated text-xs border border-surface-border/50"
                      >
                        <p className="text-slate-300 font-mono text-[11px]">{a.detail}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">
                          {new Date(a.at).toLocaleDateString()} at{" "}
                          {new Date(a.at).toLocaleTimeString()}
                        </p>
                      </div>
                    ))
                ) : (
                  <p className="text-xs text-slate-500 font-mono">No activity logged.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Communication Action Modal (Honest follow-up with manual outcome recording) */}
      {commModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface-card border border-surface-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
                {commType === "EMAIL" ? <Mail className="w-4 h-4 text-cyan-400" /> : <Phone className="w-4 h-4 text-emerald-400" />}
                <span>Follow-Up Via {commType}</span>
              </h3>
              <button
                onClick={() => setCommModalOpen(false)}
                className="text-slate-400 hover:text-white font-mono text-xs"
              >
                ✕
              </button>
            </div>

            {commType === "EMAIL" && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={commSubject}
                  onChange={(e) => setCommSubject(e.target.value)}
                  className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary font-mono"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Message Body (Placeholders Evaluated)
              </label>
              <textarea
                rows={5}
                value={commBody}
                onChange={(e) => setCommBody(e.target.value)}
                className="w-full bg-surface-elevated border border-surface-border rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary font-mono"
              />
            </div>

            {/* Manual Honest Outcome Recording */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Communication Outcome (Recorded in History)
              </label>
              <select
                value={commOutcome}
                onChange={(e) => setCommOutcome(e.target.value)}
                className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary font-mono"
              >
                <option value="NO_REPLY">No Reply Yet (Initial Outreach)</option>
                <option value="REPLIED">Client Replied</option>
                <option value="CALL_BOOKED">Discovery Call Scheduled</option>
                <option value="WRONG_NUMBER">Wrong Number / Invalid Contact</option>
                <option value="OTHER">Other Note</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Internal Outcome Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Sent introductory architecture proposal over email"
                value={commNote}
                onChange={(e) => setCommNote(e.target.value)}
                className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary font-mono"
              />
            </div>

            {inquiry.status === "NEW" && (
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={commAdvanceStatus}
                  onChange={(e) => setCommAdvanceStatus(e.target.checked)}
                  className="rounded border-surface-border text-primary focus:ring-0"
                />
                <span className="text-xs text-slate-300 font-mono">
                  Advance status from NEW to CONTACTED automatically
                </span>
              </label>
            )}

            <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCommModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLaunchAndLogCommunication}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-primary hover:bg-primary-hover text-background transition-all shadow-md active:scale-95"
              >
                Launch {commType} & Record Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
