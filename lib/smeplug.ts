import axios from "axios";

interface SmeplugPurchaseParams {
  externalNetworkId: number;
  externalPlanId: number;
  phone: string;
  reference: string;
}

interface SmeplugResponse {
  success: boolean;
  message: string;
  externalReference?: string;
}

export async function purchaseData(params: SmeplugPurchaseParams): Promise<SmeplugResponse> {
  const startTime = Date.now();
  try {
    const { externalNetworkId, externalPlanId, phone, reference } = params;

    console.log(`\n🔄 [SMEPLUG SERVICE] purchaseData() called`);
    console.log(`   • externalNetworkId: ${externalNetworkId}`);
    console.log(`   • externalPlanId: ${externalPlanId}`);
    console.log(`   • phone: ${phone}`);
    console.log(`   • reference: ${reference}`);

    // SMEPlug API endpoint and authentication
    const SMEPLUG_API_URL = process.env.SMEPLUG_API_URL || "https://smeplug.ng/api/v1";
    const SMEPLUG_API_KEY = process.env.SMEPLUG_API_KEY;

    if (!SMEPLUG_API_KEY) {
      console.error(`❌ [SMEPLUG] API key not configured in environment`);
      throw new Error("SMEPlug API key not configured");
    }

    console.log(`✅ [SMEPLUG] API key loaded`);

    // Phone format: Keep as 09xxxxxxx (Nigerian local format)
    // Smeplug expects local format, not international
    let formattedPhone = phone;
    if (phone.startsWith("234")) {
      // Convert 234xxxxxxxxx to 09xxxxxxxxx
      formattedPhone = "0" + phone.substring(3);
      console.log(`🔄 [SMEPLUG] Phone conversion: ${phone} → ${formattedPhone}`);
    } else if (!phone.startsWith("0")) {
      // If starts with digit but not 0, prepend 0
      formattedPhone = "0" + phone;
      console.log(`🔄 [SMEPLUG] Phone format: ${phone} → ${formattedPhone}`);
    } else {
      console.log(`✅ [SMEPLUG] Phone format already correct: ${formattedPhone}`);
    }

    const requestBody = {
      network_id: externalNetworkId,
      plan_id: externalPlanId,
      phone: formattedPhone,
    };

    const requestUrl = `${SMEPLUG_API_URL}/data/purchase`;
    
    console.log(`\n📤 [SMEPLUG API] Sending POST request:`);
    console.log(`   URL: ${requestUrl}`);
    console.log(`   Headers: Authorization: Bearer [REDACTED], Content-Type: application/json`);
    console.log(`   Body:`, JSON.stringify(requestBody, null, 2));
    console.log(`   Reference: ${reference}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    const response = await axios.post(
      requestUrl,
      requestBody,
      {
        headers: {
          "Authorization": `Bearer ${SMEPLUG_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const duration = Date.now() - startTime;
    console.log(`\n📥 [SMEPLUG API] Response received (${duration}ms):`);
    console.log(`   HTTP Status: ${response.status}`);
    console.log(`   Response Data:`, JSON.stringify(response.data, null, 2));

    // SMEPlug returns status as boolean (true/false)
    if (response.data && response.data.status === true && response.data.data) {
      const returnData = {
        success: true,
        message: response.data.data.msg || "Data purchase successful",
        externalReference: response.data.data.reference,
      };
      console.log(`✅ [SMEPLUG SUCCESS] Purchase confirmed:`);
      console.log(`   Message: ${returnData.message}`);
      console.log(`   External Reference: ${returnData.externalReference}`);
      return returnData;
    } else {
      const errorMsg = response.data?.data?.msg || response.data?.msg || response.data?.message || "Data purchase failed";
      console.log(`❌ [SMEPLUG FAILED] Purchase unsuccessful:`);
      console.log(`   Message: ${errorMsg}`);
      console.log(`   Full Response:`, response.data);
      return {
        success: false,
        message: errorMsg,
      };
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    console.error(`\n❌ [SMEPLUG ERROR] Exception caught (${duration}ms)`);
    console.error(`   Error Type: ${error.name}`);
    console.error(`   Error Message: ${error.message}`);

    if (error.response) {
      // API returned an error response
      console.error(`   HTTP Status: ${error.response.status}`);
      console.error(`   Response Headers:`, error.response.headers);
      console.error(`   Response Body:`, JSON.stringify(error.response.data, null, 2));
      
      const errorMessage = error.response.data?.msg || error.response.data?.message || `API Error: ${error.response.status}`;
      console.error(`❌ [SMEPLUG] API Error Details: ${errorMessage}`);
      
      return {
        success: false,
        message: errorMessage,
      };
    } else if (error.code === "ECONNABORTED") {
      // Timeout
      console.error(`   Type: Request Timeout (30s)`);
      console.error(`   Code: ECONNABORTED`);
      return {
        success: false,
        message: "Request timeout - please try again",
      };
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      // Network error
      console.error(`   Type: Network Error`);
      console.error(`   Code: ${error.code}`);
      return {
        success: false,
        message: "Network error - please try again",
      };
    } else {
      // Other error
      console.error(`   Type: Other Error`);
      console.error(`   Code: ${error.code}`);
      console.error(`   Full Error:`, error);
      return {
        success: false,
        message: "Network error - please try again",
      };
    }
  }
}
