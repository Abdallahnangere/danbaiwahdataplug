import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const utf8Headers = { "Content-Type": "application/json; charset=utf-8" };

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401, headers: utf8Headers }
      );
    }

    const accounts = await query<{
      id: string;
      billstackReference: string | null;
      accountNumber: string;
      accountName: string | null;
      bankName: string | null;
      bankId: string;
      isPrimary: boolean;
      createdAt: string;
    }>(
      `SELECT id, "billstackReference", "accountNumber", "accountName", "bankName", "bankId", "isPrimary", "createdAt"
       FROM "UserReservedAccount"
       WHERE "userId" = $1
       ORDER BY "isPrimary" DESC, "createdAt" ASC`,
      [sessionUser.userId]
    );

    if (accounts.length > 0) {
      return NextResponse.json({ accounts }, { headers: utf8Headers });
    }

    const user = await queryOne<{
      billstack_reference: string | null;
      account_number: string | null;
      account_name: string | null;
      bank_name: string | null;
      bank_id: string | null;
      billstack_created_at: string | null;
    }>(
      `SELECT "billstack_reference", "account_number", "account_name", "bank_name", "bank_id", "billstack_created_at"
       FROM "User"
       WHERE id = $1`,
      [sessionUser.userId]
    );

    const fallbackAccounts =
      user?.account_number && user?.bank_id
        ? [
            {
              id: "primary-user-account",
              billstackReference: user.billstack_reference,
              accountNumber: user.account_number,
              accountName: user.account_name,
              bankName: user.bank_name,
              bankId: user.bank_id,
              isPrimary: true,
              createdAt: user.billstack_created_at,
            },
          ]
        : [];

    return NextResponse.json({ accounts: fallbackAccounts }, { headers: utf8Headers });
  } catch (error) {
    console.error("Get accounts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500, headers: utf8Headers }
    );
  }
}
