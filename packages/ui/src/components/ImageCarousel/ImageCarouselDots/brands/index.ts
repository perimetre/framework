import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import { imageCarouselDotAcornVariants } from './ImageCarouselDot.acorn.brand';
import { imageCarouselDotSprigVariants } from './ImageCarouselDot.sprig.brand';
import { imageCarouselDotStelproVariants } from './ImageCarouselDot.stelpro.brand';
import { imageCarouselDotsContainerAcornVariants } from './ImageCarouselDotsContainer.acorn.brand';

export const imageCarouselDotsContainerBrandVariants = {
  acorn: imageCarouselDotsContainerAcornVariants
  // sprig: compose(
  //   imageCarouselDotsContainerAcornVariants,
  //   imageCarouselDotsContainerSprigVariants
  // ),
  // stelpro: compose(
  //   imageCarouselDotsContainerAcornVariants,
  //   imageCarouselDotsContainerStelproVariants
  // )
} as const satisfies BrandVariants<
  typeof imageCarouselDotsContainerAcornVariants
>;

export const imageCarouselDotBrandVariants = {
  acorn: imageCarouselDotAcornVariants,
  sprig: compose(imageCarouselDotAcornVariants, imageCarouselDotSprigVariants),
  stelpro: compose(
    imageCarouselDotAcornVariants,
    imageCarouselDotStelproVariants
  )
} as const satisfies BrandVariants<typeof imageCarouselDotAcornVariants>;
