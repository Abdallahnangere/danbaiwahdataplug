import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const utf8Headers = { "Content-Type": "application/json; charset=utf-8" };

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    
    // Verify admin access using JWT role
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403, headers: utf8Headers }
      );
    }

    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400, headers: utf8Headers }
      );
    }

    // Fetch user's DATA transactions
    const dataTransactions = await query(
      `SELECT 
        dt.id,
        dt.phone as phone_number,
        dt.amount,
        dt.status,
        dt."providerUsed" as provider_used,
        dt."providerRef" as provider_ref,
        dt."customerRef" as customer_ref,
        dt."createdAt" as created_at,
        dp.name as plan_name,
        dp."sizeLabel" as size_label,
        dp."networkName" as network_name,
        'data' as transaction_type
      FROM "DataTransaction" dt
      LEFT JOIN "DataPlan" dp ON dt."planId" = dp.id
      WHERE dt."userId" = $1
      ORDER BY dt."createdAt" DESC
      LIMIT 100`,
      [userId]
    );

    // Fetch user's AIRTIME transactions
    const airtimeTransactions = await query(
      `SELECT 
        id,
        mobile_number as phone_number,
        amount,
        status,
        provider_id as provider_used,
        ident as provider_ref,
        ident as customer_ref,
        created_at,
        network_name,
        'airtime' as transaction_type
      FROM airtime_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 100`,
      [userId]
    );

    // Format data transactions
    const formattedDataTx = (dataTransactions || []).map((tx: any) => ({
      id: String(tx.id || ""),
      phone_number: String(tx.phone_number || ""),
      amount: Number(tx.amount || 0),
      status: String(tx.status || "PENDING").toUpperCase(),
      plan_name: String(tx.plan_name || "Data Plan"),
      size_label: tx.size_label ? String(tx.size_label) : undefined,
      network_name: String(tx.network_name || ""),
      provider_used: String(tx.provider_used || ""),
      provider_ref: String(tx.provider_ref || ""),
      customer_ref: String(tx.customer_ref || ""),
      created_at: tx.created_at ? new Date(tx.created_at).toISOString() : new Date().toISOString(),
      transaction_type: "data",
    }));

    // Format airtime transactions
    const formattedAirtimeTx = (airtimeTransactions || []).map((tx: any) => ({
      id: String(tx.id || ""),
      phone_number: String(tx.phone_number || ""),
      amount: Number(tx.amount || 0),
      status: String(tx.status || "PENDING").toUpperCase(),
      plan_name: `Airtime - ${String(tx.network_name || "Unknown")}`,
      size_label: undefined,
      network_name: String(tx.network_name || ""),
      provider_used: String(tx.provider_used || ""),
      provider_ref: String(tx.provider_ref || ""),
      customer_ref: String(tx.customer_ref || ""),
      created_at: tx.created_at ? new Date(tx.created_at).toISOString() : new Date().toISOString(),
      transaction_type: "airtime",
    }));

    // Merge and sort by date
    const allTransactions = [...formattedDataTx, ...formattedAirtimeTx]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50);

    return NextResponse.json(allTransactions, {
      headers: utf8Headers,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.error("Error fetching user transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500, headers: utf8Headers }
    );
  }
}
