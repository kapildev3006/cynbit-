import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Inquiry } from "@/lib/models/Inquiry";
import { User } from "@/lib/models/User";
import { getSession, validateOrigin } from "@/lib/auth/session";
import { hasNoSqlInjectionKeys } from "@/lib/security/sanitize";

export const runtime = "nodejs";

/**
 * PATCH /api/admin/inquiries/[id]/assign
 * Assigns or unassigns team member to inquiry with activity entry.
 * Enforces optimistic concurrency via expectedUpdatedAt.
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

    const { assignedTo, expectedUpdatedAt } = rawBody;
    const { id } = await params;
    await connectToDatabase();

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    // Optimistic Concurrency Check
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

    let assigneeName = "Unassigned";
    let targetUserId = null;

    if (assignedTo && assignedTo !== "UNASSIGNED") {
      const userDoc = await User.findById(assignedTo);
      if (!userDoc) {
        return NextResponse.json({ error: "Selected team member does not exist." }, { status: 400 });
      }
      assigneeName = userDoc.name;
      targetUserId = userDoc._id;
    }

    const activityEntry = {
      type: "ASSIGNED",
      detail: `Assigned to ${assigneeName} by ${session.name}`,
      userId: session.userId,
      at: new Date(),
    };

    const updateDoc: Record<string, any> = {
      $push: { activity: { $each: [activityEntry], $slice: -200 } },
    };

    if (targetUserId) {
      updateDoc.$set = { assignedTo: targetUserId };
    } else {
      updateDoc.$unset = { assignedTo: 1 };
    }

    const updated = await Inquiry.findByIdAndUpdate(id, updateDoc, { new: true })
      .populate("assignedTo", "name email role")
      .populate("statusHistory.userId", "name email role")
      .populate("notes.userId", "name email role")
      .populate("communications.userId", "name email role")
      .populate("activity.userId", "name email role");

    return NextResponse.json({ success: true, inquiry: updated });
  } catch (error) {
    console.error("Assignment Error:", error);
    return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 });
  }
}
