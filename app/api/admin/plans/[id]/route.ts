import { NextRequest, NextResponse } from "next/server";
import { withAdminGuard } from "@/lib/adminGuard";
import { prisma } from "@/lib/db";

async function patchHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || (request.nextUrl.pathname.split("/").pop());

    if (!id) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      name,
      networkId,
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

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (networkId !== undefined) updateData.networkId = parseInt(networkId);
    if (sizeLabel !== undefined) updateData.sizeLabel = sizeLabel;
    if (validity !== undefined) updateData.validity = validity;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (userPrice !== undefined)
      updateData.userPrice = userPrice ? parseFloat(userPrice) : null;
    if (agentPrice !== undefined)
      updateData.agentPrice = agentPrice ? parseFloat(agentPrice) : null;
    if (apiAId !== undefined) updateData.apiAId = apiAId ? parseInt(apiAId) : null;
    if (apiBId !== undefined) updateData.apiBId = apiBId ? parseInt(apiBId) : null;
    if (activeApi !== undefined) updateData.activeApi = activeApi;
    if (isActive !== undefined) updateData.isActive = isActive;

    const plan = await prisma.dataPlan.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...plan,
      price: plan.price.toNumber(),
      userPrice: plan.userPrice?.toNumber() || null,
      agentPrice: plan.agentPrice?.toNumber() || null,
    });
  } catch (error) {
    console.error("Plan update error:", error);
    return NextResponse.json(
      { error: "Failed to update plan" },
      { status: 500 }
    );
  }
}

async function deleteHandler(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }

    await prisma.dataPlan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Plan delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete plan" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  return withAdminGuard(request, patchHandler);
}

export async function DELETE(request: NextRequest) {
  return withAdminGuard(request, deleteHandler);
}
