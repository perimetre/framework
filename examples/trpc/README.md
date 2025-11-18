# tRPC Example

End-to-end type-safe APIs with Next.js App Router, following production patterns from cpsst-booking.

### What this example is NOT

- This is **not** an example of file organization - it focuses on tRPC patterns and usage
- For full architecture guidance, see `LLMs/trpc.md`

---

## Important files to note:

### Setup Files

- [`src/server/routers/index.ts`](src/server/routers/index.ts) - tRPC initialization with SuperJSON
- [`src/server/lib/trpc/context.ts`](src/server/lib/trpc/context.ts) - Request context factory
- [`src/server/routers/_app.ts`](src/server/routers/_app.ts) - Root router
- [`src/client/lib/trpc.ts`](src/client/lib/trpc.ts) - Client tRPC instance
- [`src/server/lib/trpc/index.ts`](src/server/lib/trpc/index.ts) - Server tRPC utilities (HydrateClient)
- [`src/shared/lib/trpc.ts`](src/shared/lib/trpc.ts) - Shared query client utilities
- [`src/components/Providers/TRPCReactProvider.tsx`](src/components/Providers/TRPCReactProvider.tsx) - Provider with batching and devtools
- [`src/app/layout.tsx`](src/app/layout.tsx) - Root layout with provider
- [`src/app/api/trpc/[trpc]/route.ts`](src/app/api/trpc/[trpc]/route.ts) - API route handler
- [`src/app/api/trpc/revalidate/route.ts`](src/app/api/trpc/revalidate/route.ts) - Cache revalidation endpoint

### Router and Service Examples

- [`src/server/routers/posts.ts`](src/server/routers/posts.ts) - Feature router with queries, mutations, validation, and middleware
- [`src/server/services/posts.ts`](src/server/services/posts.ts) - Service layer with error-as-values pattern
- [`src/server/routers/middlewares/`](src/server/routers/middlewares/) - Auth, logging, rate limiting, and caching middleware
- [`src/shared/exceptions.ts`](src/shared/exceptions.ts) - Custom error classes with HTTP status codes

## Usage examples:

- [`src/app/client-component/page.tsx`](src/app/client-component/page.tsx) - Client component with useQuery, useMutation, and optimistic updates
- [`src/app/server-component/page.tsx`](src/app/server-component/page.tsx) - Server component prefetching with HydrateClient
  - [`src/app/server-component/posts-list.tsx`](src/app/server-component/posts-list.tsx) - Client component consuming prefetched data
- [`src/app/error-handling/page.tsx`](src/app/error-handling/page.tsx) - Error handling patterns (validation, auth, not found)

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── trpc/
│   │       └── [trpc]/
│   │           └── route.ts           # tRPC API handler
│   ├── client-component/
│   │   └── page.tsx                   # Client component example
│   ├── server-component/
│   │   ├── page.tsx                   # Server component example
│   │   └── posts-list.tsx             # Client component with prefetched data
│   ├── error-handling/
│   │   └── page.tsx                   # Error handling examples
│   ├── layout.tsx                     # Root layout with provider
│   └── page.tsx                       # Home page with navigation
│
├── client/
│   └── lib/
│       └── trpc.ts                    # tRPC React client
│
├── components/
│   └── Providers/
│       └── TRPCReactProvider.tsx      # tRPC provider component
│
├── server/
│   ├── lib/
│   │   └── trpc/
│   │       ├── context.ts             # Context creation
│   │       └── index.ts               # Server tRPC utilities
│   ├── routers/
│   │   ├── index.ts                   # tRPC initialization
│   │   ├── _app.ts                    # Root router
│   │   ├── posts.ts                   # Posts router
│   │   └── middlewares/
│   │       ├── auth.ts                # Authentication middleware
│   │       ├── cache.ts               # Caching middleware
│   │       ├── logging.ts             # Logging middleware
│   │       └── ratelimit.ts           # Rate limiting middleware
│   └── services/
│       └── posts.ts                   # Posts service layer
│
└── shared/
    ├── exceptions.ts                  # Custom error classes
    └── lib/
        └── trpc.ts                    # Shared utilities
```

## Key Patterns

### 1. Async Router Architecture

All routers are async factory functions:

```typescript
export const postsRouter = async () =>
  router({
    getAll: procedure.query(async () => {
      /* ... */
    })
  });
```

This allows for:

- Dynamic initialization
- Async resource loading
- Dependency injection

### 2. Service Layer Pattern

Business logic separated from routers:

```typescript
// Service layer
export const getPosts = async () => {
  const response = await fetch(API_URL);
  if (!response.ok) return new UnexpectedFetchError();
  return { ok: true as const, posts: await response.json() };
};

// Router
getAll: procedure.query(async () => {
  const result = await postsService.getPosts();
  if (!('ok' in result)) throw result;
  return result.posts;
});
```

### 3. Middleware Composition

Chain multiple middleware:

```typescript
procedure
  .use(loggingProcedure)
  .use(cacheMiddleware(60, 3600)) // Fresh for 60s, revalidate after 1 hour
  .use(authedUserProcedure)
  .use(rateLimitProcedure(5, 60000))
  .mutation(async ({ input, ctx }) => {
    /* ... */
  });
```

### 4. Error as Values

Following the pattern from `LLMs/error-handling-exception.md`:

```typescript
// Return errors as values
const result = await someOperation();
if (!('ok' in result)) {
  throw result; // tRPC converts to proper error response
}
// TypeScript knows result has 'ok' and data
```

### 5. Input Validation with Zod

Type-safe input validation:

```typescript
.input(
  z.object({
    title: z.string().min(1).max(200),
    body: z.string().min(1).max(5000),
    userId: z.number().int().positive()
  })
)
```

### 6. React Server Components Integration

Prefetch data on the server:

```typescript
// Server Component
const trpc = await getServerTrpc();
await trpc.posts.getAll.prefetch();

// Client Component (child)
const { data } = trpc.posts.getAll.useQuery();
// Data is immediately available from server prefetch
```

### 7. HTTP Caching with Stale-While-Revalidate

**All queries are cached by default** using the tRPC `responseMeta` pattern:

```typescript
// ✅ Default caching (s-maxage=1, stale-while-revalidate=120)
// No middleware needed - all queries are cached automatically!
getAll: procedure.query(async () => {
  /* ... */
});

// ✅ Custom cache duration
// Use middleware to override default cache settings
getById: procedure
  .use(cacheMiddleware(60, 3600)) // s-maxage=60, stale-while-revalidate=3600
  .query(async () => {
    /* ... */
  });

// ✅ Opt out of caching
// Use noCacheMiddleware for user-specific or real-time data
getByUserId: procedure
  .use(noCacheMiddleware) // No cache headers sent
  .query(async () => {
    /* ... */
  });
```

How it works:

1. **All queries are cached by default** (opt-in by default)
2. Use `cacheMiddleware(maxAge, swr)` to customize cache duration
3. Use `noCacheMiddleware` to opt out completely
4. Route handler's `responseMeta` sets HTTP headers based on metadata
5. CDN/edge caches serve responses based on `cache-control` headers
6. Queries use GET (cacheable), mutations use POST (not cached)

**Default cache header:**

```
cache-control: public, s-maxage=1, stale-while-revalidate=120
```

This tells the edge to:

- Serve from cache immediately (even if stale)
- Revalidate in background after 1 second
- Serve stale content for up to 2 minutes during revalidation

**⚠️ Platform-Specific Headers:**
See [`src/app/api/trpc/[trpc]/route.ts`](src/app/api/trpc/[trpc]/route.ts) and uncomment the appropriate option:

- Standard (default) - works everywhere
- Vercel - `vercel-cdn-cache-control`, `cdn-cache-control`
- Cloudflare - `cloudflare-cdn-cache-control`

## Running the Example

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Run the development server:

   ```bash
   pnpm dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

### Debug Logging

To enable detailed logging of all tRPC requests and responses:

1. Create a `.env` file (or copy `.env.example`):

   ```bash
   cp .env.example .env
   ```

2. Enable debug mode:

   ```env
   NEXT_PUBLIC_DEBUG_TRPC=true
   ```

3. Restart the dev server

You'll see colorful console logs showing:

- Request type (QUERY/MUTATION)
- Procedure path
- Input variables
- Response results/errors

## Key Differences from Other Examples

This example differs from typical tRPC examples by:

1. **Following production patterns** - Based on real production code from cpsst-booking
2. **Async routers** - All routers are async factory functions
3. **Service layer** - Business logic separated from routers
4. **Error as values** - Consistent error handling pattern
5. **Comprehensive middleware** - Auth, logging, rate limiting examples
6. **React cache** - Context and query client caching per request
7. **SuperJSON** - Support for complex types (Dates, Maps, Sets)

## Integration with Your Application

To use tRPC in your application:

1. **Copy the core setup files**:
   - `src/server/routers/index.ts` (tRPC init)
   - `src/server/lib/trpc/context.ts` (context)
   - `src/shared/lib/trpc.ts` (shared utilities)
   - `src/components/Providers/TRPCReactProvider.tsx` (provider)

2. **Create your routers**:
   - Follow the pattern in `src/server/routers/posts.ts`
   - Add to `src/server/routers/_app.ts`

3. **Add middleware as needed**:
   - Copy relevant middleware from `src/server/routers/middlewares/`
   - Customize for your auth/logging/rate limiting needs

4. **Create services**:
   - Follow the pattern in `src/server/services/posts.ts`
   - Use error-as-values pattern

5. **Update your layout**:
   - Wrap with `TRPCReactProvider`

## Dependencies

Key dependencies used:

- `@trpc/server` - tRPC server
- `@trpc/client` - tRPC client
- `@trpc/react-query` - React Query integration
- `@tanstack/react-query` - Data fetching/caching
- `superjson` - Type-safe serialization
- `zod` - Schema validation

## Production Considerations

When moving to production:

1. **Authentication**:
   - Replace mock auth in `context.ts` with real auth (NextAuth, Clerk, Payload, etc.)
   - Update `authedUserProcedure` middleware
   - Example with Payload CMS (from cpsst-booking):

     ```typescript
     import { headers } from 'next/headers';

     export const authedUserProcedure = middleware(async ({ next, ctx }) => {
       const { user } = await ctx.payload.auth({ headers: await headers() });

       if (!user) throw new UnauthorizedError('User is not authenticated');

       return next({ ctx: { user } });
     });
     ```

2. **Rate Limiting**:
   - Replace in-memory rate limiting with Redis or Unkey
   - Add per-user rate limits

3. **Error Logging**:
   - Add error logging service (Sentry, LogRocket, etc.)
   - Log errors in middleware

4. **Database**:
   - Add database client to context
   - Create proper service layer with DB queries

5. **Environment Variables**:
   - Add `BASE_URL` for production
   - Configure CORS if needed

6. **ES Module Configuration**:
   - Add `"type": "module"` to your `package.json` for consistent ES module handling

7. **Error Handling**:
   - The example uses a custom `fetch` function for 401 redirects
   - For more granular control, consider using `retryLink` from `@trpc/client`:

     ```typescript
     import { retryLink } from '@trpc/client';

     links: [
       retryLink({
         retry: (opts) => {
           if (opts.error.data?.code === 'UNAUTHORIZED') {
             push('/login');
           }
           return false; // Don't retry
         }
       }),
       httpBatchLink({ ... })
     ]
     ```

### HTTP Caching and Revalidation

The example includes a complete HTTP caching setup following the tRPC caching pattern:
https://trpc.io/docs/server/caching

**🚀 All queries are cached by default** (opt-in by default)

**How It Works:**

1. **Route Handler** ([`src/app/api/trpc/[trpc]/route.ts`](src/app/api/trpc/[trpc]/route.ts))
   - All queries automatically get cache headers via `responseMeta`
   - Default: `s-maxage=1, stale-while-revalidate=120` (2 minutes)

2. **Cache Middleware** ([`src/server/routers/middlewares/cache.ts`](src/server/routers/middlewares/cache.ts))
   - `cacheMiddleware(maxAge, swr)` - Override default cache duration
   - `noCacheMiddleware` - Opt out of caching

3. **Edge/CDN Caching**
   - CDN respects `cache-control` headers and serves cached responses

**Usage:**

```typescript
// ✅ Default caching - no middleware needed!
procedure.query(async () => { ... })

// ✅ Custom cache duration
procedure
  .use(cacheMiddleware(60, 3600))
  .query(async () => { ... })

// ✅ Opt out of caching
procedure
  .use(noCacheMiddleware)
  .query(async () => { ... })
```

**⚠️ Platform-Specific Headers:**

The route handler includes commented examples for:

- **Standard** - `cache-control` (currently active, works everywhere)
- **Vercel** - `vercel-cdn-cache-control`, `cdn-cache-control`
- **Cloudflare** - `cloudflare-cdn-cache-control`

**Remember to uncomment the appropriate option** in the route handler file based on where your app is hosted.

**Default Cache Strategy:**

```
cache-control: public, s-maxage=1, stale-while-revalidate=120
```

This means:

- Edge caches for 1 second
- Serves stale content for up to 2 minutes while revalidating
- First request after 1s triggers background revalidation
- Subsequent requests get stale content instantly

**Revalidation Endpoint:** [`src/app/api/trpc/revalidate/route.ts`](src/app/api/trpc/revalidate/route.ts)

For on-demand cache purging (experimental tRPC feature).

#### Additional Path Aliases

For larger projects, consider adding convenience aliases to `tsconfig.json`:

```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@server/*": ["./src/server/*"],
    "@exceptions": ["./src/shared/exceptions.ts"],
    "@log": ["./src/server/lib/log.ts"]
  }
}
```

This reduces import path verbosity in large codebases.

## Additional Resources

- [tRPC Documentation](https://trpc.io/)
- [tRPC with Next.js](https://trpc.io/docs/client/nextjs)
- [React Server Components](https://trpc.io/docs/client/react/server-components)
- [cpsst-booking source](../../../cpsst-booking/) - Production reference implementation
- [Error Handling Guide](../../../LLMs/error-handling-exception.md) - Error handling patterns

## Comparison with GraphQL Example

For comparison with GraphQL, see the [`tanstack-query-and-graphql`](../tanstack-query-and-graphql/) example. Key differences:

| Feature        | tRPC                       | GraphQL                 |
| -------------- | -------------------------- | ----------------------- |
| Type Safety    | Native TypeScript          | Codegen required        |
| Schema         | No explicit schema         | GraphQL schema          |
| Queries        | TypeScript functions       | GraphQL queries         |
| Learning Curve | Lower (just TypeScript)    | Higher (GraphQL syntax) |
| Flexibility    | Tied to TypeScript         | Language agnostic       |
| Best For       | Full-stack TypeScript apps | Multi-client APIs       |
