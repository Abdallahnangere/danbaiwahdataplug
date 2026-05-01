import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const log = (step: string, data: any) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[USER_ANALYTICS] ${step}:`, JSON.stringify(data, null, 2));
  }
};

export async function GET(request: NextRequest) {
  try {
    log("REQUEST_START", { timestamp: new Date().toISOString() });

    // Authenticate user
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      log("AUTH_FAILED", { reason: "No session user" });
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    const userId = sessionUser.userId;
    log("AUTH_SUCCESS", { userId });

    // Fetch user info
    const user = await queryOne<{ balance: number; name: string }>(
      `SELECT balance, name FROM "User" WHERE id = $1`,
      [userId]
    );

    if (!user) {
      log("USER_NOT_FOUND", { userId });
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    const transactions = await query<{
      category: string;
      amount: number;
      status: string;
    }>(
      `SELECT category, amount, status
       FROM public.transactions
       WHERE user_id = $1`,
      [userId]
    );

    log("TRANSACTIONS_FETCHED", {
      totalCount: transactions.length,
    });

    // Calculate total spend
    const dataTransactions = transactions.filter((t) => t.category === "DATA");
    const airtimeTransactions = transactions.filter((t) => t.category === "AIRTIME");

    const dataSpend = dataTransactions
      .filter((t) => String(t.status).toUpperCase() === "SUCCESS")
      .reduce((sum, t) => sum + (typeof t.amount === "number" ? t.amount : parseFloat(String(t.amount || 0))), 0);

    const airtimeSpend = airtimeTransactions
      .filter((t) => String(t.status).toUpperCase() === "SUCCESS")
      .reduce((sum, t) => sum + (typeof t.amount === "number" ? t.amount : parseFloat(String(t.amount || 0))), 0);

    const totalSpend = dataSpend + airtimeSpend;

    log("ANALYTICS_CALCULATED", {
      totalSpend,
      dataSpend,
      airtimeSpend,
      cableSpend: 0,
      powerSpend: 0,
    });

    return NextResponse.json(
      {
        balance: user.balance,
        totalSpend,
        spendBreakdown: {
          data: dataSpend,
          airtime: airtimeSpend,
          cable: 0,
          power: 0,
        },
        transactionCounts: {
          data: dataTransactions.length,
          airtime: airtimeTransactions.length,
          cable: 0,
          power: 0,
        },
        successCounts: {
          data: dataTransactions.filter((t) => String(t.status).toUpperCase() === "SUCCESS").length,
          airtime: airtimeTransactions.filter((t) => String(t.status).toUpperCase() === "SUCCESS").length,
          cable: 0,
          power: 0,
        },
      },
      { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (error: any) {
    log("ERROR_500", { error: error.message, stack: error.stack });
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}
