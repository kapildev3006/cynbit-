import { describe, it, expect } from "vitest";
import { generateReferenceId } from "@/lib/utils/reference-id";

describe("Reference ID Generator", () => {
  it("generates reference ID with CYN- prefix and 6 alphanumeric characters", () => {
    const id = generateReferenceId();
    expect(id).toMatch(/^CYN-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
  });

  it("generates unique reference IDs across multiple generations", () => {
    const set = new Set<string>();
    for (let i = 0; i < 500; i++) {
      const id = generateReferenceId();
      expect(set.has(id)).toBe(false);
      set.add(id);
    }
    expect(set.size).toBe(500);
  });
});
