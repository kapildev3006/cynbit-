// Domain constants for Cynbit Technologies AI Project Blueprint

export const CYNBIT_TRACKS = [
  {
    id: "ai-automation",
    label: "AI Automation",
    shortDescription: "Autonomous agents, LLM pipelines, RAG systems, and enterprise process automation.",
    icon: "Cpu",
    accentColor: "cyan",
  },
  {
    id: "software-cloud",
    label: "Software & Cloud",
    shortDescription: "Scalable modern web applications, robust microservices, and resilient AWS architectures.",
    icon: "Layers",
    accentColor: "emerald",
  },
  {
    id: "marketing-seo",
    label: "Marketing & SEO",
    shortDescription: "Programmatic SEO architectures, high-converting funnels, and data attribution systems.",
    icon: "ShieldCheck",
    accentColor: "teal",
  },
] as const;

export type TrackId = (typeof CYNBIT_TRACKS)[number]["id"];

export const TRACK_IDS = CYNBIT_TRACKS.map((t) => t.id) as [TrackId, ...TrackId[]];

export function isValidTrack(value: unknown): value is TrackId {
  return typeof value === "string" && TRACK_IDS.includes(value as TrackId);
}

// Tailored feature chips per track
export const TRACK_FEATURES: Record<TrackId, string[]> = {
  "ai-automation": [
    "LLM Integration & Prompt Pipelines",
    "Autonomous Agents & Tool Orchestration",
    "RAG Knowledge Base & Semantic Search",
    "Enterprise Internal Ops Automation",
    "Customer Support AI & Conversational Bots",
    "Data Extraction & Document Intelligence",
  ],
  "software-cloud": [
    "Full-Stack Web App (Next.js / TypeScript)",
    "API & Microservices (FastAPI / NestJS)",
    "Cloud Architecture & AWS Deployment",
    "Database Architecture (PostgreSQL / MongoDB)",
    "Containerization & Docker CI/CD",
    "Real-Time Cache & Messaging (Redis)",
  ],
  "marketing-seo": [
    "Programmatic SEO Architecture",
    "Conversion Rate Optimization (CRO)",
    "Automated Lead Capture & Email Funnels",
    "Analytics Tracking & Data Attribution",
    "Content Generation & Distribution Pipeline",
    "Technical Core Web Vitals Optimization",
  ],
};

// Timeline choices
export const TIMELINE_OPTIONS = [
  "< 1 Month (Fast-Track Prototype)",
  "1 - 3 Months (Standard Production)",
  "3 - 6 Months (Enterprise Scaled)",
  "Flexible / Ongoing Advisory",
] as const;

// Budget ranges
export const BUDGET_OPTIONS = [
  "< $5,000 (Discovery / MVP)",
  "$5,000 - $15,000 (Production Build)",
  "$15,000 - $35,000 (Scaled Architecture)",
  "$35,000+ (Enterprise System)",
] as const;

// Cynbit's strict technology stack whitelist (MUST NOT deviate from this list)
export const CYNBIT_ALLOWED_TECH_STACK = [
  "TypeScript",
  "Python",
  "Next.js",
  "NestJS",
  "FastAPI",
  "Tailwind",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "Supabase",
  "AWS",
  "Docker",
  "OpenAI",
  "LangChain",
] as const;

export type CynbitTech = (typeof CYNBIT_ALLOWED_TECH_STACK)[number];
