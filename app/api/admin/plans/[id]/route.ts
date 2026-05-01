import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const utf8Headers = { "Content-Type": "application/json; charset=utf-8" };
const mapPlan = (plan: any) => ({
  id: plan.id,
  name: plan.name,
  networkId: Number(plan.network_id),
  networkName: plan.network_name,
  sizeLabel: plan.size_label,
  validity: plan.validity,
  price: Number(plan.user_price || 0),
  userPrice: Number(plan.user_price || 0),
  agentPrice: plan.agent_price !== null ? Number(plan.agent_price) : null,
  apiAId: plan.api_a_id !== null ? String(plan.api_a_id) : "",
  apiBId: plan.api_b_id !== null ? String(plan.api_b_id) : "",
  apiCId: plan.api_c_id !== null ? String(plan.api_c_id) : "",
  category: plan.category || "SME",
  activeApi: plan.active_api || "A",
  isActive: !!plan.is_active,
});

export async function PATCH(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403, headers: utf8Headers });
    }

    const id = request.nextUrl.pathname.split("/").pop();
    if (!id) return NextResponse.json({ error: "Plan ID is required" }, { status: 400, headers: utf8Headers });

    const body = await request.json();
    const updates: string[] = [];
    const params: any[] = [];

    const push = (col: string, val: any) => {
      params.push(val);
      updates.push(`${col} = $${params.length}`);
    };

    if (body.name !== undefined) push("name", body.name);
    if (body.networkId !== undefined) push("network_id", Number(body.networkId));
    if (body.networkName !== undefined) push("network_name", body.networkName);
    if (body.sizeLabel !== undefined) push("size_label", body.sizeLabel);
    if (body.validity !== undefined) push("validity", body.validity);
    if (body.price !== undefined || body.userPrice !== undefined) push("user_price", Number(body.userPrice ?? body.price));
    if (body.agentPrice !== undefined) push("agent_price", body.agentPrice ? Number(body.agentPrice) : null);
    if (body.apiAId !== undefined) push("api_a_id", body.apiAId ? Number(body.apiAId) : null);
    if (body.apiBId !== undefined) push("api_b_id", body.apiBId ? Number(body.apiBId) : null);
    if (body.apiCId !== undefined) push("api_c_id", body.apiCId ? Number(body.apiCId) : null);
    if (body.activeApi !== undefined) push("active_api", body.activeApi);
    if (body.category !== undefined) push("category", body.category);
    if (body.isActive !== undefined) push("is_active", !!body.isActive);

    if (updates.length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400, headers: utf8Headers });

    params.push(id);
    const plan = await queryOne<any>(
      `UPDATE public.data_plans SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404, headers: utf8Headers });

    return NextResponse.json(mapPlan(plan), { headers: utf8Headers });
  } catch {
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500, headers: utf8Headers });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403, headers: utf8Headers });
    }

    const id = request.nextUrl.pathname.split("/").pop();
    if (!id) return NextResponse.json({ error: "Plan ID is required" }, { status: 400, headers: utf8Headers });

    await execute(`DELETE FROM public.data_plans WHERE id = $1`, [id]);
    return NextResponse.json({ success: true }, { headers: utf8Headers });
  } catch {
    return NextResponse.json({ error: "Failed to delete plan" }, { status: 500, headers: utf8Headers });
  }
}
