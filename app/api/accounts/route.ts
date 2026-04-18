import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { execute, query, queryOne } from "@/lib/db";
import {
  BILLSTACK_BANKS,
  BillStackAccount,
  BillStackBankCode,
  createBillStackVirtualAccount,
  generateBillStackReference,
  splitName,
} from "@/lib/billstack";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const utf8Headers = { "Content-Type": "application/json; charset=utf-8" };

type ReservedAccountRow = {
  id: string;
  billstackReference: string | null;
  accountNumber: string;
  accountName: string | null;
  bankName: string | null;
  bankId: string;
  isPrimary: boolean;
  createdAt: string;
};

type UserPrimaryAccountRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  billstack_reference: string | null;
  account_number: string | null;
  account_name: string | null;
  bank_name: string | null;
  bank_id: string | null;
  billstack_created_at: string | null;
};

const normalizeAccounts = (
  accounts: ReservedAccountRow[],
  fallbackUser?: UserPrimaryAccountRow | null
) => {
  const normalized = [...accounts];

  if (
    fallbackUser?.account_number &&
    fallbackUser.bank_id &&
    !normalized.some((account) => account.bankId === fallbackUser.bank_id)
  ) {
    normalized.unshift({
      id: "primary-user-account",
      billstackReference: fallbackUser.billstack_reference,
      accountNumber: fallbackUser.account_number,
      accountName: fallbackUser.account_name,
      bankName: fallbackUser.bank_name,
      bankId: fallbackUser.bank_id,
      isPrimary: true,
      createdAt:
        fallbackUser.billstack_created_at || new Date().toISOString(),
    });
  }

  return normalized.sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
};

const getUserPrimaryAccount = async (userId: string) =>
  queryOne<UserPrimaryAccountRow>(
    `SELECT id, name, email, phone, "billstack_reference", "account_number", "account_name", "bank_name", "bank_id", "billstack_created_at"
     FROM "User"
     WHERE id = $1`,
    [userId]
  );

const syncPrimaryAccountRow = async (
  userId: string,
  user: UserPrimaryAccountRow | null
) => {
  if (!user?.account_number || !user.bank_id) return;

  const existing = await queryOne<{ id: string }>(
    `SELECT id
     FROM "UserReservedAccount"
     WHERE "userId" = $1 AND "bankId" = $2`,
    [userId, user.bank_id]
  );

  if (existing) return;

  await execute(
    `INSERT INTO "UserReservedAccount"
     ("userId", "billstackReference", "accountNumber", "accountName", "bankName", "bankId", "isPrimary", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, true, $7, NOW())`,
    [
      userId,
      user.billstack_reference,
      user.account_number,
      user.account_name,
      user.bank_name,
      user.bank_id,
      user.billstack_created_at || new Date().toISOString(),
    ]
  );
};

const createReservedAccountForUser = async (
  userId: string,
  bank: BillStackBankCode
) => {
  const user = await getUserPrimaryAccount(userId);
  if (!user || !user.name || !user.email || !user.phone) {
    throw new Error("User profile is incomplete for account creation");
  }

  await syncPrimaryAccountRow(userId, user);

  const existingAccount = await queryOne<{ id: string }>(
    `SELECT id
     FROM "UserReservedAccount"
     WHERE "userId" = $1 AND "bankId" = $2`,
    [userId, bank]
  );

  if (existingAccount || (user.bank_id === bank && user.account_number)) {
    throw new Error(`${bank} account already exists`);
  }

  const { firstName, lastName } = splitName(user.name);
  const reference = generateBillStackReference(userId, bank);
  const billstackResponse = await createBillStackVirtualAccount({
    email: user.email,
    reference,
    firstName,
    lastName,
    phone: user.phone,
    bank,
  });

  const account = billstackResponse.data?.account?.[0] as BillStackAccount | undefined;
  if (!account) {
    throw new Error("Billstack did not return an account");
  }

  const hasPrimary =
    !!user.account_number ||
    !!(await queryOne<{ id: string }>(
      `SELECT id
       FROM "UserReservedAccount"
       WHERE "userId" = $1 AND "isPrimary" = true`,
      [userId]
    ));

  const isPrimary = !hasPrimary;

  await queryOne<{ id: string }>(
    `INSERT INTO "UserReservedAccount"
     ("userId", "billstackReference", "accountNumber", "accountName", "bankName", "bankId", "isPrimary", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     RETURNING id`,
    [
      userId,
      billstackResponse.data?.reference || reference,
      account.account_number,
      account.account_name,
      account.bank_name,
      account.bank_id,
      isPrimary,
      account.created_at,
    ]
  );

  if (isPrimary) {
    await execute(
      `UPDATE "User"
       SET "billstack_reference" = $1,
           "account_number" = $2,
           "account_name" = $3,
           "bank_name" = $4,
           "bank_id" = $5,
           "billstack_created_at" = $6
       WHERE id = $7`,
      [
        billstackResponse.data?.reference || reference,
        account.account_number,
        account.account_name,
        account.bank_name,
        account.bank_id,
        account.created_at,
        userId,
      ]
    );
  }

  return {
    billstackReference: billstackResponse.data?.reference || reference,
    accountNumber: account.account_number,
    accountName: account.account_name,
    bankName: account.bank_name,
    bankId: account.bank_id,
    isPrimary,
    createdAt: account.created_at,
  };
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

    const accounts = await query<ReservedAccountRow>(
      `SELECT id, "billstackReference", "accountNumber", "accountName", "bankName", "bankId", "isPrimary", "createdAt"
       FROM "UserReservedAccount"
       WHERE "userId" = $1
       ORDER BY "isPrimary" DESC, "createdAt" ASC`,
      [sessionUser.userId]
    );

    const user = await getUserPrimaryAccount(sessionUser.userId);
    const normalizedAccounts = normalizeAccounts(accounts, user);

    return NextResponse.json({ accounts: normalizedAccounts }, { headers: utf8Headers });
  } catch (error) {
    console.error("Get accounts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500, headers: utf8Headers }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401, headers: utf8Headers }
      );
    }

    const body = await request.json();
    const bankId = String(body?.bankId || "").toUpperCase() as BillStackBankCode;

    if (!BILLSTACK_BANKS.includes(bankId)) {
      return NextResponse.json(
        { error: "Invalid bank selected" },
        { status: 400, headers: utf8Headers }
      );
    }

    const createdAccount = await createReservedAccountForUser(
      sessionUser.userId,
      bankId
    );
    const accounts = await query<ReservedAccountRow>(
      `SELECT id, "billstackReference", "accountNumber", "accountName", "bankName", "bankId", "isPrimary", "createdAt"
       FROM "UserReservedAccount"
       WHERE "userId" = $1
       ORDER BY "isPrimary" DESC, "createdAt" ASC`,
      [sessionUser.userId]
    );
    const user = await getUserPrimaryAccount(sessionUser.userId);

    return NextResponse.json(
      {
        message: `${bankId} account created successfully`,
        account: createdAccount,
        accounts: normalizeAccounts(accounts, user),
      },
      { status: 201, headers: utf8Headers }
    );
  } catch (error) {
    console.error("Create account error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create account";
    const status =
      message.includes("already exists") || message.includes("incomplete")
        ? 400
        : 500;

    return NextResponse.json(
      { error: message },
      { status, headers: utf8Headers }
    );
  }
}
