import { getServerTrpc } from '@/server/lib/trpc';
import { PostsList } from './posts-list';

/**
 * Server Component example using tRPC
 *
 * Demonstrates:
 * - Prefetching data in Server Components
 * - Using HydrateClient to wrap client components
 * - No loading states on initial render (faster perceived performance)
 *
 * This is the recommended pattern for Next.js App Router with tRPC
 */
export default async function ServerComponentPage() {
  // ! Get server-side tRPC utilities
  const { HydrateClient, trpc } = await getServerTrpc();

  // ! Prefetch data on the server
  // When you call useQuery with the same procedure on the client, it will automatically reuse the prefetched data
  await trpc.posts.getAll.prefetch();

  // ! You can also prefetch multiple queries in parallel
  // await Promise.all([
  //   trpc.posts.getAll.prefetch(),
  //   trpc.posts.getById.prefetch({ id: 1 }),
  // ]);

  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-6 text-3xl font-bold">Server Component Example</h1>

      <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-4">
        <p className="text-blue-800">
          <strong>Note:</strong> This data was prefetched on the server, so
          there is no loading state when the page first renders. The{' '}
          <code className="rounded bg-blue-100 px-1">HydrateClient</code>{' '}
          wrapper automatically hydrates the React Query cache in child
          components.
        </p>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">All Posts</h2>
        {/* ! Wrap components that depend on prefetched queries with HydrateClient */}
        <HydrateClient>
          <PostsList />
        </HydrateClient>
      </div>
    </div>
  );
}
