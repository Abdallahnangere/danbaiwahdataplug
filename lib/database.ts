import { Pool, QueryResult } from "pg";

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "",
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Helper to run queries
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  try {
    const result = await pool.query(text, params);
    return result.rows as T[];
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

// Helper for single row queries
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const results = await query<T>(text, params);
  return results.length > 0 ? results[0] : null;
}

// Helper for inserts/updates/deletes that return count
export async function execute(text: string, params?: any[]): Promise<number> {
  try {
    const result = await pool.query(text, params);
    return result.rowCount || 0;
  } catch (error) {
    console.error("Database execute error:", error);
    throw error;
  }
}

// Helper for transactions
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export { pool };
