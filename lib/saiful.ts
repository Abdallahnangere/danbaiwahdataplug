import axios from "axios";

interface SaifulPurchaseParams {
  plan: number;  // Plan ID as integer
  mobileNumber: string;
  network: string;
  reference: string;
}

interface SaifulResponse {
  success: boolean;
  message: string;
  externalReference?: string;
}

export async function purchaseData(params: SaifulPurchaseParams): Promise<SaifulResponse> {
  try {
    const { plan, mobileNumber, network, reference } = params;

    const SAIFUL_API_URL = process.env.SAIFUL_API_URL || "https://app.saifulegendconnect.com/api";
    const SAIFUL_API_KEY = process.env.SAIFUL_API_KEY;

    if (!SAIFUL_API_KEY) {
      throw new Error("Saiful API key not configured");
    }

    // Convert network enum to number for API
    const networkMap: { [key: string]: number } = {
      "MTN": 1,
      "GLO": 2,
      "NINEMOBILE": 3,
      "AIRTEL": 4,
    };
    
    const networkId = networkMap[network.toUpperCase()] || 1;

    const requestBody = {
      plan: plan,  // Send plan as integer ID, not string
      mobile_number: mobileNumber,
      network: networkId,
    };

    console.log("[SAIFUL REQUEST]", {
      url: `${SAIFUL_API_URL}/data/${reference}`,
      body: requestBody,
      timestamp: new Date().toISOString(),
      reference,
    });

    // Append reference to URL for idempotency
    const response = await axios.post(
      `${SAIFUL_API_URL}/data/${reference}`,
      requestBody,
      {
        headers: {
          "Authorization": `Bearer ${SAIFUL_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    console.log("[SAIFUL RESPONSE]", {
      status: response.status,
      data: response.data,
      timestamp: new Date().toISOString(),
      reference,
    });

    // Parse response - Saiful returns data nested under 'data' key
    const responseData = response.data?.data || response.data;
    
    if (responseData && (responseData.Status === "successful" || responseData.status === "successful")) {
      const returnData = {
        success: true,
        message: responseData.description || "Data purchase successful",
        externalReference: responseData.ident,
      };
      console.log("[SAIFUL SUCCESS]", returnData);
      return returnData;
    } else if (responseData?.Status === "pending" || responseData?.status === "pending") {
      const returnData = {
        success: true,
        message: responseData.description || "Data purchase pending",
        externalReference: responseData.ident,
      };
      console.log("[SAIFUL PENDING]", returnData);
      return returnData;
    } else {
      const errorMsg = responseData?.description || responseData?.message || "Data purchase failed";
      console.log("[SAIFUL FAILED]", { message: errorMsg, response: responseData });
      return {
        success: false,
        message: errorMsg,
      };
    }
  } catch (error: any) {
    console.error("[SAIFUL API ERROR]", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      timestamp: new Date().toISOString(),
    });

    if (error.response) {
      // API returned an error response
      const errorMessage = error.response.data?.description || error.response.data?.message || `API Error: ${error.response.status}`;
      console.error("[SAIFUL API DETAILS]", {
        errorMessage,
        apiResponse: error.response.data,
      });
      return {
        success: false,
        message: error.response.data?.message || `API Error: ${error.response.status}`,
      };
    } else if (error.code === "ECONNABORTED") {
      // Timeout
      return {
        success: false,
        message: "Request timeout - please try again",
      };
    } else {
      // Network or other error
      return {
        success: false,
        message: "Network error - please try again",
      };
    }
  }
}

interface AirtimePurchaseParams {
  mobileNumber: string;
  amount: number;
  network: number; // Network ID: MTN=1, Glo=2, 9Mobile=3, Airtel=4
}

export async function purchaseAirtime(params: AirtimePurchaseParams): Promise<SaifulResponse> {
  try {
    const { mobileNumber, amount, network } = params;

    // Saiful API endpoint and authentication
    const SAIFUL_API_URL = process.env.SAIFUL_API_URL || "https://app.saifulegendconnect.com/api";
    const SAIFUL_API_KEY = process.env.SAIFUL_API_KEY;

    if (!SAIFUL_API_KEY) {
      throw new Error("Saiful API key not configured");
    }

    const response = await axios.post(
      `${SAIFUL_API_URL}/topup`,
      {
        mobile_number: mobileNumber,
        amount,
        network,
      },
      {
        headers: {
          "Authorization": `Bearer ${SAIFUL_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 seconds
      }
    );

    // Parse response - Saiful returns data nested under 'data' key
    const responseData = response.data?.data || response.data;
    
    // Check for successful status - can be "successful" or "pending"
    if (responseData && (responseData.Status === "successful" || responseData.status === "successful")) {
      return {
        success: true,
        message: responseData.description || "Airtime purchase successful",
        externalReference: responseData.ident,
      };
    } else if (responseData?.Status === "pending") {
      // Pending transactions should be treated as success for now
      return {
        success: true,
        message: responseData.description || "Airtime purchase pending",
        externalReference: responseData.ident,
      };
    } else {
      return {
        success: false,
        message: responseData?.description || responseData?.message || "Airtime purchase failed",
      };
    }
  } catch (error: any) {
    console.error("[SAIFUL AIRTIME ERROR]", error);

    if (error.response) {
      // API returned an error response
      return {
        success: false,
        message: error.response.data?.message || `API Error: ${error.response.status}`,
      };
    } else if (error.code === "ECONNABORTED") {
      // Timeout
      return {
        success: false,
        message: "Request timeout - please try again",
      };
    } else {
      // Network or other error
      return {
        success: false,
        message: "Network error - please try again",
      };
    }
  }
}

interface EPinPurchaseParams {
  examName: "WAEC" | "NECO" | "NABTEB";
  quantity: number;
  reference: string;
}

interface EPinResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    ident: string;
    amount: string;
    description: string;
    Status: string;
    balance_before: string;
    balance_after: string;
    create_date: string;
  };
}

export async function purchaseExamPin(params: EPinPurchaseParams): Promise<EPinResponse> {
  try {
    const { examName, quantity, reference } = params;

    // Validate inputs
    if (!["WAEC", "NECO", "NABTEB"].includes(examName)) {
      return {
        success: false,
        message: "Invalid exam name. Must be WAEC, NECO, or NABTEB.",
      };
    }

    if (quantity < 1 || quantity > 5) {
      return {
        success: false,
        message: "Quantity must be between 1 and 5.",
      };
    }

    const SAIFUL_API_URL = process.env.SAIFUL_API_URL || "https://app.saifulegendconnect.com/api";
    const SAIFUL_API_KEY = process.env.SAIFUL_API_KEY;

    if (!SAIFUL_API_KEY) {
      throw new Error("Saiful API key not configured");
    }

    const requestBody = {
      exam_name: examName,
      quantity: quantity,
    };

    console.log("[SAIFUL EPIN REQUEST]", {
      url: `${SAIFUL_API_URL}/epin/${reference}`,
      body: requestBody,
      timestamp: new Date().toISOString(),
      reference,
    });

    // Append reference to URL for idempotency
    const response = await axios.post(
      `${SAIFUL_API_URL}/epin/${reference}`,
      requestBody,
      {
        headers: {
          "Authorization": `Bearer ${SAIFUL_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    console.log("[SAIFUL EPIN RESPONSE]", {
      status: response.status,
      data: response.data,
      timestamp: new Date().toISOString(),
      reference,
    });

    // Parse response - Saiful returns data nested under 'data' key
    const responseData = response.data?.data || response.data;

    if (responseData && (responseData.Status === "successful" || responseData.status === "successful")) {
      return {
        success: true,
        message: responseData.description || "Exam PIN purchase successful",
        data: responseData,
      };
    } else if (responseData?.Status === "pending" || responseData?.status === "pending") {
      return {
        success: true,
        message: responseData.description || "Exam PIN purchase pending",
        data: responseData,
      };
    } else {
      const errorMsg = responseData?.description || responseData?.message || "Exam PIN purchase failed";
      return {
        success: false,
        message: errorMsg,
      };
    }
  } catch (error: any) {
    console.error("[SAIFUL EPIN ERROR]", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      timestamp: new Date().toISOString(),
    });

    if (error.response) {
      // API returned an error response
      const errorData = error.response.data;
      let errorMessage = "Failed to purchase exam PIN";

      // Handle validation errors
      if (errorData?.errors?.exam_name?.[0]) {
        errorMessage = errorData.errors.exam_name[0];
      } else if (errorData?.errors?.quantity?.[0]) {
        errorMessage = errorData.errors.quantity[0];
      } else if (errorData?.errors?.amount?.[0]) {
        errorMessage = errorData.errors.amount[0];
      } else if (errorData?.errors?.status?.[0]) {
        errorMessage = errorData.errors.status[0];
      } else {
        errorMessage = errorData?.message || `API Error: ${error.response.status}`;
      }

      return {
        success: false,
        message: errorMessage,
      };
    } else if (error.code === "ECONNABORTED") {
      return {
        success: false,
        message: "Request timeout - please try again",
      };
    } else {
      return {
        success: false,
        message: "Network error - please try again",
      };
    }
  }
}

interface MeterValidationParams {
  meterNumber: string;
  discoName: string;
  meterType: "prepaid" | "postpaid";
}

interface MeterValidationResponse {
  success: boolean;
  message: string;
  data?: {
    status: string;
    name: string;
    address: string;
    meter_type: string;
  };
}

export async function validateMeter(params: MeterValidationParams): Promise<MeterValidationResponse> {
  try {
    const { meterNumber, discoName, meterType } = params;

    const SAIFUL_API_URL = process.env.SAIFUL_API_URL || "https://app.saifulegendconnect.com/api";
    const SAIFUL_API_KEY = process.env.SAIFUL_API_KEY;

    if (!SAIFUL_API_KEY) {
      throw new Error("Saiful API key not configured");
    }

    console.log("[SAIFUL METER VALIDATION REQUEST]", {
      url: `${SAIFUL_API_URL}/validate_meter`,
      params: { meterNumber, discoName, meterType },
      timestamp: new Date().toISOString(),
    });

    const response = await axios.get(`${SAIFUL_API_URL}/validate_meter`, {
      params: {
        meter_number: meterNumber,
        disco_name: discoName,
        meter_type: meterType,
      },
      headers: {
        "Authorization": `Bearer ${SAIFUL_API_KEY}`,
        "Accept": "application/json",
      },
      timeout: 30000,
    });

    console.log("[SAIFUL METER VALIDATION RESPONSE]", {
      status: response.status,
      data: response.data,
      timestamp: new Date().toISOString(),
    });

    const responseData = response.data;

    if (responseData && responseData.status === "success") {
      return {
        success: true,
        message: `Meter ${meterNumber} validated successfully`,
        data: responseData,
      };
    } else {
      const errorMsg = responseData?.message || "Meter validation failed";
      return {
        success: false,
        message: errorMsg,
      };
    }
  } catch (error: any) {
    console.error("[SAIFUL METER VALIDATION ERROR]", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      timestamp: new Date().toISOString(),
    });

    if (error.response) {
      const errorData = error.response.data;
      let errorMessage = "Failed to validate meter";

      if (errorData?.errors?.status?.[0]) {
        errorMessage = errorData.errors.status[0];
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }

      return {
        success: false,
        message: errorMessage,
      };
    } else if (error.code === "ECONNABORTED") {
      return {
        success: false,
        message: "Request timeout - please try again",
      };
    } else {
      return {
        success: false,
        message: "Network error - please try again",
      };
    }
  }
}

interface ElectricityBillPaymentParams {
  meterType: "prepaid" | "postpaid";
  phoneNumber: string;
  name: string;
  meterNumber: string;
  discoId: number;
  amount: number;
  reference: string;
}

interface ElectricityBillPaymentResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    user_id: number;
    reference: string;
    amount: string;
    api_response: string;
    description: string;
    status: string;
    token: string;
    balance_before: string;
    balance_after: string;
    date: string;
  };
}

export async function payElectricityBill(
  params: ElectricityBillPaymentParams
): Promise<ElectricityBillPaymentResponse> {
  try {
    const { meterType, phoneNumber, name, meterNumber, discoId, amount, reference } = params;

    // Validate inputs
    if (!["prepaid", "postpaid"].includes(meterType)) {
      return {
        success: false,
        message: "Invalid meter type. Must be prepaid or postpaid.",
      };
    }

    if (amount < 1000) {
      return {
        success: false,
        message: "Minimum payment amount is ₦1,000.",
      };
    }

    const SAIFUL_API_URL = process.env.SAIFUL_API_URL || "https://app.saifulegendconnect.com/api";
    const SAIFUL_API_KEY = process.env.SAIFUL_API_KEY;

    if (!SAIFUL_API_KEY) {
      throw new Error("Saiful API key not configured");
    }

    const requestBody = {
      meter_type: meterType,
      phone_number: phoneNumber,
      name: name,
      meter_number: meterNumber,
      electricity_distributor_id: discoId,
      amount: amount,
    };

    console.log("[SAIFUL ELECTRICITY BILL REQUEST]", {
      url: `${SAIFUL_API_URL}/electricity_bill_payments/${reference}`,
      body: requestBody,
      timestamp: new Date().toISOString(),
      reference,
    });

    // Append reference to URL for idempotency
    const response = await axios.post(
      `${SAIFUL_API_URL}/electricity_bill_payments/${reference}`,
      requestBody,
      {
        headers: {
          "Authorization": `Bearer ${SAIFUL_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    console.log("[SAIFUL ELECTRICITY BILL RESPONSE]", {
      status: response.status,
      data: response.data,
      timestamp: new Date().toISOString(),
      reference,
    });

    // Parse response - Saiful returns data nested under 'data' key
    const responseData = response.data?.data || response.data;

    if (responseData && (responseData.status === "success" || responseData.Status === "successful")) {
      return {
        success: true,
        message: responseData.description || "Electricity bill payment successful",
        data: responseData,
      };
    } else if (responseData?.status === "pending" || responseData?.Status === "pending") {
      return {
        success: true,
        message: responseData.description || "Electricity bill payment pending",
        data: responseData,
      };
    } else {
      const errorMsg = responseData?.description || responseData?.message || "Electricity bill payment failed";
      return {
        success: false,
        message: errorMsg,
      };
    }
  } catch (error: any) {
    console.error("[SAIFUL ELECTRICITY BILL ERROR]", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      timestamp: new Date().toISOString(),
    });

    if (error.response) {
      const errorData = error.response.data;
      let errorMessage = "Failed to process electricity bill payment";

      // Handle validation errors
      if (errorData?.errors?.meter_type?.[0]) {
        errorMessage = errorData.errors.meter_type[0];
      } else if (errorData?.errors?.phone_number?.[0]) {
        errorMessage = errorData.errors.phone_number[0];
      } else if (errorData?.errors?.name?.[0]) {
        errorMessage = errorData.errors.name[0];
      } else if (errorData?.errors?.meter_number?.[0]) {
        errorMessage = errorData.errors.meter_number[0];
      } else if (errorData?.errors?.electricity_distributor_id?.[0]) {
        errorMessage = errorData.errors.electricity_distributor_id[0];
      } else if (errorData?.errors?.amount?.[0]) {
        errorMessage = errorData.errors.amount[0];
      } else if (errorData?.errors?.status?.[0]) {
        errorMessage = errorData.errors.status[0];
      } else {
        errorMessage = errorData?.message || `API Error: ${error.response.status}`;
      }

      return {
        success: false,
        message: errorMessage,
      };
    } else if (error.code === "ECONNABORTED") {
      return {
        success: false,
        message: "Request timeout - please try again",
      };
    } else {
      return {
        success: false,
        message: "Network error - please try again",
      };
    }
  }
}

interface CableSubscriptionParams {
  cableName: "DSTV" | "GOTV" | "STARTIME";
  planId: number;
  smartCardNumber: string;
  reference: string;
}

interface CableSubscriptionResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    ident: string;
    amount: string;
    api_response: string;
    description: string;
    Status: string;
    balance_before: string;
    balance_after: string;
    create_date: string;
  };
}

export async function subscribeToCable(
  params: CableSubscriptionParams
): Promise<CableSubscriptionResponse> {
  try {
    const { cableName, planId, smartCardNumber, reference } = params;

    // Validate inputs
    if (!["DSTV", "GOTV", "STARTIME"].includes(cableName)) {
      return {
        success: false,
        message: "Invalid cable provider. Must be DSTV, GOTV, or STARTIME.",
      };
    }

    if (!planId || planId < 1) {
      return {
        success: false,
        message: "Invalid plan ID.",
      };
    }

    if (!smartCardNumber) {
      return {
        success: false,
        message: "Smart card number is required.",
      };
    }

    const SAIFUL_API_URL = process.env.SAIFUL_API_URL || "https://app.saifulegendconnect.com/api";
    const SAIFUL_API_KEY = process.env.SAIFUL_API_KEY;

    if (!SAIFUL_API_KEY) {
      throw new Error("Saiful API key not configured");
    }

    const requestBody = {
      cable_name: cableName,
      cable_subscription_plan_id: planId,
      smart_card_number: smartCardNumber,
    };

    console.log("[SAIFUL CABLE SUBSCRIPTION REQUEST]", {
      url: `${SAIFUL_API_URL}/cable_subscription/${reference}`,
      body: requestBody,
      timestamp: new Date().toISOString(),
      reference,
    });

    // Append reference to URL for idempotency
    const response = await axios.post(
      `${SAIFUL_API_URL}/cable_subscription/${reference}`,
      requestBody,
      {
        headers: {
          "Authorization": `Bearer ${SAIFUL_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    console.log("[SAIFUL CABLE SUBSCRIPTION RESPONSE]", {
      status: response.status,
      data: response.data,
      timestamp: new Date().toISOString(),
      reference,
    });

    // Parse response - Saiful returns data nested under 'data' key
    const responseData = response.data?.data || response.data;

    if (responseData && (responseData.Status === "successful" || responseData.status === "successful")) {
      return {
        success: true,
        message: responseData.description || "Cable subscription successful",
        data: responseData,
      };
    } else if (responseData?.Status === "pending" || responseData?.status === "pending") {
      return {
        success: true,
        message: responseData.description || "Cable subscription pending",
        data: responseData,
      };
    } else {
      const errorMsg = responseData?.description || responseData?.message || "Cable subscription failed";
      return {
        success: false,
        message: errorMsg,
      };
    }
  } catch (error: any) {
    console.error("[SAIFUL CABLE SUBSCRIPTION ERROR]", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      timestamp: new Date().toISOString(),
    });

    if (error.response) {
      const errorData = error.response.data;
      let errorMessage = "Failed to process cable subscription";

      // Handle validation errors
      if (errorData?.errors?.cable_name?.[0]) {
        errorMessage = errorData.errors.cable_name[0];
      } else if (errorData?.errors?.cable_subscription_plan_id?.[0]) {
        errorMessage = errorData.errors.cable_subscription_plan_id[0];
      } else if (errorData?.errors?.smart_card_number?.[0]) {
        errorMessage = errorData.errors.smart_card_number[0];
      } else if (errorData?.errors?.amount?.[0]) {
        errorMessage = errorData.errors.amount[0];
      } else if (errorData?.errors?.status?.[0]) {
        errorMessage = errorData.errors.status[0];
      } else {
        errorMessage = errorData?.message || `API Error: ${error.response.status}`;
      }

      return {
        success: false,
        message: errorMessage,
      };
    } else if (error.code === "ECONNABORTED") {
      return {
        success: false,
        message: "Request timeout - please try again",
      };
    } else {
      return {
        success: false,
        message: "Network error - please try again",
      };
    }
  }
}
