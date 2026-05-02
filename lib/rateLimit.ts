import { NextRequest, NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db";

/**
 * Check rate limit for a user/endpoint combination
 * @param key Unique identifier (e.g., "user-123-purchase")
 * @param limit Max requests allowed per window
 * @param windowMs Time window in milliseconds
 * @returns true if limit exceeded, false if allowed
 */
export async function checkRateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = 60000 // 1 minute default
): Promise<boolean> {
  const row = await queryOne<{ count: number }>(
    `INSERT INTO "RateLimitBucket" (key, count, reset_at)
     VALUES ($1, 1, NOW() + ($2::text || ' milliseconds')::interval)
     ON CONFLICT (key)
     DO UPDATE SET
       count = CASE
         WHEN "RateLimitBucket".reset_at <= NOW() THEN 1
         ELSE "RateLimitBucket".count + 1
       END,
       reset_at = CASE
         WHEN "RateLimitBucket".reset_at <= NOW() THEN NOW() + ($2::text || ' milliseconds')::interval
         ELSE "RateLimitBucket".reset_at
       END
     RETURNING count`,
    [key, windowMs]
  );
  return !!row && row.count > limit;
}

/**
 * Middleware-style rate limit checker with response
 */
export async function withRateLimit(
  request: NextRequest,
  userId: string,
  endpoint: string,
  options: { limit?: number; windowMs?: number } = {}
) {
  const limit = options.limit || 5;
  const windowMs = options.windowMs || 60000;
  const key = `${endpoint}:${userId}`;

  if (await checkRateLimit(key, limit, windowMs)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }

  return null; // Not limited, proceed
}
