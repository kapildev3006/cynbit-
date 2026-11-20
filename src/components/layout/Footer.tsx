import Link from "next/link";
import { Terminal, Shield, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-surface-border/60 bg-[#070b12] text-slate-400 text-sm py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded bg-surface-card border border-surface-border flex items-center justify-center text-primary">
                <Terminal className="w-4 h-4" />
              </div>
              <span className="font-mono font-bold tracking-wider text-white">
                CYNBIT<span className="text-primary">.IN</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Full-Stack Lead Intake & Client Management System Prototype.
              Engineered with dynamic form schemas, structured requirements capture, and an administrative follow-up pipeline.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs font-mono text-slate-500">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-primary" />
                NoSQL Guard & Salted Hash Rate Limited
              </span>
            </div>
          </div>

          {/* Core Navigation */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3 font-mono">
              Navigation
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-primary transition-colors">
                  Services Catalog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Client Inquiry Portal
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-primary transition-colors font-mono">
                  Admin Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Engineering Domains */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3 font-mono">
              Engineering Disciplines
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>AI Automation & Agents</li>
              <li>Custom Full-Stack IT</li>
              <li>Cloud Infrastructure</li>
              <li>Performance Systems</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-surface-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <p>© {new Date().getFullYear()} Cynbit Assignment Prototype. Conventional business application.</p>
          <p className="flex items-center gap-2">
            <span>Stand-alone Architectural Prototype</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
