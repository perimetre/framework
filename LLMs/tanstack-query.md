# TanStack Query Usage Guide

For more details on setup, refer to the [tanstack-query-and-graphql example](https://github.com/perimetre/framework/tree/main/examples/tanstack-query-and-graphql/).

## Query Factory Pattern

Define query options in a factory function for reuse across client and server:

```typescript
import { queryOptions } from '@tanstack/react-query';

type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

async function getTodos() {
  const response = await fetch('https://api.example.com/todos');
  if (!response.ok) throw new Error('Failed to fetch todos');
  return response.json() as unknown as Todo[];
}

const getTodosQueryKey = ['todos'];

export const getTodosQuery = () =>
  queryOptions({
    queryKey: getTodosQueryKey,
    queryFn: getTodos
  });
```

## Client Component - useQuery

Use `useQuery` for data fetching in client components:

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { getTodosQuery } from './queries';

export default function TodosPage() {
  const { data, error, isLoading, isSuccess } = useQuery(getTodosQuery());

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}
```

## Client Component - useMutation

Use `useMutation` for data mutations with automatic cache invalidation:

```typescript
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getTodosQuery } from './queries';

async function createTodo(title: string) {
  const response = await fetch('https://api.example.com/todos', {
    method: 'POST',
    body: JSON.stringify({ title, completed: false }),
    headers: { 'Content-type': 'application/json' }
  });
  if (!response.ok) throw new Error('Failed to create todo');
  return response.json();
}

export default function AddTodoForm() {
  const queryClient = useQueryClient();

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: createTodo,
    onSuccess: async () => {
      // Invalidate and refetch todos after successful mutation
      await queryClient.invalidateQueries({
        queryKey: getTodosQuery().queryKey
      });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    mutate(formData.get('title') as string);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" required />
      <button disabled={isPending}>
        {isPending ? 'Adding...' : 'Add Todo'}
      </button>
      {isError && <div>Error: {error.message}</div>}
    </form>
  );
}
```

## Server Component - Prefetching

Prefetch data on the server and hydrate on the client for instant rendering:

```typescript
import { getQueryClient } from '@/shared/react-query';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getTodosQuery } from './queries';
import TodosList from './todos-list';

export default async function TodosPage() {
  const queryClient = getQueryClient();

  // Option 1: Fetch data directly (use if you need it in this component)
  const data = await queryClient.fetchQuery(getTodosQuery());

  // Option 2: Prefetch for client components (recommended)
  await queryClient.prefetchQuery(getTodosQuery());

  return (
    <div>
      <h1>Todos</h1>
      {/* Wrap client components with HydrationBoundary */}
      <HydrationBoundary state={dehydrate(queryClient)}>
        <TodosList />
      </HydrationBoundary>
    </div>
  );
}
```

Client component consuming prefetched data:

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { getTodosQuery } from './queries';

export default function TodosList() {
  // No fetch occurs - data is reused from server prefetch
  const { data, error, isLoading } = useQuery(getTodosQuery());

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}
```

## Advanced Patterns

### Optimistic Updates

Update UI immediately before server confirms, with automatic rollback on error:

```typescript
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getTodosQuery } from './queries';

export default function ToggleTodoButton({ todo }: { todo: Todo }) {
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`https://api.example.com/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: !todo.completed }),
        headers: { 'Content-type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to update');
      return response.json();
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: getTodosQuery().queryKey });

      // Snapshot previous value
      const previousTodos = queryClient.getQueryData(getTodosQuery().queryKey);

      // Optimistically update
      queryClient.setQueryData(getTodosQuery().queryKey, (old: Todo[]) =>
        old.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
      );

      return { previousTodos };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      queryClient.setQueryData(getTodosQuery().queryKey, context?.previousTodos);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: getTodosQuery().queryKey });
    }
  });

  return (
    <button onClick={() => mutate(todo.id)}>
      {todo.completed ? 'Undo' : 'Complete'}
    </button>
  );
}
```

### Dependent Queries

Query that depends on data from another query:

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserQuery, getUserPostsQuery } from './queries';

export default function UserPostsPage({ userId }: { userId: string }) {
  const { data: user } = useQuery(getUserQuery(userId));

  // This query won't run until user.id exists
  const { data: posts, isLoading } = useQuery({
    ...getUserPostsQuery(user?.id),
    enabled: !!user?.id // Only run when user.id is available
  });

  if (!user) return <div>Loading user...</div>;
  if (isLoading) return <div>Loading posts...</div>;

  return (
    <div>
      <h1>{user.name}'s Posts</h1>
      <ul>
        {posts?.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Error Handling with Retry

Configure retry logic for failed queries:

```typescript
export const getTodosQuery = () =>
  queryOptions({
    queryKey: getTodosQueryKey,
    queryFn: getTodos,
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
import { getTodoQuery } from './queries';
import TodoDetail from './todo-detail';

export default async function TodoPage({
  params
}: {
  params: { id: string };
}) {
  const queryClient = getQueryClient();

  // Prefetch with dynamic parameter
  await queryClient.prefetchQuery(getTodoQuery(params.id));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TodoDetail todoId={params.id} />
    </HydrationBoundary>
  );
}
```

### Multiple Sequential Mutations

Execute mutations in sequence, passing data between them:

```typescript
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function CreateUserWithPostForm() {
  const queryClient = useQueryClient();

  const { mutate: createUserAndPost, isPending } = useMutation({
    mutationFn: async (data: { name: string; postTitle: string }) => {
      // Create user first
      const userResponse = await fetch('https://api.example.com/users', {
        method: 'POST',
        body: JSON.stringify({ name: data.name }),
        headers: { 'Content-type': 'application/json' }
      });
      const user = await userResponse.json();

      // Then create post with user ID
      const postResponse = await fetch('https://api.example.com/posts', {
        method: 'POST',
        body: JSON.stringify({ title: data.postTitle, userId: user.id }),
        headers: { 'Content-type': 'application/json' }
      });

      return { user, post: await postResponse.json() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
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

### Pagination

Handle paginated data with smooth UX:

```typescript
'use client';

import { useQuery, queryOptions } from '@tanstack/react-query';
import { useState } from 'react';

type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

type PaginatedResponse = {
  data: Todo[];
  total: number;
  page: number;
  pageSize: number;
};

async function getTodosPaginated(page: number, limit: number) {
  const response = await fetch(
    `https://api.example.com/todos?page=${page}&limit=${limit}`
  );
  if (!response.ok) throw new Error('Failed to fetch todos');
  return response.json() as unknown as PaginatedResponse;
}

const getTodosPaginatedQuery = (page: number, limit: number) =>
  queryOptions({
    queryKey: ['todos', 'paginated', page, limit],
    queryFn: () => getTodosPaginated(page, limit)
  });

export default function PaginatedTodos() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getTodosPaginatedQuery(page, limit),
    placeholderData: (previousData) => previousData // Keep previous data while fetching
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div>
      <ul>
        {data?.data.map((todo) => (
          <li key={todo.id}>
            <span className={todo.completed ? 'line-through' : ''}>
              {todo.title}
            </span>
          </li>
        ))}
      </ul>
      <div>
        <button
          onClick={() => setPage((old) => Math.max(old - 1, 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((old) => old + 1)}
          disabled={isPlaceholderData || page >= totalPages}
        >
          Next
        </button>
      </div>
      {isLoading && <div>Loading...</div>}
    </div>
  );
}
```

## Key Points

- **Query Factory Pattern**: Export `queryOptions()` factories for consistent keys across server/client
- **Cache Invalidation**: Use `queryClient.invalidateQueries()` with the same query key after mutations
- **Server Prefetch**: Use `prefetchQuery()` in server components, wrap client components with `HydrationBoundary`
- **Same Query Key = Cache Hit**: Client-side `useQuery()` reuses server-prefetched data automatically
- **Optimistic Updates**: Use `onMutate`, `onError`, and `onSettled` for instant UI feedback with rollback
- **Dependent Queries**: Use `enabled` option to control when queries run based on available data
- **Error Handling**: Configure `retry`, `retryDelay`, and `staleTime` for robust error recovery
- **Pagination**: Use `placeholderData` to keep previous data visible while fetching new pages
