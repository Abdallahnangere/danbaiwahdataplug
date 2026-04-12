import { NextResponse, NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { smeplug } from "@/lib/smeplug";
import { saiful } from "@/lib/saiful";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    // Authentication
    const session = await getSessionUser(req);
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reference } = await params;

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

    // Verify user owns this transaction
    if (transaction.userId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // If transaction is pending, verify with provider
    if (transaction.status === "PENDING") {
      // Determine which provider based on metadata
      let result;

      // Get the network for this transaction
      const network = await prisma.dataNetwork.findUnique({
        where: { id: transaction.networkId },
      });

      if (network) {
        // For now, default to Saiful for verification
        // In future, could check which provider based on plan
        result = await saiful.verifyTransaction(reference);

        // Update transaction status if verification succeeded
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
    console.error("[GET /api/transactions/[reference]]", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction status" },
      { status: 500 }
    );
  }
}
