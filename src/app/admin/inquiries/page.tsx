"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  RotateCcw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  User,
  Clock,
  Phone,
  Mail,
  Building,
} from "lucide-react";

interface InquiryListItem {
  _id: string;
  referenceId: string;
  contact: {
    name: string;
    company?: string;
    email: string;
    whatsapp: string;
    preferredContact: string;
  };
  serviceSlug: string;
  projectType?: string;
  status: string;
  assignedTo?: { _id: string; name: string; email: string; role: string };
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function InquiriesListPage() {
  const [inquiries, setInquiries] = useState<InquiryListItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<Array<{ _id: string; name: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [refreshedAt, setRefreshedAt] = useState<string>("");

  // Filters & Pagination State
  const [search, setSearch] = useState<string>("");
  const [status, setStatus] = useState<string>("ALL");
  const [service, setService] = useState<string>("ALL");
  const [assignee, setAssignee] = useState<string>("ALL");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchInquiries = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "15");
      if (search.trim()) params.set("search", search.trim());
      if (status !== "ALL") params.set("status", status);
      if (service !== "ALL") params.set("service", service);
      if (assignee !== "ALL") params.set("assignee", assignee);

      const res = await fetch(`/api/admin/inquiries?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load inquiries.");
      }

      const json = await res.json();
      setInquiries(json.inquiries || []);
      setTotalPages(json.pagination?.totalPages || 1);
      setTotalCount(json.pagination?.total || 0);
      setTeamMembers(json.teamMembers || []);
      setRefreshedAt(json.refreshedAt);
    } catch (err: any) {
      setError(err.message || "Failed to fetch inquiries");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, service, assignee]);

  // Initial fetch and refetch on window focus (Phase 3 addition)
  useEffect(() => {
    fetchInquiries();

    const handleFocus = () => {
      fetchInquiries();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchInquiries]);

  function getStatusBadge(st: string) {
    switch (st) {
      case "NEW":
        return "bg-amber-500/20 text-amber-300 border border-amber-500/30";
      case "CONTACTED":
        return "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30";
      case "IN_DISCUSSION":
        return "bg-blue-500/20 text-blue-300 border border-blue-500/30";
      case "PROPOSAL_SENT":
        return "bg-purple-500/20 text-purple-300 border border-purple-500/30";
      case "CONVERTED":
        return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
      case "REJECTED":
        return "bg-rose-500/20 text-rose-300 border border-rose-500/30";
      default:
        return "bg-slate-700 text-slate-300";
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-10 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">
              Lead Management
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Client Inquiries & Pipelines
            </h1>
            <p className="text-[11px] font-mono text-slate-500 mt-1">
              {totalCount} total inquiries match current criteria
              {refreshedAt && ` • Updated at ${new Date(refreshedAt).toLocaleTimeString()}`}
            </p>
          </div>

          <button
            onClick={fetchInquiries}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-medium text-slate-300 hover:text-white bg-surface-card hover:bg-surface-elevated border border-surface-border transition-all active:scale-95 disabled:opacity-50 self-start sm:self-auto"
            title="Refresh inquiry records"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-surface-card rounded-2xl border border-surface-border p-4 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search name, email, phone, ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-surface-elevated border border-surface-border rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors font-mono"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-colors font-mono"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="IN_DISCUSSION">In Discussion</option>
                <option value="PROPOSAL_SENT">Proposal Sent</option>
                <option value="CONVERTED">Converted</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Service Filter */}
            <div>
              <select
                value={service}
                onChange={(e) => {
                  setService(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-colors font-mono"
              >
                <option value="ALL">All Services</option>
                <option value="autonomous-agents">Autonomous Agents</option>
                <option value="llm-automation">LLM Automation</option>
                <option value="ai-voice-agents">AI Voice Agents</option>
                <option value="ai-stack-integration">AI Stack Integration</option>
                <option value="fullstack-development">Full-Stack Development</option>
                <option value="backend-systems">Backend Systems</option>
                <option value="cloud-infrastructure">Cloud Infrastructure</option>
                <option value="legacy-migration">Legacy Modernization</option>
                <option value="performance-ads">Performance Ads</option>
                <option value="technical-seo">Technical SEO</option>
                <option value="crm-automation">CRM Automation</option>
                <option value="funnel-optimization">Funnel Optimization</option>
              </select>
            </div>

            {/* Assignee Filter */}
            <div>
              <select
                value={assignee}
                onChange={(e) => {
                  setAssignee(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-colors font-mono"
              >
                <option value="ALL">All Assignees</option>
                <option value="UNASSIGNED">Unassigned Leads</option>
                {teamMembers.map((tm) => (
                  <option key={tm._id} value={tm._id}>
                    {tm.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Desktop Table View */}
        <div className="hidden md:block bg-surface-card rounded-2xl border border-surface-border overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border bg-surface-elevated/40 text-slate-400 font-mono">
                <th className="py-3 px-4">Ref ID</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {inquiries.length > 0 ? (
                inquiries.map((inq) => (
                  <tr key={inq._id} className="hover:bg-surface-elevated/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                      {inq.referenceId}
                      {inq.isDemo && (
                        <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          DEMO
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{inq.contact.name}</p>
                      {inq.contact.company && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-500" />
                          <span>{inq.contact.company}</span>
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] text-slate-300">
                        {inq.serviceSlug}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 space-y-0.5">
                      <p className="text-slate-300 font-mono text-[11px] flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span>{inq.contact.email}</span>
                      </p>
                      <p className="text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{inq.contact.whatsapp}</span>
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${getStatusBadge(
                          inq.status
                        )}`}
                      >
                        {inq.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {inq.assignedTo ? inq.assignedTo.name : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/inquiries/${inq._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-primary hover:text-background text-cyan-400 border border-surface-border font-mono text-[11px] transition-colors"
                      >
                        <span>Manage</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-mono text-xs">
                    {loading ? "Loading inquiries..." : "No matching inquiries found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden space-y-4">
          {inquiries.length > 0 ? (
            inquiries.map((inq) => (
              <div
                key={inq._id}
                className="bg-surface-card rounded-2xl border border-surface-border p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-cyan-400 text-sm">
                    {inq.referenceId}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${getStatusBadge(
                      inq.status
                    )}`}
                  >
                    {inq.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-white text-sm">{inq.contact.name}</h3>
                  {inq.contact.company && (
                    <p className="text-xs text-slate-400 mt-0.5">{inq.contact.company}</p>
                  )}
                </div>

                <div className="space-y-1 text-xs text-slate-300 font-mono">
                  <p className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{inq.contact.email}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{inq.contact.whatsapp}</span>
                  </p>
                </div>

                <div className="pt-3 border-t border-surface-border flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500 truncate max-w-[150px]">
                    {inq.serviceSlug}
                  </span>
                  <Link
                    href={`/admin/inquiries/${inq._id}`}
                    className="inline-flex items-center gap-1 text-xs font-mono font-bold text-primary"
                  >
                    <span>Manage Lead</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-500 font-mono text-xs">
              {loading ? "Loading inquiries..." : "No matching inquiries found."}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-surface-border font-mono text-xs">
            <span className="text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="p-2 rounded-lg bg-surface-card border border-surface-border text-slate-300 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="p-2 rounded-lg bg-surface-card border border-surface-border text-slate-300 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
