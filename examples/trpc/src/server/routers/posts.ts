import { ForbiddenError } from '@/shared/exceptions';
import { z } from 'zod';
import { procedure, router } from '.';
import { postsService } from '../services/posts';
import { authedUserProcedure } from './middlewares/auth';
import { cacheMiddleware, noCacheMiddleware } from './middlewares/cache';
import { loggingProcedure } from './middlewares/logging';
import { rateLimitProcedure } from './middlewares/ratelimit';

/**
 * Posts router
 * Demonstrates:
 * - Queries (reading data)
 * - Mutations (creating/updating/deleting data)
 * - Input validation with Zod
 * - Middleware usage (auth, logging, rate limiting, caching)
 * - Error handling
 */

export const postsRouter = async () =>
  router({
    /**
     * Get all posts
     * Public endpoint with default caching
     *
     * Cache: s-maxage=1, stale-while-revalidate=120 (2 minutes) - DEFAULT
     * - All queries are cached by default
     * - No middleware needed for default cache behavior
     * - Edge serves immediately from cache
     * - Revalidates in background after 1 second
     * - Serves stale content for up to 2 minutes during revalidation
     */
    getAll: procedure.use(loggingProcedure).query(async () => {
      const result = await postsService({}).getAll({});
      if (result instanceof Error) throw result;
      return result.posts;
    }),

    /**
     * Get a single post by ID
     * Public endpoint with CUSTOM cache duration
     *
     * Cache: s-maxage=60, stale-while-revalidate=3600 (1 hour) - CUSTOM
     * - Uses cacheMiddleware to override default cache duration
     * - Edge caches for 60 seconds
     * - Serves stale content for up to 1 hour during revalidation
     */
    getById: procedure
      .use(loggingProcedure)
      .use(cacheMiddleware(60, 3600)) // Custom cache duration
      .input(
        z.object({
          id: z.number().int().positive()
        })
      )
      .query(async ({ input }) => {
        const result = await postsService({}).getById({ id: input.id });
        if ('ok' in result) {
          return result.post;
        }

        throw result;
      }),

    /**
     * Get posts by user ID
     * Public endpoint that OPTS OUT of caching (user-specific data)
     *
     * Cache: NONE - uses noCacheMiddleware to opt out
     * - No cache headers are sent
     * - Always fetches fresh data
     * - Use this pattern for:
     *   - User-specific data
     *   - Real-time data
     *   - Sensitive information
     */
    getByUserId: procedure
      .use(loggingProcedure)
      .use(noCacheMiddleware) // Explicitly opt out of caching
      .input(
        z.object({
          userId: z.number().int().positive()
        })
      )
      .query(async ({ input }) => {
        const result = await postsService({}).getByUserId({
          userId: input.userId
        });
        if (result instanceof Error) throw result;
        return result.posts;
      }),

    /**
     * Create a new post
     * Requires authentication and rate limiting
     * Demonstrates input validation and error handling
     */
    create: procedure
      .use(loggingProcedure)
      .use(authedUserProcedure)
      .use(rateLimitProcedure(5, 60000)) // 5 requests per minute
      .input(
        z.object({
          title: z.string().min(1).max(200),
          body: z.string().min(1).max(5000),
          userId: z.number().int().positive()
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify user can only create posts for themselves
        if (input.userId !== parseInt(ctx.user.id)) {
          throw new ForbiddenError('You can only create posts for yourself');
        }

        const result = await postsService({}).create(input);
        if (result instanceof Error) throw result;
        return result.post;
      }),

    /**
     * Update a post
     * Requires authentication
     * Demonstrates partial input validation
     */
    update: procedure
      .use(loggingProcedure)
      .use(authedUserProcedure)
      .input(
        z.object({
          id: z.number().int().positive(),
          title: z.string().min(1).max(200).optional(),
          body: z.string().min(1).max(5000).optional()
        })
      )
      .mutation(async ({ input }) => {
        const result = await postsService({}).update(input);
        if (result instanceof Error) throw result;
        return result.post;
      }),

    /**
     * Delete a post
     * Requires authentication
     */
    delete: procedure
      .use(loggingProcedure)
      .use(authedUserProcedure)
      .input(
        z.object({
          id: z.number().int().positive()
        })
      )
      .mutation(async ({ input }) => {
        const result = await postsService({}).delete({ id: input.id });
        if (result instanceof Error) throw result;
        return { success: true };
      })
  });
