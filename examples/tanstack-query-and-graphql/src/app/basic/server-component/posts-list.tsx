'use client';

import { useQuery } from '@tanstack/react-query';
import { getPostsQuery } from './page';

export default function PostsList() {
  // This will not fetch. Since we prefetched on the server in the parent server component
  const { data, error, isLoading } = useQuery(getPostsQuery());

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold">Posts ({data?.length})</h2>
      <ul className="space-y-4">
        {data?.slice(0, 5).map((post) => (
          <li key={post.id} className="rounded bg-gray-100 p-4">
            <h3 className="font-semibold">{post.title}</h3>
            <p className="mt-1 text-sm text-gray-600">{post.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
