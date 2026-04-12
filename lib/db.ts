import { neon } from "@neondatabase/serverless";

// Create Neon connection
const sql = neon(process.env.DATABASE_URL || "");

// Helper function for SELECT queries
export async function query<T = any>(sqlQuery: string, params?: any[]): Promise<T[]> {
  try {
    const result = await sql(sqlQuery, params || []);
    return result as T[];
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

// Helper function for single row queries
export async function queryOne<T = any>(sqlQuery: string, params?: any[]): Promise<T | null> {
  const results = await query<T>(sqlQuery, params);
  return results.length > 0 ? results[0] : null;
}

// Helper function for INSERT/UPDATE/DELETE
export async function execute(sqlQuery: string, params?: any[]): Promise<number> {
  try {
    const result = await sql(sqlQuery, params || []);
    return result.count ?? 0;
  } catch (error) {
    console.error("Database execute error:", error);
    throw error;
  }
}

export { sql };
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
