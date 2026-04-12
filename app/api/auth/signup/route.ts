import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { queryOne, execute } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const utf8Headers = { "Content-Type": "application/json; charset=utf-8" };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, pin, confirmPin, acceptTerms } = body;

    // Validation
    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400, headers: utf8Headers }
      );
    }

    if (!phone || !/^0[0-9]{10}$/.test(phone)) {
      return NextResponse.json(
        { error: "Phone number must be 11 digits starting with 0" },
        { status: 400, headers: utf8Headers }
      );
    }

    if (!pin || !/^\d{6}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 6 digits" },
        { status: 400, headers: utf8Headers }
      );
    }

    if (!confirmPin || pin !== confirmPin) {
      return NextResponse.json(
        { error: "PINs don't match" },
        { status: 400, headers: utf8Headers }
      );
    }

    if (!acceptTerms) {
      return NextResponse.json(
        { error: "You must accept the terms and conditions" },
        { status: 400, headers: utf8Headers }
      );
    }

    // Check if phone already exists
    const existingPhone = await queryOne<{ id: string }>(
      `SELECT id FROM "User" WHERE phone = $1`,
      [phone]
    );

    if (existingPhone) {
      return NextResponse.json(
        { error: "Phone number already registered" },
        { status: 409, headers: utf8Headers }
      );
    }

    // Hash PIN using bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(pin, salt);

    // Create user
    const userId = randomUUID();
    const now = new Date().toISOString();

    const result = await queryOne<{ id: string }>(
      `INSERT INTO "User" (id, name, phone, "pin", balance, role, "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name, phone, balance, role`,
      [userId, name, phone, hashedPin, 0, "USER", true, now, now]
    );

    if (!result) {
      throw new Error("Failed to create user");
    }

    // Generate JWT token
    const token = await signToken({
      userId,
      phone,
      role: "USER" as const,
    });

    // Set secure cookie - using standardized name
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: userId,
          name,
          phone,
          balance: 0,
          role: "USER",
        },
        token,
      },
      { status: 201, headers: utf8Headers }
    );
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account", details: error.message },
      { status: 500, headers: utf8Headers }
    );
  }
}
