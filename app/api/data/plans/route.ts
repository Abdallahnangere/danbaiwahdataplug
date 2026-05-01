import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Logging helper - LOGS TO VERCEL IN PRODUCTION + DEVELOPMENT
const log = (step: string, data: unknown) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[DATA_PLANS] ${timestamp} ${step}: ${JSON.stringify(data, null, 2)}`;
  console.log(logMessage);  // Always logs - visible in Vercel
  console.error(`[DATA_PLANS_LOG] ${step}`, JSON.stringify(data, null, 2));
};

export async function GET(request: NextRequest) {
  try {
    // Extract networkId from query parameters
    const { searchParams } = new URL(request.url);
    const networkId = searchParams.get("networkId");
    
    log("REQUEST", { timestamp: new Date().toISOString(), networkId });

    // Get user session to check their role
    const sessionUser = await getSessionUser(request);
    const userRole = sessionUser?.role || "USER";
    log("SESSION", { userRole });

    const queryParams: Array<number> = [];
    let sqlQuery = "SELECT id, name, network_id, network_name, size_label, validity, user_price, agent_price, category, is_active FROM public.data_plans WHERE 1=1";
    if (networkId !== null) {
      const parsedNetworkId = Number(networkId);
      if (!Number.isInteger(parsedNetworkId) || parsedNetworkId <= 0) {
        return NextResponse.json(
          { error: "Invalid networkId" },
          { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
        );
      }
      queryParams.push(parsedNetworkId);
      sqlQuery += ` AND network_id = $${queryParams.length}`;
    }
    sqlQuery += " ORDER BY network_id, is_active DESC, user_price";

    const plans = await query<{
      id: string;
      name: string;
      network_id: number;
      network_name: string;
      size_label: string;
      validity: string;
      user_price: number;
      agent_price: number | null;
      category: "SME" | "GIFTING" | "CORPORATE";
      is_active: boolean;
    }>(sqlQuery, queryParams);

    // Apply role-based pricing
    const plansWithRoleBasedPrice = plans.map((plan) => {
      let displayPrice = Number(plan.user_price || 0);

      // If user is AGENT and plan has agentPrice, use agentPrice
      if (userRole === "AGENT" && plan.agent_price && plan.agent_price > 0) {
        displayPrice = Number(plan.agent_price);
      }

      return {
        id: plan.id,
        name: plan.name,
        networkId: plan.network_id,
        networkName: plan.network_name,
        sizeLabel: plan.size_label,
        validity: plan.validity,
        userPrice: Number(plan.user_price || 0),
        agentPrice: plan.agent_price !== null ? Number(plan.agent_price) : null,
        category: plan.category,
        isActive: plan.is_active,
        price: displayPrice, // Display price is now role-aware
      };
    });

    log("RESPONSE_200", { count: plansWithRoleBasedPrice.length, userRole, plans: plansWithRoleBasedPrice.slice(0, 2) });

    return NextResponse.json(plansWithRoleBasedPrice, {
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log("ERROR_500", { error: errorMessage });
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { 
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      }
    );
  }
}
