import { type BrandVariants } from '@/lib/brand-registry';
import { type VariantProps } from 'cva';
import { tagAcornVariants } from './Tag.acorn.brand';

/**
 * Tag brand variants registry.
 *
 * Every brand is fully token-driven (tag-* colors + badge radius), so no brand
 * needs its own class-level override — each falls back to the Acorn base via
 * `getBrandVariant`, picking up its own token values automatically.
 */
export const tagBrandVariants = {
  acorn: tagAcornVariants
} as const satisfies BrandVariants<typeof tagAcornVariants>;

export type TagVariantProps = VariantProps<typeof tagAcornVariants>;
