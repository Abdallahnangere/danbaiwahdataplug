import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });
}

// Lazy load Prisma only on first use to avoid connection during build
let prismaInstance: PrismaClient | null = null;

export const prisma: any = new Proxy({}, {
  get: (target, prop) => {
    if (!prismaInstance) {
      prismaInstance = globalForPrisma.prisma || createPrismaClient();
      if (process.env.NODE_ENV !== "production") {
        globalForPrisma.prisma = prismaInstance;
      }
    }
    return (prismaInstance as any)[prop];
  },
});
