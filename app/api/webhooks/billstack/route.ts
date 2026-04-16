import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { queryOne, query } from "@/lib/db";

export const dynamic = 'force-dynamic';

const utf8Headers = { "Content-Type": "application/json; charset=utf-8" };

interface BillStackWebhookPayload {
  event: string;
  data: {
    type: string;
    reference: string;
    merchant_reference: string;
    wiaxy_ref: string;
    amount: string | number;
    created_at: string;
    account: {
      account_number: string;
      account_name: string;
      bank_name: string;
      created_at: string;
    };
    payer: {
      account_number: string;
      first_name: string;
      last_name: string;
      createdAt: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log("[BILLSTACK_WEBHOOK] Incoming webhook request");

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1: VERIFY SIGNATURE
    // ═══════════════════════════════════════════════════════════════════════════
    const signature = request.headers.get("x-wiaxy-signature");

    if (!signature) {
      console.error("[BILLSTACK_WEBHOOK] Missing x-wiaxy-signature header");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401, headers: utf8Headers }
      );
    }

    const secretKey = process.env.BILLSTACK_SECRET_KEY;
    if (!secretKey) {
      console.error("[BILLSTACK_WEBHOOK] BILLSTACK_SECRET_KEY not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 401, headers: utf8Headers }
      );
    }

    // Calculate MD5 hash of secret key
    const expectedSignature = createHash("md5").update(secretKey).digest("hex");

    if (signature !== expectedSignature) {
      console.error("[BILLSTACK_WEBHOOK] Signature verification failed", {
        provided: signature,
        expected: expectedSignature,
      });
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401, headers: utf8Headers }
      );
    }

    console.log("[BILLSTACK_WEBHOOK] Signature verified successfully");

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2: PARSE WEBHOOK PAYLOAD
    // ═══════════════════════════════════════════════════════════════════════════
    const payload: BillStackWebhookPayload = await request.json();

    console.log("[BILLSTACK_WEBHOOK] Payload received", {
      event: payload.event,
      type: payload.data?.type,
      reference: payload.data?.reference,
      merchant_reference: payload.data?.merchant_reference,
      amount: payload.data?.amount,
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3: VALIDATE EVENT AND TYPE
    // ═══════════════════════════════════════════════════════════════════════════
    if (
      payload.event !== "PAYMENT_NOTIFIFICATION" ||
      payload.data?.type !== "RESERVED_ACCOUNT_TRANSACTION"
    ) {
      console.log("[BILLSTACK_WEBHOOK] Event/type mismatch, ignoring", {
        event: payload.event,
        type: payload.data?.type,
      });
      return NextResponse.json(
        { status: "ignored" },
        { status: 200, headers: utf8Headers }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 4: LOOK UP USER BY BILLSTACK REFERENCE
    // ═══════════════════════════════════════════════════════════════════════════
    const merchantReference = payload.data.merchant_reference;
    const transactionReference = payload.data.reference;
    const amount = parseInt(String(payload.data.amount)) || 0;

    if (!merchantReference) {
      console.error("[BILLSTACK_WEBHOOK] Missing merchant_reference");
      return NextResponse.json(
        { status: "processed" },
        { status: 200, headers: utf8Headers }
      );
    }

    const user = await queryOne<{
      id: string;
      balance: number;
    }>(
      `SELECT id, balance FROM "User" WHERE "billstack_reference" = $1`,
      [merchantReference]
    );

    if (!user) {
      console.warn("[BILLSTACK_WEBHOOK] User not found for reference", {
        merchantReference,
      });
      return NextResponse.json(
        { status: "processed" },
        { status: 200, headers: utf8Headers }
      );
    }

    console.log("[BILLSTACK_WEBHOOK] User found", { userId: user.id });

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 5: IDEMPOTENCY CHECK - Ensure transaction doesn't already exist
    // ═══════════════════════════════════════════════════════════════════════════
    const existingTransaction = await queryOne<{ id: string }>(
      `SELECT id FROM "Transaction" WHERE reference = $1`,
      [transactionReference]
    );

    if (existingTransaction) {
      console.log("[BILLSTACK_WEBHOOK] Transaction already processed", {
        reference: transactionReference,
      });
      return NextResponse.json(
        { status: "processed" },
        { status: 200, headers: utf8Headers }
      );
    }

    console.log("[BILLSTACK_WEBHOOK] New transaction, proceeding with credit");

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 6: CREDIT USER WALLET AND CREATE TRANSACTION RECORD
    // ═══════════════════════════════════════════════════════════════════════════
    const newBalance = user.balance + amount;

    // Update user balance
    await query(
      `UPDATE "User" SET balance = $1 WHERE id = $2`,
      [newBalance, user.id]
    );

    console.log("[BILLSTACK_WEBHOOK] User balance updated", {
      userId: user.id,
      oldBalance: user.balance,
      newBalance,
      amount,
    });

    // Create transaction record
    await query(
      `INSERT INTO "Transaction" (user_id, amount, reference, type, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        user.id,
        amount,
        transactionReference,
        "deposit",
        "success",
      ]
    );

    console.log("[BILLSTACK_WEBHOOK] Transaction record created", {
      userId: user.id,
      amount,
      reference: transactionReference,
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 7: RESPOND WITH SUCCESS
    // ═══════════════════════════════════════════════════════════════════════════
    return NextResponse.json(
      { status: "processed", userId: user.id, newBalance },
      { status: 200, headers: utf8Headers }
    );
  } catch (error) {
    console.error("[BILLSTACK_WEBHOOK] Error processing webhook", error);
    // Always return 200 for safety, so BillStack doesn't keep retrying
    return NextResponse.json(
      { status: "processed", error: "Server error handled" },
      { status: 200, headers: utf8Headers }
    );
  }
}
