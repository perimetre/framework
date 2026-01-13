// Re-export brand registry utilities
export {
  getActiveBrand,
  getBrandVariant,
  isValidBrand,
  setActiveBrand,
  type BrandVariants
} from './lib/brand-registry';

// Re-export brand constants and types
export { BRANDS, DEFAULT_BRAND, type Brand } from './brands';
