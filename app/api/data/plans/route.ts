import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const networkId = request.nextUrl.searchParams.get("networkId");

    if (!networkId) {
      return NextResponse.json(
        { error: "networkId query parameter is required" },
        { status: 400 }
      );
    }

    const plans = await prisma.dataPlan.findMany({
      where: {
        networkId: networkId as any,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        sizeLabel: true,
        validity: true,
        price: true,
        networkId: true,
      },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}
