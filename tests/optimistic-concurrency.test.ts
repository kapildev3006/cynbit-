import { describe, it, expect } from "vitest";

describe("Optimistic Concurrency Check Logic", () => {
  it("detects conflict when client expectedUpdatedAt does not match document updatedAt", () => {
    const docUpdatedAt = new Date("2026-11-20T10:00:00.000Z");
    const clientExpectedUpdatedAt = "2026-11-20T09:30:00.000Z";

    const isConflict = docUpdatedAt.toISOString() !== clientExpectedUpdatedAt;
    expect(isConflict).toBe(true);
  });

  it("permits mutation when client expectedUpdatedAt matches document updatedAt", () => {
    const docUpdatedAt = new Date("2026-11-20T10:00:00.000Z");
    const clientExpectedUpdatedAt = "2026-11-20T10:00:00.000Z";

    const isConflict = docUpdatedAt.toISOString() !== clientExpectedUpdatedAt;
    expect(isConflict).toBe(false);
  });
});
