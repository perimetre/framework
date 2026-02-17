import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import { type VariantProps } from 'cva';
import { alertBarAcornVariants } from './AlertBar.acorn.brand';
import { alertBarSprigVariants } from './AlertBar.sprig.brand';
import { alertBarStelproVariants } from './AlertBar.stelpro.brand';

export const alertBarBrandVariants = {
  acorn: alertBarAcornVariants,
  sprig: compose(alertBarAcornVariants, alertBarSprigVariants),
  stelpro: compose(alertBarAcornVariants, alertBarStelproVariants)
} as const satisfies BrandVariants<typeof alertBarAcornVariants>;

export type AlertBarVariantProps = VariantProps<typeof alertBarAcornVariants>;
