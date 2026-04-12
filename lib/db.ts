import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });
}

// Completely defer Prisma instantiation until first actual use
let prismaInstance: PrismaClient | null = null;
let isInitializing = false;

const getPrismaInstance = (): PrismaClient => {
  // During build, DATABASE_URL might not be available, so we defer
  if (!prismaInstance && !isInitializing) {
    isInitializing = true;
    try {
      prismaInstance = globalForPrisma.prisma || createPrismaClient();
      if (process.env.NODE_ENV !== "production") {
        globalForPrisma.prisma = prismaInstance;
      }
    } catch (error) {
      isInitializing = false;
      throw error;
    }
  }
  return prismaInstance as PrismaClient;
};

// Export a handler that defers Prisma access
export const prisma = new Proxy({}, {
  get: (target, prop: string | symbol) => {
    try {
      const instance = getPrismaInstance();
      return (instance as any)[prop];
    } catch (error) {
      // Return a function that will throw if called
      return () => {
        throw error;
      };
    }
  },
}) as any as PrismaClient;
