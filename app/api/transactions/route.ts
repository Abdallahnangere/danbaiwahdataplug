import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { query } from "@/lib/db";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key");

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies - using standardized auth_token name
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No token" },
        { status: 401, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    // Verify token
    let payload: any;
    try {
      const verified = await jwtVerify(token, secret);
      payload = verified.payload;
    } catch {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    const userId = payload.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - No user ID in token" },
        { status: 401, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    // Fetch user's transactions from both data and airtime
    const dataTransactions = await query(
      `SELECT 
        dt.id,
        dt.phone as phone_number,
        dt.amount,
        dt.status,
        dt."providerUsed" as provider,
        dt."providerRef" as reference,
        dt."customerRef" as customer_ref,
        dt."createdAt" as created_at,
        dp.name as plan_name,
        dp."sizeLabel" as size_label,
        dp."networkName" as network_name,
        'data' as type
       FROM "DataTransaction" dt
       LEFT JOIN "DataPlan" dp ON dt."planId" = dp.id
       WHERE dt."userId" = $1
       ORDER BY dt."createdAt" DESC
       LIMIT 50`,
      [userId]
    );

    const airtimeTransactions = await query(
      `SELECT 
        at.id,
        at.mobile_number as phone_number,
        at.amount,
        at.status,
        at.provider_id as provider,
        at.ident as reference,
        at.ident as customer_ref,
        at.created_at,
        at.network_name,
        'airtime' as type
       FROM airtime_transactions at
       WHERE at.user_id = $1
       ORDER BY at.created_at DESC
       LIMIT 50`,
      [userId]
    );

    // Merge and sort by date
    const allTransactions = [...(dataTransactions || []), ...(airtimeTransactions || [])]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50);

    const transactions = allTransactions;

    return NextResponse.json(
      {
        success: true,
        transactions: transactions || [],
      },
      { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (error) {
    console.error("Transactions fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}
