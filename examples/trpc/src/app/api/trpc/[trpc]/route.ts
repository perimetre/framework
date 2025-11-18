import { createContext } from '@/server/lib/trpc/context';
import { appRouter } from '@/server/routers/_app';
import type { CacheMeta } from '@/server/routers/middlewares/cache';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

/**
 * tRPC API handler for Next.js App Router
 * Handles all tRPC requests at /api/trpc/*
 *
 * This adapter:
 * - Creates a new context for each request
 * - Handles both GET and POST requests (queries use GET, mutations use POST)
 * - Supports request batching
 * - Converts tRPC responses to HTTP responses
 * - Adds cache-control headers based on middleware metadata
 */
const handler = async (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: await appRouter(),
    createContext,
    /**
     * responseMeta - Set HTTP headers based on procedure metadata
     *
     * This function runs after procedures execute and allows setting
     * response headers conditionally based on:
     * - Request type (query vs mutation)
     * - Cache metadata from middleware
     * - Error status
     *
     * Following the tRPC caching pattern:
     * https://trpc.io/docs/server/caching
     */
    responseMeta(opts) {
      const { ctx, errors, type } = opts;

      // Don't cache if there are errors
      if (errors.length > 0) {
        return {};
      }

      // Only cache queries (GET requests), not mutations (POST requests)
      if (type !== 'query') {
        return {};
      }

      // Check if procedure explicitly opted OUT of caching via middleware
      const cacheMeta = (ctx as CacheMeta & typeof ctx).cache;

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (cacheMeta && !cacheMeta.enabled) {
        // Procedure explicitly opted out - no caching
        return {};
      }

      // Default caching for all queries (opt-in by default)
      // Use custom cache settings if provided, otherwise use defaults
      const maxAge =
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        cacheMeta?.enabled ? cacheMeta.maxAge : 1;
      const staleWhileRevalidate =
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        cacheMeta?.enabled ? cacheMeta.staleWhileRevalidate : 60 * 2; // 2 minutes

      // Build cache-control header with stale-while-revalidate
      const cacheControl = `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`;

      /**
       * ⚠️ IMPORTANT: Platform-Specific Cache Headers
       *
       * Uncomment the appropriate option based on where your app is hosted:
       * - OPTION 1: Standard (default) - works everywhere
       * - OPTION 2: Vercel - uncomment if deploying to Vercel
       * - OPTION 3: Cloudflare - uncomment if using Cloudflare
       *
       * Different hosting platforms support different cache headers for granular control.
       */

      // OPTION 1: Standard Cache-Control (works everywhere) - CURRENTLY ACTIVE
      // This affects both browser and CDN caches
      return {
        headers: {
          'cache-control': cacheControl
        }
      };

      // OPTION 2: Vercel-specific headers (uncomment if deploying to Vercel)
      // Vercel supports granular control with platform-specific headers:
      // https://vercel.com/docs/edge-cache
      /*
      return {
        headers: {
          // Standard header: affects browser and downstream CDNs
          'cache-control': cacheControl,

          // Vercel-specific: controls ONLY Vercel's edge cache
          // Use this to have different TTLs for Vercel vs browser/other CDNs
          'vercel-cdn-cache-control': cacheControl,

          // Alternative: CDN-Cache-Control affects all CDNs (including Vercel)
          // but not browser cache
          // 'cdn-cache-control': cacheControl,
        }
      };
      */

      // OPTION 3: Cloudflare-specific headers (uncomment if using Cloudflare)
      // Cloudflare respects standard cache-control but also supports:
      // https://developers.cloudflare.com/cache/concepts/cache-control/
      /*
      return {
        headers: {
          // Standard header: works with Cloudflare's edge cache
          'cache-control': cacheControl,

          // Cloudflare-specific: controls ONLY Cloudflare's cache
          // When set, only s-maxage, must-revalidate, and public are allowed
          // Any other directive will result in BYPASS
          // 'cloudflare-cdn-cache-control': `public, s-maxage=${cacheMeta.maxAge}`,
        }
      };
      */
    }
  });

// Export for both GET and POST methods
export { handler as GET, handler as POST };
