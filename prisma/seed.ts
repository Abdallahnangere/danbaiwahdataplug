import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.dataTransaction.deleteMany();
  await prisma.dataPlan.deleteMany();
  await prisma.user.deleteMany();

  console.log("🌱 Seeding database...");

  // Seed MTN 1GB 500 naira plan
  const mtnPlan = await prisma.dataPlan.create({
    data: {
      name: "1GB Daily",
      networkId: 1,
      networkName: "MTN",
      sizeLabel: "1GB",
      validity: "24hrs",
      price: 500,
      userPrice: 500,
      agentPrice: 450,
      apiAId: 1,
      apiBId: null,
      activeApi: "A",
      isActive: true,
    },
  });

  console.log("✅ Seeded plan:", mtnPlan);

  // Seed additional popular plans
  const additionalPlans = [
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
      apiBId: null,
      activeApi: "A",
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
      apiBId: null,
      activeApi: "A",
      isActive: true,
    },
  ];

  for (const plan of additionalPlans) {
    const created = await prisma.dataPlan.create({ data: plan });
    console.log("✅ Seeded plan:", created.name);
  }

  console.log("✨ Database seeding completed!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
