import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server';
import { router } from '.';
import { postsRouter } from './posts';

/**
 * Main application router
 * This is the root router that combines all sub-routers
 *
 * All routers are async to allow for dynamic initialization
 * (e.g., database connections, config loading)
 */
export const appRouter = async () =>
  router({
    posts: await postsRouter()
    // Add more routers here:
    // users: await usersRouter(),
    // comments: await commentsRouter(),
  });

/**
 * Export type definitions for use in client code
 * This is what enables end-to-end type safety
 */
export type AppRouter = Awaited<ReturnType<typeof appRouter>>;

export type RouterInput = inferRouterInputs<AppRouter>;
/**
 * Type helpers for inferring input and output types
 * Usage:
 * ```ts
 * type PostsOutput = RouterOutput['posts']['getAll'];
 * type CreatePostInput = RouterInput['posts']['create'];
 * ```
 */
export type RouterOutput = inferRouterOutputs<AppRouter>;
