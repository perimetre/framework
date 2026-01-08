import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import { imageCarouselControlsAcornVariants } from './ImageCarouselControls.acorn.brand';
import { imageCarouselNavButtonAcornVariants } from './ImageCarouselNavButton.acorn.brand';
import { imageCarouselNavButtonSprigVariants } from './ImageCarouselNavButton.sprig.brand';
import { imageCarouselNavButtonStelproVariants } from './ImageCarouselNavButton.stelpro.brand';

export const imageCarouselControlsBrandVariants = {
  acorn: imageCarouselControlsAcornVariants
  // sprig: compose(
  //   imageCarouselControlsAcornVariants,
  //   imageCarouselControlsSprigVariants
  // ),
  // stelpro: compose(
  //   imageCarouselControlsAcornVariants,
  //   imageCarouselControlsStelproVariants
  // )
} as const satisfies BrandVariants<typeof imageCarouselControlsAcornVariants>;

export const imageCarouselNavButtonBrandVariants = {
  acorn: imageCarouselNavButtonAcornVariants,
  sprig: compose(
    imageCarouselNavButtonAcornVariants,
    imageCarouselNavButtonSprigVariants
  ),
  stelpro: compose(
    imageCarouselNavButtonAcornVariants,
    imageCarouselNavButtonStelproVariants
  )
} as const satisfies BrandVariants<typeof imageCarouselNavButtonAcornVariants>;
