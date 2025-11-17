'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPostMutation, getPostsQuery } from '../graphql';

export default function GraphQLClientComponentPage() {
  // *************************
  // * GraphQL Query example
  // *************************
  const {
    data,
    error: loadingError,
    isLoading,
    isSuccess
  } = useQuery(getPostsQuery());

  // *************************
  // * GraphQL Mutation example
  // *************************
  const queryClient = useQueryClient();

  // Mutation for creating a new post
  const {
    error: saveError,
    isError,
    isPending,
    mutate: addPost
  } = useMutation({
    ...createPostMutation(),
    onSuccess: async () => {
      // Invalidate and refetch the posts query
      await queryClient.invalidateQueries({
        queryKey: getPostsQuery().queryKey
      });
    }
  });

  const handleAddPost = () => {
    addPost({
      input: {
        title: `New Post ${String(Date.now())}`,
        body: 'This is a new post created via GraphQL mutation!'
      }
    });
  };

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">
        GraphQL Client Component Example
      </h1>
      <p className="mb-4 text-gray-600">
        This demonstrates React Query with GraphQL in a client component using
        useQuery and useMutation.
      </p>

      <button
        className="mb-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:bg-gray-400"
        disabled={isPending}
        onClick={handleAddPost}
      >
        {isPending ? 'Adding...' : 'Add Post'}
      </button>

      {isError && (
        <div className="mb-4 rounded bg-red-100 p-2 text-red-700">
          Error: {saveError.message}
        </div>
      )}

      {isLoading && <div>Loading...</div>}
      {loadingError && <div>Error: {loadingError.message}</div>}
      {isSuccess && data.posts?.data && (
        <div>
          <h2 className="mb-2 text-xl font-semibold">
            Posts ({data.posts.data.length})
          </h2>
          <ul className="space-y-4">
            {data.posts.data.slice(0, 10).map((post) => (
              <li key={post?.id} className="rounded bg-gray-100 p-4">
                <h3 className="font-semibold">{post?.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{post?.body}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
