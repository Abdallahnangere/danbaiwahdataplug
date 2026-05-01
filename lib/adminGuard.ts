import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function withAdminGuard(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<Response>
): Promise<Response> {
  try {
    const sessionUser = await getSessionUser(request);

    // Check if user has ADMIN role
    if (sessionUser && sessionUser.role === "ADMIN") {
      return await handler(request);
    }

    return NextResponse.json(
      { error: "Forbidden." },
      { status: 403 }
    );
  } catch (error) {
    console.error("Admin guard error:", error);
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }
}
