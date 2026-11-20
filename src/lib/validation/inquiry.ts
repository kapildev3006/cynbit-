import { z } from "zod";
import { IFormField } from "@/lib/models/FormVersion";
import { isValidE164, normalizeToE164 } from "@/lib/utils/phone";

export interface DynamicValidationContext {
  serviceSlug: string;
  answers: Record<string, any>;
}

/**
 * Checks whether a dynamic question is conditionally visible given existing answers.
 */
export function isQuestionVisible(
  question: IFormField,
  serviceSlug: string,
  currentAnswers: Record<string, any>
): boolean {
  // Check service category / slug relevance
  if (
    question.serviceSlugs &&
    question.serviceSlugs.length > 0 &&
    !question.serviceSlugs.includes("all") &&
    !question.serviceSlugs.includes(serviceSlug)
  ) {
    return false;
  }

  // Check conditional rule (must equal parent question answer)
  if (question.visibleIf && question.visibleIf.questionId) {
    const parentAnswer = currentAnswers[question.visibleIf.questionId];
    if (parentAnswer === undefined || parentAnswer === null) {
      return false;
    }
    // Handle array answer (e.g. checkbox) or scalar
    if (Array.isArray(parentAnswer)) {
      return parentAnswer.includes(question.visibleIf.equals);
    }
    return String(parentAnswer) === String(question.visibleIf.equals);
  }

  return true;
}

/**
 * Validates dynamic answers against active published questions.
 * Rejects unknown fields, answers to hidden questions, and invalid choice selections.
 */
export function validateDynamicAnswers(
  questions: IFormField[],
  serviceSlug: string,
  rawAnswers: Record<string, any>
): {
  valid: boolean;
  errors: Record<string, string>;
  sanitizedSnapshots: Array<{
    questionId: string;
    key: string;
    label: string;
    type: string;
    options?: { label: string; value: string }[];
    value: any;
  }>;
} {
  const errors: Record<string, string> = {};
  const questionMap = new Map<string, IFormField>();
  questions.forEach((q) => questionMap.set(q.id, q));

  // 1. Detect unknown fields submitted
  for (const qId of Object.keys(rawAnswers)) {
    if (!questionMap.has(qId)) {
      errors[qId] = `Unrecognized form field: ${qId}`;
    }
  }

  const sanitizedSnapshots: Array<{
    questionId: string;
    key: string;
    label: string;
    type: string;
    options?: { label: string; value: string }[];
    value: any;
  }> = [];

  // 2. Validate active questions in order
  for (const question of questions) {
    if (!question.active) continue;

    const visible = isQuestionVisible(question, serviceSlug, rawAnswers);
    const value = rawAnswers[question.id];

    if (!visible) {
      // Reject answer to hidden or inapplicable field
      if (value !== undefined && value !== null && value !== "") {
        errors[question.id] = `Field '${question.label}' is not applicable for this selection.`;
      }
      continue;
    }

    // Required check
    if (question.required) {
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
        errors[question.id] = `${question.label} is required.`;
        continue;
      }
    }

    if (value === undefined || value === null || value === "") {
      continue; // Optional field empty is acceptable
    }

    // Type and option validation
    if (question.type === "select" || question.type === "radio") {
      const allowedValues = question.options?.map((o) => o.value) || [];
      if (!allowedValues.includes(String(value))) {
        errors[question.id] = `Invalid selection for ${question.label}.`;
      }
    } else if (question.type === "checkbox") {
      const allowedValues = question.options?.map((o) => o.value) || [];
      const vals = Array.isArray(value) ? value : [value];
      const invalid = vals.some((v) => !allowedValues.includes(String(v)));
      if (invalid) {
        errors[question.id] = `Invalid selection option for ${question.label}.`;
      }
    } else if (question.type === "number") {
      const num = Number(value);
      if (isNaN(num)) {
        errors[question.id] = `${question.label} must be a valid number.`;
      } else {
        if (question.validation?.min !== undefined && num < question.validation.min) {
          errors[question.id] = `${question.label} must be at least ${question.validation.min}.`;
        }
        if (question.validation?.max !== undefined && num > question.validation.max) {
          errors[question.id] = `${question.label} must be at most ${question.validation.max}.`;
        }
      }
    } else if (question.type === "url") {
      try {
        new URL(String(value));
      } catch {
        errors[question.id] = `${question.label} must be a valid URL (including https://).`;
      }
    } else if (question.type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(value))) {
        errors[question.id] = `${question.label} must be a valid email address.`;
      }
    }

    if (question.validation?.maxLength && String(value).length > question.validation.maxLength) {
      errors[question.id] = `${question.label} cannot exceed ${question.validation.maxLength} characters.`;
    }

    // Add to sanitized snapshot
    sanitizedSnapshots.push({
      questionId: question.id,
      key: question.key,
      label: question.label,
      type: question.type,
      options: question.options,
      value: value,
    });
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    sanitizedSnapshots,
  };
}

/**
 * Fixed Contact details schema for Step 4.
 */
export const ContactDetailsSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters").max(100),
  company: z.string().max(100).optional().default(""),
  email: z.string().email("Please provide a valid business email address").toLowerCase(),
  whatsapp: z
    .string()
    .transform((val) => normalizeToE164(val))
    .refine((val) => isValidE164(val), {
      message: "Please provide a valid phone/WhatsApp number (e.g. +91 9876543210)",
    }),
  country: z.string().default("IN"),
  preferredContact: z.enum(["WHATSAPP", "EMAIL", "PHONE"]).default("WHATSAPP"),
  preferredTime: z.string().max(100).optional().default(""),
  message: z.string().max(2000).optional().default(""),
});

/**
 * Complete submission schema wrapper.
 */
export const PublicSubmissionSchema = z.object({
  formVersionId: z.string().optional(),
  serviceSlug: z.string().min(1, "Service selection is required"),
  projectType: z.string().optional(),
  idempotencyKey: z.string().uuid("Invalid idempotency key format"),
  honeypot: z.string().max(0, "Bot detected").optional().default(""), // Must be empty
  contact: ContactDetailsSchema,
  consent: z.object({
    accepted: z.literal(true, {
      errorMap: () => ({ message: "You must accept the privacy policy to continue" }),
    }),
  }),
  answers: z.record(z.any()).default({}),
});
