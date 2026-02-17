import { BRANDS, DEFAULT_BRAND, type Brand } from '@/brands';
import { GoogleProvider } from '@/components/GoogleProvider';
import { setActiveBrand } from '@/lib/brand-registry';
import type { ArgTypes, GlobalProvider } from '@ladle/react';
import { domAnimation, LazyMotion } from 'motion/react';
import { useEffect } from 'react';

import '@/styles/ladle.css';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const BRAND_STORAGE_KEY = 'pui-ladle-brand';

/**
 * Reads the saved brand from localStorage.
 * Returns null if no valid brand is saved.
 */
function getSavedBrand(): Brand | null {
  const saved = localStorage.getItem(BRAND_STORAGE_KEY);
  if (saved && (BRANDS as readonly string[]).includes(saved)) {
    return saved as Brand;
  }
  return null;
}

/**
 * Intercept history.pushState/replaceState so that sidebar navigation
 * (which uses URLs like `?story=...` without control args) always carries
 * the persisted `arg-brand` parameter. Ladle's args-provider reads from
 * the URL on init, so this ensures the correct brand is picked up.
 *
 * For fresh page loads, a synchronous `<script>` in `<head>` (see config.mjs)
 * patches the URL before Ladle even mounts.
 */
function installBrandUrlPatch() {
  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  function patchUrl(
    url: null | string | undefined | URL
  ): null | string | undefined | URL {
    const saved = getSavedBrand();
    if (!saved || saved === DEFAULT_BRAND || !url) return url;

    try {
      const parsed = new URL(String(url), location.origin);
      if (!parsed.searchParams.has('arg-brand')) {
        parsed.searchParams.set('arg-brand', saved);
        return parsed.pathname + parsed.search;
      }
    } catch {
      // Not a parseable URL — return as-is
    }
    return url;
  }

  history.pushState = (
    data: unknown,
    unused: string,
    url?: null | string | URL
  ) => {
    originalPushState(data, unused, patchUrl(url));
  };

  history.replaceState = (
    data: unknown,
    unused: string,
    url?: null | string | URL
  ) => {
    originalReplaceState(data, unused, patchUrl(url));
  };

  return () => {
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
  };
}

/**
 * Global provider for Ladle that manages theme switching
 * Uses RSC-compatible brand registry (no React Context)
 *
 * Provides:
 * 1. LazyMotion for motion/react-m components (Drawer, etc.)
 * 2. data-pui-brand attribute (for CSS variables)
 * 3. Brand registry (for component variant selection)
 * 4. document.body brand attribute (for Radix Portal content)
 * 5. GoogleProvider when VITE_GOOGLE_MAPS_API_KEY is set (for Google Places stories)
 * 6. Brand persistence across story navigation via localStorage + URL interception
 */
export const Provider: GlobalProvider = ({ children, globalState }) => {
  const {
    control: { brand: brandControl }
  } = globalState;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const brandValue = brandControl?.value as Brand | undefined;

  // Derive the brand directly - no state needed
  const brand = brandValue ?? DEFAULT_BRAND;

  // Install the URL patch once on mount (handles sidebar navigation)
  useEffect(() => installBrandUrlPatch(), []);

  // Persist brand selection to localStorage when user changes it.
  // Skip saving the default brand — it's the fallback anyway, and saving it
  // would overwrite a non-default brand during transient control resets.
  useEffect(() => {
    if (!brandValue) return;
    if (brandValue === DEFAULT_BRAND) {
      localStorage.removeItem(BRAND_STORAGE_KEY);
    } else {
      localStorage.setItem(BRAND_STORAGE_KEY, brandValue);
    }
  }, [brandValue]);

  // Sync external systems: brand registry and document.body attribute
  useEffect(() => {
    setActiveBrand(brand);
    document.body.setAttribute('data-pui-brand', brand);
  }, [brand]);

  const content = (
    <LazyMotion features={domAnimation}>
      <div key={brand} data-pui-brand={brand}>
        {children}
      </div>
    </LazyMotion>
  );

  // Wrap with GoogleProvider when the API key is configured
  if (GOOGLE_MAPS_API_KEY) {
    return (
      <GoogleProvider apiKey={GOOGLE_MAPS_API_KEY}>{content}</GoogleProvider>
    );
  }

  return content;
};

export const argTypes = {
  brand: {
    name: 'Brand',
    description: 'Branded theme for components',
    options: BRANDS,
    defaultValue: DEFAULT_BRAND,
    control: { type: 'select' }
  }
} satisfies ArgTypes;
