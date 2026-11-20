import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Inquiry } from "@/lib/models/Inquiry";
import { getSession, validateOrigin } from "@/lib/auth/session";
import { hasNoSqlInjectionKeys } from "@/lib/security/sanitize";

export const runtime = "nodejs";

const VALID_STATUSES = [
  "NEW",
  "CONTACTED",
  "IN_DISCUSSION",
  "PROPOSAL_SENT",
  "CONVERTED",
  "REJECTED",
];

/**
 * PATCH /api/admin/inquiries/[id]/status
 * Updates inquiry status atomically with status history and activity log.
 * Enforces optimistic concurrency via expectedUpdatedAt (Phase 3 addition).
 * Caps history arrays at 200 entries (Change #7).
 */
export async function PATCH(
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

    const { status, expectedUpdatedAt } = rawBody;
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid target status provided." }, { status: 400 });
    }

    const { id } = await params;
    await connectToDatabase();

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) {
      return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
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

    const oldStatus = inquiry.status;
    if (oldStatus === status) {
      return NextResponse.json({ success: true, inquiry });
    }

    const historyEntry = {
      from: oldStatus,
      to: status,
      userId: session.userId,
      at: new Date(),
    };

    const activityEntry = {
      type: "STATUS_CHANGED",
      detail: `Status changed from ${oldStatus} to ${status} by ${session.name}`,
      userId: session.userId,
      at: new Date(),
    };

    // Atomic update with status, history, activity, and array capping at 200 items (Change #7)
    const updated = await Inquiry.findByIdAndUpdate(
      id,
      {
        $set: { status },
        $push: {
          statusHistory: { $each: [historyEntry], $slice: -200 },
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
    console.error("Status Update Error:", error);
    return NextResponse.json({ error: "Failed to update inquiry status" }, { status: 500 });
  }
}
