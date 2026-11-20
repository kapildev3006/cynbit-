import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { FormVersion } from "@/lib/models/FormVersion";
import { Inquiry } from "@/lib/models/Inquiry";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { hasNoSqlInjectionKeys } from "@/lib/security/sanitize";
import { PublicSubmissionSchema, validateDynamicAnswers } from "@/lib/validation/inquiry";
import { generateReferenceId } from "@/lib/utils/reference-id";
import { extractPhoneDigits, normalizeToE164 } from "@/lib/utils/phone";

export const runtime = "nodejs";

/**
 * POST /api/inquiries
 * Public lead intake submission handler.
 * Implements: honeypot spam trap, salted-IP rate limiter, idempotency handling,
 * NoSQL injection rejection, dynamic validation against published questions,
 * and immutable question/answer snapshot saving.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    // 1. NoSQL Injection protection: reject operator keys
    if (hasNoSqlInjectionKeys(rawBody)) {
      return NextResponse.json(
        { error: "Invalid request payload format detected." },
        { status: 400 }
      );
    }

    // 2. Honeypot spam trap: return silent fake success for automated bots
    if (rawBody.honeypot && String(rawBody.honeypot).trim() !== "") {
      return NextResponse.json(
        {
          success: true,
          referenceId: "CYN-BOTOK1",
          message: "Inquiry received successfully.",
        },
        { status: 200 }
      );
    }

    // 3. Salted IP hash rate limiter
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateResult = await checkRateLimit(clientIp, "inquiry_submit", 6, 900);
    if (!rateResult.success) {
      return NextResponse.json(
        {
          error: "Too many submissions received from this network. Please wait a few minutes or email us directly at contact@cynbit.in.",
        },
        { status: 429 }
      );
    }

    // 4. Validate fixed core fields using Zod
    const parsed = PublicSubmissionSchema.safeParse(rawBody);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        fieldErrors[err.path.join(".")] = err.message;
      });
      return NextResponse.json(
        { error: "Validation failed", details: fieldErrors },
        { status: 400 }
      );
    }

    const { serviceSlug, projectType, idempotencyKey, contact, consent, answers: rawAnswers } = parsed.data;

    await connectToDatabase();

    // 5. Idempotency Check: if client repeats submission with same key, return existing reference ID (Change #8)
    const existingInquiry = await Inquiry.findOne({ idempotencyKey }, { referenceId: 1 }).lean();
    if (existingInquiry) {
      return NextResponse.json(
        {
          success: true,
          referenceId: existingInquiry.referenceId,
          message: "Existing inquiry retrieved (idempotent replay).",
        },
        { status: 200 }
      );
    }

    // 6. Fetch currently published form version
    const publishedForm = await FormVersion.findOne({ status: "PUBLISHED" });
    if (!publishedForm) {
      return NextResponse.json(
        {
          error: "Form configuration unavailable. Please contact Cynbit directly at contact@cynbit.in.",
        },
        { status: 503 }
      );
    }

    // 6b. Check for stale form version (Requirement #2)
    if (parsed.data.formVersionId && parsed.data.formVersionId !== String(publishedForm._id)) {
      const sanitizedQuestions = (publishedForm.questions || [])
        .filter((q) => q.active)
        .sort((a, b) => a.order - b.order)
        .map((q) => ({
          id: q.id,
          key: q.key,
          label: q.label,
          step: q.step,
          helpText: q.helpText || "",
          placeholder: q.placeholder || "",
          type: q.type,
          required: q.required,
          order: q.order,
          serviceSlugs: q.serviceSlugs,
          options: q.options || [],
          validation: q.validation || {},
          visibleIf: q.visibleIf || undefined,
        }));

      return NextResponse.json(
        {
          error: "The inquiry form has been updated to a newer version. Questions have been refreshed.",
          staleForm: true,
          latestForm: {
            formVersionId: String(publishedForm._id),
            versionNumber: publishedForm.versionNumber,
            questions: sanitizedQuestions,
          },
        },
        { status: 409 }
      );
    }

    // 7. Dynamic validation against active questions (evaluates conditional visibility, rejects hidden field answers)
    const dynamicResult = validateDynamicAnswers(
      publishedForm.questions,
      serviceSlug,
      rawAnswers
    );

    if (!dynamicResult.valid) {
      return NextResponse.json(
        {
          error: "Requirements validation failed",
          details: dynamicResult.errors,
        },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizeToE164(contact.whatsapp);

    // 8. Generate unique reference ID with collision retry (Change #8)
    let referenceId = generateReferenceId();
    let attempts = 0;
    while (attempts < 5) {
      const collision = await Inquiry.findOne({ referenceId }, { _id: 1 }).lean();
      if (!collision) break;
      referenceId = generateReferenceId();
      attempts++;
    }

    // 9. Create immutable Inquiry document
    const inquiryDoc = new Inquiry({
      referenceId,
      idempotencyKey,
      formVersionId: publishedForm._id,
      serviceSlug,
      projectType: projectType || undefined,
      contact: {
        name: contact.name,
        company: contact.company || undefined,
        email: contact.email.toLowerCase(),
        whatsapp: normalizedPhone,
        country: contact.country,
        preferredContact: contact.preferredContact,
        preferredTime: contact.preferredTime || undefined,
        message: contact.message || undefined,
      },
      consent: {
        accepted: true,
        at: new Date(),
      },
      answers: dynamicResult.sanitizedSnapshots, // Embedded immutable snapshot
      status: "NEW",
      statusHistory: [
        {
          from: "NONE",
          to: "NEW",
          userId: publishedForm.publishedBy || undefined,
          at: new Date(),
        },
      ],
      notes: [],
      communications: [],
      activity: [
        {
          type: "CREATED",
          detail: `Inquiry submitted via public portal for service: ${serviceSlug}`,
          at: new Date(),
        },
      ],
      searchFields: {
        nameLower: contact.name.toLowerCase(),
        companyLower: (contact.company || "").toLowerCase(),
        emailLower: contact.email.toLowerCase(),
        whatsappDigits: extractPhoneDigits(normalizedPhone),
        referenceIdLower: referenceId.toLowerCase(),
      },
      isDemo: false,
    });

    try {
      await inquiryDoc.save();
    } catch (saveError: any) {
      // Catch duplicate idempotencyKey race condition (Change #8)
      if (saveError?.code === 11000 && saveError?.keyPattern?.idempotencyKey) {
        const found = await Inquiry.findOne({ idempotencyKey }, { referenceId: 1 }).lean();
        if (found) {
          return NextResponse.json({
            success: true,
            referenceId: found.referenceId,
            message: "Existing inquiry retrieved.",
          });
        }
      }
      throw saveError;
    }

    return NextResponse.json(
      {
        success: true,
        referenceId: inquiryDoc.referenceId,
        message: "Inquiry submitted successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submission API Error:", error);
    return NextResponse.json(
      {
        error: "Database or service temporarily unavailable. Please reach us directly at contact@cynbit.in or +91 98290 00000.",
      },
      { status: 500 }
    );
  }
}
