import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
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
    const session = await auth();
    if (!session || !session.user?.id) {
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
      where: { id: session.user.id },
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
    if (user.balance < plan.price) {
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
      userId: session.user.id,
      planId,
      phoneNumber,
      amount: plan.price,
      provider,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Purchase failed" },
        { status: 400 }
      );
    }

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: "DATA_PURCHASE",
        amount: plan.price,
        status: "PENDING",
        reference: result.reference,
        metadata: {
          planId,
          networkName: plan.network.name,
          phoneNumber,
        },
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
