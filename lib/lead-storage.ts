import fs from "fs";
import path from "path";
import { connectToDatabase } from "./db";
import { Lead } from "./models/Lead";
import { WizardFormData, BlueprintOutput } from "./schemas/blueprint";

export interface SaveLeadParams {
  formData: WizardFormData;
  blueprint: BlueprintOutput;
  generatedBy: "llm" | "fallback" | "honeypot-mock";
}

/**
 * Persists lead and embedded blueprint into MongoDB Atlas.
 * If MongoDB is offline or MONGODB_URI is absent:
 *  - On Vercel (read-only filesystem): logs to serverless console without personal data.
 *  - In local dev: appends to local-leads.log.
 * Returns a lead ID or fallback ID so user experience is never blocked.
 */
export async function saveLead({
  formData,
  blueprint,
  generatedBy,
}: SaveLeadParams): Promise<string> {
  // Honeypot: never persist spam
  if (formData._hp_company_url && formData._hp_company_url.trim().length > 0) {
    return `hp-mock-${Date.now()}`;
  }

  try {
    const db = await connectToDatabase();
    if (db) {
      const doc = await Lead.create({
        track: formData.track,
        features: formData.features,
        timeline: formData.timeline,
        budget: formData.budget,
        name: formData.name,
        email: formData.email,
        company: formData.company || "",
        note: formData.note || "",
        blueprint,
        generatedBy,
      });

      return doc._id.toString();
    }
  } catch (err) {
    console.warn("MongoDB connection/write failed, falling back to offline logging:", err);
  }

  // Graceful Offline Persistence
  const fallbackId = `offline-${Date.now()}`;
  const isVercel = Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production";

  if (isVercel) {
    // Vercel serverless: read-only filesystem, log sanitized metadata to console (no PII)
    console.info("[LEAD_OFFLINE_SAVED_SERVERLESS]", {
      id: fallbackId,
      track: formData.track,
      featuresCount: formData.features.length,
      timeline: formData.timeline,
      budget: formData.budget,
      generatedBy,
      timestamp: new Date().toISOString(),
    });
  } else {
    // Local dev: write to local-leads.log
    try {
      const logPath = path.resolve(process.cwd(), "local-leads.log");
      const record = {
        id: fallbackId,
        createdAt: new Date().toISOString(),
        lead: {
          name: formData.name,
          email: formData.email,
          company: formData.company,
          track: formData.track,
          features: formData.features,
          timeline: formData.timeline,
          budget: formData.budget,
          note: formData.note,
        },
        blueprintSummary: blueprint.projectSummary,
        generatedBy,
      };

      fs.appendFileSync(logPath, JSON.stringify(record) + "\n", "utf8");
    } catch (fsErr) {
      console.warn("Local file logging failed:", fsErr);
    }
  }

  return fallbackId;
}
