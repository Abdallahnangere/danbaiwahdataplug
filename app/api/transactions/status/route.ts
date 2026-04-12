import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
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
    const session = await getSessionUser(request as any);

    // Get transaction
    const transaction = await prisma.dataTransaction.findUnique({
      where: { reference },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Verify user owns this transaction if authenticated
    if (session?.userId && transaction.userId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // If transaction is pending, verify with provider
    if (transaction.status === "PENDING") {
      let result;

      // Get the network for this transaction
      const network = await prisma.dataNetwork.findUnique({
        where: { id: transaction.networkId },
      });

      if (network) {
        // For now, default to Saiful for verification
        // In future, could check which provider based on plan
        result = await saiful.verifyTransaction(reference);

        // Update transaction status
        const newStatus = result.status === "SUCCESS" ? "SUCCESS" : "FAILED";

        await prisma.dataTransaction.update({
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

    return NextResponse.json({ transaction }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/transactions/status]", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction status" },
      { status: 500 }
    );
  }
}
