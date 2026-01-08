import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import { type VariantProps } from 'cva';
import { badgeAcornVariants } from './Badge.acorn.brand';
import { badgeSprigVariants } from './Badge.sprig.brand';
import { badgeStelproVariants } from './Badge.stelpro.brand';

export const badgeBrandVariants = {
  acorn: badgeAcornVariants,
  sprig: compose(badgeAcornVariants, badgeSprigVariants),
  stelpro: compose(badgeAcornVariants, badgeStelproVariants)
} as const satisfies BrandVariants<typeof badgeAcornVariants>;

export type BadgeVariantProps = VariantProps<typeof badgeAcornVariants>;
