import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { queryOne, execute } from "@/lib/db";
import { randomUUID } from "crypto";
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimiter";
import {
  BillStackAccount,
  BillStackBankCode,
  BILLSTACK_BANKS,
  createBillStackVirtualAccount,
  generateBillStackReference,
  splitName,
  BillStackVirtualAccountResponse,
} from "@/lib/billstack";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const utf8Headers = { "Content-Type": "application/json; charset=utf-8" };
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, pin, confirmPin, acceptTerms } = body;

    // Validation
    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400, headers: utf8Headers }
      );
    }

    if (!phone || !/^0[0-9]{10}$/.test(phone)) {
      return NextResponse.json(
        { error: "Phone number must be 11 digits starting with 0" },
        { status: 400, headers: utf8Headers }
      );
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Enter a valid email address" },
        { status: 400, headers: utf8Headers }
      );
    }

    if (!pin || !/^\d{6}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 6 digits" },
        { status: 400, headers: utf8Headers }
      );
    }

    if (!confirmPin || pin !== confirmPin) {
      return NextResponse.json(
        { error: "PINs don't match" },
        { status: 400, headers: utf8Headers }
      );
    }

    if (!acceptTerms) {
      return NextResponse.json(
        { error: "You must accept the terms and conditions" },
        { status: 400, headers: utf8Headers }
      );
    }

    // Check rate limit for signup attempts
    const rateLimitCheck = await checkRateLimit(phone, "signup", {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
    });

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Too many signup attempts. Please try again later.",
          retryAfter: rateLimitCheck.resetTime,
        },
        { status: 429, headers: utf8Headers }
      );
    }

    // Check if phone already exists
    const existingPhone = await queryOne<{ id: string }>(
      `SELECT id FROM "User" WHERE phone = $1`,
      [phone]
    );

    if (existingPhone) {
      return NextResponse.json(
        { error: "Phone number already registered" },
        { status: 409, headers: utf8Headers }
      );
    }

    const existingEmail = await queryOne<{ id: string }>(
      `SELECT id FROM "User" WHERE email = $1`,
      [email]
    );

    if (existingEmail) {
      return NextResponse.json(
        { error: "Email address already registered" },
        { status: 409, headers: utf8Headers }
      );
    }

    // Reset rate limit on successful signup
    await resetRateLimit(phone, "signup");

    // Hash PIN using bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(pin, salt);

    // Create user
    const userId = randomUUID();
    const now = new Date().toISOString();

    const result = await queryOne<{ id: string }>(
      `INSERT INTO "User" (id, name, email, phone, "pin", balance, role, "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, name, email, phone, balance, role`,
      [userId, name, email, phone, hashedPin, 0, "USER", true, now, now]
    );

    if (!result) {
      throw new Error("Failed to create user");
    }

    console.log("[SIGNUP] User created successfully:", { userId, phone, name });

    // ─── BILLSTACK VIRTUAL ACCOUNT CREATION ─────────────────────────────────
    try {
      const { firstName, lastName } = splitName(name);
      const createdAccounts: Array<{
        bank: BillStackBankCode;
        reference: string;
        account: BillStackAccount;
      }> = [];

      for (const bank of BILLSTACK_BANKS) {
        const billstackReference = generateBillStackReference(userId, bank);

        console.log("[SIGNUP] Creating BillStack virtual account...", {
          userId,
          reference: billstackReference,
          firstName,
          lastName,
          phone,
          bank,
        });

        try {
          const billstackResponse: BillStackVirtualAccountResponse =
            await createBillStackVirtualAccount({
              email,
              reference: billstackReference,
              firstName,
              lastName,
              phone,
              bank,
            });

          if (billstackResponse.status && billstackResponse.data?.account?.[0]) {
            createdAccounts.push({
              bank,
              reference: billstackResponse.data.reference,
              account: billstackResponse.data.account[0],
            });
          }
        } catch (singleBankError) {
          console.error("[SIGNUP] BillStack bank creation failed:", {
            userId,
            bank,
            error:
              singleBankError instanceof Error
                ? singleBankError.message
                : String(singleBankError),
          });
        }
      }

      if (createdAccounts.length === 0) {
        throw new Error("Unable to create any virtual account at the moment");
      }

      const primaryAccount =
        createdAccounts.find((entry) => entry.bank === "PALMPAY") ||
        createdAccounts[0];

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
          primaryAccount.reference,
          primaryAccount.account.account_number,
          primaryAccount.account.account_name,
          primaryAccount.account.bank_name,
          primaryAccount.account.bank_id,
          primaryAccount.account.created_at,
          userId,
        ]
      );

      for (const entry of createdAccounts) {
        await execute(
          `INSERT INTO "UserReservedAccount"
           ("userId", "billstackReference", "accountNumber", "accountName", "bankName", "bankId", "isPrimary", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
          [
            userId,
            entry.reference,
            entry.account.account_number,
            entry.account.account_name,
            entry.account.bank_name,
            entry.account.bank_id,
            entry.account.bank_id === primaryAccount.account.bank_id,
            entry.account.created_at,
          ]
        );
      }

      console.log("[SIGNUP] User updated with BillStack details:", {
        userId,
        accountCount: createdAccounts.length,
        primaryBank: primaryAccount.account.bank_id,
      });
    } catch (billstackError) {
      // BillStack failed - delete the user and return error
      console.error("[SIGNUP] BillStack integration failed:", billstackError);

      try {
        await execute(`DELETE FROM "User" WHERE id = $1`, [userId]);
        console.log("[SIGNUP] User deleted due to BillStack failure:", { userId });
      } catch (deleteError) {
        console.error("[SIGNUP] Failed to delete user:", deleteError);
      }

      const errorMessage =
        billstackError instanceof Error
          ? billstackError.message
          : "Failed to create virtual account";

      return NextResponse.json(
        {
          error: "Account creation failed",
          details:
            "Virtual account creation failed. " +
            errorMessage +
            " Please try again.",
        },
        { status: 500, headers: utf8Headers }
      );
    }

    // ─── GENERATE TOKEN AND SET COOKIE ─────────────────────────────────────

    // Generate JWT token
    const token = await signToken({
      userId,
      phone,
      role: "USER" as const,
    });

    // Set secure cookie - using standardized name
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    // Fetch user with BillStack details for response
    const userWithBillStack = await queryOne<any>(
      `SELECT id, name, email, phone, balance, role, "billstack_reference", 
              "account_number", "account_name", "bank_name", "bank_id"
       FROM "User" WHERE id = $1`,
      [userId]
    );

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: userId,
          name,
          email,
          phone,
          balance: 0,
          role: "USER",
          billstackReference: userWithBillStack?.billstack_reference,
          accountNumber: userWithBillStack?.account_number,
          accountName: userWithBillStack?.account_name,
          bankName: userWithBillStack?.bank_name,
          bankId: userWithBillStack?.bank_id,
        },
      },
      { status: 201, headers: utf8Headers }
    );
  } catch (error: any) {
    console.error("[SIGNUP] Error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500, headers: utf8Headers }
    );
  }
}
