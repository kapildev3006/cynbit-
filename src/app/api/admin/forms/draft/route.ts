import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import { FormVersion } from "@/lib/models/FormVersion";
import { getSession, validateOrigin } from "@/lib/auth/session";
import { SaveDraftFormSchema, validateQuestionDependencies } from "@/lib/validation/form-builder";
import { hasNoSqlInjectionKeys } from "@/lib/security/sanitize";

export const runtime = "nodejs";

/**
 * GET /api/admin/forms/draft
 * Retrieves the current DRAFT form version.
 * If no draft exists, clones the active PUBLISHED version as a working draft.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Form builder requires administrator privileges." },
        { status: 403 }
      );
    }

    await connectToDatabase();

    let draft: any = await FormVersion.findOne({ status: "DRAFT" }).lean();
    const published = await FormVersion.findOne({ status: "PUBLISHED" }).lean();

    if (!draft) {
      // Clone from published or create clean initial draft
      const nextVersionNumber = published ? published.versionNumber + 1 : 1;
      const initialQuestions = published ? published.questions : [];

      const newDraftDoc = new FormVersion({
        versionNumber: nextVersionNumber,
        status: "DRAFT",
        questions: initialQuestions,
      });

      await newDraftDoc.save();
      draft = newDraftDoc.toObject();
    }

    return NextResponse.json({
      draft,
      publishedVersion: published ? published.versionNumber : null,
    });
  } catch (error) {
    console.error("Get Draft Error:", error);
    return NextResponse.json({ error: "Failed to load form draft" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/forms/draft
 * Saves question edits, additions, and reordering to the active DRAFT.
 * Strictly validates that questions only depend on earlier questions in order.
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Form builder requires administrator privileges." },
        { status: 403 }
      );
    }

    if (!(await validateOrigin())) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }

    const rawBody = await req.json();
    if (hasNoSqlInjectionKeys(rawBody)) {
      return NextResponse.json({ error: "Invalid payload format." }, { status: 400 });
    }

    const parsed = SaveDraftFormSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Ensure stable server-generated IDs for any new questions
    const sanitizedQuestions = parsed.data.questions.map((q, idx) => ({
      ...q,
      id: q.id || `q_${crypto.randomBytes(4).toString("hex")}`,
      order: idx + 1,
    }));

    // Dependency check: Rule 5 (question may only depend on an earlier question)
    const depCheck = validateQuestionDependencies(sanitizedQuestions as any);
    if (!depCheck.valid) {
      return NextResponse.json(
        { error: "Dependency rule violation", details: depCheck.errors },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updatedDraft = await FormVersion.findOneAndUpdate(
      { status: "DRAFT" },
      { $set: { questions: sanitizedQuestions } },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, draft: updatedDraft });
  } catch (error) {
    console.error("Save Draft Error:", error);
    return NextResponse.json({ error: "Failed to save form draft" }, { status: 500 });
  }
}
