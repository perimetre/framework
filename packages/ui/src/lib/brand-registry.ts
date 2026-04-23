/**
 * RSC-compatible brand registry.
 *
 * Concurrent server rendering (Next.js RSC, Cache Components, parallel
 * prerenders) runs many requests through the same JS module instance.
 * A plain module-level `activeBrand` variable races across those requests
 * and produces HTML whose Button/CVA classes don't match the body's
 * `data-pui-brand` attribute. To avoid that we keep the mutable brand
 * inside a `cache()`-scoped ref on the server (per-request) and a plain
 * module variable on the client (single-threaded per tab).
 *
 * Public API is unchanged — `setActiveBrand`/`getActiveBrand`/
 * `getBrandVariant` still work as before, they're just concurrency-safe.
 */

import { type Brand, BRANDS, DEFAULT_BRAND } from '@/brands';
import { cache } from 'react';

export type BrandVariants<T> = { acorn: T } & Partial<
  Record<Exclude<Brand, 'acorn'>, T>
>;

type BrandRef = { current: Brand };

const IS_SERVER = typeof window === 'undefined';

// Per-request ref on the server. React dedupes this call within a single
// request, so every caller in that render sees the same object.
const getServerBrandRef: () => BrandRef = cache(
  (): BrandRef => ({ current: DEFAULT_BRAND })
);

// Client bundle singleton. `cache()` is server-only (it throws when invoked
// from a client render), so on the client we keep the active brand in a
// plain module variable — safe because each tab is single-threaded.
let clientBrand: Brand = DEFAULT_BRAND;

/**
 * Get the currently active brand for this render.
 * Works in both Server and Client Components.
 */
export function getActiveBrand(): Brand {
  return IS_SERVER ? getServerBrandRef().current : clientBrand;
}

/**
 * Get the variant for the current active brand from a brand variants map.
 * Falls back to `acorn` if the active brand has no specific variant defined.
 */
export function getBrandVariant<T>(variants: BrandVariants<T>): T {
  const brand = getActiveBrand();
  const variant = (variants as Record<Brand, T | undefined>)[brand];
  return variant ?? variants.acorn;
}

/** Check if a brand is valid */
export function isValidBrand(brand?: string): brand is Brand {
  return !!brand && BRANDS.includes(brand as Brand);
}

/**
 * Set the active brand for this render/request.
 *
 * Call from the brand-scoped layout before rendering children. On the
 * server this scopes to the current request via `cache()`; on the client
 * this updates a module singleton.
 */
export function setActiveBrand(brand?: Brand) {
  const valid = isValidBrand(brand);
  const resolved: Brand = valid ? brand : DEFAULT_BRAND;
  if (!valid) {
    console.warn(
      `Unknown brand "${String(brand)}". Available brands: ${BRANDS.join(', ')}. Using default "${DEFAULT_BRAND}".`
    );
  }
  if (IS_SERVER) {
    const ref: BrandRef = getServerBrandRef();
    ref.current = resolved;
  } else {
    clientBrand = resolved;
  }
  return resolved;
}
