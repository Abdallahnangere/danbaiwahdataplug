import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { query } from "@/lib/db";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key");

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    // Check admin session
    const adminSession = request.cookies.get("admin-session")?.value;
    if (!adminSession) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
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
        dp."sizeLabel" as size
      FROM "DataTransaction" dt
      LEFT JOIN "DataPlan" dp ON dt."planId" = dp.id
      WHERE dt."userId" = $1
      ORDER BY dt."createdAt" DESC
      LIMIT 50`,
      [userId]
    );

    const formattedTransactions = transactions.map((tx: any) => ({
      id: String(tx.id || ""),
      phone: String(tx.phone || ""),
      amount: Number(tx.amount || 0),
      status: String(tx.status || "PENDING").toUpperCase(),
      planName: String(tx.planName || "Data Plan"),
      size: tx.size ? String(tx.size) : undefined,
      providerUsed: String(tx.providerUsed || ""),
      providerRef: String(tx.providerRef || ""),
      customerRef: String(tx.customerRef || ""),
      createdAt: tx.createdAt ? new Date(tx.createdAt).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json(formattedTransactions, {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}
