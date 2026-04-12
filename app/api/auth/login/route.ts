import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, pin } = body;

    // Validation
    if (!phone || !pin) {
      return NextResponse.json(
        { error: "Phone and PIN are required" },
        { status: 400 }
      );
    }

    if (!/^0[0-9]{10}$/.test(phone)) {
      return NextResponse.json(
        { error: "Invalid phone format" },
        { status: 400 }
      );
    }

    // Find user by phone
    const user = await queryOne<{
      id: string;
      phone: string;
      name: string;
      pin: string;
      isActive: boolean;
      role: string;
    }>(
      `SELECT id, phone, name, "pin", "isActive", role FROM "User" WHERE phone = $1`,
      [phone]
    );

    if (!user) {
      return NextResponse.json(
        { error: "Invalid phone or PIN" },
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
        { error: "Invalid phone or PIN" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await signToken({
      userId: user.id,
      phone: user.phone,
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
        message: "Login successful",
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
        },
        token,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed", details: error.message },
      { status: 500 }
    );
  }
}
