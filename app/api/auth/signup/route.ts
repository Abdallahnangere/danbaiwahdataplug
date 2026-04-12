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
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Check if phone exists
    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    });

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
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        pin: hashedPin,
        balance: 0, // Users start with 0 balance, they fund their wallet
        tier: "user", // Default tier
        role: "USER", // Default role
        isActive: true,
      } as any,
    });

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
        balance: user.balance,
        tier: user.tier,
        role: user.role,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
