import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";

const utf8Headers = { "Content-Type": "application/json; charset=utf-8" };

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403, headers: utf8Headers });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get("limit") || "100");
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 500) : 100;

    const rows = await query<{
      id: string;
      provider: string;
      event_ref: string | null;
      signature_valid: boolean | null;
      processing_status: string;
      processing_error: string | null;
      user_id: string | null;
      credited_amount: number | null;
      received_at: string;
      processed_at: string | null;
      payload: unknown;
    }>(
      `SELECT id, provider, event_ref, signature_valid, processing_status, processing_error,
              user_id, credited_amount, received_at, processed_at, payload
       FROM public.billstack_webhook_events
       ORDER BY received_at DESC
       LIMIT $1`,
      [limit]
    );

    return NextResponse.json({ success: true, data: rows }, { status: 200, headers: utf8Headers });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500, headers: utf8Headers });
  }
}
