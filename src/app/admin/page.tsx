"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  RotateCcw,
  Inbox,
  Clock,
  MessageSquare,
  FileCheck,
  CheckCircle,
  XCircle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface DashboardData {
  counts: {
    TOTAL: number;
    NEW: number;
    CONTACTED: number;
    IN_DISCUSSION: number;
    PROPOSAL_SENT: number;
    CONVERTED: number;
    REJECTED: number;
  };
  serviceBreakdown: Array<{ _id: string; count: number }>;
  recent: Array<{
    _id: string;
    referenceId: string;
    contact: { name: string; company?: string; email: string };
    serviceSlug: string;
    status: string;
    createdAt: string;
  }>;
  refreshedAt: string;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) {
        throw new Error("Failed to load metrics.");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and refetch on window focus (Phase 3 addition)
  useEffect(() => {
    fetchDashboard();

    const handleFocus = () => {
      fetchDashboard();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchDashboard]);

  const cards = [
    { label: "Total Inquiries", count: data?.counts.TOTAL || 0, icon: Inbox, color: "text-white" },
    { label: "New (Unprocessed)", count: data?.counts.NEW || 0, icon: Clock, color: "text-amber-400" },
    { label: "Contacted", count: data?.counts.CONTACTED || 0, icon: MessageSquare, color: "text-cyan-400" },
    { label: "In Discussion", count: data?.counts.IN_DISCUSSION || 0, icon: MessageSquare, color: "text-blue-400" },
    { label: "Proposal Sent", count: data?.counts.PROPOSAL_SENT || 0, icon: FileCheck, color: "text-purple-400" },
    { label: "Converted", count: data?.counts.CONVERTED || 0, icon: CheckCircle, color: "text-emerald-400" },
    { label: "Rejected / Closed", count: data?.counts.REJECTED || 0, icon: XCircle, color: "text-rose-400" },
  ];

  const conversionRate =
    data?.counts.TOTAL && data.counts.TOTAL > 0
      ? Math.round(((data.counts.CONVERTED || 0) / data.counts.TOTAL) * 100)
      : 0;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-10 max-w-7xl">
        {/* Header with Refresh button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">
              Operational Overview
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Lead Management Dashboard
            </h1>
            {data?.refreshedAt && (
              <p className="text-[11px] font-mono text-slate-500 mt-1">
                Last updated: {new Date(data.refreshedAt).toLocaleTimeString()} (Auto-refetches on window focus)
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboard}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-medium text-slate-300 hover:text-white bg-surface-card hover:bg-surface-elevated border border-surface-border transition-all active:scale-95 disabled:opacity-50"
              title="Refresh dashboard metrics"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
              <span>Refresh</span>
            </button>
            <Link
              href="/admin/inquiries"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-primary hover:bg-primary-hover text-background transition-all shadow-md active:scale-95"
            >
              <span>View All Leads</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.label}
                className="p-5 rounded-2xl bg-surface-card border border-surface-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-slate-400">{c.label}</span>
                  <Icon className={`w-4 h-4 ${c.color}`} />
                </div>
                <div className={`text-2xl sm:text-3xl font-black font-mono ${c.color}`}>
                  {c.count}
                </div>
              </div>
            );
          })}

          {/* Conversion Rate Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/30 to-surface-card border border-primary/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-cyan-400">Conversion Rate</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-300">
              {conversionRate}%
            </div>
          </div>
        </div>

        {/* Recent Inquiries & Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Inquiries Table */}
          <div className="lg:col-span-2 bg-surface-card rounded-2xl border border-surface-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                Recent Submissions
              </h2>
              <Link
                href="/admin/inquiries"
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300"
              >
                View full list →
              </Link>
            </div>

            {data?.recent && data.recent.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-surface-border text-slate-400 font-mono">
                      <th className="pb-3">Reference</th>
                      <th className="pb-3">Client</th>
                      <th className="pb-3">Service</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/50">
                    {data.recent.map((inq) => (
                      <tr key={inq._id} className="hover:bg-surface-elevated/40">
                        <td className="py-3 font-mono text-cyan-400 font-semibold">
                          {inq.referenceId}
                        </td>
                        <td className="py-3">
                          <p className="font-medium text-white">{inq.contact.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {inq.contact.company || inq.contact.email}
                          </p>
                        </td>
                        <td className="py-3 text-slate-300 font-mono text-[11px]">
                          {inq.serviceSlug}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-surface-elevated text-slate-300">
                            {inq.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            href={`/admin/inquiries/${inq._id}`}
                            className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px]"
                          >
                            Manage →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-mono text-slate-500">
                No recent inquiries logged yet.
              </div>
            )}
          </div>

          {/* Service Distribution */}
          <div className="bg-surface-card rounded-2xl border border-surface-border p-6">
            <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider mb-4">
              Top Inquired Services
            </h2>
            {data?.serviceBreakdown && data.serviceBreakdown.length > 0 ? (
              <div className="space-y-3">
                {data.serviceBreakdown.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-elevated border border-surface-border"
                  >
                    <span className="text-xs font-mono text-slate-300 truncate max-w-[170px]">
                      {item._id}
                    </span>
                    <span className="text-xs font-bold font-mono text-cyan-400">
                      {item.count} leads
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-mono text-slate-500">
                No service data logged.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
