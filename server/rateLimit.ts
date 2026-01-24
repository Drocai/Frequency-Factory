/**
 * Simple in-memory rate limiter for API endpoints
 *
 * This provides basic protection against abuse. For production,
 * consider using Redis-based rate limiting for distributed systems.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limits
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, entry] of entries) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

export interface RateLimitConfig {
  windowMs: number;    // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// Default rate limit configs for different endpoints
export const RATE_LIMITS = {
  // General API calls - 100 requests per minute
  default: { windowMs: 60000, maxRequests: 100 },

  // Predictions/submissions - 30 per minute (prevent spam)
  create: { windowMs: 60000, maxRequests: 30 },

  // AI chat - 20 per minute (expensive operations)
  aiChat: { windowMs: 60000, maxRequests: 20 },

  // Login/auth - 10 per minute (prevent brute force)
  auth: { windowMs: 60000, maxRequests: 10 },
} as const;

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (usually IP or user ID)
 * @param endpoint - Endpoint name for config lookup
 * @param config - Optional custom config
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  endpoint: keyof typeof RATE_LIMITS = "default",
  config?: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
  const { windowMs, maxRequests } = config || RATE_LIMITS[endpoint];
  const key = `${identifier}:${endpoint}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  // If no entry or expired, create new one
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }

  // Check if limit exceeded
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  // Increment counter
  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  };
}

/**
 * Get rate limit identifier from request
 * Uses user ID if authenticated, otherwise falls back to IP
 */
export function getRateLimitIdentifier(
  userId?: number,
  ip?: string
): string {
  return userId ? `user:${userId}` : `ip:${ip || "unknown"}`;
}
