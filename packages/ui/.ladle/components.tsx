import { BRANDS, DEFAULT_BRAND, type Brand } from '@/brands';
import { setActiveBrand } from '@/lib/brand-registry';
import type { ArgTypes, GlobalProvider } from '@ladle/react';
import { domAnimation, LazyMotion } from 'motion/react';
import { useEffect } from 'react';

import '@/styles/ladle.css';

/**
 * Global provider for Ladle that manages theme switching
 * Uses RSC-compatible brand registry (no React Context)
 *
 * Provides:
 * 1. LazyMotion for motion/react-m components (Drawer, etc.)
 * 2. data-pui-brand attribute (for CSS variables)
 * 3. Brand registry (for component variant selection)
 * 4. document.body brand attribute (for Radix Portal content)
 */
export const Provider: GlobalProvider = ({ children, globalState }) => {
  const {
    control: { brand: brandControl }
  } = globalState;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const brandValue = brandControl?.value as Brand | undefined;

  // Derive the brand directly - no state needed
  const brand = brandValue ?? DEFAULT_BRAND;

  // Sync external systems: brand registry and document.body attribute
  useEffect(() => {
    setActiveBrand(brand);
    document.body.setAttribute('data-pui-brand', brand);
  }, [brand]);

  return (
    <LazyMotion features={domAnimation}>
      <div key={brand} data-pui-brand={brand}>
        {children}
      </div>
    </LazyMotion>
  );
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
