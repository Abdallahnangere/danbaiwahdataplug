import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST() {
  return NextResponse.json(
    { error: "Cable purchase has been removed. Use transactions for data/airtime only." },
    { status: 410, headers: { "Content-Type": "application/json; charset=utf-8" } }
  );
}
