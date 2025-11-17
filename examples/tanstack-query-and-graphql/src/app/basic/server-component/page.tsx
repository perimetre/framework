import { getQueryClient } from '@/shared/react-query';
import {
  dehydrate,
  HydrationBoundary,
  queryOptions
} from '@tanstack/react-query';
import PostsList from './posts-list';

type Post = {
  body: string;
  id: number;
  title: string;
  userId: number;
};

async function getPosts() {
  // This could be any API endpoint
  // It can also live on a separate file for organization.
  const response = await fetch('https://jsonplaceholder.typicode.com/posts');
  if (!response.ok) throw new Error('Failed to fetch posts');
  return response.json() as unknown as Post[];
}

const getPostsQueryKey = ['posts'];

// Note how the same query options is used to prefetch the query on the server component
export const getPostsQuery = () =>
  queryOptions({
    queryKey: getPostsQueryKey, // ! IMPORTANT: Add all query variables as keys, so that when they change, the query is refetched
    queryFn: getPosts
  });

export default async function ServerComponentPage() {
  const queryClient = getQueryClient();

  // You can fetch the query directly and access its data or pass it down to other components
  // This is useful if you need to access the data on the server component or the query will only ever have to run once.
  const data = await queryClient.fetchQuery(getPostsQuery());

  // Or prefetch the posts on the server and reuse on the client (recommended)
  // When you call useQuery with the same query key on the client, it will automatically reuse the prefetched data.
  await queryClient.prefetchQuery(getPostsQuery());

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Server Component Example</h1>
      <p className="mb-4 text-gray-600">
        This demonstrates React Query with server-side prefetching using
        HydrationBoundary.
      </p>
      {/* ! Wrap components that depend on the queries with HydrationBoundary */}
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PostsList />
      </HydrationBoundary>
    </div>
  );
}
