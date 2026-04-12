import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    // Dynamic import
    const { prisma } = await import("@/lib/db");

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
    const user = await prisma.user.findUnique({
      where: { email },
    });

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
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return NextResponse.json(
      {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        balance: user.balance.toNumber ? user.balance.toNumber() : user.balance,
        tier: user.tier,
        role: user.role,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Failed to login" },
      { status: 500 }
    );
  }
}
