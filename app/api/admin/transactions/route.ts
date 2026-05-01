import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const utf8Headers = { "Content-Type": "application/json; charset=utf-8" };

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403, headers: utf8Headers });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(10, Number(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;
    const status = (searchParams.get("status") || "").trim().toUpperCase();
    const category = (searchParams.get("category") || "").trim().toUpperCase();
    const search = (searchParams.get("search") || "").trim();

    const where: string[] = ["1=1"];
    const params: any[] = [];

    if (status) {
      params.push(status);
      where.push(`t.status = $${params.length}`);
    }
    if (category) {
      params.push(category);
      where.push(`t.category = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      where.push(`(t.reference ILIKE $${params.length} OR t.target ILIKE $${params.length} OR u.phone ILIKE $${params.length} OR u.name ILIKE $${params.length})`);
    }

    const whereSql = where.join(" AND ");

    params.push(offset);
    params.push(limit);
    const rows = await query<any>(
      `SELECT t.id, t.user_id, t.category, t.target, t.network_name, t.amount, t.status, t.reference, t.created_at,
              COALESCE(dp.size_label, dp.name, t.provider, t.category) AS plan_name,
              u.name AS user_name, u.phone AS user_phone
       FROM public.transactions t
       LEFT JOIN public.data_plans dp ON dp.id = t.plan_id
       LEFT JOIN public."User" u ON u.id = t.user_id
       WHERE ${whereSql}
       ORDER BY t.created_at DESC
       OFFSET $${params.length - 1}
       LIMIT $${params.length}`,
      params
    );

    const countParams = params.slice(0, params.length - 2);
    const totalRows = await query<{ total: number }>(
      `SELECT COUNT(*)::int AS total
       FROM public.transactions t
       LEFT JOIN public."User" u ON u.id = t.user_id
       WHERE ${whereSql}`,
      countParams
    );

    const total = Number(totalRows[0]?.total || 0);

    return NextResponse.json({
      data: rows,
      page,
      limit,
      total,
      hasMore: offset + rows.length < total,
    }, { headers: utf8Headers });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Admin transactions fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500, headers: utf8Headers });
  }
}
