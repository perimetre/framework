'use client';

import { trpc } from '@/client/lib/trpc';
import { useState } from 'react';

/**
 * Client Component example using tRPC
 *
 * Demonstrates:
 * - useQuery hook for fetching data
 * - useMutation hook for creating/updating data
 * - Error handling
 * - Loading states
 * - Optimistic updates
 */
export default function ClientComponentPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  // *************************
  // * Query example
  // *************************
  const { data: posts, error, isLoading } = trpc.posts.getAll.useQuery();

  // *************************
  // * Mutation example with optimistic updates
  // *************************
  const utils = trpc.useUtils();
  const createPost = trpc.posts.create.useMutation({
    // Optimistic update
    onMutate: async (newPost: {
      body: string;
      title: string;
      userId: number;
    }) => {
      await utils.posts.getAll.cancel();
      const previousPosts = utils.posts.getAll.getData();

      utils.posts.getAll.setData(
        undefined,
        (
          old:
            | { body: string; id: number; title: string; userId: number }[]
            | undefined
        ) => [
          ...(old ?? []),
          {
            id: Date.now(), // Temporary ID
            title: newPost.title,
            body: newPost.body,
            userId: newPost.userId
          }
        ]
      );

      return { previousPosts };
    },
    // Revert on error
    onError: (
      err: unknown,
      newPost: { body: string; title: string; userId: number },
      context:
        | {
            previousPosts:
              | { body: string; id: number; title: string; userId: number }[]
              | undefined;
          }
        | undefined
    ) => {
      if (context?.previousPosts) {
        utils.posts.getAll.setData(undefined, context.previousPosts);
      }
      console.error('Failed to create post:', err);
    },
    // Refetch on success
    onSuccess: () => {
      utils.posts.getAll.invalidate();
      setTitle('');
      setBody('');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPost.mutate({
      title,
      body,
      userId: 1 // Hardcoded for demo
    });
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-6 text-3xl font-bold">Client Component Example</h1>

      {/* Create Post Form */}
      <div className="mb-8 rounded-lg bg-gray-50 p-6">
        <h2 className="mb-4 text-xl font-semibold">Create Post</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="title">
              Title
            </label>
            <input
              required
              className="w-full rounded border border-gray-300 p-2"
              id="title"
              placeholder="Enter post title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="body">
              Body
            </label>
            <textarea
              required
              className="w-full rounded border border-gray-300 p-2"
              id="body"
              placeholder="Enter post body"
              rows={4}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
              }}
            />
          </div>
          <button
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
            disabled={createPost.isPending}
            type="submit"
          >
            {createPost.isPending ? 'Creating...' : 'Create Post'}
          </button>
          {createPost.error && (
            <p className="text-sm text-red-600">
              Error: {createPost.error.message}
            </p>
          )}
        </form>
      </div>

      {/* Posts List */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">All Posts</h2>

        {isLoading && <p className="text-gray-600">Loading posts...</p>}

        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-800">Error loading posts</p>
            <p className="text-sm text-red-600">{error.message}</p>
          </div>
        )}

        {posts && (
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
        )}
      </div>
    </div>
  );
}
