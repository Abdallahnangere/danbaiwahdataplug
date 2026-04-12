import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
} as any);

async function main() {
  console.log("🌱 Starting database seed...");

  // Skip if we have existing plans (idempotent)
  const existingPlanCount = await prisma.dataPlan.count();
  if (existingPlanCount > 0) {
    console.log(`⏭️  Database already has ${existingPlanCount} plans. Skipping seed.`);
    return;
  }

  try {
    // MTN Plans
    const mtnPlans = [
      {
        name: "1GB Daily",
        networkId: 1,
        networkName: "MTN",
        sizeLabel: "1GB",
        validity: "24hrs",
        price: 500,
        userPrice: 500,
        agentPrice: 450,
        apiAId: 1,
        activeApi: "A" as const,
        isActive: true,
      },
      {
        name: "2GB Daily",
        networkId: 1,
        networkName: "MTN",
        sizeLabel: "2GB",
        validity: "24hrs",
        price: 900,
        userPrice: 900,
        agentPrice: 800,
        apiAId: 2,
        activeApi: "A" as const,
        isActive: true,
      },
      {
        name: "5GB Weekly",
        networkId: 1,
        networkName: "MTN",
        sizeLabel: "5GB",
        validity: "7 days",
        price: 2000,
        userPrice: 2000,
        agentPrice: 1800,
        apiAId: 3,
        activeApi: "A" as const,
        isActive: true,
      },
      {
        name: "10GB Monthly",
        networkId: 1,
        networkName: "MTN",
        sizeLabel: "10GB",
        validity: "30 days",
        price: 4000,
        userPrice: 4000,
        agentPrice: 3500,
        apiAId: 4,
        activeApi: "A" as const,
        isActive: true,
      },
    ];

    // Glo Plans
    const gloPlan = [
      {
        name: "1GB Daily",
        networkId: 2,
        networkName: "Glo",
        sizeLabel: "1GB",
        validity: "24hrs",
        price: 450,
        userPrice: 450,
        agentPrice: 400,
        apiAId: 5,
        activeApi: "A" as const,
        isActive: true,
      },
      {
        name: "2GB Daily",
        networkId: 2,
        networkName: "Glo",
        sizeLabel: "2GB",
        validity: "24hrs",
        price: 800,
        userPrice: 800,
        agentPrice: 700,
        apiAId: 6,
        activeApi: "A" as const,
        isActive: true,
      },
    ];

    // 9mobile Plans
    const nineMobilePlans = [
      {
        name: "1GB Daily",
        networkId: 3,
        networkName: "9mobile",
        sizeLabel: "1GB",
        validity: "24hrs",
        price: 400,
        userPrice: 400,
        agentPrice: 350,
        apiAId: 7,
        activeApi: "A" as const,
        isActive: true,
      },
    ];

    // Airtel Plans
    const airtelPlans = [
      {
        name: "1GB Daily",
        networkId: 4,
        networkName: "Airtel",
        sizeLabel: "1GB",
        validity: "24hrs",
        price: 420,
        userPrice: 420,
        agentPrice: 370,
        apiAId: 8,
        activeApi: "A" as const,
        isActive: true,
      },
    ];

    const allPlans = [...mtnPlans, ...gloPlan, ...nineMobilePlans, ...airtelPlans];

    for (const plan of allPlans) {
      await prisma.dataPlan.create({ data: plan as any });
    }

    console.log(`✅ Successfully seeded ${allPlans.length} data plans!`);
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("✨ Seeding complete!");
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
