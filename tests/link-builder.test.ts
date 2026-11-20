import { describe, it, expect } from "vitest";

describe("Mailto and WhatsApp Link Builder", () => {
  it("builds compliant mailto link with encoded subject, reference ID, and body", () => {
    const email = "client@example.com";
    const refId = "CYN-A1B2C3";
    const subject = `Cynbit Technologies – Inquiry Follow-Up [${refId}]`;
    const body = `Hello Alex,\n\nWe received your inquiry ${refId}.\n\nBest regards,\nCynbit`;

    const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    expect(mailto).toContain("mailto:client%40example.com");
    expect(mailto).toContain("CYN-A1B2C3");
    expect(mailto).toContain(encodeURIComponent("Hello Alex,"));
  });

  it("builds wa.me link with normalized E.164 digits only and url-encoded text", () => {
    const rawWhatsapp = "+91 (98765) 43210";
    const digitsOnly = rawWhatsapp.replace(/\D/g, "");
    expect(digitsOnly).toBe("919876543210");

    const message = "Hi Alex, this is Cynbit regarding CYN-A1B2C3. Are you free for a call?";
    const waUrl = `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;

    expect(waUrl).toBe(
      "https://wa.me/919876543210?text=Hi%20Alex%2C%20this%20is%20Cynbit%20regarding%20CYN-A1B2C3.%20Are%20you%20free%20for%20a%20call%3F"
    );
  });
});
