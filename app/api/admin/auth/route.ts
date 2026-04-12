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
      // Create a response with admin session cookie
      const response = NextResponse.json(
        { success: true },
        { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );

      // Set admin session cookie (valid for 6 hours)
      response.cookies.set("admin-session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 6 * 60 * 60, // 6 hours
        path: "/",
      });

      return response;
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

