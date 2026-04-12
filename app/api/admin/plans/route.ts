import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const utf8Headers = { "Content-Type": "application/json; charset=utf-8" };

export async function GET(request: NextRequest) {
  try {
    // Check admin session cookie
    const adminSession = request.cookies.get("admin-session");
    
    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: utf8Headers });
    }

    const plans = await query<any>(
      `SELECT * FROM "DataPlan" ORDER BY "createdAt" DESC`,
      []
    );

    return NextResponse.json(plans.map((plan: any) => ({
      ...plan,
      price: typeof plan.price === 'number' ? plan.price : parseFloat(String(plan.price)),
      userPrice: plan.userPrice ? (typeof plan.userPrice === 'number' ? plan.userPrice : parseFloat(String(plan.userPrice))) : null,
      agentPrice: plan.agentPrice ? (typeof plan.agentPrice === 'number' ? plan.agentPrice : parseFloat(String(plan.agentPrice))) : null,
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
    // Check admin session cookie
    const adminSession = request.cookies.get("admin-session");
    
    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: utf8Headers });
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
