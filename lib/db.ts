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
    // Neon returns an array; for mutations, we check if we have results
    return Array.isArray(result) ? result.length : 0;
  } catch (error) {
    console.error("Database execute error:", error);
    throw error;
  }
}

export { sql };
