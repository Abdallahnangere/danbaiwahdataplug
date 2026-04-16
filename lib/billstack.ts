/**
 * BillStack Payment Gateway Integration
 * All API calls are over HTTPS with Bearer token authentication
 */

export interface BillStackVirtualAccountRequest {
  email: string;
  reference: string;
  firstName: string;
  lastName: string;
  phone: string;
  bank: string;
}

export interface BillStackAccount {
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_id: string;
  created_at: string;
}

export interface BillStackVirtualAccountResponse {
  status: boolean;
  message: string;
  data?: {
    reference: string;
    account: BillStackAccount[];
    meta: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

/**
 * Create a virtual account on BillStack
 */
export async function createBillStackVirtualAccount(
  payload: BillStackVirtualAccountRequest
): Promise<BillStackVirtualAccountResponse> {
  const secretKey = process.env.BILLSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new Error("BILLSTACK_SECRET_KEY is not configured in environment variables");
  }

  const url = "https://api.billstack.co/v2/thirdparty/generateVirtualAccount/";

  console.log("[BILLSTACK] Creating virtual account...", {
    email: payload.email,
    reference: payload.reference,
    firstName: payload.firstName,
    lastName: payload.lastName,
    phone: payload.phone,
    bank: payload.bank,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as BillStackVirtualAccountResponse;

    if (!response.ok) {
      console.error("[BILLSTACK] API Error:", {
        status: response.status,
        statusText: response.statusText,
        data,
      });
      throw new Error(data.message || `BillStack API error: ${response.status}`);
    }

    if (!data.status) {
      console.error("[BILLSTACK] Virtual account creation failed:", data.message);
      throw new Error(data.message || "Failed to create virtual account");
    }

    console.log("[BILLSTACK] Virtual account created successfully:", {
      reference: data.data?.reference,
      account: data.data?.account?.[0]?.account_number,
    });

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[BILLSTACK] Request failed:", errorMessage);
    throw error;
  }
}

/**
 * Generate a unique reference for a user
 * Format: DNBWH-<timestamp>-<userId>
 */
export function generateBillStackReference(userId: string): string {
  const timestamp = Date.now();
  const userSuffix = userId.slice(-6);
  return `DNBWH-${timestamp}-${userSuffix}`;
}

/**
 * Split a full name into firstName and lastName
 * If only one word, both fields get the same value
 */
export function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: parts[0] };
  }
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}
