import Link from "next/link";
import { ArrowRight, Cpu, Layers, Sparkles, CheckCircle2, ChevronRight, Terminal } from "lucide-react";

export default function HomePage() {
  const serviceCategories = [
    {
      title: "AI Automation",
      desc: "Autonomous workflow agents, document intelligence, conversational voice bots, and enterprise AI stack integration.",
      badge: "Automation",
      link: "/services#ai-automation",
      items: ["Autonomous Task Agents", "LLM Document Pipelines", "AI Voice Outreach", "Stack Integrations"],
    },
    {
      title: "Custom IT & Architecture",
      desc: "Production Next.js full-stack applications, resilient backend microservices, cloud DevOps, and legacy modernization.",
      badge: "Engineering",
      link: "/services#custom-it",
      items: ["Next.js Full-Stack Web Apps", "Backend APIs & Microservices", "Cloud Infrastructure (K8s/AWS)", "Legacy Modernization"],
    },
    {
      title: "Digital Marketing & Performance",
      desc: "Data-driven conversion funnel optimization, technical Core Web Vitals SEO, and CRM pipeline automation.",
      badge: "Growth",
      link: "/services#digital-marketing",
      items: ["Performance Ad Funnels", "Technical Core Web Vitals SEO", "CRM Webhook Syncing", "Conversion Optimization"],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 md:py-32 border-b border-surface-border/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/20 via-background to-background pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-mono font-medium mb-8">
              <Terminal className="w-3.5 h-3.5" />
              <span>Cynbit Technologies Client Intake System</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
              Architecting <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Autonomous</span> & High-Performance Software.
            </h1>

            <p className="text-lg text-slate-300 leading-relaxed mb-10">
              We engineer custom autonomous workflow agents, resilient cloud backends, and conversion-focused digital systems designed for velocity, scale, and operational clarity.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-mono text-sm font-semibold uppercase tracking-wider bg-primary hover:bg-primary-hover text-background transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
              >
                Start Structured Inquiry
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-mono text-sm font-medium text-slate-300 hover:text-white bg-surface-card hover:bg-surface-elevated border border-surface-border transition-colors"
              >
                Explore Services
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-[#090d16]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-primary mb-2">Core Competencies</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Enterprise Engineering Disciplines
              </h2>
            </div>
            <Link
              href="/services"
              className="mt-4 md:mt-0 text-sm font-mono text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 group"
            >
              Browse all 12 services
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {serviceCategories.map((cat) => (
              <div
                key={cat.title}
                className="bg-surface-card rounded-2xl border border-surface-border p-7 flex flex-col justify-between hover:border-surface-borderHighlight transition-all group"
              >
                <div>
                  <div className="inline-block px-2.5 py-1 rounded bg-surface-elevated text-cyan-400 text-[11px] font-mono font-medium mb-4">
                    {cat.badge}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    {cat.desc}
                  </p>
                  <ul className="space-y-2.5 mb-8">
                    {cat.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={cat.link}
                  className="inline-flex items-center justify-between w-full pt-4 border-t border-surface-border/60 text-xs font-mono text-slate-300 group-hover:text-primary transition-colors"
                >
                  <span>View Details & Inquire</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition / Architectural Intake Highlight */}
      <section className="py-20 border-t border-surface-border/60 bg-surface-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-surface-border bg-gradient-to-b from-surface-card to-background p-8 sm:p-12">
            <div className="max-w-2xl">
              <span className="text-xs font-mono uppercase tracking-widest text-primary mb-3 block">
                Structured Client Intake
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-4">
                Tailored discovery, zero generic intake forms.
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-8">
                Our dynamic multi-step inquiry flow adapts questions to your exact service category—capturing target architecture, integrations, timeline urgency, and normalized WhatsApp/Email channels for direct technical discussion.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-mono text-xs font-semibold uppercase tracking-wider bg-primary hover:bg-primary-hover text-background transition-all shadow-md active:scale-95"
              >
                Submit Project Requirements
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
