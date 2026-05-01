import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

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

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403, headers: utf8Headers });
    }

    const plans = await query<any>(`SELECT * FROM public.data_plans ORDER BY created_at DESC`, []);

    return NextResponse.json(plans.map(mapPlan), { headers: utf8Headers });
  } catch {
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500, headers: utf8Headers });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403, headers: utf8Headers });
    }

    const body = await request.json();
    const { name, networkId, networkName, sizeLabel, validity, price, userPrice, agentPrice, apiAId, apiBId, apiCId, activeApi, category, isActive } = body;

    if (!name || !networkId || !sizeLabel || !validity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400, headers: utf8Headers });
    }

    const networkIdNum = Number(networkId);
    const userPriceNum = Number(userPrice ?? price);
    if (!Number.isFinite(networkIdNum) || networkIdNum <= 0 || !Number.isFinite(userPriceNum) || userPriceNum <= 0) {
      return NextResponse.json({ error: "Invalid numeric field values" }, { status: 400, headers: utf8Headers });
    }

    const plan = await queryOne<any>(
      `INSERT INTO public.data_plans
       (id, name, network_id, network_name, size_label, validity, user_price, agent_price, api_a_id, api_b_id, api_c_id, active_api, category, is_active, created_at, updated_at)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
       RETURNING *`,
      [name, networkIdNum, networkName || "", sizeLabel, validity, userPriceNum, agentPrice ? Number(agentPrice) : null, apiAId ? Number(apiAId) : null, apiBId ? Number(apiBId) : null, apiCId ? Number(apiCId) : null, activeApi || "A", category || "SME", isActive !== false]
    );

    return NextResponse.json(mapPlan(plan), { status: 201, headers: utf8Headers });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create plan" }, { status: 500, headers: utf8Headers });
  }
}
