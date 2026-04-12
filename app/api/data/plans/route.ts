import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const log = (step: string, data: any) => {
  console.log(`[DATA_PLANS] ${step}:`, JSON.stringify(data, null, 2));
};

export async function GET() {
  try {
    log("REQUEST", { timestamp: new Date().toISOString() });

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

    log("RESPONSE_200", { count: plans.length, plans: plans.slice(0, 2) });

    return NextResponse.json(plans, {
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  } catch (error: any) {
    log("ERROR_500", { error: error.message, stack: error.stack });
    return NextResponse.json(
      { error: "Failed to fetch plans", details: error.message },
      { 
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      }
    );
  }
}
