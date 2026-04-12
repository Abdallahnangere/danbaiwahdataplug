import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { pin } = body;

    if (!pin || typeof pin !== "string") {
      return NextResponse.json({ error: "PIN is required" }, { status: 400 });
    }

    // 3. Fetch user from DB
    const user = await queryOne<{ pin: string | null }>(
      "SELECT pin FROM \"User\" WHERE id = $1",
      [sessionUser.userId]
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 4. Check if PIN is set
    if (!user.pin) {
      return NextResponse.json(
        { error: "PIN not set. Please set your PIN first." },
        { status: 400 }
      );
    }

    // 5. Verify PIN with bcrypt
    const isValid = await bcrypt.compare(pin, user.pin);

    if (!isValid) {
      return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
    }

    // 6. Return success
    return NextResponse.json(
      { message: "PIN validated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("PIN validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate PIN", details: error.message },
      { status: 500 }
    );
  }
}
