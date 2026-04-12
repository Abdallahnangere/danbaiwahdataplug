// Smeplug API integration for MTN, Glo, and 9mobile
// https://smeplug.com/developers

const SMEPLUG_API_KEY = process.env.SMEPLUG_API_KEY;
const SMEPLUG_BASE_URL = "https://api.smeplug.com";

export const smeplug = {
  async purchaseData({
    planId,
    phoneNumber,
  }: {
    planId: string;
    phoneNumber: string;
  }) {
    try {
      if (!SMEPLUG_API_KEY) {
        throw new Error("Smeplug API key not configured");
      }

      const requestBody = {
        plan_id: planId,
        phone: phoneNumber,
      };

      console.log("[Smeplug] Sending data purchase request:", {
        endpoint: `${SMEPLUG_BASE_URL}/api/v1/purchase/data`,
        body: requestBody,
      });

      const response = await fetch(
        `${SMEPLUG_BASE_URL}/api/v1/purchase/data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SMEPLUG_API_KEY}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      console.log("[Smeplug] Data purchase response:", {
        status: response.status,
        data: data,
      });

      if (!response.ok) {
        return {
          success: false,
          error: data.message || "Data purchase failed",
        };
      }

      return {
        success: true,
        reference: data.reference || data.transaction_id,
      };
    } catch (error) {
      console.error("[smeplug.purchaseData]", error);
      return {
        success: false,
        error: "Failed to process data purchase",
      };
    }
  },

  async purchaseAirtime({
    amount,
    phoneNumber,
  }: {
    amount: number;
    phoneNumber: string;
  }) {
    try {
      if (!SMEPLUG_API_KEY) {
        throw new Error("Smeplug API key not configured");
      }

      const requestBody = {
        amount,
        phone: phoneNumber,
      };

      console.log("[Smeplug] Sending airtime purchase request:", {
        endpoint: `${SMEPLUG_BASE_URL}/api/v1/purchase/airtime`,
        body: requestBody,
      });

      const response = await fetch(
        `${SMEPLUG_BASE_URL}/api/v1/purchase/airtime`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SMEPLUG_API_KEY}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      console.log("[Smeplug] Airtime purchase response:", {
        status: response.status,
        data: data,
      });

      if (!response.ok) {
        return {
          success: false,
          error: data.message || "Airtime purchase failed",
        };
      }

      return {
        success: true,
        reference: data.reference || data.transaction_id,
      };
    } catch (error) {
      console.error("[smeplug.purchaseAirtime]", error);
      return {
        success: false,
        error: "Failed to process airtime purchase",
      };
    }
  },

  async verifyTransaction(reference: string) {
    try {
      if (!SMEPLUG_API_KEY) {
        throw new Error("Smeplug API key not configured");
      }

      console.log("[Smeplug] Verifying transaction:", reference);

      const response = await fetch(
        `${SMEPLUG_BASE_URL}/api/v1/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${SMEPLUG_API_KEY}`,
          },
        }
      );

      const data = await response.json();

      console.log("[Smeplug] Verification response:", data);

      if (!response.ok) {
        return { success: false, status: "FAILED" };
      }

      return {
        success: true,
        status: data.status,
      };
    } catch (error) {
      console.error("[smeplug.verifyTransaction]", error);
      return { success: false, status: "UNKNOWN" };
    }
  },
};
