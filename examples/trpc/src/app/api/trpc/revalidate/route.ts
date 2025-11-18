/**
 * tRPC Revalidate Endpoint
 *
 * Enables experimental on-demand revalidation for tRPC queries.
 * This endpoint works with Next.js caching to invalidate stale data.
 *
 * Usage from a mutation:
 * ```typescript
 * import { revalidatePath } from 'next/cache';
 *
 * mutation: procedure.mutation(async () => {
 *   // ... perform mutation
 *   revalidatePath('/some-path');
 *   return result;
 * });
 * ```
 *
 * Or trigger via HTTP:
 * ```bash
 * curl -X POST http://localhost:3000/api/trpc/revalidate?path=/some-path
 * ```
 */
export { experimental_revalidateEndpoint as POST } from '@trpc/next/app-dir/server';
