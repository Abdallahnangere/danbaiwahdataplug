import axios, { AxiosError } from "axios";
import crypto from "crypto";

/**
 * Wiaxy/BillStack Payment Gateway Integration
 * Handles virtual account creation and webhook verification
 */

// Types
export interface CreateVirtualAccountParams {
  reference: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  bank: "9PSB" | "SAFEHAVEN" | "PROVIDUS" | "BANKLY" | "PALMPAY";
}

export interface VirtualAccountData {
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_id: string;
  created_at: string;
}

export interface CreateVirtualAccountResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    account: VirtualAccountData[];
    meta: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export interface WebhookPayload {
  event: string;
  data: {
    type: string;
    reference: string;
    merchant_reference: string;
    wiaxy_ref: string;
    amount: string | number;
    created_at: string;
    account: {
      account_number: string;
      account_name: string;
      bank_name: string;
      created_at: string;
    };
    payer: {
      account_number: string;
      first_name: string;
      last_name: string;
      createdAt: string;
    };
  };
}

// Initialize Wiaxy client
const WIAXY_BASE_URL = process.env.WIAXY_BASE_URL || "https://api.billstack.co/v2";
const WIAXY_SECRET_KEY = process.env.WIAXY_SECRET_KEY;

const wiaxyClient = axios.create({
  baseURL: WIAXY_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

/**
 * Create a virtual account for a user
 */
export async function createVirtualAccount(
  params: CreateVirtualAccountParams
): Promise<{ success: boolean; data?: VirtualAccountData; error?: string }> {
  try {
    if (!WIAXY_SECRET_KEY) {
      throw new Error("WIAXY_SECRET_KEY not configured");
    }

    const {
      reference,
      email,
      phone,
      firstName,
      lastName,
      bank,
    } = params;

    console.log("[WIAXY] Creating virtual account", {
      reference,
      email,
      phone,
      bank,
      timestamp: new Date().toISOString(),
    });

    const payload = {
      email,
      reference,
      firstName,
      lastName,
      phone,
      bank,
    };

    const response = await wiaxyClient.post<CreateVirtualAccountResponse>(
      "/thirdparty/generateVirtualAccount/",
      payload,
      {
        headers: {
          Authorization: `Bearer ${WIAXY_SECRET_KEY}`,
        },
      }
    );

    if (!response.data.status) {
      console.error("[WIAXY] Account creation failed:", response.data.message);
      return {
        success: false,
        error: response.data.message || "Account creation failed",
      };
    }

    const account = response.data.data.account[0];

    console.log("[WIAXY] Account created successfully", {
      reference,
      account_number: account.account_number,
      bank_name: account.bank_name,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      data: account,
    };
  } catch (error: any) {
    console.error("[WIAXY] Account creation error", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      timestamp: new Date().toISOString(),
    });

    const errorMsg =
      error.response?.data?.message ||
      error.message ||
      "Failed to create virtual account";

    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Verify webhook signature
 * Expected: x-wiaxy-signature header = MD5(secret_key)
 */
export function verifyWebhookSignature(
  signature: string | undefined
): boolean {
  if (!WIAXY_SECRET_KEY) {
    console.warn("[WIAXY WEBHOOK] Secret key not configured");
    return false;
  }

  if (!signature) {
    console.warn("[WIAXY WEBHOOK] Missing x-wiaxy-signature header");
    return false;
  }

  const expectedSignature = crypto
    .createHash("md5")
    .update(WIAXY_SECRET_KEY)
    .digest("hex");

  const isValid = signature === expectedSignature;

  if (!isValid) {
    console.error("[WIAXY WEBHOOK] Invalid signature", {
      received: signature,
      expected: expectedSignature,
    });
  }

  return isValid;
}

/**
 * Parse and validate webhook payload
 */
export function parseWebhookPayload(body: any): WebhookPayload | null {
  try {
    if (!body || typeof body !== "object") {
      console.error("[WIAXY WEBHOOK] Invalid payload format");
      return null;
    }

    const payload = body as WebhookPayload;

    // Validate required fields
    if (!payload.event || !payload.data) {
      console.error("[WIAXY WEBHOOK] Missing required fields");
      return null;
    }

    if (payload.event !== "PAYMENT_NOTIFIFICATION") {
      console.warn("[WIAXY WEBHOOK] Unexpected event type:", payload.event);
      return null;
    }

    if (
      !payload.data.reference ||
      !payload.data.merchant_reference ||
      !payload.data.amount
    ) {
      console.error("[WIAXY WEBHOOK] Missing payment data fields");
      return null;
    }

    console.log("[WIAXY WEBHOOK] Valid payload received", {
      reference: payload.data.reference,
      merchant_reference: payload.data.merchant_reference,
      amount: payload.data.amount,
      timestamp: new Date().toISOString(),
    });

    return payload;
  } catch (error) {
    console.error("[WIAXY WEBHOOK] Payload parsing error:", error);
    return null;
  }
}

/**
 * Extract relevant information from webhook
 */
export function extractPaymentInfo(payload: WebhookPayload) {
  return {
    wiaxyReference: payload.data.reference,
    merchantReference: payload.data.merchant_reference,
    wiaxyRef: payload.data.wiaxy_ref,
    amount: parseFloat(String(payload.data.amount)),
    accountNumber: payload.data.account.account_number,
    accountName: payload.data.account.account_name,
    bankName: payload.data.account.bank_name,
    payerName: `${payload.data.payer.first_name} ${payload.data.payer.last_name}`,
    paymentDate: payload.data.created_at,
  };
}
