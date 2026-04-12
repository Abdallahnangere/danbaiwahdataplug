import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  let transactionId: string | null = null;

  try {
    // 1. AUTHENTICATE USER
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const userId = sessionUser.userId;

    // 2. PARSE REQUEST BODY
    const body = await request.json();
    const { planId, phone, pin } = body;

    if (!planId || !phone || !pin) {
      return NextResponse.json(
        { error: "planId, phone, and pin are required" },
        { status: 400 }
      );
    }

    // 3. RE-VALIDATE PIN
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pin: true, balance: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!user.pin) {
      return NextResponse.json(
        { error: "PIN not set. Please set your PIN first." },
        { status: 400 }
      );
    }

    const isPinValid = await bcrypt.compare(pin, user.pin);
    if (!isPinValid) {
      return NextResponse.json(
        { error: "Incorrect PIN." },
        { status: 401 }
      );
    }

    // 4. LOAD PLAN
    const plan = await prisma.dataPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: "Plan not available." },
        { status: 404 }
      );
    }

    // 5. BALANCE CHECK
    if (!user.balance || user.balance < plan.price) {
      return NextResponse.json(
        { error: "Insufficient wallet balance." },
        { status: 402 }
      );
    }

    // 6. GENERATE REFERENCE
    const customerRef = `DAT-${Date.now()}-${userId.slice(-6)}`;

    // 7. CREATE PENDING TRANSACTION (and debit wallet atomically)
    const result = await prisma.$transaction(async (tx: any) => {
      // Create transaction
      const transaction = await tx.dataTransaction.create({
        data: {
          userId,
          planId,
          phone,
          networkId: plan.networkId as any,
          amount: plan.price as any,
          providerUsed: plan.activeApi,
          customerRef,
          status: "PENDING",
          balanceBefore: user.balance as any,
        },
      });

      transactionId = transaction.id;

      // Debit wallet
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          balance: {
            decrement: plan.price as any,
          },
        },
        select: { balance: true },
      });

      return {
        transaction,
        newBalance: updatedUser.balance,
      };
    });

    const { transaction, newBalance } = result;
    const balanceAfterDebit = newBalance;

    // 8. CALL PROVIDER
    let providerRef: string | null = null;
    let providerResponse: string | null = null;
    let providerSuccess = false;

    try {
      if (plan.activeApi === "A") {
        // SMEPlug API
        const smePlugResponse = await fetch(
          `${process.env.SMEPLUG_BASE_URL}/data/purchase`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.SMEPLUG_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              network_id: plan.networkId,
              plan_id: plan.apiAId,
              phone,
              customer_reference: customerRef,
            }),
          }
        );

        const smePlugData = await smePlugResponse.json();

        if (smePlugData.status === true) {
          providerSuccess = true;
          providerRef = smePlugData.reference || smePlugData.ref || customerRef;
          providerResponse = smePlugData.msg || "Success";
        } else {
          providerResponse = smePlugData.msg || "Provider request failed";
        }
      } else if (plan.activeApi === "B") {
        // Provider B API
        const providerBResponse = await fetch(
          `${process.env.PROVIDER_B_BASE_URL}/data`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.PROVIDER_B_TOKEN}`,
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              plan: plan.apiBId,
              mobile_number: phone,
              network: plan.networkId,
            }),
          }
        );

        const providerBData = await providerBResponse.json();

        if (
          providerBData.data &&
          providerBData.data.Status === "successful"
        ) {
          providerSuccess = true;
          providerRef = providerBData.data.ident || customerRef;
          providerResponse = providerBData.data.api_response || "Success";
        } else {
          providerResponse =
            providerBData.data?.api_response || "Provider request failed";
        }
      }
    } catch (providerError) {
      console.error("Provider API error:", providerError);
      providerSuccess = false;
      providerResponse = "Network error calling provider";
    }

    // 9. HANDLE PROVIDER RESPONSE
    if (!providerSuccess) {
      // Transaction failed - REFUND
      await prisma.$transaction(async (tx: any) => {
        // Mark transaction as failed
        await tx.dataTransaction.update({
          where: { id: transactionId! },
          data: {
            status: "FAILED",
            providerResponse,
          },
        });

        // Refund wallet
        await tx.user.update({
          where: { id: userId },
          data: {
            balance: {
              increment: plan.price as any,
            },
          },
        });
      });

      return NextResponse.json(
        {
          error:
            "Provider failed to deliver data. Your balance has been refunded.",
        },
        { status: 422 }
      );
    }

    // 10. ON SUCCESS - UPDATE TRANSACTION
    await prisma.dataTransaction.update({
      where: { id: transactionId! },
      data: {
        status: "SUCCESS",
        providerRef: providerRef || undefined,
        providerResponse: providerResponse || undefined,
        balanceAfter: balanceAfterDebit,
      } as any,
    });

    // 11. RETURN SUCCESS
    return NextResponse.json({
      message: "Data delivered successfully.",
      reference: providerRef || customerRef,
      plan: plan.name,
      phone,
      amount: plan.price,
    });
  } catch (error) {
    console.error("Purchase error:", error);

    // Handle unexpected errors - mark transaction as failed and refund if created
    if (transactionId) {
      try {
        const sessionUser = await getSessionUser(request);
        const existingTransaction = await prisma.dataTransaction.findUnique({
          where: { id: transactionId },
          include: { plan: true },
        });

        if (existingTransaction && existingTransaction.status === "PENDING") {
          await prisma.$transaction(async (tx: any) => {
            await tx.dataTransaction.update({
              where: { id: transactionId },
              data: {
                status: "FAILED",
              },
            });

            // Refund if wallet was debited
            if (
              existingTransaction.balanceBefore &&
              sessionUser
            ) {
              await tx.user.update({
                where: { id: sessionUser.userId },
                data: {
                  balance: {
                    increment: existingTransaction.amount as unknown as number,
                  },
                },
              });
            }
          });
        }
      } catch (cleanupError) {
        console.error("Error during cleanup:", cleanupError);
      }
    }

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred. Please contact support.",
      },
      { status: 500 }
    );
  }
}
