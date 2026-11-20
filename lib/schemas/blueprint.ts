import { z } from "zod";
import {
  CYNBIT_ALLOWED_TECH_STACK,
  TRACK_IDS,
  TIMELINE_OPTIONS,
  BUDGET_OPTIONS,
  TrackId,
} from "../blueprint-constants";

// Shared Zod schema for the Blueprint Wizard Form Input
export const wizardFormSchema = z.object({
  track: z.enum(TRACK_IDS, {
    errorMap: () => ({ message: "Please select a valid service track." }),
  }),
  features: z
    .array(z.string().min(2))
    .min(1, "Please select at least one goal or feature chip."),
  timeline: z.enum(TIMELINE_OPTIONS, {
    errorMap: () => ({ message: "Please select an estimated timeline." }),
  }),
  budget: z.enum(BUDGET_OPTIONS, {
    errorMap: () => ({ message: "Please select a budget range." }),
  }),
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name must not exceed 80 characters."),
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address.")
    .max(120, "Email must not exceed 120 characters."),
  company: z
    .string()
    .trim()
    .max(100, "Company name must not exceed 100 characters.")
    .optional()
    .or(z.literal("")),
  note: z
    .string()
    .trim()
    .max(1000, "Note must not exceed 1,000 characters.")
    .optional()
    .or(z.literal("")),
  // Honeypot field: real users leave this blank
  _hp_company_url: z.string().optional().default(""),
});

export type WizardFormData = z.infer<typeof wizardFormSchema>;

// Phase item inside the structured blueprint
export const blueprintPhaseSchema = z.object({
  phaseName: z.string().min(1),
  duration: z.string().min(1),
  deliverables: z.array(z.string().min(1)).min(1),
});

export type BlueprintPhase = z.infer<typeof blueprintPhaseSchema>;

// Strict Blueprint Output schema (verified against Cynbit tech stack)
export const blueprintOutputSchema = z.object({
  projectSummary: z.string().min(20, "Summary must be descriptive."),
  suggestedStack: z
    .array(z.enum(CYNBIT_ALLOWED_TECH_STACK))
    .min(2, "At least 2 technologies from Cynbit's stack must be suggested."),
  phases: z
    .array(blueprintPhaseSchema)
    .min(2, "At least 2 delivery phases required.")
    .max(5, "At most 5 phases."),
  risksAndQuestions: z
    .array(z.string().min(5))
    .min(2, "Include at least 2 risks or open architecture questions."),
  recommendedNextStep: z.string().min(10, "Recommended next step required."),
});

export type BlueprintOutput = z.infer<typeof blueprintOutputSchema>;

// API Response payload returned to client
export const apiBlueprintResponseSchema = z.object({
  success: z.boolean(),
  blueprint: blueprintOutputSchema,
  generatedBy: z.enum(["llm", "fallback", "honeypot-mock"]),
  leadId: z.string().optional(),
});

export type ApiBlueprintResponse = z.infer<typeof apiBlueprintResponseSchema>;
