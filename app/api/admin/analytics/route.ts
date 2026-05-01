import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const utf8Headers = { "Content-Type": "application/json; charset=utf-8" };
const lagosDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Lagos",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const toLagosDate = (value: string | Date) => lagosDateFormatter.format(new Date(value));
const isSuccessfulStatus = (status: string | null | undefined) => String(status || "").toUpperCase() === "SUCCESS";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403, headers: utf8Headers });
    }

    const { searchParams } = new URL(request.url);
    const selectedDate = searchParams.get("date") || toLagosDate(new Date());

    const userCountResult = await queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM "User"`, []);
    const userCount = userCountResult?.count || 0;

    const allTransactions = await query<any>(
      `SELECT 
        t.id,
        t.target as phone,
        t.amount,
        t.status,
        t.created_at as "createdAt",
        u.email,
        u.name,
        CASE
          WHEN t.category = 'DEPOSIT' THEN CONCAT('Wallet Deposit - ', COALESCE(t.reference, t.id))
          WHEN t.category = 'AIRTIME' THEN CONCAT(COALESCE(t.network_name, 'Network'), ' - NGN', t.amount)
          ELSE CONCAT(COALESCE(t.network_name, 'Network'), ' Data')
        END as "planName",
        t.category as "type"
       FROM public.transactions t
       LEFT JOIN "User" u ON t.user_id = u.id
       ORDER BY t.created_at DESC`,
      []
    );

    const filteredTransactions = allTransactions.filter((t: any) => t.createdAt && toLagosDate(t.createdAt) === selectedDate);

    const successfulTransactions = filteredTransactions.filter((t: any) => isSuccessfulStatus(t.status));
    const successfulDeposits = successfulTransactions.filter((t: any) => String(t.type || "").toUpperCase() === "DEPOSIT");
    const successfulSpends = successfulTransactions.filter((t: any) => ["DATA", "AIRTIME"].includes(String(t.type || "").toUpperCase()));

    const totalDeposited = successfulDeposits.reduce((sum: number, t: any) => sum + (typeof t.amount === "number" ? t.amount : parseFloat(String(t.amount || 0))), 0);
    const totalSpent = successfulSpends.reduce((sum: number, t: any) => sum + (typeof t.amount === "number" ? t.amount : parseFloat(String(t.amount || 0))), 0);
    const totalUnspentDeposits = Math.max(totalDeposited - totalSpent, 0);

    const recentTransactions = filteredTransactions.slice(0, 10).map((t: any) => ({
      id: t.id,
      type: t.type,
      user: { email: t.email || "N/A" },
      plan: { name: t.planName || "N/A" },
      phone: t.phone || "N/A",
      amount: typeof t.amount === "number" ? t.amount : parseFloat(String(t.amount || 0)),
      status: t.status,
      createdAt: t.createdAt,
    }));

    return NextResponse.json(
      {
        selectedDate,
        totalUsers: userCount,
        totalDeposited,
        totalSpent,
        totalUnspentDeposits,
        totalTransactions: filteredTransactions.length,
        successRate: filteredTransactions.length > 0 ? Math.round((successfulTransactions.length / filteredTransactions.length) * 1000) / 10 : 0,
        recentTransactions,
      },
      { headers: utf8Headers }
    );
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers: utf8Headers }
    );
  }
}
