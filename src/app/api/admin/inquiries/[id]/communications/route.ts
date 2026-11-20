import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Inquiry } from "@/lib/models/Inquiry";
import { getSession, validateOrigin } from "@/lib/auth/session";
import { hasNoSqlInjectionKeys } from "@/lib/security/sanitize";

export const runtime = "nodejs";

const VALID_OUTCOMES = ["NO_REPLY", "REPLIED", "WRONG_NUMBER", "CALL_BOOKED", "OTHER"];

/**
 * POST /api/admin/inquiries/[id]/communications
 * Records honest follow-up communication action and manual outcome.
 * Never claims message was delivered.
 * Optionally advances status from NEW to CONTACTED atomically.
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

    const { type, outcome, note, message, advanceStatusToContacted } = rawBody;

    if (!type || !["EMAIL", "WHATSAPP"].includes(type)) {
      return NextResponse.json({ error: "Invalid communication channel." }, { status: 400 });
    }

    if (!outcome || !VALID_OUTCOMES.includes(outcome)) {
      return NextResponse.json({ error: "Invalid communication outcome." }, { status: 400 });
    }

    const { id } = await params;
    await connectToDatabase();

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    const commEntry = {
      type,
      outcome,
      note: note || undefined,
      message: message || `Outreach via ${type}`,
      userId: session.userId,
      at: new Date(),
    };

    const activityEntry = {
      type: "COMMUNICATED",
      detail: `${type} outreach initiated by ${session.name} (Outcome: ${outcome})`,
      userId: session.userId,
      at: new Date(),
    };

    const updateDoc: Record<string, any> = {
      $push: {
        communications: { $each: [commEntry], $slice: -200 },
        activity: { $each: [activityEntry], $slice: -200 },
      },
    };

    // If configured to advance status from NEW to CONTACTED
    if (advanceStatusToContacted && inquiry.status === "NEW") {
      updateDoc.$set = { status: "CONTACTED" };
      const statusHistoryEntry = {
        from: "NEW",
        to: "CONTACTED",
        userId: session.userId,
        at: new Date(),
      };
      updateDoc.$push.statusHistory = { $each: [statusHistoryEntry], $slice: -200 };
    }

    const updated = await Inquiry.findByIdAndUpdate(id, updateDoc, { new: true })
      .populate("assignedTo", "name email role")
      .populate("statusHistory.userId", "name email role")
      .populate("notes.userId", "name email role")
      .populate("communications.userId", "name email role")
      .populate("activity.userId", "name email role");

    return NextResponse.json({ success: true, inquiry: updated });
  } catch (error) {
    console.error("Communication Log Error:", error);
    return NextResponse.json({ error: "Failed to record communication log" }, { status: 500 });
  }
}
