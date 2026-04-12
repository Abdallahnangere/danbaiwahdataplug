import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { queryOne, execute } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, phone, pin } = body;

    // Validation
    if (!fullName || !email || !phone || !pin) {
      return NextResponse.json(
        { error: "Missing required fields: fullName, email, phone, pin" },
        { status: 400 }
      );
    }

    // Validate PIN is 6 digits
    if (!/^\d{6}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 6 digits" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate phone is 11 digits
    if (!/^\d{11}$/.test(phone)) {
      return NextResponse.json(
        { error: "Phone must be exactly 11 digits" },
        { status: 400 }
      );
    }

    // Check if email exists
    const existingEmail = await queryOne<{ id: string }>(
      "SELECT id FROM \"User\" WHERE email = $1",
      [email]
    );

    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Check if phone exists
    const existingPhone = await queryOne<{ id: string }>(
      "SELECT id FROM \"User\" WHERE phone = $1",
      [phone]
    );

    if (existingPhone) {
      return NextResponse.json(
        { error: "Phone number already registered" },
        { status: 409 }
      );
    }

    // Hash PIN
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(pin, salt);

    // Create user with initial balance
    const userId = randomUUID();
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO "User" (id, name, email, phone, "pin", balance, role, tier, "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [userId, fullName, email, phone, hashedPin, 0, "USER", "user", true, now, now]
    );

    // Generate JWT token
    const token = await signToken({
      userId,
      email,
      role: "USER" as const,
    });

    // Set secure cookie
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: userId,
          name: fullName,
          email,
          phone,
          balance: 0,
          role: "USER",
        },
        token,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account", details: error.message },
      { status: 500 }
    );
  }
}
