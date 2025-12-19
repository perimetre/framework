import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import { type VariantProps } from 'cva';
import { buttonAcornVariants } from './Button.acorn.brand';
import { buttonSprigVariants } from './Button.sprig.brand';
import { buttonStelproVariants } from './Button.stelpro.brand';

export const buttonBrandVariants = {
  acorn: buttonAcornVariants,
  sprig: compose(buttonAcornVariants, buttonSprigVariants),
  stelpro: compose(buttonAcornVariants, buttonStelproVariants)
} as const satisfies BrandVariants<typeof buttonAcornVariants>;

export type ButtonVariantProps = VariantProps<typeof buttonAcornVariants>;
