import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const utf8Headers = { "Content-Type": "application/json; charset=utf-8" };

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    
    // Verify admin access using JWT role
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403, headers: utf8Headers }
      );
    }

    const userId = params.id;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(10, Number(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400, headers: utf8Headers }
      );
    }

    const txRows = await query<{
      id: string;
      category: string;
      target: string | null;
      provider: string | null;
      network_name: string | null;
      amount: number;
      status: string;
      created_at: string;
    }>(
      `SELECT id, category, target, provider, network_name, amount, status, created_at
       FROM public.transactions
       WHERE user_id = $1
       AND category IN ('DATA', 'AIRTIME')
       ORDER BY created_at DESC
       OFFSET $2
       LIMIT $3`,
      [userId, offset, limit]
    );
    const countRows = await query<{ total: number }>(
      `SELECT COUNT(*)::int AS total
       FROM public.transactions
       WHERE user_id = $1
       AND category IN ('DATA', 'AIRTIME')`,
      [userId]
    );
    const total = countRows[0]?.total || 0;

    const allTransactions = txRows.map((tx) => {
      const type = String(tx.category || "").toLowerCase();
      return {
        id: String(tx.id || ""),
        planName:
          type === "airtime"
            ? `${String(tx.provider || "Unknown")} Airtime`
            : `${String(tx.network_name || tx.provider || "Unknown")} Data`,
        sizeLabel: "",
        networkName: String(tx.network_name || tx.provider || ""),
        phone: String(tx.target || ""),
        amount: Number(tx.amount || 0),
        status: String(tx.status || "PENDING").toUpperCase(),
        createdAt: tx.created_at ? new Date(tx.created_at).toISOString() : new Date().toISOString(),
        type,
      };
    });

    return NextResponse.json({
      data: allTransactions,
      page,
      limit,
      total,
      hasMore: offset + allTransactions.length < total,
    }, {
      headers: utf8Headers,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.error("Error fetching user transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500, headers: utf8Headers }
    );
  }
}
