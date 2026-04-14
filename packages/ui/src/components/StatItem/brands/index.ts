import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import { type VariantProps } from 'cva';
import { statItemAcornVariants } from './StatItem.acorn.brand';
import { statItemMicrobirdVariants } from './StatItem.microbird.brand';

export const statItemBrandVariants = {
  acorn: statItemAcornVariants,
  'microbird-commercial': compose(
    statItemAcornVariants,
    statItemMicrobirdVariants
  ),
  'microbird-school': compose(statItemAcornVariants, statItemMicrobirdVariants)
} as const satisfies BrandVariants<typeof statItemAcornVariants>;

export type StatItemVariantProps = VariantProps<typeof statItemAcornVariants>;
