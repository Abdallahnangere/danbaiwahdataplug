import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query, queryOne, execute, sql } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    const user = await queryOne<{
      pin: string | null;
      balance: number;
      name: string | null;
    }>(
      `SELECT pin, balance, name FROM "User" WHERE id = $1`,
      [userId]
    );

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
    const plan = await queryOne<{
      id: string;
      name: string;
      networkId: number;
      price: number;
      activeApi: string;
      apiAId: number | null;
      apiBId: number | null;
      isActive: boolean;
    }>(
      `SELECT id, name, "networkId", price, "activeApi", "apiAId", "apiBId", "isActive"
       FROM "DataPlan"
       WHERE id = $1`,
      [planId]
    );

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: "Plan not available." },
        { status: 404 }
      );
    }

    // 5. BALANCE CHECK
    const userBalance = typeof user.balance === 'number' ? user.balance : parseFloat(String(user.balance));
    if (!userBalance || userBalance < plan.price) {
      return NextResponse.json(
        { error: "Insufficient wallet balance." },
        { status: 402 }
      );
    }

    // 6. GENERATE REFERENCE
    const customerRef = `DAT-${Date.now()}-${userId.slice(-6)}`;

    // 7. CREATE PENDING TRANSACTION and debit wallet
    try {
      // Insert transaction
      const insertResult = await queryOne<{ id: string }>(
        `INSERT INTO "DataTransaction" 
         (id, "userId", "planId", phone, "networkId", amount, "providerUsed", "customerRef", 
          status, "balanceBefore", "createdAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         RETURNING id`,
        [
          userId,
          planId,
          phone,
          plan.networkId,
          plan.price,
          plan.activeApi,
          customerRef,
          "PENDING",
          userBalance,
        ]
      );

      if (!insertResult) {
        throw new Error("Failed to create transaction");
      }

      transactionId = insertResult.id;

      // Debit wallet
      const updateResult = await queryOne<{ balance: number }>(
        `UPDATE "User"
         SET balance = balance - $1
         WHERE id = $2
         RETURNING balance`,
        [plan.price, userId]
      );

      if (!updateResult) {
        throw new Error("Failed to update balance");
      }

      const balanceAfterDebit = typeof updateResult.balance === 'number' ? updateResult.balance : parseFloat(String(updateResult.balance));

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
        try {
          // Mark transaction as failed
          await execute(
            `UPDATE "DataTransaction"
             SET status = $1, "providerResponse" = $2
             WHERE id = $3`,
            ["FAILED", providerResponse, transactionId]
          );

          // Refund wallet
          await execute(
            `UPDATE "User"
             SET balance = balance + $1
             WHERE id = $2`,
            [plan.price, userId]
          );
        } catch (refundError) {
          console.error("Error during refund:", refundError);
        }

        return NextResponse.json(
          {
            error:
              "Provider failed to deliver data. Your balance has been refunded.",
          },
          { status: 422 }
        );
      }

      // 10. ON SUCCESS - UPDATE TRANSACTION
      await execute(
        `UPDATE "DataTransaction"
         SET status = $1, "providerRef" = $2, "providerResponse" = $3, "balanceAfter" = $4
         WHERE id = $5`,
        ["SUCCESS", providerRef || undefined, providerResponse || undefined, balanceAfterDebit, transactionId]
      );

      // 11. RETURN SUCCESS
      return NextResponse.json({
        message: "Data delivered successfully.",
        reference: providerRef || customerRef,
        plan: plan.name,
        phone,
        amount: plan.price,
      });
    } catch (txError) {
      console.error("Transaction error:", txError);

      // If transaction was created and we hit an error, try to refund and mark as failed
      if (transactionId) {
        try {
          const existingTransaction = await queryOne<{
            status: string;
            amount: number;
            balanceBefore: number;
          }>(
            `SELECT status, amount, "balanceBefore" FROM "DataTransaction" WHERE id = $1`,
            [transactionId]
          );

          if (existingTransaction && existingTransaction.status === "PENDING") {
            // Mark as failed
            await execute(
              `UPDATE "DataTransaction"
               SET status = $1
               WHERE id = $2`,
              ["FAILED", transactionId]
            );

            // Refund wallet
            const amount = typeof existingTransaction.amount === 'number' ? existingTransaction.amount : parseFloat(String(existingTransaction.amount));
            await execute(
              `UPDATE "User"
               SET balance = balance + $1
               WHERE id = $2`,
              [amount, userId]
            );
          }
        } catch (cleanupError) {
          console.error("Error during cleanup:", cleanupError);
        }
      }

      throw txError;
    }
  } catch (error) {
    console.error("Purchase error:", error);
    return NextResponse.json(
      {
        error:
          "An unexpected error occurred. Please contact support.",
      },
      { status: 500 }
    );
  }
}
