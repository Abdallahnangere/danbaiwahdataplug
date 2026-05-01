/**
 * Database-backed rate limiter for authentication endpoints.
 */

import { execute, queryOne } from "@/lib/db";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number | null;
}

export interface RateLimitOptions {
  maxAttempts: number;
  windowMs: number;
}

let tableReady = false;
async function ensureRateLimitTable() {
  if (tableReady) return;
  await execute(
    `CREATE TABLE IF NOT EXISTS "AuthRateLimitBucket" (
      key text PRIMARY KEY,
      count integer NOT NULL,
      reset_at timestamptz NOT NULL
    )`
  );
  tableReady = true;
}

export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  options: RateLimitOptions = { maxAttempts: 5, windowMs: 15 * 60 * 1000 }
): Promise<RateLimitResult> {
  await ensureRateLimitTable();
  const key = `${identifier}:${endpoint}`;
  const row = await queryOne<{ count: number; reset_ms: string }>(
    `INSERT INTO "AuthRateLimitBucket" (key, count, reset_at)
     VALUES ($1, 1, NOW() + ($2::text || ' milliseconds')::interval)
     ON CONFLICT (key)
     DO UPDATE SET
       count = CASE
         WHEN "AuthRateLimitBucket".reset_at <= NOW() THEN 1
         ELSE "AuthRateLimitBucket".count + 1
       END,
       reset_at = CASE
         WHEN "AuthRateLimitBucket".reset_at <= NOW() THEN NOW() + ($2::text || ' milliseconds')::interval
         ELSE "AuthRateLimitBucket".reset_at
       END
     RETURNING count, (EXTRACT(EPOCH FROM reset_at) * 1000)::bigint::text AS reset_ms`,
    [key, options.windowMs]
  );

  const count = row ? Number(row.count) : 1;
  const resetTime = row ? Number(row.reset_ms) : null;
  const remaining = Math.max(0, options.maxAttempts - count);

  return {
    allowed: count <= options.maxAttempts,
    remaining,
    resetTime: count > options.maxAttempts ? resetTime : null,
  };
}

export async function resetRateLimit(identifier: string, endpoint: string): Promise<void> {
  await ensureRateLimitTable();
  const key = `${identifier}:${endpoint}`;
  await execute(`DELETE FROM "AuthRateLimitBucket" WHERE key = $1`, [key]);
}
