import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Inquiry } from "@/lib/models/Inquiry";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/dashboard
 * Aggregates real inquiry counts, status distribution, and recent leads.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Aggregation query: count inquiries per status
    const statusCounts = await Inquiry.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const counts: Record<string, number> = {
      TOTAL: 0,
      NEW: 0,
      CONTACTED: 0,
      IN_DISCUSSION: 0,
      PROPOSAL_SENT: 0,
      CONVERTED: 0,
      REJECTED: 0,
    };

    let total = 0;
    for (const item of statusCounts) {
      if (item._id && counts[item._id] !== undefined) {
        counts[item._id] = item.count;
      }
      total += item.count;
    }
    counts.TOTAL = total;

    // Service category breakdown
    const serviceBreakdown = await Inquiry.aggregate([
      {
        $group: {
          _id: "$serviceSlug",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    // Recent 5 inquiries
    const recent = await Inquiry.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select("referenceId contact serviceSlug status createdAt")
      .lean();

    return NextResponse.json({
      counts,
      serviceBreakdown,
      recent,
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Failed to load dashboard metrics" }, { status: 500 });
  }
}
