import { describe, it, expect } from "vitest";
import { validateDynamicAnswers, isQuestionVisible } from "@/lib/validation/inquiry";
import { IFormField } from "@/lib/models/FormVersion";

describe("Dynamic Form Validation & Conditional Visibility", () => {
  const sampleQuestions: IFormField[] = [
    {
      id: "q1",
      key: "goal",
      label: "Primary Goal",
      step: 2,
      type: "select",
      required: true,
      active: true,
      order: 1,
      serviceSlugs: ["all"],
      options: [
        { label: "B2B Leads", value: "b2b_leads" },
        { label: "Brand Awareness", value: "awareness" },
      ],
    },
    {
      id: "q2",
      key: "target_market",
      label: "Target Market",
      step: 2,
      type: "text",
      required: true,
      active: true,
      order: 2,
      serviceSlugs: ["all"],
      visibleIf: {
        questionId: "q1",
        equals: "b2b_leads",
      },
    },
    {
      id: "q3",
      key: "website_url",
      label: "Website URL",
      step: 2,
      type: "url",
      required: false,
      active: true,
      order: 3,
      serviceSlugs: ["custom-it"],
    },
  ];

  it("correctly evaluates conditional visibility based on parent answer", () => {
    expect(isQuestionVisible(sampleQuestions[1], "all", { q1: "b2b_leads" })).toBe(true);
    expect(isQuestionVisible(sampleQuestions[1], "all", { q1: "awareness" })).toBe(false);
    expect(isQuestionVisible(sampleQuestions[1], "all", {})).toBe(false);
  });

  it("filters questions not relevant to the selected service slug", () => {
    expect(isQuestionVisible(sampleQuestions[2], "custom-it", {})).toBe(true);
    expect(isQuestionVisible(sampleQuestions[2], "ai-automation", {})).toBe(false);
  });

  it("rejects unknown submitted fields", () => {
    const result = validateDynamicAnswers(sampleQuestions, "all", {
      q1: "b2b_leads",
      q2: "Healthcare Founders",
      unknown_field_123: "malicious_payload",
    });
    expect(result.valid).toBe(false);
    expect(result.errors["unknown_field_123"]).toBeDefined();
  });

  it("rejects answers submitted for conditionally hidden fields", () => {
    // When q1 is "awareness", q2 is hidden. If an answer to q2 is provided anyway, reject it.
    const result = validateDynamicAnswers(sampleQuestions, "all", {
      q1: "awareness",
      q2: "Attempted answer to hidden field",
    });
    expect(result.valid).toBe(false);
    expect(result.errors["q2"]).toBeDefined();
  });

  it("rejects invalid select options", () => {
    const result = validateDynamicAnswers(sampleQuestions, "all", {
      q1: "invalid_option_value",
    });
    expect(result.valid).toBe(false);
    expect(result.errors["q1"]).toBeDefined();
  });

  it("produces valid sanitized snapshot when inputs are compliant", () => {
    const result = validateDynamicAnswers(sampleQuestions, "all", {
      q1: "b2b_leads",
      q2: "FinTech Directors",
    });
    expect(result.valid).toBe(true);
    expect(result.sanitizedSnapshots).toHaveLength(2);
    expect(result.sanitizedSnapshots[0].value).toBe("b2b_leads");
    expect(result.sanitizedSnapshots[1].value).toBe("FinTech Directors");
  });
});
