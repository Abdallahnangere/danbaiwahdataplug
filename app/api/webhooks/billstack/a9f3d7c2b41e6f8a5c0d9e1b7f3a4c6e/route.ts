import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual, randomUUID } from "crypto";
import { queryOne, query, execute } from "@/lib/db";

export const dynamic = "force-dynamic";

const utf8Headers = { "Content-Type": "application/json; charset=utf-8" };

type WiaxyPayload = {
  event?: string;
  data?: {
    type?: string;
    reference?: string;
    merchant_reference?: string;
    wiaxy_ref?: string;
    amount?: string | number;
    created_at?: string;
    account?: {
      account_number?: string;
      account_name?: string;
      bank_name?: string;
      created_at?: string;
    };
    payer?: {
      account_number?: string;
      first_name?: string;
      last_name?: string;
      createdAt?: string;
    };
  };
};

function safeEqualHex(a: string, b: string): boolean {
  try {
    const aa = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (aa.length !== bb.length) return false;
    return timingSafeEqual(aa, bb);
  } catch {
    return false;
  }
}

function normalizeEventName(v: string | undefined) {
  return String(v || "").trim().toUpperCase();
}

function buildIdempotencyKey(payload: WiaxyPayload) {
  const d = payload.data || {};
  const wiaxyRef = String(d.wiaxy_ref || "").trim();
  if (wiaxyRef) return `WIA:${wiaxyRef}`;
  const reference = String(d.reference || "").trim();
  const acct = String(d.account?.account_number || "").trim();
  const amount = String(d.amount || "").trim();
  const createdAt = String(d.created_at || "").trim();
  return `REF:${reference}|ACCT:${acct}|AMT:${amount}|AT:${createdAt}`;
}

export async function POST(request: NextRequest) {
  let webhookEventId: string | null = null;
  let idempotencyKey: string | null = null;
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-wiaxy-signature") || request.headers.get("x-billstack-signature");
    let payload: WiaxyPayload | null = null;
    try {
      payload = JSON.parse(rawBody) as WiaxyPayload;
    } catch {
      payload = null;
    }

    idempotencyKey = payload ? buildIdempotencyKey(payload) : null;
    const headersObj = Object.fromEntries(request.headers.entries());
    const eventRef = String(payload?.data?.reference || "").trim() || null;
    const accountNumber = String(payload?.data?.account?.account_number || "").trim() || null;
    const merchantReference = String(payload?.data?.merchant_reference || "").trim() || null;
    const wiaxyRef = String(payload?.data?.wiaxy_ref || "").trim() || null;

    const inserted = await queryOne<{ id: string }>(
      `INSERT INTO public.billstack_webhook_events
       (event_ref, signature, request_headers, payload, raw_body, processing_status, account_number, merchant_reference, wiaxy_ref, idempotency_key)
       VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, 'RECEIVED', $6, $7, $8, $9)
       RETURNING id`,
      [eventRef, signature, JSON.stringify(headersObj), payload ? JSON.stringify(payload) : null, rawBody, accountNumber, merchantReference, wiaxyRef, idempotencyKey]
    );
    webhookEventId = inserted?.id || null;

    if (!signature) {
      if (webhookEventId) {
        await query(`UPDATE public.billstack_webhook_events SET signature_valid=false, processing_status='REJECTED', processing_error='Missing signature', processed_at=NOW() WHERE id=$1`, [webhookEventId]);
      }
      return NextResponse.json({ error: "Missing signature" }, { status: 401, headers: utf8Headers });
    }

    const secretKey = process.env.BILLSTACK_SECRET_KEY;
    if (!secretKey) {
      if (webhookEventId) {
        await query(`UPDATE public.billstack_webhook_events SET signature_valid=false, processing_status='ERROR', processing_error='Server configuration error', processed_at=NOW() WHERE id=$1`, [webhookEventId]);
      }
      return NextResponse.json({ error: "Server configuration error" }, { status: 500, headers: utf8Headers });
    }

    // Provider contract: x-wiaxy-signature is MD5(secretKey), not body HMAC.
    const expectedSignature = createHash("md5").update(secretKey).digest("hex");
    if (!safeEqualHex(signature, expectedSignature)) {
      if (webhookEventId) {
        await query(`UPDATE public.billstack_webhook_events SET signature_valid=false, processing_status='REJECTED', processing_error='Invalid signature', processed_at=NOW() WHERE id=$1`, [webhookEventId]);
      }
      return NextResponse.json({ error: "Invalid signature" }, { status: 401, headers: utf8Headers });
    }

    if (!payload) {
      if (webhookEventId) {
        await query(`UPDATE public.billstack_webhook_events SET signature_valid=true, processing_status='REJECTED', processing_error='Invalid JSON payload', processed_at=NOW() WHERE id=$1`, [webhookEventId]);
      }
      return NextResponse.json({ status: "processed" }, { status: 200, headers: utf8Headers });
    }

    if (webhookEventId) {
      await query(`UPDATE public.billstack_webhook_events SET signature_valid=true WHERE id=$1`, [webhookEventId]);
    }

    const eventName = normalizeEventName(payload.event);
    const eventType = normalizeEventName(payload.data?.type);
    const isPaymentEvent = eventName === "PAYMENT_NOTIFICATION" || eventName === "PAYMENT_NOTIFIFICATION";
    if (!isPaymentEvent || eventType !== "RESERVED_ACCOUNT_TRANSACTION") {
      if (webhookEventId) {
        await query(`UPDATE public.billstack_webhook_events SET processing_status='IGNORED', processed_at=NOW() WHERE id=$1`, [webhookEventId]);
      }
      return NextResponse.json({ status: "ignored" }, { status: 200, headers: utf8Headers });
    }

    const amount = Number(payload.data?.amount);
    const creditAccountNumber = String(payload.data?.account?.account_number || "").trim();
    const ref = String(payload.data?.reference || "").trim();
    const key = buildIdempotencyKey(payload);
    idempotencyKey = key;

    if (!creditAccountNumber || !Number.isFinite(amount) || amount <= 0 || !key) {
      if (webhookEventId) {
        await query(`UPDATE public.billstack_webhook_events SET processing_status='REJECTED', processing_error='Invalid business payload', processed_at=NOW() WHERE id=$1`, [webhookEventId]);
      }
      return NextResponse.json({ status: "processed" }, { status: 200, headers: utf8Headers });
    }

    const lock = await queryOne<{ idempotency_key: string }>(
      `INSERT INTO public.webhook_credit_idempotency (provider, idempotency_key)
       VALUES ('billstack', $1)
       ON CONFLICT (provider, idempotency_key) DO NOTHING
       RETURNING idempotency_key`,
      [key]
    );
    if (!lock) {
      if (webhookEventId) {
        await query(`UPDATE public.billstack_webhook_events SET processing_status='DUPLICATE', processed_at=NOW() WHERE id=$1`, [webhookEventId]);
      }
      return NextResponse.json({ status: "processed" }, { status: 200, headers: utf8Headers });
    }

    const matchedUsers = await query<{ user_id: string; balance: number | string }>(
      `SELECT DISTINCT u.id AS user_id, u.balance
       FROM public."User" u
       LEFT JOIN public."UserReservedAccount" ura ON ura."userId" = u.id
       WHERE u.account_number = $1 OR ura."accountNumber" = $1`,
      [creditAccountNumber]
    );

    if (matchedUsers.length !== 1) {
      const status = matchedUsers.length === 0 ? "NO_USER" : "AMBIGUOUS_ACCOUNT";
      if (webhookEventId) {
        await query(`UPDATE public.billstack_webhook_events SET processing_status=$1, processing_error=$2, processed_at=NOW() WHERE id=$3`, [status, `Matched users: ${matchedUsers.length}`, webhookEventId]);
      }
      return NextResponse.json({ status: "processed" }, { status: 200, headers: utf8Headers });
    }

    const userId = matchedUsers[0].user_id;
    const currentBalance = typeof matchedUsers[0].balance === "number" ? matchedUsers[0].balance : Number(matchedUsers[0].balance || 0);
    const nextBalance = currentBalance + amount;

    await query(`UPDATE public."User" SET balance=$1 WHERE id=$2`, [nextBalance, userId]);

    const depositTxId = `DEP-${randomUUID()}`;
    const providerRef = String(payload.data?.wiaxy_ref || "").trim() || ref || key;
    await query(
      `INSERT INTO public.transactions (
         id, user_id, category, status, amount, reference, provider_ref, target, provider, metadata, created_at, updated_at
       ) VALUES (
         $1, $2, 'DEPOSIT', 'SUCCESS', $3, $4, $5, $6, 'Wiaxy', $7::jsonb, NOW(), NOW()
       )`,
      [
        depositTxId,
        userId,
        amount,
        ref || providerRef,
        providerRef,
        creditAccountNumber,
        JSON.stringify({
          idempotency_key: key,
          merchant_reference: payload.data?.merchant_reference || null,
          wiaxy_ref: payload.data?.wiaxy_ref || null,
          payer: payload.data?.payer || null,
          account: payload.data?.account || null,
        }),
      ]
    );

    if (webhookEventId) {
      await query(
        `UPDATE public.billstack_webhook_events
         SET processing_status='PROCESSED',
             user_id=$1,
             credited_amount=$2,
             processed_at=NOW()
         WHERE id=$3`,
        [userId, amount, webhookEventId]
      );
    }

    return NextResponse.json({ status: "processed", userId, credited: amount, newBalance: nextBalance }, { status: 200, headers: utf8Headers });
  } catch (error) {
    if (webhookEventId) {
      await query(
        `UPDATE public.billstack_webhook_events
         SET processing_status='ERROR',
             processing_error=$1,
             processed_at=NOW()
         WHERE id=$2`,
        [error instanceof Error ? error.message : String(error), webhookEventId]
      ).catch(() => {});
    }
    if (idempotencyKey) {
      await execute(
        `DELETE FROM public.webhook_credit_idempotency
         WHERE provider='billstack' AND idempotency_key=$1`,
        [idempotencyKey]
      ).catch(() => {});
    }
    return NextResponse.json({ status: "processed", error: "Server error handled" }, { status: 200, headers: utf8Headers });
  }
}
