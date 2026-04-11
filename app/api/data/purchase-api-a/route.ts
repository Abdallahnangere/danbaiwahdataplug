import { prisma } from "@/lib/db";
import * as smeplug from "@/lib/smeplug";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const requestStartTime = Date.now();
  
  try {
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`📱 [DATA PURCHASE - API_A] New Request Started`);
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`🔗 Endpoint: /api/data/purchase-api-a`);
    
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get("sy_session")?.value;

    if (!token) {
      console.error(`❌ [AUTH] No session token provided`);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      console.error(`❌ [AUTH] Invalid token`);
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    console.log(`✅ [AUTH] User authenticated: ${payload.userId}`);

    const body = await request.json();
    const { phoneNumber, planId, network, amount, plan: planName } = body;

    console.log(`📋 [REQUEST PAYLOAD] Received:`);
    console.log(`   • Phone Number: ${phoneNumber}`);
    console.log(`   • Plan ID: ${planId}`);
    console.log(`   • Network: ${network}`);
    console.log(`   • Amount: ₦${amount}`);
    console.log(`   • Plan Name: ${planName}`);

    // Validate inputs
    if (!phoneNumber || !planId || !network || !amount) {
      console.error(`❌ [VALIDATION] Missing required fields`);
      console.log(`   • phoneNumber: ${phoneNumber ? '✓' : '✗'}`);
      console.log(`   • planId: ${planId ? '✓' : '✗'}`);
      console.log(`   • network: ${network ? '✓' : '✗'}`);
      console.log(`   • amount: ${amount ? '✓' : '✗'}`);
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`✅ [VALIDATION] All required fields present`);

    // Get plan details
    console.log(`🔍 [DATABASE] Fetching plan details for ID: ${planId}`);
    const planDetails = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!planDetails) {
      console.error(`❌ [DATABASE] Plan not found with ID: ${planId}`);
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    console.log(`✅ [DATABASE] Plan found:`, {
      name: planDetails.name,
      network: planDetails.network,
      price: planDetails.price,
      externalNetworkId: planDetails.externalNetworkId,
      externalPlanId: planDetails.externalPlanId,
    });

    // Get user and check balance
    console.log(`🔍 [DATABASE] Fetching user: ${payload.userId}`);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      console.error(`❌ [DATABASE] User not found: ${payload.userId}`);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log(`✅ [DATABASE] User found:`, {
      id: user.id,
      name: user.fullName,
      email: user.email,
      currentBalance: user.balance,
      phone: user.phone,
    });

    console.log(`💰 [BALANCE CHECK] Required: ₦${amount}, Available: ₦${user.balance}`);
    if (user.balance < amount) {
      console.error(`❌ [BALANCE] Insufficient balance! Needed: ₦${amount}, Have: ₦${user.balance}`);
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }
    console.log(`✅ [BALANCE] Sufficient balance confirmed`);

    // Generate reference
    const reference = `DATA_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    console.log(`🆔 [REFERENCE] Generated: ${reference}`);

    // Create transaction record
    console.log(`💾 [DATABASE] Creating PENDING transaction...`);
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "DATA_PURCHASE",
        amount: amount,
        status: "PENDING",
        phone: phoneNumber,
        reference: reference,
        method: "API",
        apiUsed: "API_A",
        metadata: {
          planId: planId,
          planName: planName,
          network: network,
        },
      },
    });

    console.log(`✅ [DATABASE] Transaction created:`, {
      id: transaction.id,
      reference: transaction.reference,
      status: transaction.status,
      amount: transaction.amount,
    });

    // Call SMEPlug API (API_A)
    console.log(`\n🌐 [SMEPLUG API] Calling SMEPlug API_A...`);
    console.log(`📤 [SMEPLUG REQUEST]:`);
    console.log(`   • externalNetworkId: ${planDetails.externalNetworkId}`);
    console.log(`   • externalPlanId: ${planDetails.externalPlanId}`);
    console.log(`   • phone: ${phoneNumber}`);
    console.log(`   • reference: ${reference}`);

    const result = await smeplug.purchaseData({
      externalNetworkId: planDetails.externalNetworkId,
      externalPlanId: planDetails.externalPlanId,
      phone: phoneNumber,
      reference: reference,
    });

    console.log(`📥 [SMEPLUG RESPONSE]:`);
    console.log(`   • success: ${result.success}`);
    console.log(`   • message: ${result.message}`);
    console.log(`   • externalReference: ${result.externalReference || 'N/A'}`);

    // Update transaction status
    console.log(`💾 [DATABASE] Updating transaction status...`);
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: result.success ? "SUCCESS" : "FAILED",
        externalReference: result.externalReference || undefined,
        description: result.message,
      },
    });

    console.log(`✅ [DATABASE] Transaction updated:`, {
      id: updatedTransaction.id,
      status: updatedTransaction.status,
      description: updatedTransaction.description,
    });

    if (!result.success) {
      console.error(`❌ [SMEPLUG] API call failed: ${result.message}`);
      return NextResponse.json(
        { error: result.message || "Data delivery failed" },
        { status: 400 }
      );
    }

    // Deduct from user balance
    console.log(`💾 [DATABASE] Updating user balance...`);
    const account = await prisma.account.findUnique({
      where: { userId: user.id },
    });

    if (account) {
      console.log(`📊 [ACCOUNT] Current balance: ₦${account.balance}`);
      const newBalance = account.balance - amount;
      await prisma.account.update({
        where: { id: account.id },
        data: { balance: newBalance },
      });
      console.log(`✅ [ACCOUNT] Balance updated: ₦${account.balance} → ₦${newBalance}`);
    }

    // Also update user balance for compatibility
    const newUserBalance = user.balance - amount;
    await prisma.user.update({
      where: { id: user.id },
      data: { balance: newUserBalance },
    });

    console.log(`✅ [USER] Balance updated: ₦${user.balance} → ₦${newUserBalance}`);

    const responseData = {
      success: true,
      message: `${planName} delivered successfully`,
      transaction: {
        id: transaction.id,
        reference: reference,
        status: "SUCCESS",
        amount: amount,
      },
    };

    const requestDuration = Date.now() - requestStartTime;
    console.log(`\n✅ [SUCCESS] Purchase completed successfully!`);
    console.log(`⏱️  Total request duration: ${requestDuration}ms`);
    console.log(`📤 [RESPONSE]:`, responseData);
    console.log(`${'═'.repeat(80)}\n`);

    return NextResponse.json(responseData);
  } catch (error: any) {
    const requestDuration = Date.now() - requestStartTime;
    console.error(`\n❌ [ERROR] Request failed after ${requestDuration}ms`);
    console.error(`📍 Error Type: ${error.name}`);
    console.error(`💬 Error Message: ${error.message}`);
    console.error(`📋 Error Details:`, error);
    console.error(`${'═'.repeat(80)}\n`);
    
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
