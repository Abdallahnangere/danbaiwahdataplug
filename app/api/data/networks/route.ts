import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const networks = await prisma.dataNetwork.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ networks }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/data/networks]", error);
    return NextResponse.json(
      { error: "Failed to fetch networks" },
      { status: 500 }
    );
  }
}
