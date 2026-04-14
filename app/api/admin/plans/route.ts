import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const utf8Headers = { "Content-Type": "application/json; charset=utf-8" };

export async function GET(request: NextRequest) {
  try {
    // Verify admin access using JWT role
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403, headers: utf8Headers });
    }

    const plans = await query<any>(
      `SELECT * FROM "DataPlan" ORDER BY "createdAt" DESC`,
      []
    );

    return NextResponse.json(plans.map((plan: any) => ({
      id: plan.id || "",
      name: plan.name || "",
      networkId: String(plan.networkId || ""),
      networkName: plan.networkName || "",
      sizeLabel: plan.sizeLabel || "",
      validity: plan.validity || "",
      price: typeof plan.price === 'number' ? plan.price : parseFloat(String(plan.price || 0)),
      userPrice: typeof plan.userPrice === 'number' ? plan.userPrice : parseFloat(String(plan.userPrice || 0)),
      agentPrice: typeof plan.agentPrice === 'number' ? plan.agentPrice : parseFloat(String(plan.agentPrice || 0)),
      apiAId: String(plan.apiAId || ""),
      apiBId: String(plan.apiBId || ""),
      activeApi: plan.activeApi || "A",
      isActive: plan.isActive === true,
    })), { headers: utf8Headers });
  } catch (error) {
    console.error("Plans fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500, headers: utf8Headers }
    );
  }
}

async function createHandler(request: NextRequest) {
  try {
    // Verify admin access
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403, headers: utf8Headers });
    }

    const body = await request.json();
    const {
      name,
      networkId,
      networkName,
      sizeLabel,
      validity,
      price,
      userPrice,
      agentPrice,
      apiAId,
      apiBId,
      activeApi,
      isActive,
    } = body;

    if (!name || !networkId || !sizeLabel || !validity ||!price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400, headers: utf8Headers }
      );
    }

    const plan = await queryOne<any>(
      `INSERT INTO "DataPlan" 
       (id, name, "networkId", "networkName", "sizeLabel", validity, price, "userPrice", 
        "agentPrice", "apiAId", "apiBId", "activeApi", "isActive", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       RETURNING *`,
      [
        name,
        parseInt(networkId),
        networkName || null,
        sizeLabel,
        validity,
        parseFloat(price),
        userPrice ? parseFloat(userPrice) : null,
        agentPrice ? parseFloat(agentPrice) : null,
        apiAId ? parseInt(apiAId) : null,
        apiBId ? parseInt(apiBId) : null,
        activeApi || "A",
        isActive !== false,
      ]
    );

    if (!plan) {
      throw new Error("Failed to create plan");
    }

    return NextResponse.json(
      {
        ...plan,
        price: typeof plan.price === 'number' ? plan.price : parseFloat(String(plan.price)),
        userPrice: plan.userPrice ? (typeof plan.userPrice === 'number' ? plan.userPrice : parseFloat(String(plan.userPrice))) : null,
        agentPrice: plan.agentPrice ? (typeof plan.agentPrice === 'number' ? plan.agentPrice : parseFloat(String(plan.agentPrice))) : null,
      },
      { status: 201, headers: utf8Headers }
    );
  } catch (error) {
    console.error("Plan creation error:", error);
    return NextResponse.json(
      { error: "Failed to create plan" },
      { status: 500, headers: utf8Headers }
    );
  }
}

export async function POST(request: NextRequest) {
  return createHandler(request);
}
