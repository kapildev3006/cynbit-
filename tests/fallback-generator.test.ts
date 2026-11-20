import { describe, it, expect } from "vitest";
import {
  generateFallbackBlueprint,
  filterToCynbitWhitelist,
} from "@/lib/fallback-generator";
import {
  CYNBIT_ALLOWED_TECH_STACK,
  TrackId,
} from "@/lib/blueprint-constants";
import { WizardFormData } from "@/lib/schemas/blueprint";

describe("Fallback Generator & Whitelist Filter", () => {
  describe("filterToCynbitWhitelist", () => {
    it("preserves valid technologies from Cynbit whitelist", () => {
      const input = ["TypeScript", "Next.js", "Python", "MongoDB"];
      const result = filterToCynbitWhitelist(input, "software-cloud");

      expect(result).toEqual(expect.arrayContaining(["TypeScript", "Next.js", "Python", "MongoDB"]));
      for (const item of result) {
        expect(CYNBIT_ALLOWED_TECH_STACK).toContain(item);
      }
    });

    it("strictly strips out technologies not in Cynbit's whitelist", () => {
      const input = ["RubyOnRails", "TypeScript", "Angular", "Vue", "MongoDB", "PHP"];
      const result = filterToCynbitWhitelist(input, "ai-automation");

      expect(result).toContain("TypeScript");
      expect(result).toContain("MongoDB");
      expect(result).not.toContain("RubyOnRails");
      expect(result).not.toContain("Angular");
      expect(result).not.toContain("Vue");
      expect(result).not.toContain("PHP");
    });

    it("provides track-specific fallbacks if filtered stack has fewer than 2 items", () => {
      const input = ["RandomFramework"];
      const result = filterToCynbitWhitelist(input, "ai-automation");

      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result).toContain("TypeScript");
      expect(result).toContain("Python");
    });
  });

  describe("generateFallbackBlueprint", () => {
    const tracks: TrackId[] = ["ai-automation", "software-cloud", "marketing-seo"];

    tracks.forEach((track) => {
      it(`generates valid compliant blueprint for ${track}`, () => {
        const formData: WizardFormData = {
          track,
          features: ["Feature 1", "Feature 2"],
          timeline: "1 - 3 Months (Standard Production)",
          budget: "$5,000 - $15,000 (Production Build)",
          name: "Test Client",
          email: "client@example.com",
          company: "Cynbit Partner",
          note: "Need high reliability system",
          _hp_company_url: "",
        };

        const blueprint = generateFallbackBlueprint(formData);

        // Verify summary
        expect(blueprint.projectSummary).toBeDefined();
        expect(blueprint.projectSummary.length).toBeGreaterThan(30);

        // Verify tech stack whitelist compliance
        expect(blueprint.suggestedStack.length).toBeGreaterThanOrEqual(2);
        for (const tech of blueprint.suggestedStack) {
          expect(CYNBIT_ALLOWED_TECH_STACK).toContain(tech);
        }

        // Verify phases
        expect(blueprint.phases.length).toBeGreaterThanOrEqual(2);
        for (const phase of blueprint.phases) {
          expect(phase.phaseName).toBeDefined();
          expect(phase.duration).toBeDefined();
          expect(phase.deliverables.length).toBeGreaterThanOrEqual(1);
        }

        // Verify risks and next step
        expect(blueprint.risksAndQuestions.length).toBeGreaterThanOrEqual(2);
        expect(blueprint.recommendedNextStep).toContain("Cynbit");
      });
    });

    it("handles optional company and note cleanly", () => {
      const minimalFormData: WizardFormData = {
        track: "ai-automation",
        features: ["LLM Integration & Prompt Pipelines"],
        timeline: "< 1 Month (Fast-Track Prototype)",
        budget: "< $5,000 (Discovery / MVP)",
        name: "Solo Founder",
        email: "solo@founder.io",
        company: "",
        note: "",
        _hp_company_url: "",
      };

      const blueprint = generateFallbackBlueprint(minimalFormData);
      expect(blueprint.projectSummary).toContain("Solo Founder");
      expect(blueprint.suggestedStack.length).toBeGreaterThanOrEqual(2);
    });
  });
});
