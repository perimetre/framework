import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import { imageCarouselControlsAcornVariants } from './ImageCarouselControls.acorn.brand';
import { imageCarouselControlsSprigVariants } from './ImageCarouselControls.sprig.brand';

export const imageCarouselControlsBrandVariants = {
  acorn: imageCarouselControlsAcornVariants,
  sprig: compose(
    imageCarouselControlsAcornVariants,
    imageCarouselControlsSprigVariants
  )
  // stelpro: compose(
  //   imageCarouselControlsAcornVariants,
  //   imageCarouselControlsStelproVariants
  // )
} as const satisfies BrandVariants<typeof imageCarouselControlsAcornVariants>;
