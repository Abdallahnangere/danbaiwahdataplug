import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

let prismaInstance: PrismaClient | null = null;

export const prisma = new Proxy(
  {},
  {
    get(target: any, prop: string | symbol) {
      if (!prismaInstance) {
        try {
          const dbUrl = process.env.DATABASE_URL;
          if (!dbUrl) {
            throw new Error("DATABASE_URL environment variable not set");
          }
          
          prismaInstance =
            globalForPrisma.prisma ||
            new PrismaClient({
              datasourceUrl: dbUrl,
              log: process.env.NODE_ENV === "development" ? ["query"] : [],
            });

          if (process.env.NODE_ENV !== "production") {
            globalForPrisma.prisma = prismaInstance;
          }
        } catch (error) {
          console.error("Prisma initialization failed:", error);
          throw error;
        }
      }

      const instance = prismaInstance as any;
      const value = instance[prop];

      // If it's a method, bind it to maintain context
      if (typeof value === "function") {
        return value.bind(instance);
      }
      return value;
    },
  }
) as any;
