import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { queryOne, query, execute } from "@/lib/db";

export const dynamic = "force-dynamic";

const utf8Headers = { "Content-Type": "application/json; charset=utf-8" };
const MAX_BALANCE = 30000;

interface BillStackWebhookPayload {
  event: string;
  data: {
    type: string;
    reference: string;
    amount: string | number;
    account: {
      account_number: string;
    };
  };
}

function safeEqualHex(a: string, b: string): boolean {
  const aa = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}

export async function POST(request: NextRequest) {
  let eventRef: string | null = null;
  let webhookEventId: string | null = null;
  try {
    const signature = request.headers.get("x-wiaxy-signature");
    const rawBody = await request.text();
    let payload: BillStackWebhookPayload | null = null;
    try {
      payload = JSON.parse(rawBody) as BillStackWebhookPayload;
      eventRef = String(payload?.data?.reference || "").trim() || null;
    } catch {
      payload = null;
    }

    const headersObj = Object.fromEntries(request.headers.entries());
    const insertedWebhook = await queryOne<{ id: string }>(
      `INSERT INTO public.billstack_webhook_events
       (event_ref, signature, request_headers, payload, raw_body, processing_status)
       VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, 'RECEIVED')
       RETURNING id`,
      [
        eventRef,
        signature,
        JSON.stringify(headersObj),
        payload ? JSON.stringify(payload) : null,
        rawBody,
      ]
    );
    webhookEventId = insertedWebhook?.id || null;

    if (!signature) {
      if (webhookEventId) {
        await query(
          `UPDATE public.billstack_webhook_events
           SET signature_valid = false, processing_status = 'REJECTED', processing_error = $1, processed_at = NOW()
           WHERE id = $2`,
          ["Missing signature", webhookEventId]
        );
      }
      return NextResponse.json({ error: "Missing signature" }, { status: 401, headers: utf8Headers });
    }

    const secretKey = process.env.BILLSTACK_SECRET_KEY;
    if (!secretKey) {
      if (webhookEventId) {
        await query(
          `UPDATE public.billstack_webhook_events
           SET signature_valid = false, processing_status = 'ERROR', processing_error = $1, processed_at = NOW()
           WHERE id = $2`,
          ["Server configuration error", webhookEventId]
        );
      }
      return NextResponse.json({ error: "Server configuration error" }, { status: 401, headers: utf8Headers });
    }

    const expectedSignature = createHmac("sha256", secretKey).update(rawBody).digest("hex");
    if (!safeEqualHex(signature, expectedSignature)) {
      console.error("[BILLSTACK_WEBHOOK] Signature verification failed");
      if (webhookEventId) {
        await query(
          `UPDATE public.billstack_webhook_events
           SET signature_valid = false, processing_status = 'REJECTED', processing_error = $1, processed_at = NOW()
           WHERE id = $2`,
          ["Invalid signature", webhookEventId]
        );
      }
      return NextResponse.json({ error: "Invalid signature" }, { status: 401, headers: utf8Headers });
    }

    if (!payload) {
      if (webhookEventId) {
        await query(
          `UPDATE public.billstack_webhook_events
           SET signature_valid = true, processing_status = 'REJECTED', processing_error = $1, processed_at = NOW()
           WHERE id = $2`,
          ["Invalid JSON payload", webhookEventId]
        );
      }
      return NextResponse.json({ error: "Invalid payload" }, { status: 400, headers: utf8Headers });
    }

    if (webhookEventId) {
      await query(
        `UPDATE public.billstack_webhook_events
         SET signature_valid = true
         WHERE id = $1`,
        [webhookEventId]
      );
    }

    if (payload.event !== "PAYMENT_NOTIFICATION" || payload.data?.type !== "RESERVED_ACCOUNT_TRANSACTION") {
      if (webhookEventId) {
        await query(
          `UPDATE public.billstack_webhook_events
           SET processing_status = 'IGNORED', processed_at = NOW()
           WHERE id = $1`,
          [webhookEventId]
        );
      }
      return NextResponse.json({ status: "ignored" }, { status: 200, headers: utf8Headers });
    }

    const accountNumber = payload.data?.account?.account_number;
    eventRef = String(payload.data?.reference || "").trim();
    const amount = Number(payload.data?.amount);

    if (!accountNumber || !eventRef || !Number.isFinite(amount) || amount <= 0) {
      if (webhookEventId) {
        await query(
          `UPDATE public.billstack_webhook_events
           SET processing_status = 'REJECTED', processing_error = $1, processed_at = NOW()
           WHERE id = $2`,
          ["Invalid business payload", webhookEventId]
        );
      }
      return NextResponse.json({ status: "processed" }, { status: 200, headers: utf8Headers });
    }

    await execute(
      `CREATE TABLE IF NOT EXISTS "WebhookEventLock" (
        provider text NOT NULL,
        event_ref text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        PRIMARY KEY (provider, event_ref)
      )`
    );

    const lock = await queryOne<{ event_ref: string }>(
      `INSERT INTO "WebhookEventLock" (provider, event_ref)
       VALUES ($1, $2)
       ON CONFLICT (provider, event_ref) DO NOTHING
       RETURNING event_ref`,
      ["billstack", eventRef]
    );

    if (!lock) {
      if (webhookEventId) {
        await query(
          `UPDATE public.billstack_webhook_events
           SET processing_status = 'DUPLICATE', processed_at = NOW()
           WHERE id = $1`,
          [webhookEventId]
        );
      }
      return NextResponse.json({ status: "processed" }, { status: 200, headers: utf8Headers });
    }

    const user = await queryOne<{ id: string; balance: number | string }>(
      `SELECT u.id, u.balance
       FROM "User" u
       LEFT JOIN "UserReservedAccount" ura ON ura."userId" = u.id
       WHERE u.account_number = $1 OR ura."accountNumber" = $1
       LIMIT 1`,
      [accountNumber]
    );

    if (!user) {
      if (webhookEventId) {
        await query(
          `UPDATE public.billstack_webhook_events
           SET processing_status = 'NO_USER', processed_at = NOW()
           WHERE id = $1`,
          [webhookEventId]
        );
      }
      return NextResponse.json({ status: "processed" }, { status: 200, headers: utf8Headers });
    }

    const currentBalance = typeof user.balance === "number" ? user.balance : parseFloat(String(user.balance));
    const nextBalance = Math.min(MAX_BALANCE, currentBalance + amount);
    const creditAmount = Math.max(0, nextBalance - currentBalance);

    await query(
      `UPDATE "User" SET balance = $1 WHERE id = $2`,
      [nextBalance, user.id]
    );

    await query(
      `INSERT INTO public.transactions (id, user_id, category, status, amount, reference, created_at, updated_at) VALUES ($1, $2, 'DEPOSIT', 'SUCCESS', $3, $4, NOW(), NOW())`,
      [`DEP-${eventRef}`, user.id, creditAmount, eventRef]
    );

    if (webhookEventId) {
      await query(
        `UPDATE public.billstack_webhook_events
         SET processing_status = 'PROCESSED',
             user_id = $1,
             credited_amount = $2,
             processed_at = NOW()
         WHERE id = $3`,
        [user.id, creditAmount, webhookEventId]
      );
    }

    return NextResponse.json(
      { status: "processed", userId: user.id, credited: creditAmount, newBalance: nextBalance },
      { status: 200, headers: utf8Headers }
    );
  } catch (error) {
    console.error("[BILLSTACK_WEBHOOK] Error processing webhook", error);
    if (webhookEventId) {
      await query(
        `UPDATE public.billstack_webhook_events
         SET processing_status = 'ERROR',
             processing_error = $1,
             processed_at = NOW()
         WHERE id = $2`,
        [error instanceof Error ? error.message : String(error), webhookEventId]
      ).catch(() => {});
    }
    if (eventRef) {
      await execute(
        `DELETE FROM "WebhookEventLock" WHERE provider = $1 AND event_ref = $2`,
        ["billstack", eventRef]
      ).catch(() => {});
    }
    return NextResponse.json({ status: "processed", error: "Server error handled" }, { status: 200, headers: utf8Headers });
  }
}

