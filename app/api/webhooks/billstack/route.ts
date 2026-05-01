import { NextResponse } from "next/server";

const utf8Headers = { "Content-Type": "application/json; charset=utf-8" };

export async function POST() {
  return NextResponse.json({ error: "Not found" }, { status: 404, headers: utf8Headers });
}

