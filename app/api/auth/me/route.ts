import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Dynamic import
    const { prisma } = await import("@/lib/db");

    // Get full user details from database
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        balance: true,
        tier: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      balance: user.balance.toNumber ? user.balance.toNumber() : user.balance,
      tier: user.tier,
      role: user.role,
      isActive: user.isActive,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
