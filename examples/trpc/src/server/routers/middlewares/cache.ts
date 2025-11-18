import { middleware } from '..';

/**
 * Cache configuration constants
 */
const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
const ONE_HOUR_IN_SECONDS = 60 * 60;
const TWO_MINUTES_IN_SECONDS = 60 * 2;

/**
 * Cache metadata type
 * Attached to context to indicate caching preferences
 */
export type CacheMeta = {
  cache:
    | {
        enabled: false;
      }
    | {
        enabled: true;
        maxAge: number; // s-maxage in seconds (how long edge caches the response)
        staleWhileRevalidate: number; // SWR window in seconds
      };
};

/**
 * Custom Cache Duration Middleware
 *
 * Override the default cache duration for a specific procedure.
 * By default, all queries are cached with s-maxage=1, stale-while-revalidate=120 (2 minutes).
 *
 * Use this middleware when you want different cache settings than the default.
 *
 * This follows the tRPC caching pattern:
 * https://trpc.io/docs/server/caching
 *
 * How it works:
 * 1. All queries are cached by default (opt-in by default)
 * 2. Use this middleware to customize cache duration
 * 3. Use noCacheMiddleware to opt out completely
 *
 * Caching strategy (stale-while-revalidate):
 * - Serves cached content immediately (even if stale)
 * - Revalidates in background after s-maxage expires
 * - Updates cache for next request
 * @param maxAge - Time in seconds edge caches the response
 * @param staleWhileRevalidate - Time in seconds to serve stale content while revalidating
 *
 * Example usage:
 * ```typescript
 * // All queries are cached by default - no middleware needed!
 * procedure.query(async () => { ... })
 *
 * // Custom cache duration for a specific query
 * procedure
 *   .use(cacheMiddleware(60, ONE_HOUR_IN_SECONDS))
 *   .query(async () => { ... })
 * ```
 */
export const cacheMiddleware = (maxAge: number, staleWhileRevalidate: number) =>
  middleware(async ({ next }) => {
    const result = await next({
      ctx: {
        cache: {
          enabled: true as const,
          maxAge,
          staleWhileRevalidate
        }
      }
    });

    return result;
  });

/**
 * No-cache middleware
 * Explicitly opts out of caching for sensitive or real-time data
 *
 * Use this for:
 * - User-specific data
 * - Real-time data
 * - Sensitive information
 * - Data that changes frequently
 *
 * Example usage:
 * ```typescript
 * procedure
 *   .use(noCacheMiddleware)
 *   .query(async () => {
 *     // This data is never cached
 *   })
 * ```
 */
export const noCacheMiddleware = middleware(async ({ next }) => {
  const result = await next({
    ctx: {
      cache: {
        enabled: false as const
      }
    }
  });

  return result;
});

/**
 * Export cache constants for reuse
 */
export { ONE_DAY_IN_SECONDS, ONE_HOUR_IN_SECONDS, TWO_MINUTES_IN_SECONDS };
