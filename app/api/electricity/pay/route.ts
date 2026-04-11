import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { payElectricityBill } from "@/lib/saiful";
import { generateReference, generateTransactionRef } from "@/lib/utils";

// DISCO ID mapping
const DISCO_IDS: Record<string, number> = {
  "ikeja-electric": 1,
  "eko-electric": 2,
  "abuja-electric": 3,
  "kano-electric": 4,
  "enugu-electric": 5,
  "portharcourt-electric": 6,
  "ibadan-electric": 7,
  "kaduna-electric": 8,
  "jos-electric": 9,
  "benin-electric": 10,
  "yola-electric": 11,
};

// Reverse map for ID to name
const DISCO_NAMES: Record<number, string> = {
  1: "Ikeja Electric",
  2: "Eko Electric",
  3: "Abuja Electric",
  4: "Kano Electric",
  5: "Enugu Electric",
  6: "Port Harcourt Electric",
  7: "Ibadan Electric",
  8: "Kaduna Electric",
  9: "Jos Electric",
  10: "Benin Electric",
  11: "Yola Electric",
};

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { meterType, phoneNumber, customerName, meterNumber, disco, amount } = body;

    // Validate inputs
    if (!meterType || !phoneNumber || !customerName || !meterNumber || !disco || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: meterType, phoneNumber, customerName, meterNumber, disco, amount" },
        { status: 400 }
      );
    }

    if (!["prepaid", "postpaid"].includes(meterType)) {
      return NextResponse.json(
        { error: "Invalid meter type. Must be prepaid or postpaid" },
        { status: 400 }
      );
    }

    if (amount < 1000) {
      return NextResponse.json(
        {
          error: "Minimum payment amount is ₦1,000",
          required: 1000,
          provided: amount,
        },
        { status: 400 }
      );
    }

    // Get DISCO ID
    const discoId = DISCO_IDS[disco.toLowerCase()];
    if (!discoId) {
      return NextResponse.json(
        { error: "Invalid electricity distributor" },
        { status: 400 }
      );
    }

    // Get user's wallet balance
    const userAccount = await db.account.findUnique({
      where: { userId: user.id },
      select: { balance: true },
    });

    if (!userAccount) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    // Check if user has sufficient balance
    if (userAccount.balance < amount) {
      return NextResponse.json(
        {
          error: `Insufficient wallet balance! Required: ₦${amount.toLocaleString()}, Available: ₦${userAccount.balance.toLocaleString()}`,
          required: amount,
          available: userAccount.balance,
        },
        { status: 402 } // Payment Required
      );
    }

    // Generate reference for idempotency
    const reference = generateReference("EB");

    console.log(
      `[ELECTRICITY BILL PAYMENT] User ${user.id} paying ₦${amount} for meter ${meterNumber} (${DISCO_NAMES[discoId]})`
    );

    // Call Saiful API to process payment
    const paymentResult = await payElectricityBill({
      meterType: meterType as "prepaid" | "postpaid",
      phoneNumber,
      name: customerName,
      meterNumber,
      discoId,
      amount,
      reference,
    });

    if (!paymentResult.success) {
      console.error(`[ELECTRICITY BILL PAYMENT FAILED] ${paymentResult.message}`);

      // Check for specific error messages
      if (paymentResult.message.includes("daily") || paymentResult.message.includes("Limit")) {
        return NextResponse.json(
          { error: paymentResult.message },
          { status: 429 } // Too Many Requests
        );
      }

      if (paymentResult.message.includes("KYC") || paymentResult.message.includes("restricted")) {
        return NextResponse.json(
          { error: paymentResult.message },
          { status: 403 } // Forbidden
        );
      }

      if (paymentResult.message.includes("unavailable")) {
        return NextResponse.json(
          { error: paymentResult.message },
          { status: 503 } // Service Unavailable
        );
      }

      return NextResponse.json(
        { error: paymentResult.message },
        { status: 400 }
      );
    }

    // Deduct amount from wallet
    const updatedAccount = await db.account.update({
      where: { userId: user.id },
      data: { balance: userAccount.balance - amount },
      select: { balance: true },
    });

    // Record transaction
    const transaction = await db.transaction.create({
      data: {
        userId: user.id,
        type: "ELECTRICITY_PAYMENT",
        description: `Payment for ${DISCO_NAMES[discoId]}`,
        amount: amount,
        status: "COMPLETED",
        phone: phoneNumber,
        reference: reference,
        externalReference: paymentResult.data?.reference || reference,
        metadata: {
          meterType,
          meterNumber,
          customerName,
          disco: DISCO_NAMES[discoId],
          discoId,
          token: paymentResult.data?.token || null,
          description: paymentResult.data?.description,
          ...(paymentResult.data && {
            balanceBefore: paymentResult.data.balance_before,
            balanceAfter: paymentResult.data.balance_after,
            timestamp: paymentResult.data.date,
          }),
        },
      },
    });

    console.log(
      `[ELECTRICITY BILL PAYMENT SUCCESS] Transaction ${transaction.id} completed. New balance: ₦${updatedAccount.balance}`
    );

    return NextResponse.json(
      {
        success: true,
        message: paymentResult.message,
        transaction: {
          id: transaction.id,
          reference: transaction.reference,
          externalReference: transaction.externalReference,
          type: transaction.type,
          description: transaction.description,
          amount: transaction.amount,
          status: transaction.status,
          meterNumber,
          customerName,
          disco: DISCO_NAMES[discoId],
          token: paymentResult.data?.token || null,
          timestamp: transaction.createdAt,
        },
        balance: updatedAccount.balance,
        apiResponse: paymentResult.data,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[ELECTRICITY BILL PAYMENT API ERROR]", {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        error: "An error occurred while processing the payment",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
