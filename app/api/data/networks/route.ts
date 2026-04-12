import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const networks = [
    { id: 1, name: "MTN", logo: "/networks/mtn.png" },
    { id: 2, name: "Glo", logo: "/networks/glo.png" },
    { id: 3, name: "9mobile", logo: "/networks/9mobile.png" },
    { id: 4, name: "Airtel", logo: "/networks/airtel.png" },
  ];

  return NextResponse.json(networks);
}
