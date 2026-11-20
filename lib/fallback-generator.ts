import {
  CYNBIT_ALLOWED_TECH_STACK,
  CynbitTech,
  TrackId,
} from "./blueprint-constants";
import {
  WizardFormData,
  BlueprintOutput,
  blueprintOutputSchema,
} from "./schemas/blueprint";

/**
 * Filters any candidate tech stack array strictly against Cynbit's allowed whitelist.
 * Drops anything not on the list.
 * Ensures at least two valid technologies are returned.
 */
export function filterToCynbitWhitelist(candidateStack: string[], track: TrackId): CynbitTech[] {
  const allowedSet = new Set<string>(CYNBIT_ALLOWED_TECH_STACK);
  const filtered = candidateStack.filter((tech): tech is CynbitTech => allowedSet.has(tech));

  // Deduplicate
  const unique = Array.from(new Set(filtered));

  if (unique.length >= 2) {
    return unique;
  }

  // Fallback defaults per track if fewer than 2 valid items survived
  const defaultsByTrack: Record<TrackId, CynbitTech[]> = {
    "ai-automation": ["TypeScript", "Python", "FastAPI", "OpenAI", "LangChain"],
    "software-cloud": ["TypeScript", "Next.js", "PostgreSQL", "Tailwind", "Docker"],
    "marketing-seo": ["TypeScript", "Next.js", "Tailwind", "Redis", "PostgreSQL"],
  };

  const trackDefaults = defaultsByTrack[track] || ["TypeScript", "Next.js", "MongoDB", "Tailwind"];
  for (const item of trackDefaults) {
    if (!unique.includes(item)) {
      unique.push(item);
    }
    if (unique.length >= 3) break;
  }

  return unique;
}

/**
 * Deterministic rule-based blueprint generator.
 * Produces structured, high-quality blueprints without requiring an external LLM API key.
 */
export function generateFallbackBlueprint(formData: WizardFormData): BlueprintOutput {
  const { track, features, timeline, budget, name, company } = formData;
  const clientName = company ? `${company} (${name})` : name;
  const featureListStr = features.slice(0, 3).join(", ");

  let projectSummary = "";
  let baseStack: CynbitTech[] = [];
  let risksAndQuestions: string[] = [];
  let phase1Deliverables: string[] = [];
  let phase2Deliverables: string[] = [];
  let phase3Deliverables: string[] = [];

  switch (track) {
    case "ai-automation":
      projectSummary = `Architectural blueprint tailored for ${clientName}. The solution establishes an enterprise-grade AI automation pipeline targeting ${featureListStr}. Designed for high throughput, predictable token consumption, and seamless integration with existing operations within a ${timeline} delivery window at a ${budget} calibration.`;
      baseStack = [
        "TypeScript",
        "Python",
        "FastAPI",
        "OpenAI",
        "LangChain",
        "Redis",
        "MongoDB",
        "Docker",
      ];
      risksAndQuestions = [
        "What are the target SLA latency limits for real-time model completions (e.g., sub-800ms)?",
        "Will proprietary enterprise documents require dedicated vector embedding pipelines or hybrid search?",
        "Are there strict data residency or compliance boundaries for third-party LLM inference?",
      ];
      phase1Deliverables = [
        "Technical architecture & API contract specification",
        "Prompt engineering evaluations & baseline accuracy benchmarks",
        "Vector index schema & knowledge ingestion pipeline",
      ];
      phase2Deliverables = [
        "FastAPI microservice implementation with LangChain orchestration",
        "Asynchronous task queue with Redis & Docker deployment",
        "Automated fallback routes & rate-limit handling",
      ];
      phase3Deliverables = [
        "End-to-end integration testing & token cost auditing",
        "Observability dashboard, logging, and performance telemetry",
        "Production launch and handover to client engineering",
      ];
      break;

    case "software-cloud":
      projectSummary = `Comprehensive cloud application architecture for ${clientName}. Focused on delivering a resilient full-stack platform implementing ${featureListStr}. Structured around modern serverless patterns, type-safe API boundaries, and scalable data layers suited for ${timeline} execution within ${budget}.`;
      baseStack = [
        "TypeScript",
        "Next.js",
        "NestJS",
        "Tailwind",
        "PostgreSQL",
        "MongoDB",
        "Docker",
        "AWS",
      ];
      risksAndQuestions = [
        "What is the projected peak concurrent user load and database transaction volume?",
        "Does the system require multi-region AWS availability or strict single-region compliance?",
        "Are existing legacy databases or third-party CRM APIs required for bidirectional sync?",
      ];
      phase1Deliverables = [
        "System domain modeling and ERD database design (PostgreSQL/MongoDB)",
        "Next.js App Router wireframes and Tailwind design system setup",
        "CI/CD deployment pipeline configuration with Docker on AWS",
      ];
      phase2Deliverables = [
        "NestJS core microservices and RESTful API endpoints",
        "Responsive client-side modules and interactive state management",
        "Secure authentication, RBAC authorization, and data encryption",
      ];
      phase3Deliverables = [
        "Automated integration & load testing suites",
        "AWS CloudWatch telemetry, CDN caching, and security hardening",
        "Production deployment and technical handover documentation",
      ];
      break;

    case "marketing-seo":
      projectSummary = `Growth engineering and digital marketing infrastructure blueprint for ${clientName}. Designed to accelerate user acquisition and conversion via ${featureListStr}. Combines high-performance web vitals, programmatic page generation, and granular event attribution targeted for ${timeline} under a ${budget} investment tier.`;
      baseStack = [
        "TypeScript",
        "Next.js",
        "Tailwind",
        "PostgreSQL",
        "Redis",
        "AWS",
      ];
      risksAndQuestions = [
        "What are the primary attribution tools currently active (e.g. GA4, Segment, PostHog)?",
        "What is the target volume of programmatic landing pages to generate and index monthly?",
        "What are the target Core Web Vitals thresholds for mobile conversion benchmarks?",
      ];
      phase1Deliverables = [
        "Technical SEO audit, schema markup schema, and URL taxonomy design",
        "Conversion funnel mapping and baseline telemetry instrumentation",
        "Next.js static site generation template setup for Core Web Vitals (90+ score)",
      ];
      phase2Deliverables = [
        "Programmatic landing page generation pipeline with Redis caching",
        "High-converting lead capture modules with automated email routing",
        "A/B testing harness and event attribution tracking hooks",
      ];
      phase3Deliverables = [
        "Search engine indexing verification and sitemap automation",
        "Analytics dashboard setup and weekly conversion reporting cadence",
        "Final optimization sprint and conversion audit handover",
      ];
      break;
  }

  // Enforce whitelist
  const validatedStack = filterToCynbitWhitelist(baseStack, track);

  const rawBlueprint: BlueprintOutput = {
    projectSummary,
    suggestedStack: validatedStack,
    phases: [
      {
        phaseName: "Phase 1: Architecture & Technical Foundations",
        duration: "2 - 3 Weeks",
        deliverables: phase1Deliverables,
      },
      {
        phaseName: "Phase 2: Core Engineering & Capability Delivery",
        duration: "3 - 5 Weeks",
        deliverables: phase2Deliverables,
      },
      {
        phaseName: "Phase 3: Hardening, Telemetry & Production Launch",
        duration: "1 - 2 Weeks",
        deliverables: phase3Deliverables,
      },
    ],
    risksAndQuestions,
    recommendedNextStep:
      "Schedule a 30-minute technical discovery call with the Cynbit engineering team in Jaipur to review your scope and firm up the delivery timeline.",
  };

  return blueprintOutputSchema.parse(rawBlueprint);
}
