import { NextResponse } from "next/server";

export const revalidate = 300;

const isDev = process.env.NODE_ENV !== "production";

// Development-only logging to avoid production CPU/log overhead.
const log = (step: string, data: any) => {
  if (!isDev) return;
  const timestamp = new Date().toISOString();
  const logMessage = `[NETWORKS] ${timestamp} ${step}: ${JSON.stringify(data, null, 2)}`;
  console.log(logMessage);
  console.error(`[NETWORKS_LOG] ${step}`, JSON.stringify(data, null, 2));
};

export async function GET() {
  try {
    log("REQUEST", { timestamp: new Date().toISOString() });

    const networks = [
      { id: 1, name: "MTN", logo: "/networks/mtn.jpeg" },
      { id: 2, name: "Glo", logo: "/networks/glo.jpeg" },
      { id: 3, name: "9mobile", logo: "/networks/9mobile.jpeg" },
      { id: 4, name: "Airtel", logo: "/networks/airtel.jpeg" },
    ];

    log("RESPONSE_200", { count: networks.length, networks });

    return NextResponse.json(networks, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      }
    });
  } catch (error: any) {
    log("ERROR_500", { error: error.message });
    return NextResponse.json(
      { error: "Failed to fetch networks" },
      { 
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      }
    );
  }
}
