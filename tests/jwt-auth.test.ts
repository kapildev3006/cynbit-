import { describe, it, expect } from "vitest";
import { signToken, verifyToken } from "@/lib/auth/jwt";

describe("JWT Authentication & Role Claims", () => {
  it("signs and verifies an ADMIN session token with claims intact", async () => {
    const payload = {
      userId: "usr_123456789",
      email: "admin@cynbit.in",
      name: "Admin User",
      role: "ADMIN" as const,
    };

    const token = await signToken(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);

    const verified = await verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.email).toBe(payload.email);
    expect(verified?.role).toBe("ADMIN");
  });

  it("signs and verifies a MEMBER session token with claims intact", async () => {
    const payload = {
      userId: "usr_member_987",
      email: "member@cynbit.in",
      name: "Staff Engineer",
      role: "MEMBER" as const,
    };

    const token = await signToken(payload);
    const verified = await verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.role).toBe("MEMBER");
  });

  it("returns null for malformed or tampered tokens", async () => {
    expect(await verifyToken("invalid.token.payload")).toBeNull();
    expect(await verifyToken("")).toBeNull();
  });
});
