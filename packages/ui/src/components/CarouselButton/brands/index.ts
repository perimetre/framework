import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import { type VariantProps } from 'cva';
import { carouselButtonAcornVariants } from './CarouselButton.acorn.brand';
import { carouselButtonSprigVariants } from './CarouselButton.sprig.brand';
import { carouselButtonStelproVariants } from './CarouselButton.stelpro.brand';

export const carouselButtonBrandVariants = {
  acorn: carouselButtonAcornVariants,
  sprig: compose(carouselButtonAcornVariants, carouselButtonSprigVariants),
  stelpro: compose(carouselButtonAcornVariants, carouselButtonStelproVariants)
} as const satisfies BrandVariants<typeof carouselButtonAcornVariants>;

export type CarouselButtonVariantProps = VariantProps<
  typeof carouselButtonAcornVariants
>;
