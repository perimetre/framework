import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import { type VariantProps } from 'cva';
import { fieldBaseSelectAcornVariants } from './FieldBaseSelect.acorn.brand';
import { fieldBaseSelectSprigVariants } from './FieldBaseSelect.sprig.brand';
import { fieldBaseSelectStelproVariants } from './FieldBaseSelect.stelpro.brand';

export const fieldBaseSelectBrandVariants = {
  acorn: fieldBaseSelectAcornVariants,
  sprig: compose(fieldBaseSelectAcornVariants, fieldBaseSelectSprigVariants),
  stelpro: compose(fieldBaseSelectAcornVariants, fieldBaseSelectStelproVariants)
} as const satisfies BrandVariants<typeof fieldBaseSelectAcornVariants>;

export type FieldBaseSelectVariantProps = VariantProps<
  typeof fieldBaseSelectAcornVariants
>;
