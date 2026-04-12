import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { queryOne } from "@/lib/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, pin } = body;

    // Validation
    if (!email || !pin) {
      return NextResponse.json(
        { error: "Email and PIN are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await queryOne<{
      id: string;
      email: string;
      pin: string;
      isActive: boolean;
      role: string;
    }>("SELECT id, email, \"pin\", \"isActive\", role FROM \"User\" WHERE email = $1", [
      email,
    ]);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or PIN" },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account is disabled" },
        { status: 403 }
      );
    }

    // Verify PIN
    if (!user.pin) {
      return NextResponse.json(
        { error: "Account not properly configured" },
        { status: 500 }
      );
    }

    const pinValid = await bcrypt.compare(pin, user.pin);

    if (!pinValid) {
      return NextResponse.json(
        { error: "Invalid email or PIN" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role as "USER" | "AGENT" | "ADMIN",
    });

    // Set token in cookie
    const cookieStore = await cookies();
    cookieStore.set("sy_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
