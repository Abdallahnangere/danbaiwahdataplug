import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";
import { withRateLimit } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  let transactionId: string | null = null;
  let userIdForRecovery: string | null = null;

  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401, headers: { "Content-Type": "application/json; charset=utf-8" } });
    }

    const userId = sessionUser.userId;
    userIdForRecovery = userId;

    const rateLimitError = await withRateLimit(request, userId, "airtime:purchase", { limit: 10, windowMs: 60000 });
    if (rateLimitError) return rateLimitError;

    const { network, mobile_number, amount, pin } = await request.json();
    if (!network || !mobile_number || !amount || !pin) {
      return NextResponse.json(
        { errors: { amount: amount ? [] : ["Amount is required"], mobile_number: mobile_number ? [] : ["Mobile number is required"], network: network ? [] : ["Network is required"], pin: pin ? [] : ["PIN is required"] } },
        { status: 422, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    if (!/^0\d{10}$/.test(mobile_number)) {
      return NextResponse.json({ errors: { mobile_number: ["Enter a valid 11-digit Nigerian number"] } }, { status: 422, headers: { "Content-Type": "application/json; charset=utf-8" } });
    }

    const amountNum = typeof amount === "string" ? parseInt(amount) : amount;
    if (isNaN(amountNum) || amountNum < 50 || amountNum > 100000) {
      return NextResponse.json({ errors: { amount: ["Amount must be between NGN50 and NGN100,000"] } }, { status: 422, headers: { "Content-Type": "application/json; charset=utf-8" } });
    }

    if (![1, 2, 3, 4].includes(network)) {
      return NextResponse.json({ errors: { network: ["Invalid network selected"] } }, { status: 422, headers: { "Content-Type": "application/json; charset=utf-8" } });
    }

    const user = await queryOne<{ balance: number; pin: string | null; isActive: boolean }>(`SELECT balance, pin, "isActive" FROM "User" WHERE id = $1`, [userId]);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404, headers: { "Content-Type": "application/json; charset=utf-8" } });
    if (!user.isActive) return NextResponse.json({ error: "Account is disabled" }, { status: 403, headers: { "Content-Type": "application/json; charset=utf-8" } });
    if (!user.pin) return NextResponse.json({ error: "PIN not set. Please set your PIN first." }, { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } });

    const isPinValid = await bcrypt.compare(pin, user.pin);
    if (!isPinValid) return NextResponse.json({ error: "Incorrect PIN." }, { status: 401, headers: { "Content-Type": "application/json; charset=utf-8" } });

    const userBalance = Number(user.balance);
    if (userBalance < amountNum) return NextResponse.json({ error: "Insufficient wallet balance." }, { status: 402, headers: { "Content-Type": "application/json; charset=utf-8" } });

    const customerRef = `AIR-${Date.now()}-${userId.slice(-6)}`;
    const networkNames = { 1: "MTN", 2: "Airtel", 3: "Glo", 4: "9mobile" };
    const networkName = networkNames[network as keyof typeof networkNames] || "Unknown";
    transactionId = customerRef;

    await execute(
      `INSERT INTO public.transactions (
         id, user_id, category, status, amount, target, network_id, network_name, provider,
         reference, balance_before, created_at, updated_at
       ) VALUES ($1, $2, 'AIRTIME', 'PENDING', $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [transactionId, userId, amountNum, mobile_number, network, networkName, "B", customerRef, userBalance]
    );

    const updateResult = await queryOne<{ balance: number }>(`UPDATE "User" SET balance = balance - $1 WHERE id = $2 RETURNING balance`, [amountNum, userId]);
    if (!updateResult) throw new Error("Failed to update balance");
    const balanceAfterDebit = Number(updateResult.balance);

    let providerRef: string | null = null;
    let providerResponse: string | null = null;
    let providerSuccess = false;

    try {
      const res = await fetch(`${process.env.PROVIDER_B_BASE_URL}/topup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PROVIDER_B_TOKEN}`,
          Accept: "application/json",
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({ network, mobile_number, amount: amountNum }),
      });
      const data = await res.json();

      if (data && data.Status === "successful") {
        providerSuccess = true;
        providerRef = data.ident || data.reference || customerRef;
        providerResponse = data.api_response || data.message || "Success";
      } else {
        providerResponse = data?.api_response || data?.message || "Provider request failed";
      }
    } catch (providerError: any) {
      providerSuccess = false;
      providerResponse = `Provider error: ${providerError.message}`;
    }

    if (!providerSuccess) {
      const failedTransition = await queryOne<{ id: string }>(
        `UPDATE public.transactions
         SET status = 'FAILED', provider_response = $1, updated_at = NOW()
         WHERE id = $2 AND status = 'PENDING'
         RETURNING id`,
        [providerResponse, transactionId]
      );

      if (failedTransition) {
        await execute(`UPDATE "User" SET balance = balance + $1 WHERE id = $2`, [amountNum, userId]);
      }

      return NextResponse.json(
        { error: `${providerResponse || "Provider failed to deliver airtime"}. Your balance has been refunded.`, transactionId, refunded: true },
        { status: 422, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    await execute(
      `UPDATE public.transactions
       SET status = 'SUCCESS', provider_ref = $1, provider_response = $2, balance_after = $3, updated_at = NOW()
       WHERE id = $4`,
      [providerRef || customerRef, providerResponse, balanceAfterDebit, transactionId]
    );

    return NextResponse.json(
      {
        message: "Airtime sent successfully.",
        transactionId,
        reference: providerRef || customerRef,
        network: networkName,
        mobile_number,
        amount: amountNum,
        newBalance: balanceAfterDebit,
      },
      { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (error: any) {
    if (transactionId && userIdForRecovery) {
      try {
        const failedTransition = await queryOne<{ id: string; amount: number }>(
          `UPDATE public.transactions
           SET status = 'FAILED', updated_at = NOW()
           WHERE id = $1 AND status = 'PENDING'
           RETURNING id, amount`,
          [transactionId]
        );
        if (failedTransition) {
          await execute(`UPDATE "User" SET balance = balance + $1 WHERE id = $2`, [Number(failedTransition.amount), userIdForRecovery]);
        }
      } catch {
      }
    }

    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}
