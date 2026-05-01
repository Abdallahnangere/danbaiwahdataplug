import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const utf8Headers = { "Content-Type": "application/json; charset=utf-8" };

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403, headers: utf8Headers });
    }

    const totalRow = await queryOne<{ total_users: number; total_balance: number }>(
      `SELECT COUNT(*)::int AS total_users, COALESCE(SUM(balance),0)::numeric(14,2) AS total_balance FROM "User"`,
      []
    );

    const topUsers = await query<{
      id: string;
      name: string | null;
      phone: string | null;
      balance: number;
    }>(
      `SELECT id, name, phone, balance
       FROM "User"
       ORDER BY balance DESC
       LIMIT 20`,
      []
    );

    return NextResponse.json({
      totalUsers: totalRow?.total_users || 0,
      totalBalance: Number(totalRow?.total_balance || 0),
      topUsers: topUsers.map((u) => ({
        id: u.id,
        name: u.name || "Unnamed user",
        phone: u.phone || "",
        balance: Number(u.balance || 0),
      })),
      asOf: new Date().toISOString(),
    }, { headers: utf8Headers });
  } catch {
    return NextResponse.json({ error: "Failed to fetch balance overview" }, { status: 500, headers: utf8Headers });
  }
}
