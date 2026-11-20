import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Inquiry } from "@/lib/models/Inquiry";
import { User } from "@/lib/models/User";
import { MessageTemplate } from "@/lib/models/MessageTemplate";
import { getSession, validateOrigin } from "@/lib/auth/session";

export const runtime = "nodejs";

/**
 * GET /api/admin/inquiries/[id]
 * Retrieves single inquiry details with populated user references and templates.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const inquiry = await Inquiry.findById(id)
      .populate("assignedTo", "name email role")
      .populate("statusHistory.userId", "name email role")
      .populate("notes.userId", "name email role")
      .populate("communications.userId", "name email role")
      .populate("activity.userId", "name email role")
      .lean();

    if (!inquiry) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    const [teamMembers, templates] = await Promise.all([
      User.find({ active: true }).select("name email role").lean(),
      MessageTemplate.find({}).lean(),
    ]);

    return NextResponse.json({
      inquiry,
      teamMembers,
      templates,
    });
  } catch (error) {
    console.error("Get Inquiry Error:", error);
    return NextResponse.json({ error: "Failed to load inquiry details" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/inquiries/[id]
 * Deletes inquiry record. Restricted to ADMIN role.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Only administrators can delete inquiry records." },
        { status: 403 }
      );
    }

    if (!(await validateOrigin())) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }

    const { id } = await params;
    await connectToDatabase();

    const deleted = await Inquiry.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Inquiry permanently deleted." });
  } catch (error) {
    console.error("Delete Inquiry Error:", error);
    return NextResponse.json({ error: "Failed to delete inquiry" }, { status: 500 });
  }
}
