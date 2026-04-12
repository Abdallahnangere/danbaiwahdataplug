import { NextResponse, NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validatePhoneNumber } from "@/lib/validators";
import { rateLimiter } from "@/lib/rateLimiter";
import { purchaseAirtime } from "@/lib/data-delivery";

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
    const { amount, phoneNumber, networkId } = body;

    // Validation
    if (!amount || amount < 50 || amount > 50000) {
      return NextResponse.json(
        { error: "Amount must be between 50 and 50,000" },
        { status: 400 }
      );
    }

    const phoneValidation = validatePhoneNumber(phoneNumber);
    if (!phoneValidation.valid) {
      return NextResponse.json(
        { error: phoneValidation.error },
        { status: 400 }
      );
    }

    if (!networkId) {
      return NextResponse.json(
        { error: "Network is required" },
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

    if (user.balance < amount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Verify network exists and get provider preference
    const network = await prisma.dataNetwork.findUnique({
      where: { networkCode: parseInt(networkId) },
    });

    if (!network) {
      return NextResponse.json(
        { error: "Network not found" },
        { status: 404 }
      );
    }

    // Get provider for this network (defaulting to Saiful if no plans exist)
    // For airtime, we use the same provider logic as data
    // If no DataPlan exists, we default to Saiful for all networks
    let provider: "smeplug" | "saiful" = "saiful"; // Default provider for airtime
    
    // Try to get provider from a data plan for this network
    const dataPlan = await prisma.dataPlan.findFirst({
      where: { networkId: network.id, isActive: true },
    });
    
    if (dataPlan) {
      provider = dataPlan.activeApi === "A" ? "smeplug" : "saiful";
    }

    console.log(`[POST /api/airtime/purchase] Using provider: ${provider} for network ${network.name}`);

    // Process purchase
    const result = await purchaseAirtime({
      userId: session.userId,
      amount,
      phoneNumber,
      networkId: parseInt(networkId),
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
        planId: "", // Empty for airtime
        networkId: network.id,
        amount,
        reference: result.reference,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      {
        message: "Airtime purchase initiated",
        reference: result.reference,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/airtime/purchase]", error);
    return NextResponse.json(
      { error: "Purchase failed. Please try again." },
      { status: 500 }
    );
  }
}
