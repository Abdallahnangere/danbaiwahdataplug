import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const utf8Headers = { "Content-Type": "application/json; charset=utf-8" };

type UserRow = {
  id: string;
  name: string | null;
  phone: string | null;
  balance: number;
  role: string;
  isActive: boolean;
  account_number: string | null;
  bank_name: string | null;
  account_name: string | null;
};

type BroadcastRow = {
  id: string;
  message: string;
  createdAt: string;
};

type AccountsSummaryRow = {
  totalReservedAccounts: number;
};

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401, headers: utf8Headers }
      );
    }

    const [user, broadcasts, accountsSummaryRow] = await Promise.all([
      queryOne<UserRow>(
        `SELECT id, name, phone, balance, role, "isActive", "account_number", "bank_name", "account_name"
         FROM "User"
         WHERE id = $1`,
        [sessionUser.userId]
      ),
      query<BroadcastRow>(
        `SELECT bm.id, bm.message, bm."createdAt"
         FROM "BroadcastMessage" bm
         LEFT JOIN "BroadcastDismissal" bd
           ON bd."broadcastId" = bm.id
          AND bd."userId" = $1
         WHERE bm."isActive" = true
           AND bd.id IS NULL
         ORDER BY bm."createdAt" DESC`,
        [sessionUser.userId]
      ),
      queryOne<AccountsSummaryRow>(
        `SELECT COUNT(*)::int AS "totalReservedAccounts"
         FROM "UserReservedAccount"
         WHERE "userId" = $1`,
        [sessionUser.userId]
      ),
    ]);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: utf8Headers }
      );
    }

    const tier = (user.role || "USER").toLowerCase() as "user" | "agent" | "admin";

    return NextResponse.json(
      {
        user: {
          id: user.id,
          fullName: user.name,
          phone: user.phone,
          balance:
            typeof user.balance === "number"
              ? user.balance
              : parseFloat(String(user.balance)),
          tier,
          role: user.role,
          isActive: user.isActive,
          accountNumber: user.account_number,
          bankName: user.bank_name,
          accountName: user.account_name,
        },
        broadcasts,
        accountsSummary: {
          totalReservedAccounts: Number(accountsSummaryRow?.totalReservedAccounts || 0),
          hasPrimaryAccount: !!(user.account_number && user.bank_name),
          primaryAccountNumber: user.account_number,
          primaryBankName: user.bank_name,
          primaryAccountName: user.account_name,
        },
      },
      { headers: utf8Headers }
    );
  } catch (error) {
    console.error("Get app bootstrap error:", error);
    return NextResponse.json(
      { error: "Failed to fetch app bootstrap data" },
      { status: 500, headers: utf8Headers }
    );
  }
}
