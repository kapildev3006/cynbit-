import { z } from "zod";
import { IFormField } from "@/lib/models/FormVersion";

export const QuestionOptionSchema = z.object({
  label: z.string().min(1, "Option label is required").max(100),
  value: z.string().min(1, "Option value is required").max(100),
});

export const FormQuestionSchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1, "Key is required").regex(/^[a-z0-9_]+$/, "Key must be lowercase letters, numbers, and underscores"),
  label: z.string().min(2, "Label must be at least 2 characters").max(200),
  step: z.union([z.literal(2), z.literal(3)]),
  helpText: z.string().max(300).optional(),
  placeholder: z.string().max(100).optional(),
  type: z.enum(["text", "textarea", "number", "email", "url", "date", "select", "radio", "checkbox"]),
  required: z.boolean().default(false),
  active: z.boolean().default(true),
  order: z.number().int().min(0),
  serviceSlugs: z.array(z.string()).min(1, "At least one service category or 'all' is required"),
  options: z.array(QuestionOptionSchema).optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      maxLength: z.number().max(5000).optional(),
    })
    .optional(),
  visibleIf: z
    .object({
      questionId: z.string().min(1),
      equals: z.union([z.string(), z.number(), z.boolean()]),
    })
    .optional(),
});

export const SaveDraftFormSchema = z.object({
  questions: z.array(FormQuestionSchema).max(40, "Maximum 40 dynamic questions allowed"),
});

/**
 * Validates question conditional dependencies:
 * Rule 5: A question may only depend on an EARLIER question in order.
 * Strictly prevents cycles, forward references, and references to missing IDs.
 */
export function validateQuestionDependencies(questions: IFormField[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const sorted = [...questions].sort((a, b) => a.order - b.order);
  const seenIds = new Set<string>();

  for (const q of sorted) {
    if (q.visibleIf && q.visibleIf.questionId) {
      const parentId = q.visibleIf.questionId;
      if (parentId === q.id) {
        errors.push(`Question "${q.label}" cannot depend on itself.`);
      } else if (!seenIds.has(parentId)) {
        errors.push(
          `Question "${q.label}" depends on question ID "${parentId}" which is not an earlier question.`
        );
      }
    }
    seenIds.add(q.id);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
