import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Validate admin
    const adminPassword = request.headers.get("x-admin-password");
    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Dynamic import
    const { prisma } = await import("@/lib/db");

    const plans = await prisma.dataPlan.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(plans.map((plan: any) => ({
      ...plan,
      price: typeof plan.price === 'number' ? plan.price : plan.price.toNumber?.() || 0,
      userPrice: typeof plan.userPrice === 'number' ? plan.userPrice : plan.userPrice?.toNumber?.() || null,
      agentPrice: typeof plan.agentPrice === 'number' ? plan.agentPrice : plan.agentPrice?.toNumber?.() || null,
    })));
  } catch (error) {
    console.error("Plans fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}

async function createHandler(request: NextRequest) {
  try {
    // Validate admin
    const adminPassword = request.headers.get("x-admin-password");
    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Dynamic import
    const { prisma } = await import("@/lib/db");

    const body = await request.json();
    const {
      name,
      networkId,
      networkName,
      sizeLabel,
      validity,
      price,
      userPrice,
      agentPrice,
      apiAId,
      apiBId,
      activeApi,
      isActive,
    } = body;

    if (!name || !networkId || !sizeLabel || !validity ||!price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const plan = await prisma.dataPlan.create({
      data: {
        name,
        networkId,
        networkName,
        sizeLabel,
        validity,
        price: parseFloat(price),
        userPrice: userPrice ? parseFloat(userPrice) : null,
        agentPrice: agentPrice ? parseFloat(agentPrice) : null,
        apiAId: apiAId ? parseInt(apiAId) : null,
        apiBId: apiBId ? parseInt(apiBId) : null,
        activeApi: activeApi || "A",
        isActive: isActive !== false,
      } as any,
    });

    return NextResponse.json(
      {
        ...plan,
        price: typeof plan.price === 'number' ? plan.price : plan.price.toNumber?.() || 0,
        userPrice: typeof plan.userPrice === 'number' ? plan.userPrice : plan.userPrice?.toNumber?.() || null,
        agentPrice: typeof plan.agentPrice === 'number' ? plan.agentPrice : plan.agentPrice?.toNumber?.() || null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Plan creation error:", error);
    return NextResponse.json(
      { error: "Failed to create plan" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return createHandler(request);
}
