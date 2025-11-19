# Next.js Image Component Guide for LLMs

**Purpose**: Implement performant, accessible images with automatic optimization in Next.js applications.

## Core Principles

1. **Always use `<Image>` for photos/raster images** - Automatic optimization, responsive loading, modern formats (WebP/AVIF)
2. **Width and height required** - Prevents Cumulative Layout Shift (CLS), critical for Core Web Vitals
3. **Use custom loaders for external services** - Avoid Vercel optimization costs when using Unsplash/Cloudinary/ImgIX
4. **Enable responsive loading with `sizes`** - Prevents loading oversized images on small screens
5. **Generate blur placeholders** - Better UX during image load (LQIP pattern)

## Quick Reference

```tsx
// ✅ Static image (auto width/height/blur)
import mountains from '@/public/mountain.jpg';
<Image
  src={mountains}
  alt="Mountain landscape"
  placeholder="blur"
  className="rounded-lg"
/>

// ✅ Remote image (requires width/height)
<Image
  src="https://example.com/photo.jpg"
  alt="Remote photo"
  width={1920}
  height={1080}
  sizes="(max-width: 768px) 100vw, 50vw"
/>

// ✅ With internationalization (translate alt text)
<Image
  src={product.image}
  alt={t('products.imageAlt', { name: product.name })}
  width={800}
  height={600}
/>

// ✅ Responsive fill (parent sets dimensions)
<div className="relative h-96 w-full">
  <Image
    src="/hero.jpg"
    alt="Hero image"
    fill
    className="object-cover"
    sizes="100vw"
  />
</div>

// ✅ Custom loader (avoid Vercel optimization costs)
<Image
  src="https://images.unsplash.com/photo-123"
  alt="Unsplash photo"
  width={1920}
  height={1080}
  loader={unsplashLoader}
/>

// ❌ NEVER - Missing width/height on remote image
<Image src="https://example.com/photo.jpg" alt="Photo" />

// ❌ NEVER - Use Image for SVG icons
// See: https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/icons.md
<Image src="/icons/check.svg" alt="Check" />

// ❌ NEVER - Skip sizes on responsive images
<Image src={photo} alt="Photo" fill />
```

## Why This Matters

**Without optimization:**

- 6.9 MB JPEG loads in 40+ seconds on mobile 3G
- Poor Core Web Vitals (LCP > 25s)
- High bandwidth costs
- User abandonment

**With Next.js Image:**

- Same image: 58 KB WebP loads in <1s
- LCP < 2.5s (Google's threshold)
- 99% bandwidth reduction
- Automatic format conversion (WebP/AVIF)

**Core Web Vitals Impact:**

- **LCP** (Largest Contentful Paint): Must be < 2.5s for good SEO
- **CLS** (Cumulative Layout Shift): Prevented by width/height attributes
- **Optimization**: Happens automatically via Vercel or custom loaders

## Pre-Optimization Before Upload

**Before uploading images to CMS or `/public`, optimize them first:**

**Tools:**

- **Squoosh.app** (https://squoosh.app/) - Web-based, free, supports all formats
- **ImageOptim** (Mac) - Drag-and-drop lossless compression
- **TinyPNG** (https://tinypng.com/) - PNG/JPEG compression
- **Sharp CLI** - Automated local optimization

**Why pre-optimize:**

- Reduces storage costs (CMS/hosting)
- Faster uploads for content editors
- Smaller original files = faster CDN delivery
- Next.js optimization starts from smaller baseline

**Recommended settings (Squoosh):**

- Format: Keep original (JPEG/PNG) - Next.js converts to WebP/AVIF automatically
- Quality: 80-85 for photos, 90-95 for graphics/text
- Resize: Max width 3840px (largest deviceSize in Next.js)
- Remove metadata: Enable (strips EXIF data)

**Example workflow:**

1. Export image from design tool (Figma/Photoshop)
2. Run through Squoosh.app (80% quality, resize if >3840px wide)
3. Upload optimized image to CMS or save to `/public`
4. Next.js handles further optimization automatically

**⚠️ Don't over-compress:** Let Next.js handle final optimization. Pre-optimization is about reducing file size, not replacing Next.js optimization.

## Static Images (Local Files)

**Use for**: Images in your repository (`/public` folder)

```tsx
import mountains from '@/public/mountain-lake.jpeg';

export function Gallery() {
  return (
    <Image
      src={mountains}
      alt="Mountain lake at sunset"
      placeholder="blur" // Auto-generated at build time
      className="rounded-lg"
    />
  );
}
```

**What Next.js does automatically:**

1. Calculates `width` and `height` at build time
2. Generates blur placeholder (`blurDataURL`)
3. Optimizes and converts to WebP/AVIF
4. Creates responsive sizes via `srcset`

**Benefits:**

- No manual width/height needed
- Free blur placeholder
- Build-time optimization (no runtime cost)

**⚠️ Pre-optimize before adding to `/public`** - Use Squoosh.app to reduce file size before committing to repo.

## Remote Images (External URLs)

**Use for**: Images from CMS, database, external APIs

```tsx
export function RemotePhoto() {
  return (
    <Image
      src="https://images.unsplash.com/photo-xyz"
      alt="Remote landscape"
      width={4544} // ⚠️ Required - use original dimensions
      height={2840} // ⚠️ Required
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}
```

**Critical rules:**

1. `width` and `height` are **required** (use original image dimensions)
2. Add domain to `remotePatterns` in `next.config.js`
3. Consider custom loader to avoid Vercel optimization costs
4. Use `sizes` prop for responsive loading

### Security Configuration

```js
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'cdn.yourdomain.com',
        pathname: '/images/**'
      }
    ]
  }
};
```

## Responsive Images with `fill`

**Use for**: Images that should fill their container (hero sections, cards)

```tsx
export function HeroSection() {
  return (
    <div className="relative h-[500px] w-full">
      <Image
        src="/hero.jpg"
        alt="Hero image"
        fill
        className="object-cover"
        sizes="100vw"
        priority // ⚠️ Use for above-fold images
      />
    </div>
  );
}
```

**Key requirements:**

1. Parent must have `position: relative/absolute/fixed`
2. Parent must have explicit height/width
3. **Always provide `sizes` prop** (defaults to 100vw but should be explicit)
4. Use `object-cover` or `object-contain` for scaling behavior

**Common patterns:**

```tsx
// Full-width hero
<div className="relative h-96 w-full">
  <Image src="/hero.jpg" alt="Hero" fill sizes="100vw" />
</div>

// Card with fixed aspect ratio
<div className="relative aspect-video w-full">
  <Image src={post.image} alt={post.title} fill sizes="(max-width: 768px) 100vw, 50vw" />
</div>

// Background image
<div className="relative min-h-screen">
  <Image
    src="/background.jpg"
    alt="Background"
    fill
    className="object-cover -z-10"
    sizes="100vw"
  />
</div>
```

## Responsive Loading with `sizes`

**Critical for performance**: Tells browser which image size to download based on viewport.

```tsx
// Grid layout (responsive columns)
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  {images.map((img) => (
    <Image
      key={img.id}
      src={img.url}
      alt={img.alt}
      width={1920}
      height={1080}
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
      //     ↑ Mobile: full width    ↑ Tablet: half width   ↑ Desktop: third width
    />
  ))}
</div>
```

**How it works:**

1. Browser checks viewport width against media queries
2. Calculates required image size (e.g., 50vw on 1000px = 500px)
3. Selects closest size from generated `srcset`
4. Downloads only that size (not the full 1920px image)

**Result:** 50-90% bandwidth savings on mobile/tablet devices.

### Common `sizes` Patterns

```tsx
// Full width on mobile, half on tablet, third on desktop
sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

// Full width always
sizes = '100vw';

// Fixed width at different breakpoints
sizes = '(max-width: 768px) 90vw, (max-width: 1200px) 700px, 900px';

// Complex layout
sizes =
  '(max-width: 640px) 100vw, (max-width: 768px) 80vw, (max-width: 1024px) 50vw, 800px';
```

**⚠️ Without `sizes`**: Browser downloads largest possible image regardless of screen size.

## Custom Loaders (Cost Optimization)

**Use when**: Images are hosted on external optimization services (Unsplash, Cloudinary, ImgIX, Cloudflare Images).

**Why**: Avoid paying Vercel for optimization when already paying another service.

### Cloudflare Images Loader (Production Example)

```typescript
// image-loader.ts
import type { ImageLoader } from 'next/image';

type CloudflareImageLoaderProps = {
  quality?: number;
  src: string;
  width: number;
};

/**
 * Cloudflare image loader with environment-specific logic
 *
 * Development: Returns original image URL (no transformation)
 * Preview: Returns original (controlled by env var)
 * Production: Uses Cloudflare's /cdn-cgi/image/ endpoint
 *
 * Requirements:
 * 1. Custom domain (not *.workers.dev)
 * 2. Image Resizing enabled in Cloudflare dashboard
 * 3. Pro plan or higher
 */
export default function cloudflareImageLoader({
  quality,
  src,
  width
}: CloudflareImageLoaderProps): string {
  // In development, return original image
  if (process.env.NODE_ENV === 'development') {
    return src;
  }

  // Normalize src (keep absolute URLs intact for CMS images)
  const normalizedSrc = src.startsWith('/') ? src.slice(1) : src;

  // Build transformation params
  const params = [
    `width=${width}`,
    `quality=${quality ?? 85}`,
    'format=auto' // Auto WebP/AVIF
  ];

  return `https://yourdomain.com/cdn-cgi/image/${params.join(',')}/${normalizedSrc}`;
}
```

### Configure in next.config.js

```js
// next.config.js
module.exports = {
  images: {
    // Only use custom loader in production
    ...(process.env.NODE_ENV === 'production'
      ? {
          loader: 'custom',
          loaderFile: './image-loader.ts'
        }
      : {}),
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cms.yourdomain.com'
      }
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    // Next.js 16+ quality levels
    qualities: [75, 80, 85, 90, 95, 100]
  }
};
```

### Other Loaders

```typescript
// utils/loaders.ts
import type { ImageLoader } from 'next/image';

// Unsplash loader
export const unsplashLoader: ImageLoader = ({ src, width, quality }) => {
  const url = new URL(src);
  url.searchParams.set('auto', 'format');
  url.searchParams.set('fit', 'max');
  url.searchParams.set('w', width.toString());
  if (quality) {
    url.searchParams.set('q', quality.toString());
  }
  return url.href;
};

// Cloudinary loader
export const cloudinaryLoader: ImageLoader = ({ src, width, quality }) => {
  const params = [`w_${width}`, `q_${quality || 'auto'}`, 'f_auto'];
  const paramsString = params.join(',');
  return `https://res.cloudinary.com/your-cloud/image/upload/${paramsString}/${src}`;
};

// ImgIX loader
export const imgixLoader: ImageLoader = ({ src, width, quality }) => {
  const url = new URL(src);
  url.searchParams.set('auto', 'format,compress');
  url.searchParams.set('w', width.toString());
  url.searchParams.set('q', (quality || 75).toString());
  return url.href;
};
```

**Usage per-image (without global config):**

```tsx
import { unsplashLoader } from '@/utils/loaders';

<Image
  src="https://images.unsplash.com/photo-123"
  alt="Photo from Unsplash"
  width={1920}
  height={1080}
  loader={unsplashLoader}
  sizes="(max-width: 768px) 100vw, 50vw"
/>;
```

**Cost implications:**

- **Without loader**: Vercel downloads, optimizes, caches image → counts toward source image quota (free tier: 1,000 images, then $9/1,000)
- **With loader**: External service handles optimization → no Vercel quota usage

**Rule of thumb**: If hosting >1,000 unique images on external service, use custom loader.

## CDN Caching & Performance

### Vercel Image Optimization

**How it works:**

1. First request: Vercel downloads, optimizes, and caches image
2. Subsequent requests: Served from edge cache (CDN)
3. Cache duration: Controlled by `minimumCacheTTL` in `next.config.js`

```js
// next.config.js
module.exports = {
  images: {
    minimumCacheTTL: 60 // Cache for 60 seconds (default)
    // ⚠️ Cannot be invalidated - choose wisely
  }
};
```

**Cache behavior:**

- Optimized images cached at CDN edge locations globally
- Each unique combination of `src`, `width`, `quality` is cached separately
- Example: `image.jpg?w=640&q=75` and `image.jpg?w=1080&q=75` are separate cache entries
- **Cannot be purged/invalidated** - wait for TTL expiration

**Recommended TTL values:**

- `60` (1 min) - Frequently changing images (user avatars, dynamic content)
- `86400` (1 day) - Standard content (blog posts, product images)
- `31536000` (1 year) - Static assets that never change

### Cloudflare Images

**How it works:**

1. First request: Cloudflare transforms and caches image via `/cdn-cgi/image/` endpoint
2. Subsequent requests: Served from Cloudflare's global CDN
3. Cache duration: Configurable via Cloudflare dashboard or Cache API

```typescript
// image-loader.ts with cache headers
export default function cloudflareImageLoader({
  quality,
  src,
  width
}: CloudflareImageLoaderProps): string {
  if (process.env.NODE_ENV === 'development') {
    return src;
  }

  const normalizedSrc = src.startsWith('/') ? src.slice(1) : src;
  const params = [`width=${width}`, `quality=${quality ?? 85}`, 'format=auto'];

  // Cloudflare automatically caches transformed images
  return `https://yourdomain.com/cdn-cgi/image/${params.join(',')}/${normalizedSrc}`;
}
```

**Cache behavior:**

- Transformed images cached at 200+ data centers worldwide
- Each transformation (width/quality/format) cached separately
- Default cache: Respects origin cache headers
- Can be purged via Cloudflare dashboard or API

**Requirements:**

- Custom domain (not `*.workers.dev`)
- Cloudflare Pro plan or higher
- Image Resizing enabled in dashboard

**Benefits over Vercel:**

- Can purge cache on-demand
- More data center locations
- No source image quota limits
- Works with any origin (not just Vercel)

### Comparison

| Feature            | Vercel                      | Cloudflare Images                 |
| ------------------ | --------------------------- | --------------------------------- |
| Cache locations    | Vercel Edge Network         | 200+ Cloudflare DCs               |
| Cache invalidation | ❌ No                       | ✅ Yes (API/Dashboard)            |
| Source image limit | 1,000 free, then $9/1,000   | ✅ Unlimited                      |
| Setup complexity   | ✅ Zero config              | Requires custom domain + Pro plan |
| Cost               | Free tier, then usage-based | Pro plan ($20/mo) + bandwidth     |
| Best for           | Vercel deployments          | Cloudflare Workers/Pages          |

### Cache Best Practices

1. **Set appropriate TTL** - Balance freshness vs bandwidth savings
2. **Use custom loader for external images** - Avoid double caching (origin CDN + optimization CDN)
3. **Enable `format=auto`** - Serves WebP/AVIF to supporting browsers
4. **Monitor cache hit ratio** - Check CDN analytics to ensure effective caching
5. **Consider cache warming** - Pre-generate common sizes for important images

```tsx
// Cache warming example (generate common sizes)
export const imageSizes = [640, 750, 828, 1080, 1920, 2048, 3840];

// In getStaticProps or API route
imageSizes.forEach((size) => {
  // Trigger image generation at build time
  fetch(
    `https://yourdomain.com/_next/image?url=${encodeURIComponent(imageUrl)}&w=${size}&q=75`
  );
});
```

## Blur Placeholders (LQIP)

**Low Quality Image Placeholder** - Shows blurred preview while full image loads.

### Static Images (Automatic)

```tsx
import photo from '@/public/photo.jpg';

<Image
  src={photo}
  alt="Photo"
  placeholder="blur" // ✅ Auto-generated at build time
/>;
```

### Remote Images (Manual Generation)

**Option 1: At build time (SSG)**

```typescript
// pages/gallery.tsx
import { GetStaticProps } from 'next';
import lqip from 'lqip-modern';

type Props = {
  image: {
    src: string;
    width: number;
    height: number;
    blurDataURL: string;
  };
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const imageUrl = 'https://images.unsplash.com/photo-123';

  // Fetch image data
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();

  // Generate LQIP
  const lqipData = await lqip(Buffer.from(arrayBuffer));

  return {
    props: {
      image: {
        src: imageUrl,
        width: lqipData.metadata.originalWidth,
        height: lqipData.metadata.originalHeight,
        blurDataURL: lqipData.metadata.dataURIBase64,
      },
    },
    revalidate: 86400, // Regenerate daily
  };
};

export default function Gallery({ image }: Props) {
  return (
    <Image
      src={image.src}
      alt="Gallery photo"
      width={image.width}
      height={image.height}
      placeholder="blur"
      blurDataURL={image.blurDataURL}
    />
  );
}
```

**Option 2: Store in database**

```typescript
// migrations/add-image-metadata.sql
ALTER TABLE posts ADD COLUMN image_width INTEGER;
ALTER TABLE posts ADD COLUMN image_height INTEGER;
ALTER TABLE posts ADD COLUMN image_blur_data_url TEXT;

// seed-script.ts (one-time generation)
import lqip from 'lqip-modern';

async function generateImageMetadata(imageUrl: string) {
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const lqipData = await lqip(Buffer.from(arrayBuffer));

  return {
    width: lqipData.metadata.originalWidth,
    height: lqipData.metadata.originalHeight,
    blurDataURL: lqipData.metadata.dataURIBase64,
  };
}

// Usage in component
<Image
  src={post.imageUrl}
  alt={post.title}
  width={post.imageWidth}
  height={post.imageHeight}
  placeholder="blur"
  blurDataURL={post.imageBlurDataUrl}
/>
```

**Option 3: Probe for dimensions only**

```typescript
// For when you only need width/height, not blur
import probe from 'probe-image-size';

const { width, height } = await probe(imageUrl);
```

**When to skip blur:**

- Small icons/thumbnails (<100px)
- Images that load instantly from CDN
- When build time matters more than UX

## Priority Loading

**Use for**: Above-the-fold images (LCP candidates)

```tsx
// Hero image - visible immediately on page load
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1920}
  height={1080}
  priority // ⚠️ Disables lazy loading, preloads image
  sizes="100vw"
/>
```

**Effect:**

- Adds `<link rel="preload">` in `<head>`
- Image loads immediately (no lazy loading)
- Improves LCP for critical images

**⚠️ Use sparingly**: Only for 1-2 images per page (hero, logo). Overuse negates benefits.

## Configuration (next.config.js)

```js
module.exports = {
  images: {
    // Allowed remote image domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**'
      }
    ],

    // Device sizes for srcset generation
    // These define breakpoints for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

    // Image sizes for smaller images (used when layout !== fill)
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Cache optimized images for 60 seconds (cannot be invalidated)
    minimumCacheTTL: 60,

    // Enable additional formats
    formats: ['image/webp', 'image/avif']

    // Custom loader (applies to all images)
    // loader: 'custom',
    // loaderFile: './utils/imageLoader.ts',
  }
};
```

**Key options:**

- **`deviceSizes`**: Breakpoints for `srcset` generation (default is usually fine)
- **`imageSizes`**: Additional smaller sizes for non-fill images
- **`formats`**: WebP always included, AVIF optional (smaller but slower to encode)
- **`minimumCacheTTL`**: How long optimized images are cached (cannot be purged)

## Common Patterns

### 1. Blog Post Hero

```tsx
<div className="relative aspect-[2/1] w-full">
  <Image
    src={post.heroImage}
    alt={post.title}
    fill
    className="object-cover"
    sizes="(max-width: 768px) 100vw, 1200px"
    priority
  />
</div>
```

### 2. User Avatar

```tsx
<div className="relative h-10 w-10 overflow-hidden rounded-full">
  <Image
    src={user.avatar}
    alt={`${user.name}'s avatar`}
    fill
    className="object-cover"
    sizes="40px"
  />
</div>
```

### 3. Product Grid

```tsx
<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
  {products.map((product) => (
    <div key={product.id} className="relative aspect-square">
      <Image
        src={product.image}
        alt={product.name}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
      />
    </div>
  ))}
</div>
```

### 4. Background Image

```tsx
<section className="relative min-h-screen">
  <Image
    src="/background.jpg"
    alt="Background pattern"
    fill
    className="-z-10 object-cover"
    sizes="100vw"
    quality={60} // Lower quality for backgrounds
  />
  <div className="relative z-10">{/* Content */}</div>
</section>
```

### 5. Lightbox/Modal

```tsx
function Modal({ image }: { image: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative h-[90vh] w-[90vw]">
        <Image
          src={image}
          alt="Full size image"
          fill
          className="object-contain"
          sizes="90vw"
          quality={90} // Higher quality for full-size viewing
        />
      </div>
    </div>
  );
}
```

## Advanced Real-World Patterns

### CMS Integration (WordPress/Headless CMS)

**Preferred approach**: Fetch images from CMS with metadata.

**Why CMS images are preferred:**

- CMS provides `width`, `height`, `altText` automatically
- No manual dimension measurement needed
- Centralized content management
- Easy updates without code changes
- Type-safe data with GraphQL/REST APIs
- Single source of truth for all content

**Pattern**: Use GraphQL fragments to fetch image metadata from CMS.

```typescript
// graphql.ts
import { graphql } from '@/server/graphql/__generated__';

export const ImageBlockFragment = graphql(`
  fragment ImageBlockFragment on ImageBlock {
    title
    intro
    className
    anchor
    image {
      sourceUrl
      altText
      mediaDetails {
        width
        height
      }
    }
  }
`);
```

```tsx
// ImageBlock.tsx
'use client';

import {
  getFragmentData,
  type FragmentType
} from '@/server/graphql/__generated__';
import Image from 'next/image';
import { ImageBlockFragment } from './graphql';

type Props = {
  imageFragment: FragmentType<typeof ImageBlockFragment>;
};

export default function ImageBlock({ imageFragment }: Props) {
  const block = getFragmentData(ImageBlockFragment, imageFragment);

  return (
    <div className="w-full">
      <Image
        src={block.image?.sourceUrl ?? ''}
        alt={block.image?.altText ?? 'image'}
        // ✅ PREFERRED: Use dimensions from CMS
        width={block.image?.mediaDetails?.width ?? 0}
        height={block.image?.mediaDetails?.height ?? 0}
        className="w-full object-contain"
      />
    </div>
  );
}
```

**Benefits:**

- Type-safe CMS integration
- Automatic width/height from CMS metadata
- Reusable GraphQL fragments
- Centralized image data
- No hardcoded dimensions

### When to Use CMS Dimensions vs Override

#### ✅ PREFERRED: Use CMS-provided dimensions (99% of cases)

```tsx
// Standard pattern - use what CMS provides
<Image
  src={cmsImage.sourceUrl}
  alt={cmsImage.altText}
  width={cmsImage.mediaDetails.width}
  height={cmsImage.mediaDetails.height}
/>
```

**Why this is preferred:**

1. **Correct aspect ratio** - CMS knows the actual image dimensions
2. **Prevents layout shift** - Browser reserves correct space
3. **No manual maintenance** - Dimensions update if image replaced in CMS
4. **Type-safe** - GraphQL ensures data structure
5. **Content editor friendly** - Non-technical users can manage images

#### ❌ Override dimensions (rare edge cases only)

**Edge case 1: Fixed aspect ratio requirement**

```tsx
// Only when design requires specific aspect ratio regardless of source
// Example: All product cards must be square
<div className="relative aspect-square w-full">
  <Image
    src={cmsImage.sourceUrl}
    alt={cmsImage.altText}
    fill
    className="object-cover"
    sizes="(max-width: 768px) 50vw, 33vw"
  />
</div>
```

**When to use:** Design system requires uniform aspect ratios (e.g., all avatars must be circular, all product cards square).

**Edge case 2: Responsive container sizing**

```tsx
// When image must fill container at all breakpoints
<div className="relative h-96 w-full">
  <Image
    src={cmsImage.sourceUrl}
    alt={cmsImage.altText}
    fill
    className="object-cover"
    sizes="100vw"
  />
</div>
```

**When to use:** Hero sections, full-width banners, background images where container dictates size.

**Edge case 3: Thumbnail generation**

```tsx
// Only when CMS doesn't provide thumbnail sizes
<Image
  src={cmsImage.sourceUrl}
  alt={cmsImage.altText}
  width={150} // Override for consistent thumbnail size
  height={150} // Override for consistent thumbnail size
  className="rounded-full object-cover"
/>
```

**When to use:** CMS provides only full-size images and you need consistent thumbnails. **Better solution:** Configure CMS to generate thumbnails.

#### Summary: CMS Dimensions Decision Tree

```
Do you have image from CMS?
├─ Yes → Does CMS provide width/height?
│  ├─ Yes → ✅ USE CMS DIMENSIONS (preferred)
│  │         width={cmsImage.width}
│  │         height={cmsImage.height}
│  │
│  └─ No → Does design require specific aspect ratio?
│     ├─ Yes → Use fill with container aspect ratio
│     │        <div className="aspect-square">
│     │          <Image fill ... />
│     │        </div>
│     │
│     └─ No → Fetch dimensions (probe-image-size)
│               Store in database for future use
│
└─ No (static/hardcoded) → Use static import or hardcode dimensions
                            import img from './image.jpg'
                            <Image src={img} ... />
```

**Rule of thumb:** If CMS provides dimensions, use them. Only override when design requirements conflict with source dimensions (rare).

### Hero with Priority & Quality Control

```tsx
type HeroBlockProps = {
  media?: { sourceUrl: string; altText?: string };
  title: string;
  layout: 'centered' | 'split';
};

export default function HeroBlock({ media, title, layout }: HeroBlockProps) {
  return (
    <div className="aspect-3/2 relative w-full scale-110">
      {media?.sourceUrl && (
        <Image
          src={media.sourceUrl}
          alt={media.altText ?? 'Hero Media'}
          fill
          priority // ⚠️ Above-the-fold LCP optimization
          className="object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 600px"
          quality={85} // Higher quality for hero images
        />
      )}
    </div>
  );
}
```

### Lazy Loading Below-the-Fold

```tsx
// Product grid - below fold, use lazy loading
export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <div key={product.id} className="relative aspect-square">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy" // ✅ Default behavior, explicit for clarity
            quality={75} // Standard quality for product images
          />
        </div>
      ))}
    </div>
  );
}
```

### Quality Tiers by Use Case

```tsx
// Hero/LCP images - highest quality
<Image src={hero} alt="Hero" quality={90} priority />

// Featured content - high quality
<Image src={featured} alt="Featured" quality={85} />

// Standard content - balanced
<Image src={content} alt="Content" quality={75} />

// Thumbnails/avatars - lower quality acceptable
<Image src={avatar} alt="Avatar" quality={70} />

// Backgrounds - lowest quality
<Image src={background} alt="" quality={60} className="-z-10" />
```

## Common Mistakes & How to Fix

### ❌ Missing width/height on remote images

```tsx
// ❌ WRONG: TypeScript error
<Image src="https://example.com/photo.jpg" alt="Photo" />

// ✅ CORRECT: Provide dimensions
<Image
  src="https://example.com/photo.jpg"
  alt="Photo"
  width={1920}
  height={1080}
/>
```

### ❌ Using Image for SVG icons

```tsx
// ❌ WRONG: Unnecessary optimization overhead
<Image src="/icons/check.svg" alt="Check" width={24} height={24} />;

// ✅ CORRECT: Use Icon component
// See: https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/icons.md
import IconCheck from '@/components/icons/IconCheck';
<IconCheck aria-hidden className="h-6 w-6" />;
```

### ❌ Missing sizes on responsive images

```tsx
// ❌ WRONG: Always loads largest image
<Image src={photo} alt="Photo" fill />

// ✅ CORRECT: Specify responsive sizes
<Image src={photo} alt="Photo" fill sizes="(max-width: 768px) 100vw, 50vw" />
```

### ❌ Not using custom loader for external services

```tsx
// ❌ COSTLY: Vercel optimizes Unsplash image (counts toward quota)
<Image
  src="https://images.unsplash.com/photo-123"
  alt="Photo"
  width={1920}
  height={1080}
/>

// ✅ CORRECT: Use custom loader
<Image
  src="https://images.unsplash.com/photo-123"
  alt="Photo"
  width={1920}
  height={1080}
  loader={unsplashLoader}
/>
```

### ❌ Forgetting to configure remotePatterns

```tsx
// Runtime error: Invalid src prop
<Image
  src="https://cdn.example.com/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
/>

// ✅ Add to next.config.js first
// images: { remotePatterns: [{ protocol: 'https', hostname: 'cdn.example.com' }] }
```

### ❌ Using priority on too many images

```tsx
// ❌ WRONG: Defeats lazy loading purpose
{
  images.map((img) => <Image src={img} alt="" priority />);
}

// ✅ CORRECT: Only for above-the-fold LCP image
<Image src={heroImage} alt="Hero" priority />;
{
  images.map((img) => <Image src={img} alt="" />);
}
```

## Best Practices Summary

### DO ✅

- Use `<Image>` for all photos and raster images
- Provide `width` and `height` for all remote images
- Add `sizes` prop for responsive images
- Use `placeholder="blur"` for better UX
- Use custom loaders for external optimization services (Cloudflare, Cloudinary)
- Set `priority` on above-the-fold images (hero, LCP candidates)
- Store image metadata (width/height/blurDataURL) in database or fetch from CMS
- Configure `remotePatterns` for external domains
- Use `fill` for container-sized images
- Adjust `quality` by use case (90 for hero, 75 standard, 60 backgrounds)
- Use `loading="lazy"` explicitly for below-the-fold images
- Implement environment-specific loaders (dev vs production)
- Fetch image dimensions from CMS metadata (GraphQL fragments)
- Handle null/missing images gracefully with early returns
- Set appropriate `sizes` for grid layouts (33vw for 3-column, etc.)
- Configure CDN caching with appropriate TTL values
- Monitor CDN cache hit ratios for optimization effectiveness
- Pre-optimize images with Squoosh.app before uploading to CMS or `/public`
- Use `t()` for internationalized alt text when applicable

### DON'T ❌

- Use `<Image>` for SVG icons (see `https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/icons.md`)
- Skip `width` and `height` on remote images
- Forget `sizes` on responsive layouts
- Use Vercel optimization for external service images without custom loader
- Set `priority` on multiple images (only 1-2 per page)
- Guess image dimensions (probe or store actual values)
- Use `unoptimized` unless absolutely necessary (Storybook/tests)
- Load images >5MB without optimization
- Skip `alt` text (accessibility requirement)
- Use same quality for all images (differentiate by importance)
- Hardcode dimensions when CMS provides metadata
- Forget to normalize src paths for custom loaders

## Production Checklist

- [ ] All remote image domains in `remotePatterns`
- [ ] Width and height provided for all remote images
- [ ] `sizes` prop on all responsive/fill images
- [ ] Custom loader configured for external services (Cloudflare/Cloudinary/etc.)
- [ ] Environment-specific loader logic (dev returns original, prod uses CDN)
- [ ] Blur placeholders for main content images
- [ ] `priority` on hero/LCP images only (max 1-2 per page)
- [ ] Proper `alt` text for accessibility (from CMS or hardcoded)
- [ ] Image metadata from CMS (GraphQL fragments with width/height)
- [ ] Quality tiers by use case (90 hero, 85 featured, 75 standard, 60 backgrounds)
- [ ] Null/missing image handling with early returns
- [ ] `loading="lazy"` on below-the-fold images
- [ ] CDN caching configured with appropriate `minimumCacheTTL`
- [ ] Cache hit ratio monitoring enabled (CDN analytics)
- [ ] Test on mobile/tablet devices (check Network tab for correct sizes)
- [ ] Verify Core Web Vitals (LCP < 2.5s, CLS < 0.1)
- [ ] Cloudflare Image Resizing enabled (if using Cloudflare loader)
- [ ] Custom domain configured for Cloudflare Images (not \*.workers.dev)
- [ ] Consider cache warming for critical images

## Troubleshooting

### Image not loading

1. Check `remotePatterns` configuration
2. Verify image URL is accessible (test in browser)
3. Check browser console for errors
4. Ensure Next.js server is running

### Poor performance

1. Add/fix `sizes` prop for responsive loading
2. Enable `placeholder="blur"`
3. Check if loading images larger than needed
4. Use custom loader if using external service
5. Set appropriate `quality` (default 75 is usually fine)

### Build errors with static imports

1. Ensure image is in `public/` or `src/` directory
2. Check file extension is supported (jpg, png, webp)
3. Verify import path is correct
4. Clear `.next` folder and rebuild

## Additional Resources

- Official docs: https://nextjs.org/docs/app/api-reference/components/image
- Image optimization: https://nextjs.org/docs/app/building-your-application/optimizing/images
- MDN Responsive images: https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images
- WebP format: https://developers.google.com/speed/webp
- Core Web Vitals: https://web.dev/vitals
- LQIP library: https://www.npmjs.com/package/lqip-modern
- Probe image size: https://www.npmjs.com/package/probe-image-size
- Cloudflare Images: https://developers.cloudflare.com/images/transform-images/
- Cloudflare + Next.js: https://developers.cloudflare.com/images/transform-images/integrate-with-frameworks/
- OpenNext Cloudflare: https://opennext.js.org/cloudflare/howtos/image
