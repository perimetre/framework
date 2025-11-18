'use client';

import { trpc } from '@/client/lib/trpc';

/**
 * Client component that consumes data prefetched from server
 *
 * This component is hydrated with data from the server,
 * so it doesn't show a loading state on initial render
 */
export function PostsList() {
  // This will use the prefetched data from the server
  const { data: posts } = trpc.posts.getAll.useQuery();

  if (!posts) {
    return <p>No posts found</p>;
  }

  return (
    <div className="space-y-4">
      {posts
        .slice(0, 10)
        .map(
          (post: {
            body: string;
            id: number;
            title: string;
            userId: number;
          }) => (
            <div
              key={post.id}
              className="rounded border bg-white p-4 shadow-sm"
            >
              <h3 className="text-lg font-semibold">{post.title}</h3>
              <p className="mt-2 text-gray-700">{post.body}</p>
              <p className="mt-2 text-sm text-gray-500">
                User ID: {post.userId}
              </p>
            </div>
          )
        )}
      <p className="text-sm text-gray-500">
        Showing 10 of {posts.length} posts
      </p>
    </div>
  );
}
