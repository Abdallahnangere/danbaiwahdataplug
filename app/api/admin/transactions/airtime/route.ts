import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "";
    const network = searchParams.get("network") || "";
    const search = searchParams.get("search") || "";

    const offset = (page - 1) * limit;
    let whereClause = "category = 'AIRTIME'";
    const params: any[] = [];

    if (status) {
      whereClause += ` AND status = $${params.length + 1}`;
      params.push(status.toUpperCase());
    }

    if (network && !isNaN(parseInt(network))) {
      whereClause += ` AND network_id = $${params.length + 1}`;
      params.push(parseInt(network));
    }

    if (search) {
      whereClause += ` AND (target LIKE $${params.length + 1} OR reference LIKE $${params.length + 2} OR provider_ref LIKE $${params.length + 3})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const offsetParam = `$${params.length + 1}`;
    const limitParam = `$${params.length + 2}`;
    params.push(offset, limit);

    const transactions = await query(
      `SELECT 
        id, user_id, reference as ident, network_id as network, network_name, target as mobile_number, amount, 
        status, provider_response as api_response, provider_response as description, balance_before, balance_after, created_at, updated_at
       FROM public.transactions
       WHERE ${whereClause}
       ORDER BY created_at DESC
       OFFSET ${offsetParam} LIMIT ${limitParam}`,
      params
    );

    const countParams = params.slice(0, -2);
    const countResult = await query(
      `SELECT COUNT(*) as total FROM public.transactions WHERE ${whereClause}`,
      countParams
    );

    const total = countResult[0]?.total || 0;

    return NextResponse.json({
      success: true,
      data: transactions,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    }, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } });
  } catch (error: any) {
    console.error("[ADMIN_AIRTIME_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch transactions" },
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}
