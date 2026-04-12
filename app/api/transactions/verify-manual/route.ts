import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reference, proofOfPayment } = body;

    if (!reference || !proofOfPayment) {
      return NextResponse.json(
        { error: "Reference and proof of payment are required" },
        { status: 400 }
      );
    }

    // Get transaction
    const transaction = await prisma.transaction.findUnique({
      where: { reference },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Verify user owns this transaction
    if (transaction.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Create verification request
    const verification = await prisma.manualTransactionVerification.create({
      data: {
        transactionId: transaction.id,
        userId: session.user.id,
        proofOfPayment,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      {
        message: "Verification request submitted",
        verificationId: verification.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/transactions/verify-manual]", error);
    return NextResponse.json(
      { error: "Failed to submit verification" },
      { status: 500 }
    );
  }
}
