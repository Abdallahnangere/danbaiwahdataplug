import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const plans = await query<{
      id: string;
      name: string;
      networkId: number;
      networkName: string;
      sizeLabel: string;
      validity: string;
      price: number;
      userPrice: number;
      agentPrice: number;
      isActive: boolean;
    }>(
      "SELECT id, name, \"networkId\", \"networkName\", \"sizeLabel\", validity, price, \"userPrice\", \"agentPrice\", \"isActive\" FROM \"DataPlan\" WHERE \"isActive\" = true ORDER BY \"networkId\", price"
    );

    return NextResponse.json(plans);
  } catch (error: any) {
    console.error("Get plans error:", error);
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}
