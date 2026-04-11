import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { validateMeter } from "@/lib/saiful";

// Map DISCO names to consistent format
const DISCO_MAP: Record<string, string> = {
  "ikeja-electric": "ikeja-electric",
  "eko-electric": "eko-electric",
  "ikeja": "ikeja-electric",
  "eko": "eko-electric",
  "abuja": "abuja-electric",
  "kano": "kano-electric",
  "enugu": "enugu-electric",
  "portharcourt": "portharcourt-electric",
  "ibadan": "ibadan-electric",
  "kaduna": "kaduna-electric",
  "jos": "jos-electric",
  "benin": "benin-electric",
  "yola": "yola-electric",
};

export async function POST(req: NextRequest) {
  try {
    const user = await auth();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { meterNumber, disco, meterType } = body;

    // Validate inputs
    if (!meterNumber || !disco || !meterType) {
      return NextResponse.json(
        { error: "Missing required fields: meterNumber, disco, meterType" },
        { status: 400 }
      );
    }

    if (!["prepaid", "postpaid"].includes(meterType)) {
      return NextResponse.json(
        { error: "Invalid meter type. Must be prepaid or postpaid" },
        { status: 400 }
      );
    }

    // Map disco name to consistent format
    const discoName = DISCO_MAP[disco.toLowerCase()] || disco.toLowerCase();

    console.log(`[ELECTRICITY VALIDATE] User ${user.id} validating meter ${meterNumber} for ${disco}`);

    // Call Saiful API to validate meter
    const validationResult = await validateMeter({
      meterNumber,
      discoName,
      meterType: meterType as "prepaid" | "postpaid",
    });

    if (!validationResult.success) {
      console.error(`[ELECTRICITY VALIDATE FAILED] ${validationResult.message}`);
      return NextResponse.json(
        { error: validationResult.message },
        { status: 400 }
      );
    }

    console.log(`[ELECTRICITY VALIDATE SUCCESS] Meter ${meterNumber} validated for ${validationResult.data?.name}`);

    return NextResponse.json(
      {
        success: true,
        message: "Meter validated successfully",
        data: {
          customerName: validationResult.data?.name,
          address: validationResult.data?.address,
          meterType: validationResult.data?.meter_type,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[ELECTRICITY VALIDATE API ERROR]", {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        error: "An error occurred while validating the meter",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
