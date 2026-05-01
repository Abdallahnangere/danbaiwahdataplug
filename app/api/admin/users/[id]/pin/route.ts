import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const utf8Headers = { "Content-Type": "application/json; charset=utf-8" };

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const id = params.id;
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403, headers: utf8Headers });
    }

    const body = await request.json().catch(() => ({}));
    const newPin = typeof body.pin === "string" && /^\d{6}$/.test(body.pin) ? body.pin : "000000";
    const hashed = await bcrypt.hash(newPin, 10);

    const result = await queryOne<{ id: string }>(`UPDATE "User" SET pin = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING id`, [hashed, id]);
    if (!result) return NextResponse.json({ error: "User not found" }, { status: 404, headers: utf8Headers });

    return NextResponse.json({ success: true, temporaryPin: newPin }, { headers: utf8Headers });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Admin reset PIN error:", error);
    return NextResponse.json({ error: "Failed to reset pin" }, { status: 500, headers: utf8Headers });
  }
}
