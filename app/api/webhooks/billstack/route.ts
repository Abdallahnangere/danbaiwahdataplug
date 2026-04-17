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
    console.log("[BILLSTACK_WEBHOOK] Incoming webhook request", {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      headers: {
        contentType: request.headers.get('content-type'),
        signature: request.headers.get('x-wiaxy-signature') ? 'present' : 'missing',
      }
    });

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
      payload.event !== "PAYMENT_NOTIFICATION" ||
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
    // STEP 4: LOOK UP USER BY ACCOUNT NUMBER
    // ═══════════════════════════════════════════════════════════════════════════
    const accountNumber = payload.data.account.account_number;
    const transactionReference = payload.data.reference;
    const amount = parseInt(String(payload.data.amount)) || 0;

    const MAX_BALANCE = 30000; // ₦30,000 limit per user

    if (!accountNumber) {
      console.error("[BILLSTACK_WEBHOOK] Missing account_number");
      return NextResponse.json(
        { status: "processed" },
        { status: 200, headers: utf8Headers }
      );
    }

    const user = await queryOne<{
      id: string;
      balance: number;
    }>(
      `SELECT id, balance FROM "User" WHERE account_number = $1`,
      [accountNumber]
    );

    if (!user) {
      console.warn("[BILLSTACK_WEBHOOK] User not found for account_number", {
        accountNumber,
      });
      return NextResponse.json(
        { status: "processed" },
        { status: 200, headers: utf8Headers }
      );
    }

    console.log("[BILLSTACK_WEBHOOK] User found", { userId: user.id });

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 5: IDEMPOTENCY CHECK - Ensure exact duplicate doesn't exist for this user
    // Idempotency based on COMBINATION of: reference + amount + created_at (BillStack timestamp)
    // This handles BillStack reusing reference for different transactions
    // ═══════════════════════════════════════════════════════════════════════════
    const billstackTimestamp = new Date(payload.data.created_at);
    const billstackTimestampStr = billstackTimestamp.toISOString();

    const existingTransaction = await queryOne<{
      id: string;
      reference: string;
      amount: number;
      created_at: string;
    }>(
      `SELECT id, reference, amount, created_at FROM "Transaction" 
       WHERE user_id = $1 AND reference = $2 AND amount = $3 AND created_at = $4`,
      [user.id, transactionReference, amount, billstackTimestampStr]
    );

    if (existingTransaction) {
      // True duplicate - exact same transaction (reference + amount + timestamp) already exists
      console.log("[BILLSTACK_WEBHOOK] Transaction already processed (exact duplicate)", {
        userId: user.id,
        reference: transactionReference,
        amount,
        billstackTimestamp: billstackTimestampStr,
        dbTimestamp: existingTransaction.created_at,
      });
      return NextResponse.json(
        { status: "processed" },
        { status: 200, headers: utf8Headers }
      );
    }

    console.log("[BILLSTACK_WEBHOOK] New transaction, proceeding with credit", {
      userId: user.id,
      reference: transactionReference,
      amount,
      timestamp: billstackTimestampStr,
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 6: CHECK BALANCE LIMIT AND CREDIT USER WALLET
    // ═══════════════════════════════════════════════════════════════════════════
    // Ensure balance is numeric (handle string values from database)
    const currentBalance = typeof user.balance === 'string' 
      ? parseFloat(user.balance) 
      : user.balance;
    
    let creditAmount = amount;
    let newBalance = currentBalance + amount;

    // Check if balance would exceed limit
    if (newBalance > MAX_BALANCE) {
      console.warn("[BILLSTACK_WEBHOOK] Balance would exceed limit", {
        userId: user.id,
        accountNumber,
        currentBalance,
        depositAmount: amount,
        maxAllowed: MAX_BALANCE,
        calculated: newBalance,
      });
      // Cap balance at limit
      creditAmount = Math.max(0, MAX_BALANCE - currentBalance);
      newBalance = MAX_BALANCE;
    }

    // Update user balance with verification
    const updateResult = await queryOne<{ balance: number }>(
      `UPDATE "User" SET balance = $1 WHERE id = $2 RETURNING balance`,
      [newBalance, user.id]
    );

    if (!updateResult) {
      console.error("[BILLSTACK_WEBHOOK] Failed to update user balance", { userId: user.id });
      return NextResponse.json(
        { status: "processed" },
        { status: 200, headers: utf8Headers }
      );
    }

    console.log("[BILLSTACK_WEBHOOK] User balance updated successfully", {
      userId: user.id,
      oldBalance: currentBalance,
      newBalance: updateResult.balance,
      amount: creditAmount,
    });

    // Create transaction record with actual credited amount
    try {
      await query(
        `INSERT INTO "Transaction" (user_id, amount, reference, type, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          user.id,
          creditAmount,
          transactionReference,
          "deposit",
          "success",
        ]
      );

      console.log("[BILLSTACK_WEBHOOK] Transaction record created", {
        userId: user.id,
        amount: creditAmount,
        reference: transactionReference,
      });
    } catch (insertError: any) {
      // If it's a unique constraint violation, it means this exact transaction (user + ref) was already inserted
      if (insertError.code === "23505" || insertError.message?.includes("unique constraint")) {
        console.warn("[BILLSTACK_WEBHOOK] Transaction record already exists (constraint violation)", {
          userId: user.id,
          reference: transactionReference,
          error: insertError.message,
        });
        // This is OK - balance was already updated, transaction just wasn't logged again
      } else {
        // Other error - log it but don't fail the webhook
        console.error("[BILLSTACK_WEBHOOK] Error creating transaction record", {
          userId: user.id,
          reference: transactionReference,
          error: insertError.message,
        });
      }
    }

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
