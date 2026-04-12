// Saiful API integration for all networks
// Supports: MTN, Airtel, Glo, 9mobile for both Data and Airtime
// https://saiful.net/developers

const SAIFUL_API_KEY = process.env.SAIFUL_API_KEY;
const SAIFUL_BASE_URL = "https://app.saifulegendconnect.com/api";

// Network ID mapping
const NETWORK_IDS = {
  MTN: 1,
  GLO: 2,
  "9MOBILE": 3,
  AIRTEL: 4,
};

export const saiful = {
  /**
   * Purchase data for any network
   * Network ID is determined by the plan's network mapping in database
   */
  async purchaseData({
    planId,
    phoneNumber,
    networkId,
  }: {
    planId: string;
    phoneNumber: string;
    networkId: string;
  }) {
    try {
      if (!SAIFUL_API_KEY) {
        throw new Error("Saiful API key not configured");
      }

      const requestBody = {
        plan_id: planId,
        mobile_number: phoneNumber,
        network: networkId, // Admin determines which network/API delivers this plan
      };

      console.log("[Saiful] Sending data purchase request:", {
        endpoint: `${SAIFUL_BASE_URL}/data`,
        body: requestBody,
      });

      const response = await fetch(`${SAIFUL_BASE_URL}/data`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${SAIFUL_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      console.log("[Saiful] Data purchase response:", {
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
        reference: data.ident || data.id,
      };
    } catch (error) {
      console.error("[saiful.purchaseData]", error);
      return {
        success: false,
        error: "Failed to process data purchase",
      };
    }
  },

  /**
   * Purchase airtime for any network
   * Network ID: 1 = MTN, 2 = Glo, 3 = 9mobile, 4 = Airtel
   */
  async purchaseAirtime({
    amount,
    phoneNumber,
    networkId,
  }: {
    amount: number;
    phoneNumber: string;
    networkId: number;
  }) {
    try {
      if (!SAIFUL_API_KEY) {
        throw new Error("Saiful API key not configured");
      }

      const requestBody = {
        amount: amount,
        mobile_number: phoneNumber,
        network: networkId, // 1=MTN, 2=Glo, 3=9mobile, 4=Airtel
      };

      console.log("[Saiful] Sending airtime purchase request:", {
        endpoint: `${SAIFUL_BASE_URL}/topup`,
        body: requestBody,
      });

      const response = await fetch(`${SAIFUL_BASE_URL}/topup`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${SAIFUL_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      console.log("[Saiful] Airtime purchase response:", {
        status: response.status,
        data: data,
      });

      if (!response.ok) {
        return {
          success: false,
          error:
            data.errors?.status?.[0] ||
            data.message ||
            "Airtime purchase failed",
        };
      }

      return {
        success: true,
        reference: data.data?.ident || data.data?.id,
      };
    } catch (error) {
      console.error("[saiful.purchaseAirtime]", error);
      return {
        success: false,
        error: "Failed to process airtime purchase",
      };
    }
  },



  async verifyTransaction(reference: string) {
    try {
      if (!SAIFUL_API_KEY) {
        throw new Error("Saiful API key not configured");
      }

      console.log("[Saiful] Verifying transaction:", reference);

      const response = await fetch(
        `${SAIFUL_BASE_URL}/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${SAIFUL_API_KEY}`,
          },
        }
      );

      const data = await response.json();

      console.log("[Saiful] Verification response:", data);

      if (!response.ok) {
        return { success: false, status: "FAILED" };
      }

      // Map "successful" status to "SUCCESS"
      const status =
        data.data?.Status === "successful" ? "SUCCESS" : "FAILED";

      return {
        success: true,
        status: status,
      };
    } catch (error) {
      console.error("[saiful.verifyTransaction]", error);
      return { success: false, status: "UNKNOWN" };
    }
  },
};
