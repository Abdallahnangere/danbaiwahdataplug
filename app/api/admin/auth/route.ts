import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "Password required" },
        { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { error: "Admin password not configured" },
        { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    // Compare the provided password with the admin password
    if (password === adminPassword) {
      return NextResponse.json(
        { success: true },
        { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    } else {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }
  } catch (error) {
    console.error("Admin auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}
