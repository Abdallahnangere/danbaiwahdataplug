import { NextRequest, NextResponse } from "next/server";

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

    // Only import and use prisma inside the handler to defer initialization
    const { prisma } = await import("@/lib/db");

    // Fetch all data in parallel
    const [userCount, allTransactions] = await Promise.all([
      prisma.user.count(),
      prisma.dataTransaction.findMany({
        select: {
          id: true,
          phone: true,
          amount: true,
          status: true,
          createdAt: true,
          user: {
            select: { email: true, name: true },
          },
          plan: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Calculate metrics
    const successfulTransactions = allTransactions.filter((t: any) => t.status === "successful");
    const totalRevenue = successfulTransactions.reduce((sum: number, t: any) => {
      const amount = typeof t.amount === "number" ? t.amount : t.amount?.toNumber?.() || 0;
      return sum + amount;
    }, 0);

    const recentTransactions = allTransactions.slice(0, 10).map((t: any) => ({
      id: t.id,
      email: t.user?.email || "N/A",
      name: t.user?.name || "N/A",
      plan: t.plan?.name || "N/A",
      phone: t.phone,
      amount: typeof t.amount === "number" ? t.amount : t.amount?.toNumber?.() || 0,
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
