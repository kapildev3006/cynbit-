"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ArrowUpRight, Terminal } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If inside the admin portal, the admin layout handles its own navigation
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: "Inquire", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-border/60 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Text Wordmark (No copyrighted image assets) */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-lg bg-surface-card border border-surface-border flex items-center justify-center text-primary group-hover:border-primary/50 transition-colors">
            <Terminal className="w-4 h-4" />
          </div>
          <span className="font-mono font-bold tracking-wider text-lg text-white">
            CYNBIT<span className="text-primary">.IN</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive
                    ? "text-primary font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action CTAs */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/admin/login"
            className="text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors px-3 py-1.5 rounded border border-surface-border hover:border-slate-700"
          >
            Admin Portal
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider bg-primary hover:bg-primary-hover text-background font-mono transition-all shadow-sm hover:shadow-cyan-500/20 active:scale-95"
          >
            Start Discovery
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-card transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-surface-border bg-background px-4 pt-2 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-300 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-surface-border flex flex-col gap-3">
            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center py-2 text-xs font-mono text-slate-400 border border-surface-border rounded-lg"
            >
              Admin Portal
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-primary text-background font-mono"
            >
              Start Discovery
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
