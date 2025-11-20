# Next.js Caching, SSG, and ISR Guide

Practical patterns for optimizing Next.js App Router applications through caching strategies, static generation, and performance optimization.

## Overview

Next.js implements multiple caching layers that work together to optimize performance:

1. **Data Cache** - Server-side persistent cache for fetch requests and database queries
2. **Full Route Cache** - Pre-rendered HTML and RSC payloads for static routes
3. **Request Memoization** - Per-request deduplication of identical fetch calls
4. **Router Cache** - Client-side in-memory cache for visited routes

### Recommended Approach: SSG + ISR (Mandatory)

**IMPORTANT:** The preferred approach is **Static Site Generation (SSG) with Incremental Static Regeneration (ISR)**. ISR is **obligatory** for content-driven sites to ensure content stays fresh without manual rebuilds.

**Why SSG + ISR is preferred:**

- Pre-rendered pages for instant initial load (SSG benefit)
- Automatic content updates without rebuilding entire site (ISR benefit)
- Background regeneration keeps site fast while updating content
- Combines best of static and dynamic: speed + freshness

**Recommended ISR strategy:**

- **Time-based revalidation** (`revalidate: 60`) - Automatic background updates every N seconds
- **Webhook-based revalidation** (`revalidatePath`/`revalidateTag`) - Immediate updates when content changes in CMS
- **Combine both** for optimal experience: time-based as fallback, webhooks for instant updates

**Architecture preference (best to worst):**

1. ✅ **SSG + ISR (time-based + webhooks) with `"use cache"` directive** - PREFERRED (Next.js 16+)
2. ✅ **SSG + ISR (time-based + webhooks) with `unstable_cache`** - Good (fallback for older versions)
3. ⚠️ **SSG + ISR (time-based only)** - Acceptable if webhooks not available
4. ⚠️ **SSG + ISR (webhooks only)** - Acceptable but requires manual triggers
5. ❌ **Pure SSG (no revalidation)** - Avoid: requires full rebuild for updates
6. ❌ **Static Export** - Last resort only (no server features, no ISR)

### Modern Caching Method: `"use cache"` Directive (Next.js 16+)

**PREFERRED:** Next.js 16 introduces the `"use cache"` directive as the modern, explicit way to cache components and functions. This replaces the implicit caching behavior and `unstable_cache` with a clearer, opt-in model.

**Why `"use cache"` is preferred:**

- **Explicit over implicit** - Clear what's cached vs not cached
- **Automatic cache keys** - No manual key management required
- **Compiler-powered** - Leverages Next.js compiler for optimization
- **Type-safe** - Better TypeScript integration
- **Flexible** - Works at file, component, and function level
- **Built-in lifecycle** - Integrated `cacheLife()` and `cacheTag()` helpers

## Modern Caching with `"use cache"` Directive (Next.js 16+)

**Enable in next.config.ts:**

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  cacheComponents: true // ✅ Enable "use cache" directive
};

export default config;
```

### Function-Level Caching (Most Common)

Cache individual async functions - the most common and recommended pattern.

**✅ PREFERRED: Colocate cached functions with page component**

When data fetching is specific to a page, define the cached function in the same file:

```typescript
// app/users/[id]/page.tsx
import { cacheLife, cacheTag } from 'next/cache';

export const revalidate = 60; // Time-based revalidation

// ✅ PREFERRED: Colocated cached function
async function getUserCached(id: string) {
  'use cache'; // Cache this function
  cacheLife('hours'); // Cache for 1 hour
  cacheTag('users', `user-${id}`); // Tag for invalidation

  const response = await fetch(`https://api.example.com/users/${id}`);
  return response.json();
}

export default async function UserPage({ params }: { params: { id: string } }) {
  // ✅ Cached automatically - no manual cache key needed
  const user = await getUserCached(params.id);

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

**Alternative: Separate file for reusable functions**

Only extract to separate files when the function is reused across multiple pages:

```typescript
// lib/data.ts - For shared/reusable data fetching
import { cacheLife, cacheTag } from 'next/cache';

export async function getPosts() {
  'use cache';
  cacheLife('minutes'); // Cache for 15 minutes (default)
  cacheTag('posts');

  const response = await fetch('https://api.example.com/posts');
  return response.json();
}

// app/posts/page.tsx - Import when reusing across pages
import { getPosts } from '@/lib/data';

export default async function PostsPage() {
  const posts = await getPosts();
  return <ul>{/* render posts */}</ul>;
}
```

**Naming convention:**

Use descriptive names that indicate caching: `getUserCached`, `getPostsCached`, `getDataCached`, etc.

### Component-Level Caching

Cache entire React Server Components:

```typescript
// components/product-list.tsx
import { cacheLife, cacheTag } from 'next/cache';

// ✅ Cache the entire component output
export async function ProductList({ category }: { category: string }) {
  'use cache';
  cacheLife('hours');
  cacheTag('products', `category-${category}`);

  const products = await fetch(`https://api.example.com/products?category=${category}`)
    .then((r) => r.json());

  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>{product.name}</li>
      ))}
    </ul>
  );
}
```

**Usage:**

```typescript
// app/products/page.tsx
import { ProductList } from '@/components/product-list';

export default function ProductsPage() {
  return (
    <div>
      <h1>Products</h1>
      {/* Component is cached with its props as cache key */}
      <ProductList category="electronics" />
    </div>
  );
}
```

### File-Level Caching

Cache all exported async functions in a file:

```typescript
// lib/analytics.ts
'use cache'; // ✅ Applies to all exports in this file

import { cacheLife } from 'next/cache';

export async function getPageViews(slug: string) {
  cacheLife('minutes');
  // Cached automatically
  const views = await db.query('SELECT views FROM pages WHERE slug = $1', [
    slug
  ]);
  return views;
}

export async function getUniqueVisitors() {
  cacheLife('hours');
  // Also cached automatically
  const visitors = await db.query('SELECT COUNT(DISTINCT user_id) FROM visits');
  return visitors;
}
```

### Cache Lifecycles with `cacheLife()`

Built-in cache duration profiles:

```typescript
import { cacheLife } from 'next/cache';

// Built-in profiles
cacheLife('default'); // Client: 5min, Server: 15min (default if not specified)
cacheLife('seconds'); // Client: 1sec, Server: 10sec
cacheLife('minutes'); // Client: 5min, Server: 15min
cacheLife('hours'); // Client: 5min, Server: 1hour
cacheLife('days'); // Client: 5min, Server: 1day
cacheLife('weeks'); // Client: 5min, Server: 1week
cacheLife('max'); // Client: 5min, Server: infinity (never expires)
```

**Custom cache lifecycles:**

```typescript
// next.config.ts
const config: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    blog: {
      stale: 300, // Client: 5 minutes
      revalidate: 3600, // Server: 1 hour
      expire: 86400 // Expire after 24 hours
    },
    products: {
      stale: 60,
      revalidate: 300,
      expire: 3600
    }
  }
};

// Usage
export async function getBlogPost(slug: string) {
  'use cache';
  cacheLife('blog'); // Use custom profile
  return fetch(`/api/posts/${slug}`);
}
```

### Tag-Based Revalidation

Invalidate caches with tags:

```typescript
// lib/data.ts
import { cacheTag } from 'next/cache';

export async function getProduct(id: string) {
  'use cache';
  cacheTag('products', `product-${id}`); // Multiple tags

  const product = await fetch(`https://api.example.com/products/${id}`).then(
    (r) => r.json()
  );

  return product;
}
```

**Invalidate via webhook:**

```typescript
// app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  const { tag } = await request.json();

  // ✅ Revalidate all caches with this tag
  revalidateTag(tag);

  return Response.json({ revalidated: true });
}
```

### Complete Example: Blog with `"use cache"`

**✅ PREFERRED: Colocated approach**

```typescript
// app/blog/page.tsx
import { cacheLife, cacheTag } from 'next/cache';
import Link from 'next/link';

export const revalidate = 60; // Time-based fallback

// ✅ Colocated cached function
async function getAllPostsCached() {
  'use cache';
  cacheLife('minutes');
  cacheTag('blog', 'posts');

  const posts = await fetch('https://cms.example.com/posts')
    .then((r) => r.json());

  return posts;
}

export default async function BlogPage() {
  const posts = await getAllPostsCached(); // ✅ Cached with "use cache"

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </li>
      ))}
    </ul>
  );
}

// app/blog/[slug]/page.tsx
import { cacheLife, cacheTag } from 'next/cache';

export const revalidate = 60;

// ✅ Colocated cached function
async function getPostCached(slug: string) {
  'use cache';
  cacheLife('hours');
  cacheTag('blog', 'posts', `post-${slug}`);

  const post = await fetch(`https://cms.example.com/posts/${slug}`)
    .then((r) => r.json());

  return post;
}

// Shared function can be extracted if reused
async function getAllPostsCached() {
  'use cache';
  cacheLife('minutes');
  cacheTag('blog', 'posts');

  const posts = await fetch('https://cms.example.com/posts')
    .then((r) => r.json());

  return posts;
}

export async function generateStaticParams() {
  const posts = await getAllPostsCached();
  return posts.slice(0, 50).map((post) => ({ slug: post.slug }));
}

export const dynamicParams = true;

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPostCached(params.slug); // ✅ Cached with "use cache"

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}

// app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  const secret = request.nextUrl.searchParams.get('secret');

  if (secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ message: 'Invalid secret' }, { status: 401 });
  }

  const { slug } = await request.json();

  if (slug) {
    revalidateTag(`post-${slug}`); // ✅ Invalidate specific post
  } else {
    revalidateTag('posts'); // ✅ Invalidate all posts
  }

  return Response.json({ revalidated: true });
}
```

**Alternative: Extracted functions (when reused)**

```typescript
// lib/blog.ts - Only if functions are reused across multiple pages
import { cacheLife, cacheTag } from 'next/cache';

export async function getAllPostsCached() {
  'use cache';
  cacheLife('minutes');
  cacheTag('blog', 'posts');

  const posts = await fetch('https://cms.example.com/posts').then((r) =>
    r.json()
  );

  return posts;
}

export async function getPostCached(slug: string) {
  'use cache';
  cacheLife('hours');
  cacheTag('blog', 'posts', `post-${slug}`);

  const post = await fetch(`https://cms.example.com/posts/${slug}`).then((r) =>
    r.json()
  );

  return post;
}
```

### Important Constraints

**Cannot use dynamic APIs inside cached functions:**

```typescript
// ❌ WRONG: Cannot access dynamic APIs directly
export async function getUser() {
  'use cache';
  const headersList = await headers(); // ❌ Error!
  return fetch('/api/user');
}

// ✅ CORRECT: Pass dynamic data as arguments
export async function getUser(authToken: string) {
  'use cache';
  return fetch('/api/user', {
    headers: { Authorization: authToken }
  });
}

// Usage
const headersList = await headers();
const authToken = headersList.get('authorization') || '';
const user = await getUser(authToken); // ✅ Argument becomes part of cache key
```

### Automatic Cache Key Generation

The compiler automatically generates cache keys based on:

- Build ID (unique per build)
- Function location and signature
- All serializable arguments/props
- Variables from outer scopes (closures)

**No manual cache key management needed:**

```typescript
// ✅ Cache key automatically includes: id, category
export async function getProducts(id: string, category: string) {
  'use cache';
  return fetch(`/api/products?id=${id}&category=${category}`);
}
```

### Migration from `unstable_cache`

**Before (unstable_cache):**

```typescript
import { unstable_cache } from 'next/cache';

const getUser = unstable_cache(
  async (id: string) => {
    return fetch(`/api/users/${id}`);
  },
  ['user'], // ❌ Manual cache key
  {
    tags: ['users', `user-${id}`], // ❌ Manual tag management
    revalidate: 3600
  }
);
```

**After ("use cache"):**

```typescript
import { cacheLife, cacheTag } from 'next/cache';

export async function getUser(id: string) {
  'use cache'; // ✅ Automatic cache key
  cacheLife('hours'); // ✅ Built-in lifecycle
  cacheTag('users', `user-${id}`); // ✅ Cleaner tag API

  return fetch(`/api/users/${id}`);
}
```

**Benefits:**

- No manual cache key strings to maintain
- Cleaner, more explicit syntax
- Better TypeScript inference
- Compiler optimizations
- Integrated lifecycle management

## SSG + ISR: The Preferred Pattern

Pre-render pages at build time with automatic revalidation for the best balance of performance and freshness.

### Basic SSG Setup (Foundation)

Start with static generation as the foundation:

```typescript
// app/posts/page.tsx
async function getPosts() {
  const response = await fetch('https://api.example.com/posts', {
    cache: 'force-cache' // Cache indefinitely (default in App Router)
  });
  return response.json();
}

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### Dynamic Routes with generateStaticParams

Pre-generate specific dynamic routes at build time:

```typescript
// app/posts/[id]/page.tsx
type Post = {
  id: string;
  title: string;
  content: string;
};

async function getPost(id: string) {
  const response = await fetch(`https://api.example.com/posts/${id}`, {
    cache: 'force-cache'
  });
  return response.json();
}

// Generate static paths at build time
export async function generateStaticParams() {
  const response = await fetch('https://api.example.com/posts');
  const posts = await response.json();

  return posts.map((post: Post) => ({
    id: post.id
  }));
}

export default async function PostPage({
  params
}: {
  params: { id: string };
}) {
  const post = await getPost(params.id);

  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}
```

**Key patterns:**

- `generateStaticParams()` returns array of route parameters to pre-render
- All returned paths are built as static HTML at build time
- Ungenerated paths can render on-demand or return 404 (controlled by `dynamicParams`)

### Partial Static Generation

Generate only popular routes at build time, render others on-demand:

```typescript
// app/products/[slug]/page.tsx
export async function generateStaticParams() {
  // Only pre-render top 100 products
  const response = await fetch('https://api.example.com/products/popular?limit=100');
  const products = await response.json();

  return products.map((product) => ({
    slug: product.slug
  }));
}

// Allow other products to render on-demand
export const dynamicParams = true; // default

export default async function ProductPage({
  params
}: {
  params: { slug: string };
}) {
  const product = await fetch(`https://api.example.com/products/${params.slug}`, {
    next: { revalidate: 3600 } // Revalidate hourly
  }).then((r) => r.json());

  return <div>{product.name}</div>;
}
```

### Nested Dynamic Routes

Generate multiple dynamic segments:

```typescript
// app/blog/[category]/[slug]/page.tsx
export async function generateStaticParams() {
  const categories = await fetch('https://api.example.com/categories').then((r) =>
    r.json()
  );

  const paths = [];
  for (const category of categories) {
    const posts = await fetch(
      `https://api.example.com/posts?category=${category.slug}`
    ).then((r) => r.json());

    for (const post of posts) {
      paths.push({
        category: category.slug,
        slug: post.slug
      });
    }
  }

  return paths;
}

export default async function BlogPostPage({
  params
}: {
  params: { category: string; slug: string };
}) {
  const post = await fetch(
    `https://api.example.com/posts/${params.category}/${params.slug}`
  ).then((r) => r.json());

  return <article>{post.title}</article>;
}
```

## Adding ISR (Mandatory for Content Sites)

**ALWAYS add ISR to your SSG setup.** Never use pure SSG without revalidation for content-driven sites.

### Complete SSG + ISR Pattern (Recommended)

Combine time-based and webhook-based revalidation for optimal freshness:

```typescript
// app/blog/[slug]/page.tsx
import { unstable_cache } from 'next/cache';
import { getQueryClient } from '@/shared/react-query';
import { blogPostQuery, allBlogPostsQuery } from './graphql';

// ✅ STEP 1: Add route-level time-based revalidation
export const revalidate = 60; // Revalidate every 60 seconds

export default async function BlogPostPage({
  params
}: {
  params: { slug: string };
}) {
  const getPost = unstable_cache(
    async () => {
      const queryClient = getQueryClient();
      return await queryClient.fetchQuery(
        blogPostQuery({ slug: params.slug })
      );
    },
    ['blog-post', params.slug],
    {
      // ✅ STEP 2: Tag for webhook-based revalidation
      tags: ['blog', `post-${params.slug}`],
      revalidate: 60 // Time-based fallback
    }
  );

  const data = await getPost();

  return (
    <article>
      <h1>{data.post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: data.post.content }} />
    </article>
  );
}

// ✅ STEP 3: Pre-generate popular posts at build time
export async function generateStaticParams() {
  const queryClient = getQueryClient();
  const data = await queryClient.fetchQuery(allBlogPostsQuery());

  return data.posts.slice(0, 50).map((post) => ({
    slug: post.slug
  }));
}

// ✅ STEP 4: Allow on-demand generation with ISR
export const dynamicParams = true;
```

```typescript
// ✅ STEP 5: Create webhook endpoint for CMS updates
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  // Verify secret to prevent unauthorized revalidation
  if (secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ message: 'Invalid secret' }, { status: 401 });
  }

  const body = await request.json();

  // Option 1: Revalidate specific post by slug
  if (body.slug) {
    revalidateTag(`post-${body.slug}`);
    return Response.json({
      revalidated: true,
      tag: `post-${body.slug}`,
      timestamp: new Date().toISOString()
    });
  }

  // Option 2: Revalidate all blog posts
  if (body.revalidateAll) {
    revalidateTag('blog');
    return Response.json({
      revalidated: true,
      tag: 'blog',
      timestamp: new Date().toISOString()
    });
  }

  return Response.json(
    { message: 'Missing slug or revalidateAll' },
    { status: 400 }
  );
}
```

**CMS Webhook Configuration (WordPress/Payload/Strapi):**

```bash
# Webhook URL to add in your CMS
POST https://yoursite.com/api/revalidate?secret=YOUR_SECRET

# Webhook payload when post is updated
{
  "slug": "my-blog-post"
}

# Webhook payload to revalidate all posts
{
  "revalidateAll": true
}
```

**How this works:**

1. **Build time**: `generateStaticParams` pre-renders top 50 posts
2. **First visit to unpopular post**: Generates on-demand with `dynamicParams: true`
3. **Background updates**: `revalidate: 60` refreshes stale content automatically
4. **Immediate updates**: CMS webhook calls `/api/revalidate` when content changes
5. **Best of both**: Time-based ensures freshness, webhooks enable instant updates

### Time-Based Revalidation

Automatically refresh cached content after a specified time:

```typescript
// app/products/page.tsx
async function getProducts() {
  const response = await fetch('https://api.example.com/products', {
    next: { revalidate: 3600 } // Revalidate every hour
  });
  return response.json();
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>{product.name}</li>
      ))}
    </ul>
  );
}
```

**How it works:**

1. First request serves cached content (or generates if not cached)
2. After revalidation period, next request serves stale content
3. Background regeneration updates the cache
4. Subsequent requests get fresh content

### Route-Level Revalidation

Set revalidation time for entire route:

```typescript
// app/blog/page.tsx
export const revalidate = 60; // Revalidate every minute

async function getPosts() {
  const response = await fetch('https://api.example.com/posts');
  return response.json();
}

export default async function BlogPage() {
  const posts = await getPosts();
  return <div>{/* render posts */}</div>;
}
```

### On-Demand Revalidation

Invalidate cache immediately after content changes:

```typescript
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  // Verify secret to prevent unauthorized revalidation
  if (secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ message: 'Invalid secret' }, { status: 401 });
  }

  const body = await request.json();

  // Option 1: Revalidate specific path
  if (body.path) {
    revalidatePath(body.path);
    return Response.json({ revalidated: true, path: body.path });
  }

  // Option 2: Revalidate by tag
  if (body.tag) {
    revalidateTag(body.tag);
    return Response.json({ revalidated: true, tag: body.tag });
  }

  return Response.json({ message: 'Missing path or tag' }, { status: 400 });
}
```

**Usage from CMS webhook:**

```bash
curl -X POST 'https://yoursite.com/api/revalidate?secret=YOUR_SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"path": "/blog"}'
```

### Tag-Based Revalidation

Cache and invalidate related data across multiple pages:

```typescript
// app/products/[id]/page.tsx
async function getProduct(id: string) {
  const response = await fetch(`https://api.example.com/products/${id}`, {
    next: {
      tags: ['products', `product-${id}`], // Tag this request
      revalidate: 3600
    }
  });
  return response.json();
}

async function getRelatedProducts(id: string) {
  const response = await fetch(`https://api.example.com/products/${id}/related`, {
    next: {
      tags: ['products'], // Same tag
      revalidate: 3600
    }
  });
  return response.json();
}

export default async function ProductPage({
  params
}: {
  params: { id: string };
}) {
  const [product, related] = await Promise.all([
    getProduct(params.id),
    getRelatedProducts(params.id)
  ]);

  return <div>{/* render */}</div>;
}
```

**Revalidate all products:**

```typescript
// app/api/products/update/route.ts
import { revalidateTag } from 'next/cache';

export async function POST() {
  // Invalidate all requests tagged with 'products'
  revalidateTag('products');

  return Response.json({ revalidated: true });
}
```

**Revalidate specific product:**

```typescript
// app/api/products/[id]/update/route.ts
import { revalidateTag } from 'next/cache';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Invalidate only this product
  revalidateTag(`product-${params.id}`);

  return Response.json({ revalidated: true });
}
```

## Data Cache

Persistent server-side cache for fetch requests and database queries.

### Fetch API Caching

Control caching behavior per request:

```typescript
// Force cache (default for SSG)
fetch('https://api.example.com/data', {
  cache: 'force-cache' // Cache indefinitely
});

// No cache (always fresh)
fetch('https://api.example.com/data', {
  cache: 'no-store' // Never cache
});

// Time-based revalidation
fetch('https://api.example.com/data', {
  next: { revalidate: 60 } // Revalidate after 60 seconds
});

// Tag-based revalidation
fetch('https://api.example.com/data', {
  next: { tags: ['data'], revalidate: 3600 }
});
```

**Opt-out of caching for entire route:**

```typescript
// app/dashboard/page.tsx
export const dynamic = 'force-dynamic'; // No caching
export const revalidate = 0; // No caching

export default async function DashboardPage() {
  // All fetches default to no-store
  const data = await fetch('https://api.example.com/user-data');
  return <div>{/* render */}</div>;
}
```

### Caching Database Queries

**PREFERRED (Next.js 16+): Use `"use cache"` directive**

```typescript
// lib/db/queries.ts
import { cacheLife, cacheTag } from 'next/cache';
import { db } from './connection';

export async function getUser(id: number) {
  'use cache'; // ✅ PREFERRED: Modern caching
  cacheLife('hours');
  cacheTag('users', `user-${id}`);

  const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return user;
}

export async function getPosts(userId: number) {
  'use cache';
  cacheLife('minutes');
  cacheTag('posts', `user-${userId}-posts`);

  const posts = await db.query('SELECT * FROM posts WHERE user_id = $1', [
    userId
  ]);
  return posts;
}
```

**Fallback (older versions): Use `unstable_cache`**

```typescript
// lib/db/queries.ts
import { unstable_cache } from 'next/cache';
import { db } from './connection';

type User = {
  id: number;
  name: string;
  email: string;
};

export const getCachedUser = unstable_cache(
  async (id: number) => {
    const user = await db.query<User>('SELECT * FROM users WHERE id = $1', [
      id
    ]);
    return user;
  },
  ['user'], // Cache key
  {
    tags: ['users'],
    revalidate: 3600
  }
);

export const getCachedPosts = unstable_cache(
  async (userId: number) => {
    const posts = await db.query('SELECT * FROM posts WHERE user_id = $1', [
      userId
    ]);
    return posts;
  },
  ['posts'], // Cache key
  {
    tags: ['posts'],
    revalidate: 60
  }
);
```

### Caching GraphQL Queries with TanStack Query

**✅ PREFERRED (Next.js 16+): Colocated cached functions**

```typescript
// app/blog/[slug]/page.tsx
import { cacheLife, cacheTag } from 'next/cache';
import { getQueryClient } from '@/shared/react-query';
import { blogPostQuery, allBlogPostsQuery } from './graphql';

export const revalidate = 60; // Route-level revalidation

// ✅ Colocated cached function
async function getPostCached(slug: string) {
  'use cache'; // ✅ Cache key includes slug automatically
  cacheLife('hours');
  cacheTag('blog', 'posts', `post-${slug}`);

  const queryClient = getQueryClient();
  return await queryClient.fetchQuery(blogPostQuery({ slug }));
}

// Shared function if reused in generateStaticParams
async function getAllPostsCached() {
  'use cache';
  cacheLife('minutes');
  cacheTag('blog', 'posts');

  const queryClient = getQueryClient();
  return await queryClient.fetchQuery(allBlogPostsQuery());
}

export default async function BlogPostPage({
  params
}: {
  params: { slug: string };
}) {
  const data = await getPostCached(params.slug); // ✅ Cached with "use cache"

  return (
    <article>
      <h1>{data.post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: data.post.content }} />
    </article>
  );
}

export async function generateStaticParams() {
  const data = await getAllPostsCached();

  // Pre-generate top 50 posts at build time
  return data.posts.slice(0, 50).map((post) => ({
    slug: post.slug
  }));
}

// Allow other posts to render on-demand with ISR
export const dynamicParams = true;
```

**Alternative: Extracted functions (when reused across pages)**

```typescript
// lib/graphql/blog.ts - Only if shared across multiple pages
import { cacheLife, cacheTag } from 'next/cache';
import { getQueryClient } from '@/shared/react-query';
import { blogPostQuery, allBlogPostsQuery } from './queries';

export async function getAllPostsCached() {
  'use cache';
  cacheLife('minutes');
  cacheTag('blog', 'posts');

  const queryClient = getQueryClient();
  return await queryClient.fetchQuery(allBlogPostsQuery());
}

export async function getPostCached(slug: string) {
  'use cache';
  cacheLife('hours');
  cacheTag('blog', 'posts', `post-${slug}`);

  const queryClient = getQueryClient();
  return await queryClient.fetchQuery(blogPostQuery({ slug }));
}
```

**Fallback (older versions): Use `unstable_cache`**

```typescript
// app/blog/[slug]/page.tsx
import { unstable_cache } from 'next/cache';
import { getQueryClient } from '@/shared/react-query';
import { blogPostQuery } from './graphql';

export const revalidate = 60;

export default async function BlogPostPage({
  params
}: {
  params: { slug: string };
}) {
  // Wrap TanStack Query fetch in unstable_cache
  const getPost = unstable_cache(
    async () => {
      const queryClient = getQueryClient();
      return await queryClient.fetchQuery(
        blogPostQuery({ slug: params.slug })
      );
    },
    ['blog-post', params.slug], // ❌ Manual cache key
    {
      tags: ['blog', `post-${params.slug}`],
      revalidate: 60
    }
  );

  const data = await getPost();

  return (
    <article>
      <h1>{data.post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: data.post.content }} />
    </article>
  );
}

export async function generateStaticParams() {
  const queryClient = getQueryClient();
  const data = await queryClient.fetchQuery(allBlogPostsQuery());

  return data.posts.slice(0, 50).map((post) => ({
    slug: post.slug
  }));
}

export const dynamicParams = true;
```

**Key patterns:**

- ✅ Prefer `"use cache"` for automatic cache key generation
- Wrap `queryClient.fetchQuery()` for persistence
- Combine with `generateStaticParams` for partial SSG
- Set `dynamicParams = true` to allow on-demand rendering with caching
- Tag caches for granular revalidation

### Caching Services (with `@perimetre/service-builder`)

**✅ PREFERRED (Next.js 16+): Colocated cached service calls**

Services handle business logic and return error-as-values. Wrap service calls in cached functions colocated with the page:

```typescript
// app/posts/[id]/page.tsx
import { cacheLife, cacheTag } from 'next/cache';
import { postsService } from '@/server/services/posts';
import { db } from '@/server/lib/db';

export const revalidate = 60;

// ✅ Colocated cached service call
async function getPostCached(id: number) {
  'use cache';
  cacheLife('hours');
  cacheTag('posts', `post-${id}`);

  // Call service (which returns error-as-value)
  const result = await postsService({ db }).getById({ id });

  // Handle error-as-value pattern
  if (!('ok' in result)) {
    throw result; // Convert error to exception for caching layer
  }

  return result.post;
}

// Shared function if reused in generateStaticParams
async function getPostsCached() {
  'use cache';
  cacheLife('minutes');
  cacheTag('posts');

  const result = await postsService({ db }).getAll({});

  if (!('ok' in result)) {
    throw result;
  }

  return result.posts;
}

export async function generateStaticParams() {
  const posts = await getPostsCached();
  return posts.slice(0, 50).map((post) => ({ id: String(post.id) }));
}

export const dynamicParams = true;

export default async function PostPage({ params }: { params: { id: string } }) {
  const post = await getPostCached(parseInt(params.id)); // ✅ Cached service call

  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.body}</div>
    </article>
  );
}
```

**Alternative: Extracted functions (when reused across pages)**

```typescript
// lib/posts.ts - Only if shared across multiple pages
import { cacheLife, cacheTag } from 'next/cache';
import { postsService } from '@/server/services/posts';
import { db } from '@/server/lib/db';

export async function getPostCached(id: number) {
  'use cache';
  cacheLife('hours');
  cacheTag('posts', `post-${id}`);

  const result = await postsService({ db }).getById({ id });

  if (!('ok' in result)) {
    throw result;
  }

  return result.post;
}

export async function getPostsCached() {
  'use cache';
  cacheLife('minutes');
  cacheTag('posts');

  const result = await postsService({ db }).getAll({});

  if (!('ok' in result)) {
    throw result;
  }

  return result.posts;
}
```

**Alternative: Cache at service layer**

You can also apply caching directly in service methods:

```typescript
// server/services/posts.ts
import { defineService } from '@perimetre/service-builder';
import { cacheLife, cacheTag } from 'next/cache';
import { NotFoundError } from '@/shared/exceptions';
import { z } from 'zod';

export const postsService = defineService<{ db: Kysely<Database> }>()({
  methods: ({ method }) => ({
    getById: method
      .input(z.object({ id: z.number().int().positive() }))
      .handler(async ({ ctx, input }) => {
        'use cache'; // ✅ Cache at service level
        cacheLife('hours');
        cacheTag('posts', `post-${input.id}`);

        const post = await ctx.db
          .selectFrom('posts')
          .selectAll()
          .where('id', '=', input.id)
          .executeTakeFirst();

        if (!post) return new NotFoundError();

        return {
          ok: true as const,
          post
        };
      }),

    getAll: method.input(z.object({})).handler(async ({ ctx }) => {
      'use cache';
      cacheLife('minutes');
      cacheTag('posts');

      const posts = await ctx.db.selectFrom('posts').selectAll().execute();

      return {
        ok: true as const,
        posts
      };
    })
  })
});
```

**Revalidate service caches:**

```typescript
// app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  const secret = request.nextUrl.searchParams.get('secret');

  if (secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ message: 'Invalid secret' }, { status: 401 });
  }

  const { postId } = await request.json();

  if (postId) {
    revalidateTag(`post-${postId}`); // ✅ Invalidate specific post
  } else {
    revalidateTag('posts'); // ✅ Invalidate all posts
  }

  return Response.json({ revalidated: true });
}
```

### Caching tRPC Procedures

tRPC procedures benefit from **HTTP caching** via Cache-Control headers. See the "HTTP Cache-Control Headers" section above for tRPC-specific caching middleware.

**Key strategy for tRPC:**

1. **Service layer**: Cache expensive operations (database queries) in services using `"use cache"`
2. **tRPC layer**: Add HTTP caching headers for edge/CDN caching
3. **Route layer**: Use ISR with `revalidate` for background regeneration

```typescript
// server/services/posts.ts - Service with caching
export const postsService = defineService<{ db: Kysely<Database> }>()({
  methods: ({ method }) => ({
    getById: method
      .input(z.object({ id: z.number() }))
      .handler(async ({ ctx, input }) => {
        'use cache'; // ✅ Cache database query
        cacheLife('hours');
        cacheTag('posts', `post-${input.id}`);

        const post = await ctx.db
          .selectFrom('posts')
          .selectAll()
          .where('id', '=', input.id)
          .executeTakeFirst();

        if (!post) return new NotFoundError();
        return { ok: true as const, post };
      })
  })
});

// server/routers/posts.ts - tRPC router with HTTP caching
import { cacheMiddleware, ONE_HOUR } from './middlewares/cache';

export const postsRouter = router({
  getById: procedure
    .use(cacheMiddleware(60, ONE_HOUR)) // ✅ HTTP cache headers
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const result = await postsService({ db }).getById({ id: input.id });
      if (!('ok' in result)) throw result;
      return result.post;
    })
});

// app/posts/[id]/page.tsx - Server Component with ISR
import { getServerTrpc } from '@/server/lib/trpc';

export const revalidate = 60; // ✅ ISR revalidation

export default async function PostPage({ params }: { params: { id: string } }) {
  const { trpc, HydrateClient } = await getServerTrpc();

  // Prefetch on server (uses all cache layers)
  await trpc.posts.getById.prefetch({ id: parseInt(params.id) });

  return (
    <HydrateClient>
      <PostDetail id={params.id} />
    </HydrateClient>
  );
}
```

**Three-layer caching for tRPC:**

1. **Data layer**: `"use cache"` in services → caches database/API calls
2. **HTTP layer**: Cache-Control headers → edge/CDN caching
3. **Route layer**: ISR `revalidate` → background regeneration

This combines the best of all caching strategies for maximum performance.

**Usage:**

```typescript
// app/users/[id]/page.tsx
import { getCachedUser, getCachedPosts } from '@/lib/db/queries';

export default async function UserPage({ params }: { params: { id: string } }) {
  const userId = parseInt(params.id);
  const [user, posts] = await Promise.all([
    getCachedUser(userId),
    getCachedPosts(userId)
  ]);

  return (
    <div>
      <h1>{user.name}</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

**Revalidate database cache:**

```typescript
// app/api/users/[id]/update/route.ts
import { revalidateTag } from 'next/cache';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Update user in database
  await db.query('UPDATE users SET name = $1 WHERE id = $2', [
    'New Name',
    params.id
  ]);

  // Invalidate cache
  revalidateTag('users');

  return Response.json({ updated: true });
}
```

**Important:** Don't use dynamic APIs (`headers()`, `cookies()`) inside cached functions. Pass dynamic data as arguments:

```typescript
// ❌ WRONG: Dynamic API inside cached function
const getCachedData = unstable_cache(async () => {
  const headersList = await headers(); // Error: Can't use headers() in cached scope
  return fetch('https://api.example.com/data');
});

// ✅ CORRECT: Pass dynamic data as argument
const getCachedData = unstable_cache(
  async (authToken: string) => {
    return fetch('https://api.example.com/data', {
      headers: { Authorization: authToken }
    });
  },
  ['data']
);

// Usage
const headersList = await headers();
const authToken = headersList.get('authorization') || '';
const data = await getCachedData(authToken);
```

## Request Memoization

Automatic deduplication of identical fetch requests within a single render pass.

```typescript
// app/posts/[id]/page.tsx
async function getPost(id: string) {
  console.log('Fetching post:', id);
  const response = await fetch(`https://api.example.com/posts/${id}`);
  return response.json();
}

export default async function PostPage({ params }: { params: { id: string } }) {
  // Multiple components call getPost with same ID
  const post1 = await getPost(params.id);
  const post2 = await getPost(params.id); // Memoized - no actual fetch
  const post3 = await getPost(params.id); // Memoized - no actual fetch

  // Only ONE fetch occurs (logs "Fetching post" once)
  return <div>{post1.title}</div>;
}
```

**How it works:**

- Next.js automatically memoizes fetch requests with same URL and options
- Works within a single render pass (one request/response cycle)
- Applies to both Server Components and Route Handlers
- No configuration needed - automatic optimization

**Use React `cache()` for non-fetch functions:**

```typescript
// lib/db/queries.ts
import { cache } from 'react';
import { db } from './connection';

// Memoize database queries
export const getUser = cache(async (id: number) => {
  console.log('Querying user:', id);
  return await db.query('SELECT * FROM users WHERE id = $1', [id]);
});

export const getUserPosts = cache(async (userId: number) => {
  console.log('Querying posts for user:', userId);
  return await db.query('SELECT * FROM posts WHERE user_id = $1', [userId]);
});
```

**Usage:**

```typescript
// app/users/[id]/page.tsx
import { getUser, getUserPosts } from '@/lib/db/queries';

async function UserProfile({ id }: { id: number }) {
  const user = await getUser(id); // First call - executes query
  return <div>{user.name}</div>;
}

async function UserStats({ id }: { id: number }) {
  const user = await getUser(id); // Memoized - no query
  const posts = await getUserPosts(id);
  return <div>{posts.length} posts</div>;
}

export default async function UserPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);

  return (
    <>
      <UserProfile id={id} />
      <UserStats id={id} />
    </>
  );
}
```

## HTTP Cache-Control Headers

Control edge and browser caching with Cache-Control headers in API routes and Route Handlers.

### Stale-While-Revalidate Pattern

```typescript
// app/api/posts/route.ts
export async function GET(request: Request) {
  const posts = await fetch('https://api.example.com/posts').then((r) =>
    r.json()
  );

  return Response.json(posts, {
    headers: {
      // s-maxage: How long edge caches the response
      // stale-while-revalidate: How long to serve stale content during revalidation
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
    }
  });
}
```

**How stale-while-revalidate works:**

1. First 60 seconds: Edge serves cached response immediately
2. After 60 seconds: Edge serves stale cached response while fetching fresh data in background
3. For next 120 seconds: Continue serving stale content during revalidation
4. After 180 seconds total: If revalidation hasn't completed, fetch fresh data

### tRPC with HTTP Caching

Implement caching middleware for tRPC procedures:

```typescript
// server/routers/middlewares/cache.ts
import { middleware } from '..';

export type CacheMeta = {
  cache:
    | { enabled: false }
    | { enabled: true; maxAge: number; staleWhileRevalidate: number };
};

export const cacheMiddleware = (maxAge: number, staleWhileRevalidate: number) =>
  middleware(async ({ next }) => {
    return await next({
      ctx: {
        cache: {
          enabled: true as const,
          maxAge,
          staleWhileRevalidate
        }
      }
    });
  });

export const noCacheMiddleware = middleware(async ({ next }) => {
  return await next({
    ctx: {
      cache: { enabled: false as const }
    }
  });
});

// Constants for reuse
export const ONE_HOUR = 60 * 60;
export const ONE_DAY = 24 * ONE_HOUR;
```

**Usage in tRPC router:**

```typescript
// server/routers/posts.ts
import {
  cacheMiddleware,
  noCacheMiddleware,
  ONE_HOUR
} from './middlewares/cache';

export const postsRouter = router({
  // Default caching (s-maxage=1, stale-while-revalidate=120)
  getAll: procedure.query(async () => {
    const result = await postsService({}).getAll({});
    if (!('ok' in result)) throw result;
    return result.posts;
  }),

  // Custom cache duration
  getById: procedure
    .use(cacheMiddleware(60, ONE_HOUR)) // Cache for 1 minute, stale for 1 hour
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const result = await postsService({}).getById({ id: input.id });
      if (!('ok' in result)) throw result;
      return result.post;
    }),

  // Opt out of caching (user-specific data)
  getUserPosts: procedure.use(noCacheMiddleware).query(async ({ ctx }) => {
    const result = await postsService({}).getByUserId({ userId: ctx.userId });
    if (!('ok' in result)) throw result;
    return result.posts;
  })
});
```

**Apply cache headers in tRPC handler:**

```typescript
// app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { CacheMeta } from '@/server/routers/middlewares/cache';

export async function GET(request: Request) {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext,
    onError({ error, type, path, ctx }) {
      console.error(`[tRPC] ${type} ${path} error:`, error);
    },
    responseMeta(opts) {
      const { ctx, type } = opts;

      // Only cache queries (not mutations)
      if (type !== 'query') {
        return {
          headers: { 'Cache-Control': 'no-store' }
        };
      }

      // Get cache metadata from context
      const cache = (ctx as { cache?: CacheMeta['cache'] })?.cache;

      if (!cache || !cache.enabled) {
        return {
          headers: { 'Cache-Control': 'no-store' }
        };
      }

      return {
        headers: {
          'Cache-Control': `public, s-maxage=${cache.maxAge}, stale-while-revalidate=${cache.staleWhileRevalidate}`
        }
      };
    }
  });
}

export { GET as POST };
```

## Router Cache (Client-Side)

Client-side in-memory cache for visited routes. Persists during user session.

**Default behavior:**

- Static routes: Cached for 5 minutes
- Dynamic routes: Not cached (unless configured)
- Cleared on page refresh

**Prefetching:**

```typescript
// app/page.tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      {/* Automatic prefetch when link enters viewport */}
      <Link href="/posts">Posts</Link>

      {/* Disable prefetch */}
      <Link href="/admin" prefetch={false}>
        Admin
      </Link>
    </>
  );
}
```

**Manual cache invalidation:**

```typescript
'use client';
import { useRouter } from 'next/navigation';

export default function RefreshButton() {
  const router = useRouter();

  const handleRefresh = () => {
    // Invalidate Router Cache and refetch current route
    router.refresh();
  };

  return <button onClick={handleRefresh}>Refresh</button>;
}
```

**Configure stale times:**

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30, // Cache dynamic routes for 30 seconds
      static: 180 // Cache static routes for 3 minutes
    }
  }
};

export default config;
```

## Lazy Loading

Defer loading of components and libraries to reduce initial bundle size.

### Dynamic Imports with next/dynamic

```typescript
// app/page.tsx
import dynamic from 'next/dynamic';

// Lazy load component
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false // Disable server-side rendering
});

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <HeavyChart />
    </div>
  );
}
```

### Conditional Lazy Loading

Load components only when needed:

```typescript
'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';

// Only loads when modal is opened
const Modal = dynamic(() => import('@/components/Modal'));

export default function Page() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>Open Modal</button>
      {showModal && <Modal onClose={() => setShowModal(false)} />}
    </>
  );
}
```

### Lazy Load Libraries

Defer loading heavy dependencies:

```typescript
'use client';
import { useState } from 'react';

export default function SearchPage() {
  const [results, setResults] = useState([]);

  const handleSearch = async (query: string) => {
    // Only load fuse.js when user searches
    const Fuse = (await import('fuse.js')).default;

    const fuse = new Fuse(data, { keys: ['title'] });
    setResults(fuse.search(query));
  };

  return <input onChange={(e) => handleSearch(e.target.value)} />;
}
```

### Named Exports

Lazy load specific exports:

```typescript
import dynamic from 'next/dynamic';

const ComponentA = dynamic(() =>
  import('@/components/shared').then((mod) => mod.ComponentA)
);
```

## Production Optimization Patterns

### Preloading Pattern

Eagerly initiate data fetching without blocking render:

```typescript
// app/posts/[id]/page.tsx
async function getPost(id: string) {
  const response = await fetch(`https://api.example.com/posts/${id}`, {
    next: { revalidate: 3600 }
  });
  return response.json();
}

async function getComments(postId: string) {
  const response = await fetch(`https://api.example.com/comments?postId=${postId}`, {
    next: { revalidate: 60 }
  });
  return response.json();
}

export default async function PostPage({ params }: { params: { id: string } }) {
  // Preload: Start fetching immediately without awaiting
  void getComments(params.id);

  // Fetch post and wait for it
  const post = await getPost(params.id);

  // Comments are already loading in background
  // Now await the preloaded request
  const comments = await getComments(params.id);

  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
      <section>
        <h2>Comments</h2>
        {comments.map((comment) => (
          <div key={comment.id}>{comment.text}</div>
        ))}
      </section>
    </article>
  );
}
```

**How it works:**

- `void getComments(params.id)` starts fetch without blocking
- Post fetch completes first
- When we `await getComments()`, it's already in progress or complete
- Reduces total wait time compared to sequential fetching

### Parallel Data Fetching

Fetch multiple resources simultaneously:

```typescript
// app/posts/[id]/page.tsx
export default async function PostPage({ params }: { params: { id: string } }) {
  // ✅ Parallel fetching (fast)
  const [post, author, comments] = await Promise.all([
    fetch(`https://api.example.com/posts/${params.id}`).then((r) => r.json()),
    fetch(`https://api.example.com/authors/${params.id}`).then((r) => r.json()),
    fetch(`https://api.example.com/comments?postId=${params.id}`).then((r) =>
      r.json()
    )
  ]);

  return <div>{/* render */}</div>;
}

// ❌ Sequential fetching (slow)
// const post = await fetch(...);
// const author = await fetch(...); // Waits for post
// const comments = await fetch(...); // Waits for author
```

### Streaming with Suspense

Stream page content as it loads:

```typescript
// app/posts/page.tsx
import { Suspense } from 'react';

async function PostsList() {
  // Slow query
  const posts = await fetch('https://api.example.com/posts').then((r) => r.json());

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}

export default function PostsPage() {
  return (
    <div>
      <h1>Posts</h1>

      {/* Stream posts while showing loading state */}
      <Suspense fallback={<div>Loading posts...</div>}>
        <PostsList />
      </Suspense>
    </div>
  );
}
```

### Avoid Blocking Dynamic APIs

Wrap dynamic operations in Suspense to prevent entire route from becoming dynamic:

```typescript
// app/page.tsx
import { Suspense } from 'react';
import { cookies } from 'next/headers';

// Dynamic component
async function UserGreeting() {
  const cookieStore = await cookies();
  const user = cookieStore.get('user')?.value;

  return <div>Hello, {user || 'Guest'}!</div>;
}

// Static component
async function StaticContent() {
  const posts = await fetch('https://api.example.com/posts', {
    next: { revalidate: 3600 }
  }).then((r) => r.json());

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}

export default function HomePage() {
  return (
    <>
      {/* Dynamic greeting doesn't block static content */}
      <Suspense fallback={<div>Loading...</div>}>
        <UserGreeting />
      </Suspense>

      {/* This remains statically generated */}
      <StaticContent />
    </>
  );
}
```

### Image Optimization

Use Next.js Image component for automatic optimization:

```typescript
// app/posts/[id]/page.tsx
import Image from 'next/image';

export default async function PostPage({ params }: { params: { id: string } }) {
  const post = await fetch(`https://api.example.com/posts/${params.id}`).then((r) =>
    r.json()
  );

  return (
    <article>
      <h1>{post.title}</h1>

      {/* Automatic optimization: WebP/AVIF, lazy loading, size optimization */}
      <Image
        src={post.coverImage}
        alt={post.title}
        width={800}
        height={400}
        priority={false} // Lazy load by default
      />

      <div>{post.content}</div>
    </article>
  );
}
```

### Font Optimization

Use Next.js Font module to automatically optimize web fonts:

```typescript
// app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap' // Improve performance
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap'
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

## Common Patterns

### Blog with SSG + ISR (Recommended Pattern)

**✅ This example demonstrates the PREFERRED approach:** SSG + ISR with time-based + webhook revalidation.

```typescript
// app/blog/page.tsx
export const revalidate = 60; // ✅ Time-based revalidation

async function getPosts() {
  const response = await fetch('https://cms.example.com/posts', {
    next: { tags: ['posts'] }
  });
  return response.json();
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </li>
      ))}
    </ul>
  );
}

// app/blog/[slug]/page.tsx
export const revalidate = 60; // ✅ Time-based revalidation

export async function generateStaticParams() {
  const posts = await fetch('https://cms.example.com/posts').then((r) => r.json());
  // ✅ Pre-generate top 50 posts at build time
  return posts.slice(0, 50).map((post) => ({ slug: post.slug }));
}

// ✅ Allow on-demand generation for other posts
export const dynamicParams = true;

export default async function BlogPostPage({
  params
}: {
  params: { slug: string };
}) {
  const post = await fetch(`https://cms.example.com/posts/${params.slug}`, {
    // ✅ Tag for webhook-based revalidation
    next: { tags: ['posts', `post-${params.slug}`] }
  }).then((r) => r.json());

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}

// ✅ Webhook endpoint for instant CMS updates
// app/api/revalidate/route.ts
export async function POST(request: Request) {
  const secret = request.nextUrl.searchParams.get('secret');

  if (secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ message: 'Invalid secret' }, { status: 401 });
  }

  const { slug } = await request.json();

  if (slug) {
    revalidateTag(`post-${slug}`); // ✅ Instant update for specific post
  } else {
    revalidateTag('posts'); // ✅ Update all posts
  }

  return Response.json({ revalidated: true });
}
```

### E-commerce Product Catalog

```typescript
// app/products/page.tsx
export const revalidate = 300; // 5 minutes

async function getProducts() {
  const response = await fetch('https://api.example.com/products', {
    next: { tags: ['products'] }
  });
  return response.json();
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="grid grid-cols-4 gap-4">
      {products.map((product) => (
        <Link key={product.id} href={`/products/${product.slug}`}>
          <Image src={product.image} alt={product.name} width={300} height={300} />
          <h3>{product.name}</h3>
          <p>${product.price}</p>
        </Link>
      ))}
    </div>
  );
}

// app/products/[slug]/page.tsx
export async function generateStaticParams() {
  // Pre-render popular products
  const products = await fetch(
    'https://api.example.com/products/popular?limit=100'
  ).then((r) => r.json());

  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({
  params
}: {
  params: { slug: string };
}) {
  const product = await fetch(
    `https://api.example.com/products/${params.slug}`,
    {
      next: { tags: [`product-${params.slug}`], revalidate: 300 }
    }
  ).then((r) => r.json());

  return (
    <div>
      <Image src={product.image} alt={product.name} width={800} height={800} />
      <h1>{product.name}</h1>
      <p>${product.price}</p>
      <p>{product.description}</p>
    </div>
  );
}
```

### Real-Time Dashboard (No Caching)

```typescript
// app/dashboard/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { cookies } from 'next/headers';

async function getUserData(userId: string) {
  // Always fresh - no cache
  const response = await fetch(`https://api.example.com/users/${userId}/stats`, {
    cache: 'no-store'
  });
  return response.json();
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    return <div>Please log in</div>;
  }

  const data = await getUserData(userId);

  return (
    <div>
      <h1>Dashboard</h1>
      <div>Views: {data.views}</div>
      <div>Clicks: {data.clicks}</div>
    </div>
  );
}
```

## Best Practices

### DO ✅

- **ALWAYS use SSG + ISR** for content-driven sites (mandatory)
- **Use `"use cache"` directive** for caching (Next.js 16+) - preferred over `unstable_cache`
- **Colocate cached functions** with page components in `page.tsx` when page-specific
- **Extract cached functions** to separate files only when reused across multiple pages
- **Use descriptive naming**: `getDataCached`, `getUserCached`, `getPostsCached` to indicate caching
- **Combine time-based + webhook revalidation** for optimal freshness
- Enable `cacheComponents: true` in next.config.ts to use `"use cache"`
- Use `cacheLife('hours')` and `cacheTag('resource', 'resource-id')` with `"use cache"`
- Use `revalidate: 60` (or appropriate interval) for time-based updates
- Implement CMS webhook to `/api/revalidate` for instant updates
- Use `generateStaticParams()` to pre-render popular routes at build time
- Set `dynamicParams: true` to allow on-demand generation with ISR
- Prefetch data in Server Components with `prefetchQuery()`
- Use `Promise.all()` for parallel data fetching
- Wrap dynamic APIs in `<Suspense>` to avoid blocking static content
- Set longer revalidation times for stable content (minutes to hours)
- Use React `cache()` for request-level memoization of non-fetch functions

### DON'T ❌

- **NEVER use pure SSG without ISR** for content sites
- **NEVER use static export** unless you have no other option
- Don't use `unstable_cache` if you have Next.js 16+ (use `"use cache"` instead)
- Don't use `cache: 'no-store'` unless absolutely necessary (user-specific data only)
- Don't skip implementing CMS webhooks for revalidation
- Don't set very short revalidation times (< 10 seconds causes excessive regeneration)
- Don't pre-generate ALL routes if you have thousands (use partial SSG)
- Don't fetch data sequentially when parallel fetching is possible
- Don't use dynamic APIs (`cookies`, `headers`) in statically rendered routes
- Don't use dynamic APIs inside cached functions (`"use cache"` or `unstable_cache`)
- Don't forget to handle errors in fetch requests
- Don't skip `loading.tsx` or `Suspense` for slow data fetching
- Don't use client-side data fetching when server-side is possible
- Don't manually manage cache keys when using `"use cache"` (it's automatic)

## Debugging Cache Behavior

Check if routes are static or dynamic during build:

```bash
npm run build
```

Look for output:

- `○` (Static) - Pre-rendered as static HTML
- `●` (SSG) - Pre-rendered with `getStaticProps` or `generateStaticParams`
- `λ` (Dynamic) - Server-rendered on-demand
- `ISR` - Uses ISR (revalidate)

**Check cache headers:**

```typescript
// app/api/test/route.ts
export async function GET() {
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 60 }
  });

  const json = await data.json();

  return Response.json(json, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
    }
  });
}
```

## Static Export (Last Resort Only)

**⚠️ WARNING:** Static export should only be used as a last resort when you cannot use a Node.js server. It disables many Next.js features.

### What You Lose with Static Export

- ❌ **No ISR** - Cannot revalidate content automatically
- ❌ **No Server Components** - All components must be client-side
- ❌ **No Dynamic Routes** - Must pre-generate all routes at build time
- ❌ **No API Routes** - Cannot have server-side API endpoints
- ❌ **No Image Optimization** - Images not optimized by Next.js
- ❌ **No Middleware** - Cannot use Next.js middleware
- ❌ **No Headers/Cookies** - Cannot access server-side headers or cookies
- ❌ **Manual Rebuilds** - Must rebuild entire site for any content update

### When to Use Static Export

Only use static export when:

- Deploying to static hosting without Node.js (GitHub Pages, S3, etc.)
- Content NEVER changes after build
- You cannot use a proper Next.js hosting provider (Vercel, AWS Amplify, Netlify, etc.)

### Configuration

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'export', // ⚠️ Enables static export mode
  images: {
    unoptimized: true // Required for static export
  }
};

export default config;
```

### Basic Example

```typescript
// app/posts/[id]/page.tsx
type Post = {
  id: string;
  title: string;
  content: string;
};

// Must pre-generate ALL routes at build time
export async function generateStaticParams() {
  const response = await fetch('https://api.example.com/posts');
  const posts = await response.json();

  // MUST return ALL possible IDs - no on-demand generation
  return posts.map((post: Post) => ({
    id: post.id
  }));
}

// Prevent 404 for unlisted routes (strict mode)
export const dynamicParams = false;

export default function PostPage({ params }: { params: { id: string } }) {
  // Cannot fetch data here - must be pre-fetched at build time
  return <div>Post {params.id}</div>;
}
```

### Build and Deploy

```bash
# Build static site
npm run build

# Output directory: out/
# Upload out/ directory to static hosting
```

### Why Not to Use Static Export

**Use SSG + ISR instead:**

```typescript
// ✅ PREFERRED: SSG + ISR (flexible, fast, fresh)
export const revalidate = 60;
export const dynamicParams = true;

// ❌ AVOID: Static export (rigid, stale, limited)
// output: 'export'
```

**Comparison:**

| Feature                | SSG + ISR      | Static Export     |
| ---------------------- | -------------- | ----------------- |
| Build time generation  | ✅             | ✅                |
| On-demand generation   | ✅             | ❌                |
| Automatic revalidation | ✅             | ❌                |
| CMS webhook updates    | ✅             | ❌                |
| Server Components      | ✅             | ❌                |
| API Routes             | ✅             | ❌                |
| Image optimization     | ✅             | ❌                |
| Content freshness      | ✅ Automatic   | ❌ Manual rebuild |
| Hosting cost           | $ (serverless) | $ (static)        |

**Bottom line:** Static export is almost never the right choice. Use SSG + ISR unless you have no other option.

## Resources

- **"use cache" Directive (Next.js 16+)**: https://nextjs.org/docs/app/api-reference/directives/use-cache
- **Cache Components Config**: https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents
- **Next.js 16 Blog Post**: https://nextjs.org/blog/next-16#cache-components
- **Official Caching Docs**: https://nextjs.org/docs/app/guides/caching
- **ISR Guide**: https://nextjs.org/docs/app/guides/incremental-static-regeneration
- **Lazy Loading**: https://nextjs.org/docs/app/guides/lazy-loading
- **Production Checklist**: https://nextjs.org/docs/app/guides/production-checklist
- **Static Export**: https://nextjs.org/docs/app/building-your-application/deploying/static-exports

## Quick Reference

```typescript
// ✅ PREFERRED: Enable "use cache" directive (Next.js 16+)
// next.config.ts
const config: NextConfig = {
  cacheComponents: true
};

// ✅ PREFERRED: SSG + ISR with colocated "use cache" directive
// app/blog/[slug]/page.tsx
import { cacheLife, cacheTag } from 'next/cache';

export const revalidate = 60; // Time-based revalidation
export const dynamicParams = true; // Allow on-demand generation

// ✅ Colocated cached function (preferred)
async function getDataCached(slug: string) {
  'use cache'; // ✅ Modern caching (automatic cache keys)
  cacheLife('hours'); // Built-in lifecycle
  cacheTag('resource', `resource-${slug}`); // Tag for invalidation

  return await queryClient.fetchQuery(query({ slug }));
}

export async function generateStaticParams() {
  // Pre-generate popular routes
  return posts.slice(0, 50).map((post) => ({ slug: post.slug }));
}

export default async function Page({ params }) {
  const data = await getDataCached(params.slug); // ✅ Cached automatically
  return <div>{data.title}</div>;
}

// Alternative: Extract to lib/ only if reused across pages
// lib/data.ts
export async function getDataCached(slug: string) {
  'use cache';
  cacheLife('hours');
  cacheTag('resource', `resource-${slug}`);
  return await queryClient.fetchQuery(query({ slug }));
}

// Webhook endpoint for instant updates
// app/api/revalidate/route.ts
export async function POST(request) {
  const { slug } = await request.json();
  revalidateTag(`resource-${slug}`); // Instant update
  return Response.json({ revalidated: true });
}

// ⚠️ FALLBACK: unstable_cache (older Next.js versions)
import { unstable_cache } from 'next/cache';

const getCached = unstable_cache(
  async (id) => db.query(...),
  ['key', id], // ❌ Manual cache key
  { tags: ['users', `user-${id}`], revalidate: 60 }
);

// Request memoization (per-request deduplication)
import { cache } from 'react';
const getUser = cache(async (id) => db.query(...));

// Parallel data fetching
const [data1, data2] = await Promise.all([fetch(url1), fetch(url2)]);

// Lazy loading
const Component = dynamic(() => import('./Component'), { ssr: false });

// Streaming with Suspense
<Suspense fallback={<Loading />}>
  <AsyncComponent />
</Suspense>

// ⚠️ Dynamic rendering (user-specific data only)
export const dynamic = 'force-dynamic';
fetch(url, { cache: 'no-store' });

// ❌ AVOID: Static export (last resort only)
// output: 'export' in next.config.ts
```
