import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const utf8Headers = { "Content-Type": "application/json; charset=utf-8" };

export async function GET(request: NextRequest) {
  try {
    // Verify admin access using JWT role
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403, headers: utf8Headers });
    }

    // Fetch user count
    const userCountResult = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM "User"`,
      []
    );
    const userCount = userCountResult?.count || 0;

    // Fetch all data transactions (gracefully handle if table doesn't exist)
    let dataTransactions: any[] = [];
    try {
      dataTransactions = await query<any>(
        `SELECT 
          dt.id,
          dt.phone,
          dt.amount,
          dt.status,
          dt."createdAt",
          u.email,
          u.name,
          dp.name as "planName",
          'DATA' as "type"
         FROM "DataTransaction" dt
         LEFT JOIN "User" u ON dt."userId" = u.id
         LEFT JOIN "DataPlan" dp ON dt."planId" = dp.id
         ORDER BY dt."createdAt" DESC`,
        []
      );
    } catch (error) {
      console.warn("[ANALYTICS] DataTransaction table not found or error", { error: (error as any).message });
    }

    // Fetch all cable transactions (gracefully handle if table doesn't exist)
    let cableTransactions: any[] = [];
    try {
      cableTransactions = await query<any>(
        `SELECT 
          ct.id,
          ct.phone,
          ct.amount,
          ct.status,
          ct."createdAt",
          u.email,
          u.name,
          cp.name as "planName",
          'CABLE' as "type"
         FROM "CableTransaction" ct
         LEFT JOIN "User" u ON ct."userId" = u.id
         LEFT JOIN "CablePlan" cp ON ct."planId" = cp.id
         ORDER BY ct."createdAt" DESC`,
        []
      );
    } catch (error) {
      console.warn("[ANALYTICS] CableTransaction table not found or error", { error: (error as any).message });
    }

    // Fetch all power transactions (gracefully handle if table doesn't exist)
    let powerTransactions: any[] = [];
    try {
      powerTransactions = await query<any>(
        `SELECT 
          pt.id,
          pt.phone,
          pt.amount,
          pt.status,
          pt."createdAt",
          u.email,
          u.name,
          pp.name as "planName",
          'POWER' as "type"
         FROM "PowerTransaction" pt
         LEFT JOIN "User" u ON pt."userId" = u.id
         LEFT JOIN "PowerPlan" pp ON pt."planId" = pp.id
         ORDER BY pt."createdAt" DESC`,
        []
      );
    } catch (error) {
      console.warn("[ANALYTICS] PowerTransaction table not found or error", { error: (error as any).message });
    }

    // Fetch all airtime transactions
    const airtimeTransactions = await query<any>(
      `SELECT 
        at.id,
        at.mobile_number as phone,
        at.amount,
        at.status,
        at.created_at as "createdAt",
        u.email,
        u.name,
        CONCAT(at.network_name, ' - ₦', at.amount) as "planName",
        'AIRTIME' as "type"
       FROM airtime_transactions at
       LEFT JOIN "User" u ON at.user_id = u.id
       ORDER BY at.created_at DESC`,
      []
    );

    // Fetch all wallet deposits (from webhook)
    const deposits = await query<any>(
      `SELECT 
        t.id,
        NULL as phone,
        t.amount,
        t.status,
        t.created_at as "createdAt",
        u.email,
        u.name,
        CONCAT('Wallet Deposit - ', t.reference) as "planName",
        'DEPOSIT' as "type"
       FROM "Transaction" t
       LEFT JOIN "User" u ON t.user_id = u.id
       WHERE t.type = 'deposit'
       ORDER BY t.created_at DESC`,
      []
    );

    // Combine all transactions
    const allTransactions = [
      ...dataTransactions,
      ...cableTransactions,
      ...powerTransactions,
      ...airtimeTransactions,
      ...deposits,
    ].sort((a: any, b: any) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA;
    });

    // Calculate metrics
    const successfulTransactions = allTransactions.filter((t: any) => t.status === "SUCCESS");
    const totalRevenue = successfulTransactions.reduce((sum: number, t: any) => {
      const amount = typeof t.amount === "number" ? t.amount : parseFloat(String(t.amount || 0));
      return sum + amount;
    }, 0);

    const recentTransactions = allTransactions.slice(0, 10).map((t: any) => ({
      id: t.id,
      type: t.type,
      user: { email: t.email || "N/A" },
      plan: { name: t.planName || "N/A" },
      phone: t.phone || "N/A",
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
    }, { headers: utf8Headers });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers: utf8Headers }
    );
  }
}
