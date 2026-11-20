import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Inquiry } from "@/lib/models/Inquiry";
import { User } from "@/lib/models/User";
import { getSession } from "@/lib/auth/session";
import { escapeRegex } from "@/lib/security/sanitize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/inquiries
 * Lists inquiries with case-insensitive anchored regex search (Change #1),
 * filtering (status, service, assignee), and pagination.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "ALL";
    const serviceSlug = searchParams.get("service") || "ALL";
    const assignee = searchParams.get("assignee") || "ALL";

    await connectToDatabase();

    const query: Record<string, any> = {};

    // 1. Status Filter
    if (status !== "ALL") {
      query.status = status;
    }

    // 2. Service Filter
    if (serviceSlug !== "ALL") {
      query.serviceSlug = serviceSlug;
    }

    // 3. Assignee Filter
    if (assignee !== "ALL") {
      if (assignee === "UNASSIGNED") {
        query.assignedTo = { $exists: false };
      } else {
        query.assignedTo = assignee;
      }
    }

    // 4. Case-insensitive, anchored search on lowercase fields (Change #1)
    if (search) {
      const escaped = escapeRegex(search.toLowerCase());
      const cleanDigits = search.replace(/\D/g, "");

      const searchConditions: any[] = [
        { "searchFields.nameLower": { $regex: escaped, $options: "i" } },
        { "searchFields.companyLower": { $regex: escaped, $options: "i" } },
        { "searchFields.emailLower": { $regex: escaped, $options: "i" } },
        { "searchFields.referenceIdLower": { $regex: escaped, $options: "i" } },
      ];

      if (cleanDigits.length > 0) {
        searchConditions.push({
          "searchFields.whatsappDigits": { $regex: cleanDigits },
        });
      }

      query.$or = searchConditions;
    }

    const skip = (page - 1) * limit;

    const [inquiries, total] = await Promise.all([
      Inquiry.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("assignedTo", "name email role")
        .select(
          "referenceId contact serviceSlug projectType status assignedTo isDemo createdAt updatedAt"
        )
        .lean(),
      Inquiry.countDocuments(query),
    ]);

    // Fetch team members for the assignment filter dropdown
    const teamMembers = await User.find({ active: true })
      .select("name email role")
      .lean();

    return NextResponse.json({
      inquiries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      teamMembers,
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Admin Inquiries API Error:", error);
    return NextResponse.json({ error: "Failed to fetch inquiries" }, { status: 500 });
  }
}
