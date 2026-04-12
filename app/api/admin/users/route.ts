import { NextRequest, NextResponse } from "next/server";
import { withAdminGuard } from "@/lib/adminGuard";
import { prisma } from "@/lib/db";

async function handler(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        balance: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      users.map((user: any) => ({
        ...user,
        balance: typeof user.balance === 'number' ? user.balance : user.balance.toNumber?.() || 0,
      }))
    );
  } catch (error) {
    console.error("Users fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return withAdminGuard(request, handler);
}
