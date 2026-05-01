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

    const rateLimitError = await withRateLimit(request, userId, "data:purchase", { limit: 10, windowMs: 60000 });
    if (rateLimitError) return rateLimitError;

    const { planId, phone, pin } = await request.json();
    if (!planId || !phone || !pin) {
      return NextResponse.json({ error: "planId, phone, and pin are required" }, { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } });
    }

    const user = await queryOne<{ pin: string | null; balance: number; role: string; isActive: boolean }>(
      `SELECT pin, balance, role, "isActive" FROM "User" WHERE id = $1`,
      [userId]
    );
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404, headers: { "Content-Type": "application/json; charset=utf-8" } });
    if (!user.isActive) return NextResponse.json({ error: "Account is disabled" }, { status: 403, headers: { "Content-Type": "application/json; charset=utf-8" } });
    if (!user.pin) return NextResponse.json({ error: "PIN not set. Please set your PIN first." }, { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } });

    const isPinValid = await bcrypt.compare(pin, user.pin);
    if (!isPinValid) return NextResponse.json({ error: "Incorrect PIN." }, { status: 401, headers: { "Content-Type": "application/json; charset=utf-8" } });

    const plan = await queryOne<{
      id: string;
      name: string;
      network_id: number;
      user_price: number;
      agent_price: number | null;
      active_api: string | null;
      api_a_id: number | null;
      api_b_id: number | null;
      api_c_id: number | null;
      is_active: boolean;
      network_name: string;
    }>(
      `SELECT id, name, network_id, user_price, agent_price, active_api, api_a_id, api_b_id, api_c_id, is_active, network_name
       FROM public.data_plans
       WHERE id = $1`,
      [planId]
    );
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404, headers: { "Content-Type": "application/json; charset=utf-8" } });
    if (!plan.is_active) return NextResponse.json({ error: "Plan not available." }, { status: 404, headers: { "Content-Type": "application/json; charset=utf-8" } });

    let planPrice = Number(plan.user_price || 0);
    if (user.role === "AGENT" && plan.agent_price && Number(plan.agent_price) > 0) planPrice = Number(plan.agent_price);

    const userBalance = typeof user.balance === "number" ? user.balance : parseFloat(String(user.balance));
    if (userBalance < planPrice) return NextResponse.json({ error: "Insufficient wallet balance." }, { status: 402, headers: { "Content-Type": "application/json; charset=utf-8" } });

    const customerRef = `DAT-${Date.now()}-${userId.slice(-6)}`;
    transactionId = customerRef;

    await execute(
      `INSERT INTO public.transactions (
         id, user_id, category, status, amount, target, network_id, network_name, plan_id, provider,
         reference, balance_before, created_at, updated_at
       ) VALUES ($1, $2, 'DATA', 'PENDING', $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
      [transactionId, userId, planPrice, phone, plan.network_id, plan.network_name, plan.id, plan.active_api || "B", customerRef, userBalance]
    );

    const updateResult = await queryOne<{ balance: number }>(
      `UPDATE "User" SET balance = balance - $1 WHERE id = $2 RETURNING balance`,
      [planPrice, userId]
    );
    if (!updateResult) throw new Error("Failed to update balance");
    const balanceAfterDebit = Number(updateResult.balance);

    let providerRef: string | null = null;
    let providerResponse: string | null = null;
    let providerSuccess = false;

    try {
      if (plan.active_api === "A") {
        const payloadA = { network_id: plan.network_id, plan_id: plan.api_a_id, phone, customer_reference: customerRef };
        const res = await fetch(`${process.env.SMEPLUG_BASE_URL}/data/purchase`, {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.SMEPLUG_TOKEN}`, "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(payloadA),
        });
        const data = await res.json();
        if (data.status === true) {
          providerSuccess = true;
          providerRef = data.reference || data.ref || customerRef;
          providerResponse = data.msg || "Success";
        } else {
          providerResponse = data.msg || "Provider request failed";
        }
      } else {
        const useB = (plan.active_api || "B") === "B";
        const baseUrl = useB ? process.env.PROVIDER_B_BASE_URL : process.env.PROVIDER_C_BASE_URL;
        const token = useB ? process.env.PROVIDER_B_TOKEN : process.env.PROVIDER_C_TOKEN;
        const providerPlanId = useB ? plan.api_b_id : plan.api_c_id;
        if (!baseUrl || !token || !providerPlanId) throw new Error(`Provider ${(plan.active_api || "B")} is not configured for this plan`);

        const res = await fetch(`${baseUrl}/data`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ plan: providerPlanId, mobile_number: phone, network: plan.network_id }),
        });
        const data = await res.json();
        if (data && data.Status === "successful") {
          providerSuccess = true;
          providerRef = data.ident || customerRef;
          providerResponse = data.api_response || "Success";
        } else {
          providerResponse = data?.api_response || "Provider request failed";
        }
      }
    } catch (providerError: any) {
      providerResponse = `Provider error: ${providerError.message}`;
      providerSuccess = false;
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
        await execute(`UPDATE "User" SET balance = balance + $1 WHERE id = $2`, [planPrice, userId]);
      }

      return NextResponse.json(
        { error: `${providerResponse || "Provider failed to deliver data"}. Your balance has been refunded.`, transactionId, refunded: true },
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
        message: `Data delivered successfully. NGN${planPrice.toLocaleString()} debited from your wallet.`,
        transactionId,
        reference: providerRef || customerRef,
        plan: plan.name,
        phone,
        amount: planPrice,
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
      { error: "An unexpected error occurred. Please contact support." },
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}
