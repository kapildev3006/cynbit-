import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, ArrowRight, Layers, ShieldCheck, Cpu } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Project Blueprint Generator",
  description:
    "Replace generic contact forms with an instant, structured engineering blueprint and timeline for your project.",
  openGraph: {
    url: "https://cynbit.in/",
  },
};

export default function HomePage() {
  return (
    <div className="relative overflow-hidden py-16 sm:py-24">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 flex justify-center">
        <div className="h-[450px] w-[700px] rounded-full bg-gradient-to-tr from-cyan-600/10 to-emerald-600/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 text-xs font-medium text-cyan-300 backdrop-blur-sm mb-6">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Interactive Prototype &bull; Cynbit Technologies</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-slate-100 sm:text-6xl max-w-3xl mx-auto leading-tight">
          Turn your project idea into an{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
            instant technical blueprint
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Traditional contact forms promise a &ldquo;tailored strategic overview&rdquo; but make you wait days for a generic reply. 
          Our guided 4-step wizard delivers an immediate architecture breakdown, verified tech stack, timeline phases, and risk analysis in seconds.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:opacity-90"
          >
            Start Project Blueprint
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="https://cynbit.in"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-5 py-3 text-sm font-medium text-slate-300 hover:border-slate-600 hover:text-white transition"
          >
            Visit cynbit.in
          </a>
        </div>

        {/* 3 Tracks Preview Cards */}
        <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3 text-left">
          <Link
            href="/contact?service=ai-automation"
            className="group rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur transition hover:border-cyan-500/50 hover:bg-slate-900/80"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform">
              <Cpu className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
              AI Automation
            </h2>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              LLM pipelines, agentic workflows, LangChain orchestration, RAG knowledge bases, and internal ops automation.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-cyan-400">
              Configure track &rarr;
            </span>
          </Link>

          <Link
            href="/contact?service=software-cloud"
            className="group rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur transition hover:border-emerald-500/50 hover:bg-slate-900/80"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
              <Layers className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
              Software &amp; Cloud
            </h2>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Full-stack Next.js web applications, NestJS/FastAPI microservices, Dockerized micro-architectures, and AWS infrastructure.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
              Configure track &rarr;
            </span>
          </Link>

          <Link
            href="/contact?service=marketing-seo"
            className="group rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur transition hover:border-teal-500/50 hover:bg-slate-900/80"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-200 group-hover:text-teal-300 transition-colors">
              Marketing &amp; SEO
            </h2>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Performance-driven programmatic SEO, conversion rate optimization, automated analytics tracking, and content distribution.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-teal-400">
              Configure track &rarr;
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
