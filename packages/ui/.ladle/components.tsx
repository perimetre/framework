import { BRANDS, DEFAULT_BRAND, type Brand } from '@/brands';
import { setActiveBrand } from '@/lib/brand-registry';
import type { ArgTypes, GlobalProvider } from '@ladle/react';
import { useEffect, useState } from 'react';

import '@/styles/ladle.css';

/**
 * Global provider for Ladle that manages theme switching
 * Uses RSC-compatible brand registry (no React Context)
 *
 * Syncs:
 * 1. data-pui-brand attribute (for CSS variables)
 * 2. Brand registry (for component variant selection)
 */
export const Provider: GlobalProvider = ({ children, globalState }) => {
  const {
    control: { brand: brandControl }
  } = globalState;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const brandValue = brandControl?.value as Brand | undefined;

  const [brand, setBrand] = useState(() => setActiveBrand(brandValue));

  // Sync brand registry with the selected brand
  useEffect(() => {
    setBrand(setActiveBrand(brandValue));
  }, [brandValue]);

  return (
    <div key={brand} data-pui-brand={brand}>
      {children}
    </div>
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
