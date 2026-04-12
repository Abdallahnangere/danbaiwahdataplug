import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { query } from "@/lib/db";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key");

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get("auth-token")?.value;

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

    // Fetch user's transactions
    const transactions = await query(
      `SELECT 
        dt.id,
        dt.phone,
        dt.amount,
        dt.status,
        dt."providerUsed",
        dt."providerRef",
        dt."customerRef",
        dt."createdAt",
        dp.name as "planName",
        dp."sizeLabel",
        dp."networkName"
       FROM "DataTransaction" dt
       LEFT JOIN "DataPlan" dp ON dt."planId" = dp.id
       WHERE dt."userId" = $1
       ORDER BY dt."createdAt" DESC
       LIMIT 50`,
      [userId]
    );

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
