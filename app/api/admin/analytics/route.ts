import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Check admin access first
    const authHeader = request.headers.get("authorization");
    const adminPassword = request.headers.get("x-admin-password");
    
    // Validate admin access
    const isAdmin = process.env.ADMIN_PASSWORD && adminPassword === process.env.ADMIN_PASSWORD;
    if (!authHeader?.startsWith("Bearer ") && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user count
    const userCountResult = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM "User"`,
      []
    );
    const userCount = userCountResult?.count || 0;

    // Fetch all transactions with user and plan info
    const allTransactions = await query<any>(
      `SELECT 
        dt.id,
        dt.phone,
        dt.amount,
        dt.status,
        dt."createdAt",
        u.email,
        u.name,
        dp.name as "planName"
       FROM "DataTransaction" dt
       LEFT JOIN "User" u ON dt."userId" = u.id
       LEFT JOIN "DataPlan" dp ON dt."planId" = dp.id
       ORDER BY dt."createdAt" DESC`,
      []
    );

    // Calculate metrics
    const successfulTransactions = allTransactions.filter((t: any) => t.status === "SUCCESS");
    const totalRevenue = successfulTransactions.reduce((sum: number, t: any) => {
      const amount = typeof t.amount === "number" ? t.amount : parseFloat(String(t.amount || 0));
      return sum + amount;
    }, 0);

    const recentTransactions = allTransactions.slice(0, 10).map((t: any) => ({
      id: t.id,
      email: t.email || "N/A",
      name: t.name || "N/A",
      plan: t.planName || "N/A",
      phone: t.phone,
      amount: typeof t.amount === "number" ? t.amount : parseFloat(String(t.amount || 0)),
      status: t.status,
      createdAt: t.createdAt,
    }));

    return NextResponse.json({
      totalUsers: userCount,
      totalRevenue,
      totalTransactions: allTransactions.length,
      successRate:
        allTransactions.length > 0
          ? Math.round((successfulTransactions.length / allTransactions.length) * 1000) / 10
          : 0,
      recentTransactions,
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
