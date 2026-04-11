import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { subscribeToCable } from "@/lib/saiful";
import { generateReference, generateTransactionRef } from "@/lib/utils";

// Cable provider info
const CABLE_PROVIDERS = {
  DSTV: {
    name: "DSTV",
    plans: [
      { id: 1, name: "DStv Padi", amount: 2500 },
      { id: 2, name: "DStv Yanga", amount: 3500 },
      { id: 3, name: "DStv Confam", amount: 6200 },
      { id: 4, name: "DStv Premium", amount: 24500 },
    ],
  },
  GOTV: {
    name: "GOtv",
    plans: [
      { id: 5, name: "GOtv Smallie", amount: 1100 },
      { id: 6, name: "GOtv Jinja", amount: 2250 },
      { id: 7, name: "GOtv Jolli", amount: 3300 },
      { id: 8, name: "GOtv Max", amount: 4850 },
    ],
  },
  STARTIME: {
    name: "Startimes",
    plans: [
      { id: 9, name: "Startimes Nova", amount: 1950 },
      { id: 10, name: "Startimes Nova+ Plus", amount: 3500 },
      { id: 11, name: "Startimes Smart", amount: 5000 },
    ],
  },
};

// Get plan amount by provider and plan ID
function getPlanAmount(provider: string, planId: number): number | null {
  const providerPlans = CABLE_PROVIDERS[provider as keyof typeof CABLE_PROVIDERS];
  if (!providerPlans) return null;

  const plan = providerPlans.plans.find((p) => p.id === planId);
  return plan?.amount || null;
}

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
    const { cableName, planId, smartCardNumber } = body;

    // Validate inputs
    if (!cableName || !planId || !smartCardNumber) {
      return NextResponse.json(
        { error: "Missing required fields: cableName, planId, smartCardNumber" },
        { status: 400 }
      );
    }

    if (!["DSTV", "GOTV", "STARTIME"].includes(cableName)) {
      return NextResponse.json(
        { error: "Invalid cable provider. Must be DSTV, GOTV, or STARTIME" },
        { status: 400 }
      );
    }

    // Get plan amount
    const amount = getPlanAmount(cableName, planId);
    if (!amount) {
      return NextResponse.json(
        { error: "Invalid plan ID for the selected cable provider" },
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
    const reference = generateReference("CS");

    console.log(
      `[CABLE SUBSCRIPTION] User ${user.id} subscribing to ${cableName} plan ${planId} for ₦${amount}`
    );

    // Call Saiful API to process subscription
    const subscriptionResult = await subscribeToCable({
      cableName: cableName as "DSTV" | "GOTV" | "STARTIME",
      planId,
      smartCardNumber,
      reference,
    });

    if (!subscriptionResult.success) {
      console.error(`[CABLE SUBSCRIPTION FAILED] ${subscriptionResult.message}`);

      // Check for specific error messages
      if (subscriptionResult.message.includes("daily") || subscriptionResult.message.includes("Limit")) {
        return NextResponse.json(
          { error: subscriptionResult.message },
          { status: 429 } // Too Many Requests
        );
      }

      if (subscriptionResult.message.includes("KYC") || subscriptionResult.message.includes("restricted")) {
        return NextResponse.json(
          { error: subscriptionResult.message },
          { status: 403 } // Forbidden
        );
      }

      if (subscriptionResult.message.includes("unavailable")) {
        return NextResponse.json(
          { error: subscriptionResult.message },
          { status: 503 } // Service Unavailable
        );
      }

      return NextResponse.json(
        { error: subscriptionResult.message },
        { status: 400 }
      );
    }

    // Deduct amount from wallet
    const updatedAccount = await db.account.update({
      where: { userId: user.id },
      data: { balance: userAccount.balance - amount },
      select: { balance: true },
    });

    // Find plan details for description
    const providerPlans = CABLE_PROVIDERS[cableName as keyof typeof CABLE_PROVIDERS];
    const planName = providerPlans?.plans.find((p) => p.id === planId)?.name || `Plan ${planId}`;

    // Record transaction
    const transaction = await db.transaction.create({
      data: {
        userId: user.id,
        type: "cable",
        service: cableName,
        amount: amount,
        status: "completed",
        externalId: subscriptionResult.data?.ident || reference,
        metadata: {
          cableName,
          planId,
          planName,
          smartCardNumber,
          description: subscriptionResult.data?.description,
          ...(subscriptionResult.data && {
            balanceBefore: subscriptionResult.data.balance_before,
            balanceAfter: subscriptionResult.data.balance_after,
            timestamp: subscriptionResult.data.create_date,
          }),
        },
      },
    });

    console.log(
      `[CABLE SUBSCRIPTION SUCCESS] Transaction ${transaction.id} completed. New balance: ₦${updatedAccount.balance}`
    );

    return NextResponse.json(
      {
        success: true,
        message: subscriptionResult.message,
        transaction: {
          id: transaction.id,
          reference: transaction.externalId,
          type: transaction.type,
          service: transaction.service,
          amount: transaction.amount,
          planName,
          cableName,
          smartCardNumber,
          status: transaction.status,
          timestamp: transaction.createdAt,
        },
        balance: updatedAccount.balance,
        apiResponse: subscriptionResult.data,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[CABLE SUBSCRIPTION API ERROR]", {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        error: "An error occurred while processing the subscription",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
