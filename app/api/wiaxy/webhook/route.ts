import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  verifyWebhookSignature,
  parseWebhookPayload,
  extractPaymentInfo,
} from "@/lib/wiaxy";

/**
 * Wiaxy/BillStack Webhook Handler
 * POST /api/wiaxy/webhook
 * 
 * Receives payment notifications from Wiaxy when funds are received.
 * Verifies signature, updates transaction status, and credits user balance.
 */

export async function POST(request: NextRequest) {
  try {
    // Get signature from header
    const signature = request.headers.get("x-wiaxy-signature");

    // Verify webhook signature
    if (!verifyWebhookSignature(signature || undefined)) {
      console.error("[API] Wiaxy webhook signature verification failed");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate payload structure
    const payload = parseWebhookPayload(body);
    if (!payload) {
      console.error("[API] Invalid Wiaxy webhook payload");
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    // Extract payment information
    const payment = extractPaymentInfo(payload);

    console.log("[API] Processing Wiaxy payment", {
      reference: payment.wiaxyReference,
      merchantReference: payment.merchantReference,
      amount: payment.amount,
      timestamp: new Date().toISOString(),
    });

    // Find transaction by merchant reference (should be user ID)
    const merchantRef = payment.merchantReference;

    // Check if transaction already exists to avoid duplicates
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        externalReference: payment.wiaxyReference,
      },
    });

    if (existingTransaction) {
      console.log("[API] Transaction already processed", {
        reference: payment.wiaxyReference,
        transactionId: existingTransaction.id,
      });
      return NextResponse.json(
        { success: true, message: "Transaction already processed" },
        { status: 200 }
      );
    }

    // Find user by the merchant reference (merchant_reference should contain user ID)
    const user = await prisma.user.findUnique({
      where: { id: merchantRef },
    });

    if (!user) {
      console.error("[API] User not found for merchant reference", {
        merchantReference: merchantRef,
      });
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "DEPOSIT",
        method: "WIAXY",
        amount: payment.amount,
        status: "COMPLETED",
        externalReference: payment.wiaxyReference,
        reference: payment.merchantReference,
        metadata: {
          wiaxyRef: payment.wiaxyRef,
          accountNumber: payment.accountNumber,
          accountName: payment.accountName,
          bankName: payment.bankName,
          payerName: payment.payerName,
          paymentDate: payment.paymentDate,
        },
      },
    });

    console.log("[API] Transaction created", {
      transactionId: transaction.id,
      userId: user.id,
      amount: payment.amount,
    });

    // Update user balance
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        balance: {
          increment: payment.amount,
        },
      },
    });

    console.log("[API] User balance updated", {
      userId: user.id,
      newBalance: updatedUser.balance,
      amount: payment.amount,
      timestamp: new Date().toISOString(),
    });

    // Success response
    return NextResponse.json(
      {
        success: true,
        message: "Payment processed successfully",
        transactionId: transaction.id,
        newBalance: updatedUser.balance,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Wiaxy webhook processing error", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json(
    {
      message: "Wiaxy webhook endpoint active",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
