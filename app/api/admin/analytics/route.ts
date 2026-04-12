import { NextRequest, NextResponse } from "next/server";
import { withAdminGuard } from "@/lib/adminGuard";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

async function handler(request: NextRequest) {
  try {
    const [users, transactions, recentTxs] = await Promise.all([
      prisma.user.count(),
      prisma.dataTransaction.findMany({
        select: {
          amount: true,
          status: true,
        },
      }),
      prisma.dataTransaction.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
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
      }),
    ]);

    const totalRevenue = transactions
      .filter((t: any) => t.status === "successful")
      .reduce((sum: number, t: any) => sum + (typeof t.amount === 'number' ? t.amount : t.amount.toNumber ? t.amount.toNumber() : 0), 0);

    const totalTransactions = transactions.length;
    const successfulCount = transactions.filter(
      (t: any) => t.status === "successful"
    ).length;
    const successRate =
      totalTransactions > 0
        ? Math.round((successfulCount / totalTransactions) * 1000) / 10
        : 0;

    return NextResponse.json({
      totalUsers: users,
      totalRevenue,
      totalTransactions,
      successRate,
      recentTransactions: recentTxs.map((t: any) => ({
        id: t.id,
        email: t.user?.email || "N/A",
        name: t.user?.name,
        plan: t.plan?.name,
        phone: t.phone,
        amount: typeof t.amount === 'number' ? t.amount : t.amount.toNumber ? t.amount.toNumber() : 0,
        status: t.status,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return withAdminGuard(request, handler);
}
