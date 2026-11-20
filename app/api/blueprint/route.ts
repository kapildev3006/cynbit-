import { NextRequest, NextResponse } from "next/server";
import { wizardFormSchema, ApiBlueprintResponse } from "@/lib/schemas/blueprint";
import { checkRateLimit } from "@/lib/rate-limiter";
import { generateBlueprintWithFallback } from "@/lib/llm";
import { generateFallbackBlueprint } from "@/lib/fallback-generator";
import { saveLead } from "@/lib/lead-storage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON request payload." },
        { status: 400 }
      );
    }

    // 1. Validate incoming form data with Zod
    const validation = wizardFormSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed. Please verify all required fields.",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const formData = validation.data;

    // 2. Honeypot check: If the hidden honeypot field has a value, silently return mock success
    if (formData._hp_company_url && formData._hp_company_url.trim().length > 0) {
      // Spambot trapped: return realistic blueprint, do not record rate limit, do not save lead
      const mockBlueprint = generateFallbackBlueprint(formData);
      const mockResponse: ApiBlueprintResponse = {
        success: true,
        blueprint: mockBlueprint,
        generatedBy: "honeypot-mock",
        leadId: "hp-silently-dropped",
      };
      return NextResponse.json(mockResponse, { status: 200 });
    }

    // 3. Rate limiting: Check salted IP hash against MongoDB TTL collection
    const rateLimitResult = await checkRateLimit(req);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error:
            "You have requested several blueprints recently. Please wait a minute before generating another.",
          retryAfterSeconds: rateLimitResult.retryAfterSeconds || 60,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitResult.retryAfterSeconds || 60),
          },
        }
      );
    }

    // 4. Generate structured blueprint (Gemini LLM or deterministic fallback)
    const { blueprint, generatedBy } = await generateBlueprintWithFallback(formData);

    // 5. Save lead and embedded blueprint (MongoDB Atlas or offline logging)
    const leadId = await saveLead({
      formData,
      blueprint,
      generatedBy,
    });

    const responsePayload: ApiBlueprintResponse = {
      success: true,
      blueprint,
      generatedBy,
      leadId,
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error) {
    console.error("Unhandled error in POST /api/blueprint:", error);
    return NextResponse.json(
      {
        error:
          "An unexpected server error occurred while processing your blueprint. Please try again.",
      },
      { status: 500 }
    );
  }
}
