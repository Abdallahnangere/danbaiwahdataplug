import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Validate admin
    const adminPassword = request.headers.get("x-admin-password");
    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all users from database
    const users = await query<{
      id: string;
      email: string;
      name: string | null;
      phone: string | null;
      balance: number;
      role: string;
      createdAt: string;
    }>(
      `SELECT id, email, name, phone, balance, role, "createdAt"
       FROM "User"
       ORDER BY "createdAt" DESC`,
      []
    );

    return NextResponse.json(
      users.map((user) => ({
        ...user,
        balance: typeof user.balance === 'number' ? user.balance : parseFloat(String(user.balance)),
      }))
    );
  } catch (error) {
    console.error("Users fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
