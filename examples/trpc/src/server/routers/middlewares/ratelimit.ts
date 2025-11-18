import { ForbiddenError } from '@/shared/exceptions';
import { middleware } from '..';

/**
 * Rate limiting middleware example
 * In a real app, you'd use a library like Unkey or Redis for distributed rate limiting
 *
 * This is a simplified example for demonstration purposes
 */

// Simple in-memory rate limit store (don't use in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limit middleware
 * Limits requests to a certain number per time window
 * @param maxRequests - Maximum number of requests allowed in the time window
 * @param windowMs - Time window in milliseconds
 */
export const rateLimitProcedure = (
  maxRequests = 10,
  windowMs = 60000 // 1 minute
) =>
  middleware(async ({ ctx, next }) => {
    // In a real app, you'd use the user ID or IP address
    const identifier = ctx.user?.id ?? 'anonymous';
    const now = Date.now();

    const current = rateLimitStore.get(identifier);

    // Reset if window has passed
    if (!current || now > current.resetAt) {
      rateLimitStore.set(identifier, {
        count: 1,
        resetAt: now + windowMs
      });
      return next();
    }

    // Increment count
    if (current.count >= maxRequests) {
      throw new ForbiddenError(
        `Rate limit exceeded. Try again in ${Math.ceil((current.resetAt - now) / 1000)} seconds.`
      );
    }

    current.count++;
    return next();
  });
