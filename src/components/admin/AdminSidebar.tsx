"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Inbox,
  FileText,
  Settings,
  LogOut,
  ExternalLink,
  Shield,
  User as UserIcon,
  Terminal,
} from "lucide-react";

interface CurrentUser {
  userId: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        // Handled by middleware redirect
      }
    }
    loadUser();
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Inquiries", href: "/admin/inquiries", icon: Inbox },
    {
      label: "Form Builder",
      href: "/admin/forms",
      icon: FileText,
      adminOnly: true,
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: Settings,
      adminOnly: true,
    },
  ];

  return (
    <aside className="w-64 bg-surface-card border-r border-surface-border flex flex-col justify-between h-screen sticky top-0">
      <div>
        {/* Header */}
        <div className="h-16 px-6 border-b border-surface-border flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-surface-elevated border border-surface-border flex items-center justify-center text-primary">
              <Terminal className="w-4 h-4" />
            </div>
            <span className="font-mono font-bold text-sm tracking-wider text-white">
              CYNBIT<span className="text-primary">.LEADS</span>
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            if (item.adminOnly && user?.role === "MEMBER") {
              return null; // Hide admin-only features from Member role
            }

            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-mono transition-all ${
                  isActive
                    ? "bg-primary text-background font-bold shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white hover:bg-surface-elevated"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Badge */}
      <div className="p-4 border-t border-surface-border space-y-3">
        {user && (
          <div className="px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white truncate max-w-[130px]">
                {user.name}
              </span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  user.role === "ADMIN"
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/30"
                    : "bg-slate-700 text-slate-300"
                }`}
              >
                {user.role}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
              {user.email}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between px-1 text-xs">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 text-slate-400 hover:text-white font-mono text-[11px] transition-colors"
          >
            <span>Public Site</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 font-mono text-[11px] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
