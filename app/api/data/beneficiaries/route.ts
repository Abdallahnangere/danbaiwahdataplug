import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query, execute, queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const utf8Headers = { "Content-Type": "application/json; charset=utf-8" };

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: utf8Headers });
    const rows = await query<any>(`SELECT id, service, network_id, network_name, phone, label, created_at FROM public.saved_beneficiaries WHERE user_id = $1 AND service = 'DATA' ORDER BY created_at DESC LIMIT 30`, [sessionUser.userId]);
    return NextResponse.json({ data: rows }, { headers: utf8Headers });
  } catch {
    return NextResponse.json({ error: "Failed to fetch beneficiaries" }, { status: 500, headers: utf8Headers });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: utf8Headers });
    const body = await request.json();
    const phone = String(body.phone || "").trim();
    if (!/^\d{11}$/.test(phone)) return NextResponse.json({ error: "Invalid phone" }, { status: 400, headers: utf8Headers });
    const networkId = Number(body.networkId || 0) || null;
    const networkName = body.networkName ? String(body.networkName) : null;
    const label = body.label ? String(body.label) : null;
    const existing = await queryOne<any>(`SELECT id FROM public.saved_beneficiaries WHERE user_id=$1 AND service='DATA' AND network_id IS NOT DISTINCT FROM $2 AND phone=$3`, [sessionUser.userId, networkId, phone]);
    if (existing) return NextResponse.json({ success: true, id: existing.id }, { headers: utf8Headers });
    const id = crypto.randomUUID();
    await execute(`INSERT INTO public.saved_beneficiaries (id, user_id, service, network_id, network_name, phone, label) VALUES ($1,$2,'DATA',$3,$4,$5,$6)`, [id, sessionUser.userId, networkId, networkName, phone, label]);
    return NextResponse.json({ success: true, id }, { headers: utf8Headers });
  } catch {
    return NextResponse.json({ error: "Failed to save beneficiary" }, { status: 500, headers: utf8Headers });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: utf8Headers });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400, headers: utf8Headers });
    await execute(`DELETE FROM public.saved_beneficiaries WHERE id=$1 AND user_id=$2`, [id, sessionUser.userId]);
    return NextResponse.json({ success: true }, { headers: utf8Headers });
  } catch {
    return NextResponse.json({ error: "Failed to delete beneficiary" }, { status: 500, headers: utf8Headers });
  }
}
