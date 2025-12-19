/**
 * RSC-Compatible Brand Registry
 *
 * Module-level brand registry that works in both Server and Client Components.
 * No React Context needed - brand is set at app initialization or per-request.
 *
 * Usage:
 * 1. Call setActiveBrand('sprig') at app initialization
 * 2. Components use getActiveBrand() to get the current brand
 * 3. Use getBrandVariant() to get the correct variant for a component
 */

import { type Brand, BRANDS, DEFAULT_BRAND } from '@/brands';

// Supported brands - add new brands here

/**
 * Type helper for brand variant maps.
 * Requires 'acorn' (base) variant, other brands are optional.
 * Keys are fully typed to existing brands - typos will cause compile errors.
 * @example
 * // All brands defined
 * const buttonBrandVariants: BrandVariants<typeof buttonAcornVariants> = {
 *   acorn: buttonAcornVariants,
 *   sprig: compose(buttonAcornVariants, buttonSprigVariants),
 *   stelpro: compose(buttonAcornVariants, buttonStelproVariants),
 * };
 * @example
 * // Only acorn (no brand-specific overrides)
 * const iconBrandVariants: BrandVariants<typeof iconAcornVariants> = {
 *   acorn: iconAcornVariants,
 * };
 */
export type BrandVariants<T> = { acorn: T } & Partial<
  Record<Exclude<Brand, 'acorn'>, T>
>;

// Module-level state (works in both server and client)
let activeBrand: Brand = DEFAULT_BRAND;

/**
 * Get the currently active brand
 * Works in both Server and Client Components
 */
export function getActiveBrand(): Brand {
  return activeBrand;
}

/**
 * Get the variant for the current active brand from a brand variants map.
 * Falls back to 'acorn' if the active brand has no specific variant defined.
 * @example
 * const buttonBrandVariants: BrandVariants<typeof buttonAcornVariants> = {
 *   acorn: buttonAcornVariants,
 *   sprig: compose(buttonAcornVariants, buttonSprigVariants),
 *   // stelpro not defined - will fallback to acorn
 * };
 *
 * const currentVariant = getBrandVariant(buttonBrandVariants);
 */
export function getBrandVariant<T>(variants: BrandVariants<T>): T {
  const brand = getActiveBrand();

  // Type assertion needed because brand could be a key that's optional in the Partial
  const variant = (variants as Record<Brand, T | undefined>)[brand];

  // Fallback to acorn if the brand doesn't have a specific variant
  return variant ?? variants.acorn;
}

/** Check if a brand is valid */
export function isValidBrand(brand?: string): brand is Brand {
  return !!brand && BRANDS.includes(brand as Brand);
}

/**
 * Set the active brand
 * Call this at app initialization or when switching brands
 * @example
 * // In your app's root layout or initialization
 * setActiveBrand('sprig');
 *
 * // In a brand switcher component
 * setActiveBrand(selectedBrand);
 */
export function setActiveBrand(brand?: Brand) {
  if (!isValidBrand(brand)) {
    console.warn(
      `Unknown brand "${String(brand)}". Available brands: ${BRANDS.join(', ')}. Using default "${DEFAULT_BRAND}".`
    );
    activeBrand = DEFAULT_BRAND;
    return activeBrand;
  }
  activeBrand = brand;
  return activeBrand;
}
