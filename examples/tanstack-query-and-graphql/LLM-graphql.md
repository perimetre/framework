# GraphQL + TanStack Query Usage Guide

## Query/Mutation Definition

Define GraphQL operations in a dedicated file (e.g., `graphql.ts`):

```typescript
import { graphql } from '@/server/graphql/__generated__';
import type { GetPostQueryVariables } from '@/server/graphql/__generated__/graphql';
import {
  graphqlMutationOptions,
  graphqlOptions
} from '@/shared/react-query/graphql';

// Query without variables
export const GetPostsDocument = graphql(/* GraphQL */ `
  query GetPosts {
    posts {
      data {
        id
        title
        body
      }
    }
  }
`);

export const getPostsQuery = () => graphqlOptions(GetPostsDocument);

// Query with variables
export const GetPostDocument = graphql(/* GraphQL */ `
  query GetPost($id: ID!) {
    post(id: $id) {
      id
      title
      body
      user {
        id
        name
        email
      }
    }
  }
`);

export const getPostQuery = (variables: GetPostQueryVariables) =>
  graphqlOptions(GetPostDocument, variables);

// Mutation
export const CreatePostDocument = graphql(/* GraphQL */ `
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      title
      body
    }
  }
`);

export const createPostMutation = () =>
  graphqlMutationOptions(CreatePostDocument);
```

**CRITICAL**: After defining queries/mutations, run `pnpm codegen` to generate types. The types (e.g., `GetPostQueryVariables`, `CreatePostInput`) won't exist until codegen runs.

## Client Component - Query

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { getPostsQuery } from './graphql';

export default function PostsPage() {
  const { data, error, isLoading } = useQuery(getPostsQuery());

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data.posts?.data?.map((post) => (
        <li key={post?.id}>
          <h3>{post?.title}</h3>
          <p>{post?.body}</p>
        </li>
      ))}
    </ul>
  );
}
```

## Client Component - Query with Variables

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { getPostQuery } from './graphql';

export default function PostDetailPage({ postId }: { postId: string }) {
  const { data, error, isLoading } = useQuery(getPostQuery({ id: postId }));

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <article>
      <h1>{data.post?.title}</h1>
      <p>{data.post?.body}</p>
      <div>By: {data.post?.user?.name}</div>
    </article>
  );
}
```

## Client Component - Mutation

```typescript
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPostMutation, getPostsQuery } from './graphql';

export default function CreatePostForm() {
  const queryClient = useQueryClient();

  const { mutate, isPending, isError, error } = useMutation({
    ...createPostMutation(),
    onSuccess: async () => {
      // Invalidate posts query to refetch after successful mutation
      await queryClient.invalidateQueries({
        queryKey: getPostsQuery().queryKey
      });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    mutate({
      input: {
        title: formData.get('title') as string,
        body: formData.get('body') as string
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" placeholder="Title" required />
      <textarea name="body" placeholder="Body" required />
      <button disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Post'}
      </button>
      {isError && <div>Error: {error.message}</div>}
    </form>
  );
}
```

## Server Component - Prefetching

Prefetch GraphQL data on the server for instant client-side rendering:

```typescript
import { getQueryClient } from '@/shared/react-query';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getPostsQuery } from './graphql';
import PostsList from './posts-list';

export default async function PostsPage() {
  const queryClient = getQueryClient();

  // Option 1: Fetch directly if you need the data in this server component
  const data = await queryClient.fetchQuery(getPostsQuery());

  // Option 2: Prefetch for client components (recommended)
  await queryClient.prefetchQuery(getPostsQuery());

  return (
    <div>
      <h1>Posts</h1>
      {/* Wrap client components with HydrationBoundary */}
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PostsList />
      </HydrationBoundary>
    </div>
  );
}
```

Client component using prefetched data:

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { getPostsQuery } from './graphql';

export default function PostsList() {
  // No network request - reuses server-prefetched data
  const { data, error, isLoading } = useQuery(getPostsQuery());

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.posts?.data?.map((post) => (
        <li key={post?.id}>{post?.title}</li>
      ))}
    </ul>
  );
}
```

## Server Component - Direct Data Access

Access GraphQL data directly in server components without client-side hydration:

```typescript
import { getQueryClient } from '@/shared/react-query';
import { getPostsQuery } from './graphql';

export default async function PostsPage() {
  const queryClient = getQueryClient();
  const data = await queryClient.fetchQuery(getPostsQuery());

  return (
    <div>
      <h1>Posts ({data.posts?.data?.length ?? 0})</h1>
      <ul>
        {data.posts?.data?.map((post) => (
          <li key={post?.id}>
            <h3>{post?.title}</h3>
            <p>{post?.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Advanced Patterns

### Optimistic Updates

Update UI immediately before server confirms, with automatic rollback on error:

```typescript
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePostMutation, getPostsQuery } from './graphql';
import type { Post } from '@/server/graphql/__generated__/graphql';

export default function TogglePostButton({ post }: { post: Post }) {
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    ...updatePostMutation(),
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: getPostsQuery().queryKey });

      // Snapshot previous value
      const previousPosts = queryClient.getQueryData(getPostsQuery().queryKey);

      // Optimistically update
      queryClient.setQueryData(getPostsQuery().queryKey, (old: any) => ({
        ...old,
        posts: {
          ...old.posts,
          data: old.posts.data.map((p: Post) =>
            p.id === variables.id ? { ...p, title: variables.input.title } : p
          )
        }
      }));

      return { previousPosts };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      queryClient.setQueryData(getPostsQuery().queryKey, context?.previousPosts);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: getPostsQuery().queryKey });
    }
  });

  return (
    <button onClick={() => mutate({ id: post.id, input: { title: 'Updated!' } })}>
      Update Post
    </button>
  );
}
```

### Dependent Queries

Query that depends on data from another GraphQL query:

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { getPostQuery, getPostCommentsQuery } from './graphql';

export default function PostWithComments({ postId }: { postId: string }) {
  const { data: post } = useQuery(getPostQuery({ id: postId }));

  // This query won't run until post.id exists
  const { data: comments, isLoading } = useQuery({
    ...getPostCommentsQuery({ postId: post?.post?.id }),
    enabled: !!post?.post?.id // Only run when post.id is available
  });

  if (!post) return <div>Loading post...</div>;
  if (isLoading) return <div>Loading comments...</div>;

  return (
    <article>
      <h1>{post.post?.title}</h1>
      <p>{post.post?.body}</p>
      <h2>Comments</h2>
      <ul>
        {comments?.comments?.data?.map((comment) => (
          <li key={comment?.id}>{comment?.body}</li>
        ))}
      </ul>
    </article>
  );
}
```

### Error Handling with Retry

Configure retry logic for failed GraphQL queries:

```typescript
import { graphqlOptions } from '@/shared/react-query/graphql';
import { GetPostsDocument } from './graphql';

export const getPostsQuery = () =>
  queryOptions({
    ...graphqlOptions(GetPostsDocument),
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    staleTime: 5000 // Consider data fresh for 5 seconds
  });
```

### Server Component with Dynamic Parameters

Handle dynamic route parameters in server components:

```typescript
import { getQueryClient } from '@/shared/react-query';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getPostQuery } from './graphql';
import PostDetail from './post-detail';

export default async function PostPage({
  params
}: {
  params: { id: string };
}) {
  const queryClient = getQueryClient();

  // Prefetch with dynamic parameter
  await queryClient.prefetchQuery(getPostQuery({ id: params.id }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostDetail postId={params.id} />
    </HydrationBoundary>
  );
}
```

Client component consuming prefetched data with params:

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { getPostQuery } from './graphql';

export default function PostDetail({ postId }: { postId: string }) {
  // Reuses server-prefetched data
  const { data, error, isLoading } = useQuery(getPostQuery({ id: postId }));

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <article>
      <h1>{data.post?.title}</h1>
      <p>{data.post?.body}</p>
    </article>
  );
}
```

### Multiple Sequential Mutations

Execute GraphQL mutations in sequence, passing data between them:

```typescript
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createUserMutation, createPostMutation } from './graphql';
import { graphqlClient } from '@/server/graphql';

export default function CreateUserWithPostForm() {
  const queryClient = useQueryClient();

  const { mutate: createUserAndPost, isPending } = useMutation({
    mutationFn: async (data: { name: string; postTitle: string }) => {
      // First mutation: Create user
      const userResult = await graphqlClient.request(CreateUserDocument, {
        input: { name: data.name, email: `${data.name}@example.com` }
      });

      // Second mutation: Create post with user ID
      const postResult = await graphqlClient.request(CreatePostDocument, {
        input: {
          title: data.postTitle,
          body: 'Post body',
          userId: userResult.createUser.id
        }
      });

      return { user: userResult.createUser, post: postResult.createPost };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: getPostsQuery().queryKey });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createUserAndPost({
      name: formData.get('name') as string,
      postTitle: formData.get('postTitle') as string
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="User name" required />
      <input name="postTitle" placeholder="Post title" required />
      <button disabled={isPending}>
        {isPending ? 'Creating...' : 'Create User & Post'}
      </button>
    </form>
  );
}
```

### Pagination with GraphQL

Handle paginated GraphQL queries:

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { getPostsPageQuery } from './graphql';
import { useState } from 'react';

export default function PaginatedPosts() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getPostsPageQuery({ page, limit: 10 }),
    placeholderData: (previousData) => previousData // Keep previous data while fetching
  });

  return (
    <div>
      <ul>
        {data?.posts?.data?.map((post) => (
          <li key={post?.id}>{post?.title}</li>
        ))}
      </ul>
      <div>
        <button
          onClick={() => setPage((old) => Math.max(old - 1, 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          onClick={() => setPage((old) => old + 1)}
          disabled={isPlaceholderData || !data?.posts?.meta?.hasNextPage}
        >
          Next
        </button>
      </div>
      {isLoading && <div>Loading...</div>}
    </div>
  );
}
```

## Codegen Workflow

**After defining new queries or mutations:**

1. Run codegen: `pnpm codegen`
2. Types are generated in `src/server/graphql/__generated__/`
3. Import types from `@/server/graphql/__generated__/graphql`

**Development mode:** Use `pnpm dev` - runs Next.js and codegen in watch mode concurrently

**Before build:** Codegen runs automatically via `prebuild` script

## Key Points

- **Define operations**: Use `graphql()` helper with GraphQL template strings
- **Run codegen**: Types won't exist until `pnpm codegen` runs - **critical step**
- **Factory pattern**: Export query/mutation option factories (`getPostsQuery()`, `createPostMutation()`)
- **Type safety**: Variables and responses are fully typed after codegen
- **Cache invalidation**: Use `invalidateQueries()` with query factory's `queryKey`
- **Server prefetch**: Use `prefetchQuery()` + `HydrationBoundary` for SSR
- **Concurrent dev**: `pnpm dev` runs codegen in watch mode alongside Next.js
- **Optimistic updates**: Use `onMutate`, `onError`, and `onSettled` for instant UI feedback with rollback
- **Dependent queries**: Use `enabled` option to control when queries run based on available data
- **Error handling**: Configure `retry`, `retryDelay`, and `staleTime` for robust error recovery
- **Pagination**: Use `placeholderData` to keep previous data visible while fetching new pages
