import { describe, it, expect } from "vitest";
import { validateQuestionDependencies } from "@/lib/validation/form-builder";
import { IFormField } from "@/lib/models/FormVersion";

describe("Question Conditional Dependency Validation", () => {
  it("passes when question depends on an earlier question in order", () => {
    const questions: IFormField[] = [
      {
        id: "q1",
        key: "has_website",
        label: "Do you have a website?",
        step: 2,
        type: "radio",
        required: true,
        active: true,
        order: 1,
        serviceSlugs: ["all"],
      },
      {
        id: "q2",
        key: "website_url",
        label: "Website URL",
        step: 2,
        type: "url",
        required: true,
        active: true,
        order: 2,
        serviceSlugs: ["all"],
        visibleIf: {
          questionId: "q1",
          equals: "yes",
        },
      },
    ];

    const result = validateQuestionDependencies(questions);
    expect(result.valid).toBe(true);
  });

  it("rejects when a question depends on itself (cycle)", () => {
    const questions: IFormField[] = [
      {
        id: "q1",
        key: "self_referencing",
        label: "Self Referencing",
        step: 2,
        type: "text",
        required: true,
        active: true,
        order: 1,
        serviceSlugs: ["all"],
        visibleIf: {
          questionId: "q1",
          equals: "foo",
        },
      },
    ];

    const result = validateQuestionDependencies(questions);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("cannot depend on itself");
  });

  it("rejects forward references (depending on a later question)", () => {
    const questions: IFormField[] = [
      {
        id: "q1",
        key: "first_q",
        label: "First Question",
        step: 2,
        type: "text",
        required: true,
        active: true,
        order: 1,
        serviceSlugs: ["all"],
        visibleIf: {
          questionId: "q2", // q2 comes later!
          equals: "test",
        },
      },
      {
        id: "q2",
        key: "second_q",
        label: "Second Question",
        step: 2,
        type: "text",
        required: true,
        active: true,
        order: 2,
        serviceSlugs: ["all"],
      },
    ];

    const result = validateQuestionDependencies(questions);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("not an earlier question");
  });

  it("rejects references to missing/deleted question IDs", () => {
    const questions: IFormField[] = [
      {
        id: "q1",
        key: "first_q",
        label: "First Question",
        step: 2,
        type: "text",
        required: true,
        active: true,
        order: 1,
        serviceSlugs: ["all"],
        visibleIf: {
          questionId: "non_existent_q_999",
          equals: "test",
        },
      },
    ];

    const result = validateQuestionDependencies(questions);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("not an earlier question");
  });
});
