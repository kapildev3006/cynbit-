import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the dependencies before importing route
vi.mock("@/lib/db", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/security/rate-limiter", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/models/Inquiry", () => {
  const mockInquiryConstructor = vi.fn().mockImplementation(function (this: any, data: any) {
    Object.assign(this, data);
    this.save = vi.fn().mockResolvedValue(this);
  });
  // Attach static methods
  (mockInquiryConstructor as any).findOne = vi.fn();
  (mockInquiryConstructor as any).syncIndexes = vi.fn();
  return { Inquiry: mockInquiryConstructor };
});

vi.mock("@/lib/models/FormVersion", () => ({
  FormVersion: {
    findOne: vi.fn(),
    syncIndexes: vi.fn(),
  },
}));

// Now import the route handler
import { POST } from "@/app/api/inquiries/route";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { Inquiry } from "@/lib/models/Inquiry";
import { FormVersion } from "@/lib/models/FormVersion";

describe("POST /api/inquiries Submission Logic (Isolated Unit Tests)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseValidPayload = {
    serviceSlug: "fullstack-development",
    projectType: "Enterprise Portal",
    idempotencyKey: "11111111-2222-3333-4444-555555555555",
    honeypot: "",
    contact: {
      name: "Alex Rivera",
      company: "Rivera Tech",
      email: "alex@riveratech.com",
      whatsapp: "+91 98765 43210",
      country: "IN",
      preferredContact: "WHATSAPP",
      preferredTime: "Afternoon",
      message: "Looking for an MVP build",
    },
    consent: {
      accepted: true,
    },
    answers: {},
  };

  it("1. Honeypot spam trap: returns silent fake success and saves nothing to database", async () => {
    const payload = {
      ...baseValidPayload,
      honeypot: "I_AM_A_SPAMBOT",
    };

    const req = new NextRequest("http://localhost:3000/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.referenceId).toBe("CYN-BOTOK1");
    // Verify no DB queries or saves were executed
    expect(Inquiry.findOne).not.toHaveBeenCalled();
    expect(FormVersion.findOne).not.toHaveBeenCalled();
  });

  it("2. Rate limiting: returns 429 when IP limit is exceeded", async () => {
    (checkRateLimit as any).mockResolvedValue({
      success: false,
      count: 10,
      remaining: 0,
      resetAt: new Date(),
    });

    const req = new NextRequest("http://localhost:3000/api/inquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "203.0.113.195",
      },
      body: JSON.stringify(baseValidPayload),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.error).toContain("Too many submissions");
    expect(Inquiry.findOne).not.toHaveBeenCalled();
  });

  it("3. Idempotency handling: returns existing reference ID on duplicate key", async () => {
    (checkRateLimit as any).mockResolvedValue({ success: true, count: 1, remaining: 5 });

    // Mock existing inquiry found by idempotencyKey
    (Inquiry.findOne as any).mockReturnValue({
      lean: vi.fn().mockResolvedValue({ referenceId: "CYN-EXIST1" }),
    });

    const req = new NextRequest("http://localhost:3000/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(baseValidPayload),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.referenceId).toBe("CYN-EXIST1");
    expect(data.message).toContain("idempotent replay");
  });

  it("4. Stale form version handling: returns 409 and latest questions when submitted version is outdated", async () => {
    (checkRateLimit as any).mockResolvedValue({ success: true, count: 1, remaining: 5 });

    // No duplicate idempotency
    (Inquiry.findOne as any).mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    });

    // Published form is version 2 with _id "published_v2"
    (FormVersion.findOne as any).mockResolvedValue({
      _id: "published_v2",
      versionNumber: 2,
      questions: [
        {
          id: "q_new",
          key: "new_field",
          label: "Updated Question",
          step: 2,
          type: "text",
          required: false,
          active: true,
          order: 1,
          serviceSlugs: ["all"],
        },
      ],
    });

    // Client submitted an older form version "published_v1"
    const payload = {
      ...baseValidPayload,
      formVersionId: "published_v1",
    };

    const req = new NextRequest("http://localhost:3000/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.staleForm).toBe(true);
    expect(data.latestForm.formVersionId).toBe("published_v2");
    expect(data.latestForm.questions).toHaveLength(1);
    expect(data.latestForm.questions[0].label).toBe("Updated Question");
  });
});
