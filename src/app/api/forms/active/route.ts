import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { FormVersion } from "@/lib/models/FormVersion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/forms/active
 * Returns only the active questions from the currently published form version.
 * Strips all internal database identifiers, metadata, and sensitive timestamps.
 */
export async function GET() {
  try {
    await connectToDatabase();

    const published = await FormVersion.findOne({ status: "PUBLISHED" }).lean();

    if (!published) {
      return NextResponse.json(
        { error: "No published form version found in database." },
        { status: 404 }
      );
    }

    // Strip internal fields and filter only active questions (Change #9)
    const sanitizedQuestions = (published.questions || [])
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

    return NextResponse.json({
      formVersionId: String(published._id),
      versionNumber: published.versionNumber,
      questions: sanitizedQuestions,
    });
  } catch (error) {
    console.error("Failed to retrieve active form questions:", error);
    return NextResponse.json(
      {
        error: "Unable to load inquiry form. Please contact Cynbit engineering at contact@cynbit.in or +91 98290 00000.",
      },
      { status: 500 }
    );
  }
}
