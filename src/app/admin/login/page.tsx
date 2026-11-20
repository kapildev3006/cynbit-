"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, Terminal, AlertCircle, ArrowRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      router.push(from);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
          Staff Email Address
        </label>
        <div className="relative">
          <input
            type="email"
            required
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface-elevated border border-surface-border rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
          />
          <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
          Password
        </label>
        <div className="relative">
          <input
            type="password"
            required
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-surface-elevated border border-surface-border rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
          />
          <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 py-3 rounded-xl bg-primary hover:bg-primary-hover text-background font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-md shadow-cyan-500/20"
      >
        {loading ? (
          <>
            <span className="animate-spin">◌</span> Authenticating...
          </>
        ) : (
          <>
            Sign In to Lead Console
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-surface-card border border-surface-border flex items-center justify-center text-primary mx-auto mb-4 shadow-lg shadow-cyan-500/10">
            <Terminal className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white font-mono tracking-wider">
            CYNBIT<span className="text-primary">.PORTAL</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Restricted Administrative Access & Lead Management
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-surface-card border border-surface-border rounded-2xl p-7 shadow-2xl">
          <Suspense
            fallback={
              <div className="py-8 text-center text-xs font-mono text-slate-500">
                Loading authentication portal...
              </div>
            }
          >
            <LoginForm />
          </Suspense>

          <div className="mt-6 pt-4 border-t border-surface-border/60 text-center">
            <p className="text-[11px] text-slate-500 font-mono">
              Protected by bcrypt hash verification, jose signed sessions, and rate-limited brute-force guards.
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <a
            href="/"
            className="text-xs text-slate-400 hover:text-primary transition-colors font-mono"
          >
            ← Return to Public Website
          </a>
        </div>
      </div>
    </div>
  );
}
