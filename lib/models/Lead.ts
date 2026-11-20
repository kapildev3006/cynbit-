import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBlueprintPhase {
  phaseName: string;
  duration: string;
  deliverables: string[];
}

export interface IBlueprintSubdocument {
  projectSummary: string;
  suggestedStack: string[];
  phases: IBlueprintPhase[];
  risksAndQuestions: string[];
  recommendedNextStep: string;
}

export interface ILead extends Document {
  track: string;
  features: string[];
  timeline: string;
  budget: string;
  name: string;
  email: string;
  company?: string;
  note?: string;
  blueprint: IBlueprintSubdocument;
  generatedBy: "llm" | "fallback" | "honeypot-mock";
  createdAt: Date;
  updatedAt: Date;
}

const BlueprintPhaseSchema = new Schema<IBlueprintPhase>(
  {
    phaseName: { type: String, required: true },
    duration: { type: String, required: true },
    deliverables: { type: [String], required: true },
  },
  { _id: false }
);

const BlueprintSubdocumentSchema = new Schema<IBlueprintSubdocument>(
  {
    projectSummary: { type: String, required: true },
    suggestedStack: { type: [String], required: true },
    phases: { type: [BlueprintPhaseSchema], required: true },
    risksAndQuestions: { type: [String], required: true },
    recommendedNextStep: { type: String, required: true },
  },
  { _id: false }
);

const LeadSchema = new Schema<ILead>(
  {
    track: { type: String, required: true, index: true },
    features: { type: [String], required: true },
    timeline: { type: String, required: true },
    budget: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, index: true },
    company: { type: String, default: "" },
    note: { type: String, default: "" },
    blueprint: { type: BlueprintSubdocumentSchema, required: true },
    generatedBy: {
      type: String,
      enum: ["llm", "fallback", "honeypot-mock"],
      default: "fallback",
    },
  },
  {
    collection: "leads",
    timestamps: true,
  }
);

export const Lead: Model<ILead> =
  mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);
