import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { purchaseAirtime } from "@/lib/saiful"
import { z } from "zod"
import bcryptjs from "bcryptjs"

const purchaseSchema = z.object({
  buyerPhone: z.string().regex(/^0[0-9]{10}$/, "Invalid buyer phone"),
  recipientPhone: z.string().regex(/^0[0-9]{10}$/, "Invalid recipient phone number"),
  amount: z.number().min(50, "Minimum amount is ₦50").max(50000, "Maximum amount is ₦50,000"),
  network: z.string().min(1, "Select network"),
  pin: z.string().regex(/^\d{6}$/, "Invalid PIN"),
})

export async function POST(req: NextRequest) {
  const requestStartTime = Date.now();
  
  try {
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`📱 [AIRTIME PURCHASE] New Request Started`);
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`🔗 Endpoint: /api/airtime/purchase`);
    
    const body = await req.json()
    console.log(`\n📋 [REQUEST PAYLOAD] Received:`);
    console.log(`   • Buyer Phone: ${body.buyerPhone}`);
    console.log(`   • Recipient Phone: ${body.recipientPhone}`);
    console.log(`   • Amount: ₦${body.amount}`);
    console.log(`   • Network: ${body.network}`);
    
    const { buyerPhone, recipientPhone, amount, network, pin } = purchaseSchema.parse(body)

    console.log(`✅ [VALIDATION] All fields validated successfully`);

    // DIRECT AUTH: Look up user by buyerPhone
    console.log(`\n🔍 [DATABASE] Looking up buyer by phone: ${buyerPhone}`);
    const userData = await prisma.user.findUnique({
      where: { phone: buyerPhone },
    })

    if (!userData) {
      console.error(`❌ [DATABASE] User not found by phone: ${buyerPhone}`);
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    console.log(`✅ [DATABASE] User found:`, {
      userId: userData.id,
      name: userData.fullName,
      email: userData.email,
      balance: userData.balance,
      phone: userData.phone,
    });

    if (userData.isBanned) {
      console.error(`❌ [SECURITY] Account banned: ${userData.id}`);
      return NextResponse.json(
        { success: false, error: "Account is banned" },
        { status: 403 }
      )
    }

    console.log(`✅ [SECURITY] Account is active and not banned`);

    // Verify PIN
    if (!userData.pinHash) {
      console.error(`❌ [AUTH] PIN not set for user: ${userData.id}`);
      return NextResponse.json(
        { success: false, error: "PIN not set" },
        { status: 400 }
      )
    }

    console.log(`🔐 [AUTH] Verifying PIN...`);
    const isPinValid = await bcryptjs.compare(pin, userData.pinHash)
    
    if (!isPinValid) {
      console.error(`❌ [AUTH] Invalid PIN for user: ${userData.id}`);
      return NextResponse.json(
        { success: false, error: "Invalid PIN" },
        { status: 401 }
      )
    }

    console.log(`✅ [AUTH] PIN verified successfully`);

    // Check balance (convert naira to kobo)
    const amountInKobo = amount * 100
    console.log(`\n💰 [BALANCE CHECK] Required: ₦${amount} (${amountInKobo} kobo), Available: ${userData.balance} kobo (₦${userData.balance / 100})`);
    
    if (userData.balance < amountInKobo) {
      const needed = amountInKobo - userData.balance;
      console.error(`❌ [BALANCE] Insufficient balance! Needed: ${needed} kobo (₦${needed / 100}), Have: ${userData.balance} kobo (₦${userData.balance / 100})`);
      return NextResponse.json(
        { success: false, error: "Insufficient balance" },
        { status: 400 }
      )
    }

    console.log(`✅ [BALANCE] Sufficient balance confirmed`);

    // Deduct balance and create transaction atomically
    const reference = `AIRTIME-${userData.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    console.log(`\n🆔 [REFERENCE] Generated: ${reference}`);

    console.log(`💾 [DATABASE] Creating PENDING transaction...`);
    await prisma.$transaction(async (tx) => {
      // Deduct balance (in kobo)
      await tx.user.update({
        where: { id: userData.id },
        data: { balance: { decrement: amountInKobo } },
      })

      // Create transaction (amount in naira for consistency with data purchase)
      await tx.transaction.create({
        data: {
          userId: userData.id,
          type: "AIRTIME_PURCHASE",
          amount: amount,  // Store in naira, not kobo
          status: "PENDING",
          reference,
          description: `Airtime: ₦${amount} to ${recipientPhone}`,
          phone: recipientPhone,
        },
      })
    })

    console.log(`✅ [DATABASE] Transaction created and balance deducted:`);
    console.log(`   • Previous Balance: ₦${userData.balance / 100}`);
    console.log(`   • New Balance: ₦${(userData.balance - amountInKobo) / 100}`);

    // Map network names to IDs
    const networkIds: { [key: string]: number } = {
      "mtn": 1,
      "glo": 2,
      "9mobile": 3,
      "airtel": 4,
    }

    // Call airtime provider API
    let apiResult
    try {
      console.log(`\n🌐 [AIRTIME PROVIDER API] Calling Saiful API...`);
      console.log(`   • Mobile Number: ${recipientPhone}`);
      console.log(`   • Amount: ₦${amount}`);
      console.log(`   • Network ID: ${networkIds[network.toLowerCase()] || 1}`);
      
      apiResult = await purchaseAirtime({
        mobileNumber: recipientPhone,
        amount,
        network: networkIds[network.toLowerCase()] || 1,
      })

      if (apiResult.success) {
        // Update transaction to success
        await prisma.transaction.updateMany({
          where: { reference },
          data: { status: "SUCCESS" },
        })

        const duration = Date.now() - requestStartTime;
        console.log(`\n✅ [SUCCESS] Airtime purchased successfully!`);
        console.log(`   • Recipient: ${recipientPhone}`);
        console.log(`   • Amount: ₦${amount}`);
        console.log(`   • Reference: ${reference}`);
        console.log(`   • External Reference: ${apiResult.externalReference || 'N/A'}`);
        console.log(`⏱️  Total request duration: ${duration}ms`);
        console.log(`${'═'.repeat(80)}\n`);

        return NextResponse.json(
          {
            success: true,
            message: "Airtime purchased successfully",
            reference,
          },
          { status: 200 }
        )
      } else {
        // API failed, refund balance
        console.error(`❌ [AIRTIME API] API call failed: ${apiResult.message}`);
        
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: userData.id },
            data: { balance: { increment: amountInKobo } },
          })

          await tx.transaction.updateMany({
            where: { reference },
            data: { status: "FAILED" },
          })
        })

        console.log(`💾 [DATABASE] Balance refunded due to API failure`);
        console.log(`   • Refunded: ₦${amount}`);

        return NextResponse.json(
          { success: false, error: apiResult.message || "Purchase failed" },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error(`\n❌ [AIRTIME API ERROR] Exception during API call:`, error)

      // Refund on API error
      console.log(`💾 [DATABASE] Refunding balance due to exception...`);
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userData.id },
          data: { balance: { increment: amountInKobo } },
        })

        await tx.transaction.updateMany({
          where: { reference },
          data: { status: "FAILED" },
        })
      })

      console.error(`❌ [AIRTIME PURCHASE] Exception handled, balance refunded: ${userData.id}`);
      console.error(`${'═'.repeat(80)}\n`);

      return NextResponse.json(
        { success: false, error: "Purchase failed. Balance refunded." },
        { status: 500 }
      )
    }
  } catch (error: any) {
    const duration = Date.now() - requestStartTime;
    console.error(`\n❌ [ERROR] Request failed after ${duration}ms`);
    console.error(`📍 Error Type: ${error.name}`);
    console.error(`💬 Error Message: ${error.message}`);
    
    if (error instanceof z.ZodError) {
      console.error(`❌ [VALIDATION] Validation error:`, error.issues[0].message);
      console.error(`${'═'.repeat(80)}\n`);
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      )
    }
    
    console.error(`📋 Error Details:`, error);
    console.error(`${'═'.repeat(80)}\n`);
    
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    )
  }
}
