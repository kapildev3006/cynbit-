import { describe, it, expect } from "vitest";
import { hashIp } from "@/lib/rate-limiter";

describe("Rate Limiter IP Hashing", () => {
  it("produces deterministic SHA-256 hash for identical IPs and salt", () => {
    const hash1 = hashIp("192.168.1.1");
    const hash2 = hashIp("192.168.1.1");

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex string length
  });

  it("produces different hashes for different IPs", () => {
    const hash1 = hashIp("192.168.1.1");
    const hash2 = hashIp("192.168.1.2");

    expect(hash1).not.toBe(hash2);
  });

  it("never includes the raw IP address in the resulting hash", () => {
    const ip = "203.0.113.195";
    const hash = hashIp(ip);

    expect(hash).not.toContain(ip);
  });
});
