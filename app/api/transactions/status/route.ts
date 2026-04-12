import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { smeplug } from "@/lib/smeplug";
import { saiful } from "@/lib/saiful";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { error: "Reference is required" },
        { status: 400 }
      );
    }

    // Authentication - optional for this endpoint if reference is provided
    const session = await auth();

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

    // Verify user owns this transaction if authenticated
    if (session?.user?.id && transaction.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // If transaction is pending, verify with provider
    if (transaction.status === "PENDING") {
      let result;

      if (
        transaction.metadata &&
        typeof transaction.metadata === "object" &&
        "networkName" in transaction.metadata
      ) {
        const networkName = (transaction.metadata as any).networkName;

        if (networkName.toLowerCase() === "airtel") {
          result = await saiful.verifyTransaction(reference);
        } else {
          result = await smeplug.verifyTransaction(reference);
        }

        // Update transaction status
        const newStatus = result.status === "SUCCESS" ? "COMPLETED" : "FAILED";

        if (newStatus !== "PENDING") {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: newStatus },
          });

          return NextResponse.json(
            {
              transaction: {
                ...transaction,
                status: newStatus,
              },
            },
            { status: 200 }
          );
        }
      }
    }

    return NextResponse.json({ transaction }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/transactions/status]", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction status" },
      { status: 500 }
    );
  }
}
