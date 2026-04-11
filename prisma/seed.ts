import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Delete existing data plans to avoid duplicates
  const deletedPlans = await prisma.plan.deleteMany({
    where: {
      name: {
        contains: "MB",
      },
    },
  });
  console.log(`Deleted ${deletedPlans.count} existing data plans`);

  // Seed MTN data plans
  const mtnPlans = await prisma.plan.createMany({
    data: [
      {
        name: "500MB Weekly",
        network: "MTN",
        sizeLabel: "500MB",
        validity: "Weekly",
        price: 300,
        agentPrice: 280,
        apiSource: "API_A",
        externalPlanId: 423,
        externalNetworkId: 1,
        isActive: true,
      },
      {
        name: "1GB Weekly",
        network: "MTN",
        sizeLabel: "1GB",
        validity: "Weekly",
        price: 450,
        agentPrice: 420,
        apiSource: "API_A",
        externalPlanId: 424,
        externalNetworkId: 1,
        isActive: true,
      },
      {
        name: "2GB Weekly",
        network: "MTN",
        sizeLabel: "2GB",
        validity: "Weekly",
        price: 900,
        agentPrice: 840,
        apiSource: "API_A",
        externalPlanId: 425,
        externalNetworkId: 1,
        isActive: true,
      },
      {
        name: "3GB Weekly",
        network: "MTN",
        sizeLabel: "3GB",
        validity: "Weekly",
        price: 1200,
        agentPrice: 1100,
        apiSource: "API_A",
        externalPlanId: 426,
        externalNetworkId: 1,
        isActive: true,
      },
      {
        name: "5GB Monthly",
        network: "MTN",
        sizeLabel: "5GB",
        validity: "Monthly",
        price: 1500,
        agentPrice: 1400,
        apiSource: "API_A",
        externalPlanId: 176,
        externalNetworkId: 1,
        isActive: true,
      },
      {
        name: "1GB Daily",
        network: "MTN",
        sizeLabel: "1GB",
        validity: "Daily",
        price: 220,
        agentPrice: 200,
        apiSource: "API_A",
        externalPlanId: 498,
        externalNetworkId: 1,
        isActive: true,
      },
      {
        name: "2.5GB Daily",
        network: "MTN",
        sizeLabel: "2.5GB",
        validity: "Daily",
        price: 550,
        agentPrice: 500,
        apiSource: "API_A",
        externalPlanId: 453,
        externalNetworkId: 1,
        isActive: true,
      },
      {
        name: "7GB Monthly",
        network: "MTN",
        sizeLabel: "7GB",
        validity: "Monthly",
        price: 3500,
        agentPrice: 3200,
        apiSource: "API_A",
        externalPlanId: 21,
        externalNetworkId: 1,
        isActive: true,
      },
      {
        name: "10GB Monthly",
        network: "MTN",
        sizeLabel: "10GB",
        validity: "Monthly",
        price: 4500,
        agentPrice: 4100,
        apiSource: "API_A",
        externalPlanId: 22,
        externalNetworkId: 1,
        isActive: true,
      },
      {
        name: "20GB Monthly",
        network: "MTN",
        sizeLabel: "20GB",
        validity: "Monthly",
        price: 7500,
        agentPrice: 6800,
        apiSource: "API_A",
        externalPlanId: 25,
        externalNetworkId: 1,
        isActive: true,
      },
      {
        name: "25GB Monthly",
        network: "MTN",
        sizeLabel: "25GB",
        validity: "Monthly",
        price: 9000,
        agentPrice: 8200,
        apiSource: "API_A",
        externalPlanId: 26,
        externalNetworkId: 1,
        isActive: true,
      },
      {
        name: "36GB Monthly",
        network: "MTN",
        sizeLabel: "36GB",
        validity: "Monthly",
        price: 11000,
        agentPrice: 10000,
        apiSource: "API_A",
        externalPlanId: 27,
        externalNetworkId: 1,
        isActive: true,
      },
      {
        name: "75GB Monthly",
        network: "MTN",
        sizeLabel: "75GB",
        validity: "Monthly",
        price: 18000,
        agentPrice: 16500,
        apiSource: "API_A",
        externalPlanId: 28,
        externalNetworkId: 1,
        isActive: true,
      },
      {
        name: "5GB (14-30 Days)",
        network: "MTN",
        sizeLabel: "5GB",
        validity: "14-30 Days",
        price: 1500,
        agentPrice: 1400,
        apiSource: "API_B",
        externalPlanId: 85,
        externalNetworkId: 1,
        isActive: true,
      },
      {
        name: "5GB Plus (21-30 Days)",
        network: "MTN",
        sizeLabel: "5GB",
        validity: "21-30 Days",
        price: 1600,
        agentPrice: 1500,
        apiSource: "API_B",
        externalPlanId: 86,
        externalNetworkId: 1,
        isActive: true,
      },
    ],
  });

  console.log(`✅ Seeded ${mtnPlans.count} MTN data plans`);

  // Verify seeding
  const totalPlans = await prisma.plan.count();
  console.log(`📊 Total plans in database: ${totalPlans}`);

  console.log("✨ Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("❌ Seeding error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
