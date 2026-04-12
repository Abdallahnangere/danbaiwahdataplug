import { NextResponse, NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateDataRequest } from "@/lib/validators";
import { rateLimiter } from "@/lib/rateLimiter";
import { purchaseData } from "@/lib/data-delivery";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const limited = rateLimiter.isLimited(ip);
    if (limited) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Authentication
    const session = await getSessionUser(request);
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { planId, phoneNumber } = body;

    // Validation
    const validation = validateDataRequest({ planId, phoneNumber });
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Check if user has sufficient balance
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get plan details
    const plan = await prisma.dataPlan.findUnique({
      where: { id: planId },
      include: { network: true },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    // Check balance
    const planPrice = typeof plan.price === "number" ? plan.price : Number(plan.price);
    if (user.balance < planPrice) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Determine provider from plan
    const provider = plan.activeApi === "A" ? "smeplug" : "saiful";
    console.log(`[POST /api/data/purchase] Using provider: ${provider} for plan ${planId}`);

    // Process purchase
    const result = await purchaseData({
      userId: session.userId,
      planId,
      phoneNumber,
      amount: planPrice,
      provider,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Purchase failed" },
        { status: 400 }
      );
    }

    // Create transaction record
    await prisma.dataTransaction.create({
      data: {
        userId: session.userId,
        phone: phoneNumber,
        planId,
        networkId: plan.networkId,
        amount: planPrice,
        reference: result.reference,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      {
        message: "Data purchase initiated",
        reference: result.reference,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/data/purchase]", error);
    return NextResponse.json(
      { error: "Purchase failed. Please try again." },
      { status: 500 }
    );
  }
}
