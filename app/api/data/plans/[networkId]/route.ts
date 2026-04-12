import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { networkId: string } }
) {
  try {
    const { networkId } = params;

    const plans = await prisma.dataPlan.findMany({
      where: { networkId },
      orderBy: { validity: "asc" },
    });

    return NextResponse.json({ plans }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/data/plans/[networkId]]", error);
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}
