import { PrismaClient } } from '@prisma/client';;

const prisma = new PrismaClient();

async function main() {
  console.log('Database seeding ready - add seeds here');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.();
});
