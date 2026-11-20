import { describe, it, expect } from "vitest";
import { normalizeToE164, isValidE164, extractPhoneDigits } from "@/lib/utils/phone";

describe("Phone Normalizer & E.164 Validator", () => {
  it("normalizes a 10-digit Indian mobile number to E.164 with +91 default", () => {
    expect(normalizeToE164("9876543210")).toBe("+919876543210");
  });

  it("handles formatting spaces, dashes, and parentheses", () => {
    expect(normalizeToE164("(+91) 98765-43210")).toBe("+919876543210");
    expect(normalizeToE164("+91 98765 43210")).toBe("+919876543210");
  });

  it("handles numbers already starting with + and country code", () => {
    expect(normalizeToE164("+1 (555) 123-4567")).toBe("+15551234567");
    expect(normalizeToE164("+44 7911 123456")).toBe("+447911123456");
  });

  it("handles 00 international prefix", () => {
    expect(normalizeToE164("00919876543210")).toBe("+919876543210");
  });

  it("validates valid E.164 strings", () => {
    expect(isValidE164("+919876543210")).toBe(true);
    expect(isValidE164("+15551234567")).toBe(true);
    expect(isValidE164("9876543210")).toBe(false);
    expect(isValidE164("+0123456789")).toBe(false); // Country code cannot start with 0
    expect(isValidE164("")).toBe(false);
  });

  it("extracts phone digits for database searching", () => {
    expect(extractPhoneDigits("+91 98765-43210")).toBe("919876543210");
  });
});
