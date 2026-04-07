import { type BrandVariants } from '@/lib/brand-registry';
import { type VariantProps } from 'cva';
import { statItemAcornVariants } from './StatItem.acorn.brand';

export const statItemBrandVariants = {
  acorn: statItemAcornVariants
} as const satisfies BrandVariants<typeof statItemAcornVariants>;

export type StatItemVariantProps = VariantProps<typeof statItemAcornVariants>;
