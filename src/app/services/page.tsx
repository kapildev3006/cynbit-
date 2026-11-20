import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bot, Code2, TrendingUp, CheckCircle, Sparkles, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Engineering Services & Capabilities",
  description:
    "Explore Cynbit's full suite of AI automation, custom full-stack web and cloud architectures, and digital marketing performance solutions.",
  alternates: {
    canonical: "/services",
  },
};

const serviceData = [
  {
    category: "AI Automation",
    id: "ai-automation",
    description: "Intelligent autonomous agents, generative LLM workflows, and conversational telephony interfaces.",
    icon: Bot,
    services: [
      {
        slug: "autonomous-agents",
        name: "Autonomous Agents",
        description: "Task-execution agents that plan, reason, invoke external APIs, and execute complex business workflows without human intervention.",
        features: ["Tool calling & webhooks", "Stateful memory & context persistence", "Human-in-the-loop oversight", "Self-healing error retry"],
      },
      {
        slug: "llm-automation",
        name: "LLM Automation",
        description: "Custom enterprise document parsing pipelines, knowledge-retrieval systems, and domain-tuned models.",
        features: ["Structured data extraction", "RAG vector pipelines", "Automated document summarization", "Enterprise audit compliance"],
      },
      {
        slug: "ai-voice-agents",
        name: "AI Voice Agents",
        description: "Low-latency streaming conversational voice bots for inbound customer screening, call center triage, and outbound qualification.",
        features: ["Sub-800ms voice latency", "CRM integration & call logging", "Multilingual voice models", "Dynamic telephony routing"],
      },
      {
        slug: "ai-stack-integration",
        name: "AI Stack Integration",
        description: "Integrate specialized neural networks and open-source models directly into your existing web, cloud, and database infrastructure.",
        features: ["Model orchestration", "Latency & cost governance", "Hybrid cloud deployment", "Automated telemetry"],
      },
    ],
  },
  {
    category: "Custom IT & Architecture",
    id: "custom-it",
    description: "Robust full-stack software, fault-tolerant backend microservices, cloud deployments, and modernization.",
    icon: Code2,
    services: [
      {
        slug: "fullstack-development",
        name: "Full-Stack Web Development",
        description: "Modern, high-velocity web platforms and SaaS applications built on Next.js, React, Node.js, and TypeScript.",
        features: ["Role-based access control", "Responsive UI/UX design", "Zero-downtime CI/CD", "Server-side rendering"],
      },
      {
        slug: "backend-systems",
        name: "Backend Systems & APIs",
        description: "Resilient microservices, high-throughput database architectures, event-driven message queues, and REST/GraphQL APIs.",
        features: ["High-throughput processing", "Distributed caching & rate limits", "Data integrity guarantees", "Telemetry & monitoring"],
      },
      {
        slug: "cloud-infrastructure",
        name: "Cloud Infrastructure & DevOps",
        description: "Infrastructure as Code, Docker/Kubernetes container orchestration, multi-region resilience, and cloud cost management.",
        features: ["Terraform & Ansible IaC", "Automated deployment pipelines", "Security posture hardening", "Elastic auto-scaling"],
      },
      {
        slug: "legacy-migration",
        name: "Legacy System Modernization",
        description: "Safely decompose monolithic on-premise legacy systems into modular cloud services with continuous business continuity.",
        features: ["Strangler fig pattern", "Zero-loss data migration", "Modern API facades", "Comprehensive regression testing"],
      },
    ],
  },
  {
    category: "Digital Marketing & Performance",
    id: "digital-marketing",
    description: "Conversion funnel optimization, technical Core Web Vitals acceleration, and automated lead nurture sequences.",
    icon: TrendingUp,
    services: [
      {
        slug: "performance-ads",
        name: "Performance Advertising",
        description: "High-yield paid acquisition across Meta, Google Ads, and LinkedIn with algorithmic audience targeting.",
        features: ["Audience segmentation", "Creative A/B testing", "Conversion API tracking", "ROAS optimization"],
      },
      {
        slug: "technical-seo",
        name: "Technical SEO & Speed Optimization",
        description: "Accelerate site performance for Google Core Web Vitals, implement semantic schema, and rank for high-intent search terms.",
        features: ["Sub-second LCP optimization", "Semantic Schema markup", "Indexation troubleshooting", "Search architecture mapping"],
      },
      {
        slug: "crm-automation",
        name: "CRM & Funnel Automation",
        description: "Connect website inquiries instantly to your CRM, trigger team notifications, and execute automated lead nurture workflows.",
        features: ["Multi-channel sequence routing", "Instant WhatsApp/Email alerts", "Lead qualification scoring", "Sales pipeline syncing"],
      },
      {
        slug: "funnel-optimization",
        name: "Conversion Funnel Optimization",
        description: "User journey mapping, behavioral analytics, and conversion rate optimization (CRO) to maximize lead capture.",
        features: ["Friction-point analysis", "Landing page split testing", "Interactive form tuning", "Attribution modeling"],
      },
    ],
  },
];

export default function ServicesPage() {
  return (
    <div className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-3xl mb-12">
        <p className="text-xs font-mono uppercase tracking-widest text-primary mb-3">
          Engineering & Delivery Catalog
        </p>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-6">
          Architectural Solutions Designed for High Performance.
        </h1>
        <p className="text-slate-300 text-base leading-relaxed">
          Every inquiry is backed by structured discovery. Select any service below to launch a tailored requirement intake flow that pre-populates your selected discipline.
        </p>

        {/* Category Jump Pills */}
        <div className="flex flex-wrap gap-2.5 mt-8">
          {serviceData.map((cat) => (
            <a
              key={cat.id}
              href={`#${cat.id}`}
              className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium bg-surface-card border border-surface-border text-slate-300 hover:text-white hover:border-primary/50 transition-colors"
            >
              {cat.category}
            </a>
          ))}
        </div>
      </div>

      {/* Services List by Category */}
      <div className="space-y-20">
        {serviceData.map((category) => {
          const Icon = category.icon;
          return (
            <section key={category.id} id={category.id} className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-3 border-b border-surface-border/60 pb-4">
                <div className="h-9 w-9 rounded-lg bg-surface-card border border-surface-border flex items-center justify-center text-primary">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    {category.category}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {category.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {category.services.map((service) => (
                  <div
                    key={service.slug}
                    className="bg-surface-card rounded-2xl border border-surface-border p-7 flex flex-col justify-between hover:border-surface-borderHighlight transition-all group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {service.name}
                        </h3>
                        <span className="font-mono text-[10px] text-slate-500 uppercase">
                          {service.slug}
                        </span>
                      </div>

                      <p className="text-slate-300 text-sm leading-relaxed mb-6">
                        {service.description}
                      </p>

                      <div className="space-y-2 mb-8">
                        <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                          Capabilities:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {service.features.map((feat) => (
                            <div
                              key={feat}
                              className="flex items-center gap-2 text-xs text-slate-300"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                              <span className="truncate">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Pre-selected Inquire CTA (Addresses Audit Problem: generic contact links) */}
                    <Link
                      href={`/contact?service=${service.slug}`}
                      className="inline-flex items-center justify-between w-full py-3 px-4 rounded-xl bg-surface-elevated hover:bg-primary hover:text-background border border-surface-border group-hover:border-primary/40 text-xs font-mono font-semibold uppercase tracking-wider text-primary transition-all active:scale-[0.98]"
                    >
                      <span>Inquire About {service.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
