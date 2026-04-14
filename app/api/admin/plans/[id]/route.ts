import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const utf8Headers = { "Content-Type": "application/json; charset=utf-8" };

export async function PATCH(request: NextRequest) {
  try {
    // Verify admin access using JWT role
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403, headers: utf8Headers }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || (request.nextUrl.pathname.split("/").pop());

    if (!id) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400, headers: utf8Headers });
    }

    const body = await request.json();
    const {
      name,
      networkId,
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

    // Build UPDATE query dynamically
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      params.push(name);
      paramCount++;
    }
    if (networkId !== undefined) {
      updates.push(`"networkId" = $${paramCount}`);
      params.push(parseInt(networkId));
      paramCount++;
    }
    if (sizeLabel !== undefined) {
      updates.push(`"sizeLabel" = $${paramCount}`);
      params.push(sizeLabel);
      paramCount++;
    }
    if (validity !== undefined) {
      updates.push(`validity = $${paramCount}`);
      params.push(validity);
      paramCount++;
    }
    if (price !== undefined) {
      updates.push(`price = $${paramCount}`);
      params.push(parseFloat(price));
      paramCount++;
    }
    if (userPrice !== undefined) {
      updates.push(`"userPrice" = $${paramCount}`);
      params.push(userPrice ? parseFloat(userPrice) : null);
      paramCount++;
    }
    if (agentPrice !== undefined) {
      updates.push(`"agentPrice" = $${paramCount}`);
      params.push(agentPrice ? parseFloat(agentPrice) : null);
      paramCount++;
    }
    if (apiAId !== undefined) {
      updates.push(`"apiAId" = $${paramCount}`);
      params.push(apiAId ? parseInt(apiAId) : null);
      paramCount++;
    }
    if (apiBId !== undefined) {
      updates.push(`"apiBId" = $${paramCount}`);
      params.push(apiBId ? parseInt(apiBId) : null);
      paramCount++;
    }
    if (activeApi !== undefined) {
      updates.push(`"activeApi" = $${paramCount}`);
      params.push(activeApi);
      paramCount++;
    }
    if (isActive !== undefined) {
      updates.push(`"isActive" = $${paramCount}`);
      params.push(isActive);
      paramCount++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400, headers: utf8Headers }
      );
    }

    // Add the ID to params for WHERE clause
    params.push(id);

    const updateQuery = `
      UPDATE "DataPlan"
      SET ${updates.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, name, "networkId", "sizeLabel", validity, price, "userPrice", "agentPrice", 
                "apiAId", "apiBId", "activeApi", "isActive", "createdAt"
    `;

    const plan = await queryOne<any>(updateQuery, params);

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404, headers: utf8Headers });
    }

    return NextResponse.json({
      ...plan,
      price: typeof plan.price === 'number' ? plan.price : parseFloat(String(plan.price)),
      userPrice: plan.userPrice ? (typeof plan.userPrice === 'number' ? plan.userPrice : parseFloat(String(plan.userPrice))) : null,
      agentPrice: plan.agentPrice ? (typeof plan.agentPrice === 'number' ? plan.agentPrice : parseFloat(String(plan.agentPrice))) : null,
    }, { headers: utf8Headers });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.error("Plan update error:", error);
    return NextResponse.json(
      { error: "Failed to update plan" },
      { status: 500, headers: utf8Headers }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin access using JWT role
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403, headers: utf8Headers }
      );
    }

    const id = request.nextUrl.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400, headers: utf8Headers });
    }

    await execute(`DELETE FROM "DataPlan" WHERE id = $1`, [id]);

    return NextResponse.json({ success: true }, { headers: utf8Headers });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.error("Plan delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete plan" },
      { status: 500, headers: utf8Headers }
    );
  }
}
