'use client';

import { trpc } from '@/client/lib/trpc';
import { useState } from 'react';

/**
 * Error Handling example
 *
 * Demonstrates:
 * - Handling validation errors
 * - Handling not found errors
 * - Handling authentication errors
 * - Error boundaries
 * - User-friendly error messages
 */
export default function ErrorHandlingPage() {
  const [postId, setPostId] = useState('');
  const [attemptedAuth, setAttemptedAuth] = useState(false);

  // Query with potential errors
  const {
    data: post,
    error: fetchError,
    isLoading,
    refetch
  } = trpc.posts.getById.useQuery(
    { id: parseInt(postId) || 0 },
    {
      enabled: !!postId && !isNaN(parseInt(postId)),
      retry: false // Don't retry on error for this demo
    }
  );

  // Mutation that requires authentication (will fail)
  const createPost = trpc.posts.create.useMutation({
    onError: (error: unknown) => {
      console.error('Create post error:', error);
    }
  });

  const handleFetchPost = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  const handleCreateWithAuth = () => {
    setAttemptedAuth(true);
    createPost.mutate({
      title: 'Test Post',
      body: 'This will fail because authentication is required',
      userId: 1
    });
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-6 text-3xl font-bold">Error Handling Examples</h1>

      {/* Validation Error Example */}
      <div className="mb-8 rounded-lg bg-gray-50 p-6">
        <h2 className="mb-4 text-xl font-semibold">1. Validation Errors</h2>
        <p className="mb-4 text-gray-700">
          Try fetching a post with an invalid ID (e.g., -1, 0, or a very large
          number like 99999)
        </p>
        <form className="space-y-4" onSubmit={handleFetchPost}>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="postId">
              Post ID
            </label>
            <input
              className="w-full rounded border border-gray-300 p-2"
              id="postId"
              placeholder="Enter post ID (1-100)"
              type="number"
              value={postId}
              onChange={(e) => {
                setPostId(e.target.value);
              }}
            />
          </div>
          <button
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
            disabled={isLoading || !postId}
            type="submit"
          >
            {isLoading ? 'Loading...' : 'Fetch Post'}
          </button>
        </form>

        {/* Display result or error */}
        {fetchError && (
          <div className="mt-4 rounded border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-800">Error</p>
            <p className="text-sm text-red-600">{fetchError.message}</p>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-red-700">
                Technical details
              </summary>
              <pre className="mt-2 overflow-auto text-xs text-red-600">
                {JSON.stringify(fetchError.data, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {post && (
          <div className="mt-4 rounded border border-green-200 bg-green-50 p-4">
            <p className="font-semibold text-green-800">Success!</p>
            <div className="mt-2">
              <h3 className="font-semibold">{post.title}</h3>
              <p className="mt-1 text-gray-700">{post.body}</p>
            </div>
          </div>
        )}
      </div>

      {/* Authentication Error Example */}
      <div className="mb-8 rounded-lg bg-gray-50 p-6">
        <h2 className="mb-4 text-xl font-semibold">2. Authentication Errors</h2>
        <p className="mb-4 text-gray-700">
          This mutation requires authentication, which will fail in this demo
        </p>
        <button
          className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:bg-gray-400"
          disabled={createPost.isPending}
          onClick={handleCreateWithAuth}
        >
          {createPost.isPending
            ? 'Creating...'
            : 'Try Creating Post (Will Fail)'}
        </button>

        {attemptedAuth && createPost.error && (
          <div className="mt-4 rounded border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-800">
              Authentication Required
            </p>
            <p className="text-sm text-red-600">{createPost.error.message}</p>
            <p className="mt-2 text-sm text-gray-600">
              In a real app, this would redirect to the login page.
            </p>
          </div>
        )}
      </div>

      {/* Error Handling Best Practices */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h2 className="mb-4 text-xl font-semibold">
          Error Handling Best Practices
        </h2>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>
              Use custom error classes with HTTP status codes (see{' '}
              <code className="rounded bg-blue-100 px-1">
                src/shared/exceptions.ts
              </code>
              )
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>
              Return errors as values in service layer (following error handling
              guide)
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>
              Handle auth errors globally in TRPCReactProvider (automatic
              redirects)
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Show user-friendly error messages in the UI</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Log technical details for debugging</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
