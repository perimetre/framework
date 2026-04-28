/**
 * Brand registry that's safe for concurrent server rendering AND for the
 * client-component SSR pass.
 *
 * Why not `react`'s `cache()` ref?
 *   - `cache()` only has a working scope inside an active React Server
 *     Component render. The SSR pass for client components — and module-load
 *     code — runs outside that scope, so `setActiveBrand` is silently dropped
 *     and `getActiveBrand` returns the default. This caused hydration
 *     mismatches: the RSC tree saw the brand, but the SSR'd HTML for client
 *     components rendered with the default brand and the client hydration
 *     used the real one.
 *
 * Why `AsyncLocalStorage`?
 *   - It propagates through the whole server request — RSC render, client
 *     component SSR, and any awaited code in between — so every render sees
 *     the same brand. It's also concurrency-safe across simultaneous
 *     requests, which is the property the `cache()` ref was added to provide.
 *
 * On the client we keep a plain module variable: each tab is single-threaded.
 */

import { type Brand, BRANDS, DEFAULT_BRAND } from '@/brands';
import { AsyncLocalStorage } from 'node:async_hooks';

export type BrandVariants<T> = { acorn: T } & Partial<
  Record<Exclude<Brand, 'acorn'>, T>
>;

const IS_SERVER = typeof window === 'undefined';

type BrandStore = { current: Brand };

// One ALS instance per server module instance. Each request enters its own
// store via `setActiveBrand`, so concurrent requests don't see each other.
const serverStorage: AsyncLocalStorage<BrandStore> | null = IS_SERVER
  ? new AsyncLocalStorage<BrandStore>()
  : null;

// Fallback for code that runs before any `setActiveBrand` enters a store
// (module-load on the server, or a request that never set a brand).
let serverFallbackBrand: Brand = DEFAULT_BRAND;

let clientBrand: Brand = DEFAULT_BRAND;

/**
 * Get the currently active brand for this render.
 * Works in both Server and Client Components.
 */
export function getActiveBrand(): Brand {
  if (!IS_SERVER) return clientBrand;
  return serverStorage?.getStore()?.current ?? serverFallbackBrand;
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
 * Server: writes into the current AsyncLocalStorage store, or — if there is
 * no store yet for this request — enters a new one so subsequent renders in
 * the same async context observe the brand. Also updates a module-level
 * fallback so module-load callers (which run outside any request) don't
 * silently get the default.
 *
 * Client: updates a module singleton.
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
    serverFallbackBrand = resolved;
    const existing = serverStorage?.getStore();
    if (existing) {
      existing.current = resolved;
    } else {
      // Enter a store for the rest of this async context. Synchronous code
      // immediately after this call will observe the new brand; awaited
      // code propagates the store automatically.
      serverStorage?.enterWith({ current: resolved });
    }
  } else {
    clientBrand = resolved;
  }
  return resolved;
}
