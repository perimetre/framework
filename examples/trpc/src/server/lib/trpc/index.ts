import { createCallerFactory } from '@/server/routers';
import { type AppRouter, appRouter } from '@/server/routers/_app';
import { createQueryClient } from '@/shared/lib/trpc';
import { createHydrationHelpers } from '@trpc/react-query/rsc';
import { cache } from 'react';
import 'server-only';
import { createContext } from './context';

/**
 * Get a cached query client for the current request
 * Uses React's cache() to ensure one query client per request
 */
export const getQueryClient = cache(createQueryClient);

/**
 * Create a server-side tRPC caller
 * This is used in React Server Components to call procedures
 */
const caller = async () =>
  createCallerFactory(await appRouter())(createContext);

/**
 * Get server-side tRPC utilities for React Server Components
 * Returns both trpc (for prefetching) and HydrateClient (for wrapping client components)
 *
 * Usage in Server Components:
 * ```tsx
 * const { trpc, HydrateClient } = await getServerTrpc();
 *
 * // Prefetch data on server
 * await trpc.posts.getAll.prefetch();
 *
 * // Wrap client components to hydrate with prefetched data
 * return (
 *   <HydrateClient>
 *     <PostList />
 *   </HydrateClient>
 * );
 * ```
 */
export const getServerTrpc = async () =>
  createHydrationHelpers<AppRouter>(await caller(), getQueryClient);
