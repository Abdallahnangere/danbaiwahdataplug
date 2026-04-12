import { smeplug } from "@/lib/smeplug";
import { saiful } from "@/lib/saiful";

/**
 * Purchase data from the specified provider
 * Admin determines which provider API delivers each plan
 * Provider info comes from the DataPlan metadata
 */
export async function purchaseData({
  userId,
  planId,
  phoneNumber,
  amount,
  provider, // "smeplug" or "saiful" - determined by admin when creating the plan
}: {
  userId: string;
  planId: string;
  phoneNumber: string;
  amount: number;
  provider: "smeplug" | "saiful";
}) {
  try {
    console.log("[purchaseData] Starting data purchase", {
      userId,
      planId,
      phoneNumber,
      amount,
      provider,
    });

    // Route to appropriate provider based on admin's assignment
    let result;

    if (provider === "saiful") {
      result = await saiful.purchaseData({
        planId,
        phoneNumber,
        networkId: planId, // Will be mapped from plan in database
      });
    } else {
      // Smeplug for MTN, GLO, 9mobile
      result = await smeplug.purchaseData({
        planId,
        phoneNumber,
      });
    }

    console.log("[purchaseData] Provider response", {
      provider,
      success: result.success,
      reference: result.reference,
      error: result.error,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Data purchase failed",
      };
    }

    return {
      success: true,
      reference: result.reference,
    };
  } catch (error) {
    console.error("[purchaseData] Error:", error);
    return {
      success: false,
      error: "An error occurred while processing your request",
    };
  }
}

/**
 * Purchase airtime from the specified provider
 * Admin determines which provider API delivers airtime for each network
 */
export async function purchaseAirtime({
  userId,
  amount,
  phoneNumber,
  networkId,
  provider, // "smeplug" or "saiful"
}: {
  userId: string;
  amount: number;
  phoneNumber: string;
  networkId: number; // 1=MTN, 2=Glo, 3=9mobile, 4=Airtel
  provider: "smeplug" | "saiful";
}) {
  try {
    console.log("[purchaseAirtime] Starting airtime purchase", {
      userId,
      amount,
      phoneNumber,
      networkId,
      provider,
    });

    // Route to appropriate provider
    let result;

    if (provider === "saiful") {
      result = await saiful.purchaseAirtime({
        amount,
        phoneNumber,
        networkId,
      });
    } else {
      // Smeplug for MTN, GLO, 9mobile
      result = await smeplug.purchaseAirtime({
        amount,
        phoneNumber,
      });
    }

    console.log("[purchaseAirtime] Provider response", {
      provider,
      success: result.success,
      reference: result.reference,
      error: result.error,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Airtime purchase failed",
      };
    }

    return {
      success: true,
      reference: result.reference,
    };
  } catch (error) {
    console.error("[purchaseAirtime] Error:", error);
    return {
      success: false,
      error: "An error occurred while processing your request",
    };
  }
}
