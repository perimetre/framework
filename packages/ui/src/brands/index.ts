export type Brand = (typeof BRANDS)[number];
export const DEFAULT_BRAND: Brand = 'acorn';
export const BRANDS = ['acorn', 'sprig', 'stelpro', 'cima'] as const;
