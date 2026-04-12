// Rate limiter for API endpoints
// Tracks requests per IP address with a rolling window

interface RateLimit {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimit>();
const WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS = 30; // 30 requests per minute

export const rateLimiter = {
  /**
   * Check if an IP has exceeded the rate limit
   * @param ip - IP address
   * @returns true if rate limited, false if allowed
   */
  isLimited(ip: string): boolean {
    const now = Date.now();
    const userLimit = rateLimitMap.get(ip);

    if (!userLimit) {
      // First request from this IP
      rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
      return false;
    }

    if (now > userLimit.resetTime) {
      // Window expired, reset counter
      rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
      return false;
    }

    // Within window, check if limit exceeded
    if (userLimit.count >= MAX_REQUESTS) {
      return true; // Rate limited
    }

    // Increment counter
    userLimit.count++;
    return false; // Not rate limited
  },

  /**
   * Reset rate limit for an IP (useful for testing)
   */
  reset(ip: string): void {
    rateLimitMap.delete(ip);
  },

  /**
   * Clear all rate limits (useful for testing)
   */
  clear(): void {
    rateLimitMap.clear();
  },
};
