import { db } from './db';
import { rateLimits } from './db/schema';
import { and, eq, gte, lt } from 'drizzle-orm';

export type RateLimitConfig = {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
};

// Rate limit configurations
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Anonymous users (by IP)
  create_link_anonymous: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
  },
  create_paste_anonymous: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
  },
  // Authenticated users (by user ID)
  create_link_authenticated: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
  },
  create_paste_authenticated: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
  },
  // Link access attempts (for password-protected links)
  access_protected_link: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
};

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
};

/**
 * Check and enforce rate limiting for a given identifier and action
 */
export async function checkRateLimit(
  identifier: string,
  action: string
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[action];
  
  if (!config) {
    throw new Error(`Unknown rate limit action: ${action}`);
  }

  const windowStart = new Date(Date.now() - config.windowMs);

  try {
    // Clean up old records first (optional, for DB hygiene)
    await db
      .delete(rateLimits)
      .where(
        and(
          eq(rateLimits.identifier, identifier),
          eq(rateLimits.action, action),
          lt(rateLimits.windowStart, windowStart)
        )
      );

    // Count requests in current window
    const existing = await db
      .select()
      .from(rateLimits)
      .where(
        and(
          eq(rateLimits.identifier, identifier),
          eq(rateLimits.action, action),
          gte(rateLimits.windowStart, windowStart)
        )
      );

    const currentCount = existing.reduce((sum, record) => sum + record.count, 0);

    if (currentCount >= config.maxRequests) {
      // Rate limit exceeded
      const oldestRecord = existing.sort(
        (a, b) => a.windowStart.getTime() - b.windowStart.getTime()
      )[0];

      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset: new Date(oldestRecord.windowStart.getTime() + config.windowMs),
      };
    }

    // Record this request
    await db.insert(rateLimits).values({
      identifier,
      action,
      count: 1,
      windowStart: new Date(),
    });

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - currentCount - 1,
      reset: new Date(Date.now() + config.windowMs),
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request (fail open)
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: new Date(Date.now() + config.windowMs),
    };
  }
}

/**
 * Get client IP address from request headers
 */
export function getClientIp(request: Request): string {
  // Check various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback (not reliable in production)
  return 'unknown';
}

/**
 * Create rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toISOString(),
  };
}

