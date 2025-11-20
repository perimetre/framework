# Next.js SEO, Lighthouse & Technical Optimization

**Purpose**: LLM-focused guide for implementing production-ready SEO in Next.js applications. Covers Core Web Vitals, metadata management, structured data, and optimization for both traditional search engines and AI-powered search.

**Target**: Next.js 15+ with App Router (modern, server-first approach)

## Quick Reference

**Core Concepts:**

- **Metadata API** - Type-safe, component-level SEO configuration
- **Core Web Vitals** - LCP, INP, CLS (actual ranking factors)
- **Structured Data** - JSON-LD for rich snippets and AI search
- **Performance** - Real-user field data (CrUX) affects rankings, not Lighthouse scores
- **AI Search** - Semantic HTML, SSR/SSG, and concept ownership matter

**Key Resources:**

- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Vercel Core Web Vitals](https://vercel.com/blog/how-core-web-vitals-affect-seo)
- [Next.js SEO Playbook](https://vercel.com/blog/nextjs-seo-playbook)

---

## Table of Contents

1. [Core Web Vitals & Performance](#core-web-vitals--performance)
2. [Metadata API](#metadata-api)
3. [Canonical URLs & Duplicate Content](#canonical-urls--duplicate-content)
4. [Sitemap & Robots.txt](#sitemap--robotstxt)
5. [Structured Data](#structured-data)
6. [Performance Optimization](#performance-optimization)
7. [AI & LLM Search Optimization](#ai--llm-search-optimization)
8. [Technical SEO Checklist](#technical-seo-checklist)
9. [Monitoring & Tools](#monitoring--tools)

---

## Core Web Vitals & Performance

### Critical Insight

**Google only considers Core Web Vitals field data (CrUX) for rankings, NOT Lighthouse scores.** Lighthouse is diagnostic; real-user data from Chrome over 28 days (P75) determines rankings.

### The Three Metrics

```typescript
// Target values for Core Web Vitals
const CORE_WEB_VITALS = {
  LCP: '< 2.5s', // Largest Contentful Paint (loading)
  INP: '< 200ms', // Interaction to Next Paint (responsiveness, replaced FID in March 2024)
  CLS: '< 0.1' // Cumulative Layout Shift (visual stability)
} as const;
```

**Measurement**:

- Data collected from Chrome users only (no iPhone users)
- 28-day sliding window at P75 (75th percentile)
- Use Vercel Speed Insights or Google Search Console for real-time monitoring

### Next.js Built-in Optimizations

Next.js automatically handles many Core Web Vitals optimizations:

1. **Automatic Image Optimization** - `next/image` reduces LCP
2. **Font Optimization** - `next/font` prevents CLS
3. **Code Splitting** - Automatic per-route, improves INP
4. **Script Optimization** - `next/script` with strategy prop
5. **Static Generation** - Pre-rendered HTML improves all metrics

---

## Metadata API

### Static Metadata

```typescript
// app/layout.tsx or app/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Default Title',
  description: 'Default description (150-160 chars for optimal SERP display)',

  // Open Graph (auto-generates Twitter cards in Next.js 15+)
  openGraph: {
    title: 'OG Title',
    description: 'OG Description',
    url: 'https://example.com',
    siteName: 'Site Name',
    images: [
      {
        url: 'https://example.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'OG Image Alt'
      }
    ],
    locale: 'en_US',
    type: 'website'
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },

  // Verification
  verification: {
    google: 'google-site-verification-code',
    yandex: 'yandex-verification-code'
  }
};
```

### Dynamic Metadata

```typescript
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next';

interface PageProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  // Fetch data
  const post = await getPost(params.slug);

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      images: [{ url: post.coverImage }]
    }
    // Twitter cards auto-generated from openGraph
  };
}
```

### Metadata Template (Parent Layout)

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'), // Critical for absolute URLs
  title: {
    template: '%s | Site Name', // %s replaced by child title
    default: 'Site Name - Tagline'
  },
  description: 'Default description'
};

// app/blog/page.tsx
export const metadata: Metadata = {
  title: 'Blog' // Becomes "Blog | Site Name"
};
```

### SEO Best Practices for Metadata

- **Title**: 50-60 characters (truncated at ~600px)
- **Description**: 150-160 characters for optimal SERP display
- **Keywords**: NOT used by Google (ignore `keywords` meta tag)
- **OG Images**: 1200x630px (1.91:1 ratio)
- **Canonical URLs**: Use `metadataBase` + `alternates.canonical`

```typescript
export const metadata: Metadata = {
  alternates: {
    canonical: '/blog/post-slug', // Relative to metadataBase
    languages: {
      'en-US': '/en/blog/post-slug',
      'es-ES': '/es/blog/post-slug'
    }
  }
};
```

---

## Canonical URLs & Duplicate Content

### Why Canonical URLs Matter

**Problem**: Multiple URLs can serve the same content, causing search engines to:

- Split ranking signals across duplicate pages (diluting SEO value)
- Index the wrong version of your page
- Penalize your site for duplicate content

**Common duplicate content scenarios:**

- HTTPS vs HTTP (`https://example.com` vs `http://example.com`)
- WWW vs non-WWW (`www.example.com` vs `example.com`)
- Trailing slashes (`/blog` vs `/blog/`)
- Query parameters (`/product?id=123` vs `/product/123`)
- Multiple domain names (staging, CDN, aliases)
- Pagination (`/blog?page=1` vs `/blog`)
- Session IDs in URLs (`/page?sessionid=abc123`)
- Print versions (`/article` vs `/article?print=true`)
- URL case sensitivity (`/Blog` vs `/blog` - not an issue in Next.js)

### Setting Canonical URLs in Next.js

```typescript
// app/layout.tsx - Set metadataBase (required!)
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com') // No www, no trailing slash
  // This is the base URL for all relative paths
};
```

#### Static Canonical URL

```typescript
// app/blog/page.tsx
export const metadata: Metadata = {
  alternates: {
    canonical: '/blog' // Relative to metadataBase
  }
};

// Renders: <link rel="canonical" href="https://example.com/blog" />
```

#### Dynamic Canonical URL

```typescript
// app/blog/[slug]/page.tsx
interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  return {
    alternates: {
      canonical: `/blog/${params.slug}`
    }
  };
}

// Renders: <link rel="canonical" href="https://example.com/blog/post-slug" />
```

#### Handling Query Parameters

```typescript
// app/products/[id]/page.tsx
interface PageProps {
  params: { id: string };
  searchParams: { variant?: string; ref?: string };
}

export async function generateMetadata({
  params,
  searchParams
}: PageProps): Promise<Metadata> {
  // ALWAYS canonicalize to URL without query params (unless params change content)
  return {
    alternates: {
      canonical: `/products/${params.id}` // Ignore variant, ref params
    }
  };
}

// All these URLs canonicalize to /products/123:
// - /products/123
// - /products/123?variant=blue
// - /products/123?ref=twitter
// - /products/123?variant=blue&ref=twitter
```

**Exception**: If query parameters change content significantly, include them in canonical:

```typescript
// app/search/page.tsx
export async function generateMetadata({
  searchParams
}: {
  searchParams: { q?: string };
}): Promise<Metadata> {
  const query = searchParams.q;

  if (query) {
    // Search results are unique per query
    return {
      alternates: {
        canonical: `/search?q=${encodeURIComponent(query)}`
      }
    };
  }

  // Empty search page
  return {
    alternates: {
      canonical: '/search'
    }
  };
}
```

### Pagination & Canonical URLs

```typescript
// app/blog/page.tsx
export async function generateMetadata({
  searchParams
}: {
  searchParams: { page?: string };
}): Promise<Metadata> {
  const page = parseInt(searchParams.page || '1', 10);

  if (page === 1) {
    // Page 1 is the canonical version (not /blog?page=1)
    return {
      alternates: {
        canonical: '/blog'
      }
    };
  }

  // Subsequent pages have their own canonical
  return {
    alternates: {
      canonical: `/blog?page=${page}`
    }
  };
}
```

**Add rel="prev" and rel="next" for pagination** (deprecated by Google in 2019, but still useful for other search engines):

```tsx
// app/blog/page.tsx
export default function BlogPage({
  searchParams
}: {
  searchParams: { page?: string };
}) {
  const page = parseInt(searchParams.page || '1', 10);
  const totalPages = 10; // From your data

  return (
    <>
      {/* Manual head tags for prev/next */}
      {page > 1 && (
        <link
          rel="prev"
          href={page === 2 ? '/blog' : `/blog?page=${page - 1}`}
        />
      )}
      {page < totalPages && <link rel="next" href={`/blog?page=${page + 1}`} />}

      {/* Page content */}
    </>
  );
}
```

### Cross-Domain Canonical URLs

**Scenario**: Content syndicated across multiple domains, or staging/development sites.

```typescript
// Staging site: https://staging.example.com
// Production site: https://example.com

// app/blog/[slug]/page.tsx on staging
export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  // Point to production as canonical
  return {
    alternates: {
      canonical: `https://example.com/blog/${params.slug}` // Absolute URL
    }
  };
}
```

**Use cases**:

- Staging/dev environments → production
- Syndicated content → original source
- AMP pages → standard HTML version
- Mobile subdomains (`m.example.com`) → main site
- CDN URLs → origin URLs

### Language & Regional Variants (hreflang)

```typescript
// app/[lang]/blog/[slug]/page.tsx
interface PageProps {
  params: { lang: string; slug: string };
}

export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  return {
    alternates: {
      canonical: `/${params.lang}/blog/${params.slug}`,
      languages: {
        'en-US': `/en/blog/${params.slug}`,
        'es-ES': `/es/blog/${params.slug}`,
        'fr-FR': `/fr/blog/${params.slug}`,
        'x-default': `/en/blog/${params.slug}` // Fallback
      }
    }
  };
}

// Renders:
// <link rel="canonical" href="https://example.com/en/blog/post-slug" />
// <link rel="alternate" hreflang="en-US" href="https://example.com/en/blog/post-slug" />
// <link rel="alternate" hreflang="es-ES" href="https://example.com/es/blog/post-slug" />
// <link rel="alternate" hreflang="fr-FR" href="https://example.com/fr/blog/post-slug" />
// <link rel="alternate" hreflang="x-default" href="https://example.com/en/blog/post-slug" />
```

**Key principles**:

- `x-default` is the fallback for unmatched languages
- Each language version should reference all other versions (including itself)
- Use language-region codes (`en-US`, not just `en`) for best results
- Self-referencing is required (page links to itself in hreflang)

### Server-Side Redirects for Duplicate URLs

```typescript
// middleware.ts - Handle trailing slashes, www, and other duplicates
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Remove trailing slash (except for homepage)
  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
    return NextResponse.redirect(url, 301); // Permanent redirect
  }

  // Enforce HTTPS
  if (url.protocol === 'http:' && !url.hostname.includes('localhost')) {
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301);
  }

  // Enforce non-www (or enforce www, pick one)
  if (url.hostname.startsWith('www.')) {
    url.hostname = url.hostname.replace('www.', '');
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
};
```

### Handling URL Parameters for Tracking

```typescript
// middleware.ts - Strip tracking parameters
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // List of tracking parameters to strip
  const trackingParams = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'ref',
    'fbclid',
    'gclid'
  ];

  let hasTrackingParams = false;

  trackingParams.forEach((param) => {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      hasTrackingParams = true;
    }
  });

  // Redirect to clean URL
  if (hasTrackingParams) {
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}
```

**Alternative approach** (preserve params for analytics, but canonicalize in metadata):

```typescript
// app/page.tsx
export async function generateMetadata({
  searchParams
}: {
  searchParams: Record<string, string>;
}): Promise<Metadata> {
  // Canonical always points to clean URL (no tracking params)
  return {
    alternates: {
      canonical: '/' // Strip all query params
    }
  };
}

// User lands on: /?utm_source=twitter&utm_campaign=launch
// Canonical tag: <link rel="canonical" href="https://example.com/" />
// Analytics still see utm params, SEO ignores them
```

### Preventing Indexing of Duplicate Content

```typescript
// app/print/[slug]/page.tsx (print version of article)
export const metadata: Metadata = {
  robots: {
    index: false, // Don't index print versions
    follow: true // But do follow links
  },
  alternates: {
    canonical: `/article/${params.slug}` // Point to main article
  }
};
```

### URL Normalization Checklist

- [ ] `metadataBase` set in root layout
- [ ] Canonical URL on every page
- [ ] Trailing slashes handled consistently (with or without, pick one)
- [ ] WWW vs non-WWW redirects (301) to preferred version
- [ ] HTTP → HTTPS redirects (301)
- [ ] Tracking parameters stripped or ignored in canonical
- [ ] Pagination uses page 1 as canonical (not `/blog?page=1`)
- [ ] Query parameters that don't change content are excluded from canonical
- [ ] Language variants use hreflang
- [ ] Staging/dev sites canonicalize to production
- [ ] Print/mobile versions canonicalize to standard version

### Common Mistakes

#### ❌ Forgetting metadataBase

```typescript
// This breaks! Relative canonical without metadataBase
export const metadata: Metadata = {
  alternates: {
    canonical: '/blog/post' // Where's the domain?
  }
};
```

#### ❌ Self-Competing Pages

```typescript
// DON'T: Create multiple URLs for same content
// /blog/my-post
// /articles/my-post
// /news/my-post

// DO: Pick ONE URL structure, redirect others
// Canonical: /blog/my-post
// Redirect: /articles/my-post → 301 → /blog/my-post
```

#### ❌ Canonicalizing Paginated Pages to Page 1

```typescript
// DON'T: All pages point to page 1
export const metadata: Metadata = {
  alternates: {
    canonical: '/blog' // Wrong! Every page points here
  }
};

// DO: Each page is its own canonical (or use noindex on page 2+)
export const metadata: Metadata = {
  alternates: {
    canonical: page === 1 ? '/blog' : `/blog?page=${page}`
  }
};
```

#### ❌ Including Session IDs in URLs

```typescript
// DON'T: /product/123?sessionid=xyz (creates infinite duplicates)

// DO: Use cookies for session tracking
// Canonical: /product/123
```

### Tools for Detecting Duplicate Content

- **Google Search Console**: Coverage report shows duplicate pages Google found
- **Screaming Frog**: Crawls site, identifies duplicate titles/descriptions/content
- **Ahrefs Site Audit**: Finds duplicate content and canonicalization issues
- **Siteliner**: Free tool for finding duplicate content within your site

### Summary: Canonical URL Strategy

1. **Set metadataBase** in root layout (required)
2. **Add canonical to every page** (static or dynamic)
3. **Handle URL variations** with 301 redirects (trailing slashes, www, https)
4. **Strip tracking parameters** (or ignore in canonical)
5. **Use hreflang** for multi-language sites
6. **Cross-domain canonicalization** for staging/syndication
7. **Validate with tools** (Search Console, Screaming Frog, Ahrefs)

---

## Sitemap & Robots.txt

### Dynamic Sitemap

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const routes = ['', '/about', '/blog'].map((route) => ({
    url: `https://example.com${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8
  }));

  // Dynamic routes (e.g., blog posts)
  const posts = await getAllPosts();
  const postRoutes = posts.map((post) => ({
    url: `https://example.com/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6
  }));

  return [...routes, ...postRoutes];
}
```

### Robots.txt

```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/private/']
      },
      {
        userAgent: 'GPTBot', // OpenAI
        disallow: ['/'] // Block or allow AI crawlers
      },
      {
        userAgent: 'ChatGPT-User', // ChatGPT browse
        disallow: ['/']
      }
    ],
    sitemap: 'https://example.com/sitemap.xml'
  };
}
```

**AI Crawler User-Agents** (as of 2025):

- `GPTBot` (OpenAI)
- `ChatGPT-User` (ChatGPT browsing)
- `Google-Extended` (Google Bard/Gemini)
- `anthropic-ai` (Claude)
- `ClaudeBot` (Claude)
- `PerplexityBot` (Perplexity)
- `Bytespider` (ByteDance)

---

## Structured Data

### JSON-LD with Type Safety

```bash
pnpm add schema-dts
```

```typescript
// lib/structured-data.ts
import { WithContext, Article, BreadcrumbList, Organization } from 'schema-dts';

export function generateArticleStructuredData(
  post: Post
): WithContext<Article> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author.name,
      url: post.author.url
    },
    publisher: {
      '@type': 'Organization',
      name: 'Site Name',
      logo: {
        '@type': 'ImageObject',
        url: 'https://example.com/logo.png'
      }
    }
  };
}

export function generateBreadcrumbStructuredData(
  items: Array<{ name: string; url: string }>
): WithContext<BreadcrumbList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}
```

### Rendering Structured Data

```tsx
// app/blog/[slug]/page.tsx
export default async function BlogPost({
  params
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);
  const structuredData = generateArticleStructuredData(post);

  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Page content */}
      <article>
        <h1>{post.title}</h1>
        {/* ... */}
      </article>
    </>
  );
}
```

### Common Schema Types

- `Article` / `BlogPosting` - Blog posts, articles
- `Product` - E-commerce products
- `Organization` - Company info
- `Person` - Author profiles
- `BreadcrumbList` - Breadcrumb navigation
- `WebSite` - Site-wide search
- `FAQPage` - FAQ sections
- `VideoObject` - Video content
- `Event` - Events, webinars

**Validation**: [Google Rich Results Test](https://search.google.com/test/rich-results)

---

## Performance Optimization

### Image Optimization

```tsx
import Image from 'next/image';

// Above-the-fold image (LCP candidate)
<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority // Preload, prevents lazy loading
  placeholder="blur" // Prevents CLS
  blurDataURL="data:image/..." // Generated at build time
/>

// Below-the-fold images
<Image
  src="/content.jpg"
  alt="Content image"
  width={800}
  height={400}
  loading="lazy" // Default, explicit here
  sizes="(max-width: 768px) 100vw, 800px" // Responsive sizing
/>
```

**Best Practices**:

- Use `priority` for LCP images (hero, above-fold)
- Set explicit `width` and `height` to prevent CLS
- Use `sizes` for responsive images (reduces transferred bytes)
- Use `placeholder="blur"` for better UX

### Font Optimization

```typescript
// app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Prevents FOIT (Flash of Invisible Text)
  variable: '--font-inter',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

**Why it matters**: Fonts are a major cause of CLS. `next/font` automatically:

- Self-hosts Google Fonts (no external requests)
- Preloads font files
- Applies `font-display: swap` to prevent FOIT
- Generates CSS variables for usage

### Code Splitting & Dynamic Imports

```tsx
// Heavy component loaded on demand
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/heavy-chart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false // Client-only if needed
});

// Modal loaded only when opened
const [isOpen, setIsOpen] = useState(false);
const Modal = dynamic(() => import('@/components/modal'));

return (
  <>
    <button onClick={() => setIsOpen(true)}>Open Modal</button>
    {isOpen && <Modal />}
  </>
);
```

### Script Optimization

**Why it matters**: Third-party scripts (analytics, ads, chat widgets) are a **major cause of poor Core Web Vitals**. Unoptimized scripts block the main thread, delay interactivity (INP), and slow page loads (LCP). Use `next/script` to control when and how scripts load.

**Official guide**: [Next.js Script Optimization](https://nextjs.org/docs/app/guides/scripts)

#### Loading Strategies

```tsx
import Script from 'next/script';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}

      {/* 1. beforeInteractive - Critical scripts that must run before page hydration */}
      <Script
        src="https://polyfill.io/v3/polyfill.min.js"
        strategy="beforeInteractive"
      />

      {/* 2. afterInteractive (DEFAULT) - Analytics, tag managers */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
        strategy="afterInteractive"
      />

      {/* 3. lazyOnload - Non-critical widgets, chat, social embeds */}
      <Script
        src="https://widget.intercom.io/widget/APP_ID"
        strategy="lazyOnload"
      />
    </>
  );
}
```

**Strategy breakdown**:

| Strategy                | When it loads                            | Use for                               | Impact on Core Web Vitals                   |
| ----------------------- | ---------------------------------------- | ------------------------------------- | ------------------------------------------- |
| `beforeInteractive`     | Before Next.js code and page hydration   | Polyfills, critical feature detection | **HIGH** - Blocks rendering, use sparingly  |
| `afterInteractive`      | After page becomes interactive (default) | Analytics, tag managers, A/B testing  | **MEDIUM** - Loads early but non-blocking   |
| `lazyOnload`            | During browser idle time                 | Chat widgets, social embeds, ads      | **LOW** - Minimal impact on Core Web Vitals |
| `worker` (experimental) | In web worker via Partytown              | Heavy third-party scripts             | **MINIMAL** - Off main thread               |

#### Inline Scripts

```tsx
// Inline script (no external file)
<Script id="inline-script" strategy="afterInteractive">
  {`
    console.log('Inline script executed');
    window.dataLayer = window.dataLayer || [];
  `}
</Script>

// Or with dangerouslySetInnerHTML
<Script
  id="structured-data"
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Example',
    }),
  }}
/>
```

**Important**: Inline scripts **must have an `id`** property for Next.js tracking and de-duplication.

#### Event Handlers (Client Components)

```tsx
'use client';

import Script from 'next/script';

export default function Analytics() {
  return (
    <Script
      src="https://analytics.example.com/script.js"
      strategy="afterInteractive"
      onLoad={() => {
        console.log('Script loaded successfully');
      }}
      onReady={() => {
        console.log('Script ready (runs on mount too)');
      }}
      onError={(e) => {
        console.error('Script failed to load', e);
      }}
    />
  );
}
```

**Event handler differences**:

- `onLoad`: Fires once when script loads
- `onReady`: Fires after load AND on every component mount
- `onError`: Fires if script fails to load

#### Best Practices: Load Scripts Where Needed

**❌ BAD: Loading globally when only needed on one page**

```tsx
// app/layout.tsx (loads on every route!)
<Script
  src="https://maps.googleapis.com/maps/api/js"
  strategy="afterInteractive"
/>
```

**✅ GOOD: Load only on pages that use it**

```tsx
// app/contact/page.tsx (only loads on /contact)
export default function ContactPage() {
  return (
    <>
      <Script
        src="https://maps.googleapis.com/maps/api/js"
        strategy="afterInteractive"
      />
      {/* Map component */}
    </>
  );
}
```

**Principle**: "Include third-party scripts in specific pages or layouts to minimize unnecessary impact to performance."

#### Common Third-Party Script Examples

```tsx
// Google Analytics 4
<Script
  src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_MEASUREMENT_ID');
  `}
</Script>

// Google Tag Manager
<Script id="gtm" strategy="afterInteractive">
  {`
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-XXXX');
  `}
</Script>

// Facebook Pixel
<Script id="facebook-pixel" strategy="afterInteractive">
  {`
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', 'YOUR_PIXEL_ID');
    fbq('track', 'PageView');
  `}
</Script>

// Intercom Chat (lazyOnload - non-critical)
<Script
  src="https://widget.intercom.io/widget/APP_ID"
  strategy="lazyOnload"
/>

// Hotjar (lazyOnload)
<Script id="hotjar" strategy="lazyOnload">
  {`
    (function(h,o,t,j,a,r){
      h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
      h._hjSettings={hjid:YOUR_HJID,hjsv:6};
      a=o.getElementsByTagName('head')[0];
      r=o.createElement('script');r.async=1;
      r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
      a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
  `}
</Script>
```

#### Performance Impact Checklist

- [ ] Use `lazyOnload` for all non-critical scripts (chat, social, ads)
- [ ] Use `afterInteractive` for analytics (not `beforeInteractive`)
- [ ] Avoid `beforeInteractive` unless absolutely necessary (polyfills only)
- [ ] Load scripts in specific routes, not globally (unless needed everywhere)
- [ ] Add `id` to all inline scripts
- [ ] Monitor script impact with Lighthouse "Reduce JavaScript execution time" audit
- [ ] Consider self-hosting third-party scripts for better caching

**SEO Impact**: Scripts loaded with `lazyOnload` or `afterInteractive` have **minimal impact on Core Web Vitals** compared to blocking `<script>` tags or `beforeInteractive` strategy.

### Third-Party Libraries (@next/third-parties)

**Official guide**: [Next.js Third-Party Libraries](https://nextjs.org/docs/app/guides/third-party-libraries)

**Why use this**: Instead of manually implementing third-party scripts with `next/script`, Next.js provides **pre-optimized components** for popular services through `@next/third-parties`. These components are "optimized for performance and ease of use" with built-in lazy loading and best practices.

#### Installation

```bash
pnpm add @next/third-parties@latest
```

**Note**: This is an experimental package under active development. Use `@latest` or `@canary` for newest features.

#### Google Tag Manager (Recommended)

**Prefer GTM over individual analytics scripts** - GTM consolidates multiple tracking tools into one container, reducing script bloat.

```tsx
// app/layout.tsx
import { GoogleTagManager } from '@next/third-parties/google';

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <GoogleTagManager gtmId="GTM-XXXXXXX" />
      </body>
    </html>
  );
}
```

**Send custom events**:

```tsx
'use client';

import { sendGTMEvent } from '@next/third-parties/google';

export default function Button() {
  return (
    <button
      onClick={() =>
        sendGTMEvent({
          event: 'button_click',
          value: 'purchase_button'
        })
      }
    >
      Buy Now
    </button>
  );
}
```

**Props**:

- `gtmId` (required): Container ID starting with `GTM-`
- `dataLayer`: Initial data layer object
- `dataLayerName`: Custom data layer name
- `auth`, `preview`: For GTM environments

**Why GTM?**

- **Single container** for all tracking (GA, Pixel, Hotjar, etc.)
- **No code deploys** for new tags (managed in GTM dashboard)
- **Better performance** than multiple individual scripts
- **Fetches after hydration** to avoid blocking

#### Google Analytics (GA4)

Use if you only need GA and don't have GTM (but GTM is recommended).

```tsx
// app/layout.tsx
import { GoogleAnalytics } from '@next/third-parties/google';

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <GoogleAnalytics gaId="G-XXXXXXXXXX" />
      </body>
    </html>
  );
}
```

**Send custom events**:

```tsx
'use client';

import { sendGAEvent } from '@next/third-parties/google';

export default function Button() {
  return (
    <button
      onClick={() =>
        sendGAEvent({
          event: 'button_click',
          value: 'purchase'
        })
      }
    >
      Buy Now
    </button>
  );
}
```

**Props**:

- `gaId` (required): Measurement ID starting with `G-`
- `dataLayerName`: Custom data layer name

**Note**: If you already have GTM, use GTM's GA tag instead of this component.

#### Google Maps Embed

**Lazy-loaded by default** - map loads only when needed, improving LCP.

```tsx
// app/contact/page.tsx
import { GoogleMapsEmbed } from '@next/third-parties/google';

export default function ContactPage() {
  return (
    <div>
      <h1>Our Office</h1>
      <GoogleMapsEmbed
        apiKey="YOUR_GOOGLE_MAPS_API_KEY"
        height={400}
        width="100%"
        mode="place"
        q="Brooklyn+Bridge,New+York,NY"
        zoom={15}
      />
    </div>
  );
}
```

**Props**:

- `apiKey` (required): Google Maps API key
- `mode` (required): `place`, `view`, `directions`, `streetview`, `search`
- `height`, `width`: Dimensions
- `zoom`: Zoom level (1-21)
- `language`, `region`: Localization
- `q`: Search query or place ID
- `center`, `maptype`: Additional configuration

**SEO benefit**: Lazy loading prevents Maps from blocking LCP.

#### YouTube Embed

Uses `lite-youtube-embed` under the hood for **significant performance improvement** over native iframe embeds.

```tsx
// app/about/page.tsx
import { YouTubeEmbed } from '@next/third-parties/google';

export default function AboutPage() {
  return (
    <div>
      <h1>Watch Our Video</h1>
      <YouTubeEmbed videoid="dQw4w9WgXcQ" height={400} />
    </div>
  );
}
```

**Props**:

- `videoid` (required): YouTube video ID (from URL)
- `height`, `width`: Dimensions
- `playlabel`: Accessible label for play button
- `params`: YouTube player parameters (autoplay, controls, etc.)
- `style`: Custom CSS

**Performance impact**: Lite YouTube embed loads ~224KB less JavaScript than standard iframe embed.

#### Comparison: Manual vs @next/third-parties

| Approach         | Manual `next/script`                   | `@next/third-parties`                            |
| ---------------- | -------------------------------------- | ------------------------------------------------ |
| **Setup**        | Manual script tags, strategy selection | Pre-configured components                        |
| **Performance**  | Must configure correctly               | Optimized by default                             |
| **Type safety**  | Limited                                | Full TypeScript support                          |
| **Events**       | Custom implementation                  | Built-in helpers (`sendGTMEvent`, `sendGAEvent`) |
| **Updates**      | Manual script URL updates              | Package updates                                  |
| **Lazy loading** | Manual implementation                  | Built-in for Maps/YouTube                        |

#### When to Use Each

**Use `@next/third-parties`**:

- Google Tag Manager, Google Analytics
- Google Maps embeds
- YouTube embeds
- You want optimized defaults

**Use `next/script`**:

- Custom third-party scripts not in package
- Facebook Pixel, Intercom, Hotjar, etc.
- Fine-grained control over loading

**Best practice**: Combine both - use `@next/third-parties` for supported services, `next/script` for everything else.

#### Migration Example

**Before (manual)**:

```tsx
// Manual GTM implementation
<Script id="gtm" strategy="afterInteractive">
  {`
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-XXXX');
  `}
</Script>
```

**After (@next/third-parties)**:

```tsx
import { GoogleTagManager } from '@next/third-parties/google';

<GoogleTagManager gtmId="GTM-XXXX" />;
```

**Benefits**: Less code, optimized loading, type-safe, easier to maintain.

### CSS Optimization

```typescript
// Tailwind CSS with PurgeCSS (automatic in Next.js)
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}'
  ]
  // ... rest of config
};

export default config;
```

**Benefits**: Removes unused CSS (up to 90% reduction), improving LCP and INP.

---

## AI & LLM Search Optimization

### Why AI Search Differs

**Traditional SEO**: Keyword matching, backlinks, PageRank
**AI Search**: Semantic understanding, embeddings, concept ownership, citations

**Key principle**: LLMs favor **clear, deep explanations** over keyword density. They interpret meaning through embeddings and semantic relationships.

### Technical Requirements

```typescript
// 1. Server-Side Rendering (SSR) or Static Generation (SSG)
// AI crawlers often don't execute JavaScript

// app/page.tsx (RSC - Server Component by default)
export default async function Page() {
  const data = await fetchData(); // Fetched on server

  return (
    <article>
      <h1>{data.title}</h1>
      <p>{data.content}</p>
    </article>
  );
}

// 2. Semantic HTML structure
export default function BlogPost({ post }: { post: Post }) {
  return (
    <article>
      <header>
        <h1>{post.title}</h1>
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
      </header>

      <section>
        <h2>Introduction</h2>
        <p>{post.intro}</p>
      </section>

      <section>
        <h2>Main Content</h2>
        <p>{post.content}</p>
      </section>

      <footer>
        <address>By {post.author.name}</address>
      </footer>
    </article>
  );
}
```

### Content Strategy for AI Search

1. **Concept Ownership**: Be the definitive source for specific concepts
   - Deep explanations with original examples
   - Code snippets, data, metrics
   - Visual aids (diagrams, charts)

2. **Consistent Terminology**: Use the same terms throughout content
   - LLMs build semantic relationships through repetition
   - Define terms clearly on first use

3. **Heading Hierarchy**: Use semantic heading structure
   - H1 (single, page title) → H2 (main sections) → H3 (subsections)
   - Headings should be descriptive, not clever

4. **Evidence-Based**: Include data competitors can't replicate
   - Original research
   - Case studies
   - Code benchmarks
   - Quotes from experts

5. **Community Citations**: Authentic mentions matter
   - Reddit, GitHub, Stack Overflow, Twitter/X
   - Organic citations > paid links for AI training data

### Refresh Strategy

```typescript
// Update content regularly (30, 90, 180 days)
// AI models re-crawl and prioritize fresh content

export const revalidate = 3600; // ISR: revalidate every hour

export default async function Page() {
  const data = await fetchData(); // Fresh data on revalidate
  // ...
}
```

### Controlling AI Crawlers

```typescript
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/'
      },
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'Google-Extended',
          'anthropic-ai',
          'ClaudeBot'
        ],
        allow: '/' // Allow AI crawlers
        // OR disallow: ['/'] to block
      }
    ],
    sitemap: 'https://example.com/sitemap.xml'
  };
}
```

---

## Technical SEO Checklist

### Crawlability & Indexing

- [ ] Sitemap submitted to Google Search Console
- [ ] Robots.txt configured correctly (not blocking important pages)
- [ ] All pages return 200 status (or appropriate 301/404)
- [ ] No orphan pages (pages without internal links)
- [ ] Internal linking structure is logical
- [ ] Canonical URLs set correctly (avoid duplicate content)
- [ ] 404 pages return 404 status code (not 200)

### Site Structure

- [ ] URL structure is descriptive and hierarchical
  - Good: `/blog/nextjs-seo-guide`
  - Bad: `/post?id=123`
- [ ] Directory structure reflects content organization
- [ ] Breadcrumbs implemented (with structured data)
- [ ] XML sitemap includes all important pages
- [ ] HTML sitemap for users (optional but helpful)

### Mobile Optimization

- [ ] Responsive design (mobile-first)
- [ ] Touch targets >= 48x48px
- [ ] No horizontal scrolling
- [ ] Text is readable without zooming (16px+ base font)
- [ ] Mobile usability verified in Search Console

### Page Speed & Core Web Vitals

- [ ] LCP < 2.5s (measured via CrUX, not Lighthouse)
- [ ] INP < 200ms
- [ ] CLS < 0.1
- [ ] Images optimized (next/image with priority for LCP images)
- [ ] Fonts optimized (next/font with display: swap)
- [ ] Third-party scripts optimized
  - [ ] Use `@next/third-parties` for GTM, GA, Maps, YouTube (preferred)
  - [ ] Use `next/script` for other services (Facebook Pixel, Intercom, etc.)
  - [ ] Analytics/tracking: `afterInteractive` strategy
  - [ ] Chat/widgets/ads: `lazyOnload` strategy
  - [ ] Only polyfills: `beforeInteractive` strategy
  - [ ] Scripts loaded only on pages where needed (not globally)
- [ ] Unused CSS removed (Tailwind purge)

### Content & On-Page SEO

- [ ] Unique, descriptive titles (<60 chars)
- [ ] Compelling meta descriptions (150-160 chars)
- [ ] H1 present and unique per page
- [ ] Heading hierarchy (H1 → H2 → H3, no skipping)
- [ ] Alt text on all images (descriptive, not keyword-stuffed)
- [ ] Internal links use descriptive anchor text
- [ ] Content is substantial (no thin content)

### Structured Data

- [ ] JSON-LD structured data for key pages
- [ ] Validated with Google Rich Results Test
- [ ] Organization schema on homepage
- [ ] Article/BlogPosting schema on blog posts
- [ ] BreadcrumbList schema for navigation
- [ ] Product schema for e-commerce (if applicable)

### Security & Trust

- [ ] HTTPS enabled (SSL certificate)
- [ ] No mixed content warnings
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)
- [ ] Privacy policy and terms of service links

### International & Localization

- [ ] `lang` attribute on `<html>` tag
- [ ] `hreflang` tags for language variants
- [ ] Localized URLs (e.g., `/en/`, `/es/`)
- [ ] Content translated (not auto-translated)

---

## Monitoring & Tools

### Google Search Console

**Setup**: Verify ownership via DNS, HTML file, or Google Tag Manager

**Key Reports**:

- **Performance**: Impressions, clicks, CTR, average position
- **Coverage**: Indexation errors, crawl stats
- **Core Web Vitals**: Real-user field data (CrUX)
- **Mobile Usability**: Mobile-specific issues
- **Manual Actions**: Penalties (rare if following guidelines)

### Vercel Speed Insights

```bash
pnpm add @vercel/speed-insights
```

```tsx
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

**Benefits**: Real-time Core Web Vitals data (faster than Google's 28-day window), per-route breakdown, geographic insights.

### Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install && npm run build
      - run: npm install -g @lhci/cli
      - run: lhci autorun
```

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      staticDistDir: './out',
      url: ['http://localhost:3000/', 'http://localhost:3000/blog']
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }]
      }
    }
  }
};
```

### Ahrefs Site Audit

**Setup**: Add site to Ahrefs → Site Audit → Connect to Google Search Console

**Key Features**:

- **100+ SEO checks**: Technical, content, and link issues
- **Internal Link Opportunities**: Find pages to link to (based on keyword rankings)
- **Site Structure**: Visualize hierarchy and link flow
- **Performance**: Page speed, Core Web Vitals
- **Content Quality**: Thin content, duplicate content

**Priority Issues**:

1. **4xx/5xx errors**: Fix broken pages
2. **Duplicate content**: Canonicalize or 301 redirect
3. **Missing meta descriptions**: Add unique descriptions
4. **Slow pages**: Optimize images, fonts, scripts
5. **Orphan pages**: Add internal links

### Other Tools

- **Google PageSpeed Insights**: Core Web Vitals + Lighthouse (free)
- **Screaming Frog**: Desktop crawler for technical audits (free up to 500 URLs)
- **Bing Webmaster Tools**: Bing-specific insights (often overlooked)
- **Schema Markup Validator**: [Google Rich Results Test](https://search.google.com/test/rich-results)

---

## Common Pitfalls

### 1. JavaScript-Heavy Sites Without SSR

**Problem**: Google can crawl JavaScript, but AI crawlers often don't execute it.

**Solution**: Use Next.js Server Components (default in App Router) or Static Generation.

```tsx
// ❌ BAD: Client-side only data fetching
'use client';
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/data').then((res) => setData(res.json()));
  }, []);
  return <div>{data?.title}</div>;
}

// ✅ GOOD: Server-side data fetching
export default async function Page() {
  const data = await fetch('/api/data').then((res) => res.json());
  return <div>{data.title}</div>;
}
```

### 2. Missing metadataBase

**Problem**: Relative URLs in metadata break Open Graph images.

**Solution**: Set `metadataBase` in root layout.

```typescript
// ❌ BAD: Relative URL
export const metadata: Metadata = {
  openGraph: { images: ['/og-image.jpg'] } // Breaks!
};

// ✅ GOOD: metadataBase set
export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  openGraph: { images: ['/og-image.jpg'] } // Resolves to https://example.com/og-image.jpg
};
```

### 3. Blocking Resources in robots.txt

**Problem**: Blocking `/api/` or `/_next/` can prevent Google from crawling.

**Solution**: Only block truly private content.

```typescript
// ❌ BAD: Blocking Next.js resources
disallow: ['/_next/', '/api/'],

// ✅ GOOD: Only block private routes
disallow: ['/admin/', '/private/'],
```

### 4. Ignoring Lighthouse vs. CrUX Distinction

**Problem**: Obsessing over Lighthouse score while ignoring real-user data.

**Solution**: Use Lighthouse for diagnostics, but monitor CrUX (Google Search Console, Vercel Speed Insights) for actual rankings.

### 5. Over-Optimizing for Keywords

**Problem**: Keyword stuffing, unnatural writing.

**Solution**: Write naturally for users. Google (and LLMs) understand semantics, not just exact matches.

### 6. Loading Third-Party Scripts Incorrectly

**Problem**: Using blocking `<script>` tags or loading scripts globally when only needed on specific pages.

**Solution**: Use `@next/third-parties` for supported services (GTM, GA, Maps, YouTube) or `next/script` with appropriate strategy for others.

```tsx
// ❌ BAD: Blocking script in <head> (damages Core Web Vitals)
<head>
  <script src="https://analytics.example.com/script.js"></script>
</head>

// ❌ BAD: Loading Google Maps globally (only needed on /contact)
// app/layout.tsx
<Script src="https://maps.googleapis.com/maps/api/js" />

// ✅ GOOD: Use @next/third-parties for GTM
import { GoogleTagManager } from '@next/third-parties/google';
<GoogleTagManager gtmId="GTM-XXXX" />

// ✅ GOOD: Load Maps only where needed
// app/contact/page.tsx
import { GoogleMapsEmbed } from '@next/third-parties/google';
<GoogleMapsEmbed apiKey="..." mode="place" q="..." />
```

---

## Summary

### Production-Ready SEO Checklist

**Critical (Do First):**

- [x] `metadataBase` set in root layout (required for Open Graph & canonical URLs)
- [x] Canonical URL on every page (prevents duplicate content penalties)
- [x] URL normalization: trailing slashes, www/non-www, https redirects (301)

**Metadata:**

- [x] Unique titles/descriptions per page
- [x] Open Graph images (1200x630px)
- [x] Tracking parameters handled (stripped or ignored in canonical)

**Performance:**

- [x] LCP < 2.5s (real-user data, not Lighthouse)
- [x] Images use `next/image` with `priority` for LCP candidates
- [x] Fonts use `next/font` with `display: swap`
- [x] Third-party scripts optimized (`@next/third-parties` for GTM/GA/Maps/YouTube, `next/script` for others)

**Structure:**

- [x] Dynamic sitemap.ts
- [x] Robots.txt configured
- [x] Structured data (JSON-LD) for key pages
- [x] Semantic HTML (heading hierarchy, `<article>`, `<section>`, etc.)

**Monitoring:**

- [x] Google Search Console setup
- [x] Vercel Speed Insights (or equivalent)
- [x] Lighthouse CI for regressions
- [x] Ahrefs Site Audit (or Screaming Frog)

**AI Search:**

- [x] SSR/SSG for all public pages
- [x] Consistent terminology and heading structure
- [x] Evidence-based content (original data, examples)
- [x] Regular content updates (30/90/180 day cycle)

### Quick Wins

1. **Add `metadataBase` + canonical URLs** - Fixes Open Graph images & prevents duplicate content penalties
2. **Use `@next/third-parties` for GTM** - Replace manual script tags with optimized component
3. **Add middleware for URL normalization** - Redirects trailing slashes, www, https (301)
4. **Use `next/image` with `priority`** - Improves LCP significantly
5. **Add structured data** - Enables rich snippets in search results
6. **Create sitemap.ts** - Improves indexation & discovery
7. **Set up Search Console** - Monitor performance & duplicate content issues

### Further Reading

- [Next.js Metadata API Docs](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Next.js Script Optimization](https://nextjs.org/docs/app/guides/scripts)
- [Next.js Third-Party Libraries](https://nextjs.org/docs/app/guides/third-party-libraries)
- [Google Search Central](https://developers.google.com/search/docs)
- [Vercel SEO Blog Posts](https://vercel.com/blog/how-were-adapting-seo-for-llms-and-ai-search)
- [Web.dev Core Web Vitals](https://web.dev/vitals/)
- [Schema.org](https://schema.org/)

---

**Token-efficient summary**: Use Next.js Metadata API for type-safe SEO, **set metadataBase and canonical URLs on every page** to prevent duplicate content penalties, implement SSR/SSG for crawlers, optimize Core Web Vitals (LCP/INP/CLS) with `next/image`/`next/font`/`@next/third-parties` (GTM, GA, Maps, YouTube) or `next/script`, add JSON-LD structured data, create dynamic sitemap.ts/robots.ts, handle URL normalization (trailing slashes, www, https) with middleware redirects, monitor with Search Console + Speed Insights. For AI search: use semantic HTML, consistent terminology, and evidence-based content. Real-user field data (CrUX) affects rankings, NOT Lighthouse scores.
