# tRPC Implementation Guide

Practical patterns for implementing tRPC in Next.js App Router applications. **For initial setup, see `examples/trpc/`**.

## What is tRPC?

End-to-end type-safe APIs without schemas or code generation. Backend changes instantly reflect in frontend types.

## Architecture Pattern

```
src/
├── server/routers/         # tRPC routers and middleware
├── server/services/        # Business logic (error-as-value pattern)
├── server/lib/trpc/        # Context and server utilities
├── client/lib/trpc.ts      # Client instance
├── shared/lib/trpc.ts      # Shared utilities
└── shared/exceptions.ts    # Custom error classes
```

**Setup**: Copy structure from `examples/trpc/` - all boilerplate is there.

## Feature Router Pattern

### Router with Queries and Mutations

```typescript
import { z } from 'zod';
import { procedure, router } from '.';
import { authedUserProcedure } from './middlewares/auth';
import * as postsService from '../services/posts';

export const postsRouter = async () =>
  router({
    // Query: Fetch data (GET-like)
    getAll: procedure.use(loggingProcedure).query(async () => {
      const result = await postsService.getPosts();
      if (!('ok' in result)) throw result; // Error-as-value pattern
      return result.posts;
    }),

    // Query with input validation
    getById: procedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => {
        const result = await postsService.getPostById(input.id);
        if (!('ok' in result)) throw result;
        return result.post;
      }),

    // Mutation: Modify data (POST/PUT/DELETE-like)
    create: procedure
      .use(authedUserProcedure) // Requires authentication
      .input(
        z.object({
          title: z.string().min(1).max(200),
          body: z.string().min(1).max(5000)
        })
      )
      .mutation(async ({ input, ctx }) => {
        // ctx.user is available from authedUserProcedure
        const result = await postsService.createPost({
          ...input,
          userId: ctx.user.id
        });
        if (!('ok' in result)) throw result;
        return result.post;
      })
  });
```

**Key patterns:**

- `.query()` for reads, `.mutation()` for writes
- Chain `.use(middleware)` for cross-cutting concerns
- Chain `.input(zodSchema)` for validation
- Use error-as-value pattern in services, throw in routers

## Middleware Patterns

### Authentication Middleware

```typescript
import { UnauthorizedError } from '@/shared/exceptions';
import { middleware } from '..';
import { headers } from 'next/headers';

export const authedUserProcedure = middleware(async ({ next, ctx }) => {
  // Extract auth from headers/cookies (example with Payload CMS)
  const { user } = await ctx.payload.auth({ headers: await headers() });

  if (!user) throw new UnauthorizedError('User is not authenticated');

  return next({
    ctx: { user } // Add user to context for downstream procedures
  });
});
```

### Logging Middleware

```typescript
export const loggingProcedure = middleware(async ({ next, path, type }) => {
  const start = Date.now();
  console.log(`[tRPC] ${type} ${path} - started`);

  try {
    const result = await next();
    console.log(`[tRPC] ${type} ${path} - ${Date.now() - start}ms`);
    return result;
  } catch (error) {
    console.error(`[tRPC] ${type} ${path} - failed:`, error);
    throw error;
  }
});
```

### Rate Limiting Middleware

```typescript
export const rateLimitProcedure = (maxRequests: number, windowMs: number) =>
  middleware(async ({ next, ctx }) => {
    const identifier = ctx.user?.id || 'anonymous';
    // Check rate limit (use Redis in production)
    if (isRateLimited(identifier)) {
      throw new ForbiddenError('Rate limit exceeded');
    }
    return next();
  });
```

**Middleware composition:**

```typescript
procedure
  .use(loggingProcedure)
  .use(authedUserProcedure)
  .use(rateLimitProcedure(10, 60000))
  .mutation(async ({ input, ctx }) => {
    // All middleware executed in order
    // ctx.user guaranteed to exist here
  });
```

## Service Layer Pattern

Separate business logic from routers using **error-as-value pattern** (see `LLMs/error-handling-exception.md`):

```typescript
import { NotFoundError, UnexpectedFetchError } from '@/shared/exceptions';

export const getPostById = async (id: number) => {
  const response = await fetch(`${API_URL}/posts/${id}`);

  if (response.status === 404) {
    return new NotFoundError();
  }

  if (!response.ok) {
    return new UnexpectedFetchError();
  }

  const post = await response.json();

  return {
    ok: true as const, // Discriminator for type narrowing
    post
  };
};
```

**Benefits:**

- Explicit error handling (errors in return type)
- Type-safe (TypeScript narrows types)
- Easy to test
- Composable

## Client Usage

### Client Component

```typescript
'use client';
import { trpc } from '@/client/lib/trpc';

export function PostList() {
  const { data, isLoading, error } = trpc.posts.getAll.useQuery();

  const utils = trpc.useUtils();
  const createPost = trpc.posts.create.useMutation({
    onSuccess: () => utils.posts.getAll.invalidate(),
  });

  return <div>{/* ... */}</div>;
}
```

### Server Component (Prefetching)

```typescript
import { getServerTrpc } from '@/server/lib/trpc';

export default async function PostsPage() {
  const { trpc, HydrateClient } = await getServerTrpc();

  // Prefetch data on server (no loading state on client)
  await trpc.posts.getAll.prefetch();

  // Wrap client components with HydrateClient to hydrate cache
  return (
    <HydrateClient>
      <PostList />
    </HydrateClient>
  );
}
```

## Error Handling

See `LLMs/error-handling-exception.md` for error-as-value pattern. Custom error classes in `src/shared/exceptions.ts`.

```typescript
// Service returns errors as values
const result = await service.getPost(id);
if (!('ok' in result)) throw result;  // Router throws to convert to tRPC error

// Client handles errors
const { data, error } = trpc.posts.getById.useQuery({ id: 1 });
if (error) return <div>Error: {error.message}</div>;
```

## Input Validation

```typescript
.input(z.object({
  title: z.string().min(1).max(200),
  tags: z.array(z.string()).optional(),
}))
```

## Production Checklist

### Authentication

- [ ] Integrate real auth provider (Payload, NextAuth, Clerk)
- [ ] Update `createContext` to extract user from headers/cookies
- [ ] Implement proper session validation

### Error Handling

- [ ] Add error logging service (Sentry, LogRocket)
- [ ] Log errors in middleware
- [ ] Return user-friendly messages

### Performance

- [ ] Implement caching strategy (React cache, Redis)
- [ ] Add rate limiting (Redis, Unkey)
- [ ] Enable request batching (already configured)

### Security

- [ ] Validate all inputs with Zod
- [ ] Implement CSRF protection if needed
- [ ] Add request size limits
- [ ] Configure CORS appropriately

## Common Patterns

### Pagination

```typescript
.input(z.object({
  cursor: z.number().optional(),
  limit: z.number().min(1).max(100).default(10),
}))
.query(async ({ input }) => {
  const items = await db.posts.findMany({
    take: input.limit + 1,
    cursor: input.cursor ? { id: input.cursor } : undefined,
  });

  const hasMore = items.length > input.limit;
  return {
    items: hasMore ? items.slice(0, -1) : items,
    nextCursor: hasMore ? items[items.length - 1].id : undefined,
  };
});
```

### Type Inference

```typescript
import type { RouterOutput, RouterInput } from '@/server/routers/_app';

type Post = RouterOutput['posts']['getById'];
type CreatePostInput = RouterInput['posts']['create'];
```

## Resources

- **Setup Example**: `examples/trpc/` - Complete working implementation
- **Error Pattern**: `LLMs/error-handling-exception.md`
- **Production Reference**: `cpsst-booking` codebase
- **Official Docs**: https://trpc.io/

## Quick Reference

```typescript
// Router
export const router = async () =>
  router({
    proc: procedure.use(middleware).input(schema).query|mutation(async ({ input, ctx }) => {})
  });

// Client Component
const { data } = trpc.proc.useQuery(input);
const mutation = trpc.proc.useMutation();

// Server Component
const { trpc, HydrateClient } = await getServerTrpc();
await trpc.proc.prefetch(input);
return <HydrateClient><ClientComp /></HydrateClient>;
```
