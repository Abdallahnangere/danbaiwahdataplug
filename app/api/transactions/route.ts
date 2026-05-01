import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    const userId = sessionUser?.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - No user ID in token" },
        { status: 401, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(10, Number(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;

    const allTransactions = await query<{
      id: string;
      category: string;
      target: string | null;
      provider: string | null;
      network_name: string | null;
      plan_id: string | null;
      reference: string | null;
      amount: number;
      status: string;
      created_at: string;
      plan_name: string | null;
      size_label: string | null;
    }>(
      `SELECT
         t.id, t.category, t.target, t.provider, t.network_name, t.plan_id, t.reference,
         t.amount, t.status, t.created_at,
         dp.name AS plan_name, dp.size_label
       FROM public.transactions t
       LEFT JOIN public.data_plans dp ON dp.id = t.plan_id
       WHERE user_id = $1
       AND category IN ('DATA', 'AIRTIME')
       ORDER BY t.created_at DESC
       OFFSET $2
       LIMIT $3`,
      [userId, offset, limit]
    );
    const totalResult = await query<{ total: number }>(
      `SELECT COUNT(*)::int AS total
       FROM public.transactions
       WHERE user_id = $1
       AND category IN ('DATA', 'AIRTIME')`,
      [userId]
    );
    const total = totalResult[0]?.total || 0;

    const formatted = allTransactions.map((tx) => {
      const type = String(tx.category || "").toLowerCase();
      return {
        id: tx.id,
        planName:
          type === "airtime"
            ? `${tx.provider || "Network"} Airtime`
            : tx.plan_name || `${tx.network_name || tx.provider || "Network"} Data`,
        sizeLabel: tx.size_label || "",
        networkName: tx.network_name || tx.provider || "Provider",
        phone: tx.target || "",
        reference: tx.reference || "",
        amount: Number(tx.amount) || 0,
        status: String(tx.status || "PENDING"),
        createdAt: tx.created_at,
        type,
      };
    });

    return NextResponse.json(
      {
        success: true,
        transactions: formatted,
        page,
        limit,
        total,
        hasMore: offset + formatted.length < total,
      },
      { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (error) {
      if (process.env.NODE_ENV === "development") console.error("Transactions fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}
