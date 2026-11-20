import { describe, it, expect } from "vitest";
import { hasNoSqlInjectionKeys, escapeRegex, escapeCsvField } from "@/lib/security/sanitize";

describe("NoSQL Injection Sanitizer & Escape Utilities", () => {
  it("detects top-level operator keys starting with $", () => {
    expect(hasNoSqlInjectionKeys({ $gt: "" })).toBe(true);
    expect(hasNoSqlInjectionKeys({ $where: "1==1" })).toBe(true);
  });

  it("detects nested operator keys and dots", () => {
    expect(hasNoSqlInjectionKeys({ filter: { $ne: null } })).toBe(true);
    expect(hasNoSqlInjectionKeys({ "contact.email": "test@test.com" })).toBe(true);
    expect(hasNoSqlInjectionKeys({ nested: [{ $regex: ".*" }] })).toBe(true);
  });

  it("passes valid safe objects", () => {
    expect(hasNoSqlInjectionKeys({ name: "Alex", email: "alex@example.com", age: 30 })).toBe(false);
    expect(hasNoSqlInjectionKeys(["simple", "array", 123])).toBe(false);
    expect(hasNoSqlInjectionKeys(null)).toBe(false);
  });

  it("escapes regex special characters safely", () => {
    const input = "test.*+?^${}()|[]\\";
    const escaped = escapeRegex(input);
    expect(new RegExp(escaped).test(input)).toBe(true);
  });

  it("escapes CSV formula injection characters (=, +, -, @, tab)", () => {
    expect(escapeCsvField("=SUM(A1:A10)")).toBe("\"'=SUM(A1:A10)\"");
    expect(escapeCsvField("+12345")).toBe("\"'+12345\"");
    expect(escapeCsvField("-CMD()")).toBe("\"'-CMD()\"");
    expect(escapeCsvField("@HYPERLINK('http://evil.com')")).toBe("\"'@HYPERLINK('http://evil.com')\"");
    expect(escapeCsvField("Normal text")).toBe("Normal text");
    expect(escapeCsvField("Text, with comma")).toBe("\"Text, with comma\"");
  });
});
