import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { queryOne, execute } from "@/lib/db";
import { randomUUID } from "crypto";
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimiter";
import {
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
    const rateLimitCheck = checkRateLimit(phone, "signup", {
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
    resetRateLimit(phone, "signup");

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
      const billstackReference = generateBillStackReference(userId);
      const { firstName, lastName } = splitName(name);

      console.log("[SIGNUP] Creating BillStack virtual account...", {
        userId,
        reference: billstackReference,
        firstName,
        lastName,
        phone,
      });

      const billstackResponse: BillStackVirtualAccountResponse =
        await createBillStackVirtualAccount({
          email,
          reference: billstackReference,
          firstName,
          lastName,
          phone,
          bank: "PALMPAY",
        });

      if (!billstackResponse.status || !billstackResponse.data?.account?.[0]) {
        throw new Error(
          billstackResponse.message || "BillStack account creation failed"
        );
      }

      const account = billstackResponse.data.account[0];

      console.log("[SIGNUP] BillStack account created:", {
        reference: billstackResponse.data.reference,
        accountNumber: account.account_number,
        accountName: account.account_name,
      });

      // Update user with BillStack account details
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
          billstackResponse.data.reference,
          account.account_number,
          account.account_name,
          account.bank_name,
          account.bank_id,
          account.created_at,
          userId,
        ]
      );

      console.log("[SIGNUP] User updated with BillStack details:", { userId });
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
        token,
      },
      { status: 201, headers: utf8Headers }
    );
  } catch (error: any) {
    console.error("[SIGNUP] Error:", error);
    return NextResponse.json(
      { error: "Failed to create account", details: error.message },
      { status: 500, headers: utf8Headers }
    );
  }
}
