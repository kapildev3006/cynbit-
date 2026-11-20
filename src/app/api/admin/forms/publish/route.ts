import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { FormVersion } from "@/lib/models/FormVersion";
import { getSession, validateOrigin } from "@/lib/auth/session";
import { validateQuestionDependencies } from "@/lib/validation/form-builder";

export const runtime = "nodejs";

/**
 * POST /api/admin/forms/publish
 * Atomically promotes the working DRAFT into the active PUBLISHED form version.
 * Supersedes the prior published version safely.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Only administrators can publish form versions." },
        { status: 403 }
      );
    }

    if (!(await validateOrigin())) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }

    await connectToDatabase();

    const draft = await FormVersion.findOne({ status: "DRAFT" });
    if (!draft || !draft.questions || draft.questions.length === 0) {
      return NextResponse.json(
        { error: "Cannot publish: no questions exist in the working draft." },
        { status: 400 }
      );
    }

    // Verify dependencies before publishing
    const depCheck = validateQuestionDependencies(draft.questions);
    if (!depCheck.valid) {
      return NextResponse.json(
        { error: "Publish rejected: invalid question dependencies.", details: depCheck.errors },
        { status: 400 }
      );
    }

    const currentPublished = await FormVersion.findOne({ status: "PUBLISHED" });
    const nextVersionNumber = currentPublished ? currentPublished.versionNumber + 1 : 1;

    // Archive current published version
    if (currentPublished) {
      currentPublished.status = "ARCHIVED";
      await currentPublished.save();
    }

    // Promote draft to published
    draft.versionNumber = nextVersionNumber;
    draft.status = "PUBLISHED";
    draft.publishedAt = new Date();
    draft.publishedBy = session.userId as any;
    await draft.save();

    return NextResponse.json({
      success: true,
      message: `Form version ${nextVersionNumber} published successfully.`,
      publishedVersion: draft,
    });
  } catch (error) {
    console.error("Publish Form Error:", error);
    return NextResponse.json({ error: "Failed to publish form version" }, { status: 500 });
  }
}
