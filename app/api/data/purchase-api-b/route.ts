import { prisma } from "@/lib/db";
import * as saiful from "@/lib/saiful";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get("sy_session")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phoneNumber, planId, network, amount, plan: planName } = body;

    // Validate inputs
    if (!phoneNumber || !planId || !network || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get plan details
    const planDetails = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!planDetails) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    // Get user and check balance
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
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

    // Generate reference
    const reference = `DATA_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "DATA_PURCHASE",
        amount: amount,
        status: "PENDING",
        phone: phoneNumber,
        reference: reference,
        method: "API",
        apiUsed: "API_B",
        metadata: {
          planId: planId,
          planName: planName,
          network: network,
        },
      },
    });

    // Call Saiful API (API_B)
    const result = await saiful.purchaseData({
      plan: planDetails.externalPlanId,
      mobileNumber: phoneNumber,
      network: network,
      reference: reference,
    });

    // Update transaction status
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: result.success ? "SUCCESS" : "FAILED",
        externalReference: result.externalReference || undefined,
        description: result.message,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || "Data delivery failed" },
        { status: 400 }
      );
    }

    // Deduct from user balance
    const account = await prisma.account.findUnique({
      where: { userId: user.id },
    });

    if (account) {
      await prisma.account.update({
        where: { id: account.id },
        data: { balance: account.balance - amount },
      });
    }

    // Also update user balance for compatibility
    await prisma.user.update({
      where: { id: user.id },
      data: { balance: user.balance - amount },
    });

    return NextResponse.json({
      success: true,
      message: `${planName} delivered successfully`,
      transaction: {
        id: transaction.id,
        reference: reference,
        status: "SUCCESS",
        amount: amount,
      },
    });
  } catch (error: any) {
    console.error("[DATA PURCHASE API_B] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
