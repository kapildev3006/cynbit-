import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Inquiry } from "@/lib/models/Inquiry";
import { getSession, validateOrigin } from "@/lib/auth/session";
import { hasNoSqlInjectionKeys } from "@/lib/security/sanitize";

export const runtime = "nodejs";

/**
 * POST /api/admin/inquiries/[id]/notes
 * Appends an internal note atomically.
 * Enforces optimistic concurrency via expectedUpdatedAt.
 * Caps notes at 200 entries ($slice: -200).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await validateOrigin())) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }

    const rawBody = await req.json();
    if (hasNoSqlInjectionKeys(rawBody)) {
      return NextResponse.json({ error: "Invalid payload format." }, { status: 400 });
    }

    const { text, expectedUpdatedAt } = rawBody;
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Note text cannot be empty." }, { status: 400 });
    }

    const { id } = await params;
    await connectToDatabase();

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    // Optimistic Concurrency Check (Phase 3 addition)
    if (expectedUpdatedAt && inquiry.updatedAt.toISOString() !== expectedUpdatedAt) {
      return NextResponse.json(
        {
          error: "This inquiry was modified by another user. Please reload the latest changes.",
          conflict: true,
          latestUpdatedAt: inquiry.updatedAt.toISOString(),
        },
        { status: 409 }
      );
    }

    const noteEntry = {
      text: text.trim(),
      userId: session.userId,
      createdAt: new Date(),
    };

    const activityEntry = {
      type: "NOTE_ADDED",
      detail: `Internal note added by ${session.name}`,
      userId: session.userId,
      at: new Date(),
    };

    // Atomic update capping notes and activity at 200 items (Change #7)
    const updated = await Inquiry.findByIdAndUpdate(
      id,
      {
        $push: {
          notes: { $each: [noteEntry], $slice: -200 },
          activity: { $each: [activityEntry], $slice: -200 },
        },
      },
      { new: true }
    )
      .populate("assignedTo", "name email role")
      .populate("statusHistory.userId", "name email role")
      .populate("notes.userId", "name email role")
      .populate("communications.userId", "name email role")
      .populate("activity.userId", "name email role");

    return NextResponse.json({ success: true, inquiry: updated });
  } catch (error) {
    console.error("Add Note Error:", error);
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  }
}
