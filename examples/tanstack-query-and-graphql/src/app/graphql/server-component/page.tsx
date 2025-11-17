import { getQueryClient } from '@/shared/react-query';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getPostsQuery } from '../graphql';
import PostsList from './posts-list';

export default async function GraphQLServerComponentPage() {
  const queryClient = getQueryClient();

  // You can fetch the query directly and access its data or pass it down to other components
  // This is useful if you need to access the data on the server component or the query will only ever have to run once.
  const data = await queryClient.fetchQuery(getPostsQuery());

  // Or prefetch the posts on the server and reuse on the client (recommended)
  // When you call useQuery with the same query key on the client, it will automatically reuse the prefetched data.
  await queryClient.prefetchQuery(getPostsQuery());

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">
        GraphQL Server Component Example
      </h1>
      <p className="mb-4 text-gray-600">
        This demonstrates React Query with GraphQL using server-side prefetching
        via HydrationBoundary.
      </p>
      {/* ! Wrap components that depend on the queries with HydrationBoundary */}
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PostsList />
      </HydrationBoundary>
    </div>
  );
}
