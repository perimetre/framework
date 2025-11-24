import { type AppRouter } from '@/server/routers/_app';
import { createTRPCReact } from '@trpc/react-query';
import 'client-only';

/**
 * Create the tRPC React client
 * This provides type-safe hooks for client components
 *
 * Usage in Client Components:
 * ```tsx
 * 'use client';
 * import { trpc } from '@/client/lib/trpc';
 *
 * export function MyComponent() {
 *   const { data } = trpc.posts.getAll.useQuery();
 *   const createPost = trpc.posts.create.useMutation();
 *   // ...
 * }
 * ```
 */
export const trpc = createTRPCReact<AppRouter>();
