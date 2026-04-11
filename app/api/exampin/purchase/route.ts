import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { purchaseExamPin } from "@/lib/saiful";
import { generateReference, generateTransactionRef } from "@/lib/utils";

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
    const { examName, quantity } = body;

    // Validate inputs
    if (!examName || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields: examName, quantity" },
        { status: 400 }
      );
    }

    if (!["WAEC", "NECO", "NABTEB"].includes(examName)) {
      return NextResponse.json(
        { error: "Invalid exam name. Must be WAEC, NECO, or NABTEB" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 5) {
      return NextResponse.json(
        { error: "Quantity must be an integer between 1 and 5" },
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

    // Calculate exam PIN prices
    const examPrices: Record<string, number> = {
      WAEC: 1000,
      NECO: 500,
      NABTEB: 800,
    };

    const unitPrice = examPrices[examName];
    const totalAmount = unitPrice * quantity;

    // Check if user has sufficient balance
    if (userAccount.balance < totalAmount) {
      return NextResponse.json(
        {
          error: `Insufficient wallet balance! Required: ₦${totalAmount.toLocaleString()}, Available: ₦${userAccount.balance.toLocaleString()}`,
          required: totalAmount,
          available: userAccount.balance,
        },
        { status: 402 } // Payment Required
      );
    }

    // Generate reference for idempotency
    const reference = generateReference("EPIN");

    console.log(`[EXAMPIN PURCHASE] User ${user.id} purchasing ${quantity} ${examName} PINs for ₦${totalAmount}`);

    // Call Saiful API to purchase exam PIN
    const epinResult = await purchaseExamPin({
      examName: examName as "WAEC" | "NECO" | "NABTEB",
      quantity,
      reference,
    });

    if (!epinResult.success) {
      console.error(`[EXAMPIN FAILED] ${epinResult.message}`);

      // Check for specific error messages
      if (
        epinResult.message.includes("daily") ||
        epinResult.message.includes("Limit")
      ) {
        return NextResponse.json(
          { error: epinResult.message },
          { status: 429 } // Too Many Requests
        );
      }

      if (epinResult.message.includes("KYC") || epinResult.message.includes("restricted")) {
        return NextResponse.json(
          { error: epinResult.message },
          { status: 403 } // Forbidden
        );
      }

      return NextResponse.json(
        { error: epinResult.message },
        { status: 400 }
      );
    }

    // Deduct amount from wallet
    const updatedAccount = await db.account.update({
      where: { userId: user.id },
      data: { balance: userAccount.balance - totalAmount },
      select: { balance: true },
    });

    // Record transaction
    const transaction = await db.transaction.create({
      data: {
        userId: user.id,
        type: "EXAMPIN_PURCHASE",
        description: `${quantity} ${examName} Exam PIN${quantity > 1 ? "s" : ""}`,
        amount: totalAmount,
        status: "COMPLETED",
        phone: user.id, // Using userId since phone is not needed for exam pins
        reference: reference,
        externalReference: epinResult.data?.ident || reference,
        metadata: {
          examName,
          quantity,
          unitPrice,
          description: `${quantity} ${examName} Exam PIN${quantity > 1 ? "s" : ""}`,
          ...(epinResult.data && {
            balanceBefore: epinResult.data.balance_before,
            balanceAfter: epinResult.data.balance_after,
            timestamp: epinResult.data.create_date,
          }),
        },
      },
    });

    console.log(`[EXAMPIN SUCCESS] Transaction ${transaction.id} completed. New balance: ₦${updatedAccount.balance}`);

    return NextResponse.json(
      {
        success: true,
        message: epinResult.message,
        transaction: {
          id: transaction.id,
          reference: transaction.reference,
          externalReference: transaction.externalReference,
          type: transaction.type,
          description: transaction.description,
          amount: transaction.amount,
          quantity,
          examName,
          status: transaction.status,
          timestamp: transaction.createdAt,
        },
        balance: updatedAccount.balance,
        apiResponse: epinResult.data,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[EXAMPIN API ERROR]", {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        error: "An error occurred while processing your request",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
