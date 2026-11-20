import { describe, it, expect } from "vitest";
import { wizardFormSchema, blueprintOutputSchema } from "@/lib/schemas/blueprint";
import { isValidTrack } from "@/lib/blueprint-constants";

describe("Domain & Zod Schema Validation", () => {
  describe("isValidTrack helper", () => {
    it("validates allowed service tracks", () => {
      expect(isValidTrack("ai-automation")).toBe(true);
      expect(isValidTrack("software-cloud")).toBe(true);
      expect(isValidTrack("marketing-seo")).toBe(true);
    });

    it("rejects unknown or invalid tracks safely", () => {
      expect(isValidTrack("unknown-track")).toBe(false);
      expect(isValidTrack("")).toBe(false);
      expect(isValidTrack(null)).toBe(false);
      expect(isValidTrack(123)).toBe(false);
    });
  });

  describe("wizardFormSchema", () => {
    const validPayload = {
      track: "ai-automation" as const,
      features: ["LLM Integration & Prompt Pipelines"],
      timeline: "1 - 3 Months (Standard Production)" as const,
      budget: "$5,000 - $15,000 (Production Build)" as const,
      name: "Alice Sharma",
      email: "alice@example.com",
      company: "Acme Corp",
      note: "Looking to automate client queries.",
      _hp_company_url: "",
    };

    it("accepts valid wizard form input", () => {
      const result = wizardFormSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("rejects missing features", () => {
      const invalid = { ...validPayload, features: [] };
      const result = wizardFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects invalid email address", () => {
      const invalid = { ...validPayload, email: "not-an-email" };
      const result = wizardFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects short name", () => {
      const invalid = { ...validPayload, name: "A" };
      const result = wizardFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("blueprintOutputSchema", () => {
    it("validates valid blueprint output with Cynbit allowed stack", () => {
      const validBlueprint = {
        projectSummary: "Comprehensive AI Automation platform integrating LLM pipelines.",
        suggestedStack: ["TypeScript", "Next.js", "Python", "FastAPI", "OpenAI"],
        phases: [
          {
            phaseName: "Phase 1: Architecture & Data Modeling",
            duration: "2 Weeks",
            deliverables: ["Tech spec", "Data schema"],
          },
          {
            phaseName: "Phase 2: Core Engineering & Delivery",
            duration: "4 Weeks",
            deliverables: ["API endpoints", "Integration tests"],
          },
        ],
        risksAndQuestions: [
          "What is the expected token consumption volume?",
          "Are enterprise SLA guarantees required?",
        ],
        recommendedNextStep: "Schedule a 30-minute technical discovery call with Cynbit engineering.",
      };

      const result = blueprintOutputSchema.safeParse(validBlueprint);
      expect(result.success).toBe(true);
    });

    it("rejects technologies outside of Cynbit's allowed stack whitelist", () => {
      const invalidBlueprint = {
        projectSummary: "Architecture blueprint with unapproved tech stack.",
        suggestedStack: ["TypeScript", "RubyOnRails", "PostgreSQL"], // RubyOnRails is NOT in Cynbit's stack
        phases: [
          { phaseName: "Phase 1", duration: "1 week", deliverables: ["Setup"] },
          { phaseName: "Phase 2", duration: "2 weeks", deliverables: ["Launch"] },
        ],
        risksAndQuestions: ["Risk 1", "Risk 2"],
        recommendedNextStep: "Schedule discovery call.",
      };

      const result = blueprintOutputSchema.safeParse(invalidBlueprint);
      expect(result.success).toBe(false);
    });
  });
});
