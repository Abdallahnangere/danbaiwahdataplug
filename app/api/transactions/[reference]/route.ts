import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { smeplug } from "@/lib/smeplug";
import { saiful } from "@/lib/saiful";

export async function GET(
  req: Request,
  { params }: { params: { reference: string } }
) {
  try {
    // Authentication
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reference } = params;

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

    // If transaction is pending, verify with provider
    if (transaction.status === "PENDING") {
      // Determine which provider based on metadata
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

        // Update transaction status if verification succeeded
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
    console.error("[GET /api/transactions/[reference]]", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction status" },
      { status: 500 }
    );
  }
}
